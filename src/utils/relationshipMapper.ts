import type { Character, BackendRelationshipType } from "@/types/character";
import type { RelationType, RelationshipLink } from "@/types/characterGraph";

/**
 * 백엔드 RelationshipType → D3 그래프 RelationType 변환
 *
 * @param backendType - 백엔드에서 사용하는 관계 타입 (5종)
 * @returns D3 그래프에서 사용하는 관계 타입 (3종: friend/lover/enemy)
 */
export function toGraphRelationType(
  backendType: BackendRelationshipType | string
): RelationType {
  const mapping: Record<string, RelationType> = {
    friendly: "friend",
    romantic: "lover",
    hostile: "enemy",
    family: "friend", // 가족 → 친구 관계로 표시
    neutral: "friend", // 중립 → 친구 관계로 표시
  };
  return mapping[backendType] || "friend"; // Fallback for unexpected types
}

/**
 * Character.relationships를 D3 그래프용 Link 배열로 변환
 *
 * @param characters - relationships 필드를 포함한 Character 배열
 * @returns RelationshipLink 배열 (양방향 중복 제거됨)
 *
 * @example
 * const characters = await characterService.getAll(projectId);
 * const links = extractRelationshipLinks(characters.data);
 * <CharacterGraph characters={characters} links={links} />
 */
export function extractRelationshipLinks(
  characters: Character[]
): RelationshipLink[] {
  const links: RelationshipLink[] = [];
  const processedPairs = new Set<string>();

  characters.forEach((char) => {
    // 타입 가드: relationships가 배열인지 확인
    if (!Array.isArray(char.relationships)) {
      console.warn(
        `Character ${char.id} (${char.name}) missing relationships array`
      );
      return;
    }

    char.relationships.forEach((rel) => {
      const sourceId = char.id;
      const targetId = rel.target;

      // target ID 검증
      if (!targetId) {
        console.warn(
          `Invalid relationship for character ${char.id}: missing target`
        );
        return;
      }

      // 양방향 중복 방지 (A-B와 B-A를 같은 것으로 취급)
      const pairKey =
        sourceId < targetId
          ? `${sourceId}-${targetId}`
          : `${targetId}-${sourceId}`;

      if (processedPairs.has(pairKey)) return;
      processedPairs.add(pairKey);

      links.push({
        id: String(rel.id),
        source: sourceId,
        target: targetId,
        type: toGraphRelationType(rel.type),
        strength: rel.strength,
        label: rel.label ?? undefined,
      });
    });
  });

  return links;
}
