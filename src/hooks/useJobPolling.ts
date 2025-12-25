/* eslint-disable react-hooks/set-state-in-effect */
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
  options: UseJobPollingOptions<T> = {}
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
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);

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

  const poll = useCallback(async () => {
    if (!jobId || !enabled || unmountedRef.current) return;

    // Check timeout
    if (maxPollingTime && startTimeRef.current) {
      const elapsed = Date.now() - startTimeRef.current;
      if (elapsed > maxPollingTime) {
        setError("Polling timeout exceeded");
        setIsPolling(false);
        if (onTimeout) onTimeout();
        return;
      }
    }

    try {
      setIsPolling(true);
      const response = await checkStatusFn(jobId);

      if (unmountedRef.current) return;

      setJobStatus(response.status);
      setProgress(response.progress || 0);

      if (response.status === "completed") {
        const resultData = response.result as T;
        setResult(resultData);
        setIsPolling(false);
        if (onComplete) onComplete(resultData);
        return; // Stop polling
      }

      if (response.status === "failed") {
        const errorMsg = response.error || "Job failed";
        setError(errorMsg);
        setIsPolling(false);
        if (onError) onError(errorMsg);
        return; // Stop polling
      }

      // Continue polling - use ref to avoid stale closure
      timeoutRef.current = setTimeout(
        () => pollRef.current?.(),
        pollingInterval
      );
    } catch (err) {
      if (unmountedRef.current) return;

      const errorMsg = err instanceof Error ? err.message : "Polling failed";
      setError(errorMsg);
      setIsPolling(false);
      if (onError) onError(errorMsg);
    }
  }, [
    jobId,
    enabled,
    maxPollingTime,
    pollingInterval,
    checkStatusFn,
    onComplete,
    onError,
    onTimeout,
  ]);

  // Keep pollRef in sync
  useEffect(() => {
    pollRef.current = poll;
  }, [poll]);

  // Reset state when jobId changes (separate from polling logic)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    if (jobId && enabled) {
      setJobStatus("pending");
      setProgress(0);
      setResult(null);
      setError(null);
      startTimeRef.current = Date.now();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId, enabled]);

  // Start polling when jobId changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    if (jobId && enabled) {
      poll();
    } else {
      setIsPolling(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId, enabled, poll]);

  return {
    jobStatus,
    progress,
    result,
    error,
    isPolling,
  };
}
