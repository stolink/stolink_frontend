import { useCallback, useRef, useState, useEffect } from "react";
import * as d3 from "d3";
import type { CharacterNode } from "@/types";

interface UseDragOptions {
  onDragStart?: (node: CharacterNode) => void;
  onDragEnd?: (node: CharacterNode) => void;
  reheat: () => void;
}

/**
 * D3 Drag 동작을 제공하는 훅
 */
export function useDrag(options: UseDragOptions) {
  const { onDragStart, onDragEnd, reheat } = options;

  // 드래그 중인 노드를 추적
  const isDraggingRef = useRef(false);

  // 드래그 시작
  const handleDragStart = useCallback(
    (
      event: d3.D3DragEvent<SVGGElement, CharacterNode, CharacterNode>,
      d: CharacterNode
    ) => {
      // Wake up simulation ("Mongle-Mongle" effect)
      reheat();

      isDraggingRef.current = true;
      d.fx = d.x;
      d.fy = d.y;
      onDragStart?.(d);
    },
    [onDragStart, reheat]
  );

  // 드래그 중
  const handleDrag = useCallback(
    (
      event: d3.D3DragEvent<SVGGElement, CharacterNode, CharacterNode>,
      d: CharacterNode
    ) => {
      d.fx = event.x;
      d.fy = event.y;
    },
    []
  );

  // 드래그 종료
  const handleDragEnd = useCallback(
    (
      event: d3.D3DragEvent<SVGGElement, CharacterNode, CharacterNode>,
      d: CharacterNode
    ) => {
      isDraggingRef.current = false;
      // 드래그 종료 후 위치 해제 (자유 이동)
      d.fx = null;
      d.fy = null;
      onDragEnd?.(d);
    },
    [onDragEnd]
  );

  // D3 drag behavior 생성
  const [dragBehavior] = useState(() => d3.drag<SVGGElement, CharacterNode>());

  useEffect(() => {
    dragBehavior
      .on("start", handleDragStart)
      .on("drag", handleDrag)
      .on("end", handleDragEnd);
  }, [dragBehavior, handleDragStart, handleDrag, handleDragEnd]);

  return {
    dragBehavior,
  };
}
