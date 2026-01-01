import type { Character, RelationType } from "@/types/character";
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
    family: "friendly",
    neutral: "friendly",
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
 * Character.relations.graph를 D3 그래프용 Link 배열로 변환
 *
 * @param characters - relations.graph 필드를 포함한 Character 배열
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
    // 1. 관계 데이터 추출 (새 스키마 relations.graph 또는 백엔드 직결 relationships 필드)
    const relationGraph =
      char.relations?.graph ||
      (char as { relationships?: unknown[] }).relationships;

    if (!Array.isArray(relationGraph)) {
      console.warn(
        `Character ${char._id || (char as { id?: string }).id} (${char.profile?.name || (char as { name?: string }).name}) missing relations.graph or relationships array`,
      );
      return;
    }

    relationGraph.forEach(
      (rel: {
        source?: string;
        target?: string;
        relation_type?: string;
        type?: string;
        strength?: number;
        description?: string;
        bidirectional?: boolean;
        evolved_from?: string;
        public_stance?: string;
        private_feeling?: string;
      }) => {
        // 2. 소스/타겟 ID 추출 (id 또는 _id)
        const characterId = char._id || (char as { id?: string }).id;
        const sourceId = rel.source || characterId;
        const targetId = rel.target;

        // target ID 검증
        if (!targetId) {
          console.warn(
            `Invalid relationship for character ${char._id}: missing target`,
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
          id: `${sourceId}-${targetId}`,
          source: sourceId,
          target: targetId,
          type: normalizeRelationType(rel.relation_type || rel.type),
          strength: rel.strength,
          label: rel.description, // Legacy alias
          description: rel.description,
          bidirectional: rel.bidirectional,
          evolved_from: rel.evolved_from
            ? normalizeRelationType(rel.evolved_from)
            : undefined,
          public_stance: rel.public_stance,
          private_feeling: rel.private_feeling,
        });
      },
    );
  });

  return links;
}
