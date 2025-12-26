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
 */
export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Project> }) =>
      projectService.update(id, payload),
    onMutate: async ({ id, payload }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: projectKeys.detail(id) });

      // Snapshot previous value
      const previous = queryClient.getQueryData(projectKeys.detail(id));

      // Optimistically update
      queryClient.setQueryData(
        projectKeys.detail(id),
        (old: Project | undefined) => (old ? { ...old, ...payload } : old)
      );

      return { previous, id };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previous) {
        queryClient.setQueryData(
          projectKeys.detail(context.id),
          context.previous
        );
      }
    },
    onSettled: (_data, _error, { id }) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
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
        }
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
    },
    onSettled: () => {
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
