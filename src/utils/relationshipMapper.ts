import type { Character } from "@/types/character";
import type { RelationType } from "@/types/character";
import type { RelationshipLink } from "@/types/characterGraph";

/**
 * 관계 타입 정규화 (백엔드 데이터 불일치 대응)
 * legacy: friendship, conflict, family, neutral (removed)
 * new: friendly, hostile, romantic
 */
export function normalizeRelationType(type: string): RelationType {
  const normalized = type.toLowerCase();

  const mapping: Record<string, RelationType> = {
    // Standard
    friendly: "friendly",
    hostile: "hostile",
    romantic: "romantic",

    // Legacy / Aliases / Mapping for removed types
    family: "friendly", // 가족 -> 우호로 편입
    neutral: "friendly", // 중립 -> 우호로 편입

    friendship: "friendly",
    friend: "friendly",
    conflict: "hostile",
    enemy: "hostile",
    lover: "romantic",
    romance: "romantic",
  };

  return mapping[normalized] || "friendly";
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
  characters: Character[],
): RelationshipLink[] {
  const links: RelationshipLink[] = [];
  const processedPairs = new Set<string>();

  characters.forEach((char) => {
    // 타입 가드: relationships가 배열인지 확인
    if (!Array.isArray(char.relationships)) {
      console.warn(
        `Character ${char.id} (${char.name}) missing relationships array`,
      );
      return;
    }

    char.relationships.forEach((rel) => {
      const sourceId = char.id;
      const targetId = rel.target;

      // target ID 검증
      if (!targetId) {
        console.warn(
          `Invalid relationship for character ${char.id}: missing target`,
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

      // Parse history if it's a JSON string from Neo4j
      let parsedHistory = rel.history;
      if (typeof rel.history === "string") {
        try {
          parsedHistory = JSON.parse(rel.history);
        } catch {
          console.warn(`Failed to parse history for relationship ${rel.id}`);
          parsedHistory = undefined;
        }
      }

      // Normalize history event types
      if (Array.isArray(parsedHistory)) {
        parsedHistory = parsedHistory.map((event) => ({
          ...event,
          type: normalizeRelationType(event.type),
        }));
      }

      links.push({
        id: String(rel.id),
        source: sourceId,
        target: targetId,
        type: normalizeRelationType(rel.type),
        strength: rel.strength,
        label: rel.label ?? undefined,
        description: rel.description,
        bidirectional: rel.bidirectional,
        evolved_from: rel.evolved_from
          ? normalizeRelationType(rel.evolved_from)
          : undefined,
        since: rel.since ?? undefined,
        history: parsedHistory,
      });
    });
  });

  return links;
}
