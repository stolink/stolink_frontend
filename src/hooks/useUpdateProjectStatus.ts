import { useMutation, useQueryClient } from "@tanstack/react-query";
import { projectService, type Project } from "@/services/projectService";
import type { ProjectStatusType } from "@/components/library/StatusChip";
import { projectKeys } from "./useProjects";

/**
 * 프로젝트 상태 업데이트를 위한 React Query Mutation Hook
 * - 상태 변경 시 낙관적 업데이트 적용
 * - 성공 시 자동으로 프로젝트 목록 리프레시
 */
export function useUpdateProjectStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    // 상태 업데이트 요청
    mutationFn: async ({
      projectId,
      status,
    }: {
      projectId: string;
      status: ProjectStatusType;
    }) => {
      const apiStatus = status === "Writing" ? "writing" : "completed";
      return projectService.update(projectId, { status: apiStatus });
    },

    // 낙관적 업데이트: API 응답 전에 UI 먼저 업데이트
    onMutate: async ({ projectId, status }) => {
      // 진행 중인 리페치 취소 (모든 프로젝트 관련 쿼리)
      await queryClient.cancelQueries({ queryKey: projectKeys.all });

      // 이전 상태 스냅샷 - lists() 쿼리키 사용
      const previousData = queryClient.getQueriesData({
        queryKey: projectKeys.lists(),
      });

      // 낙관적으로 UI 업데이트 - 모든 리스트 쿼리에 대해 업데이트
      queryClient.setQueriesData(
        { queryKey: projectKeys.lists() },
        (old: { projects?: Project[] } | undefined) => {
          if (!old?.projects) return old;
          return {
            ...old,
            projects: old.projects.map((p: Project) =>
              p.id === projectId
                ? {
                    ...p,
                    status: status === "Writing" ? "writing" : "completed",
                  }
                : p
            ),
          };
        }
      );

      // 롤백용 컨텍스트 반환
      return { previousData };
    },

    // 에러 시 롤백
    onError: (error, _variables, context) => {
      console.error("[useUpdateProjectStatus] Failed to update status:", error);
      // 이전 데이터로 롤백
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      alert("상태 변경에 실패했습니다.");
    },
  });
}
