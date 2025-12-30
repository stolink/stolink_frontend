import type { CharacterRole } from "@/types";

export type RelationType =
  | "friendly"
  | "hostile"
  | "romantic"
  | "enemy"
  | "lover"
  | "friend"
  | "family"
  | "neutral"
  | "conflict"
  | "romance"
  | "friendship";

export const relationshipColors: Record<RelationType, string> = {
  friendly: "#15803D", // Green 700 (Deep Green)
  hostile: "#B91C1C", // Red 700 (Deep Red)
  romantic: "#BE185D", // Pink 700 (Deep Pink)
  enemy: "#B91C1C",
  lover: "#BE185D",
  friend: "#15803D",
  family: "#0ea5e9",
  neutral: "#78716c",
  conflict: "#B91C1C",
  romance: "#BE185D",
  friendship: "#15803D",
};

export const relationshipLabels: Record<RelationType, string> = {
  friendly: "우호",
  hostile: "적대",
  romantic: "로맨스",
  enemy: "적대",
  lover: "연인",
  friend: "친구",
  family: "가족",
  neutral: "중립",
  conflict: "갈등",
  romance: "로맨스",
  friendship: "우정",
};

export const roleLabels: Record<CharacterRole, string> = {
  protagonist: "주인공",
  antagonist: "적대자",
  supporting: "조연",
  mentor: "멘토",
  sidekick: "조력자",
  other: "기타",
};
