import type { RelationType } from "./types";
import type { CharacterRole } from "@/types";

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

// 노드 크기 설정
export const NODE_SIZES = {
  protagonist: 48,
  default: 32,
} as const;

// Force Simulation 설정
export const FORCE_CONFIG = {
  charge: -300, // 노드 간 반발력
  linkDistance: 120, // 기본 링크 거리
  collisionPadding: 10, // 노드 충돌 패딩
  alphaDecay: 0.05, // 수렴 속도
  alphaMin: 0.001, // 최소 알파값
} as const;

// 줌 설정
export const ZOOM_CONFIG = {
  min: 0.3,
  max: 3,
  initial: 1,
} as const;

// 애니메이션 설정
export const ANIMATION = {
  highlightDuration: 200, // ms
  dimOpacity: 0.15,
  normalOpacity: 1,
} as const;
