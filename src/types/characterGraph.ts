import type * as d3 from "d3";
import type { CharacterRole, RelationType } from "./character";

// =====================================================
// 📊 캐릭터 그래프 (D3.js Force Simulation) 타입
// =====================================================

// =====================================================
// 🔀 레이아웃 모드 타입
// =====================================================

/**
 * 그래프 레이아웃 모드
 * - force: D3 force-directed 자유 배치
 * - concentric: 동심원 레이아웃 (포커스 노드 중심)
 */
export type LayoutMode = "force" | "concentric";

// =====================================================
// 🔗 복합 관계 (Super-edge) 타입
// =====================================================

/**
 * 복합 관계의 각 세그먼트
 * 하나의 엣지 내에서 여러 관계 타입을 시각화할 때 사용
 */
export interface RelationshipSegment {
  /** 관계 타입 */
  type: RelationType;
  /** 엣지 내 비율 (0-1, 전체 합 = 1) */
  ratio: number;
  /** 과거 관계 여부 (true = 점선, false = 실선) */
  isPast: boolean;
  /** 관계 강도 (1-10) */
  strength: number;
  /** 선택적 라벨 */
  label?: string;
}

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
  // Index signature for react-force-graph compatibility
  [key: string]: unknown;
}

/**
 * D3 시뮬레이션용 링크 타입
 * CharacterRelation에서 변환됨
 */
export interface RelationshipLink extends d3.SimulationLinkDatum<CharacterNode> {
  id: string; // 생성: `${source}-${target}`
  source: string | CharacterNode;
  target: string | CharacterNode;
  type: RelationType; // @deprecated Use relationTypes[0] or primaryType
  relationTypes?: RelationType[]; // New multi-type support
  primaryType?: RelationType; // Main type for coloring if needed
  strength: number;
  label?: string; // Legacy alias for description
  description?: string;
  bidirectional?: boolean;
  evolvedFrom?: RelationType;
  since?: string;
  // New fields from schema
  /** public_stance from backend */
  publicStance?: string;
  /** private_feeling from backend */
  privateFeeling?: string;
  /** revealed_in_chapter for 4D Timeline */
  revealedInChapter?: number;
  /** Algorithmic Insights: Logic Check (contradiction detected) */
  logicCheck?: {
    isContradictory: boolean;
    reason: string;
  };
  /** Algorithmic Insights: Tension Heatmap (1-10) */
  tensionScore?: number;
  /** Curve factor for multiple links between same nodes (-1 to 1) */
  curvature?: number;
  /** BFS depth from protagonist for flow animation delay */
  flowDepth?: number;
  /** Visual rendering pattern for Super Edges */
  visualPattern?: "standard" | "braided" | "parallel";
  /** Is this a super-edge representing multiple relationships? */
  isSuperEdge?: boolean;
  /** Original link objects if this is a super-edge */
  originalLinks?: RelationshipLink[];
  /**
   * 복합 관계 세그먼트 배열 (Super-edge)
   * 존재할 경우 type/strength 대신 segments로 렌더링
   */
  segments?: RelationshipSegment[];
  /** 관계 변화 타입 (timeline 애니메이션용) */
  changeType?: "new" | "strengthen" | "weaken" | "collapse";
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
