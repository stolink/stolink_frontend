import type * as d3 from "d3";
import type { CharacterRole } from "./character";

// =====================================================
// 📊 캐릭터 그래프 (D3.js Force Simulation) 타입
// =====================================================

// 관계 타입 (단순화: 3종)
export type RelationType = "friend" | "lover" | "enemy";

// D3 시뮬레이션용 노드 타입
export interface CharacterNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  role?: CharacterRole;
  imageUrl?: string;
  // D3 런타임 필드 (시뮬레이션이 자동 추가)
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

// D3 시뮬레이션용 링크 타입
export interface RelationshipLink extends d3.SimulationLinkDatum<CharacterNode> {
  id: string;
  source: string | CharacterNode;
  target: string | CharacterNode;
  type: RelationType;
  strength: number; // 1-10
  label?: string;
}

// 그래프 데이터 구조
export interface GraphData {
  nodes: CharacterNode[];
  links: RelationshipLink[];
}

// 컴포넌트 Props
export interface CharacterGraphProps {
  characters: CharacterNode[];
  links: RelationshipLink[];
  onNodeClick?: (node: CharacterNode) => void;
  onLinkClick?: (link: RelationshipLink) => void;
  selectedNodeId?: string | null;
  relationTypeFilter?: RelationType | "all";
  className?: string;
}

// 줌 상태
export interface ZoomState {
  scale: number;
  x: number;
  y: number;
}
