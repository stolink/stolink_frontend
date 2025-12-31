import type { CharacterRole } from "@/types";

export const roleLabels: Record<
  CharacterRole,
  { label: string; color: string }
> = {
  protagonist: {
    label: "주인공",
    color: "bg-mocha-50 text-mocha-700 border-mocha-200",
  },
  antagonist: {
    label: "적대자",
    color: "bg-status-error/10 text-status-error border-status-error/20",
  },
  supporting: {
    label: "조연",
    color: "bg-cloud-50 text-espresso-900 border-border",
  },
  mentor: {
    label: "조력자",
    color: "bg-status-warning/10 text-status-warning border-status-warning/20",
  },
  sidekick: {
    label: "동료",
    color: "bg-status-success/10 text-status-success border-status-success/20",
  },
  other: {
    label: "기타",
    color: "bg-cloud-50 text-espresso-900 border-border",
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
