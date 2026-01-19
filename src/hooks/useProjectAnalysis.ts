/**
 * 프로젝트 레벨 분석 훅 (SSE 방식)
 *
 * 에디터/월드 페이지 진입 시 버퍼 및 분석 상태를 관리합니다.
 * 분석 요청을 보내고, SSE를 통해 상태를 실시간으로 수신합니다.
 */

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  startTransition,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useAnalysisBufferStore,
  useAnalysisBufferHydrated,
} from "@/stores/useAnalysisBufferStore";
import { aiService } from "@/services/aiService";
import { imageService } from "@/services/imageService";
import type { AnalysisResultData, ConsistencyReport } from "@/types";
import { transformConsistencyReport } from "@/types/analysisResult";
import { useJobSSE } from "./useJobSSE";
import { characterKeys } from "./useCharacters";

// Constants
// STUCK_TIMEOUT_MS removed (unused)

interface UseProjectAnalysisOptions {
  enabled?: boolean;
  onAnalysisComplete?: (
    result: AnalysisResultData | null,
    jobId: string,
  ) => void;
  onAnalysisError?: (error: string) => void;
}

interface UseProjectAnalysisReturn {
  isAnalyzing: boolean;
  analysisProgress: number;
  analysisError: string | null;
  triggerAnalysis: () => Promise<void>;
  flushAndAnalyze: () => Promise<void>;
  resetAnalysis: () => void;
  lastConsistencyReport: ConsistencyReport | null;
  isStuck: boolean;
  currentJobType: "analysis" | "image" | null;
  /** 새로고침 후 백엔드에서 job 상태 확인 중 (true면 분석 버튼 비활성화) */
  isCheckingJobStatus: boolean;
}

