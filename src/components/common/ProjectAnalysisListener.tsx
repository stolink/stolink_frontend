import { useEffect, useRef } from "react";
import { useAnalysisBufferStore } from "@/stores/useAnalysisBufferStore";
import { useToast } from "@/hooks/useToast";

export function ProjectAnalysisListener() {
  const { toast } = useToast();
  const isAnalyzing = useAnalysisBufferStore((state) => state.isAnalyzing);
  const progress = useAnalysisBufferStore((state) => state.progress);
  const currentJobType = useAnalysisBufferStore(
    (state) => state.currentJobType,
  );

  // Prevent duplicate toasts for the same completion
  const hasNotifiedRef = useRef(false);

  useEffect(() => {
    // Only track "analysis" type jobs (ignore image generation here)
    if (currentJobType !== "analysis") {
      return;
    }

    if (isAnalyzing) {
      // Create a dedicated toast ID to update progress?
      // For now, just reset the notified flag when analysis starts
      if (progress < 100) {
        hasNotifiedRef.current = false;
      }
    } else {
      // Analysis finished (isAnalyzing became false)
      // Check if we reached 100% or close enough to consider it done
      if (progress >= 100 && !hasNotifiedRef.current) {
        hasNotifiedRef.current = true;
        toast({
          variant: "success",
          title: "분석 완료",
          description: "문서 분석이 완료되었습니다.",
          duration: 3000,
        });
      }
    }
  }, [isAnalyzing, progress, currentJobType, toast]);

  return null;
}
