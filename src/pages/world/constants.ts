import type { CharacterRole } from "@/types";

export type RelationType = "friendly" | "hostile" | "romantic";

export const relationshipColors: Record<RelationType, string> = {
  friendly: "var(--rel-friendly-std)", // Standard
  hostile: "var(--rel-hostile-std)", // Standard
  romantic: "var(--rel-romantic-std)", // Standard
};

export const relationshipLabels: Record<RelationType, string> = {
  friendly: "우호",
  hostile: "적대",
  romantic: "로맨스",
};

export const roleLabels: Record<CharacterRole, string> = {
  protagonist: "주인공",
  antagonist: "적대자",
  supporting: "조연",
  mentor: "멘토",
  sidekick: "조력자",
  other: "기타",
};
