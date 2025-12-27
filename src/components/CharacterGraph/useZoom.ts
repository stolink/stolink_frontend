import { useEffect, useRef, useCallback, useState } from "react";
import * as d3 from "d3";
import type { ZoomState } from "./types";
import { ZOOM_CONFIG } from "./constants";

interface UseZoomOptions {
  onZoomChange?: (state: ZoomState) => void;
}

interface UseZoomReturn {
  zoomState: ZoomState;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
}

/**
 * D3 Zoom 동작을 관리하는 훅
 */
export function useZoom(
  svgRef: React.RefObject<SVGSVGElement | null>,
  gRef: React.RefObject<SVGGElement | null>,
  options: UseZoomOptions = {},
): UseZoomReturn {
  const { onZoomChange } = options;

  const [zoomState, setZoomState] = useState<ZoomState>({
    scale: ZOOM_CONFIG.initial,
    x: 0,
    y: 0,
  });

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
      .on("zoom", (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
        const { transform } = event;
        d3.select(g).attr("transform", transform.toString());

        const newState: ZoomState = {
          scale: transform.k,
          x: transform.x,
          y: transform.y,
        };
        setZoomState(newState);
        onZoomChange?.(newState);
      });

    d3.select(svg).call(zoom);
    zoomBehaviorRef.current = zoom;

    return () => {
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

  return {
    zoomState,
    zoomIn,
    zoomOut,
    resetZoom,
  };
}
