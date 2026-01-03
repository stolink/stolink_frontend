import type * as d3 from "d3";
import type { CharacterRole, RelationType } from "./character";

// =====================================================
// 📊 캐릭터 그래프 (D3.js Force Simulation) 타입
// =====================================================

/**
 * D3 시뮬레이션용 노드 타입
 * Character._id를 id로 사용
 */
export interface CharacterNode extends d3.SimulationNodeDatum {
  id: string; // Character._id
  name: string; // profile.name
  role?: CharacterRole;
  group?: string; // profile.faction.name
  imageUrl?: string; // Optional - 별도 생성 또는 없음
  relationCount?: number;
  status?: string; // 캐릭터 상태 (alive, dead, unknown 등)
  // D3 런타임 필드 (시뮬레이션이 자동 추가)
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

/**
 * D3 시뮬레이션용 링크 타입
 * CharacterRelation에서 변환됨
 */
export interface RelationshipLink extends d3.SimulationLinkDatum<CharacterNode> {
  id: string; // 생성: `${source}-${target}`
  source: string | CharacterNode;
  target: string | CharacterNode;
  type: RelationType; // from relation_type
  strength: number;
  label?: string; // Legacy alias for description
  description?: string;
  bidirectional?: boolean;
  evolvedFrom?: RelationType;
  since?: string;
  // New fields from schema
  publicStance?: string;
  privateFeeling?: string;
  /** Curve factor for multiple links between same nodes (-1 to 1) */
  curvature?: number;
  /** BFS depth from protagonist for flow animation delay */
  flowDepth?: number;
  // Legacy history field
  history?: {
    eventId: string;
    title: string;
    chapter?: string;
    type: RelationType;
    reason?: string;
    date?: string;
  }[];
}

/**
 * 그래프 데이터 구조
 */
export interface GraphData {
  nodes: CharacterNode[];
  links: RelationshipLink[];
}

/**
 * 컴포넌트 Props
 */
export interface CharacterGraphProps {
  characters: CharacterNode[];
  links: RelationshipLink[];
  onNodeClick?: (node: CharacterNode) => void;
  onLinkClick?: (link: RelationshipLink) => void;
  selectedNodeId?: string | null;
  relationTypeFilter?: RelationType | "all";
  className?: string;
}

/**
 * 줌 상태
 */
export interface ZoomState {
  scale: number;
  x: number;
  y: number;
}
