import { useQuery } from "@tanstack/react-query";
import { settingService } from "@/services/settingService";

export const settingKeys = {
  all: ["settings"] as const,
  lists: () => [...settingKeys.all, "list"] as const,
  list: (projectId: string) => [...settingKeys.lists(), projectId] as const,
};

/**
 * Hook to fetch all backgrounds/places for a project
 */
export function useSettings(projectId: string) {
  return useQuery({
    queryKey: settingKeys.list(projectId),
    queryFn: async () => {
      const response = await settingService.getAll(projectId);
      return response.data || [];
    },
    enabled: !!projectId,
    staleTime: 60000, // 1 minute
  });
}
