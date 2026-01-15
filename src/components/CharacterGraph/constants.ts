import type { CharacterRole } from "@/types";

// =====================================================
// 🎨 색상 설정
// =====================================================

// UI에서 사용하는 관계 타입
export type UIRelationType =
  | "ally"
  | "enemy"
  | "rival"
  | "family"
  | "betrayed"
  | "knows"
  | "protects"
  | "mentor"
  | "romantic"
  | "neutral"
  | "complex";

/**
 * RelationType을 UIRelationType으로 변환
 * 백엔드 타입(ALLY, ENEMY 등)을 UI 타입(friendly, hostile 등)으로 매핑
 */
export function toUIRelationType(type: string): UIRelationType {
  const normalized = type.toLowerCase();
  // Direct mapping if it matches known types
  const knownTypes: UIRelationType[] = [
    "ally",
    "enemy",
    "rival",
    "family",
    "betrayed",
    "knows",
    "protects",
    "mentor",
    "romantic",
    "neutral",
    "complex",
  ];

  if (knownTypes.includes(normalized as UIRelationType)) {
    return normalized as UIRelationType;
  }

  const mapping: Record<string, UIRelationType> = {
    // Legacy/Alternative mappings
    friendly: "ally",
    hostile: "enemy",
    master_servant: "mentor",
    coworker: "ally",
    classmate: "knows",
    love: "romantic",
    crush: "romantic",
    sibling: "family",
    parent: "family",
    child: "family",
    relative: "family",
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
  ally: "positive",
  romantic: "positive",
  family: "positive",
  protects: "positive",
  mentor: "positive",
  enemy: "negative",
  rival: "negative",
  betrayed: "negative",
  neutral: "neutral",
  knows: "neutral",
  complex: "neutral",
};

// 관계 타입별 HEX 색상 (메타 카테고리 기반 재정의)
export const RELATION_COLORS_HEX = {
  // Positive Group
  ally: "#10B981", // Emerald 500 (Trust)
  romantic: "#EC4899", // Pink 500 (Love)
  family: "#0D9488", // Teal 600 (Firm Bond - Updated from Indigo)
  protects: "#0EA5E9", // Sky 500 (Shield)
  mentor: "#F59E0B", // Amber 500 (Wisdom/Light)

  // Negative Group
  enemy: "#EF4444", // Red 500 (Danger)
  rival: "#F97316", // Orange 500 (Competition)
  betrayed: "#BE123C", // Rose 700 (Deep Blood/Scar - Updated from Violet)

  // Neutral/Complex
  neutral: "#94A3B8", // Slate 400 (Background)
  knows: "#A1A1AA", // Zinc 400 (Faint)
  complex: "#7C3AED", // Violet 600 (Mystery - Kept distinct)
} as const;

// 관계 타입별 우선순위 (시각적 지배력)
// 낮을수록 우선순위 높음 (1 = Top Priority)
export const RELATION_PRIORITY: Record<UIRelationType, number> = {
  // Critical / Danger (Red/Rose) - Must be seen first
  betrayed: 1,
  enemy: 2,

  // Special / Deep (Teal/Pink)
  family: 3,
  romantic: 4,

  // Active / Competition (Orange/Emerald)
  rival: 5,
  ally: 6,

  // Passive / Support (Amber/Sky)
  mentor: 7,
  protects: 8,

  // Neutral / Weak (Gray/Purple)
  complex: 9,
  knows: 10,
  neutral: 11,
};

// 관계 타입별 색상 팔레트 (Meta-Category 색조 준수)
export const RELATION_PALETTE: Record<
  UIRelationType,
  { weak: string; standard: string; deep: string }
> = {
  ally: {
    weak: "#6EE7B7",
    standard: RELATION_COLORS_HEX.ally,
    deep: "#065F46",
  },
  romantic: {
    weak: "#F9A8D4",
    standard: RELATION_COLORS_HEX.romantic,
    deep: "#831843",
  },
  family: {
    weak: "#5EEAD4",
    standard: RELATION_COLORS_HEX.family,
    deep: "#134E4A",
  }, // Teal variations
  protects: {
    weak: "#7DD3FC",
    standard: RELATION_COLORS_HEX.protects,
    deep: "#0C4A6E",
  },
  mentor: {
    weak: "#FCD34D",
    standard: RELATION_COLORS_HEX.mentor,
    deep: "#78350F",
  },
  enemy: {
    weak: "#FCA5A5",
    standard: RELATION_COLORS_HEX.enemy,
    deep: "#7F1D1D",
  },
  rival: {
    weak: "#FDBA74",
    standard: RELATION_COLORS_HEX.rival,
    deep: "#7C2D12",
  },
  betrayed: {
    weak: "#FDA4AF",
    standard: RELATION_COLORS_HEX.betrayed,
    deep: "#881337",
  }, // Rose variations
  neutral: {
    weak: "#CBD5E1",
    standard: RELATION_COLORS_HEX.neutral,
    deep: "#475569",
  },
  knows: {
    weak: "#E4E4E7",
    standard: RELATION_COLORS_HEX.knows,
    deep: "#52525B",
  },
  complex: {
    weak: "#C4B5FD",
    standard: RELATION_COLORS_HEX.complex,
    deep: "#5B21B6",
  },
};

// 관계 타입별 기본 색상 (Standard 기준)
export const RELATION_COLORS: Record<UIRelationType, string> = {
  ally: RELATION_COLORS_HEX.ally,
  enemy: RELATION_COLORS_HEX.enemy,
  rival: RELATION_COLORS_HEX.rival,
  family: RELATION_COLORS_HEX.family,
  betrayed: RELATION_COLORS_HEX.betrayed,
  knows: RELATION_COLORS_HEX.knows,
  protects: RELATION_COLORS_HEX.protects,
  mentor: RELATION_COLORS_HEX.mentor,
  romantic: RELATION_COLORS_HEX.romantic,
  neutral: RELATION_COLORS_HEX.neutral,
  complex: RELATION_COLORS_HEX.complex,
};

// 관계 타입별 배지 스타일 (Tailwind Classes)
export const RELATION_BADGE_COLORS: Record<UIRelationType, string> = {
  ally: "bg-emerald-500 text-white border-emerald-500",
  enemy: "bg-rose-500 text-white border-rose-500",
  rival: "bg-orange-500 text-white border-orange-500",
  family: "bg-teal-600 text-white border-teal-600",
  betrayed: "bg-rose-700 text-white border-rose-700",
  knows: "bg-stone-400 text-white border-stone-400",
  protects: "bg-sky-500 text-white border-sky-500",
  mentor: "bg-amber-500 text-white border-amber-500",
  romantic: "bg-pink-400 text-white border-pink-400",
  neutral: "bg-slate-400 text-white border-slate-400",
  complex: "bg-purple-500 text-white border-purple-500",
};

// 관계 타입별 라벨 (한글)
export const RELATION_LABELS: Record<UIRelationType, string> = {
  ally: "동맹",
  enemy: "적대",
  rival: "라이벌",
  family: "가족",
  betrayed: "배신",
  knows: "안면",
  protects: "보호",
  mentor: "멘토",
  romantic: "로맨스",
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
    ally: {
      distance: 80,
      strength: 0.9,
    },
    mentor: {
      distance: 90,
      strength: 0.8,
    },
    protects: {
      distance: 70,
      strength: 0.9,
    },
    family: {
      distance: 60,
      strength: 0.95,
    },
    romantic: {
      distance: 50,
      strength: 0.95,
    },
    knows: {
      distance: 220,
      strength: 0.2,
    },
    neutral: {
      distance: 200,
      strength: 0.3,
    },
    rival: {
      distance: 180, // Closer than enemy
      strength: 0.4,
    },
    enemy: {
      distance: 300,
      strength: 0.15, // Push away hard
    },
    betrayed: {
      distance: 250,
      strength: 0.2,
    },
    complex: {
      distance: 150,
      strength: 0.5,
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
  ally: 90, // UP
  mentor: 45, // UP-RIGHT
  protects: 135, // UP-LEFT
  family: 210, // BOTTOM-LEFT (Firm)
  romantic: 150,
  knows: 270,
  neutral: 270,
  rival: 30, // Slight aggression
  enemy: 0, // RIGHT (Opposing?) - Actually D3 force doesn't use angle directly usually, but for positioning
  betrayed: 330,
  complex: 45,
};

export const SEMANTIC_FORCE_CONFIG = {
  // 관계별 가중치 (양수: 인력, 음수: 척력)
  relationWeights: {
    ally: 1.5,
    protects: 1.8,
    mentor: 1.6,
    family: 1.2,
    romantic: 2.0,
    knows: 0.3,
    neutral: 0.5,
    rival: -0.2, // Slight competition
    enemy: -0.8, // Strong repulsion
    betrayed: -0.5,
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
