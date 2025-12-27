import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  projectService,
  type Project,
  type ProjectListParams,
} from "@/services/projectService";
import { useAuthStore } from "@/stores";

// Query Keys
export const projectKeys = {
  all: ["projects"] as const,
  lists: () => [...projectKeys.all, "list"] as const,
  list: (params?: ProjectListParams) =>
    [...projectKeys.lists(), params] as const,
  details: () => [...projectKeys.all, "detail"] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
  stats: (id: string) => [...projectKeys.detail(id), "stats"] as const,
};

/**
 * Hook for fetching project list with filters
 */
export function useProjects(params?: ProjectListParams) {
  const { user, isAuthenticated, hasHydrated } = useAuthStore();

  return useQuery({
    queryKey: projectKeys.list(params),
    queryFn: async () => {
      const response = await projectService.getAll(params);
      return response.data;
    },
    // Only fetch after hydration is complete and user is authenticated
    enabled: hasHydrated && isAuthenticated && !!user?.id,
  });
}

/**
 * Hook for fetching single project
 */
export function useProject(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: async () => {
      const response = await projectService.getById(id);
      return response.data;
    },
    enabled: options?.enabled !== false && !!id,
  });
}

/**
 * Hook for creating a new project
 */
export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Pick<Project, "title" | "genre" | "description">) =>
      projectService.create(payload),
    onSuccess: () => {
      // Invalidate all project lists
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}

/**
 * Hook for updating a project
 * 업데이트 시 목록 순서를 유지하면서 데이터를 동기화합니다.
 */
export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Project> }) =>
      projectService.update(id, payload),
    onMutate: async ({ id, payload }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: projectKeys.detail(id) });
      await queryClient.cancelQueries({ queryKey: projectKeys.lists() });

      // Snapshot previous values
      const previousDetail = queryClient.getQueryData(projectKeys.detail(id));
      const previousLists = queryClient.getQueriesData({
        queryKey: projectKeys.lists(),
      });

      // 현재 순서 저장 (ID 배열)
      const currentOrder: string[] = [];
      previousLists.forEach(([, data]) => {
        const listData = data as { projects?: Project[] } | undefined;
        if (listData?.projects) {
          listData.projects.forEach((p) => {
            if (!currentOrder.includes(p.id)) {
              currentOrder.push(p.id);
            }
          });
        }
      });

      // Optimistically update detail
      queryClient.setQueryData(
        projectKeys.detail(id),
        (old: Project | undefined) => (old ? { ...old, ...payload } : old),
      );

      // Optimistically update lists (순서 유지하면서 데이터만 변경)
      queryClient.setQueriesData(
        { queryKey: projectKeys.lists() },
        (old: { projects?: Project[] } | undefined) => {
          if (!old?.projects) return old;
          return {
            ...old,
            projects: old.projects.map((p: Project) =>
              p.id === id ? { ...p, ...payload } : p,
            ),
          };
        },
      );

      return { previousDetail, previousLists, id, currentOrder };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousDetail) {
        queryClient.setQueryData(
          projectKeys.detail(context.id),
          context.previousDetail,
        );
      }
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: async (_data, { id }, context) => {
      // 서버에서 최신 데이터 가져오기
      await queryClient.invalidateQueries({ queryKey: projectKeys.detail(id) });
      await queryClient.invalidateQueries({ queryKey: projectKeys.lists() });

      // 재조회 후 기존 순서로 복원
      if (context?.currentOrder && context.currentOrder.length > 0) {
        queryClient.setQueriesData(
          { queryKey: projectKeys.lists() },
          (old: { projects?: Project[]; pagination?: unknown } | undefined) => {
            if (!old?.projects) return old;

            // 기존 순서대로 정렬
            const sortedProjects = [...old.projects].sort((a, b) => {
              const indexA = context.currentOrder.indexOf(a.id);
              const indexB = context.currentOrder.indexOf(b.id);
              // 새로운 항목은 맨 뒤로
              if (indexA === -1) return 1;
              if (indexB === -1) return -1;
              return indexA - indexB;
            });

            return {
              ...old,
              projects: sortedProjects,
            };
          },
        );
      }
    },
  });
}

/**
 * Hook for deleting a project
 */
export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      console.log("[useDeleteProject] Deleting project:", id);
      const result = await projectService.delete(id);
      console.log("[useDeleteProject] Delete result:", result);
      return result;
    },
    onMutate: async (id) => {
      console.log("[useDeleteProject] onMutate - id:", id);
      // Cancel queries
      await queryClient.cancelQueries({ queryKey: projectKeys.lists() });

      // Snapshot
      const previousLists = queryClient.getQueriesData({
        queryKey: projectKeys.lists(),
      });

      // Optimistically remove from all lists
      queryClient.setQueriesData(
        { queryKey: projectKeys.lists() },
        (old: { projects?: Project[] } | undefined) => {
          if (!old?.projects) return old;
          console.log("[useDeleteProject] Removing from cache:", id);
          return {
            ...old,
            projects: old.projects.filter((p: Project) => p.id !== id),
          };
        },
      );

      return { previousLists };
    },
    onError: (err, id, context) => {
      console.error("[useDeleteProject] Error deleting project:", id, err);
      // Rollback
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: (_data, id) => {
      console.log("[useDeleteProject] Successfully deleted:", id);
      // 성공 시에만 목록 재조회 (에러 시에는 이미 onError에서 롤백됨)
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}

/**
 * Hook for fetching project statistics
 */
export function useProjectStats(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: projectKeys.stats(id),
    queryFn: async () => {
      const response = await projectService.getStats(id);
      return response.data;
    },
    enabled: options?.enabled !== false && !!id,
  });
}

/**
 * Hook for duplicating a project
 */
export function useDuplicateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => projectService.duplicate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}
