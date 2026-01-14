import type { CharacterRole } from "@/types";

// =====================================================
// 🎨 색상 설정
// =====================================================

// UI에서 사용하는 관계 타입
export type UIRelationType =
  | "friendly"
  | "hostile"
  | "romantic"
  | "family"
  | "neutral"
  | "complex";

/**
 * RelationType을 UIRelationType으로 변환
 * 백엔드 타입(ALLY, ENEMY 등)을 UI 타입(friendly, hostile 등)으로 매핑
 */
export function toUIRelationType(type: string): UIRelationType {
  const normalized = type.toLowerCase();
  const mapping: Record<string, UIRelationType> = {
    // UI types (direct mapping)
    friendly: "friendly",
    hostile: "hostile",
    romantic: "romantic",
    family: "family",
    neutral: "neutral",
    complex: "complex",
    // Backend types (uppercase)
    ally: "friendly",
    enemy: "hostile",
    rival: "hostile",
    mentor: "family",
    master_servant: "neutral",
    coworker: "neutral",
    classmate: "friendly",
  };
  return mapping[normalized] || "neutral";
}

export const MOCHA_COLORS = {
  500: "#8B7355", // Primary (Warm Brown)
  400: "#A89080", // Hover (Muted Taupe)
  700: "#574838", // Dark/Active
} as const;

// =====================================================
// 🎨 색상 설정 (Semantic Clustering)
// =====================================================

// 메타 카테고리 (Semantic Clustering)
export type MetaCategory = "positive" | "negative" | "neutral";

export const META_CATEGORY_COLORS = {
  positive: "#15803D", // Green/Blue (안정, 결속)
  negative: "#F44336", // Red/Orange (긴장, 갈등)
  neutral: "#7C6BA8", // Purple/Grey (위계, 기능)
} as const;

// 관계 타입별 메타 카테고리 매핑
export const RELATION_TO_META_CATEGORY: Record<UIRelationType, MetaCategory> = {
  friendly: "positive",
  romantic: "positive",
  family: "positive",
  hostile: "negative",
  neutral: "neutral",
  complex: "neutral",
};

// 관계 타입별 HEX 색상 (메타 카테고리 기반 재정의)
export const RELATION_COLORS_HEX = {
  // Positive Group (Green/Blue)
  friendly: "#15803D", // Standard Green
  romantic: "#DB2777", // Pink via Tokens (Updated from Emerald)
  family: "#4F5861", // Blue/Gray via Tokens

  // Negative Group (Red/Orange)
  hostile: "#E11D48", // Red via Tokens

  // Neutral/Complex
  neutral: "#9CA3AF", // Gray
  complex: "#7C3AED", // Violet (Super Edge)
} as const;

// 관계 타입별 색상 팔레트 (Meta-Category 색조 준수)
export const RELATION_PALETTE: Record<
  UIRelationType,
  { weak: string; standard: string; deep: string }
> = {
  friendly: {
    weak: "#86EFAC", // Green 300
    standard: RELATION_COLORS_HEX.friendly,
    deep: "#14532D", // Green 900
  },
  romantic: {
    weak: "#F472B6", // Pink 400
    standard: RELATION_COLORS_HEX.romantic,
    deep: "#831843", // Pink 900
  },
  family: {
    weak: "#94A3B8", // Slate 400
    standard: RELATION_COLORS_HEX.family,
    deep: "#1E293B", // Slate 800
  },
  hostile: {
    weak: "#FCA5A5", // Red 300
    standard: RELATION_COLORS_HEX.hostile,
    deep: "#7F1D1D", // Red 900
  },
  neutral: {
    weak: "#D1D5DB", // Gray 300
    standard: RELATION_COLORS_HEX.neutral,
    deep: "#374151", // Gray 700
  },
  complex: {
    weak: "#A78BFA", // Violet 400
    standard: RELATION_COLORS_HEX.complex,
    deep: "#4C1D95", // Violet 900
  },
};

// 관계 타입별 기본 색상 (Standard 기준)
export const RELATION_COLORS: Record<UIRelationType, string> = {
  friendly: RELATION_COLORS_HEX.friendly,
  hostile: RELATION_COLORS_HEX.hostile,
  romantic: RELATION_COLORS_HEX.romantic,
  family: RELATION_COLORS_HEX.family,
  neutral: RELATION_COLORS_HEX.neutral,
  complex: RELATION_COLORS_HEX.complex,
};

