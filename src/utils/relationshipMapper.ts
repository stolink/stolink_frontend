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

    // Backend uppercase variants
    ally: "friendly",
    enemy: "hostile",
    neutral: "friendly",

    // Legacy / Aliases / Mapping for removed types
    family: "friendly",
    friendship: "friendly",
    friend: "friendly",
    conflict: "hostile",
    rival: "hostile",
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
  characters: Character[]
): RelationshipLink[] {
  const links: RelationshipLink[] = [];
  const processedPairs = new Set<string>();

  console.log(
    `[extractRelationshipLinks] Processing ${characters.length} characters`
  );

  characters.forEach((char) => {
    // 1. 관계 데이터 추출 (새 스키마 relations.graph 또는 백엔드 직결 relationships 필드)
    const relationGraph =
      char.relations?.graph ||
      (char as { relationships?: unknown[] }).relationships;

    console.log(
      `[extractRelationshipLinks] Character ${char.profile?.name}: relations.graph length = ${char.relations?.graph?.length || 0}`
    );

    if (!Array.isArray(relationGraph)) {
      console.warn(
        `Character ${char._id || (char as { id?: string }).id} (${char.profile?.name || (char as { name?: string }).name}) missing relations.graph or relationships array`
      );
      return;
    }

    relationGraph.forEach(
      (rel: {
        source?: string;
        target?: string;
        relationType?: string;
        relation_type?: string;
        type?: string;
        strength?: number;
        description?: string;
        bidirectional?: boolean;
        evolvedFrom?: RelationType | null;
        evolved_from?: RelationType | null;
        publicStance?: string;
        public_stance?: string;
        privateFeeling?: string;
        private_feeling?: string;
      }) => {
        // 2. 소스/타겟 ID 추출 (id 또는 _id)
        const characterId = char._id || (char as { id?: string }).id;
        const sourceId = rel.source || characterId;
        const targetId = rel.target;

        // target ID 검증
        if (!targetId) {
          console.warn(
            `Invalid relationship for character ${char._id}: missing target`
          );
          return;
        }

        // 양방향 중복 방지 (A-B와 B-A를 같은 것으로 취급)
        if (!sourceId || !targetId) {
          console.warn(
            `Invalid relationship for character ${char._id}: missing source or target`
          );
          return;
        }

        const pairKey =
          sourceId < targetId
            ? `${sourceId}-${targetId}`
            : `${targetId}-${sourceId}`;

        if (processedPairs.has(pairKey)) return;
        processedPairs.add(pairKey);

        const normalizedType = normalizeRelationType(
          rel.relationType || rel.relation_type || rel.type || "friendly"
        );

        console.log(
          `[extractRelationshipLinks] Creating link: ${sourceId} -> ${targetId}, type: ${rel.type} -> ${normalizedType}`
        );

        links.push({
          id: `${sourceId}-${targetId}`,
          source: sourceId,
          target: targetId,
          type: normalizedType,
          strength: rel.strength || 5,
          label: rel.description,
          description: rel.description,
          bidirectional: rel.bidirectional,
          evolvedFrom:
            rel.evolvedFrom || rel.evolved_from
              ? normalizeRelationType(
                  (rel.evolvedFrom || rel.evolved_from) as string
                )
              : undefined,
          publicStance: rel.publicStance || rel.public_stance,
          privateFeeling: rel.privateFeeling || rel.private_feeling,
        });
      }
    );
  });

  return links;
}