export function useProjectAnalysis(
  projectId: string | null,
  options: UseProjectAnalysisOptions = {},
): UseProjectAnalysisReturn {
  const { enabled = true, onAnalysisComplete, onAnalysisError } = options;
  const queryClient = useQueryClient();

  // IndexedDB에서 상태 복원 완료 여부 (새로고침 시 SSE 재연결에 필요)
  const isHydrated = useAnalysisBufferHydrated();

  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isStuck, setIsStuck] = useState(false);
  // 새로고침 후 백엔드 job 상태 확인 중 (hydration 완료 전 또는 API 호출 중)
  const [isCheckingJobStatus, setIsCheckingJobStatus] = useState(true);

  // Callbacks refs (to avoid effect re-runs)
  const onCompleteRef = useRef(onAnalysisComplete);
  const onErrorRef = useRef(onAnalysisError);

  // Stuck detection logic
  const lastProgressRef = useRef<number>(-1);
  const lastProgressUpdateRef = useRef<number>(0);

  useEffect(() => {
    onCompleteRef.current = onAnalysisComplete;
    onErrorRef.current = onAnalysisError;
    // Purity fix: initialize lastProgressUpdateRef in effect
    lastProgressUpdateRef.current = Date.now();
  }, [onAnalysisComplete, onAnalysisError]);

  // 버퍼 스토어 (Global State)
  const setProjectId = useAnalysisBufferStore((state) => state.setProjectId);

  const setBufferAnalyzing = useAnalysisBufferStore(
    (state) => state.setAnalyzing,
  );
  const getBufferSummary = useAnalysisBufferStore(
    (state) => state.getBufferSummary,
  );
  const currentJobId = useAnalysisBufferStore((state) => state.currentJobId);
  const currentJobType = useAnalysisBufferStore(
    (state) => state.currentJobType,
  );
  // setJobId removed (unused)
  const setGlobalProgress = useAnalysisBufferStore(
    (state) => state.setProgress,
  );
  const setLastAnalyzedHashes = useAnalysisBufferStore(
    (state) => state.setLastAnalyzedHashes,
  );
  const isAnalyzing = useAnalysisBufferStore((state) => state.isAnalyzing);
  const resetAnalysis = useAnalysisBufferStore((state) => state.resetAnalysis);
  const lastConsistencyReport = useAnalysisBufferStore(
    (state) => state.lastConsistencyReport,
  );
  const activeJobs = useAnalysisBufferStore((state) => state.activeJobs);
  const activeAnalysisJobs = useAnalysisBufferStore(
    (state) => state.activeAnalysisJobs,
  );
  const addStoreJobId = useAnalysisBufferStore((state) => state.addJobId);
  const removeStoreJobId = useAnalysisBufferStore((state) => state.removeJobId);
  const clearStoreJobs = useAnalysisBufferStore((state) => state.clearJobs);
  const clearAnalysisJobs = useAnalysisBufferStore(
    (state) => state.clearAnalysisJobs,
  );

  const [jobProgresses, setJobProgresses] = useState<Record<string, number>>(
    {},
  );
  const lastResultRef = useRef<AnalysisResultData | null>(null);

  // API 요청 중 상태 (ActiveJobs가 아직 업데이트되지 않은 타이밍 방어)
  const isRequestingRef = useRef(false);
  // 분석 완료 처리 중 상태 (중복 처리 방어)
  const isFinalizingRef = useRef(false);

  // 재분석 트리거 ref (순환 의존성 방지)
  const triggerReanalysisRef = useRef<(() => Promise<void>) | null>(null);
  const lastKnownJobTypeRef = useRef<"analysis" | "image" | null>(null);
  const lastKnownTargetIdRef = useRef<string | null>(null);
  const isMountedRef = useRef(true);
  const finalizeAnalysisRef = useRef<(() => void) | null>(null);

  // Lifecycle tracking
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Sync refs with store state
  useEffect(() => {
    if (currentJobType) {
      lastKnownJobTypeRef.current = currentJobType;
      lastKnownTargetIdRef.current =
        useAnalysisBufferStore.getState().currentJobTargetId;
    }
  }, [currentJobType]);

  // Finalize Analysis (Shared logic for all completion paths)
  const finalizeAnalysis = useCallback(
    async (manualJobId?: string) => {
      // Check if component is still mounted
      if (!isMountedRef.current) {
        return;
      }
      if (isRequestingRef.current) {
        return;
      }
      if (isFinalizingRef.current) {
        return;
      }

      isFinalizingRef.current = true;

      // Get current state to check job type (fallback to refs if store was just cleared)
      const storeState = useAnalysisBufferStore.getState();
      const { pendingDocuments } = storeState;
      const activeType =
        storeState.currentJobType || lastKnownJobTypeRef.current;
      const activeTargetId =
        storeState.currentJobTargetId || lastKnownTargetIdRef.current;

      // IMPORTANT: Get the jobId that is completing
      const activeJobId =
        manualJobId ||
        storeState.currentJobId ||
        (projectId ? storeState.activeAnalysisJobs[projectId]?.[0] : null);

      // 1. Analysis-specific state sync
      if (activeType === "analysis") {
        // Sync hashes (분석 완료된 문서들)
        setLastAnalyzedHashes(pendingDocuments);

        // pendingDocuments 클리어
        useAnalysisBufferStore.getState().clearPendingDocuments();
      }

      // 2. Cache Invalidation FIRST, then callback (새 데이터 로드 후 diff 계산)
      if (projectId) {
        // Always invalidate character list as both jobs might affect it
        await queryClient.invalidateQueries({
          queryKey: characterKeys.list(projectId),
        });

        // Invalidate project events as analysis might update the timeline
        await queryClient.invalidateQueries({
          queryKey: ["events", "project", projectId],
        });

        // Invalidate project stats
        queryClient.invalidateQueries({
          queryKey: ["projects", "detail", projectId, "stats"],
        });

        if (activeType === "image" && activeTargetId) {
          // Also invalidate detail query for the specific character
          queryClient.invalidateQueries({
            queryKey: characterKeys.detail(activeTargetId),
          });
        }
      }

      // 3. Trigger completion callback AFTER invalidation (새 데이터 로드 완료 후)
      if (activeType === "analysis") {
        onCompleteRef.current?.(lastResultRef.current, activeJobId || "");
      }

      // Logic to ensure consistency report availability
      if (activeType === "analysis") {
        let report: ConsistencyReport | null =
          lastResultRef.current?.consistencyReport || null;

        if (!report && projectId) {
          try {
            // Try fetching from API first
            const backendReport =
              await aiService.getConsistencyReport(projectId);
            report = transformConsistencyReport(backendReport);
          } catch (_error) {
            console.warn(
              "[useProjectAnalysis] Failed to fetch consistency report:",
              _error,
            );
            // Fallback removed to avoid showing dummy data
          }
        }

        if (report) {
          useAnalysisBufferStore.getState().setLastConsistencyReport(report);
        }
      }

      lastResultRef.current = null;
      lastKnownJobTypeRef.current = null;
      lastKnownTargetIdRef.current = null;

      // Clear jobs
      if (projectId) {
        clearStoreJobs(projectId);
      }

      // 모든 분석 완료 처리 (자동 재분석은 사용자 요청 시에만 수행하도록 루프 제거)
      setBufferAnalyzing(false);
      setAnalysisProgress(100);
      setGlobalProgress(100);

      // 완료 처리 끝났으므로 플래그 리셋 (다음 분석을 위해)
      isFinalizingRef.current = false;
    },
    [
      projectId,
      queryClient,
      setBufferAnalyzing,
      setGlobalProgress,
      setLastAnalyzedHashes,
      clearStoreJobs,
    ],
  );

  // 프로젝트 ID 설정 (hydration 완료 후에만 - 복원된 상태 보존)
  useEffect(() => {
    if (projectId && isHydrated) {
      setProjectId(projectId);
    }
  }, [projectId, isHydrated, setProjectId]);

  // 프로젝트 초기 로드 시 백엔드에서 job 상태 확인
  // isHydrated: IndexedDB 복원 완료 후에만 실행 (새로고침 시 스토어 상태와 동기화)
  useEffect(() => {
    if (!projectId || !enabled || !isHydrated) return;

    const checkProjectJobStatus = async () => {
      setIsCheckingJobStatus(true);
      try {
        const jobStatus = await aiService.getProjectAnalysisJob(projectId);

        // 스토어에 이미 분석 Job이 있으면 백엔드 조회 결과를 무시
        // (에디터에서 이미 분석을 시작했을 수 있음)
        const currentStoreJobs =
          useAnalysisBufferStore.getState().activeAnalysisJobs[projectId] || [];

        // 2024-01-16 Fix: Don't return early if store has jobs.
        // We must proceed to verify backend status to trigger completion if needed.
        if (currentStoreJobs.length > 0) {
          setBufferAnalyzing(true);
        }

        // 진행 중인 job이 있으면 SSE 연결을 위해 스토어에 추가
        // (단, 스토어가 비어있을 때만 - 위에서 체크함)
        if (
          jobStatus.jobId &&
          (jobStatus.status === "processing" || jobStatus.status === "pending")
        ) {
          // Check for staleness to avoid zombie jobs
          // PENDING jobs > 1 min old are considered stale (backend should have picked them up by now)
          // PROCESSING jobs > 30 mins old are considered stuck/stale
          const statusAny = jobStatus as unknown as Record<string, unknown>;
          const timestampStr = (statusAny.updatedAt ||
            statusAny.createdAt) as string;
          const timestamp = timestampStr
            ? new Date(timestampStr).getTime()
            : Date.now();
          const now = Date.now();
          const elapsed = now - timestamp;

          const isPendingStale =
            jobStatus.status === "pending" && elapsed > 1 * 60 * 1000; // 1 min (aggressively ignore pending zombies)
          const isProcessingStale =
            jobStatus.status === "processing" && elapsed > 30 * 60 * 1000; // 30 min

          if (isPendingStale || isProcessingStale) {
            // 오래된(Stuck) 작업은 유령 작업으로 간주하여 제거
            clearStoreJobs(projectId);
          } else {
            // 스토어에 없는 경우에만 추가 (중복 방지)
            if (!currentStoreJobs.includes(jobStatus.jobId!)) {
              addStoreJobId(projectId, jobStatus.jobId!, "analysis");
            }

            setJobProgresses((prev) => ({
              ...prev,
              [jobStatus.jobId!]: jobStatus.progress || 0,
            }));

            // 전역 프로그레스도 동기화
            setAnalysisProgress(jobStatus.progress || 0);
            setGlobalProgress(jobStatus.progress || 0);
          }
        }
        // 완료된 상태면 캐릭터/관계 쿼리 무효화 및 완료 처리
        else if (
          jobStatus.status === "failed" ||
          jobStatus.status === "completed"
        ) {
          // [Fix] Check staleness for completed jobs to avoid resurrecting ancient history
          const statusAny = jobStatus as unknown as Record<string, unknown>;
          const timestampStr = (statusAny.updatedAt ||
            statusAny.createdAt) as string;
          const timestamp = timestampStr
            ? new Date(timestampStr).getTime()
            : Date.now();
          const now = Date.now();
          const elapsed = now - timestamp;

          if (elapsed > 5 * 60 * 1000) {
            // 5 min threshold
            // Ignore stale completed jobs
            if (currentStoreJobs.length > 0) clearStoreJobs(projectId);
            return;
          }

          // 서버가 명시적으로 "완료됨" 혹은 "실패함"이라고 응답하면,
          // finalizeAnalysis를 호출하여 onAnalysisComplete 콜백을 트리거합니다.
          // (WorldPage에서 Acknowledgement 체크 후 모달 표시)

          // 1. 결과가 있으면 ref에 저장 (finalizeAnalysis에서 사용)
          // Note: getProjectAnalysisJob 응답에는 result가 없을 수도 있음 (가벼운 상태 조회)
          // finalizeAnalysis 내부에서 fetch 로직이 돌겠지만, 여기서는 trigger만 해줌.

          // 2024-01-16 Fix: 단순히 clearStoreJobs만 하면 콜백이 안 불려서 모달이 안 뜸.
          // finalizeAnalysis를 통해 정상적인 완료 플로우를 타게 함.
          if (!isFinalizingRef.current) {
            // 강제로 100%로 맞춤
            setAnalysisProgress(100);

            // 만약 현재 스토어에 Job ID가 없다면(새로고침 직후), 잠시 추가해둬야 finalize 로직이 돔
            if (jobStatus.jobId && currentStoreJobs.length === 0) {
              addStoreJobId(projectId, jobStatus.jobId, "analysis");
            }

            await finalizeAnalysis(jobStatus.jobId!);
          }
        }
      } catch (error) {
        // API가 404라면 해당 프로젝트에 진행 중인 Job이 없다는 뜻이므로 로컬 상태도 클리어
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const status = (error as any)?.response?.status;
        if (status === 404) {
          // 404 for analysis job status should only clear analysis jobs, not image jobs
          clearAnalysisJobs(projectId);
        }
      } finally {
        setIsCheckingJobStatus(false);
      }
    };

    checkProjectJobStatus();
  }, [
    projectId,
    enabled,
    isHydrated,
    addStoreJobId,
    clearStoreJobs,
    clearAnalysisJobs,
    finalizeAnalysis,
    setBufferAnalyzing,
    setGlobalProgress,
  ]);

  // Note: SSE connection is managed by useJobSSE hook, so cleanup is handled there.

  // Job Status Tracking via Project SSE
  const {
    jobStatus: _lastJobStatus,
    progress: _lastJobProgress,
    isConnected,
  } = useJobSSE<AnalysisResultData>(
    projectId,
    aiService.getProjectStatusStreamUrl,
    {
      // isHydrated: IndexedDB에서 상태 복원 완료 후에만 SSE 시작 (새로고침 시 연결 끊김 방지)
      enabled:
        !!projectId &&
        isHydrated &&
        (activeAnalysisJobs[projectId]?.length ?? 0) > 0,
      onMessage: async (data) => {
        // SSE 이벤트 파싱
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const event = data as any;
        if (!event) return;

        // jobId가 직접 있거나 result 내부에 있을 수 있음
        let eventJobId = event.jobId || event.id;

        // Fallback: If jobId is missing in the message, use project-level handling
        // This is common for project-level status streams where backend doesn't send individual job IDs
        const currentAnalysisJobs = projectId
          ? useAnalysisBufferStore.getState().activeAnalysisJobs[projectId] ||
            []
          : [];

        if (!eventJobId && projectId && currentAnalysisJobs.length > 0) {
          // 프로젝트 레벨 이벤트: 첫 번째 Job ID를 사용하되, COMPLETED 시 모든 Job 처리
          eventJobId = currentAnalysisJobs[0];
        }

        if (!eventJobId) return;

        // 프로젝트 레벨 완료 이벤트인지 확인 (Job ID가 없었던 경우)
        const isProjectLevelEvent = !event.jobId && !event.id;

        const rawType = event.type || event.status;
        const eventType =
          typeof rawType === "string" ? rawType.toLowerCase() : "";

        // Progress 계산: percent > progress > totalDocuments/completedDocuments 순으로 확인
        let currentProgress = 0;
        if (typeof event.percent === "number") {
          currentProgress = event.percent;
        } else if (typeof event.progress === "number") {
          currentProgress = event.progress;
        } else if (
          typeof event.totalDocuments === "number" &&
          event.totalDocuments > 0
        ) {
          currentProgress = Math.floor(
            ((event.completedDocuments || 0) / event.totalDocuments) * 100,
          );
        }

        // Debug log for SSE progress tracking

        if (eventType === "progress" || eventType === "processing") {
          setJobProgresses((prev) => ({
            ...prev,
            [eventJobId]: currentProgress,
          }));

          // Progress가 100%에 도달하면 즉시 완료 처리
          if (currentProgress >= 100) {
            let result = event.result as AnalysisResultData;

            // SSE에 결과가 없으면 API 호출 시도
            // SSE에 결과가 없으면 API 호출 시도 (단, 이미지 작업은 제외)
            const { currentJobId: storeJobId, currentJobType: storeJobType } =
              useAnalysisBufferStore.getState();
            const isImageJob =
              storeJobId === eventJobId && storeJobType === "image";

            if (!result && !isImageJob) {
              try {
                const job =
                  await aiService.getJobStatus<AnalysisResultData>(eventJobId);
                result = job.result!;
              } catch (err) {
                console.error(
                  "[useProjectAnalysis] Error fetching job result on 100% progress:",
                  err,
                );
              }
            } else if (isImageJob) {
              // skip
            }

            if (result) {
              lastResultRef.current = result;
            }
            setJobProgresses((prev) => ({ ...prev, [eventJobId]: 100 }));
            if (projectId) {
              // 프로젝트 레벨 이벤트면 모든 Job 정리
              if (isProjectLevelEvent && !isFinalizingRef.current) {
                finalizeAnalysis();
              } else {
                // 개별 Job 완료: 해당 Job만 제거
                const currentJobs =
                  useAnalysisBufferStore.getState().activeAnalysisJobs[
                    projectId
                  ] || [];
                const isLastJob =
                  currentJobs.length === 1 && currentJobs[0] === eventJobId;

                removeStoreJobId(projectId, eventJobId);

                if (isLastJob && !isFinalizingRef.current) {
                  finalizeAnalysis();
                }
              }
            }
          }
        } else if (
          eventType === "completed" ||
          eventType === "success" ||
          eventType === "done"
        ) {
          let result = event.result as AnalysisResultData;

          // SSE에 결과가 없으면 API 호출 시도
          // SSE에 결과가 없으면 API 호출 시도 (단, 이미지 작업은 제외)
          const { currentJobId: storeJobId, currentJobType: storeJobType } =
            useAnalysisBufferStore.getState();
          const isImageJob =
            storeJobId === eventJobId && storeJobType === "image";

          if (!result && !isImageJob) {
            try {
              const job =
                await aiService.getJobStatus<AnalysisResultData>(eventJobId);
              result = job.result!;
            } catch (err) {
              console.error(
                "[useProjectAnalysis] Error fetching job result on completion:",
                err,
              );
            }
          } else if (isImageJob) {
            // skip
          }

          if (result) {
            lastResultRef.current = result;
          }

          setJobProgresses((prev) => ({ ...prev, [eventJobId]: 100 }));
          if (projectId) {
            // 프로젝트 레벨 이벤트면 모든 Job 정리
            if (isProjectLevelEvent && !isFinalizingRef.current) {
              finalizeAnalysis();
            } else {
              // 개별 Job 완료: 해당 Job만 제거
              const currentJobs =
                useAnalysisBufferStore.getState().activeAnalysisJobs[
                  projectId
                ] || [];
              const isLastJob =
                currentJobs.length === 1 && currentJobs[0] === eventJobId;

              removeStoreJobId(projectId, eventJobId);

              if (isLastJob && !isFinalizingRef.current) {
                finalizeAnalysis();
              }
            }
          }
        } else if (eventType === "failed" || eventType === "error") {
          console.error(
            `[useProjectAnalysis] Job ${eventJobId} FAILED:`,
            event.message || "Unknown error",
          );
          setAnalysisError(event.message || "분석 중 오류가 발생했습니다.");
          setBufferAnalyzing(false);
          onErrorRef.current?.(event.message || "Analysis failed");

          if (projectId) removeStoreJobId(projectId, eventJobId);
        }
      },
      onError: (err) => {
        console.error("[useJobSSE] Connection Error:", err);
        setAnalysisError(err);
        setBufferAnalyzing(false);
        onErrorRef.current?.(err);
      },
      terminateOnComplete: false,
    },
  );

  // 전역 진행률 계산 (분석 Job만 대상으로 계산)
  useEffect(() => {
    // Calculate total progress for ANALYSIS jobs only (not image jobs)
    const currentActiveJobIds = projectId
      ? activeAnalysisJobs[projectId] || []
      : [];
    const totalProgress = currentActiveJobIds.reduce(
      (sum, jobId) => sum + (jobProgresses[jobId] || 0),
      0,
    );

    if (currentActiveJobIds.length === 0) {
      if (isAnalyzing && !isRequestingRef.current) {
        startTransition(() => {
          finalizeAnalysis();
        });
      }
      return;
    }

    const averageProgress =
      currentActiveJobIds.length > 0
        ? Math.round(totalProgress / currentActiveJobIds.length)
        : 100;

    // Avoid synchronous state update in effect
    setTimeout(() => {
      setAnalysisProgress(averageProgress);
      setGlobalProgress(averageProgress);
    }, 0);

    // Update progress tracking refs
    if (averageProgress >= 100 && isAnalyzing) {
      if (lastProgressRef.current !== averageProgress) {
        lastProgressRef.current = averageProgress;
        lastProgressUpdateRef.current = Date.now();
      }
    } else {
      lastProgressRef.current = averageProgress;
      lastProgressUpdateRef.current = Date.now();
      if (isStuck) {
        startTransition(() => setIsStuck(false));
      }
    }
  }, [
    jobProgresses,
    activeAnalysisJobs,
    projectId,
    isAnalyzing,
    setGlobalProgress,
    setBufferAnalyzing,
    isStuck,
    clearStoreJobs,
    queryClient,
    setLastAnalyzedHashes,
    finalizeAnalysis,
  ]);

  // [Stuck Mitigation Timer]
  // 100% 도달 후 3초가 지나도 완료되지 않으면 강제로 완료 처리
  useEffect(() => {
    const currentActiveJobIds = projectId
      ? activeAnalysisJobs[projectId] || []
      : [];

    if (
      analysisProgress >= 100 &&
      isAnalyzing &&
      currentActiveJobIds.length > 0 &&
      !isRequestingRef.current &&
      !isFinalizingRef.current
    ) {
      const timerId = setTimeout(() => {
        // Use ref to avoid dependency on finalizeAnalysis
        if (finalizeAnalysisRef.current && isMountedRef.current) {
          startTransition(() => {
            finalizeAnalysisRef.current?.();
            setIsStuck(true);
          });
        }
      }, 3000); // 3초 후 자동 완료

      return () => clearTimeout(timerId);
    }
  }, [analysisProgress, isAnalyzing, activeAnalysisJobs, projectId]);

  // Project Stream 이벤트 처리 (jobId별 분기)
  const queryClientRef = useRef(queryClient);
  useEffect(() => {
    queryClientRef.current = queryClient;
  }, [queryClient]);

  useEffect(() => {
    if (!projectId || !isConnected) return;

    // useJobSSE가 내부적으로 message 리스너를 달고 있지만
    // 우리는 이곳에서 별도의 로직을 수행하거나 useJobSSE를 확장할 수 있음
    // 현재 구현에서는 useJobSSE가 generic message를 처리하므로,
    // 개별 job의 진행률을 업데이트하기 위해 전역 이벤트를 수신하는 방식을 고려하거나
    // useJobSSE의 이벤트를 기반으로 로컬 상태를 업데이트함
  }, [
    projectId,
    isConnected,
    activeJobs,
    addStoreJobId,
    removeStoreJobId,
    queryClient,
  ]);

  // Sync - 이 부분은 useJobSSE가 단일 작업용이라 프로젝트 스트림에서는 로직이 달라져야 함
  // 일단은 polling fallback이 작동하도록 유지하거나, SSE 리스너를 직접 관리

  // Project Status SSE (Optional/Leftover) - Commented out to prefer Job Stream
  /*
  useEffect(() => {
    // ... manual SSE code removed ...
  }, []);
  */

  // 분석 트리거 (변경된 문서만 분석)
  const triggerAnalysis = useCallback(async () => {
    if (!projectId || isAnalyzing) {
      return;
    }

    const store = useAnalysisBufferStore.getState();

    // 변경된 문서만 추출 (이미 분석 중인 문서는 제외)
    const changedDocuments = store.getChangedDocuments();

    if (changedDocuments.length === 0) {
      return;
    }

    // 분석 상태 시작
    isRequestingRef.current = true;
    isFinalizingRef.current = false; // Reset finalizing flag

    // [Fix] 새 분석 시작 시 이전 Job ID들 제거 (진행률 섞임 방지)
    useAnalysisBufferStore.getState().clearAnalysisJobs(projectId);

    setBufferAnalyzing(true);
    setAnalysisError(null);
    if (!isAnalyzing) {
      setAnalysisProgress(0);
    }

    // 분석 요청할 문서들의 해시 계산 및 pendingDocuments에 추가
    const newPendingHashes: Record<string, string> = {};
    changedDocuments.forEach((chunk) => {
      const hash = aiService.calculateContentHash(chunk.content);
      newPendingHashes[chunk.documentId] = hash;
    });

    // pendingDocuments에 추가 (분석 완료 전까지 중복 요청 방지)
    store.setPendingDocuments(newPendingHashes);

    // 각 문서에 대해 분석 요청
    const errors: string[] = [];

    for (const chunk of changedDocuments) {
      try {
        const response = await aiService.analyzeStory({
          projectId,
          documentId: chunk.documentId,
          content: chunk.content,
          analysisType: "partial_snippet",
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const resData = response as any;
        const actualData = resData.data || resData;
        const jobId =
          actualData?.jobId || actualData?.documentId || actualData?.id;

        if (jobId) {
          // Debug: 문서별 분석 Job ID 추가
          if (process.env.NODE_ENV === "development") {
            // Log if needed
          }
          addStoreJobId(projectId, jobId);
          setJobProgresses((prev) => ({ ...prev, [jobId]: 0 }));
        }
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "Analysis request failed";
        console.error(
          `Failed to analyze document ${chunk.documentId}:`,
          errorMsg,
        );
        errors.push(errorMsg);

        // 실패 시 해당 문서만 pendingDocuments에서 제거
        const currentPending =
          useAnalysisBufferStore.getState().pendingDocuments;
        const remainingPending = { ...currentPending };
        delete remainingPending[chunk.documentId];
        useAnalysisBufferStore.setState({ pendingDocuments: remainingPending });
      }
    }

    if (errors.length > 0) {
      const combinedError = `Failed to analyze ${errors.length} documents. Last error: ${errors[errors.length - 1]}`;
      setAnalysisError(combinedError);
      onErrorRef.current?.(combinedError);

      if (!isAnalyzing && changedDocuments.length === errors.length) {
        // 모든 요청이 실패했을 경우에만 분석 상태 해제
        setBufferAnalyzing(false);
      }
    }

    isRequestingRef.current = false;
  }, [projectId, isAnalyzing, setBufferAnalyzing, addStoreJobId]);

  // Flush and analyze (강제 실행)
  const flushAndAnalyze = useCallback(async () => {
    if (isAnalyzing) return;
    const summary = getBufferSummary();
    if (summary.charCount > 0) {
      await triggerAnalysis();
    }
  }, [getBufferSummary, triggerAnalysis, isAnalyzing]);

  // triggerReanalysisRef 업데이트 (finalizeAnalysis에서 사용)
  useEffect(() => {
    triggerReanalysisRef.current = triggerAnalysis;
  }, [triggerAnalysis]);

  // finalizeAnalysisRef 업데이트 (타이머에서 사용)

  useEffect(() => {
    finalizeAnalysisRef.current = finalizeAnalysis;
  }, [finalizeAnalysis]);

  // 자동 flush 체크 (주기적)

  // Job Status Recovery & Polling Fallback
  const checkJobStatus = useCallback(async () => {
    if (!currentJobId) {
      if (isAnalyzing) {
        setBufferAnalyzing(false);
      }
      return;
    }

    if (currentJobType !== "analysis" && currentJobType !== "image") {
      return;
    }

    try {
      let status;
      if (currentJobType === "image") {
        status = await imageService.getImageJobStatus(currentJobId);
      } else {
        status = await aiService.getJobStatus<AnalysisResultData>(currentJobId);
      }

      // Check for implicit completion (if the response IS the result)
      // If status field is missing but we have 'characters' or 'sections', assume it's the result data

      const statusAny = status as unknown as Record<string, unknown>;
      const hasResultFields = "characters" in status || "sections" in status;
      const explicitStatus = statusAny.status;

      let normalizedStatus = "pending";
      if (typeof explicitStatus === "string") {
        normalizedStatus = explicitStatus.toLowerCase().trim();
      } else if (hasResultFields) {
        normalizedStatus = "completed";
      }

      // Progress Update & Force Completion if 100%
      const progress =
        typeof statusAny.progress === "number" ? statusAny.progress : 0;
      if (progress >= 100) {
        normalizedStatus = "completed";
      }

      if (typeof statusAny.progress === "number") {
        startTransition(() => {
          setJobProgresses((prev) => ({
            ...prev,
            [currentJobId]: statusAny.progress as number,
          }));
        });
      }

      // If job completed
      if (
        normalizedStatus === "completed" ||
        normalizedStatus === "success" ||
        normalizedStatus === "done"
      ) {
        if (statusAny.result) {
          lastResultRef.current = statusAny.result as AnalysisResultData;
        }

        startTransition(() => {
          setJobProgresses((prev) => ({ ...prev, [currentJobId]: 100 }));
        });

        if (projectId && currentJobId) {
          removeStoreJobId(projectId, currentJobId);
        }
        // finalizeAnalysis() call removed to prevent double invocation.
        // removal of jobId triggers the useEffect which calls finalizeAnalysis via activeJobs check.
        return;
      }

      // Handle Failed
      if (normalizedStatus === "failed" || normalizedStatus === "error") {
        const errorDetail =
          statusAny.error || statusAny.message || "분석 작업이 실패했습니다.";
        setBufferAnalyzing(false);
        setGlobalProgress(0);
        if (projectId && currentJobId)
          removeStoreJobId(projectId, currentJobId);
        onErrorRef.current?.(errorDetail as string);
        return;
      }

      const validInProgressStatuses = [
        "processing",
        "pending",
        "sent",
        "queued",
      ];
      if (!validInProgressStatuses.includes(normalizedStatus)) {
        if (projectId && currentJobId)
          removeStoreJobId(projectId, currentJobId);
        return;
      }

      if (!isAnalyzing && currentJobType === "analysis") {
        setBufferAnalyzing(true);
      }
    } catch (error) {
      // If 404 (Not Found), 422 (Invalid ID format), or 500 (Server Error), clear the state.
      const axiosError = error as { response?: { status?: number } };
      const status = axiosError?.response?.status;
      if (status === 404 || status === 422 || status === 500) {
        if (projectId && currentJobId)
          removeStoreJobId(projectId, currentJobId);
      }
    }
  }, [
    currentJobId,
    currentJobType,
    isAnalyzing,
    projectId,
    setBufferAnalyzing,
    setGlobalProgress,
    removeStoreJobId,
  ]);

  // Polling Fallback
  useEffect(() => {
    if (
      !currentJobId ||
      (currentJobType !== "analysis" && currentJobType !== "image") ||
      !isAnalyzing ||
      isConnected
    ) {
      return;
    }

    const intervalId = window.setInterval(() => {
      startTransition(() => {
        checkJobStatus();
      });
    }, 5000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [currentJobId, currentJobType, isAnalyzing, isConnected, checkJobStatus]);

  return {
    isAnalyzing,
    analysisProgress,
    analysisError,
    triggerAnalysis,
    flushAndAnalyze,
    resetAnalysis,
    lastConsistencyReport,
    isStuck,
    currentJobType,
    isCheckingJobStatus,
  };
}
