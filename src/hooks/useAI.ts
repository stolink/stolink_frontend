import { useMutation } from "@tanstack/react-query";
import { aiService } from "@/services/aiService";
import { useJobPolling } from "./useJobPolling";

// Types
interface ChatPayload {
  projectId: string;
  documentId?: string;
  message: string;
  context?: {
    includeCharacters?: boolean;
    includeForeshadowing?: boolean;
  };
}

interface ConsistencyCheckPayload {
  projectId: string;
  documentIds: string[];
}

/**
 * Hook for AI chat
 */
export function useAIChat() {
  return useMutation({
    mutationFn: (payload: ChatPayload) => aiService.chat(payload),
  });
}

/**
 * Hook for consistency check
 */
export function useConsistencyCheck() {
  return useMutation({
    mutationFn: (payload: ConsistencyCheckPayload) =>
      aiService.checkConsistency(payload),
  });
}

/**
 * Hook for story analysis (long-running job)
 * Returns jobId that can be used with useJobPolling
 */
export function useAnalyzeStory() {
  return useMutation({
    mutationFn: ({
      projectId,
      documentIds,
    }: {
      projectId: string;
      documentIds: string[];
    }) => aiService.analyzeStory(projectId, documentIds),
  });
}

/**
 * Hook for polling AI job status
 * Generic hook that works with any AI async operation
 */
export function useAIJobPolling<T = unknown>(
  jobId: string | null,
  options?: {
    enabled?: boolean;
    onComplete?: (result: T) => void;
    onError?: (error: string) => void;
  }
) {
  return useJobPolling<T>(
    jobId,
    (id) => aiService.getJobStatus<T>(id),
    options
  );
}
