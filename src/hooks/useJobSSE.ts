import { useState, useEffect, useRef, useCallback } from "react";
import type { JobStatus, JobResponse } from "@/types/api";

// ============================================
// Resilient SSE Constants
// ============================================
const MAX_RETRIES = 5;
const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 30000;
const POLLING_INTERVAL_MS = 3000;

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
  // Phase 1: 새로운 옵션
  maxRetries?: number; // 최대 재시도 횟수 (기본: 5)
  onReconnecting?: (attempt: number) => void; // 재연결 시도 콜백
  getJobStatus?: (jobId: string) => Promise<JobResponse<T> | null>; // Polling용 상태 조회 함수
}

interface UseJobSSEReturn<T> {
  isConnected: boolean;
  jobStatus: JobStatus | null;
  progress: number;
  result: T | null;
  error: string | null;
  // Phase 1: 새로운 반환값
  isPolling: boolean; // Polling 모드 여부
  retryCount: number; // 현재 재시도 횟수
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
    // Phase 1: 새로운 옵션
    maxRetries = MAX_RETRIES,
    onReconnecting,
    getJobStatus: getJobStatusFn,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Phase 1: 새로운 상태
  const [isPolling, setIsPolling] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Refs for cleanup and timeout
  const eventSourceRef = useRef<EventSource | null>(null);
  const startTimeRef = useRef<number>(0);
  const timeoutCheckRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Phase 1: 재시도 및 Polling 관련 refs
  const retryCountRef = useRef(0);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  // Callbacks stored in refs to avoid stale closures
  const onCompleteRef = useRef(onComplete);
  const onErrorRef = useRef(onError);
  const onTimeoutRef = useRef(onTimeout);
  const onMessageRef = useRef(onMessage);
  const onReconnectingRef = useRef(onReconnecting);
  const getJobStatusRef = useRef(getJobStatusFn);

  // State refs for onerror handler (stale closure 방지)
  const resultRef = useRef<T | null>(null);
  const jobStatusRef = useRef<JobStatus | null>(null);

  useEffect(() => {
    onCompleteRef.current = onComplete;
    onErrorRef.current = onError;
    onTimeoutRef.current = onTimeout;
    onMessageRef.current = onMessage;
    onReconnectingRef.current = onReconnecting;
    getJobStatusRef.current = getJobStatusFn;
  }, [
    onComplete,
    onError,
    onTimeout,
    onMessage,
    onReconnecting,
    getJobStatusFn,
  ]);

  // Keep state refs in sync
  useEffect(() => {
    resultRef.current = result;
    jobStatusRef.current = jobStatus;
  }, [result, jobStatus]);

  // ============================================
  // Phase 2: Exponential Backoff Helper
  // ============================================
  const calculateBackoffDelay = useCallback((attempt: number): number => {
    const exponentialDelay = BASE_DELAY_MS * Math.pow(2, attempt);
    const jitter = Math.random() * 1000; // 0~1초 랜덤 지터
    return Math.min(exponentialDelay + jitter, MAX_DELAY_MS);
  }, []);

  // ============================================
  // Phase 1 & 3: Cleanup function (확장)
  // ============================================
  const cleanup = useCallback(() => {
    // SSE 연결 정리
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    // 타임아웃 체크 정리
    if (timeoutCheckRef.current) {
      clearInterval(timeoutCheckRef.current);
      timeoutCheckRef.current = null;
    }
    // Phase 2: 재연결 타이머 정리
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    // Phase 3: Polling 정리
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    setIsConnected(false);
    setIsPolling(false);
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
      // Phase 1: 재시도 카운트 리셋
      retryCountRef.current = 0;
      setRetryCount(0);
    }
  }

