import type { CharacterRole } from "@/types";

export type RelationType =
  | "friendship"
  | "conflict"
  | "romance"
  | "family"
  | "neutral";

export const relationshipColors: Record<RelationType, string> = {
  friendship: "#22c55e", // 초록
  conflict: "#ef4444", // 빨강
  romance: "#ec4899", // 핑크
  family: "#1f2937", // 검정
  neutral: "#9ca3af", // 회색 (점선용)
};

export const relationshipLabels: Record<RelationType, string> = {
  friendship: "우정",
  conflict: "갈등",
  romance: "로맨스",
  family: "가족",
  neutral: "중립",
};

export const roleLabels: Record<CharacterRole, string> = {
  protagonist: "주인공",
  antagonist: "적대자",
  supporting: "조연",
  mentor: "멘토",
  sidekick: "조력자",
  other: "기타",
};
