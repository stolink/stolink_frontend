import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { shareService } from "@/services/shareService";

// Query Keys
export const shareKeys = {
  all: ["share"] as const,
  settings: (projectId: string) =>
    [...shareKeys.all, "settings", projectId] as const,
};

/**
 * Hook for fetching share settings
 */
export function useShareSettings(
  projectId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: shareKeys.settings(projectId),
    queryFn: async () => {
      const response = await shareService.getSettings(projectId);
      return response.data;
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
      queryClient.invalidateQueries({
        queryKey: shareKeys.settings(projectId),
      });
    },
  });
}

/**
 * Hook for accessing shared project (public, no auth)
 */
export function useSharedProject(
  shareId: string,
  password?: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: [...shareKeys.all, "public", shareId, password] as const,
    queryFn: async () => {
      const response = await shareService.getShared(shareId, password);
      return response.data;
    },
    enabled: options?.enabled !== false && !!shareId,
    retry: false,
  });
}
