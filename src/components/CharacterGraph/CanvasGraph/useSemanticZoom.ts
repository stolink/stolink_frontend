import { useMemo } from "react";
import type { CharacterNode, RelationshipLink } from "@/types";
import { SEMANTIC_ZOOM_CONFIG, type ZoomLevel } from "../constants";
import type { ClusterNode, ClusterLink } from "./types";

/**
 * 노드가 주요 캐릭터인지 판단
 * Meso View에서 라벨 표시 여부 결정에 사용
 */
export function isMajorCharacter(node: CharacterNode): boolean {
  if (node.role === "protagonist") return true;
  if (node.role === "antagonist") return true;
  if ((node.relationCount || 0) >= SEMANTIC_ZOOM_CONFIG.majorCharacterThreshold)
    return true;
  return false;
}

/**
 * 줌 레벨에 따라 노드 라벨을 표시할지 결정
 */
export function shouldShowNodeLabel(
  node: CharacterNode,
  zoomLevel: ZoomLevel,
  globalScale: number,
): boolean {
  // 기본 스케일 체크 (너무 작으면 어차피 안 보임)
  if (globalScale < 0.25) return false;

  switch (zoomLevel) {
    case "macro":
      // Macro: 클러스터 노드만 라벨 표시
      return "isCluster" in node && (node as ClusterNode).isCluster;
    case "meso":
      // Meso: 주요 캐릭터만 표시
      return isMajorCharacter(node);
    case "micro":
      // Micro: 모두 표시 (기존 로직 유지)
      return globalScale > 0.35;
  }
}

/**
 * 줌 레벨에 따라 링크 라벨을 표시할지 결정
 */
export function shouldShowLinkLabel(zoomLevel: ZoomLevel): boolean {
  // Micro에서만 링크 라벨 표시
  return zoomLevel === "micro";
}

/**
 * Faction 기반 클러스터 데이터 생성 훅
 */
export function useClusterData(
  nodes: CharacterNode[],
  links: RelationshipLink[],
  zoomLevel: ZoomLevel,
) {
  return useMemo(() => {
    // Macro가 아니면 빈 데이터 반환 (성능 최적화)
    if (zoomLevel !== "macro") {
      return { clusterNodes: [], clusterLinks: [], factionMap: new Map() };
    }

    // 1. Faction별로 노드 그룹화
    const factionGroups = new Map<string, CharacterNode[]>();

    nodes.forEach((node) => {
      const faction = node.group || "무소속";
      if (!factionGroups.has(faction)) {
        factionGroups.set(faction, []);
      }
      factionGroups.get(faction)!.push(node);
    });

    // 2. 클러스터 노드 생성
    const clusterNodes: ClusterNode[] = [];
    const factionMap = new Map<string, ClusterNode>(); // nodeId -> cluster 매핑용

    factionGroups.forEach((members, factionName) => {
      // 멤버들의 평균 좌표 계산
      let avgX = 0,
        avgY = 0,
        count = 0;
      members.forEach((m) => {
        if (m.x !== undefined && m.y !== undefined) {
          avgX += m.x;
          avgY += m.y;
          count++;
        }
      });

      if (count > 0) {
        avgX /= count;
        avgY /= count;
      }

      const clusterNode: ClusterNode = {
        id: `cluster-${factionName}`,
        name: factionName,
        role: "other",
        group: factionName,
        isCluster: true,
        factionName,
        memberCount: members.length,
        memberIds: members.map((m) => m.id),
        relationCount: members.reduce(
          (sum, m) => sum + (m.relationCount || 0),
          0,
        ),
        x: avgX || 0,
        y: avgY || 0,
        // 시뮬레이션용 초기값
        vx: 0,
        vy: 0,
      };

      clusterNodes.push(clusterNode);

      // 멤버들에게 클러스터 매핑
      members.forEach((m) => {
        factionMap.set(m.id, clusterNode);
      });
    });

    // [DEBUG] Faction 클러스터 로그
    if (nodes.length > 0) {
      console.log("=== Macro View Clusters ===");
      console.table(
        clusterNodes.map((c) => ({
          name: c.name,
          count: c.memberCount,
        })),
      );
    }
    // 3. 클러스터 간 링크 생성 (Edge Bundling 데이터)
    const linkBundleMap = new Map<
      string,
      {
        count: number;
        totalStrength: number;
        friendly: number;
        hostile: number;
        other: number;
        linkIds: string[];
      }
    >();

    // 우호/적대 분류 헬퍼
    const classifyType = (type: string): "friendly" | "hostile" | "other" => {
      const normalized = type.toLowerCase();
      if (
        normalized === "friendly" ||
        normalized === "ally" ||
        normalized === "family" ||
        normalized === "romantic" ||
        normalized === "mentor"
      ) {
        return "friendly";
      }
      if (
        normalized === "hostile" ||
        normalized === "enemy" ||
        normalized === "rival"
      ) {
        return "hostile";
      }
      return "other";
    };

    links.forEach((link) => {
      const sourceId =
        typeof link.source === "string" ? link.source : link.source.id;
      const targetId =
        typeof link.target === "string" ? link.target : link.target.id;

      const sourceCluster = factionMap.get(sourceId);
      const targetCluster = factionMap.get(targetId);

      if (!sourceCluster || !targetCluster) return;
      if (sourceCluster.id === targetCluster.id) return; // 같은 클러스터 내부 링크 무시

      const key = [sourceCluster.id, targetCluster.id].sort().join("--");
      const existing = linkBundleMap.get(key) || {
        count: 0,
        totalStrength: 0,
        friendly: 0,
        hostile: 0,
        other: 0,
        linkIds: [],
      };

      const typeClass = classifyType(link.type as string);

      linkBundleMap.set(key, {
        count: existing.count + 1,
        totalStrength: existing.totalStrength + link.strength,
        friendly: existing.friendly + (typeClass === "friendly" ? 1 : 0),
        hostile: existing.hostile + (typeClass === "hostile" ? 1 : 0),
        other: existing.other + (typeClass === "other" ? 1 : 0),
        linkIds: [...existing.linkIds, link.id],
      });
    });

    const clusterLinks: ClusterLink[] = [];
    linkBundleMap.forEach((data, key) => {
      const [source, target] = key.split("--");

      // 다수결로 dominantType 결정
      let dominantType: "friendly" | "hostile" | "mixed";
      if (data.friendly > data.hostile && data.friendly >= data.other) {
        dominantType = "friendly";
      } else if (data.hostile > data.friendly && data.hostile >= data.other) {
        dominantType = "hostile";
      } else {
        dominantType = "mixed";
      }

      clusterLinks.push({
        id: key,
        source,
        target,
        count: data.count,
        strength: data.totalStrength / data.count,
        dominantType,
        typeBreakdown: {
          friendly: data.friendly,
          hostile: data.hostile,
          other: data.other,
        },
        bundledLinkIds: data.linkIds,
      });
    });

    return { clusterNodes, clusterLinks, factionMap };
  }, [nodes, links, zoomLevel]);
}
