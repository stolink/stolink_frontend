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
      const data = response.data;

      // [Fix] Deduplicate by _id to prevent React key warnings
      const seen = new Set<string>();
      return data.filter((c) => {
        const id = c._id;
        if (!id || seen.has(id)) return false;
        seen.add(id);
        return true;
      });
    },
    enabled: options?.enabled !== false && !!projectId,
    staleTime: 5000, // 5s stale time to prevent immediate refetch overwriting optimistic updates
  });
}

/**
 * Hook for fetching single character
 */
export function useCharacter(
  id: string,
  options?: { enabled?: boolean; staleTime?: number }
) {
  return useQuery({
    queryKey: characterKeys.detail(id),
    queryFn: async () => {
      const response = await characterService.getById(id);
      return response.data;
    },
    enabled: options?.enabled !== false && !!id,
    staleTime: options?.staleTime ?? 3000, // Default 3s stale time to prevent immediate refetch overwrite
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
    onSuccess: (data, variables) => {
      // 1. Update Detail Cache immediately with response data
      if (data && data.data) {
        queryClient.setQueryData(characterKeys.detail(variables.id), data.data);

        // 2. Update List Cache immediately (Optimistic UI)
        // We iterate over all list queries to find and update the character
        // This works even if the backend response doesn't include projectId
        queryClient.setQueriesData(
          { queryKey: characterKeys.lists() },
          (old: Character[] | undefined) => {
            if (!old) return old;
            return old.map((char) =>
              char._id === variables.id ? { ...char, ...data.data } : char
            );
          }
        );
      }

      // 3. Invalidate lists immediately as well (backup)
      // Note: We do NOT invalidate 'detail' immediately to prevent race conditions
      // where a fast refetch gets stale data from DB before it's fully consistent.
      // We rely on setQueryData above for the detail view, and the delayed invalidation in onSettled.
      // We also keep list invalidation for safety, but the setQueriesData above gives instant feedback.
      queryClient.invalidateQueries({ queryKey: characterKeys.lists() });
    },
    onSettled: (_data, _error, { id }) => {
      // 4. Delayed Invalidation for Eventual Consistency (Neo4j propagation safety)
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: characterKeys.detail(id) });
        queryClient.invalidateQueries({ queryKey: characterKeys.lists() });
      }, 1000);
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
