import { useEffect, useRef } from "react";
import type {
  ForceGraphMethods,
  GraphData as ForceGraphData,
} from "react-force-graph-2d";
import * as d3 from "d3";
import type { CharacterNode, RelationshipLink } from "@/types";
import {
  SEMANTIC_FORCE_CONFIG,
  FORCE_CONFIG,
  RELATION_ANGLES,
} from "../constants";

/**
 * 관계 타입에 따른 가중치 계산
 * 양수 = 인력, 음수 = 척력
 */
function getRelationWeight(type: string, strength: number): number {
  const baseWeight =
    SEMANTIC_FORCE_CONFIG.relationWeights[type] ??
    SEMANTIC_FORCE_CONFIG.defaultRepulsion;

  // 강도 배율 적용: strength가 높을수록 효과 증가
  const strengthBonus = 1 + strength * SEMANTIC_FORCE_CONFIG.strengthMultiplier;

  return baseWeight * strengthBonus;
}

/**
 * Semantic Force를 적용하는 커스텀 훅
 * - 관계 타입에 따른 동적 link strength
 * - 같은 Faction 노드 간 추가 인력
 */
export function useSemanticForce(
  graphRef: React.RefObject<ForceGraphMethods | undefined>,
  nodes: CharacterNode[],
  links: RelationshipLink[],
  layoutMode: "default" | "focus" = "default",
  focusTargetId: string | null = null,
  graphDataRef: React.RefObject<ForceGraphData | null>,
) {
  // 노드 ID → CharacterNode 매핑
  const nodeMapRef = useRef<Map<string, CharacterNode>>(new Map());

  useEffect(() => {
    // 노드 맵 업데이트
    const map = new Map<string, CharacterNode>();
    nodes.forEach((node) => map.set(node.id, node));
    nodeMapRef.current = map;
  }, [nodes]);

  useEffect(() => {
    if (!graphRef.current) return;

    const fg = graphRef.current;

    // [New] Immediate Mutation for Centering
    // Putting this outside the force loop ensures it's set BEFORE camera moves.
    if (layoutMode === "focus" && focusTargetId) {
      const hero = nodes.find((n) => n.id === focusTargetId);
      if (hero) {
        // Move to origin IMMEDIATELY
        hero.fx = 0;
        hero.fy = 0;
        hero.x = 0;
        hero.y = 0;
      }
    } else {
      // Unpin everyone when exiting focus mode
      nodes.forEach((n) => {
        n.fx = undefined;
        n.fy = undefined;
      });
    }

    // 1. Link Force: 관계 타입/강도에 따른 동적 strength
    const linkForce = fg.d3Force("link") as d3.ForceLink<
      CharacterNode,
      RelationshipLink
    >;

    if (linkForce) {
      // 0. Disable Default Center Force
      // 기본 Center Force는 노드들을 (0,0)으로 강하게 모으므로, Radial Layout을 방해함.
      fg.d3Force("center", null);

      linkForce
        .distance((link: RelationshipLink) => {
          const source = link.source as CharacterNode;
          const target = link.target as CharacterNode;

          // [Focus Mode]
          if (layoutMode === "focus" && focusTargetId) {
            const isSourceFocus = source.id === focusTargetId;
            const isTargetFocus = target.id === focusTargetId;

            if (isSourceFocus || isTargetFocus) {
              // Hero와 직접 연결된 노드는 가까이 (위성 궤도)
              return 200;
            }
            return 2000; // 나머지는 멀리
          }

          // Type-based Distance (관계 타입에 따른 거리만 적용)
          const weight = getRelationWeight(link.type as string, link.strength);

          // 인력(양수) = 가까이, 척력(음수) = 멀리
          if (weight > 0) {
            // 인력: 기본 거리에서 줄임
            return Math.max(
              80,
              FORCE_CONFIG.linkDistance -
                weight * SEMANTIC_FORCE_CONFIG.attractionDistance,
            );
          } else {
            // 척력: 기본 거리에서 늘림
            return Math.min(
              400,
              FORCE_CONFIG.linkDistance +
                Math.abs(weight) * SEMANTIC_FORCE_CONFIG.repulsionDistance,
            );
          }
        })
        .strength((link: RelationshipLink) => {
          const source = link.source as CharacterNode;
          const target = link.target as CharacterNode;

          // [Focus Mode]
          if (layoutMode === "focus" && focusTargetId) {
            const isSourceFocus = source.id === focusTargetId;
            const isTargetFocus = target.id === focusTargetId;
            if (isSourceFocus || isTargetFocus) return 0.8; // Stronger link attraction
            return 0; // Hide others links basically
          }

          // Link strength: 관계 타입에 따라서만 결정
          const weight = getRelationWeight(link.type as string, link.strength);

          // 인력은 weight에 비례, 척력은 약하게
          if (weight > 0) {
            return FORCE_CONFIG.linkStrength * (1 + weight * 0.5);
          } else {
            return FORCE_CONFIG.linkStrength * 0.3;
          }
        });
    }

    // 2. Faction Clustering Force (균일한 척력 적용)
    // 모든 노드에 균일한 척력 적용 (그룹 관계없이)
    const factionForce = d3
      .forceManyBody<CharacterNode>()
      .strength((node) => {
        // [Focus Mode] Disable repulsion for focus node and neighbors
        if (layoutMode === "focus" && focusTargetId) {
          const isFocus = node.id === focusTargetId;
          const isNeighbor = links.some((l) => {
            const s = typeof l.source === "object" ? l.source.id : l.source;
            const t = typeof l.target === "object" ? l.target.id : l.target;
            return (
              (s === focusTargetId && t === node.id) ||
              (t === focusTargetId && s === node.id)
            );
          });
          if (isFocus || isNeighbor) return 0; // Let link and satellite forces handle them
        }

        // 모든 노드에 균일한 척력 (-500)
        return FORCE_CONFIG.charge;
      })
      .distanceMax(FORCE_CONFIG.chargeDistanceMax);

    // [Modification] We use a separate custom force for "Group Cohesion" instead of hacking Charge.
    // Making charge positive creates black holes. Better to use Centroid/Radial forces.

    // Let's stick to the Radial Plan but STRONGER.

    fg.d3Force("charge", factionForce);

    // 3. D3 Disjoint Force-Directed Graph 패턴 적용
    // forceX와 forceY를 사용하여 그룹별 위치 가이드
    const groups = Array.from(
      new Set(nodes.map((n) => n.group).filter((g) => g && g !== "무소속")),
    ) as string[];
    groups.sort();

    // [DEBUG] Log faction groups (초기화 시 1회만)
    if (groups.length > 0) {
      console.log("=== useSemanticForce: Faction Groups ===");
      console.log("Groups:", groups);
      console.log("Total Nodes:", nodes.length);
      const groupCounts = new Map<string, number>();
      nodes.forEach((n) => {
        if (n.group && n.group !== "무소속") {
          groupCounts.set(n.group, (groupCounts.get(n.group) || 0) + 1);
        }
      });
      console.table(Object.fromEntries(groupCounts));
    } else {
      console.warn(
        "[useSemanticForce] ❌ No faction groups found! All nodes are '무소속'.",
      );
    }

    // Distribute groups in circular pattern (D3 Observable 패턴)
    const baseRadius = SEMANTIC_FORCE_CONFIG.interGroupDistance || 1200;
    const groupCenters = new Map<string, { x: number; y: number }>();

    // 원형 배치: 균등하게 각도 분배
    const angleStep = (2 * Math.PI) / groups.length;

    groups.forEach((group, index) => {
      const angle = index * angleStep;
      const r = baseRadius;

      groupCenters.set(group, {
        x: Math.cos(angle) * r,
        y: Math.sin(angle) * r,
      });
    });

    // D3 Disjoint Pattern: forceX & forceY
    // 각 노드를 해당 그룹의 중심으로 약하게 당김
    const forceXConfig = d3
      .forceX<CharacterNode>()
      .x((node) => {
        if (layoutMode === "focus" && focusTargetId) {
          return node.id === focusTargetId ? 0 : node.x || 0;
        }
        const center = groupCenters.get(node.group || "");
        return center ? center.x : 0;
      })
      .strength(0.05); // 매우 약한 인력 (위치 가이드만)

    const forceYConfig = d3
      .forceY<CharacterNode>()
      .y((node) => {
        if (layoutMode === "focus" && focusTargetId) {
          return node.id === focusTargetId ? 0 : node.y || 0;
        }
        const center = groupCenters.get(node.group || "");
        return center ? center.y : 0;
      })
      .strength(0.05); // 매우 약한 인력 (위치 가이드만)

    fg.d3Force("x", forceXConfig);
    fg.d3Force("y", forceYConfig);

    // Focus Mode용 커스텀 Force (Satellite Layout만)
    const focusForce = (alpha: number) => {
      // Focus Mode가 아니면 아무것도 안 함 (forceX/forceY가 처리)
      if (layoutMode !== "focus" || !focusTargetId) return;

      // [CRITICAL FIX] 실제 시뮬레이션 노드 가져오기
      if (!graphDataRef.current) return;
      const simNodes = graphDataRef.current.nodes as CharacterNode[];

      const k = alpha * 1.2; // Extra strong force to bring them into viewport quickly

      simNodes.forEach((node) => {
        if (node.id === focusTargetId) {
          return;
        }

        // Find relationships with Hero
        const relatedLinks = links.filter((l) => {
          const s =
            typeof l.source === "object"
              ? (l.source as CharacterNode).id
              : l.source;
          const t =
            typeof l.target === "object"
              ? (l.target as CharacterNode).id
              : l.target;
          return (
            (s === focusTargetId && t === node.id) ||
            (t === focusTargetId && s === node.id)
          );
        });

        if (relatedLinks.length === 0) {
          return;
        }

        // Calculate Composite Vector
        let vecX = 0;
        let vecY = 0;
        let totalStrength = 0;

        relatedLinks.forEach((link) => {
          const type = (link.type || "neutral").toLowerCase();
          const angleDeg =
            (RELATION_ANGLES as Record<string, number>)[type] ?? 270;
          const angleRad = angleDeg * (Math.PI / 180);

          const weight = 1 + (link.strength || 1) * 0.5;
          vecX += Math.cos(angleRad) * weight;
          vecY += -Math.sin(angleRad) * weight; // Invert Y for screen
          totalStrength += link.strength || 1;
        });

        // Resultant Angle
        const finalAngle = Math.atan2(vecY, vecX);

        // Distance Logic
        const baseDist = 120;
        const strengthFactor = 1 + totalStrength * 0.5;
        const countFactor = Math.max(0.3, 1 - (relatedLinks.length - 1) * 0.1);

        const dist = (baseDist / strengthFactor) * countFactor;
        const targetX = Math.cos(finalAngle) * dist;
        const targetY = Math.sin(finalAngle) * dist;

        node.vx! += (targetX - node.x!) * k;
        node.vy! += (targetY - node.y!) * k;
      });
    };

    fg.d3Force("focus", focusForce);

    // Reheat
    fg.d3ReheatSimulation();

    return () => {
      if (fg) {
        fg.d3Force("x", null);
        fg.d3Force("y", null);
        fg.d3Force("focus", null);
      }
    };
  }, [graphRef, nodes, links, layoutMode, focusTargetId, graphDataRef]);
}
