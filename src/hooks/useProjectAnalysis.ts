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

const API_URL = import.meta.env.VITE_API_URL || "/api";

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

  // 버퍼 스토어 (Global State)
  const {
    setProjectId,
    flush,
    shouldAutoFlush,
    setAnalyzing: setBufferAnalyzing, // Store setter
    getBufferSummary,
    currentJobId,
    setJobId,
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

  // Job SSE 연결 (currentJobId 감지)
  useEffect(() => {
    if (!currentJobId || !enabled) {
      cleanup();
      return;
    }

    // 이미 연결된 경우 Skip (단, ID가 다르면 재연결)
    // NOTE: React StrictMode may cause double connect, but cleanup handles it.

    cleanup();

    const url = `${API_URL}/ai/jobs/${currentJobId}/stream`;
    console.log("[useProjectAnalysis] Connecting to job SSE:", url);

    const eventSource = new EventSource(url, { withCredentials: true });
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log(
        "[useProjectAnalysis] SSE connection opened for job:",
        currentJobId,
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
          onAnalysisComplete?.(data.result);
        }
        cleanup();
      } catch (err) {
        console.error(
          "[useProjectAnalysis] Failed to parse completed:",
          e.data,
          err,
        );
        setAnalysisError("Failed to parse analysis result");
        setBufferAnalyzing(false);
        setJobId(null);
        onAnalysisError?.("Failed to parse analysis result");
        cleanup();
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
        onAnalysisError?.(data.error);
        cleanup();
      } catch {
        console.error("[useProjectAnalysis] Failed to parse failed:", e.data);
        cleanup();
      }
    });

    eventSource.onerror = (e) => {
      console.error("[useProjectAnalysis] SSE connection error", e);
      // Don't close immediately on generic error, wait for retry or explicit failed event?
      // Standard EventSource re-connects automatically.
      // But if it's a fatal error (404, 500), we might want to stop.
      // For now, let it retry or rely on heartbeat timeout (backend side).
      // However, if we need to detect disconnect:
      if (eventSource.readyState === EventSource.CLOSED) {
        setBufferAnalyzing(false);
        setJobId(null);
      }
    };

    return () => {
      cleanup();
    };
  }, [
    currentJobId,
    enabled,
    cleanup,
    setBufferAnalyzing,
    setJobId,
    onAnalysisComplete,
    onAnalysisError,
  ]);

  // 분석 트리거 (버퍼 flush 후 분석 시작)
  const triggerAnalysis = useCallback(async () => {
    if (!projectId || isAnalyzing) return;

    const bufferContent = flush();

    if (bufferContent.length === 0) {
      console.log("[useProjectAnalysis] No content to analyze");
      return;
    }

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
      const response = await aiService.analyzeStory(projectId, documentIds);
      const jobId = response.data?.jobId;

      if (jobId) {
        console.log("[useProjectAnalysis] Job started:", jobId);
        setJobId(jobId); // This triggers the SSE useEffect
      } else {
        throw new Error("No jobId returned from analyze API");
      }
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Analysis request failed";
      setAnalysisError(errorMsg);
      setBufferAnalyzing(false);
      onAnalysisError?.(errorMsg);
    }
  }, [
    projectId,
    isAnalyzing,
    flush,
    setBufferAnalyzing,
    onAnalysisError,
    setJobId,
  ]);

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

  return {
    isAnalyzing,
    analysisProgress,
    analysisError,
    triggerAnalysis,
    flushAndAnalyze,
  };
}
