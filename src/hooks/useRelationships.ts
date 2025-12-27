import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  relationshipService,
  type Relationship,
  type CreateRelationshipInput,
} from "@/services/relationshipService";
import { characterKeys } from "./useCharacters";

// Query Keys
export const relationshipKeys = {
  all: ["relationships"] as const,
  lists: () => [...relationshipKeys.all, "list"] as const,
  list: (projectId: string) =>
    [...relationshipKeys.lists(), projectId] as const,
};

/**
 * @deprecated
 * Relationship 데이터는 이제 Character API에 포함됩니다.
 * useCharacters 훅을 사용하고 character.relationships에서 데이터를 추출하세요.
 */
// useRelationships hook removed (unused and broken after refactor)

/**
 * Hook for creating a relationship
 */
export function useCreateRelationship(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateRelationshipInput) =>
      relationshipService.create(payload),
    onSuccess: () => {
      // 캐릭터 데이터에 관계가 포함되어 있으므로 캐릭터 목록 무효화
      queryClient.invalidateQueries({
        queryKey: characterKeys.list(projectId),
      });
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
        queryKey: characterKeys.list(projectId),
      });
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
        queryKey: characterKeys.list(projectId),
      });
      queryClient.invalidateQueries({
        queryKey: relationshipKeys.list(projectId),
      });
    },
  });
}
