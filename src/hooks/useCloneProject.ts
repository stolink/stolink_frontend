import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import {
  cloneProject,
  type ProjectCloneRequest,
} from "../services/projectService";

export const useCloneProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      request,
    }: {
      projectId: string;
      request: ProjectCloneRequest;
    }) => cloneProject(projectId, request),

    onSuccess: (data) => {
      // 프로젝트 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ["projects"] });

      console.log(`프로젝트 "${data.data.title}"가 복제되었습니다.`);
    },

    onError: (error: AxiosError<{ message: string }>) => {
      const message =
        error.response?.data?.message || "프로젝트 복제에 실패했습니다.";
      console.error(message);
    },
  });
};