// 관계 타입별 라벨 (한글)
// 관계 타입별 라벨 (한글)
// 관계 타입별 라벨 (한글)
export const RELATION_LABELS: Record<UIRelationType, string> = {
  friendly: "우호",
  hostile: "적대",
  romantic: "로맨스",
  family: "가족",
  neutral: "중립",
  complex: "복합",
};

// 역할별 라벨
export const ROLE_LABELS: Record<CharacterRole, string> = {
  protagonist: "주인공",
  antagonist: "적대자",
  supporting: "조연",
  mentor: "멘토",
  sidekick: "조력자",
  other: "기타",
};

// 역할별 색상 (노드 테두리 - 형광 톤 제거, 시각적 조화)
export const ROLE_COLORS: Record<CharacterRole, string> = {
  protagonist: "#5F7D5F", // Sage Primary - 브랜드 일관성
  antagonist: "#B14B4B", // Russet Red - 차분한 위기감
  supporting: "#64748b", // Slate - 중립적 조연
  mentor: "#7C6BA8", // Muted Purple - 지혜로운 차분함
  sidekick: "#4B9F7D", // Emerald - 신뢰감 있는 조력자
  other: "#8B929E", // Sharkskin - 명확한 중립
};

// 캐릭터 상태별 배지 설정
export const STATUS_CONFIG: Record<
  string,
  { icon: string; color: string; label: string }
> = {
  alive: { icon: "✓", color: "#5B7B4B", label: "생존" },
  생존: { icon: "✓", color: "#5B7B4B", label: "생존" },
  dead: { icon: "☠", color: "#A33A3A", label: "사망" },
  사망: { icon: "☠", color: "#A33A3A", label: "사망" },
  unknown: { icon: "?", color: "#8B929E", label: "불명" },
  불명: { icon: "?", color: "#8B929E", label: "불명" },
  injured: { icon: "⚡", color: "#B8860B", label: "부상" },
  부상: { icon: "⚡", color: "#B8860B", label: "부상" },
  missing: { icon: "👁", color: "#5B6B7B", label: "실종" },
  실종: { icon: "👁", color: "#5B6B7B", label: "실종" },
};

// =====================================================
// 📏 노드 크기 설정
// =====================================================

export const NODE_SIZES = {
  protagonist: 100, // 유지 (100)
  default: 50, // 2배 키움 (24 -> 50)
  hover: 1.25, // 호버 효과 강화
} as const;

// 곡선형 엣지 설정
export const CURVE_FACTOR = 0.2; // 곡선의 휘어짐 정도 (0 = 직선, 1 = 매우 휜 곡선)
export const MIN_CURVE_DISTANCE_SQ = 4; // 곡선 적용 최소 거리 제곱 (2px^2) - 거의 항상 곡선 적용

export const MAX_CURVE_OFFSET = 60; // 곡선 제어점 최대 오프셋 (px)

// =====================================================
// ⚡ Force Simulation 설정 (Obsidian 스타일 튜닝)
// =====================================================

export const FORCE_CONFIG = {
  // 노드 간 반발력 (최적화: 거리 제한으로 연산 감소)
  // Balanced repulsion (enough to separate, but not explode)
  charge: -2500,
  chargeDistanceMin: 100,
  chargeDistanceMax: 4000,

  // 링크 설정 (소프트 스프링)
  // Default breathing room
  linkDistance: 150,
  linkStrength: 0.3,

  // 센터링 (부드럽게)
  centerStrength: 0.05, // Stronger centering to form a round shape (User Feedback)
  positionStrength: 0.01,

  // 충돌
  collisionPadding: 60,
  collisionStrength: 0.85,

  // Dynamic Link Forces (Relationship-based)
  // STRATEGY:
  // Friendly = Short & Rigid (Clump together)
  // Hostile = Long & Strong (Force apart)
  dynamic: {
    friendly: {
      distance: 80, // Very Short (Tight cluster)
      strength: 0.9, // Almost rigid
    },
    hostile: {
      distance: 260, // Further reduced by 1/3 (from 400)
      strength: 0.2, // Further reduced by 1/3 (from 0.3)
    },
    neutral: {
      distance: 200,
      strength: 0.3,
    },
    family: {
      distance: 60, // Extremely close
      strength: 0.95,
    },
    romantic: {
      distance: 50, // Intimate
      strength: 0.95,
    },
  },

  // 수렴 (더 빠른 안정화)
  alphaDecay: 0.022,
  alphaMin: 0.001,
  velocityDecay: 0.6,
} as const;

