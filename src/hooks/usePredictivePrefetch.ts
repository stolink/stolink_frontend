import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { documentService } from "@/services/documentService";

interface Chapter {
  id: string;
  title?: string;
}

interface NetworkInfo {
  saveData: boolean;
  effectiveType?: "slow-2g" | "2g" | "3g" | "4g";
  downlink?: number;
}

/**
 * 사용자 행동 예측 기반의 프리페칭 훅
 *
 * - Intersection Observer로 스크롤 80% 감지 시 다음 챕터 프리페칭
 * - Network Aware Loading: 데이터 절약 모드 감지
 * - Cache API를 통한 효율적인 캐싱
 */
export function usePredictivePrefetch(
  currentChapterId: string | null,
  chapters: Chapter[],
  options?: {
    scrollThreshold?: number; // 0-1, 기본 0.8
    enabled?: boolean;
  }
) {
  const queryClient = useQueryClient();
  const observerRef = useRef<IntersectionObserver | null>(null);
  const hasPrefetchedRef = useRef<Set<string>>(new Set());

  const { scrollThreshold = 0.8, enabled = true } = options || {};

  // 프리페치 함수 (useCallback으로 안정화)
  const prefetchChapter = useCallback(
    async (chapterId: string) => {
      if (hasPrefetchedRef.current.has(chapterId)) return;
      hasPrefetchedRef.current.add(chapterId);

      try {
        // TanStack Query를 통한 프리페치
        await queryClient.prefetchQuery({
          queryKey: ["documents", chapterId],
          queryFn: () => documentService.getById(chapterId),
          staleTime: 5 * 60 * 1000, // 5분
        });
      } catch (error) {
        console.error(
          `[Prefetch] Failed to prefetch chapter: ${chapterId}`,
          error
        );
        // 실패 시 다시 시도할 수 있도록 Set에서 제거
        hasPrefetchedRef.current.delete(chapterId);
      }
    },
    [queryClient]
  );

  useEffect(() => {
    if (!enabled || !currentChapterId) return;

    // 현재 챕터 인덱스 찾기
    const currentIndex = chapters.findIndex((c) => c.id === currentChapterId);
    if (currentIndex === -1 || currentIndex >= chapters.length - 1) return;

    const nextChapter = chapters[currentIndex + 1];
    if (!nextChapter || hasPrefetchedRef.current.has(nextChapter.id)) return;

    // 네트워크 상태 확인 (데이터 절약 모드)
    const connection = (navigator as Navigator & { connection?: NetworkInfo })
      .connection;
    const shouldSkipPrefetch =
      connection?.saveData ||
      connection?.effectiveType === "slow-2g" ||
      connection?.effectiveType === "2g";

    if (shouldSkipPrefetch) {
      return;
    }

    // 스크롤 영역 찾기 (에디터 스크롤 컨테이너)
    const scrollArea =
      document.querySelector("[data-scroll-area]") ||
      document.querySelector(".editor-scroll-area") ||
      document.querySelector(".ProseMirror")?.parentElement;

    if (!scrollArea) {
      // 스크롤 영역이 없으면 즉시 프리페치
      prefetchChapter(nextChapter.id);
      return;
    }

    // Intersection Observer 설정
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (
            entry.isIntersecting &&
            entry.intersectionRatio >= scrollThreshold
          ) {
            prefetchChapter(nextChapter.id);
          }
        });
      },
      {
        root: scrollArea,
        threshold: [scrollThreshold],
        rootMargin: "0px 0px -20% 0px", // 하단 20% 전에 트리거
      }
    );

    // 스크롤 영역의 마지막 자식 관찰 (하단 도달 감지)
    const sentinel = document.createElement("div");
    sentinel.style.height = "1px";
    sentinel.style.position = "absolute";
    sentinel.style.bottom = "0";
    sentinel.dataset.prefetchSentinel = "true";
    scrollArea.appendChild(sentinel);

    observerRef.current.observe(sentinel);

    return () => {
      observerRef.current?.disconnect();
      sentinel.remove();
    };
  }, [currentChapterId, chapters, scrollThreshold, enabled, prefetchChapter]);

  // 수동 프리페치 트리거 (선택적)
  const triggerPrefetch = useCallback(
    (chapterId: string) => {
      prefetchChapter(chapterId);
    },
    [prefetchChapter]
  );

  return {
    triggerPrefetch,
    hasPrefetched: (chapterId: string) =>
      hasPrefetchedRef.current.has(chapterId),
  };
}

/**
 * 네트워크 상태 감지 훅
 */
export function useNetworkStatus() {
  const connection = (navigator as Navigator & { connection?: NetworkInfo })
    .connection;

  return {
    isDataSaver: connection?.saveData ?? false,
    effectiveType: connection?.effectiveType ?? "4g",
    downlink: connection?.downlink,
    isSlowNetwork:
      connection?.effectiveType === "slow-2g" ||
      connection?.effectiveType === "2g",
  };
}
