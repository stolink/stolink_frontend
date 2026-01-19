import { useEffect, useRef } from "react";
import { useAnalysisBufferStore } from "@/stores/useAnalysisBufferStore";
import { aiService } from "@/services/aiService";
import { Button } from "@stolink/ui";
import { useToast } from "@/hooks/useToast";
import { AlertCircle, ArrowRight } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Global component that watches for active analysis jobs in the background.
 * It polls for status updates and triggers global notifications upon completion.
 * This ensures users get feedback even if they navigate away from the Project page.
 */
export const GlobalAnalysisWatcher = () => {
  const activeAnalysisJobs = useAnalysisBufferStore(
    (state) => state.activeAnalysisJobs,
  );
  // [Fix] Use correct store action name
  const removeJobId = useAnalysisBufferStore((state) => state.removeJobId);
  const { toast } = useToast();
  // [Fix] hydration check
  const isHydrated = useAnalysisBufferStore.persist.hasHydrated();
  const queryClient = useQueryClient();

  // Polling interval ref to manage cleanup
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isHydrated) return;

    // Start polling if there are active jobs
    // activeAnalysisJobs is Record<projectId, jobId[]>
    const hasActiveJobs = Object.values(activeAnalysisJobs).some(
      (jobs) => jobs.length > 0,
    );

    if (!hasActiveJobs) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Polling function
    const pollJobs = async () => {
      // Iterate through all active jobs
      for (const [projectId, jobIds] of Object.entries(activeAnalysisJobs)) {
        for (const jobId of jobIds) {
          try {
            const status = await aiService.getJobStatus(jobId);

            if (status.status === "completed") {
              // 1. Show Success Toast (Distinct Dark Theme)
              toast({
                title: "AI 분석이 완료되었습니다",
                description: "결과를 확인하여 스토리를 개선해보세요.",
                variant: "default",
                // Mocha/Espresso Dark Theme for High Visibility
                className:
                  "bg-espresso-900 border-l-4 border-mocha-500 text-cloud-50 shadow-lg",
                action: (
                  <Button
                    size="sm"
                    className="bg-mocha-500 hover:bg-mocha-600 text-white border-0 gap-1.5 h-8 px-3"
                    onClick={() => {
                      window.location.href = `/projects/${projectId}/analysis`;
                    }}
                  >
                    결과 보기
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                ),
              });

              // 2. Invalidate Project Queries
              queryClient.invalidateQueries({
                queryKey: ["project", projectId],
              });
              queryClient.invalidateQueries({
                queryKey: ["characters", projectId],
              });
              queryClient.invalidateQueries({
                queryKey: ["analysis", projectId],
              });

              // 3. Remove from Buffer using correct ID and ProjectID
              removeJobId(projectId, jobId);
            } else if (status.status === "failed") {
              // 1. Show Error Toast
              toast({
                title: "분석 실패",
                description:
                  status.message || "AI 분석 중 오류가 발생했습니다.",
                variant: "destructive",
                action: <AlertCircle className="w-5 h-5" />,
              });

              // 2. Remove from Buffer
              removeJobId(projectId, jobId);
            }
            // 'processing' or 'pending' -> Do nothing, continue polling
          } catch (error) {
            console.error(`[GlobalWatcher] Failed to poll job ${jobId}`, error);
            // Don't remove immediately on network error, retry next interval
          }
        }
      }
    };

    // Run immediately then interval
    pollJobs();
    intervalRef.current = setInterval(pollJobs, 5000); // Poll every 5 seconds

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [activeAnalysisJobs, removeJobId, toast, queryClient, isHydrated]);

  return null; // Headless component
};
