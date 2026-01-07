import { useMutation } from "@tanstack/react-query";
import { aiService } from "@/services/aiService";
import { useJobSSE } from "./useJobSSE";

// Types
interface ChatPayload {
  projectId: string;
  documentId?: string;
  message: string;
  context?: {
    includeCharacters?: boolean;
    includeForeshadowing?: boolean;
  };
}

interface ConsistencyCheckPayload {
  projectId: string;
  documentIds: string[];
}

/**
 * Hook for AI chat
 */
export function useAIChat() {
  return useMutation({
    mutationFn: (payload: ChatPayload) => aiService.chat(payload),
  });
}

/**
 * Hook for consistency check
 */
export function useConsistencyCheck() {
  return useMutation({
    mutationFn: (payload: ConsistencyCheckPayload) =>
      aiService.checkConsistency(payload),
  });
}

/**
 * Hook for story analysis (long-running job)
 * Returns jobId that can be used with useAIJobPolling
 */
export function useAnalyzeStory() {
  return useMutation({
    mutationFn: (payload: {
      projectId: string;
      documentId: string;
      content: string;
    }) => aiService.analyzeStory(payload),
  });
}

/**
 * SSE 기반 AI Job 상태 구독 훅
 * 기존 폴링 방식 대신 Server-Sent Events를 사용하여 실시간 업데이트를 수신합니다.
 *
 * @param jobId - 구독할 Job ID
 * @param options - 연결 옵션 및 콜백
 * @returns Job 상태, 진행률, 결과, 에러 정보
 */
export function useAIJobPolling<T = unknown>(
  jobId: string | null,
  options?: {
    enabled?: boolean;
    onComplete?: (result: T) => void;
    onError?: (error: string) => void;
  },
) {
  const { isConnected, jobStatus, progress, result, error } = useJobSSE<T>(
    jobId,
    aiService.getJobStreamUrl,
    {
      enabled: options?.enabled,
      maxConnectionTime: 5 * 60 * 1000, // 5분 타임아웃
      onComplete: options?.onComplete,
      onError: options?.onError,
    },
  );

  // 기존 인터페이스와 호환되도록 isPolling 대신 isConnected 반환
  return {
    jobStatus,
    progress,
    result,
    error,
    isPolling: isConnected, // 하위 호환성
  };
}
