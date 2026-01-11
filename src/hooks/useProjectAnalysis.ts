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
import type {
  AnalysisResultData,
  ConsistencyReport,
} from "@/types/analysisResult";
import { useJobSSE } from "./useJobSSE";
import { characterKeys } from "./useCharacters";

// Removed unused API_URL

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
  lastConsistencyReport: ConsistencyReport | null; // Added
  isStuck: boolean; // Added
  currentJobType: "analysis" | "image" | null; // Added
}

export function useProjectAnalysis(
  projectId: string | null,
  options: UseProjectAnalysisOptions = {},
): UseProjectAnalysisReturn {
  const { enabled = true, onAnalysisComplete, onAnalysisError } = options;
  const queryClient = useQueryClient();

  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isStuck, setIsStuck] = useState(false); // Added

  const pendingHashesRef = useRef<Record<string, string>>({});

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
  const setJobId = useAnalysisBufferStore((state) => state.setJobId);
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

  // 재분석 트리거 ref (순환 의존성 방지)
  const triggerReanalysisRef = useRef<(() => Promise<void>) | null>(null);

  // Finalize Analysis (Shared logic for all completion paths)
  const finalizeAnalysis = useCallback(() => {
    console.log("[useProjectAnalysis] Finalizing analysis...");

    // Sync hashes (분석 완료된 문서들)
    setLastAnalyzedHashes(pendingHashesRef.current);
    pendingHashesRef.current = {};

    // pendingDocuments 클리어
    useAnalysisBufferStore.getState().clearPendingDocuments();

    // Invalidate queries first (so fresh data is available for callback)
    if (projectId) {
      queryClient.invalidateQueries({
        queryKey: characterKeys.list(projectId),
      });
    }

    // Trigger completion callback (always call, even if result is null)
    // Backend stores result in DB, so we signal completion and let the UI refetch
    onCompleteRef.current?.(lastResultRef.current);
    lastResultRef.current = null;

    // Clear jobs
    if (projectId) {
      clearStoreJobs(projectId);
    }

    // 버퍼에 새로운 변경이 있는지 체크
    const hasMoreChanges = useAnalysisBufferStore
      .getState()
      .hasUnanalyzedChanges();

    if (hasMoreChanges) {
      console.log(
        "[useProjectAnalysis] More unanalyzed changes found. Triggering re-analysis...",
      );
      // 다음 틱에서 재분석 트리거 (상태 업데이트 완료 후)
      window.setTimeout(() => {
        triggerReanalysisRef.current?.();
      }, 100);
    } else {
      // 모든 분석 완료
      setBufferAnalyzing(false);
      setAnalysisProgress(100);
      setGlobalProgress(100);
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
        console.log(
          `[useProjectAnalysis] Checking project job status for ${projectId}`,
        );
        const jobStatus = await aiService.getProjectAnalysisJob(projectId);

        console.log("[useProjectAnalysis] Project job status:", jobStatus);

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
          const timestampStr = (statusAny.updatedAt || statusAny.createdAt) as
            | string
            | undefined;
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
            console.warn(
              `[useProjectAnalysis] Ignoring stale job ${jobStatus.jobId} (Status: ${jobStatus.status}, Elapsed: ${Math.round(elapsed / 1000)}s).`,
            );
            // Optionally clear it from store if it was there?
          } else {
            console.log(
              `[useProjectAnalysis] Active job found: ${jobStatus.jobId}, status: ${jobStatus.status}, progress: ${jobStatus.progress}`,
            );

            addStoreJobId(projectId, jobStatus.jobId, "analysis");
            setJobProgresses((prev) => ({
              ...prev,
              [jobStatus.jobId!]: jobStatus.progress || 0,
            }));
          }
        }
        // 완료된 상태면 캐릭터/관계 쿼리 무효화 (DB에서 최신 데이터 fetch)
        // [FIX] Removed aggressive invalidation on mount.
        // Simply having a lastCompletedAt doesn't mean we need to invalidate immediately.
        // React Query will handle fetching if data is stale.
        /*
        else if (jobStatus.status === null && jobStatus.lastCompletedAt) {
          console.log(
            `[useProjectAnalysis] Analysis completed at ${jobStatus.lastCompletedAt}. Invalidating character queries.`
          );
          queryClient.invalidateQueries({
            queryKey: characterKeys.list(projectId),
          });
        }
        */
        // 실패한 job이 있으면 상태 클리어
        else if (jobStatus.status === "failed") {
          console.warn(
            `[useProjectAnalysis] Previous job failed. Clearing state.`,
          );
          clearStoreJobs(projectId);
        }
      } catch (error) {
        console.warn(
          "[useProjectAnalysis] Failed to check project job status:",
          error,
        );
        // API가 없거나 에러 시 기존 로직으로 fallback (IndexedDB 기반)
      }
    };

    checkProjectJobStatus();
  }, [
    projectId,
    enabled,
    setJobId,
    setBufferAnalyzing,
    setGlobalProgress,
    resetAnalysis,
    queryClient,
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
        if (!event || !event.jobId) return;

        const eventType = event.type || event.status?.toLowerCase();

        if (eventType === "progress" || eventType === "processing") {
          setJobProgresses((prev) => ({
            ...prev,
            [event.jobId]: event.percent || event.progress || 0,
          }));
        } else if (
          eventType === "completed" ||
          eventType === "success" ||
          eventType === "done"
        ) {
          console.log(
            `[useProjectAnalysis] Job completed via SSE: ${event.jobId}`,
          );
          if (event.result) {
            lastResultRef.current = event.result as AnalysisResultData;
          }
          setJobProgresses((prev) => ({ ...prev, [event.jobId]: 100 }));
          if (projectId) {
            removeStoreJobId(projectId, event.jobId);
          }
        } else if (eventType === "failed" || eventType === "error") {
          if (projectId) removeStoreJobId(projectId, event.jobId);
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
      if (isAnalyzing) {
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

    startTransition(() => {
      setAnalysisProgress(averageProgress);
      setGlobalProgress(averageProgress);
    });

    // [Stuck Mitigation]
    // 만약 진행률이 100%인데 Job이 지워지지 않고 3초 이상 머무르면 강제로 완료 처리
    if (
      averageProgress >= 100 &&
      isAnalyzing &&
      currentActiveJobIds.length > 0
    ) {
      if (lastProgressRef.current !== averageProgress) {
        lastProgressRef.current = averageProgress;
        lastProgressUpdateRef.current = Date.now();
      } else if (Date.now() - lastProgressUpdateRef.current > 5000) {
        // 5초 세이프티
        console.warn(
          "[useProjectAnalysis] Progress stuck at 100% for 5s. Forcing completion.",
        );
        startTransition(() => {
          finalizeAnalysis();
          setIsStuck(true);
        });
      }
    } else {
      lastProgressRef.current = averageProgress;
      lastProgressUpdateRef.current = Date.now();
      if (isStuck) startTransition(() => setIsStuck(false));
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
      console.log("[useProjectAnalysis] No changed documents to analyze.");
      return;
    }

    console.log(
      `[useProjectAnalysis] Found ${changedDocuments.length} changed documents to analyze:`,
      changedDocuments.map((d) => d.documentId),
    );

    // 분석 상태 시작
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

    try {
      // 각 문서에 대해 분석 요청
      for (const chunk of changedDocuments) {
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
      }

      // 성공적으로 요청된 해시를 pendingHashesRef에도 저장 (완료 시 lastAnalyzedHashes로 이동)
      pendingHashesRef.current = {
        ...pendingHashesRef.current,
        ...newPendingHashes,
      };
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Analysis request failed";
      setAnalysisError(errorMsg);

      // 실패 시 pendingDocuments에서 제거
      const currentPending = useAnalysisBufferStore.getState().pendingDocuments;
      const remainingPending = { ...currentPending };
      Object.keys(newPendingHashes).forEach((docId) => {
        delete remainingPending[docId];
      });
      useAnalysisBufferStore.setState({ pendingDocuments: remainingPending });

      if (!isAnalyzing) {
        setBufferAnalyzing(false);
      }
      onErrorRef.current?.(errorMsg);
    }
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

  // 자동 flush 체크 (주기적)
  useEffect(() => {
    if (!projectId || !enabled) return;

    const checkAutoFlush = () => {
      if (shouldAutoFlush()) {
        triggerAnalysis();
      }
    };

    // 1분마다 체크
    const intervalId = window.setInterval(checkAutoFlush, 60_000);

    return () => window.clearInterval(intervalId);
  }, [projectId, enabled, shouldAutoFlush, triggerAnalysis]);

  // Job Status Recovery & Polling Fallback
  const checkJobStatus = useCallback(async () => {
    if (!currentJobId) {
      if (isAnalyzing) {
        console.log(
          "[useProjectAnalysis] checkJobStatus: Analyzing state but no jobId. Resetting.",
        );
        setBufferAnalyzing(false);
      }
      return;
    }

    if (currentJobType !== "analysis" && currentJobType !== "image") {
      // Not a supported job type for this hook
      return;
    }

    console.log(
      `[useProjectAnalysis] checkJobStatus: Fetching status for ${currentJobId} (Type: ${currentJobType})`,
    );
    try {
      let status;
      if (currentJobType === "image") {
        status = await imageService.getImageJobStatus(currentJobId);
      } else {
        status = await aiService.getJobStatus<AnalysisResultData>(currentJobId);
      }

      console.log(
        `[useProjectAnalysis] checkJobStatus: Full status object:`,
        status,
      );

      // Check for implicit completion (if the response IS the result)
      // If status field is missing but we have 'characters' or 'sections', assume it's the result data

      const statusAny = status as unknown as Record<string, unknown>;
      const hasResultFields =
        "characters" in (status as object) || "sections" in (status as object);
      const explicitStatus = statusAny.status;

      let normalizedStatus: string = "pending";
      if (typeof explicitStatus === "string") {
        normalizedStatus = explicitStatus.toLowerCase().trim();
      } else if (hasResultFields) {
        console.log(
          "[useProjectAnalysis] Implicit completion detected (Result fields found)",
        );
        normalizedStatus = "completed";
      }

      // Update progress from polling result if available
      if (typeof statusAny.progress === "number") {
        startTransition(() => {
          setJobProgresses((prev) => ({
            ...prev,
            [currentJobId]: statusAny.progress as number,
          }));
        });
      }

      // If job is already completed, handle it immediately
      if (
        normalizedStatus === "completed" ||
        normalizedStatus === "success" ||
        normalizedStatus === "done"
      ) {
        console.log(
          "[useProjectAnalysis] checkJobStatus: Job COMPLETED. Finalizing state.",
        );

        // User confirmed: Backend does NOT return result. Just rely on 'completed' status.
        // Finalize analysis will invalidate queries -> fetch fresh data from Project APIs.
        console.log(
          "[useProjectAnalysis] Job COMPLETED. Triggering finalization (invalidation).",
        );

        startTransition(() => {
          setJobProgresses((prev) => ({ ...prev, [currentJobId]: 100 }));
        });
        if (projectId && currentJobId) {
          removeStoreJobId(projectId, currentJobId);
        }

        // Just invoke completion callback with empty/null if needed, or just let invalidation handle UI updates.
        // For consistency report, we might miss it if it's not in the status.
        // But invalidation will refresh characters/relations.
        finalizeAnalysis();
        return;
      }

      // Handle Failed status
      if (normalizedStatus === "failed" || normalizedStatus === "error") {
        const errorDetail =
          (statusAny.error as string) ||
          (statusAny.message as string) ||
          "분석 작업이 실패했습니다.";
        console.error(
          `[useProjectAnalysis] checkJobStatus: Job ${normalizedStatus}. Details: ${errorDetail}`,
          status, // Log full status object for debugging
        );
        setBufferAnalyzing(false);
        setGlobalProgress(0);
        if (projectId && currentJobId)
          removeStoreJobId(projectId, currentJobId);

        onErrorRef.current?.(errorDetail);
        return;
      }

      // Check for other terminal statuses or unexpected strings
      // Valid in-progress statuses: processing, pending, sent (image jobs), queued
      const validInProgressStatuses = [
        "processing",
        "pending",
        "sent",
        "queued",
      ];
      if (!validInProgressStatuses.includes(normalizedStatus)) {
        if (currentJobType === "analysis") {
          console.warn(
            `[useProjectAnalysis] checkJobStatus: Unknown or terminal status received: ${String(
              explicitStatus,
            )}. Removing job ${currentJobId}.`,
          );
        } else {
          console.log(
            `[useProjectAnalysis] checkJobStatus: Image job status "${normalizedStatus}" not in progress. Removing job ${currentJobId}.`,
          );
        }
        if (projectId && currentJobId)
          removeStoreJobId(projectId, currentJobId);
        return;
      }

      // Job exists and is running/pending, make sure we are in analyzing state
      if (!isAnalyzing && currentJobType === "analysis") {
        console.log(
          `[useProjectAnalysis] checkJobStatus: Job is ${normalizedStatus}, ensuring isAnalyzing is true.`,
        );
        setBufferAnalyzing(true);
      }
    } catch (error: unknown) {
      console.warn("[useProjectAnalysis] checkJobStatus: Failed!", error);

      // If 404 (Not Found), 422 (Invalid ID format), or 500 (Server Error), clear the state.
      const axiosError = error as { response?: { status?: number } };
      const status = axiosError?.response?.status;
      if (status === 404 || status === 422 || status === 500) {
        console.log(
          `[useProjectAnalysis] checkJobStatus: Invalid job ID (Error ${status}). Clearing job ${currentJobId}.`,
        );
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
    finalizeAnalysis,
    setJobProgresses,
  ]);

  // Handle Initial Load & Job ID Changes
  useEffect(() => {
    if (
      currentJobId &&
      (currentJobType === "analysis" || currentJobType === "image")
    ) {
      startTransition(() => {
        checkJobStatus();
      });
    }
  }, [currentJobId, currentJobType, checkJobStatus]);

  // Polling Fallback: If SSE is not connected but we are expecting analysis
  useEffect(() => {
    if (
      !currentJobId ||
      (currentJobType !== "analysis" && currentJobType !== "image") ||
      !isAnalyzing ||
      isConnected
    ) {
      return;
    }

    console.log(
      "[useProjectAnalysis] SSE not active (isConnected: false). Starting 5s polling fallback...",
    );
    const intervalId = window.setInterval(() => {
      startTransition(() => {
        checkJobStatus();
      });
    }, 5000);

    return () => {
      if (currentJobId && isAnalyzing && !isConnected) {
        console.log("[useProjectAnalysis] Cleaning up polling interval.");
      }
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
    isStuck, // Added
    currentJobType, // Added
  };
}
