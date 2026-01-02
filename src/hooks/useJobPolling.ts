import { useState, useEffect } from "react";
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
  const [prevJobId, setPrevJobId] = useState(jobId);

  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  // Derived state for jobId changes
  if (jobId !== prevJobId) {
    setPrevJobId(jobId);
    if (jobId && enabled) {
      setJobStatus("pending");
      setProgress(0);
      setResult(null);
      setError(null);
    } else if (!jobId) {
      setJobStatus(null);
      setProgress(0);
      setResult(null);
      setError(null);
    }
  }

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const pollIntervalId: NodeJS.Timeout[] = [];

    if (!jobId || !enabled) {
      return;
    }

    const poll = async () => {
      try {
        const response = await checkStatusFn(jobId);

        // Case-insensitive status check to handle "COMPLETED" vs "completed"
        const currentStatus = response.status?.toLowerCase();

        if (currentStatus === "completed") {
          // If response.result is missing, assume the response itself contains the result data (flattened structure)
          const resultData = (response.result || response) as T;

          setIsPolling(false);
          setJobStatus("completed");
          setProgress(100);
          setResult(resultData);
          onComplete?.(resultData);
          clearInterval(pollIntervalId);
          clearTimeout(timeoutId);
        } else if (currentStatus === "failed") {
          setIsPolling(false);
          setJobStatus("failed");
          setError(response.error || "Job failed");
          onError?.(response.error || "Job failed");
          clearInterval(pollIntervalId);
          clearTimeout(timeoutId);
        } else {
          setJobStatus(response.status as JobStatus); // Keep original casing for state
          if (typeof response.progress === "number") {
            setProgress(response.progress);
          }
        }
      } catch {
        // Silent error handling for polling
      }
    };

    setIsPolling(true);
    poll(); // Initial check

    const intervalId = setInterval(poll, pollingInterval);
    pollIntervalId.push(intervalId);

    if (maxPollingTime) {
      timeoutId = setTimeout(() => {
        setIsPolling(false);
        setJobStatus("failed");
        setError("Polling timeout");
        clearInterval(pollIntervalId);
        onTimeout?.();
      }, maxPollingTime);
    }

    return () => {
      pollIntervalId.forEach((id) => clearInterval(id));
      clearTimeout(timeoutId);
      setIsPolling(false);
    };
  }, [
    jobId,
    enabled,
    pollingInterval,
    maxPollingTime,
    checkStatusFn,
    onComplete,
    onError,
    onTimeout,
  ]);

  return {
    jobStatus,
    progress,
    result,
    error,
    isPolling,
  };
}
