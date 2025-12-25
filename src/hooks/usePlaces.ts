import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  placeService,
  type Place,
  type CreatePlaceInput,
} from "@/services/placeService";

// Query Keys
export const placeKeys = {
  all: ["places"] as const,
  lists: () => [...placeKeys.all, "list"] as const,
  list: (projectId: string) => [...placeKeys.lists(), projectId] as const,
};

/**
 * Hook for fetching places in a project
 */
export function usePlaces(projectId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: placeKeys.list(projectId),
    queryFn: async () => {
      const response = await placeService.getAll(projectId);
      return response.data;
    },
    enabled: options?.enabled !== false && !!projectId,
  });
}

/**
 * Hook for creating a place
 */
export function useCreatePlace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      payload,
    }: {
      projectId: string;
      payload: CreatePlaceInput;
    }) => placeService.create(projectId, payload),
    onSuccess: (_data, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: placeKeys.list(projectId) });
    },
  });
}

/**
 * Hook for updating a place
 */
export function useUpdatePlace(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<CreatePlaceInput>;
    }) => placeService.update(id, payload),
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: placeKeys.list(projectId) });
      const previous = queryClient.getQueryData(placeKeys.list(projectId));

      queryClient.setQueryData(
        placeKeys.list(projectId),
        (old: Place[] | undefined) =>
          old?.map((place) =>
            place.id === id ? { ...place, ...payload } : place
          )
      );

      return { previous };
    },
    onError: (_err, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(placeKeys.list(projectId), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: placeKeys.list(projectId) });
    },
  });
}

/**
 * Hook for deleting a place
 */
export function useDeletePlace(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => placeService.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: placeKeys.list(projectId) });
      const previous = queryClient.getQueryData(placeKeys.list(projectId));

      queryClient.setQueryData(
        placeKeys.list(projectId),
        (old: Place[] | undefined) => old?.filter((place) => place.id !== id)
      );

      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(placeKeys.list(projectId), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: placeKeys.list(projectId) });
    },
  });
}
