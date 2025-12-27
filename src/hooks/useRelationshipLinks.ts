import { useMemo } from "react";
import type { Character } from "@/types/character";
import type { RelationshipLink } from "@/types/characterGraph";
import { extractRelationshipLinks } from "@/utils/relationshipMapper";

/**
 * Extracts relationship links from a list of characters.
 * Encapsulates the logic for converting character relationship data into graph links.
 *
 * @param characters - List of characters with relationship data
 * @returns Array of RelationshipLink for use in graph visualization
 */
export function useRelationshipLinks(
  characters: Character[]
): RelationshipLink[] {
  return useMemo(() => extractRelationshipLinks(characters), [characters]);
}
