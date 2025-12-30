import { useCallback, useRef, useState, useEffect } from "react";
import * as d3 from "d3";
import type { CharacterNode } from "@/types";
import { ANIMATION } from "@/components/CharacterGraph/constants";

interface UseDragOptions {
  onDragStart?: (node: CharacterNode) => void;
  onDragEnd?: (node: CharacterNode) => void;
  simulation?: d3.Simulation<CharacterNode, undefined> | null;
}

/**
 * D3 Drag 동작을 제공하는 훅
 * 메인 스레드 부하 감소: 드래그 중 시뮬레이션 alphaTarget 조정
 */
export function useDrag(options: UseDragOptions) {
  const { onDragStart, onDragEnd, simulation } = options;

  // 드래그 중인 노드를 추적
  const isDraggingRef = useRef(false);

  // 드래그 시작
  const handleDragStart = useCallback(
    (
      event: d3.D3DragEvent<SVGGElement, CharacterNode, CharacterNode>,
      d: CharacterNode,
    ) => {
      // 시뮬레이션 활성화 (드래그한 노드만 이동 - alphaTarget으로 부하 제어)
      if (simulation) {
        simulation.alphaTarget(ANIMATION.reheatStrength).restart();
      }

      isDraggingRef.current = true;
      d.fx = d.x;
      d.fy = d.y;
      onDragStart?.(d);
    },
    [onDragStart, simulation],
  );

  // 드래그 중 - 최소한의 작업만
  const handleDrag = useCallback(
    (
      event: d3.D3DragEvent<SVGGElement, CharacterNode, CharacterNode>,
      d: CharacterNode,
    ) => {
      d.fx = event.x;
      d.fy = event.y;
    },
    [],
  );

  // 드래그 종료
  const handleDragEnd = useCallback(
    (
      event: d3.D3DragEvent<SVGGElement, CharacterNode, CharacterNode>,
      d: CharacterNode,
    ) => {
      isDraggingRef.current = false;

      // 시뮬레이션 천천히 멈춤 (alphaTarget 0으로 설정)
      if (simulation) {
        simulation.alphaTarget(0);
      }

      // 드래그 종료 후 위치 해제 (자유 이동)
      d.fx = null;
      d.fy = null;
      onDragEnd?.(d);
    },
    [onDragEnd, simulation],
  );

  // D3 drag behavior 생성
  // AI Review suggests useRef, but accessing ref.current in render triggers strict ESLint rules.
  // useState(() => ...) guarantees single initialization and is safe for render access.
  // The instance is stable, and listeners are updated in useEffect.
  const [dragBehavior] = useState(() =>
    d3.drag<SVGGElement, CharacterNode, unknown>(),
  );

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
