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

    onSuccess: () => {
      // 프로젝트 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },

    onError: (_error: AxiosError<{ message: string }>) => {
      // 에러는 호출하는 컴포넌트에서 처리
    },
  });
};
