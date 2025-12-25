import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  foreshadowingService,
  type CreateForeshadowingInput,
  type ForeshadowingStatus,
  type ForeshadowingImportance,
  type ForeshadowingAppearance,
} from "@/services/foreshadowingService";

// Query Keys
export const foreshadowingKeys = {
  all: ["foreshadowing"] as const,
  lists: () => [...foreshadowingKeys.all, "list"] as const,
  list: (
    projectId: string,
    params?: {
      status?: ForeshadowingStatus;
      importance?: ForeshadowingImportance;
    }
  ) => [...foreshadowingKeys.lists(), projectId, params] as const,
  unresolved: (projectId: string) =>
    [...foreshadowingKeys.lists(), projectId, "unresolved"] as const,
  details: () => [...foreshadowingKeys.all, "detail"] as const,
  detail: (id: string) => [...foreshadowingKeys.details(), id] as const,
};

/**
 * Hook for fetching foreshadowing items with filters
 */
export function useForeshadowing(
  projectId: string,
  params?: {
    status?: ForeshadowingStatus;
    importance?: ForeshadowingImportance;
  },
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: foreshadowingKeys.list(projectId, params),
    queryFn: async () => {
      const response = await foreshadowingService.getAll(projectId, params);
      return response.data;
    },
    enabled: options?.enabled !== false && !!projectId,
  });
}

/**
 * Hook for fetching unresolved foreshadowing only
 */
export function useUnresolvedForeshadowing(
  projectId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: foreshadowingKeys.unresolved(projectId),
    queryFn: async () => {
      const response = await foreshadowingService.getUnresolved(projectId);
      return response.data;
    },
    enabled: options?.enabled !== false && !!projectId,
  });
}

/**
 * Hook for fetching single foreshadowing detail
 */
export function useForeshadowingDetail(
  id: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: foreshadowingKeys.detail(id),
    queryFn: async () => {
      const response = await foreshadowingService.getById(id);
      return response.data;
    },
    enabled: options?.enabled !== false && !!id,
  });
}

/**
 * Hook for creating foreshadowing
 */
export function useCreateForeshadowing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      payload,
    }: {
      projectId: string;
      payload: CreateForeshadowingInput;
    }) => foreshadowingService.create(projectId, payload),
    onSuccess: (_data, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: foreshadowingKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: foreshadowingKeys.unresolved(projectId),
      });
    },
  });
}

/**
 * Hook for updating foreshadowing
 */
export function useUpdateForeshadowing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<
        CreateForeshadowingInput & { status: ForeshadowingStatus }
      >;
    }) => foreshadowingService.update(id, payload),
    onSettled: (_data, _error, { id }) => {
      queryClient.invalidateQueries({ queryKey: foreshadowingKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: foreshadowingKeys.lists() });
    },
  });
}

/**
 * Hook for deleting foreshadowing
 */
export function useDeleteForeshadowing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => foreshadowingService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: foreshadowingKeys.lists() });
    },
  });
}

/**
 * Hook for adding foreshadowing appearance
 */
export function useAddAppearance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      appearance,
    }: {
      id: string;
      appearance: Omit<ForeshadowingAppearance, "isRecovery">;
    }) => foreshadowingService.addAppearance(id, appearance),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: foreshadowingKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: foreshadowingKeys.lists() });
    },
  });
}

/**
 * Hook for marking foreshadowing as recovered
 */
export function useRecoverForeshadowing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      recoveryInfo,
    }: {
      id: string;
      recoveryInfo: {
        sceneId?: string;
        chapterId: string;
        chapterTitle: string;
        line: number;
        context: string;
      };
    }) => foreshadowingService.recover(id, recoveryInfo),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: foreshadowingKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: foreshadowingKeys.lists() });
    },
  });
}
