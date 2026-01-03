/**
 * 프로젝트 레벨 SSE 연결 훅
 *
 * 에디터/월드 페이지 진입 시 SSE 연결을 생성하고,
 * 페이지 이탈 시 연결을 해제합니다.
 * 분석 버퍼의 flush를 트리거하고 결과를 수신합니다.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useAnalysisBufferStore } from "@/stores/useAnalysisBufferStore";
import { aiService } from "@/services/aiService";
import type {
  SSEProgressEvent,
  SSECompletedEvent,
  SSEFailedEvent,
} from "@/types/api";

const API_URL = import.meta.env.VITE_API_URL || "/api";

interface UseProjectSSEOptions {
  enabled?: boolean;
  onAnalysisComplete?: <T>(result: T) => void;
  onAnalysisError?: (error: string) => void;
}

interface UseProjectSSEReturn {
  isConnected: boolean;
  isAnalyzing: boolean;
  analysisProgress: number;
  analysisError: string | null;
  triggerAnalysis: () => Promise<void>;
  flushAndAnalyze: () => Promise<void>;
}

/**
 * 프로젝트 레벨 SSE 훅
 *
 * @param projectId - 프로젝트 ID
 * @param options - 옵션 및 콜백
 */
export function useProjectSSE(
  projectId: string | null,
  options: UseProjectSSEOptions = {}
): UseProjectSSEReturn {
  const { enabled = true, onAnalysisComplete, onAnalysisError } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const currentJobIdRef = useRef<string | null>(null);

  // 버퍼 스토어
  const {
    setProjectId,
    flush,
    shouldAutoFlush,
    setAnalyzing: setBufferAnalyzing,
    getBufferSummary,
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
    setIsConnected(false);
  }, []);

  // Job SSE 연결 (분석 시작 후)
  const connectToJob = useCallback(
    (jobId: string) => {
      cleanup();

      const url = `${API_URL}/ai/jobs/${jobId}/stream`;
      console.log("[useProjectSSE] Connecting to job SSE:", url);

      const eventSource = new EventSource(url, { withCredentials: true });
      eventSourceRef.current = eventSource;
      currentJobIdRef.current = jobId;

      eventSource.onopen = () => {
        console.log("[useProjectSSE] SSE connection opened for job:", jobId);
        setIsConnected(true);
      };

      eventSource.addEventListener("heartbeat", () => {
        console.log("[useProjectSSE] Heartbeat received");
        setIsConnected(true);
      });

      eventSource.addEventListener("progress", (e) => {
        try {
          const data = JSON.parse(e.data) as SSEProgressEvent;
          setAnalysisProgress(data.percent);
          console.log("[useProjectSSE] Progress:", data.percent + "%");
        } catch {
          console.warn("[useProjectSSE] Failed to parse progress:", e.data);
        }
      });

      eventSource.addEventListener("completed", (e) => {
        try {
          const data = JSON.parse(e.data) as SSECompletedEvent<unknown>;
          console.log("[useProjectSSE] Analysis completed");
          setIsAnalyzing(false);
          setBufferAnalyzing(false);
          setAnalysisProgress(100);
          onAnalysisComplete?.(data.result);
          cleanup();
        } catch {
          console.error("[useProjectSSE] Failed to parse completed:", e.data);
        }
      });

      eventSource.addEventListener("failed", (e) => {
        try {
          const data = JSON.parse(e.data) as SSEFailedEvent;
          console.error("[useProjectSSE] Analysis failed:", data.error);
          setAnalysisError(data.error);
          setIsAnalyzing(false);
          setBufferAnalyzing(false);
          onAnalysisError?.(data.error);
          cleanup();
        } catch {
          console.error("[useProjectSSE] Failed to parse failed:", e.data);
        }
      });

      eventSource.onerror = () => {
        console.error("[useProjectSSE] SSE connection error");
        setIsConnected(false);
        // 연결 에러 시에도 분석 상태는 유지 (재연결 시도 가능)
      };
    },
    [cleanup, onAnalysisComplete, onAnalysisError, setBufferAnalyzing]
  );

  // 분석 트리거 (버퍼 flush 후 분석 시작)
  const triggerAnalysis = useCallback(async () => {
    if (!projectId || isAnalyzing) return;

    const bufferContent = flush();

    if (bufferContent.length === 0) {
      console.log("[useProjectSSE] No content to analyze");
      return;
    }

    const documentIds = bufferContent.map((chunk) => chunk.documentId);
    console.log(
      "[useProjectSSE] Starting analysis for",
      documentIds.length,
      "documents"
    );

    setIsAnalyzing(true);
    setBufferAnalyzing(true);
    setAnalysisProgress(0);
    setAnalysisError(null);

    try {
      const response = await aiService.analyzeStory(projectId, documentIds);
      const jobId = response.data?.jobId;

      if (jobId) {
        connectToJob(jobId);
      } else {
        throw new Error("No jobId returned from analyze API");
      }
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Analysis request failed";
      setAnalysisError(errorMsg);
      setIsAnalyzing(false);
      setBufferAnalyzing(false);
      onAnalysisError?.(errorMsg);
    }
  }, [
    projectId,
    isAnalyzing,
    flush,
    setBufferAnalyzing,
    connectToJob,
    onAnalysisError,
  ]);

  // Flush and analyze (강제 실행)
  const flushAndAnalyze = useCallback(async () => {
    const summary = getBufferSummary();
    if (summary.charCount > 0) {
      console.log("[useProjectSSE] Force flush:", summary);
      await triggerAnalysis();
    }
  }, [getBufferSummary, triggerAnalysis]);

  // 자동 flush 체크 (주기적)
  useEffect(() => {
    if (!projectId || !enabled) return;

    const checkAutoFlush = () => {
      if (shouldAutoFlush()) {
        console.log("[useProjectSSE] Auto flush triggered");
        triggerAnalysis();
      }
    };

    // 1분마다 체크
    const intervalId = setInterval(checkAutoFlush, 60_000);

    return () => clearInterval(intervalId);
  }, [projectId, enabled, shouldAutoFlush, triggerAnalysis]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    isConnected,
    isAnalyzing,
    analysisProgress,
    analysisError,
    triggerAnalysis,
    flushAndAnalyze,
  };
}
