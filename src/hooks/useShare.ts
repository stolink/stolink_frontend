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
 * Hook for fetching share settings.
 * Returns null if sharing is not enabled (404 response handled in shareService).
 */
export function useShareSettings(
  projectId: string,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: shareKeys.settings(projectId),
    queryFn: async () => {
      const response = await shareService.getSettings(projectId);
      return response.data;
    },
    enabled: options?.enabled !== false && !!projectId,
    retry: false, // 공유 미활성화는 재시도 불필요
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
      // 삭제 성공 시 즉시 캐시를 null로 설정하여 UI 즉시 갱신
      queryClient.setQueryData(shareKeys.settings(projectId), null);
    },
    onError: (_error, projectId) => {
      // 삭제 실패 시 캐시 무효화로 다음 조회에서 리페치
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
