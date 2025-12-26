import type { CharacterRole } from "@/types";

export const ROLE_LABELS: Record<
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

export const getRoleInfo = (role: CharacterRole | undefined) =>
  ROLE_LABELS[role || "other"];

// 추가 상세 정보에서 제외할 키
export const EXCLUDED_EXTRA_KEYS = [
  "성격",
  "관계",
  "등장",
  "traits",
  "relationships",
  "chapters",
  "설명",
  "description",
];

export const MAX_FILTERED_ITEMS = 20;
