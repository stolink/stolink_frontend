import { useEffect, useRef, useCallback } from "react";
import { useManuscriptJobStore } from "@/stores/useManuscriptJobStore";
import { manuscriptService } from "@/services/manuscriptService";
import { useToast } from "@/hooks/useToast";
import { useQueryClient } from "@tanstack/react-query";

const POLLING_INTERVAL = 2000; // 2초

/**
 * 진행 중인 모든 원고 처리 작업을 폴링합니다.
 * 페이지 이동과 관계없이 전역으로 동작합니다.
 */
export function useManuscriptPolling() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pollActiveJobs = useCallback(async () => {
    // 🔥 중요: getState()를 사용하여 스토어 업데이트를 구독하지 않고 현재 상태를 가져옵니다.
    // 이렇게 하면 jobs가 업데이트되어도(진행률 변경 등) 이 훅을 사용하는 컴포넌트(LibraryPage)는 리렌더링되지 않습니다.
    const state = useManuscriptJobStore.getState();
    const { jobs, updateJobProgress, completeJob, failJob, removeJob } = state;

    const activeJobs = Object.values(jobs).filter(
      (job) => job.status === "PENDING" || job.status === "PROCESSING",
    );

    if (activeJobs.length === 0) {
      return;
    }

    for (const job of activeJobs) {
      try {
        const response = await manuscriptService.getJobStatus(job.jobId);
        const data = response.data;

        if (data.status === "COMPLETED") {
          completeJob(job.projectId, data.totalDocuments ?? 0);

          // 프로젝트 및 문서 쿼리 무효화
          queryClient.invalidateQueries({ queryKey: ["projects"] });
          queryClient.invalidateQueries({
            queryKey: ["documents", job.projectId],
          });

          toast({
            title: "원고 처리 완료",
            description: `${data.totalDocuments ?? 0}개 섹션이 생성되었습니다.`,
          });

          // 완료 후 3초 뒤 상태에서 제거
          setTimeout(() => {
            removeJob(job.projectId);
          }, 3000);
        } else if (data.status === "FAILED") {
          failJob(job.projectId, data.message);

          toast({
            title: "원고 처리 실패",
            description: data.message,
            variant: "destructive",
          });

          // 실패 후 5초 뒤 상태에서 제거
          setTimeout(() => {
            removeJob(job.projectId);
          }, 5000);
        } else {
          // PENDING or PROCESSING
          updateJobProgress(
            job.projectId,
            data.progress,
            data.message,
            data.status,
            data.totalDocuments,
          );
        }
      } catch (error) {
        console.error(
          `[ManuscriptPolling] Failed to poll job ${job.jobId}:`,
          error,
        );
      }
    }
  }, [toast, queryClient]); // 스토어 관련 의존성 제거

  useEffect(() => {
    // 즉시 한 번 실행
    pollActiveJobs();

    // 2초 간격으로 폴링
    intervalRef.current = setInterval(pollActiveJobs, POLLING_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [pollActiveJobs]);

  // 이 훅은 아무것도 반환하지 않거나, 필요한 경우 리렌더링을 유발하지 않는 값만 반환해야 합니다.
  return {};
}
