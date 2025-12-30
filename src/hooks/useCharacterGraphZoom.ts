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
  centerAt: (x: number, y: number, scale?: number) => void;
}

/**
 * D3 Zoom 동작을 관리하는 훅
 * 성능 최적화: RAF 기반 상태 업데이트 스로틀링
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

  // 최신 줌 상태를 ref로 유지 (RAF 콜백에서 사용)
  const zoomStateRef = useRef<ZoomState>(zoomState);
  // RAF 스로틀링용 ref
  const rafRef = useRef<number | null>(null);

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

        // 최신 상태 ref에 저장
        zoomStateRef.current = {
          scale: transform.k,
          x: transform.x,
          y: transform.y,
        };

        // RAF 스로틀링: 이미 예약된 프레임 있으면 스킵 (끊김 방지)
        if (!rafRef.current) {
          rafRef.current = requestAnimationFrame(() => {
            setZoomState({ ...zoomStateRef.current });
            onZoomChange?.(zoomStateRef.current);
            rafRef.current = null;
          });
        }
      });

    d3.select(svg).call(zoom);
    zoomBehaviorRef.current = zoom;

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      d3.select(svg).on(".zoom", null);
    };
  }, [svgRef, gRef, onZoomChange]);

  // 줌 인
  const zoomIn = useCallback(() => {
    const svg = svgRef.current;
    const zoom = zoomBehaviorRef.current;
    if (!svg || !zoom) return;

    d3.select(svg).transition().duration(300).call(zoom.scaleBy, 1.3);
  }, [svgRef]);

  // 줌 아웃
  const zoomOut = useCallback(() => {
    const svg = svgRef.current;
    const zoom = zoomBehaviorRef.current;
    if (!svg || !zoom) return;

    d3.select(svg).transition().duration(300).call(zoom.scaleBy, 0.7);
  }, [svgRef]);

  // 줌 리셋
  const resetZoom = useCallback(() => {
    const svg = svgRef.current;
    const zoom = zoomBehaviorRef.current;
    if (!svg || !zoom) return;

    d3.select(svg)
      .transition()
      .duration(500)
      .call(zoom.transform, d3.zoomIdentity);
  }, [svgRef]);

  const centerAt = useCallback(
    (x: number, y: number, targetScale: number = 1.0) => {
      const svg = svgRef.current;
      const zoom = zoomBehaviorRef.current;
      if (!svg || !zoom) return;

      const width = svg.clientWidth || svg.getBoundingClientRect().width;
      const height = svg.clientHeight || svg.getBoundingClientRect().height;

      // Calculate translation to center the point (x, y)
      // transform = translate(cx, cy) * scale(k) * translate(-x, -y)
      const t = d3.zoomIdentity
        .translate(width / 2, height / 2)
        .scale(targetScale)
        .translate(-x, -y);

      d3.select(svg)
        .transition()
        .duration(750)
        .ease(d3.easeCubicOut)
        .call(zoom.transform, t);
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
