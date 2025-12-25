import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  characterService,
  type Character,
  type CreateCharacterInput,
} from "@/services/characterService";

// Query Keys
export const characterKeys = {
  all: ["characters"] as const,
  lists: () => [...characterKeys.all, "list"] as const,
  list: (projectId: string) => [...characterKeys.lists(), projectId] as const,
  details: () => [...characterKeys.all, "detail"] as const,
  detail: (id: string) => [...characterKeys.details(), id] as const,
};

/**
 * Hook for fetching characters in a project
 */
export function useCharacters(
  projectId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: characterKeys.list(projectId),
    queryFn: async () => {
      const response = await characterService.getAll(projectId);
      return response.data;
    },
    enabled: options?.enabled !== false && !!projectId,
  });
}

/**
 * Hook for fetching single character
 */
export function useCharacter(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: characterKeys.detail(id),
    queryFn: async () => {
      const response = await characterService.getById(id);
      return response.data;
    },
    enabled: options?.enabled !== false && !!id,
  });
}

/**
 * Hook for creating a character
 */
export function useCreateCharacter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      payload,
    }: {
      projectId: string;
      payload: CreateCharacterInput;
    }) => characterService.create(projectId, payload),
    onSuccess: (_data, { projectId }) => {
      queryClient.invalidateQueries({
        queryKey: characterKeys.list(projectId),
      });
    },
  });
}

/**
 * Hook for updating a character
 */
export function useUpdateCharacter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<CreateCharacterInput>;
    }) => characterService.update(id, payload),
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: characterKeys.detail(id) });
      const previous = queryClient.getQueryData(characterKeys.detail(id));

      queryClient.setQueryData(
        characterKeys.detail(id),
        (old: Character | undefined) => (old ? { ...old, ...payload } : old)
      );

      return { previous, id };
    },
    onError: (_err, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          characterKeys.detail(context.id),
          context.previous
        );
      }
    },
    onSettled: (_data, _error, { id }) => {
      queryClient.invalidateQueries({ queryKey: characterKeys.detail(id) });
      // Invalidate all character lists since we don't know which project this belongs to
      queryClient.invalidateQueries({ queryKey: characterKeys.lists() });
    },
  });
}

/**
 * Hook for deleting a character
 */
export function useDeleteCharacter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => characterService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: characterKeys.lists() });
    },
  });
}

/**
 * Hook for regenerating character image (async job)
 */
export function useRegenerateCharacterImage() {
  return useMutation({
    mutationFn: (id: string) => characterService.regenerateImage(id),
  });
}
