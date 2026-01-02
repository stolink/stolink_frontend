import { useState, useEffect, useRef, useCallback } from "react";
import type { JobResponse, JobStatus } from "@/types/api";

interface UseJobPollingOptions<T> {
  enabled?: boolean;
  pollingInterval?: number; // ms, default 2000
  maxPollingTime?: number; // ms, maximum time to poll before timeout
  onComplete?: (result: T) => void;
  onError?: (error: string) => void;
  onTimeout?: () => void;
}

export function useJobPolling<T = unknown>(
  jobId: string | null,
  checkStatusFn: (id: string) => Promise<JobResponse<T>>,
  options: UseJobPollingOptions<T> = {},
) {
  const {
    enabled = true,
    pollingInterval = 2000,
    maxPollingTime,
    onComplete,
    onError,
    onTimeout,
  } = options;

  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [prevJobId, setPrevJobId] = useState(jobId);

  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  // Reset state when jobId changes (Derived State Pattern)
  if (jobId !== prevJobId) {
    setPrevJobId(jobId);
    if (jobId && enabled) {
      setJobStatus("pending");
      setProgress(0);
      setResult(null);
      setError(null);
    }
  }

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unmountedRef = useRef(false);
  const pollRef = useRef<() => void>(() => {});
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    unmountedRef.current = false;
    return () => {
      unmountedRef.current = true;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // 폴링 응답 처리 (복잡도 분산)
  const handlePollResponse = useCallback(
    (response: JobResponse<T>): boolean => {
      setJobStatus(response.status);
      setProgress(response.progress || 0);

      if (response.status === "completed") {
        const resultData = response.result as T;
        setResult(resultData);
        setIsPolling(false);
        onComplete?.(resultData);
        return true; // Stop polling
      }

      if (response.status === "failed") {
        const errorMsg = response.error || "Job failed";
        setError(errorMsg);
        setIsPolling(false);
        onError?.(errorMsg);
        return true; // Stop polling
      }

      return false; // Continue polling
    },
    [onComplete, onError],
  );

  const poll = useCallback(async () => {
    if (!jobId || !enabled || unmountedRef.current) return;

    // Check timeout
    if (maxPollingTime && startTimeRef.current) {
      const elapsed = Date.now() - startTimeRef.current;
      if (elapsed > maxPollingTime) {
        setError("Polling timeout exceeded");
        setIsPolling(false);
        onTimeout?.();
        return;
      }
    }

    try {
      setIsPolling(true);
      const response = await checkStatusFn(jobId);

      if (unmountedRef.current) return;

      const shouldStop = handlePollResponse(response);
      if (shouldStop) return;

      // Continue polling - use ref to avoid stale closure
      timeoutRef.current = setTimeout(
        () => pollRef.current?.(),
        pollingInterval,
      );
    } catch (err) {
      if (unmountedRef.current) return;

      const errorMsg = err instanceof Error ? err.message : "Polling failed";
      setError(errorMsg);
      setIsPolling(false);
      onError?.(errorMsg);
    }
  }, [
    jobId,
    enabled,
    maxPollingTime,
    pollingInterval,
    checkStatusFn,
    handlePollResponse,
    onTimeout,
    onError,
  ]);

  // Keep pollRef in sync
  useEffect(() => {
    pollRef.current = poll;
  }, [poll]);

  // Reset state when jobId changes (separate from polling logic)
  useEffect(() => {
    if (jobId && enabled) {
      startTimeRef.current = Date.now();
    }
  }, [jobId, enabled]);

  // Start polling when jobId changes
  useEffect(() => {
    if (jobId && enabled) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      poll();
    } else {
      setIsPolling(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    }
  }, [jobId, enabled, poll]);

  return {
    jobStatus,
    progress,
    result,
    error,
    isPolling,
  };
}
