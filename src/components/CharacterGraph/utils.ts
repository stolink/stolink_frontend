import type { Character, RelationshipLink, RelationType } from "@/types";
import { RELATION_PALETTE } from "./constants";

/**
 * @deprecated Use extractRelationshipLinks from @/utils/relationshipMapper
 *
 * Character extras['관계']에서 RelationshipLink 배열 생성 (레거시 데이터 지원용)
 */
export function generateLinksFromCharacters(
  characters: Character[],
): RelationshipLink[] {
  console.warn(
    "generateLinksFromCharacters is deprecated. Use extractRelationshipLinks from @/utils/relationshipMapper instead.",
  );
  const links: RelationshipLink[] = [];
  const linkSet = new Set<string>();

  // 관계 타입 문자열에서 RelationType 추출 (새 스키마의 relationType 값 매핑)
  const getRelationType = (relType: string): RelationType => {
    const normalized = relType?.toLowerCase() || "";
    // 적대 관계
    if (
      normalized.includes("hostile") ||
      normalized.includes("enemy") ||
      normalized.includes("rival")
    ) {
      return "hostile";
    }
    // 연인 관계
    if (normalized.includes("romantic") || normalized.includes("love")) {
      return "romantic";
    }
    // 나머지는 친구 관계 (family, ally, mentor 등 포함)
    return "friendly";
  };

  characters.forEach((sourceChar) => {
    const relationships = sourceChar.relations?.graph;
    if (!relationships || relationships.length === 0) return;

    relationships.forEach((rel) => {
      // 새 스키마: CharacterRelation 객체 사용
      const targetId = rel.target;

      const targetChar = characters.find(
        (c) => c._id === targetId || c.profile?.name === targetId,
      );

      if (targetChar) {
        // 엣지 중복 방지 (양방향 하나만)
        const sId = sourceChar._id;
        const tId = targetChar._id;
        const linkKey = sId < tId ? `${sId}-${tId}` : `${tId}-${sId}`;

        if (linkSet.has(linkKey)) return;
        linkSet.add(linkKey);

        const relType = getRelationType(rel.type);

        links.push({
          id: `link-${sId}-${tId}`,
          source: sId,
          target: tId,
          type: relType,
          strength: rel.strength ?? 5,
          label: rel.description || rel.type,
        });
      }
    });
  });

  return links;
}

/**
 * 링크 목록을 기반으로 각 캐릭터의 관계 수(차수, Degree Centrality)를 계산합니다.
 */
export function calculateRelationCounts(
  links: RelationshipLink[],
): Record<string, number> {
  const counts: Record<string, number> = {};

  links.forEach((link) => {
    // source와 target 모두 카운트 증가
    const sId = typeof link.source === "string" ? link.source : link.source.id;
    const tId = typeof link.target === "string" ? link.target : link.target.id;

    if (sId) counts[sId] = (counts[sId] || 0) + 1;
    if (tId) counts[tId] = (counts[tId] || 0) + 1;
  });

  return counts;
}

/**
 * 관계 타입과 강도에 따른 색상을 반환합니다.
 * @param type 관계 유형 (friendly, hostile, romantic)
 * @param strength 관계 강도 (1-10)
 */
export function getRelationshipColor(
  type: RelationType,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _strength: number,
): string {
  const palette = RELATION_PALETTE[type];
  if (!palette) return "#9ca3af"; // Default gray

  // Unified color (Strength ignored per user request)
  return palette.standard;
}

// =====================================================
// 🔍 검색 유틸리티 (초성 검색 지원)
// =====================================================

/** 한글 초성 배열 */
const CHOSUNG = [
  "ㄱ",
  "ㄲ",
  "ㄴ",
  "ㄷ",
  "ㄸ",
  "ㄹ",
  "ㅁ",
  "ㅂ",
  "ㅃ",
  "ㅅ",
  "ㅆ",
  "ㅇ",
  "ㅈ",
  "ㅉ",
  "ㅊ",
  "ㅋ",
  "ㅌ",
  "ㅍ",
  "ㅎ",
];

/**
 * 한글 문자열에서 초성만 추출합니다.
 * 예: "장발장" → "ㅈㅂㅈ"
 */
export function getChosung(str: string): string {
  return str
    .split("")
    .map((char) => {
      const code = char.charCodeAt(0) - 44032;
      // 한글 범위가 아니면 원문자 반환
      if (code < 0 || code > 11171) return char;
      return CHOSUNG[Math.floor(code / 588)];
    })
    .join("");
}

/**
 * Fuzzy 검색 + 초성 검색을 지원하는 매칭 함수
 * @param name 검색 대상 이름
 * @param query 검색어
 * @returns 매칭 여부
 */
export function matchesSearch(name: string, query: string): boolean {
  if (!query.trim()) return true;

  const lowerName = name.toLowerCase();
  const lowerQuery = query.toLowerCase();

  // 1. 일반 포함 검색
  if (lowerName.includes(lowerQuery)) return true;

  // 2. 초성 검색 (query가 한글인 경우)
  const nameChosung = getChosung(name);
  const queryChosung = getChosung(query);
  if (nameChosung.includes(queryChosung)) return true;

  return false;
}

// =====================================================
// 👤 아바타 유틸리티
// =====================================================

/**
 * 이름에서 표시용 이니셜을 추출합니다.
 * 한글: 첫 글자 (예: "장발장" → "장")
 * 영문: 첫 글자 대문자 (예: "John" → "J")
 */
export function getInitial(name: string): string {
  if (!name || name.trim().length === 0) return "?";
  return name.trim().charAt(0).toUpperCase();
}

/**
 * 이름을 지정된 길이로 자릅니다. (truncation)
 * @param name 원본 이름
 * @param maxLength 최대 길이 (기본 8)
 */
export function truncateName(name: string, maxLength = 8): string {
  if (!name) return "";
  if (name.length <= maxLength) return name;
  return name.slice(0, maxLength) + "…";
}

// =====================================================
// 🎨 역할별 그라데이션 색상
// =====================================================

/** 역할별 배경 그라데이션 (이미지 없는 노드용) */
export const ROLE_GRADIENTS: Record<string, { from: string; to: string }> = {
  protagonist: { from: "#5F7D5F", to: "#7A9878" }, // Sage Green
  antagonist: { from: "#B14B4B", to: "#D97B6F" }, // Russet Red
  mentor: { from: "#7C6BA8", to: "#9D8DC4" }, // Muted Purple
  sidekick: { from: "#4B9F7D", to: "#6BBFA0" }, // Emerald
  supporting: { from: "#64748B", to: "#94A3B8" }, // Slate
  other: { from: "#8B929E", to: "#A8AFB8" }, // Neutral Grey
};
