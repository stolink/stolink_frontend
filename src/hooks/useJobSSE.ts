import { useState, useEffect, useRef, useCallback } from "react";
import type { JobStatus } from "@/types/api";

interface SSEMessage {
  status?: string;
  type?: string;
  percent?: number;
  progress?: number;
  completedDocuments?: number;
  totalDocuments?: number;
  result?: unknown;
  error?: string;
}

interface UseJobSSEOptions<T> {
  enabled?: boolean;
  maxConnectionTime?: number; // ms, maximum time before timeout
  onComplete?: (result: T) => void;
  onError?: (error: string) => void;
  onTimeout?: () => void;
  onMessage?: (data: unknown) => void;
  terminateOnComplete?: boolean;
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
  options: UseJobSSEOptions<T> = {},
): UseJobSSEReturn<T> {
  const {
    enabled = true,
    maxConnectionTime,
    onComplete,
    onError,
    onTimeout,
    onMessage,
    terminateOnComplete = true,
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
  const onMessageRef = useRef(onMessage);

  // State refs for onerror handler (stale closure 방지)
  const resultRef = useRef<T | null>(null);
  const jobStatusRef = useRef<JobStatus | null>(null);

  useEffect(() => {
    onCompleteRef.current = onComplete;
    onErrorRef.current = onError;
    onTimeoutRef.current = onTimeout;
    onMessageRef.current = onMessage;
  }, [onComplete, onError, onTimeout, onMessage]);

  // Keep state refs in sync
  useEffect(() => {
    resultRef.current = result;
    jobStatusRef.current = jobStatus;
  }, [result, jobStatus]);

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
      cleanup();
      return;
    }

    const url = getStreamUrl(jobId);
    startTimeRef.current = Date.now();

    // Create EventSource connection
    const eventSource = new EventSource(url, { withCredentials: true });
    eventSourceRef.current = eventSource;

    // Shared message processing logic
    const processMessageData = (
      data: Record<string, unknown>,
      eventType?: string,
    ) => {
      try {
        const msgData = data as unknown as SSEMessage;
        onMessageRef.current?.({ ...msgData, eventType });

        // Normalize status/type for comparison
        const status = (msgData.status || "").toLowerCase();
        const type = (msgData.type || eventType || "").toLowerCase();

        // Check terminal states first (Completion/Success then Failure)
        // This ensures the final message with 100% progress counts as "completed"
        if (
          type === "completed" ||
          type === "success" ||
          status === "completed" ||
          status === "success" ||
          status === "done"
        ) {
          setResult(msgData.result as T);
          setJobStatus("completed");
          setProgress(100);
          onCompleteRef.current?.(msgData.result as T);
          if (terminateOnComplete) {
            cleanup();
          }
        } else if (
          type === "failed" ||
          type === "error" ||
          status === "failed" ||
          status === "error"
        ) {
          setError(msgData.error || "Job failed");
          setJobStatus("failed");
          onErrorRef.current?.(msgData.error || "Job failed");
          cleanup();
        }
        // Progress / Processing (Only if not terminal)
        else if (
          type === "progress" ||
          status === "analyzing" ||
          status === "processing" ||
          msgData.percent !== undefined ||
          msgData.completedDocuments !== undefined
        ) {
          const newProgress =
            msgData.percent ??
            (msgData.totalDocuments
              ? Math.floor(
                  ((msgData.completedDocuments || 0) / msgData.totalDocuments) *
                    100,
                )
              : (msgData.completedDocuments || 0) > 0
                ? 100
                : 0);

          setProgress(newProgress);
          setJobStatus("processing");
        }
      } catch (err) {
        console.error("[useJobSSE] Error processing message data:", err);
      }
    };

    // Connection opened
    eventSource.onopen = () => {
      setIsConnected(true);
      setJobStatus("processing");
    };

    // Heartbeat - connection health check
    eventSource.addEventListener("heartbeat", () => {
      setIsConnected(true);
      // Reset timeout timer on heartbeat
      startTimeRef.current = Date.now();
    });

    // Support backend-specific named events
    const namedEvents = [
      "status",
      "progress",
      "completed",
      "failed",
      "connected",
    ];
    namedEvents.forEach((evType) => {
      eventSource.addEventListener(evType, (e) => {
        try {
          const data = JSON.parse(e.data);
          processMessageData(data, evType);
          if (evType === "connected") {
            setIsConnected(true);
          }
        } catch (_err) {
          // Silently fail on malformed data
        }
      });
    });

    // Generic message update (unnamed events)
    eventSource.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        processMessageData(data);
      } catch (_e) {
        // Silently fail on manual close
      }
    };

    // Connection error
    eventSource.onerror = () => {
      /* Error handling is done by browser-native reconnection */
      // readyState 0 (CONNECTING) means it's trying to reconnect. Don't cleanup yet.
      // readyState 2 (CLOSED) means it gave up.
      if (eventSource.readyState === 2) {
        // Use refs to get latest state (stale closure 방지)
        if (!resultRef.current && jobStatusRef.current !== "completed") {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId, enabled, getStreamUrl, cleanup, maxConnectionTime]);

  return {
    isConnected,
    jobStatus,
    progress,
    result,
    error,
  };
}
