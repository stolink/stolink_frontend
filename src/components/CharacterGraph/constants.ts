import type { RelationType, CharacterRole } from "@/types";

// =====================================================
// 🎨 색상 설정
// =====================================================

export const MOCHA_COLORS = {
  500: "#A47764", // Primary
  400: "#BD9B8D", // Hover (High brightness)
  700: "#7D5A4B", // Dark/Active
} as const;

// =====================================================
// 🎨 관계 타입별 통일 색상 (HEX 직접 사용)
// CLAUDE.md 및 index.css와 완전 동기화
// =====================================================

// 관계 타입별 HEX 색상 (단일 통일 팔레트)
export const RELATION_COLORS_HEX = {
  friendly: "#15803D", // Dark Green (신뢰, 협력)
  hostile: "#F44336", // Red (갈등, 적대)
  romantic: "#FF4081", // Vivid Cherry Blossom Pink (애정, 열정)
} as const;

// 관계 타입별 색상 팔레트 (Strength 기반 3단계 - 채도/명도 변화)
export const RELATION_PALETTE: Record<
  RelationType,
  { weak: string; standard: string; deep: string }
> = {
  friendly: {
    weak: "#4ADE80", // Light Green (1-3)
    standard: "#15803D", // Dark Green (4-7)
    deep: "#166534", // Deep Forest (8-10)
  },
  hostile: {
    weak: "#FCA5A5", // Light Red (1-3)
    standard: "#F44336", // Red (4-7)
    deep: "#B91C1C", // Deep Red (8-10)
  },
  romantic: {
    weak: "#FDA4AF", // Light Pink (1-3)
    standard: "#FF4081", // Vivid Pink (4-7)
    deep: "#BE185D", // Deep Rose (8-10)
  },
};

// 관계 타입별 기본 색상 (Standard 기준)
export const RELATION_COLORS: Record<RelationType, string> = {
  friendly: RELATION_COLORS_HEX.friendly,
  hostile: RELATION_COLORS_HEX.hostile,
  romantic: RELATION_COLORS_HEX.romantic,
};

// 관계 타입별 라벨 (한글)
// 관계 타입별 라벨 (한글)
export const RELATION_LABELS: Record<RelationType, string> = {
  friendly: "우호",
  hostile: "적대",
  romantic: "로맨스",
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
  charge: -600,
  chargeDistanceMin: 60,
  chargeDistanceMax: 1000, // 줄여서 먼 거리 연산 감소

  // 링크 설정 (소프트 스프링)
  linkDistance: 220,
  linkStrength: 0.3,

  // 센터링 (부드럽게)
  centerStrength: 0.03,
  positionStrength: 0.01, // X/Y 포지셔닝

  // 충돌
  collisionPadding: 35,
  collisionStrength: 0.7,

  // 수렴 (더 빠른 안정화)
  alphaDecay: 0.03, // 더 빠른 수렴 (기존 0.02)
  alphaMin: 0.008, // 조기 정지 (기존 0.005)
  velocityDecay: 0.35, // 약간 높인 마찰 = 더 빠른 안정화
} as const;

// =====================================================
// 🔍 줌 설정
// =====================================================

export const ZOOM_CONFIG = {
  min: 0.2,
  max: 4,
  initial: 1,
  transitionDuration: 300,
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
// 🌟 글로우/그라디언트 설정
// =====================================================

export const GLOW_CONFIG = {
  stdDeviation: 3,
  opacity: 0.6,
} as const;

// =====================================================
// 🌫️ 그룹 배경 (Fog) 색상 팔레트
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
