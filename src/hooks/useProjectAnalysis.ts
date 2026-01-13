/**
 * 프로젝트 레벨 분석 훅 (SSE 방식)
 *
 * 에디터/월드 페이지 진입 시 버퍼 및 분석 상태를 관리합니다.
 * 분석 요청을 보내고, SSE를 통해 상태를 실시간으로 수신합니다.
 */

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  startTransition,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAnalysisBufferStore } from "@/stores/useAnalysisBufferStore";
import { aiService } from "@/services/aiService";
import { imageService } from "@/services/imageService";
import type { AnalysisResultData, ConsistencyReport } from "@/types";
import { useJobSSE } from "./useJobSSE";
import { characterKeys } from "./useCharacters";

// Constants
// STUCK_TIMEOUT_MS removed (unused)

interface UseProjectAnalysisOptions {
  enabled?: boolean;
  onAnalysisComplete?: (result: AnalysisResultData | null) => void;
  onAnalysisError?: (error: string) => void;
}

interface UseProjectAnalysisReturn {
  isAnalyzing: boolean;
  analysisProgress: number;
  analysisError: string | null;
  triggerAnalysis: () => Promise<void>;
  flushAndAnalyze: () => Promise<void>;
  resetAnalysis: () => void;
  lastConsistencyReport: ConsistencyReport | null;
  isStuck: boolean;
  currentJobType: "analysis" | "image" | null;
}

