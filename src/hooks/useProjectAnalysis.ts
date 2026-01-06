/**
 * 프로젝트 레벨 분석 훅 (SSE 방식)
 *
 * 에디터/월드 페이지 진입 시 버퍼 및 분석 상태를 관리합니다.
 * 분석 요청을 보내고, SSE를 통해 상태를 실시간으로 수신합니다.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useAnalysisBufferStore } from "@/stores/useAnalysisBufferStore";
import { aiService } from "@/services/aiService";
import type { AnalysisResultData } from "@/types/analysisResult";
import type {
  SSEProgressEvent,
  SSECompletedEvent,
  SSEFailedEvent,
} from "@/types/api";

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
}

export function useProjectAnalysis(
  projectId: string | null,
  options: UseProjectAnalysisOptions = {},
): UseProjectAnalysisReturn {
  const { enabled = true, onAnalysisComplete, onAnalysisError } = options;

  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const pendingHashesRef = useRef<Record<string, string>>({});

  // Callbacks refs (to avoid effect re-runs)
  const onCompleteRef = useRef(onAnalysisComplete);
  const onErrorRef = useRef(onAnalysisError);

  // Stuck detection
  const stuckCountRef = useRef(0);
  const lastProgressRef = useRef(-1);

  useEffect(() => {
    onCompleteRef.current = onAnalysisComplete;
    onErrorRef.current = onAnalysisError;
  }, [onAnalysisComplete, onAnalysisError]);

  // 버퍼 스토어 (Global State)
  const {
    setProjectId,
    flush,
    shouldAutoFlush,
    setAnalyzing: setBufferAnalyzing, // Store setter
    getBufferSummary,
    currentJobId,
    setJobId,
    setLastAnalyzedHashes,
    isAnalyzing, // Store state
  } = useAnalysisBufferStore();

  // 프로젝트 ID 설정
  useEffect(() => {
    if (projectId) {
      setProjectId(projectId);
    }
  }, [projectId, setProjectId]);

  // SSE 연결 정리
  const cleanup = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  // Project Status SSE 연결 (projectId 감지)
  useEffect(() => {
    if (!projectId || !enabled) {
      cleanup();
      return;
    }

    // 이미 연결된 경우 Skip (단, ID가 다르면 재연결)
    // NOTE: React StrictMode may cause double connect, but cleanup handles it.

    cleanup();

    const url = aiService.getProjectStatusStreamUrl(projectId);
    console.log("[useProjectAnalysis] Connecting to project status SSE:", url);

    const eventSource = new EventSource(url, { withCredentials: true });
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log(
        "[useProjectAnalysis] SSE connection opened for project:",
        projectId,
      );
      setAnalysisError(null);
    };

    // Heartbeat
    eventSource.addEventListener("heartbeat", () => {
      // console.log("[useProjectAnalysis] Heartbeat");
    });

    // Progress
    eventSource.addEventListener("progress", (e) => {
      try {
        const data = JSON.parse(e.data) as SSEProgressEvent;
        setAnalysisProgress(data.percent);
        console.log(`[useProjectAnalysis] Progress: ${data.percent}%`);

        // If progress started, ensure we are in analyzing state
        if (data.percent > 0 && data.percent < 100) {
          setBufferAnalyzing(true);
        }
      } catch {
        console.warn("[useProjectAnalysis] Failed to parse progress:", e.data);
      }
    });

    // Completed
    eventSource.addEventListener("completed", (e) => {
      try {
        const data = JSON.parse(
          e.data,
        ) as SSECompletedEvent<AnalysisResultData>;
        console.log("[useProjectAnalysis] Analysis completed");

        setAnalysisProgress(100);
        setBufferAnalyzing(false);
        setJobId(null);

        if (data.result) {
          // Finalize analyzed hashes into store for idempotency
          setLastAnalyzedHashes(pendingHashesRef.current);
          pendingHashesRef.current = {};
          onCompleteRef.current?.(data.result);
        }
      } catch (err) {
        console.error(
          "[useProjectAnalysis] Failed to parse completed:",
          e.data,
          err,
        );
        setAnalysisError("Failed to parse analysis result");
        setBufferAnalyzing(false);
        setJobId(null);
        onErrorRef.current?.("Failed to parse analysis result");
      }
    });

    // Failed
    eventSource.addEventListener("failed", (e) => {
      try {
        const data = JSON.parse(e.data) as SSEFailedEvent;
        console.error("[useProjectAnalysis] Analysis failed:", data.error);
        setAnalysisError(data.error);
        setBufferAnalyzing(false);
        setJobId(null);
        onErrorRef.current?.(data.error);
      } catch {
        console.error("[useProjectAnalysis] Failed to parse failed:", e.data);
      }
    });

    eventSource.onerror = (e) => {
      console.error("[useProjectAnalysis] SSE connection error", e);
      if (eventSource.readyState === EventSource.CLOSED) {
        setBufferAnalyzing(false);
        setJobId(null);
      }
    };

    return () => {
      cleanup();
    };
  }, [
    projectId,
    enabled,
    cleanup,
    setBufferAnalyzing,
    setJobId,
    setLastAnalyzedHashes,
    // Removed onAnalysisComplete and onAnalysisError from dependencies
  ]);

  // 분석 트리거 (버퍼 flush 후 분석 시작)
  const triggerAnalysis = useCallback(async () => {
    if (!projectId) {
      console.log("[useProjectAnalysis] Trigger skipped: No projectId");
      return;
    }
    if (isAnalyzing) {
      console.log("[useProjectAnalysis] Trigger skipped: Already analyzing");
      return;
    }

    const { buffer: currentBuffer, lastAnalyzedHashes } =
      useAnalysisBufferStore.getState();

    if (currentBuffer.length === 0) {
      console.log("[useProjectAnalysis] Trigger skipped: Buffer empty");
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
      console.log(
        "[useProjectAnalysis] Trigger skipped: No content changes detected via hashing",
      );
      // Flush even if skipped? No, keep it in buffer until analyzed?
      // Actually, if it's already analyzed, we should clear the buffer.
      flush();
      return;
    }

    const bufferContent = flush();
    const documentIds = bufferContent.map((chunk) => chunk.documentId);

    console.log(
      "[useProjectAnalysis] Starting analysis for",
      documentIds.length,
      "documents",
    );

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
        console.log("[useProjectAnalysis] Job started:", lastJobId);
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
      console.log("[useProjectAnalysis] Force flush:", summary);
      await triggerAnalysis();
    }
  }, [getBufferSummary, triggerAnalysis]);

  // 자동 flush 체크 (주기적)
  useEffect(() => {
    if (!projectId || !enabled) return;

    const checkAutoFlush = () => {
      if (shouldAutoFlush()) {
        console.log("[useProjectAnalysis] Auto flush triggered");
        triggerAnalysis();
      }
    };

    // 1분마다 체크
    const intervalId = setInterval(checkAutoFlush, 60_000);

    return () => clearInterval(intervalId);
  }, [projectId, enabled, shouldAutoFlush, triggerAnalysis]);

  // Cleanup on unmount (Reset global analyzing state if needed? No, persist it)
  // But if components unmount, SSE closes. Job continues on server.
  // Re-mount should pick it up via currentJobId persistence.

  // Job Status Recovery (Page Reload / Re-mount handling)
  // If we have a currentJobId, check its status and update accordingly
  useEffect(() => {
    let mounted = true;

    const checkJobStatus = async () => {
      if (!currentJobId) {
        // No job ID - make sure we're not stuck in analyzing state
        if (isAnalyzing) {
          console.log(
            "[useProjectAnalysis] No job ID but isAnalyzing is true. Resetting.",
          );
          setBufferAnalyzing(false);
        }
        return;
      }

      try {
        console.log(
          "[useProjectAnalysis] Checking status for existing job:",
          currentJobId,
        );
        const status =
          await aiService.getJobStatus<AnalysisResultData>(currentJobId);

        if (!mounted) return;

        console.log("[useProjectAnalysis] Job status recovered:", status);

        const normalizedStatus = status.status.toLowerCase();

        if (normalizedStatus === "completed") {
          console.log(
            "[useProjectAnalysis] Job completed while disconnected. Finalizing.",
          );
          setAnalysisProgress(100);
          setBufferAnalyzing(false);
          setJobId(null);

          if (status.result) {
            onCompleteRef.current?.(status.result);
          }
        } else if (normalizedStatus === "failed") {
          console.log("[useProjectAnalysis] Job failed while disconnected.");
          setAnalysisError(status.error || "Analysis job failed");
          setBufferAnalyzing(false);
          setJobId(null);
          onErrorRef.current?.(status.error || "Analysis job failed");
        } else {
          // 'pending' or 'processing'
          console.log(
            "[useProjectAnalysis] Job still in progress. Syncing state.",
          );

          // Stuck Detection logic (Logging only)
          const currentProgress = status.progress || 0;
          if (currentProgress === lastProgressRef.current) {
            stuckCountRef.current += 1;
            if (stuckCountRef.current % 5 === 0) {
              console.log(
                `[useProjectAnalysis] Job progressing slowly... (Count: ${stuckCountRef.current})`,
              );
            }
          } else {
            stuckCountRef.current = 0;
            lastProgressRef.current = currentProgress;
          }

          // Do NOT force reset even if stuck, as analysis might take long (>10 mins)
          // Just continue polling via interval setup below.

          // Project Mismatch Check Removed (Store handles mapping via activeJobs)
          setBufferAnalyzing(true);
          setAnalysisProgress(currentProgress);
        }
      } catch (error: unknown) {
        console.warn("[useProjectAnalysis] Failed to check job status:", error);
        // If 404 or any error, the job is likely gone. Reset state.
        const axiosError = error as { response?: { status?: number } };
        if (axiosError?.response?.status === 404) {
          console.log(
            "[useProjectAnalysis] Job not found (404). Resetting state.",
          );
        } else {
          console.log(
            "[useProjectAnalysis] Job status check failed. Resetting state to be safe.",
          );
        }
        setBufferAnalyzing(false);
        setJobId(null);
      }
    };

    let intervalId: ReturnType<typeof setInterval> | undefined;

    // Run check immediately if we have a job ID
    if (currentJobId) {
      checkJobStatus();
      // Fallback: Poll every 4 seconds in case SSE fails
      intervalId = setInterval(checkJobStatus, 4000);
    }

    return () => {
      mounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [currentJobId, setBufferAnalyzing, setJobId, isAnalyzing]);

  return {
    isAnalyzing,
    analysisProgress,
    analysisError,
    triggerAnalysis,
    flushAndAnalyze,
  };
}