  // ============================================
  // Phase 3: Polling Fallback
  // ============================================
  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  const startPollingFallback = useCallback(() => {
    if (!jobId || !getJobStatusRef.current) {
      console.warn(
        "[useJobSSE] Polling fallback 불가: getJobStatus 함수 미제공",
      );
      return;
    }

    console.log("[useJobSSE] SSE 실패, Polling Fallback 시작");
    setIsPolling(true);
    setError(null); // 에러 상태 클리어

    pollIntervalRef.current = setInterval(async () => {
      try {
        const status = await getJobStatusRef.current!(jobId);

        if (!status) return;

        // 진행률 업데이트
        if (status.progress !== undefined) {
          setProgress(status.progress);
        }

        // 완료 처리
        if (status.status === "completed") {
          setResult(status.result as T);
          setJobStatus("completed");
          setProgress(100);
          onCompleteRef.current?.(status.result as T);
          stopPolling();
          cleanup();
        }
        // 실패 처리
        else if (status.status === "failed") {
          setError(status.error || "Job failed");
          setJobStatus("failed");
          onErrorRef.current?.(status.error || "Job failed");
          stopPolling();
          cleanup();
        }
        // 진행 중
        else {
          setJobStatus("processing");
        }
      } catch (err) {
        console.error("[useJobSSE] Polling 오류:", err);
      }
    }, POLLING_INTERVAL_MS);
  }, [jobId, cleanup, stopPolling]);

  // ============================================
  // Phase 2: 재연결 함수 (Exponential Backoff)
  // ============================================
  const reconnect = useCallback(() => {
    if (!jobId || !enabled) return;

    // 최대 재시도 횟수 초과 시 Polling Fallback
    if (retryCountRef.current >= maxRetries) {
      console.log(
        `[useJobSSE] 최대 재시도 횟수(${maxRetries}) 초과, Polling 전환`,
      );
      startPollingFallback();
      return;
    }

    const attempt = retryCountRef.current;
    const delay = calculateBackoffDelay(attempt);

    console.log(
      `[useJobSSE] 재연결 시도 ${attempt + 1}/${maxRetries} (${Math.round(delay)}ms 후)`,
    );

    // 재연결 콜백 호출
    onReconnectingRef.current?.(attempt + 1);

    retryCountRef.current++;
    setRetryCount(retryCountRef.current);

    // 기존 연결 정리
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    // 지연 후 재연결
    reconnectTimeoutRef.current = setTimeout(() => {
      const url = getStreamUrl(jobId);
      const newEventSource = new EventSource(url, { withCredentials: true });
      eventSourceRef.current = newEventSource;

      // 재연결 성공 시 카운트 리셋
      newEventSource.onopen = () => {
        console.log("[useJobSSE] 재연결 성공!");
        retryCountRef.current = 0;
        setRetryCount(0);
        setIsConnected(true);
        setJobStatus("processing");
        startTimeRef.current = Date.now();
      };

      // 재연결 후에도 onerror는 기존 로직 따름 (아래 Main effect에서 처리)
      newEventSource.onerror = () => {
        if (newEventSource.readyState === 2) {
          if (!resultRef.current && jobStatusRef.current !== "completed") {
            reconnect(); // 재귀 호출로 다시 시도
          }
        } else {
          setIsConnected(false);
        }
      };
    }, delay);
  }, [
    jobId,
    enabled,
    maxRetries,
    getStreamUrl,
    calculateBackoffDelay,
    startPollingFallback,
  ]);

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
    // Phase 2: Exponential Backoff 적용
    eventSource.onerror = () => {
      // readyState 0 (CONNECTING): 브라우저 자동 재연결 중
      // readyState 2 (CLOSED): 연결 완전 종료
      if (eventSource.readyState === 2) {
        // 이미 완료된 경우 무시
        if (resultRef.current || jobStatusRef.current === "completed") {
          return;
        }

        // Phase 2: reconnect 함수로 Exponential Backoff 재연결
        console.log("[useJobSSE] SSE 연결 끊김, 재연결 시도");
        reconnect();
      } else {
        // 일시적 끊김 - 상태만 변경
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
  }, [jobId, enabled, getStreamUrl, cleanup, maxConnectionTime, reconnect]);

  return {
    isConnected,
    jobStatus,
    progress,
    result,
    error,
    // Phase 1: 새로운 반환값
    isPolling,
    retryCount,
  };
}