export function useProjectAnalysis(
  projectId: string | null,
  options: UseProjectAnalysisOptions = {},
): UseProjectAnalysisReturn {
  const { enabled = true, onAnalysisComplete, onAnalysisError } = options;
  const queryClient = useQueryClient();

  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isStuck, setIsStuck] = useState(false);

  // Callbacks refs (to avoid effect re-runs)
  const onCompleteRef = useRef(onAnalysisComplete);
  const onErrorRef = useRef(onAnalysisError);

  // Stuck detection logic
  const lastProgressRef = useRef<number>(-1);
  const lastProgressUpdateRef = useRef<number>(0);

  useEffect(() => {
    onCompleteRef.current = onAnalysisComplete;
    onErrorRef.current = onAnalysisError;
    // Purity fix: initialize lastProgressUpdateRef in effect
    lastProgressUpdateRef.current = Date.now();
  }, [onAnalysisComplete, onAnalysisError]);

  // 버퍼 스토어 (Global State)
  const setProjectId = useAnalysisBufferStore((state) => state.setProjectId);
  const shouldAutoFlush = useAnalysisBufferStore(
    (state) => state.shouldAutoFlush,
  );
  const setBufferAnalyzing = useAnalysisBufferStore(
    (state) => state.setAnalyzing,
  );
  const getBufferSummary = useAnalysisBufferStore(
    (state) => state.getBufferSummary,
  );
  const currentJobId = useAnalysisBufferStore((state) => state.currentJobId);
  const currentJobType = useAnalysisBufferStore(
    (state) => state.currentJobType,
  );
  // setJobId removed (unused)
  const setGlobalProgress = useAnalysisBufferStore(
    (state) => state.setProgress,
  );
  const setLastAnalyzedHashes = useAnalysisBufferStore(
    (state) => state.setLastAnalyzedHashes,
  );
  const isAnalyzing = useAnalysisBufferStore((state) => state.isAnalyzing);
  const resetAnalysis = useAnalysisBufferStore((state) => state.resetAnalysis);
  const lastConsistencyReport = useAnalysisBufferStore(
    (state) => state.lastConsistencyReport,
  );
  const activeJobs = useAnalysisBufferStore((state) => state.activeJobs);
  const addStoreJobId = useAnalysisBufferStore((state) => state.addJobId);
  const removeStoreJobId = useAnalysisBufferStore((state) => state.removeJobId);
  const clearStoreJobs = useAnalysisBufferStore((state) => state.clearJobs);

  const [jobProgresses, setJobProgresses] = useState<Record<string, number>>(
    {},
  );
  const lastResultRef = useRef<AnalysisResultData | null>(null);

  // API 요청 중 상태 (ActiveJobs가 아직 업데이트되지 않은 타이밍 방어)
  const isRequestingRef = useRef(false);
  // 분석 완료 처리 중 상태 (중복 처리 방어)
  const isFinalizingRef = useRef(false);

  // 재분석 트리거 ref (순환 의존성 방지)
  const triggerReanalysisRef = useRef<(() => Promise<void>) | null>(null);
  const lastKnownJobTypeRef = useRef<"analysis" | "image" | null>(null);
  const lastKnownTargetIdRef = useRef<string | null>(null);
  const isMountedRef = useRef(true);
  const finalizeAnalysisRef = useRef<(() => void) | null>(null);

  // Lifecycle tracking
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Sync refs with store state
  useEffect(() => {
    if (currentJobType) {
      lastKnownJobTypeRef.current = currentJobType;
      lastKnownTargetIdRef.current =
        useAnalysisBufferStore.getState().currentJobTargetId;
    }
  }, [currentJobType]);

  // Finalize Analysis (Shared logic for all completion paths)
  const finalizeAnalysis = useCallback(() => {
    // Check if component is still mounted
    if (!isMountedRef.current) {
      return;
    }
    if (isRequestingRef.current) {
      return;
    }
    if (isFinalizingRef.current) {
      return;
    }

    isFinalizingRef.current = true;

    // Get current state to check job type (fallback to refs if store was just cleared)
    const { pendingDocuments } = useAnalysisBufferStore.getState();
    const activeType =
      useAnalysisBufferStore.getState().currentJobType ||
      lastKnownJobTypeRef.current;
    const activeTargetId =
      useAnalysisBufferStore.getState().currentJobTargetId ||
      lastKnownTargetIdRef.current;

    // 1. Analysis-specific state sync
    if (activeType === "analysis") {
      // Sync hashes (분석 완료된 문서들)
      setLastAnalyzedHashes(pendingDocuments);

      // pendingDocuments 클리어
      useAnalysisBufferStore.getState().clearPendingDocuments();
    }

    // 2. Cache Invalidation (Common or specific)
    if (projectId) {
      // Always invalidate character list as both jobs might affect it
      queryClient.invalidateQueries({
        queryKey: characterKeys.list(projectId),
      });

      if (activeType === "image" && activeTargetId) {
        // Also invalidate detail query for the specific character
        queryClient.invalidateQueries({
          queryKey: characterKeys.detail(activeTargetId),
        });
      }
    }

    // 3. Trigger completion callback
    onCompleteRef.current?.(lastResultRef.current);
    if (lastResultRef.current?.consistencyReport) {
      useAnalysisBufferStore
        .getState()
        .setLastConsistencyReport(lastResultRef.current.consistencyReport);
    }
    lastResultRef.current = null;
    lastKnownJobTypeRef.current = null;
    lastKnownTargetIdRef.current = null;

    // Clear jobs
    if (projectId) {
      clearStoreJobs(projectId);
    }

    // 버퍼에 새로운 변경이 있는지 체크
    const hasMoreChanges = useAnalysisBufferStore
      .getState()
      .hasUnanalyzedChanges();

    if (hasMoreChanges) {
      // 재분석 시에는 finalizing 플래그를 해제해야 함
      isFinalizingRef.current = false;
      window.setTimeout(() => {
        triggerReanalysisRef.current?.();
      }, 100);
    } else {
      // 모든 분석 완료
      setBufferAnalyzing(false);
      setAnalysisProgress(100);
      setGlobalProgress(100);

      // 완료 처리 끝났으므로 플래그 리셋 (다음 분석을 위해)
      isFinalizingRef.current = false;
    }
  }, [
    projectId,
    queryClient,
    setBufferAnalyzing,
    setGlobalProgress,
    setLastAnalyzedHashes,
    clearStoreJobs,
  ]);

  // 프로젝트 ID 설정
  useEffect(() => {
    if (projectId) {
      setProjectId(projectId);
    }
  }, [projectId, setProjectId]);

  // 프로젝트 초기 로드 시 백엔드에서 job 상태 확인
  useEffect(() => {
    if (!projectId || !enabled) return;

    const checkProjectJobStatus = async () => {
      try {
        const jobStatus = await aiService.getProjectAnalysisJob(projectId);

        // 진행 중인 job이 있으면 SSE 연결

        // 진행 중인 job이 있으면 SSE 연결을 위해 스토어에 추가
        // 진행 중인 job이 있으면 SSE 연결을 위해 스토어에 추가
        if (
          jobStatus.jobId &&
          (jobStatus.status === "processing" || jobStatus.status === "pending")
        ) {
          // Check for staleness to avoid zombie jobs
          // PENDING jobs > 1 min old are considered stale (backend should have picked them up by now)
          // PROCESSING jobs > 30 mins old are considered stuck/stale
          const statusAny = jobStatus as unknown as Record<string, unknown>;
          const timestampStr = (statusAny.updatedAt ||
            statusAny.createdAt) as string;
          const timestamp = timestampStr
            ? new Date(timestampStr).getTime()
            : Date.now();
          const now = Date.now();
          const elapsed = now - timestamp;

          const isPendingStale =
            jobStatus.status === "pending" && elapsed > 1 * 60 * 1000; // 1 min (aggressively ignore pending zombies)
          const isProcessingStale =
            jobStatus.status === "processing" && elapsed > 30 * 60 * 1000; // 30 min

          if (isPendingStale || isProcessingStale) {
            // 오래된(Stuck) 작업은 유령 작업으로 간주하여 제거
            clearStoreJobs(projectId);
          } else {
            addStoreJobId(projectId, jobStatus.jobId, "analysis");
            setJobProgresses((prev) => ({
              ...prev,
              [jobStatus.jobId!]: jobStatus.progress || 0,
            }));
          }
        }
        // 완료된 상태면 캐릭터/관계 쿼리 무효화 (DB에서 최신 데이터 fetch)
        else if (
          jobStatus.status === "failed" ||
          jobStatus.status === "completed"
        ) {
          // 서버가 명시적으로 "완료됨" 혹은 "실패함"이라고 응답하면,
          // 클라이언트가 알고 있는 모든 진행 중 작업을 정리합니다. (Ghost Job 방지)
          clearStoreJobs(projectId);
        }
      } catch (error) {
        // API가 404라면 해당 프로젝트에 진행 중인 Job이 없다는 뜻이므로 로컬 상태도 클리어
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const status = (error as any)?.response?.status;
        if (status === 404) {
          clearStoreJobs(projectId);
        }
      }
    };

    checkProjectJobStatus();
  }, [
    projectId,
    enabled,
    addStoreJobId,
    clearStoreJobs,
    finalizeAnalysis, // Added finalizeAnalysis to dependencies
  ]);

  // Note: SSE connection is managed by useJobSSE hook, so cleanup is handled there.

  // Job Status Tracking via Project SSE
  const {
    jobStatus: _lastJobStatus,
    progress: _lastJobProgress,
    isConnected,
  } = useJobSSE<AnalysisResultData>(
    projectId,
    aiService.getProjectStatusStreamUrl,
    {
      enabled: !!projectId && activeJobs[projectId]?.length > 0,
      onMessage: (data) => {
        // SSE 이벤트 파싱
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const event = data as any;
        if (!event) return;

        // jobId가 직접 있거나 result 내부에 있을 수 있음
        const eventJobId = event.jobId || event.id;
        if (!eventJobId) return;

        const rawType = event.type || event.status;
        const eventType =
          typeof rawType === "string" ? rawType.toLowerCase() : "";
        const currentProgress = event.percent || event.progress || 0;

        if (eventType === "progress" || eventType === "processing") {
          setJobProgresses((prev) => ({
            ...prev,
            [eventJobId]: currentProgress,
          }));

          // Progress가 100%에 도달하면 즉시 완료 처리
          if (currentProgress >= 100) {
            if (event.result) {
              lastResultRef.current = event.result as AnalysisResultData;
            }
            setJobProgresses((prev) => ({ ...prev, [eventJobId]: 100 }));
            if (projectId) {
              removeStoreJobId(projectId, eventJobId);
            }
          }
        } else if (
          eventType === "completed" ||
          eventType === "success" ||
          eventType === "done"
        ) {
          if (event.result) {
            lastResultRef.current = event.result as AnalysisResultData;
          }
          setJobProgresses((prev) => ({ ...prev, [eventJobId]: 100 }));
          if (projectId) {
            removeStoreJobId(projectId, eventJobId);
          }
        } else if (eventType === "failed" || eventType === "error") {
          if (projectId) removeStoreJobId(projectId, eventJobId);
        }
      },
      onError: (err) => {
        setAnalysisError(err);
        setBufferAnalyzing(false);
        onErrorRef.current?.(err);
      },
    },
  );

  // 전역 진행률 계산
  useEffect(() => {
    // Calculate total progress and current active job IDs
    const currentActiveJobIds = projectId ? activeJobs[projectId] || [] : [];
    const totalProgress = currentActiveJobIds.reduce(
      (sum, jobId) => sum + (jobProgresses[jobId] || 0),
      0,
    );

    if (currentActiveJobIds.length === 0) {
      if (isAnalyzing && !isRequestingRef.current) {
        startTransition(() => {
          finalizeAnalysis();
        });
      }
      return;
    }

    const averageProgress =
      currentActiveJobIds.length > 0
        ? Math.round(totalProgress / currentActiveJobIds.length)
        : 100;

    // Avoid synchronous state update in effect
    setTimeout(() => {
      setAnalysisProgress(averageProgress);
      setGlobalProgress(averageProgress);
    }, 0);

    // Update progress tracking refs
    if (averageProgress >= 100 && isAnalyzing) {
      if (lastProgressRef.current !== averageProgress) {
        lastProgressRef.current = averageProgress;
        lastProgressUpdateRef.current = Date.now();
      }
    } else {
      lastProgressRef.current = averageProgress;
      lastProgressUpdateRef.current = Date.now();
      if (isStuck) {
        startTransition(() => setIsStuck(false));
      }
    }
  }, [
    jobProgresses,
    activeJobs,
    projectId,
    isAnalyzing,
    setGlobalProgress,
    setBufferAnalyzing,
    isStuck,
    clearStoreJobs,
    queryClient,
    setLastAnalyzedHashes,
    finalizeAnalysis,
  ]);

  // [Stuck Mitigation Timer]
  // 100% 도달 후 3초가 지나도 완료되지 않으면 강제로 완료 처리
  useEffect(() => {
    const currentActiveJobIds = projectId ? activeJobs[projectId] || [] : [];

    if (
      analysisProgress >= 100 &&
      isAnalyzing &&
      currentActiveJobIds.length > 0 &&
      !isRequestingRef.current &&
      !isFinalizingRef.current
    ) {
      const timerId = setTimeout(() => {
        // Use ref to avoid dependency on finalizeAnalysis
        if (finalizeAnalysisRef.current && isMountedRef.current) {
          startTransition(() => {
            finalizeAnalysisRef.current?.();
            setIsStuck(true);
          });
        }
      }, 3000); // 3초 후 자동 완료

      return () => clearTimeout(timerId);
    }
  }, [analysisProgress, isAnalyzing, activeJobs, projectId]);

  // Project Stream 이벤트 처리 (jobId별 분기)
  const queryClientRef = useRef(queryClient);
  useEffect(() => {
    queryClientRef.current = queryClient;
  }, [queryClient]);

  useEffect(() => {
    if (!projectId || !isConnected) return;

    // useJobSSE가 내부적으로 message 리스너를 달고 있지만
    // 우리는 이곳에서 별도의 로직을 수행하거나 useJobSSE를 확장할 수 있음
    // 현재 구현에서는 useJobSSE가 generic message를 처리하므로,
    // 개별 job의 진행률을 업데이트하기 위해 전역 이벤트를 수신하는 방식을 고려하거나
    // useJobSSE의 이벤트를 기반으로 로컬 상태를 업데이트함
  }, [
    projectId,
    isConnected,
    activeJobs,
    addStoreJobId,
    removeStoreJobId,
    queryClient,
  ]);

  // Sync - 이 부분은 useJobSSE가 단일 작업용이라 프로젝트 스트림에서는 로직이 달라져야 함
  // 일단은 polling fallback이 작동하도록 유지하거나, SSE 리스너를 직접 관리

  // Project Status SSE (Optional/Leftover) - Commented out to prefer Job Stream
  /*
  useEffect(() => {
    // ... manual SSE code removed ...
  }, []);
  */

  // 분석 트리거 (변경된 문서만 분석)
  const triggerAnalysis = useCallback(async () => {
    if (!projectId) {
      return;
    }

    const store = useAnalysisBufferStore.getState();

    // 변경된 문서만 추출 (이미 분석 중인 문서는 제외)
    const changedDocuments = store.getChangedDocuments();

    if (changedDocuments.length === 0) {
      return;
    }

    // 분석 상태 시작
    isRequestingRef.current = true;
    isFinalizingRef.current = false; // Reset finalizing flag
    setBufferAnalyzing(true);
    setAnalysisError(null);
    if (!isAnalyzing) {
      setAnalysisProgress(0);
    }

    // 분석 요청할 문서들의 해시 계산 및 pendingDocuments에 추가
    const newPendingHashes: Record<string, string> = {};
    changedDocuments.forEach((chunk) => {
      const hash = aiService.calculateContentHash(chunk.content);
      newPendingHashes[chunk.documentId] = hash;
    });

    // pendingDocuments에 추가 (분석 완료 전까지 중복 요청 방지)
    store.setPendingDocuments(newPendingHashes);

    // 각 문서에 대해 분석 요청
    const errors: string[] = [];

    for (const chunk of changedDocuments) {
      try {
        const response = await aiService.analyzeStory({
          projectId,
          documentId: chunk.documentId,
          content: chunk.content,
          analysisType: "partial_snippet",
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const resData = response as any;
        const actualData = resData.data || resData;
        const jobId =
          actualData?.jobId || actualData?.documentId || actualData?.id;

        if (jobId) {
          addStoreJobId(projectId, jobId);
          setJobProgresses((prev) => ({ ...prev, [jobId]: 0 }));
        }
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "Analysis request failed";
        console.error(
          `Failed to analyze document ${chunk.documentId}:`,
          errorMsg,
        );
        errors.push(errorMsg);

        // 실패 시 해당 문서만 pendingDocuments에서 제거
        const currentPending =
          useAnalysisBufferStore.getState().pendingDocuments;
        const remainingPending = { ...currentPending };
        delete remainingPending[chunk.documentId];
        useAnalysisBufferStore.setState({ pendingDocuments: remainingPending });
      }
    }

    if (errors.length > 0) {
      const combinedError = `Failed to analyze ${errors.length} documents. Last error: ${errors[errors.length - 1]}`;
      setAnalysisError(combinedError);
      onErrorRef.current?.(combinedError);

      if (!isAnalyzing && changedDocuments.length === errors.length) {
        // 모든 요청이 실패했을 경우에만 분석 상태 해제
        setBufferAnalyzing(false);
      }
    }

    isRequestingRef.current = false;
  }, [projectId, isAnalyzing, setBufferAnalyzing, addStoreJobId]);

  // Flush and analyze (강제 실행)
  const flushAndAnalyze = useCallback(async () => {
    const summary = getBufferSummary();
    if (summary.charCount > 0) {
      await triggerAnalysis();
    }
  }, [getBufferSummary, triggerAnalysis]);

  // triggerReanalysisRef 업데이트 (finalizeAnalysis에서 사용)
  useEffect(() => {
    triggerReanalysisRef.current = triggerAnalysis;
  }, [triggerAnalysis]);

  // finalizeAnalysisRef 업데이트 (타이머에서 사용)
  useEffect(() => {
    finalizeAnalysisRef.current = finalizeAnalysis;
  }, [finalizeAnalysis]);

  // 자동 flush 체크 (주기적)
  useEffect(() => {
    if (!projectId || !enabled) return;

    // const checkAutoFlush = () => {
    //   if (shouldAutoFlush()) {
    //     triggerAnalysis();
    //   }
    // };

    // 1분마다 체크 (자동 분석 비활성화 요청으로 주석 처리)
    // const intervalId = window.setInterval(checkAutoFlush, 60_000);

    // return () => window.clearInterval(intervalId);
  }, [projectId, enabled, shouldAutoFlush, triggerAnalysis]);

  // Job Status Recovery & Polling Fallback
  const checkJobStatus = useCallback(async () => {
    if (!currentJobId) {
      if (isAnalyzing) {
        setBufferAnalyzing(false);
      }
      return;
    }

    if (currentJobType !== "analysis" && currentJobType !== "image") {
      return;
    }

    try {
      let status;
      if (currentJobType === "image") {
        status = await imageService.getImageJobStatus(currentJobId);
      } else {
        status = await aiService.getJobStatus<AnalysisResultData>(currentJobId);
      }

      // Check for implicit completion (if the response IS the result)
      // If status field is missing but we have 'characters' or 'sections', assume it's the result data

      const statusAny = status as unknown as Record<string, unknown>;
      const hasResultFields = "characters" in status || "sections" in status;
      const explicitStatus = statusAny.status;

      let normalizedStatus = "pending";
      if (typeof explicitStatus === "string") {
        normalizedStatus = explicitStatus.toLowerCase().trim();
      } else if (hasResultFields) {
        normalizedStatus = "completed";
      }

      // Progress Update & Force Completion if 100%
      const progress =
        typeof statusAny.progress === "number" ? statusAny.progress : 0;
      if (progress >= 100) {
        normalizedStatus = "completed";
      }

      if (typeof statusAny.progress === "number") {
        startTransition(() => {
          setJobProgresses((prev) => ({
            ...prev,
            [currentJobId]: statusAny.progress as number,
          }));
        });
      }

      // If job completed
      if (
        normalizedStatus === "completed" ||
        normalizedStatus === "success" ||
        normalizedStatus === "done"
      ) {
        if (statusAny.result) {
          lastResultRef.current = statusAny.result as AnalysisResultData;
        }

        startTransition(() => {
          setJobProgresses((prev) => ({ ...prev, [currentJobId]: 100 }));
        });

        if (projectId && currentJobId) {
          removeStoreJobId(projectId, currentJobId);
        }
        // finalizeAnalysis() call removed to prevent double invocation.
        // removal of jobId triggers the useEffect which calls finalizeAnalysis via activeJobs check.
        return;
      }

      // Handle Failed
      if (normalizedStatus === "failed" || normalizedStatus === "error") {
        const errorDetail =
          statusAny.error || statusAny.message || "분석 작업이 실패했습니다.";
        setBufferAnalyzing(false);
        setGlobalProgress(0);
        if (projectId && currentJobId)
          removeStoreJobId(projectId, currentJobId);
        onErrorRef.current?.(errorDetail as string);
        return;
      }

      const validInProgressStatuses = [
        "processing",
        "pending",
        "sent",
        "queued",
      ];
      if (!validInProgressStatuses.includes(normalizedStatus)) {
        if (projectId && currentJobId)
          removeStoreJobId(projectId, currentJobId);
        return;
      }

      if (!isAnalyzing && currentJobType === "analysis") {
        setBufferAnalyzing(true);
      }
    } catch (error) {
      // If 404 (Not Found), 422 (Invalid ID format), or 500 (Server Error), clear the state.
      const axiosError = error as { response?: { status?: number } };
      const status = axiosError?.response?.status;
      if (status === 404 || status === 422 || status === 500) {
        if (projectId && currentJobId)
          removeStoreJobId(projectId, currentJobId);
      }
    }
  }, [
    currentJobId,
    currentJobType,
    isAnalyzing,
    projectId,
    setBufferAnalyzing,
    setGlobalProgress,
    removeStoreJobId,
  ]);

  // Polling Fallback
  useEffect(() => {
    if (
      !currentJobId ||
      (currentJobType !== "analysis" && currentJobType !== "image") ||
      !isAnalyzing ||
      isConnected
    ) {
      return;
    }

    const intervalId = window.setInterval(() => {
      startTransition(() => {
        checkJobStatus();
      });
    }, 5000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [currentJobId, currentJobType, isAnalyzing, isConnected, checkJobStatus]);

  return {
    isAnalyzing,
    analysisProgress,
    analysisError,
    triggerAnalysis,
    flushAndAnalyze,
    resetAnalysis,
    lastConsistencyReport,
    isStuck,
    currentJobType,
  };
}
