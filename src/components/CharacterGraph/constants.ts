import type { RelationType, CharacterRole } from "@/types";

// =====================================================
// 🎨 색상 설정
// =====================================================

// 관계 타입별 색상
export const RELATION_COLORS: Record<RelationType, string> = {
  friend: "#22c55e", // 초록
  lover: "#ec4899", // 핑크
  enemy: "#ef4444", // 빨강
};

// 관계 타입별 라벨 (한글)
export const RELATION_LABELS: Record<RelationType, string> = {
  friend: "친구",
  lover: "연인",
  enemy: "적대",
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

// 역할별 색상 (노드 테두리)
export const ROLE_COLORS: Record<CharacterRole, string> = {
  protagonist: "#3b82f6", // 파랑
  antagonist: "#ef4444", // 빨강
  supporting: "#64748b", // 슬레이트
  mentor: "#8b5cf6", // 보라
  sidekick: "#22c55e", // 초록
  other: "#94a3b8", // 회색
};

// =====================================================
// 📏 노드 크기 설정
// =====================================================

export const NODE_SIZES = {
  protagonist: 52, // 더 크게
  default: 36,
  hover: 1.15, // 호버 시 확대 비율
} as const;

// =====================================================
// ⚡ Force Simulation 설정 (Obsidian 스타일 튜닝)
// =====================================================

export const FORCE_CONFIG = {
  // 노드 간 반발력 (더 강하게)
  charge: -400,
  chargeDistanceMin: 50,
  chargeDistanceMax: 500,

  // 링크 설정 (소프트 스프링)
  linkDistance: 150,
  linkStrength: 0.3,

  // 센터링 (부드럽게)
  centerStrength: 0.05,
  positionStrength: 0.02, // X/Y 포지셔닝

  // 충돌
  collisionPadding: 20,
  collisionStrength: 0.7,

  // 수렴 (느리고 부드럽게)
  alphaDecay: 0.01, // 느린 수렴 = 더 오래 움직임
  alphaMin: 0.001,
  velocityDecay: 0.3, // 낮은 마찰 = 더 유동적
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
} as const;

// =====================================================
// 🌟 글로우/그라디언트 설정
// =====================================================

export const GLOW_CONFIG = {
  stdDeviation: 3,
  opacity: 0.6,
} as const;
