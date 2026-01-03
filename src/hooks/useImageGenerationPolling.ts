import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useJobPolling } from "./useJobPolling";
import {
  imageService,
  type ImageGenerationResult,
} from "@/services/imageService";

interface UseImageGenerationPollingOptions {
  enabled?: boolean;
  onComplete?: (imageUrl: string) => void;
  onError?: (error: string) => void;
  onTimeout?: () => void;
}

interface UseImageGenerationPollingResult {
  isGenerating: boolean;
  progress: number;
  error: string | null;
  imageUrl: string | null;
}

/**
 * Hook for polling AI image generation job status
 * Automatically invalidates character queries when image generation completes
 *
 * @param jobId - Image generation job ID (null if not started)
 * @param characterId - Character ID to update when complete
 * @param options - Polling configuration and callbacks
 * @returns Image generation status and result
 */
export function useImageGenerationPolling(
  jobId: string | null,
  characterId: string,
  options: UseImageGenerationPollingOptions = {},
): UseImageGenerationPollingResult {
  const queryClient = useQueryClient();
  const { enabled = true, onComplete, onError, onTimeout } = options;

  // Wrap onComplete to invalidate character queries
  const handleComplete = useCallback(
    (result: ImageGenerationResult) => {
      if (!result || !result.imageUrl) return;

      // Invalidate character queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ["characters"] });
      queryClient.invalidateQueries({
        queryKey: ["character", characterId],
      });

      // Call user's onComplete callback
      onComplete?.(result.imageUrl);
    },
    [characterId, queryClient, onComplete],
  );

  // Use generic job polling hook with image-specific typing
  const { jobStatus, progress, result, error, isPolling } =
    useJobPolling<ImageGenerationResult>(
      jobId,
      imageService.getImageJobStatus,
      {
        enabled,
        pollingInterval: 500, // Poll every 0.5 seconds for snappy updates
        maxPollingTime: 5 * 60 * 1000, // 5 minute timeout
        onComplete: handleComplete,
        onError,
        onTimeout,
      },
    );

  return {
    isGenerating:
      isPolling || jobStatus === "pending" || jobStatus === "processing",
    progress,
    error,
    imageUrl: result?.imageUrl || null,
  };
}
