import type { CharacterNode, RelationshipLink } from "@/types";

/**
 * Canvas 렌더링 상태
 */
export interface CanvasRenderState {
  isSelected: boolean;
  isHighlighted: boolean;
  isDimmed: boolean;
  isHovered: boolean;
}

/**
 * 노드 렌더링 옵션
 */
export interface NodeRenderOptions {
  ctx: CanvasRenderingContext2D;
  node: CharacterNode;
  globalScale: number;
  state: CanvasRenderState;
  imageCache: Map<string, HTMLImageElement>;
  changeType?: "new" | "updated" | null;
  showLogicCheck?: boolean;
}

/**
 * 링크 렌더링 옵션
 */
export interface LinkRenderOptions {
  ctx: CanvasRenderingContext2D;
  link: RelationshipLink;
  globalScale: number;
  state: Omit<CanvasRenderState, "isHovered">;
  animationPhase: number; // 0-1
  changeType?: "inversion" | "collapse" | "new" | "conflict" | "updated";
  showTension?: boolean;
  showLogicCheck?: boolean;
}

/**
 * react-force-graph GraphData 타입
 */
export interface GraphData {
  nodes: CharacterNode[];
  links: RelationshipLink[];
}

/**
 * Faction 단위 클러스터 노드 (Macro View용)
 */
export interface ClusterNode extends CharacterNode {
  isCluster: true;
  factionName: string;
  memberCount: number;
  memberIds: string[];
}

/**
 * 클러스터 간 묶음 링크 (Edge Bundling용)
 */
export interface ClusterLink {
  id: string;
  source: string | ClusterNode;
  target: string | ClusterNode;
  count: number; // 묶인 링크 수
  strength: number; // 평균 강도
  dominantType: "friendly" | "hostile" | "mixed";
  typeBreakdown: {
    friendly: number;
    hostile: number;
    other: number;
  };
  bundledLinkIds: string[];
}
