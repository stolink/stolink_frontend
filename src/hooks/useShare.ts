import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
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
        // Axios 에러의 404 상태 코드 처리: 공유 링크 미존재 시 null 반환
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          return null;
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
