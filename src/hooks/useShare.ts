import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { shareService } from "@/services/shareService";

// Query Keys
export const shareKeys = {
  all: ["share"] as const,
  settings: (projectId: string) =>
    [...shareKeys.all, "settings", projectId] as const,
  publics: () => [...shareKeys.all, "public"] as const,
  public: (shareId: string, password?: string) =>
    [...shareKeys.publics(), shareId, password] as const,
};

/**
 * Hook for fetching share settings
 * Returns null if share is not enabled (404)
 */
export function useShareSettings(
  projectId: string,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: shareKeys.settings(projectId),
    queryFn: async () => {
      try {
        const response = await shareService.getSettings(projectId);
        return response.data;
      } catch (error) {
        // 404 means no share link exists - return null instead of throwing
        if (error && typeof error === "object" && "response" in error) {
          const axiosError = error as { response?: { status?: number } };
          if (axiosError.response?.status === 404) {
            return null;
          }
        }
        throw error;
      }
    },
    enabled: options?.enabled !== false && !!projectId,
    retry: false, // Don't retry if share is not enabled
  });
}

/**
 * Hook for creating a share link
 */
export function useCreateShareLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      options,
    }: {
      projectId: string;
      options?: { expiresIn?: string; password?: string };
    }) => shareService.create(projectId, options),
    onSuccess: (_data, { projectId }) => {
      queryClient.invalidateQueries({
        queryKey: shareKeys.settings(projectId),
      });
    },
  });
}

/**
 * Hook for disabling share link
 */
export function useDeleteShareLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId: string) => shareService.disable(projectId),
    onSuccess: (_data, projectId) => {
      // Immediately set cache to null for instant UI update
      queryClient.setQueryData(shareKeys.settings(projectId), null);
    },
  });
}

/**
 * Hook for accessing shared project (public, no auth)
 */
export function useSharedProject(
  shareId: string,
  password?: string,
  options?: {
    enabled?: boolean;
    retry?:
      | boolean
      | number
      | ((failureCount: number, error: Error) => boolean);
  },
) {
  return useQuery({
    queryKey: shareKeys.public(shareId, password),
    queryFn: async () => {
      const response = await shareService.getShared(shareId, password);
      return response.data;
    },
    enabled: options?.enabled !== false && !!shareId,
    retry: options?.retry ?? false,
  });
}
