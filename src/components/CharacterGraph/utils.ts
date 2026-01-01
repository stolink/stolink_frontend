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

  // 관계 타입 문자열에서 RelationType 추출 (새 스키마의 relation_type 값 매핑)
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

        const relType = getRelationType(rel.relation_type);

        links.push({
          id: `link-${sId}-${tId}`,
          source: sId,
          target: tId,
          type: relType,
          strength: rel.strength ?? 5,
          label: rel.description || rel.relation_type,
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
