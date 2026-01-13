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
  characters: Character[],
): RelationshipLink[] {
  const links: RelationshipLink[] = [];
  const processedPairs = new Set<string>();

  // 0. ID 및 이름 매핑 생성 (Name Resolution용)
  const idSet = new Set<string>();
  const nameToIdMap = new Map<string, string>();

  characters.forEach((char) => {
    const id = char._id || (char as { id?: string }).id;
    const name = char.profile?.name || (char as { name?: string }).name;

    if (id) {
      idSet.add(id);
      if (name) {
        nameToIdMap.set(name, id);
      }
    }
  });

  characters.forEach((char) => {
    // 1. 관계 데이터 추출 (새 스키마 relations.graph 또는 백엔드 직결 relationships 필드)
    const relationGraph =
      char.relations?.graph ||
      (char as { relationships?: unknown[] }).relationships;

    if (!Array.isArray(relationGraph)) {
      return;
    }

    relationGraph.forEach(
      (rel: {
        source?: string;
        target?: string;
        relationTypes?: string[];
        relation_types?: string[];
        types?: string[];
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
        const rawSourceId = rel.source || characterId;
        const rawTargetId = rel.target;

        if (!rawSourceId || !rawTargetId) {
          return;
        }

        // 3. ID Resolution (이름인 경우 ID로 변환)
        let sourceId = rawSourceId;
        let targetId = rawTargetId;

        // Source ID 확인 (이름 → ID 변환)
        if (!idSet.has(sourceId)) {
          if (nameToIdMap.has(sourceId)) {
            sourceId = nameToIdMap.get(sourceId)!;
          } else {
            return; // ID를 찾을 수 없으면 스킵
          }
        }

        // Target ID 확인 (이름 → ID 변환)
        if (!idSet.has(targetId)) {
          if (nameToIdMap.has(targetId)) {
            targetId = nameToIdMap.get(targetId)!;
          } else {
            return; // ID를 찾을 수 없으면 스킵
          }
        }

        // 양방향 중복 방지 (A-B와 B-A를 같은 것으로 취급)
        const pairKey =
          sourceId < targetId
            ? `${sourceId}-${targetId}`
            : `${targetId}-${sourceId}`;

        if (processedPairs.has(pairKey)) return;
        processedPairs.add(pairKey);

        // Handle multi-type support (Super Edge)
        // 4.1 Extract types array (priority: relationTypes > types > type)
        const rawTypes =
          rel.relationTypes || rel.relation_types || rel.types || [];
        let relationTypes: RelationType[] = [];

        if (Array.isArray(rawTypes) && rawTypes.length > 0) {
          relationTypes = rawTypes.map((t) => normalizeRelationType(String(t)));
        } else {
          // Fallback to single type
          relationTypes = [
            normalizeRelationType(
              rel.relationType || rel.relation_type || rel.type || "friendly",
            ),
          ];
        }

        // Ensure unique types
        relationTypes = Array.from(new Set(relationTypes));

        // 4.2 Create Segments for Multi-Type Visualization
        const segments = relationTypes.map((t, _index) => ({
          type: t,
          ratio: 1 / relationTypes.length, // Equal distribution for now
          isPast: false, // Could be derived from history if needed
          strength: rel.strength || 5,
          label: t,
        }));

        links.push({
          id: `${sourceId}-${targetId}`,
          source: sourceId,
          target: targetId,
          type: relationTypes[0], // Primary type for compatibility
          primaryType: relationTypes[0],
          relationTypes: relationTypes,
          segments: segments.length > 1 ? segments : undefined, // Only use segments if multi-type
          strength: rel.strength || 5,
          label: rel.description,
          description: rel.description,
          bidirectional: rel.bidirectional,
          evolvedFrom:
            rel.evolvedFrom || rel.evolved_from
              ? normalizeRelationType(
                  (rel.evolvedFrom || rel.evolved_from) as string,
                )
              : undefined,
          publicStance: rel.publicStance || rel.public_stance,
          privateFeeling: rel.privateFeeling || rel.private_feeling,
        });
      },
    );
  });

  return links;
}
