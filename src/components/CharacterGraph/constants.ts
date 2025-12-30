import type { RelationType, CharacterRole } from "@/types";

// =====================================================
// 🎨 색상 설정
// =====================================================

// 관계 타입별 색상 (서사적 깊이)
export const RELATION_COLORS: Record<RelationType, string> = {
  friendly: "#15803D", // Green 700 (Deep Green)
  hostile: "#B91C1C", // Red 700 (Deep Red)
  romantic: "#BE185D", // Pink 700 (Deep Pink)
};

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

  // 수렴 (빠른 안정화)
  alphaDecay: 0.02, // 빠른 수렴 = 안정화 빨라짐 (기본값: 0.0228)
  alphaMin: 0.005, // 더 높은 최소값 = 조기 정지
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
