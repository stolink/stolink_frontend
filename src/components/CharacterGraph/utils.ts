import type { Character, RelationshipLink, RelationType } from "@/types";

/**
 * Character extras['관계']에서 RelationshipLink 배열 생성
 */
export function generateLinksFromCharacters(
  characters: Character[],
): RelationshipLink[] {
  const links: RelationshipLink[] = [];
  const linkSet = new Set<string>();

  // 관계 문자열에서 RelationType 추출
  const getRelationType = (relString: string): RelationType => {
    // 적대 관계
    if (
      relString.includes("적대자") ||
      relString.includes("원수") ||
      relString.includes("질투") ||
      relString.includes("추적") ||
      relString.includes("적")
    ) {
      return "enemy";
    }
    // 연인 관계
    if (
      relString.includes("연인") ||
      relString.includes("짝사랑") ||
      relString.includes("사랑")
    ) {
      return "lover";
    }
    // 나머지는 친구 관계 (가족, 동료, 멘토 등 포함)
    return "friend";
  };

  characters.forEach((sourceChar) => {
    const relationships = sourceChar.extras?.["관계"] as string[] | undefined;
    if (!relationships) return;

    relationships.forEach((relStr) => {
      // '이름 (관계)' 파싱
      const match = relStr.match(/^(.+?)\s*\((.+?)\)$/);
      if (!match) return;

      const targetName = match[1].trim();
      const relationLabel = match[2].trim();

      const targetChar = characters.find(
        (c) =>
          c.name.includes(targetName) ||
          targetName.includes(c.name.split(" ")[0]),
      );

      if (targetChar) {
        // 엣지 중복 방지 (양방향 하나만)
        const sId = sourceChar.id;
        const tId = targetChar.id;
        const linkKey = sId < tId ? `${sId}-${tId}` : `${tId}-${sId}`;

        if (linkSet.has(linkKey)) return;
        linkSet.add(linkKey);

        const relType = getRelationType(relationLabel);

        links.push({
          id: `link-${sId}-${tId}`,
          source: sId,
          target: tId,
          type: relType,
          strength: 5, // 기본값
          label: relationLabel,
        });
      }
    });
  });

  return links;
}
