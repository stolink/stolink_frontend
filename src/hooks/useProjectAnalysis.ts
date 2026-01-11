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
  options: UseProjectAnalysisOptions = {}
): UseProjectAnalysisReturn {
  const { enabled = true, onAnalysisComplete, onAnalysisError } = options;
  const queryClient = useQueryClient();

  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isStuck, setIsStuck] = useState(false);

  const pendingHashesRef = useRef<Record<string, string>>({});

  // Callbacks refs (to avoid effect re-runs)
  const onCompleteRef = useRef(onAnalysisComplete);
  const onErrorRef = useRef(onAnalysisError);

  // Stuck detection logic
  const lastProgressRef = useRef<number>(-1);
  const lastProgressUpdateRef = useRef<number>(0);
  const STUCK_TIMEOUT_MS = 60_000; // 60 seconds

  useEffect(() => {
    onCompleteRef.current = onAnalysisComplete;
    onErrorRef.current = onAnalysisError;
    // Purity fix: initialize lastProgressUpdateRef in effect
    lastProgressUpdateRef.current = Date.now();
  }, [onAnalysisComplete, onAnalysisError]);

  // 버퍼 스토어 (Global State)
  const setProjectId = useAnalysisBufferStore((state) => state.setProjectId);
  const shouldAutoFlush = useAnalysisBufferStore(
    (state) => state.shouldAutoFlush
  );
  const setBufferAnalyzing = useAnalysisBufferStore(
    (state) => state.setAnalyzing
  );
  const getBufferSummary = useAnalysisBufferStore(
    (state) => state.getBufferSummary
  );
  const currentJobId = useAnalysisBufferStore((state) => state.currentJobId);
  const currentJobType = useAnalysisBufferStore(
    (state) => state.currentJobType
  );
  const setJobId = useAnalysisBufferStore((state) => state.setJobId);
  const setGlobalProgress = useAnalysisBufferStore(
    (state) => state.setProgress
  );
  const setLastAnalyzedHashes = useAnalysisBufferStore(
    (state) => state.setLastAnalyzedHashes
  );
  const isAnalyzing = useAnalysisBufferStore((state) => state.isAnalyzing);
  const resetAnalysis = useAnalysisBufferStore((state) => state.resetAnalysis);
  const lastConsistencyReport = useAnalysisBufferStore(
    (state) => state.lastConsistencyReport
  );
  const activeJobs = useAnalysisBufferStore((state) => state.activeJobs);
  const addStoreJobId = useAnalysisBufferStore((state) => state.addJobId);
  const removeStoreJobId = useAnalysisBufferStore((state) => state.removeJobId);
  const clearStoreJobs = useAnalysisBufferStore((state) => state.clearJobs);

  const [jobProgresses, setJobProgresses] = useState<Record<string, number>>(
    {}
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

    // Trigger completion callback
    onCompleteRef.current?.(lastResultRef.current);
    if (lastResultRef.current?.consistencyReport) {
      useAnalysisBufferStore
        .getState()
        .setLastConsistencyReport(lastResultRef.current.consistencyReport);
    }
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
        "[useProjectAnalysis] More unanalyzed changes found. Triggering re-analysis..."
      );
      window.setTimeout(() => {
        triggerReanalysisRef.current?.();
      }, 100);
    } else {
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

  // Job Status Recovery & Polling Fallback
  const checkJobStatus = useCallback(async () => {
    if (!currentJobId) {
      if (isAnalyzing) {
        console.log(
          "[useProjectAnalysis] checkJobStatus: Analyzing state but no jobId. Resetting."
        );
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

      const statusAny = status as Record<string, unknown>;
      const hasResultFields = "characters" in status || "sections" in status;
      const explicitStatus = statusAny.status;

      let normalizedStatus = "pending";
      if (typeof explicitStatus === "string") {
        normalizedStatus = explicitStatus.toLowerCase().trim();
      } else if (hasResultFields) {
        normalizedStatus = "completed";
      }

      // Update progress
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

        finalizeAnalysis();
        return;
      }

      // Handle Failed
      if (normalizedStatus === "failed" || normalizedStatus === "error") {
        const errorDetail =
          statusAny.error || statusAny.message || "Job failed";
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
      console.warn("[useProjectAnalysis] checkJobStatus: Failed!", error);
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
  ]);

  // 프로젝트 초기 로드 시 백엔드에서 job 상태 확인
  useEffect(() => {
    if (!projectId || !enabled) return;

    const checkProjectJobStatus = async () => {
      try {
        const jobStatus = await aiService.getProjectAnalysisJob(projectId);

        if (
          jobStatus.jobId &&
          (jobStatus.status === "processing" || jobStatus.status === "pending")
        ) {
          const statusAny = jobStatus as Record<string, unknown>;
          const timestampStr = (statusAny.updatedAt ||
            statusAny.createdAt) as string;
          const timestamp = timestampStr
            ? new Date(timestampStr).getTime()
            : Date.now();
          const elapsed = Date.now() - timestamp;

          const isPendingStale =
            jobStatus.status === "pending" && elapsed > 1 * 60 * 1000;
          const isProcessingStale =
            jobStatus.status === "processing" && elapsed > 30 * 60 * 1000;

          if (!isPendingStale && !isProcessingStale) {
            addStoreJobId(projectId, jobStatus.jobId, "analysis");
            setJobProgresses((prev) => ({
              ...prev,
              [jobStatus.jobId!]: jobStatus.progress || 0,
            }));
          }
        } else if (jobStatus.status === "failed") {
          clearStoreJobs(projectId);
        }
      } catch (error) {
        console.warn(
          "[useProjectAnalysis] Failed to check project job status:",
          error
        );
      }
    };

    checkProjectJobStatus();
  }, [projectId, enabled, addStoreJobId, clearStoreJobs]);

  // Job Status Tracking via Project SSE
  const { isConnected } = useJobSSE<AnalysisResultData>(
    projectId,
    aiService.getProjectStatusStreamUrl,
    {
      enabled:
        !!projectId && (activeJobs[projectId]?.length > 0 || isAnalyzing),
      onMessage: (data) => {
        const event = data as Record<string, unknown> & {
          jobId: string;
          type?: string;
          status?: string;
          percent?: number;
          progress?: number;
          result?: AnalysisResultData;
        };
        if (!event || !event.jobId) return;

        const eventType = (event.type || event.status || "").toLowerCase();

        if (eventType === "progress" || eventType === "processing") {
          setJobProgresses((prev) => ({
            ...prev,
            [event.jobId]: event.percent || event.progress || 0,
          }));
        } else if (["completed", "success", "done"].includes(eventType)) {
          console.log(
            `[useProjectAnalysis] Job completed via SSE: ${event.jobId}`
          );
          if (event.result) {
            lastResultRef.current = event.result;
          }
          setJobProgresses((prev) => ({ ...prev, [event.jobId]: 100 }));
          if (projectId) {
            removeStoreJobId(projectId, event.jobId);
          }
        } else if (["failed", "error"].includes(eventType)) {
          if (projectId) removeStoreJobId(projectId, event.jobId);
        }
      },
      onError: (err) => {
        setAnalysisError(err);
        setBufferAnalyzing(false);
        onErrorRef.current?.(err);
      },
    }
  );

  // 전역 진행률 계산 및 Stuck 감지
  useEffect(() => {
    const currentActiveJobIds = projectId ? activeJobs[projectId] || [] : [];
    const totalProgress = currentActiveJobIds.reduce(
      (sum, jobId) => sum + (jobProgresses[jobId] || 0),
      0
    );

    if (currentActiveJobIds.length === 0) {
      if (isAnalyzing) {
        startTransition(() => {
          finalizeAnalysis();
        });
      }
      return;
    }

    const averageProgress = Math.round(
      totalProgress / currentActiveJobIds.length
    );
    setAnalysisProgress(averageProgress);
    setGlobalProgress(averageProgress);

    // Stuck Mitigation
    if (averageProgress >= 100 && isAnalyzing) {
      if (lastProgressRef.current !== averageProgress) {
        lastProgressRef.current = averageProgress;
        lastProgressUpdateRef.current = Date.now();
      } else if (Date.now() - lastProgressUpdateRef.current > 5000) {
        console.warn(
          "[useProjectAnalysis] Progress stuck at 100% for 5s. Forcing completion."
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
    finalizeAnalysis,
    isStuck,
  ]);

  // 분석 트리거
  const triggerAnalysis = useCallback(async () => {
    if (!projectId) return;
    const store = useAnalysisBufferStore.getState();
    const changedDocuments = store.getChangedDocuments();

    if (changedDocuments.length === 0) return;

    setBufferAnalyzing(true);
    setAnalysisError(null);
    if (!isAnalyzing) setAnalysisProgress(0);

    const newPendingHashes: Record<string, string> = {};
    changedDocuments.forEach((doc) => {
      newPendingHashes[doc.documentId] = aiService.calculateContentHash(
        doc.content
      );
    });

    store.setPendingDocuments(newPendingHashes);

    try {
      for (const doc of changedDocuments) {
        const response = await aiService.analyzeStory({
          projectId,
          documentId: doc.documentId,
          content: doc.content,
          analysisType: "partial_snippet",
        });
        const resData = response as {
          data?: { jobId?: string; id?: string };
          jobId?: string;
          id?: string;
        };
        const actualData = resData.data || resData;
        const jobId =
          actualData?.jobId || actualData?.id || (resData as any).documentId;

        if (jobId) {
          addStoreJobId(projectId, jobId);
          setJobProgresses((prev) => ({ ...prev, [jobId]: 0 }));
        }
      }
      pendingHashesRef.current = {
        ...pendingHashesRef.current,
        ...newPendingHashes,
      };
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Analysis failed";
      setAnalysisError(errorMsg);
      // Rollback pending
      const currentPending = {
        ...useAnalysisBufferStore.getState().pendingDocuments,
      };
      Object.keys(newPendingHashes).forEach((id) => delete currentPending[id]);
      useAnalysisBufferStore.setState({ pendingDocuments: currentPending });
      if (!isAnalyzing) setBufferAnalyzing(false);
      onErrorRef.current?.(errorMsg);
    }
  }, [projectId, isAnalyzing, setBufferAnalyzing, addStoreJobId]);

  const flushAndAnalyze = useCallback(async () => {
    if (getBufferSummary().charCount > 0) await triggerAnalysis();
  }, [getBufferSummary, triggerAnalysis]);

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

  // Handle Initial Load & Job ID Changes
  useEffect(() => {
    if (
      currentJobId &&
      (currentJobType === "analysis" || currentJobType === "image")
    ) {
      checkJobStatus();
    }
  }, [currentJobId, currentJobType, checkJobStatus]);

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

    console.log(
      "[useProjectAnalysis] SSE not active (isConnected: false). Starting 5s polling fallback..."
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
    isStuck,
    currentJobType,
  };
}
