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
 * useSyncExternalStore를 사용하여 D3 시뮬레이션을 React와 동기화
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

    // 노드/링크 복사
    const nodesCopy = initialNodes.map((d) => ({ ...d }));
    const linksCopy = initialLinks.map((d) => ({ ...d }));

    // 기존 시뮬레이션 정리
    if (store.simulation) {
      store.simulation.stop();
    }

    // 새 시뮬레이션 생성
    const simulation = d3
      .forceSimulation<CharacterNode, RelationshipLink>(nodesCopy)
      .force(
        "link",
        d3
          .forceLink<CharacterNode, RelationshipLink>(linksCopy)
          .id((d) => d.id)
          .distance((link) => {
            const strength =
              typeof link.strength === "number" ? link.strength : 5;
            return FORCE_CONFIG.linkDistance / (strength / 5);
          })
          .strength((link) => {
            const strength =
              typeof link.strength === "number" ? link.strength : 5;
            return strength / 10;
          }),
      )
      .force(
        "charge",
        d3.forceManyBody<CharacterNode>().strength(FORCE_CONFIG.charge),
      )
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force(
        "collision",
        d3
          .forceCollide<CharacterNode>()
          .radius((d) => getNodeRadius(d) + FORCE_CONFIG.collisionPadding),
      )
      .alphaDecay(FORCE_CONFIG.alphaDecay)
      .alphaMin(FORCE_CONFIG.alphaMin);

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
      store.simulation.force("center", d3.forceCenter(width / 2, height / 2));
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
      store.simulation.alpha(1).restart();
    }
  }, []);

  return {
    nodes: state.nodes,
    links: state.links,
    reheat,
  };
}
