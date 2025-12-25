import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  relationshipService,
  type Relationship,
  type CreateRelationshipInput,
} from "@/services/relationshipService";

// Query Keys
export const relationshipKeys = {
  all: ["relationships"] as const,
  lists: () => [...relationshipKeys.all, "list"] as const,
  list: (projectId: string) =>
    [...relationshipKeys.lists(), projectId] as const,
};

/**
 * Hook for fetching relationships in a project
 */
export function useRelationships(
  projectId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: relationshipKeys.list(projectId),
    queryFn: async () => {
      const response = await relationshipService.getAll(projectId);
      return response.data;
    },
    enabled: options?.enabled !== false && !!projectId,
  });
}

/**
 * Hook for creating a relationship
 */
export function useCreateRelationship(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateRelationshipInput) =>
      relationshipService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: relationshipKeys.list(projectId),
      });
    },
  });
}

/**
 * Hook for updating a relationship
 */
export function useUpdateRelationship(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<CreateRelationshipInput>;
    }) => relationshipService.update(id, payload),
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({
        queryKey: relationshipKeys.list(projectId),
      });
      const previous = queryClient.getQueryData(
        relationshipKeys.list(projectId)
      );

      queryClient.setQueryData(
        relationshipKeys.list(projectId),
        (old: Relationship[] | undefined) =>
          old?.map((rel) => (rel.id === id ? { ...rel, ...payload } : rel))
      );

      return { previous };
    },
    onError: (_err, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          relationshipKeys.list(projectId),
          context.previous
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: relationshipKeys.list(projectId),
      });
    },
  });
}

/**
 * Hook for deleting a relationship
 */
export function useDeleteRelationship(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => relationshipService.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({
        queryKey: relationshipKeys.list(projectId),
      });
      const previous = queryClient.getQueryData(
        relationshipKeys.list(projectId)
      );

      queryClient.setQueryData(
        relationshipKeys.list(projectId),
        (old: Relationship[] | undefined) => old?.filter((rel) => rel.id !== id)
      );

      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          relationshipKeys.list(projectId),
          context.previous
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: relationshipKeys.list(projectId),
      });
    },
  });
}
