import {
  useEffect,
  useRef,
  useCallback,
  useSyncExternalStore,
  useState,
} from "react";
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
  simulation: d3.Simulation<CharacterNode, RelationshipLink> | null;
}

/**
 * D3 Force Simulation을 관리하는 훅
 * Obsidian 스타일의 부드럽고 유동적인 물리 시뮬레이션
 */
export function useForceSimulation(
  initialNodes: CharacterNode[],
  initialLinks: RelationshipLink[],
  options: UseForceSimulationOptions & { enableGrouping?: boolean }
): UseForceSimulationReturn {
  const { width, height, enableGrouping = false } = options;

  // 시뮬레이션과 상태를 저장하는 store
  // 시뮬레이션 인스턴스를 상태로 관리 (Ref 대신 State 사용으로 린트 에러 해결 & 리렌더링 트리거)
  const [simulation, setSimulation] = useState<d3.Simulation<
    CharacterNode,
    RelationshipLink
  > | null>(null);

  // 시뮬레이션과 상태를 저장하는 store (내부 로직 및 useSyncExternalStore용)
  const storeRef = useRef<{
    simulation: d3.Simulation<CharacterNode, RelationshipLink> | null;
    state: SimulationState;
    listeners: Set<() => void>;
  }>({
    simulation: null,
    state: { nodes: [], links: [] },
    listeners: new Set(),
  });

  // simulationRef는 storeRef.simulation으로 대체 가능하므로 제거하거나,
  // 기존 코드 호환성을 위해 storeRef와 동기화.
  const simulationRef = useRef<d3.Simulation<
    CharacterNode,
    RelationshipLink
  > | null>(null);

  // 노드 반지름 계산
  const getNodeRadius = useCallback((node: CharacterNode): number => {
    // Leader 노드 크기 증가 (가시성 확보)
    if (node.role === "protagonist" || node.role === "antagonist") {
      return NODE_SIZES.protagonist * 0.7; // 기존 / 2 보다 조금 더 크게 (0.5 -> 0.7)
    }
    return NODE_SIZES.default / 2;
  }, []);

  // 시뮬레이션 초기화/업데이트
  useEffect(() => {
    const store = storeRef.current;

    // 노드/링크 복사
    const nodesCopy = initialNodes.map((d) => ({
      ...d,
      x: width / 2 + (Math.random() - 0.5) * 50,
      y: height / 2 + (Math.random() - 0.5) * 50,
    }));
    const linksCopy = initialLinks.map((d) => ({ ...d }));

    // 그룹 위치 계산 (Circular Layout)
    const groups = Array.from(
      new Set(nodesCopy.map((d) => d.group).filter(Boolean))
    ) as string[];
    const groupCenters: Record<string, { x: number; y: number }> = {};
    const radius = Math.min(width, height) * 0.35; // 화면 크기 비례 반지름

    groups.forEach((group, i) => {
      const angle = (i / groups.length) * 2 * Math.PI - Math.PI / 2; // 상단(-90도)부터 시작
      groupCenters[group] = {
        x: width / 2 + Math.cos(angle) * radius,
        y: height / 2 + Math.sin(angle) * radius,
      };
    });

    // 기존 시뮬레이션 정리
    if (simulationRef.current) {
      simulationRef.current.stop();
    }

    // 새 시뮬레이션 생성
    const newSimulation = d3
      .forceSimulation<CharacterNode, RelationshipLink>(nodesCopy)
      .force(
        "link",
        d3
          .forceLink<CharacterNode, RelationshipLink>(linksCopy)
          .id((d) => d.id)
          .distance(FORCE_CONFIG.linkDistance)
          .strength(
            enableGrouping
              ? FORCE_CONFIG.linkStrength * 0.5
              : FORCE_CONFIG.linkStrength
          ) // 그룹핑 시 링크 힘 약화
      )
      .force(
        "charge",
        d3
          .forceManyBody<CharacterNode>()
          .strength(FORCE_CONFIG.charge)
          .distanceMin(FORCE_CONFIG.chargeDistanceMin)
          .distanceMax(FORCE_CONFIG.chargeDistanceMax)
      )
      .force(
        "collision",
        d3
          .forceCollide<CharacterNode>()
          .radius((d) => getNodeRadius(d) + FORCE_CONFIG.collisionPadding)
          .strength(FORCE_CONFIG.collisionStrength)
      )
      .alphaDecay(FORCE_CONFIG.alphaDecay)
      .alphaMin(FORCE_CONFIG.alphaMin)
      .velocityDecay(FORCE_CONFIG.velocityDecay);

    // [CENTERING LOGIC - 중요도 기반]
    // 중요도 점수: 높을수록 그룹 중심에 가까움
    const getImportanceScore = (role: string | undefined): number => {
      switch (role) {
        case "protagonist":
          return 1.0; // 최고 중요도 → 중앙
        case "antagonist":
          return 0.9;
        case "mentor":
          return 0.7;
        case "supporting":
          return 0.5;
        case "sidekick":
          return 0.4;
        default:
          return 0.2; // 기타 → 외곽
      }
    };

    if (enableGrouping) {
      // === 그룹핑 모드: 중요도 기반 동심원 배치 ===
      newSimulation.force(
        "x",
        d3
          .forceX<CharacterNode>((d) => {
            if (!d.group || !groupCenters[d.group]) return width / 2;

            const groupCenter = groupCenters[d.group];
            const importance = getImportanceScore(d.role);

            // 중요도가 낮을수록 그룹 중심에서 외곽으로 오프셋
            // importance 1.0 → 오프셋 0 (정중앙)
            // importance 0.2 → 오프셋 최대 (외곽)
            const maxOffset = 60;
            const offset = (1 - importance) * maxOffset;

            // 노드별 일관된 각도 (id 기반 해시로 분산)
            const hash = d.id.charCodeAt(0) + (d.id.charCodeAt(1) || 0);
            const angle = (hash % 360) * (Math.PI / 180);

            return groupCenter.x + Math.cos(angle) * offset;
          })
          .strength((d) => {
            // 중요 인물일수록 강한 위치 고정
            const importance = getImportanceScore(d.role);
            return FORCE_CONFIG.positionStrength * (0.8 + importance * 0.7);
          })
      );

      newSimulation.force(
        "y",
        d3
          .forceY<CharacterNode>((d) => {
            if (!d.group || !groupCenters[d.group]) return height / 2;

            const groupCenter = groupCenters[d.group];
            const importance = getImportanceScore(d.role);

            const maxOffset = 60;
            const offset = (1 - importance) * maxOffset;

            const hash = d.id.charCodeAt(0) + (d.id.charCodeAt(1) || 0);
            const angle = (hash % 360) * (Math.PI / 180);

            return groupCenter.y + Math.sin(angle) * offset;
          })
          .strength((d) => {
            const importance = getImportanceScore(d.role);
            return FORCE_CONFIG.positionStrength * (0.8 + importance * 0.7);
          })
      );

      // 전체적으로 중앙 유지하되 약하게
      newSimulation.force(
        "center",
        d3.forceCenter(width / 2, height / 2).strength(0.05)
      );
    } else {
      // === 일반 모드 (기존) ===
      newSimulation
        .force(
          "center",
          d3
            .forceCenter(width / 2, height / 2)
            .strength(FORCE_CONFIG.centerStrength)
        )
        .force(
          "x",
          d3.forceX(width / 2).strength(FORCE_CONFIG.positionStrength)
        )
        .force(
          "y",
          d3.forceY(height / 2).strength(FORCE_CONFIG.positionStrength)
        );
    }

    // [Pre-warming]
    newSimulation.tick(10);

    // Initial State Sync
    store.state = { nodes: [...nodesCopy], links: [...linksCopy] };
    store.listeners.forEach((listener) => listener());

    // Update Refs & State
    simulationRef.current = newSimulation;
    store.simulation = newSimulation;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSimulation(newSimulation);

    return () => {
      newSimulation.stop();
    };
  }, [
    initialNodes,
    initialLinks,
    width,
    height,
    getNodeRadius,
    enableGrouping,
  ]);

  // 중앙 포스 업데이트 (리사이즈 시) - enableGrouping 상태 고려
  useEffect(() => {
    const store = storeRef.current;
    if (store.simulation) {
      // 리사이즈 시에는 간단히 중앙 포스만 업데이트하고 재시작
      // 복잡한 그룹핑 위치 재계산은 위 useEffect가 의존성(width, height)으로 처리함
      store.simulation.alpha(0.3).restart();
    }
  }, [width, height]);

  // useSyncExternalStore로 상태 동기화 (구조적 변경만 반영)
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
    if (simulationRef.current) {
      simulationRef.current.alpha(0.3).restart(); // 더 부드러운 재시작
    }
  }, []);

  return {
    nodes: state.nodes,
    links: state.links,
    reheat,
    simulation, // Expose state (safe for render)
  };
}
