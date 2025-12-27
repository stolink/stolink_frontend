import { useEffect, useRef, useCallback, useSyncExternalStore } from "react";
import * as d3 from "d3";
import type { CharacterNode, RelationshipLink } from "@/types";
import {
  FORCE_CONFIG,
  NODE_SIZES,
} from "@/components/CharacterGraph/constants";

interface UseForceSimulationOptions {
  width: number;
  height: number;
}

interface SimulationState {
  nodes: CharacterNode[];
  links: RelationshipLink[];
}

interface UseForceSimulationReturn {
  nodes: CharacterNode[];
  links: RelationshipLink[];
  reheat: () => void;
}

/**
 * D3 Force Simulation을 관리하는 훅
 * Obsidian 스타일의 부드럽고 유동적인 물리 시뮬레이션
 */
export function useForceSimulation(
  initialNodes: CharacterNode[],
  initialLinks: RelationshipLink[],
  options: UseForceSimulationOptions,
): UseForceSimulationReturn {
  const { width, height } = options;

  // 시뮬레이션과 상태를 저장하는 store
  const storeRef = useRef<{
    simulation: d3.Simulation<CharacterNode, RelationshipLink> | null;
    state: SimulationState;
    listeners: Set<() => void>;
  }>({
    simulation: null,
    state: { nodes: [], links: [] },
    listeners: new Set(),
  });

  // 노드 반지름 계산
  const getNodeRadius = useCallback((node: CharacterNode): number => {
    return node.role === "protagonist"
      ? NODE_SIZES.protagonist / 2
      : NODE_SIZES.default / 2;
  }, []);

  // 시뮬레이션 초기화/업데이트
  useEffect(() => {
    const store = storeRef.current;

    // 노드/링크 복사 - 초기 위치를 중앙에서 시작 (엔트리 애니메이션)
    const nodesCopy = initialNodes.map((d) => ({
      ...d,
      // 중앙에서 약간의 랜덤 오프셋으로 시작
      x: width / 2 + (Math.random() - 0.5) * 50,
      y: height / 2 + (Math.random() - 0.5) * 50,
    }));
    const linksCopy = initialLinks.map((d) => ({ ...d }));

    // 기존 시뮬레이션 정리
    if (store.simulation) {
      store.simulation.stop();
    }

    // 새 시뮬레이션 생성 (Obsidian 스타일)
    const simulation = d3
      .forceSimulation<CharacterNode, RelationshipLink>(nodesCopy)
      // 링크 포스 - 소프트 스프링
      .force(
        "link",
        d3
          .forceLink<CharacterNode, RelationshipLink>(linksCopy)
          .id((d) => d.id)
          .distance(FORCE_CONFIG.linkDistance)
          .strength(FORCE_CONFIG.linkStrength),
      )
      // 반발력 - 거리 제한 추가
      .force(
        "charge",
        d3
          .forceManyBody<CharacterNode>()
          .strength(FORCE_CONFIG.charge)
          .distanceMin(FORCE_CONFIG.chargeDistanceMin)
          .distanceMax(FORCE_CONFIG.chargeDistanceMax),
      )
      // 부드러운 센터링
      .force(
        "center",
        d3
          .forceCenter(width / 2, height / 2)
          .strength(FORCE_CONFIG.centerStrength),
      )
      // X축 포지셔닝 (부드러운 분산)
      .force("x", d3.forceX(width / 2).strength(FORCE_CONFIG.positionStrength))
      // Y축 포지셔닝
      .force("y", d3.forceY(height / 2).strength(FORCE_CONFIG.positionStrength))
      // 충돌 감지
      .force(
        "collision",
        d3
          .forceCollide<CharacterNode>()
          .radius((d) => getNodeRadius(d) + FORCE_CONFIG.collisionPadding)
          .strength(FORCE_CONFIG.collisionStrength),
      )
      // 느린 수렴 = 더 오래 부드럽게 움직임
      .alphaDecay(FORCE_CONFIG.alphaDecay)
      .alphaMin(FORCE_CONFIG.alphaMin)
      // 낮은 마찰 = 더 유동적인 움직임
      .velocityDecay(FORCE_CONFIG.velocityDecay);

    // tick 이벤트 - 외부 store 업데이트 및 구독자 알림
    simulation.on("tick", () => {
      store.state = {
        nodes: [...nodesCopy],
        links: [...linksCopy],
      };
      store.listeners.forEach((listener) => listener());
    });

    store.simulation = simulation;

    return () => {
      simulation.stop();
    };
  }, [initialNodes, initialLinks, width, height, getNodeRadius]);

  // 중앙 포스 업데이트 (리사이즈 시)
  useEffect(() => {
    const store = storeRef.current;
    if (store.simulation) {
      store.simulation.force(
        "center",
        d3
          .forceCenter(width / 2, height / 2)
          .strength(FORCE_CONFIG.centerStrength),
      );
      store.simulation.force(
        "x",
        d3.forceX(width / 2).strength(FORCE_CONFIG.positionStrength),
      );
      store.simulation.force(
        "y",
        d3.forceY(height / 2).strength(FORCE_CONFIG.positionStrength),
      );
      store.simulation.alpha(0.3).restart();
    }
  }, [width, height]);

  // useSyncExternalStore로 상태 동기화
  const subscribe = useCallback((onStoreChange: () => void) => {
    const store = storeRef.current;
    store.listeners.add(onStoreChange);
    return () => {
      store.listeners.delete(onStoreChange);
    };
  }, []);

  const getSnapshot = useCallback(() => {
    return storeRef.current.state;
  }, []);

  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  // 시뮬레이션 재가열 함수
  const reheat = useCallback(() => {
    const store = storeRef.current;
    if (store.simulation) {
      store.simulation.alpha(0.8).restart();
    }
  }, []);

  return {
    nodes: state.nodes,
    links: state.links,
    reheat,
  };
}
