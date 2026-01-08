/**
 * 프로젝트 레벨 분석 훅 (SSE 방식)
 *
 * 에디터/월드 페이지 진입 시 버퍼 및 분석 상태를 관리합니다.
 * 분석 요청을 보내고, SSE를 통해 상태를 실시간으로 수신합니다.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAnalysisBufferStore } from "@/stores/useAnalysisBufferStore";
import { aiService } from "@/services/aiService";
import { imageService } from "@/services/imageService";
import type {
  AnalysisResultData,
  ConsistencyReport,
} from "@/types/analysisResult";
import { useJobSSE } from "./useJobSSE";

// Removed unused API_URL

interface UseProjectAnalysisOptions {
  enabled?: boolean;
  onAnalysisComplete?: (result: AnalysisResultData) => void;
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
  const lastProgressUpdateRef = useRef<number>(Date.now());
  const STUCK_TIMEOUT_MS = 60_000; // 60 seconds

  useEffect(() => {
    onCompleteRef.current = onAnalysisComplete;
    onErrorRef.current = onAnalysisError;
  }, [onAnalysisComplete, onAnalysisError]);

  // 버퍼 스토어 (Global State)
  // 버퍼 스토어 (Global State)
  const setProjectId = useAnalysisBufferStore((state) => state.setProjectId);
  const flush = useAnalysisBufferStore((state) => state.flush);
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
  const setLastConsistencyReport = useAnalysisBufferStore(
    (state) => state.setLastConsistencyReport,
  );

  // 프로젝트 ID 설정
  useEffect(() => {
    if (projectId) {
      setProjectId(projectId);
    }
  }, [projectId, setProjectId]);

  // Note: SSE connection is managed by useJobSSE hook, so cleanup is handled there.

  // Job Status Tracking via SSE
  const {
    jobStatus,
    progress: jobProgress,
    result: _jobResult,
    error: _jobError,
    isConnected,
  } = useJobSSE<AnalysisResultData>(currentJobId, aiService.getJobStreamUrl, {
    enabled: !!currentJobId && currentJobType === "analysis",
    onComplete: (result) => {
      console.log("[useProjectAnalysis] Job Completed via SSE:", result);
      setAnalysisProgress(100);
      setGlobalProgress(100);
      setBufferAnalyzing(false);
      setJobId(null);

      // Finalize hashes
      setLastAnalyzedHashes(pendingHashesRef.current);
      pendingHashesRef.current = {};

      onCompleteRef.current?.(result);
      if (result.consistencyReport) {
        setLastConsistencyReport(result.consistencyReport);
      }
    },
    onError: (err) => {
      console.error("[useProjectAnalysis] Job Failed via SSE:", err);
      setAnalysisError(err);
      setBufferAnalyzing(false);
      setGlobalProgress(0);
      setJobId(null);
      onErrorRef.current?.(err);
    },
  });

  // Sync SSE state to local/store state
  useEffect(() => {
    if (
      currentJobId &&
      currentJobType === "analysis" &&
      (jobStatus === "processing" || jobStatus === "pending")
    ) {
      setAnalysisProgress(jobProgress);
      setGlobalProgress(jobProgress);

      // Check for progress changes to manage stuck state
      if (jobProgress !== lastProgressRef.current) {
        lastProgressRef.current = jobProgress;
        lastProgressUpdateRef.current = Date.now();
        if (isStuck) setIsStuck(false);
      } else if (isAnalyzing && jobProgress < 100) {
        const timeSinceLastUpdate = Date.now() - lastProgressUpdateRef.current;
        if (timeSinceLastUpdate > STUCK_TIMEOUT_MS && !isStuck) {
          console.warn(
            `[useProjectAnalysis] Job detected as STUCK (No progress change for ${STUCK_TIMEOUT_MS}ms)`,
          );
          setIsStuck(true);
        }
      }

      if (!isAnalyzing) {
        setBufferAnalyzing(true);
      }
    }
  }, [
    currentJobId,
    currentJobType,
    jobProgress,
    jobStatus,
    isAnalyzing,
    isStuck,
    setBufferAnalyzing,
    setGlobalProgress,
  ]);

  // Project Status SSE (Optional/Leftover) - Commented out to prefer Job Stream
  /*
  useEffect(() => {
    // ... manual SSE code removed ...
  }, []);
  */

  // 분석 트리거 (버퍼 flush 후 분석 시작)
  const triggerAnalysis = useCallback(async () => {
    if (!projectId) {
      return;
    }
    // Prevent duplicate analysis if already analyzing or if a job ID exists
    const {
      buffer: currentBuffer,
      lastAnalyzedHashes,
      currentJobId: existingJobId,
      isAnalyzing: storeAnalyzing,
    } = useAnalysisBufferStore.getState();

    if (isAnalyzing || storeAnalyzing || existingJobId) {
      return;
    }

    if (currentBuffer.length === 0) {
      return;
    }

    // 1. Idempotency Check (Hashing)
    const currentHashes: Record<string, string> = {};
    let hasChanges = false;

    currentBuffer.forEach((chunk) => {
      const hash = aiService.calculateContentHash(chunk.content);
      currentHashes[chunk.documentId] = hash;
      if (lastAnalyzedHashes[chunk.documentId] !== hash) {
        hasChanges = true;
      }
    });

    if (!hasChanges) {
      flush();
      return;
    }

    const bufferContent = flush();

    setBufferAnalyzing(true);
    setAnalysisError(null);
    setAnalysisProgress(0);

    try {
      // Backend expects flat object: { projectId, documentId, content }
      // If multiple chunks, we analyze them one by one.
      // For now, we take the most recent job ID if multiple.
      let lastJobId: string | null = null;

      for (const chunk of bufferContent) {
        const response = await aiService.analyzeStory({
          projectId,
          documentId: chunk.documentId,
          content: chunk.content,
        });

        if (response.data?.jobId) {
          lastJobId = response.data.jobId;
        }
      }

      if (lastJobId) {
        setJobId(lastJobId);
        pendingHashesRef.current = currentHashes;
      } else {
        throw new Error("No jobId returned from analyze API");
      }
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Analysis request failed";
      setAnalysisError(errorMsg);
      setBufferAnalyzing(false);
      onErrorRef.current?.(errorMsg);
    }
  }, [projectId, isAnalyzing, flush, setBufferAnalyzing, setJobId]);

  // Flush and analyze (강제 실행)
  const flushAndAnalyze = useCallback(async () => {
    const summary = getBufferSummary();
    if (summary.charCount > 0) {
      await triggerAnalysis();
    }
  }, [getBufferSummary, triggerAnalysis]);

  // 자동 flush 체크 (주기적)
  useEffect(() => {
    if (!projectId || !enabled) return;

    const checkAutoFlush = () => {
      if (shouldAutoFlush()) {
        triggerAnalysis();
      }
    };

    // 1분마다 체크
    const intervalId = setInterval(checkAutoFlush, 60_000);

    return () => clearInterval(intervalId);
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const statusAny = status as any;
      const hasResultFields = "characters" in status || "sections" in status;
      const explicitStatus = statusAny.status;

      let normalizedStatus = "pending";
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
        setAnalysisProgress(statusAny.progress);
        setGlobalProgress(statusAny.progress);
      }

      // If job is already completed, handle it immediately
      if (
        normalizedStatus === "completed" ||
        normalizedStatus === "success" ||
        normalizedStatus === "done" ||
        (typeof statusAny.progress === "number" && statusAny.progress >= 100)
      ) {
        console.log(
          "[useProjectAnalysis] checkJobStatus: Job COMPLETED (or 100%). Finalizing state.",
        );
        setAnalysisProgress(100);
        setGlobalProgress(100);
        setBufferAnalyzing(false);
        setJobId(null);

        // Determine result: if implicit, status IS the result. Else status.result.
        const resultData = hasResultFields
          ? (status as unknown as AnalysisResultData)
          : status.result;

        if (resultData) {
          if (currentJobType === "analysis") {
            const analysisResult = resultData as AnalysisResultData;
            onCompleteRef.current?.(analysisResult);
            if (analysisResult?.consistencyReport) {
              setLastConsistencyReport(analysisResult.consistencyReport);
            }
          } else if (currentJobType === "image") {
            console.log(
              "[useProjectAnalysis] Image Job Completed. Invalidating character queries.",
            );
            // Invalidate character queries so the new imageUrl is reflected
            queryClient.invalidateQueries({ queryKey: ["characters"] });
            queryClient.invalidateQueries({ queryKey: ["character"] });
          }
        }
        return;
      }

      // Handle Failed status
      if (normalizedStatus === "failed" || normalizedStatus === "error") {
        console.error(
          `[useProjectAnalysis] checkJobStatus: Job ${normalizedStatus}. Clearing state.`,
        );
        setAnalysisError("분석 작업이 실패했습니다.");
        setBufferAnalyzing(false);
        setGlobalProgress(0);
        setJobId(null);

        onErrorRef.current?.("분석 작업이 실패했습니다.");
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
            `[useProjectAnalysis] checkJobStatus: Unknown or terminal status received: ${explicitStatus}. Resetting.`,
          );
        } else {
          console.log(
            `[useProjectAnalysis] checkJobStatus: Image job status "${normalizedStatus}" not in progress. Resetting.`,
          );
        }
        setBufferAnalyzing(false);
        setJobId(null);
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

      // If 404 (Not Found) or 500 (Server Error - likely invalid ID), clear the state.
      const axiosError = error as { response?: { status?: number } };
      const status = axiosError?.response?.status;
      if (status === 404 || status === 500) {
        console.log(
          `[useProjectAnalysis] checkJobStatus: Clearing invalid job ID (Error ${status})`,
        );
        setBufferAnalyzing(false);
        setJobId(null);
      }
    }
  }, [
    currentJobId,
    currentJobType,
    isAnalyzing,
    setBufferAnalyzing,
    setGlobalProgress,
    setJobId,
    setLastConsistencyReport,
    queryClient,
  ]);

  // Handle Initial Load & Job ID Changes
  useEffect(() => {
    if (
      currentJobId &&
      (currentJobType === "analysis" || currentJobType === "image")
    ) {
      checkJobStatus();
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
    const intervalId = setInterval(() => {
      checkJobStatus();
    }, 5000);

    return () => {
      if (currentJobId && isAnalyzing && !isConnected) {
        console.log("[useProjectAnalysis] Cleaning up polling interval.");
      }
      clearInterval(intervalId);
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
