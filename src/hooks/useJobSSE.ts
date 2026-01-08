import { useState, useEffect, useRef, useCallback } from "react";
import type {
  JobStatus,
  SSEProgressEvent,
  SSECompletedEvent,
  SSEFailedEvent,
} from "@/types/api";

interface UseJobSSEOptions<T> {
  enabled?: boolean;
  maxConnectionTime?: number; // ms, maximum time before timeout
  onComplete?: (result: T) => void;
  onError?: (error: string) => void;
  onTimeout?: () => void;
}

interface UseJobSSEReturn<T> {
  isConnected: boolean;
  jobStatus: JobStatus | null;
  progress: number;
  result: T | null;
  error: string | null;
}

/**
 * SSE 기반 Job 상태 구독 훅
 *
 * @param jobId - 구독할 Job ID
 * @param getStreamUrl - SSE 엔드포인트 URL을 반환하는 함수
 * @param options - 연결 옵션 및 콜백
 *
 * @example
 * ```tsx
 * const { isConnected, progress, result, error } = useJobSSE(
 *   jobId,
 *   (id) => aiService.getJobStreamUrl(id),
 *   { onComplete: (result) => console.log(result) }
 * );
 * ```
 */
export function useJobSSE<T = unknown>(
  jobId: string | null,
  getStreamUrl: (id: string) => string,
  options: UseJobSSEOptions<T> = {}
): UseJobSSEReturn<T> {
  const {
    enabled = true,
    maxConnectionTime,
    onComplete,
    onError,
    onTimeout,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Refs for cleanup and timeout
  const eventSourceRef = useRef<EventSource | null>(null);
  const startTimeRef = useRef<number>(0);
  const timeoutCheckRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Callbacks stored in refs to avoid stale closures
  const onCompleteRef = useRef(onComplete);
  const onErrorRef = useRef(onError);
  const onTimeoutRef = useRef(onTimeout);

  useEffect(() => {
    onCompleteRef.current = onComplete;
    onErrorRef.current = onError;
    onTimeoutRef.current = onTimeout;
  }, [onComplete, onError, onTimeout]);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (timeoutCheckRef.current) {
      clearInterval(timeoutCheckRef.current);
      timeoutCheckRef.current = null;
    }
    setIsConnected(false);
  }, []);

  // Track previous jobId to reset state on change (Derived State Pattern)
  const [prevJobId, setPrevJobId] = useState(jobId);
  if (jobId !== prevJobId) {
    setPrevJobId(jobId);
    if (jobId && enabled) {
      setJobStatus("pending");
      setProgress(0);
      setResult(null);
      setError(null);
    }
  }

  // Main SSE connection effect
  useEffect(() => {
    if (!jobId || !enabled) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      cleanup();
      return;
    }

    const url = getStreamUrl(jobId);
    startTimeRef.current = Date.now();

    // Create EventSource connection
    const eventSource = new EventSource(url, { withCredentials: true });
    eventSourceRef.current = eventSource;

    // Connection opened
    eventSource.onopen = () => {
      console.log(`[useJobSSE] Connection opened for jobId: ${jobId}`);
      setIsConnected(true);
      setJobStatus("processing");
    };

    // Heartbeat - connection health check
    eventSource.addEventListener("heartbeat", () => {
      setIsConnected(true);
      // Reset timeout timer on heartbeat
      startTimeRef.current = Date.now();
    });

    // Progress update
    eventSource.addEventListener("progress", (e) => {
      console.log(`[useJobSSE] Progress event for ${jobId}:`, e.data);
      try {
        const data = JSON.parse(e.data) as SSEProgressEvent;
        setProgress(data.percent);
        setJobStatus("processing");
      } catch {
        console.warn("[useJobSSE] Failed to parse progress event:", e.data);
      }
    });

    // Job completed
    eventSource.addEventListener("completed", (e) => {
      console.log(`[useJobSSE] Completed event for ${jobId}:`, e.data);
      try {
        const data = JSON.parse(e.data) as SSECompletedEvent<T>;
        setResult(data.result);
        setJobStatus("completed");
        setProgress(100);
        onCompleteRef.current?.(data.result);
        cleanup();
      } catch {
        console.error("[useJobSSE] Failed to parse completed event:", e.data);
      }
    });

    // Job failed
    eventSource.addEventListener("failed", (e) => {
      console.error(`[useJobSSE] Failed event for ${jobId}:`, e.data);
      try {
        const data = JSON.parse(e.data) as SSEFailedEvent;
        setError(data.error);
        setJobStatus("failed");
        onErrorRef.current?.(data.error);
        cleanup();
      } catch {
        console.error("[useJobSSE] Failed to parse failed event:", e.data);
      }
    });

    // Generic message update
    eventSource.onmessage = (e) => {
      console.log(`[useJobSSE] Generic message for ${jobId}:`, e.data);
      // If the backend doesn't use custom event types, it might send everything here
      try {
        const data = JSON.parse(e.data);
        if (data.type === "progress" || data.percent !== undefined) {
          setProgress(data.percent || 0);
          setJobStatus("processing");
        } else if (
          data.type === "completed" ||
          data.type === "success" ||
          data.status === "completed" ||
          data.status === "success" ||
          data.status === "done"
        ) {
          setResult(data.result);
          setJobStatus("completed");
          setProgress(100);
          onCompleteRef.current?.(data.result);
          cleanup();
        } else if (
          data.type === "failed" ||
          data.type === "error" ||
          data.status === "failed" ||
          data.status === "error"
        ) {
          setError(data.error || "Job failed");
          setJobStatus("failed");
          onErrorRef.current?.(data.error || "Job failed");
          cleanup();
        }
      } catch {
        // Not JSON or unknown format
      }
    };

    // Connection error
    eventSource.onerror = (e) => {
      console.error(`[useJobSSE] Error for jobId: ${jobId}`, e);
      console.log(
        `[useJobSSE] EventSource readyState: ${eventSource.readyState}`
      );

      // readyState 0 (CONNECTING) means it's trying to reconnect. Don't cleanup yet.
      // readyState 2 (CLOSED) means it gave up.
      if (eventSource.readyState === 2) {
        if (!result && jobStatus !== "completed") {
          setError("SSE 연결이 닫혔습니다.");
          setIsConnected(false);
          // Only cleanup if permanently closed
          cleanup();
        }
      } else {
        // Just mark as disconnected temporarily, let EventSource retry
        setIsConnected(false);
      }
    };

    // Timeout check interval
    if (maxConnectionTime) {
      timeoutCheckRef.current = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;
        if (elapsed > maxConnectionTime) {
          setError("연결 시간 초과");
          setJobStatus("failed");
          onTimeoutRef.current?.();
          cleanup();
        }
      }, 5000); // Check every 5 seconds
    }

    return cleanup;
  }, [jobId, enabled, getStreamUrl, cleanup, maxConnectionTime]);

  return {
    isConnected,
    jobStatus,
    progress,
    result,
    error,
  };
}