// =====================================================
// 🔍 줌 설정
// =====================================================

export type ZoomLevel = "macro" | "meso" | "micro";

export const ZOOM_CONFIG = {
  min: 0.2,
  max: 4,
  initial: 1,
  transitionDuration: 300,
} as const;

export const SEMANTIC_ZOOM_CONFIG = {
  macro: 0.4,
  meso: 1.2,
  majorCharacterThreshold: 3, // 주요 캐릭터 판단 관계 수
} as const;

// =====================================================
// ✨ 애니메이션 설정
// =====================================================

export const ANIMATION = {
  // 하이라이트
  highlightDuration: 200,
  dimOpacity: 0.12,
  normalOpacity: 1,

  // 엔트리 애니메이션
  entryDelay: 30, // 노드당 지연 (ms)
  entryDuration: 500,

  // 펄스 효과
  pulseDuration: 3000,
  pulseScale: 1.08,

  // 호버
  hoverTransition: 150,

  // 시뮬레이션
  reheatStrength: 0.3,
} as const;

// =====================================================
// 🌟 Semantic Force 상수
// =====================================================

export const RELATION_ANGLES: Record<string, number> = {
  friendly: 90, // 위 (Emerald)
  romantic: 150, // 10시 (Pink)
  family: 210, // 7시 (Blue)
  hostile: 0, // 오른쪽 (Red)
  neutral: 270, // 아래 (Gray)
  complex: 45, // 1시 (Violet)
};

export const SEMANTIC_FORCE_CONFIG = {
  // 관계별 가중치 (양수: 인력, 음수: 척력)
  relationWeights: {
    friendly: 1.5,
    romantic: 2.0,
    family: 1.2,
    hostile: -0.7, // Further reduced by 1/3 (from -1.0)
    neutral: 0.5,
    complex: 0.3,
  } as Record<string, number>,
  defaultRepulsion: -1.0,
  strengthMultiplier: 0.2,
  attractionDistance: 40,
  repulsionDistance: 100,
  interGroupDistance: 1200, // 그룹 간 기본 거리
};

// =====================================================
// 🌟 글로우/그라디언트 설정
// =====================================================

export const GLOW_CONFIG = {
  stdDeviation: 3,
  opacity: 0.6,
} as const;

// =====================================================
// 🌫️ 그룹 배경 (Fog) 색상 팔레트 (Deprecated - 클라우드 제거됨)
// =====================================================

export const GROUP_COLORS = [
  "#E0E7FF", // Indigo 100
  "#FAE8FF", // Fuchsia 100
  "#DCFCE7", // Emerald 100
  "#FFEDD5", // Orange 100
  "#F3E8FF", // Purple 100
  "#E0F2FE", // Sky 100
  "#FCE7F3", // Pink 100
  "#FEF3C7", // Amber 100
] as const;

// =====================================================
// 🏴 Faction 테두리 링 색상 (동적 할당용)
// =====================================================

/**
 * Faction별 테두리 링 색상 팔레트
 * 노드 외곽에 Faction 소속을 표시하는 링에 사용
 */
export const FACTION_RING_COLORS = [
  "#6366F1", // Indigo 500
  "#C4687A", // Muted Pink
  "#4A9B7F", // Muted Emerald
  "#9B6B4A", // Muted Sienna
  "#8B5CF6", // Violet 500
  "#5B85C4", // Muted Sky
  "#C45555", // Muted Red
  "#C49545", // Muted Amber
  "#14B8A6", // Teal 500
  "#A855F7", // Purple 500
] as const;

/**
 * Faction 이름에서 색상 인덱스를 결정하는 해시 함수
 * 동일 Faction 이름은 항상 동일한 색상을 반환
 */
export function getFactionColor(factionName: string | undefined): string {
  if (!factionName || factionName === "무소속") {
    return "#94A3B8"; // Slate 400 (무소속 기본 색상)
  }
  // 간단한 문자열 해시
  const hash = factionName
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return FACTION_RING_COLORS[hash % FACTION_RING_COLORS.length];
}
