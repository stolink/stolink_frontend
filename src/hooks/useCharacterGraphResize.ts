import { useState, useEffect, useCallback, useRef } from "react";

interface Dimensions {
  width: number;
  height: number;
}

/**
 * ResizeObserver를 사용하여 컨테이너 크기를 감지하는 훅
 */
export function useResize(
  containerRef: React.RefObject<HTMLDivElement | null>,
): Dimensions {
  const [dimensions, setDimensions] = useState<Dimensions>({
    width: 800,
    height: 600,
  });

  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 디바운스된 리사이즈 핸들러
  const handleResize = useCallback((entries: ResizeObserverEntry[]) => {
    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current);
    }

    resizeTimeoutRef.current = setTimeout(() => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({ width, height });
      }
    }, 100); // 100ms 디바운스
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 초기 크기 설정
    const { width, height } = container.getBoundingClientRect();
    setDimensions({ width, height });

    // ResizeObserver 설정
    const observer = new ResizeObserver(handleResize);
    observer.observe(container);

    return () => {
      observer.disconnect();
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, [containerRef, handleResize]);

  return dimensions;
}
