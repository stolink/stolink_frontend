import { useEffect, useRef, useCallback, useState } from "react";
import * as d3 from "d3";
import type { ZoomState } from "@/types";
import { ZOOM_CONFIG } from "@/components/CharacterGraph/constants";

interface UseZoomOptions {
  onZoomChange?: (state: ZoomState) => void;
}

interface UseZoomReturn {
  zoomState: ZoomState;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  centerAt: (x: number, y: number, scale?: number) => Promise<void>;
}

/**
 * D3 Zoom 동작을 관리하는 훅
 * 성능 최적화: RAF 스로틀링, 단 transition 중에는 즉시 업데이트
 */
export function useZoom(
  svgRef: React.RefObject<SVGSVGElement | null>,
  gRef: React.RefObject<SVGGElement | null>,
  options: UseZoomOptions = {},
): UseZoomReturn {
  const { onZoomChange } = options;

  // 줌 상태
  const [zoomState, setZoomState] = useState<ZoomState>({
    scale: ZOOM_CONFIG.initial,
    x: 0,
    y: 0,
  });

  // 최신 상태 ref (RAF 콜백에서 사용)
  const latestStateRef = useRef<ZoomState>(zoomState);
  // RAF 스로틀링 ref
  const rafIdRef = useRef<number | null>(null);
  // Transition 중 플래그 (transition 중에는 스로틀링 비활성화)
  const isTransitioningRef = useRef(false);

  const zoomBehaviorRef = useRef<d3.ZoomBehavior<
    SVGSVGElement,
    unknown
  > | null>(null);

  // Zoom 동작 설정
  useEffect(() => {
    const svg = svgRef.current;
    const g = gRef.current;
    if (!svg || !g) return;

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([ZOOM_CONFIG.min, ZOOM_CONFIG.max])
      .filter((event) => {
        // Prevent zoom/pan if interacting with a node
        if (
          event.target instanceof Element &&
          event.target.closest(".node-group")
        ) {
          return false;
        }
        // Default D3 filter: Ignore secondary buttons and ctrl-click
        return !event.ctrlKey && !event.button;
      })
      .on("zoom", (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
        const { transform } = event;
        // D3 DOM 직접 조작 (즉시, 끊김 없음)
        d3.select(g).attr("transform", transform.toString());

        // 최신 상태를 ref에 즉시 저장
        const newState: ZoomState = {
          scale: transform.k,
          x: transform.x,
          y: transform.y,
        };
        latestStateRef.current = newState;

        // 항상 RAF 스로틀링 적용 (성능 최적화 및 일관된 부드러움)
        // Transition 중에도 React 상태 업데이트를 스로틀링하여 메인 스레드 부하 감소
        if (rafIdRef.current === null) {
          rafIdRef.current = requestAnimationFrame(() => {
            setZoomState({ ...latestStateRef.current });
            onZoomChange?.(latestStateRef.current);
            rafIdRef.current = null;
          });
        }
      });

    d3.select(svg).call(zoom);
    zoomBehaviorRef.current = zoom;

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      d3.select(svg).on(".zoom", null);
    };
  }, [svgRef, gRef, onZoomChange]);

  // 줌 인
  const zoomIn = useCallback(() => {
    const svg = svgRef.current;
    const zoom = zoomBehaviorRef.current;
    if (!svg || !zoom) return;

    isTransitioningRef.current = true;
    d3.select(svg)
      .transition()
      .duration(300)
      .call(zoom.scaleBy, 1.3)
      .on("end", () => {
        isTransitioningRef.current = false;
      });
  }, [svgRef]);

  // 줌 아웃
  const zoomOut = useCallback(() => {
    const svg = svgRef.current;
    const zoom = zoomBehaviorRef.current;
    if (!svg || !zoom) return;

    isTransitioningRef.current = true;
    d3.select(svg)
      .transition()
      .duration(300)
      .call(zoom.scaleBy, 0.7)
      .on("end", () => {
        isTransitioningRef.current = false;
      });
  }, [svgRef]);

  // 줌 리셋
  const resetZoom = useCallback(() => {
    const svg = svgRef.current;
    const zoom = zoomBehaviorRef.current;
    if (!svg || !zoom) return;

    isTransitioningRef.current = true;
    d3.select(svg)
      .transition()
      .duration(500)
      .call(zoom.transform, d3.zoomIdentity)
      .on("end", () => {
        isTransitioningRef.current = false;
      });
  }, [svgRef]);

  const centerAt = useCallback(
    (x: number, y: number, targetScale: number = 1.0) => {
      const svg = svgRef.current;
      const zoom = zoomBehaviorRef.current;
      if (!svg || !zoom) return Promise.resolve();

      return new Promise<void>((resolve) => {
        const width = svg.clientWidth || svg.getBoundingClientRect().width;
        const height = svg.clientHeight || svg.getBoundingClientRect().height;

        // Calculate translation to center the point (x, y)
        // transform = translate(cx, cy) * scale(k) * translate(-x, -y)
        const t = d3.zoomIdentity
          .translate(width / 2, height / 2)
          .scale(targetScale)
          .translate(-x, -y);

        isTransitioningRef.current = true;
        d3.select(svg)
          .transition()
          .duration(750)
          .ease(d3.easeCubicInOut)
          .call(zoom.transform, t)
          .on("end", () => {
            isTransitioningRef.current = false;
            resolve();
          });
      });
    },
    [svgRef],
  );

  return {
    zoomState,
    zoomIn,
    zoomOut,
    resetZoom,
    centerAt,
  };
}
