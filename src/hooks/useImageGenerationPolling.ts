import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useJobPolling } from "./useJobPolling";
import { characterKeys } from "./useCharacters";
import type { Character } from "@/types";
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

      // Force cache bust to ensure browser fetches the new image content
      const timestamp = Date.now();
      const newImageUrl = result.imageUrl.includes("?")
        ? `${result.imageUrl}&t=${timestamp}`
        : `${result.imageUrl}?t=${timestamp}`;

      // 1. Update Detail Cache immediately
      queryClient.setQueryData(
        characterKeys.detail(characterId),
        (old: unknown) => {
          const char = old as Character | undefined;
          return char ? { ...char, imageUrl: newImageUrl } : char;
        },
      );

      // Fuzzy update all detail queries
      queryClient.setQueriesData(
        { queryKey: characterKeys.details() },
        (old: unknown) => {
          const char = old as Character | undefined;
          return char && char._id === characterId
            ? { ...char, imageUrl: newImageUrl }
            : char;
        },
      );

      // 2. Update List Cache immediately (Iterate all lists)
      queryClient.setQueriesData(
        { queryKey: characterKeys.lists() },
        (old: unknown) => {
          const list = old as Character[] | undefined;
          if (!list) return list;
          let matchCount = 0;
          const result = list.map((char) => {
            if (char._id === characterId) {
              matchCount++;
              return { ...char, imageUrl: newImageUrl };
            }
            return char;
          });
          console.log(
            `[Polling] List Cache Update in progress. Matches found: ${matchCount} for ID: ${characterId}`,
          );
          return result;
        },
      );

      console.log("[Polling] Manual Cache Update Executed. URL:", newImageUrl);

      // 3. Remove immediate invalidation to prevent stale data overwrite
      // We rely completely on the manual update above for immediate feedback.
      // The data will eventually sync when the user navigates away or refreshes explicitly.

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
