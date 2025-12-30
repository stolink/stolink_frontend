import type { CharacterRole } from "@/types";

export const roleLabels: Record<
  CharacterRole,
  { label: string; color: string }
> = {
  protagonist: {
    label: "주인공",
    color: "bg-primary/10 text-primary border-primary/20",
  },
  antagonist: {
    label: "적대자",
    color: "bg-rose-50 text-rose-600 border-rose-200",
  },
  supporting: {
    label: "조연",
    color: "bg-cloud-50 text-muted-foreground border-input",
  },
  mentor: {
    label: "조력자",
    color: "bg-amber-50 text-amber-600 border-amber-200",
  },
  sidekick: {
    label: "동료",
    color: "bg-emerald-50 text-emerald-600 border-emerald-200",
  },
  other: {
    label: "기타",
    color: "bg-cloud-50 text-muted-foreground border-input",
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
// 외모 관련 키 (CharacterVisual에서 별도 표시)
export const VISUAL_KEYS = [
  "신장",
  "체격",
  "머리카락",
  "눈",
  "특징",
  "피부",
  "외모",
];

// 기본 정보 키 (CharacterHeader에서 표시)
export const BASIC_KEYS = ["나이", "성별", "출생지", "직업"];

export const EXCLUDED_KEYS = [
  ...TRAIT_KEYS,
  ...RELATION_KEYS,
  ...APPEARANCE_KEYS,
  ...DESCRIPTION_KEYS,
  ...VISUAL_KEYS,
  ...BASIC_KEYS,
];
