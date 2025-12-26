import type { CharacterRole } from "@/types";

export const roleLabels: Record<
  CharacterRole,
  { label: string; color: string }
> = {
  protagonist: {
    label: "Protagonist",
    color: "bg-primary/10 text-primary border-primary/20",
  },
  antagonist: {
    label: "Antagonist",
    color: "bg-rose-50 text-rose-600 border-rose-200",
  },
  supporting: {
    label: "Supporting",
    color: "bg-slate-100 text-slate-600 border-slate-200",
  },
  mentor: {
    label: "Mentor",
    color: "bg-amber-50 text-amber-600 border-amber-200",
  },
  sidekick: {
    label: "Sidekick",
    color: "bg-emerald-50 text-emerald-600 border-emerald-200",
  },
  other: {
    label: "Other",
    color: "bg-stone-100 text-stone-600 border-stone-200",
  },
};

export const MAX_FILTERED_ITEMS = 20;

export const TRAIT_KEYS = ["성격", "특성", "성향", "traits", "personality"];
export const RELATION_KEYS = ["관계", "relationships", "인물관계"];
export const APPEARANCE_KEYS = ["등장", "챕터", "chapters", "appearances"];
export const DESCRIPTION_KEYS = [
  "설명",
  "소개",
  "description",
  "bio",
  "한줄소개",
];
export const EXCLUDED_KEYS = [
  ...TRAIT_KEYS,
  ...RELATION_KEYS,
  ...APPEARANCE_KEYS,
  ...DESCRIPTION_KEYS,
];
