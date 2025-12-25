import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  itemService,
  type Item,
  type CreateItemInput,
} from "@/services/itemService";

// Query Keys
export const itemKeys = {
  all: ["items"] as const,
  lists: () => [...itemKeys.all, "list"] as const,
  list: (projectId: string) => [...itemKeys.lists(), projectId] as const,
};

/**
 * Hook for fetching items in a project
 */
export function useItems(projectId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: itemKeys.list(projectId),
    queryFn: async () => {
      const response = await itemService.getAll(projectId);
      return response.data;
    },
    enabled: options?.enabled !== false && !!projectId,
  });
}

/**
 * Hook for creating an item
 */
export function useCreateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      payload,
    }: {
      projectId: string;
      payload: CreateItemInput;
    }) => itemService.create(projectId, payload),
    onSuccess: (_data, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: itemKeys.list(projectId) });
    },
  });
}

/**
 * Hook for updating an item
 */
export function useUpdateItem(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<CreateItemInput>;
    }) => itemService.update(id, payload),
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: itemKeys.list(projectId) });
      const previous = queryClient.getQueryData(itemKeys.list(projectId));

      queryClient.setQueryData(
        itemKeys.list(projectId),
        (old: Item[] | undefined) =>
          old?.map((item) => (item.id === id ? { ...item, ...payload } : item))
      );

      return { previous };
    },
    onError: (_err, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(itemKeys.list(projectId), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: itemKeys.list(projectId) });
    },
  });
}

/**
 * Hook for deleting an item
 */
export function useDeleteItem(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => itemService.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: itemKeys.list(projectId) });
      const previous = queryClient.getQueryData(itemKeys.list(projectId));

      queryClient.setQueryData(
        itemKeys.list(projectId),
        (old: Item[] | undefined) => old?.filter((item) => item.id !== id)
      );

      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(itemKeys.list(projectId), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: itemKeys.list(projectId) });
    },
  });
}

/**
 * Hook for transferring item ownership
 */
export function useTransferItem(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, newOwnerId }: { id: string; newOwnerId: string }) =>
      itemService.transfer(id, newOwnerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itemKeys.list(projectId) });
    },
  });
}
