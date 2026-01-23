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
    // Standard (Keep as is)
    ally: "ally",
    enemy: "enemy",
    rival: "rival",
    family: "family",
    betrayed: "betrayed",
    knows: "knows",
    protects: "protects",
    mentor: "mentor",
    romantic: "romantic",
    neutral: "neutral",
    complex: "complex",

    // Legacy / Aliases -> New Standard
    friendly: "ally",
    hostile: "enemy",

    // Legacy Variants
    friendship: "ally",
    friend: "ally",
    conflict: "enemy",
    lover: "romantic",
    romance: "romantic",
  };

  return mapping[normalized] || "neutral";
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
  // Changed: Use Map to merge duplicate links instead of dropping them
  const processedLinksMap = new Map<string, RelationshipLink>();

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
        id?: string;
        _id?: string;
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
        // 2. 소스/타겟 ID 추출
        const characterId = char._id || (char as { id?: string }).id;
        const rawSourceId = rel.source || characterId;
        const rawTargetId = rel.target;

        if (!rawSourceId || !rawTargetId) {
          return;
        }

        // 3. ID Resolution
        let sourceId = rawSourceId;
        let targetId = rawTargetId;

        // Source ID Resolution
        if (!idSet.has(sourceId)) {
          if (nameToIdMap.has(sourceId)) {
            sourceId = nameToIdMap.get(sourceId)!;
          } else {
            return;
          }
        }

        // Target ID Resolution
        if (!idSet.has(targetId)) {
          if (nameToIdMap.has(targetId)) {
            targetId = nameToIdMap.get(targetId)!;
          } else {
            return;
          }
        }

        // 양방향 중복 방지 Key (A-B == B-A)
        const pairKey =
          sourceId < targetId
            ? `${sourceId}-${targetId}`
            : `${targetId}-${sourceId}`;

        // 4.1 Extract types to ADD (priority: relationTypes > types > type)
        const rawTypes =
          rel.relationTypes || rel.relation_types || rel.types || [];
        let newTypes: RelationType[] = [];

        if (Array.isArray(rawTypes) && rawTypes.length > 0) {
          newTypes = rawTypes.map((t) => normalizeRelationType(String(t)));
        } else {
          // Fallback to single type
          newTypes = [
            normalizeRelationType(
              rel.relationType || rel.relation_type || rel.type || "ally",
            ),
          ];
        }

        // [MERGE LOGIC] If link exists, merge types. Else create new.
        if (processedLinksMap.has(pairKey)) {
          const existingLink = processedLinksMap.get(pairKey)!;

          // Merge Types (Set ensures uniqueness)
          const mergedTypes = Array.from(
            new Set([...existingLink.relationTypes!, ...newTypes]),
          );
          existingLink.relationTypes = mergedTypes;

          // Update primary type if needed (optional logic, keep first encountered or prioritize?)
          // For now, keep existing primaryType or update if empty.
          // Let's just update relationTypes list.
          // Force Graph's Super Edge logic will handle priority sorting.

          // Update Segments
          existingLink.segments = mergedTypes.map((t) => ({
            type: t,
            ratio: 1 / mergedTypes.length,
            isPast: false,
            strength: Math.max(existingLink.strength, rel.strength || 5), // Max strength
            label: t,
          }));

          // Merge Strength (Max)
          existingLink.strength = Math.max(
            existingLink.strength,
            rel.strength || 5,
          );

          // Merge Bidirectional
          existingLink.bidirectional =
            existingLink.bidirectional || rel.bidirectional;

          return;
        }

        // Create New Link
        // Ensure unique types locally
        newTypes = Array.from(new Set(newTypes));

        const segments = newTypes.map((t) => ({
          type: t,
          ratio: 1 / newTypes.length,
          isPast: false,
          strength: rel.strength || 5,
          label: t,
        }));

        const newLink: RelationshipLink = {
          id: rel.id || rel._id || `${sourceId}-${targetId}`,
          source: sourceId,
          target: targetId,
          type: newTypes[0], // Primary type for compatibility (Graph uses this default if no super edge logic)
          primaryType: newTypes[0],
          relationTypes: newTypes,
          segments: segments.length > 1 ? segments : undefined,
          strength: rel.strength || 5,
          label: rel.description, // Use first description encountered
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
        };

        processedLinksMap.set(pairKey, newLink);
      },
    );
  });

  return Array.from(processedLinksMap.values());
}
