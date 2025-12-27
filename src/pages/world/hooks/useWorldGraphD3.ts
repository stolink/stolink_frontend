import { useState, useCallback } from "react";
import type { Character } from "@/types";
import type { RelationType } from "@/components/CharacterGraph/types";

interface UseWorldGraphD3Return {
  selectedCharacter: Character | null;
  setSelectedCharacter: (character: Character | null) => void;
  relationTypeFilter: RelationType | "all";
  setRelationTypeFilter: (filter: RelationType | "all") => void;
  handleNodeClick: (character: Character) => void;
  clearSelection: () => void;
}

/**
 * D3 CharacterGraph용 상태 관리 훅
 */
export function useWorldGraphD3(): UseWorldGraphD3Return {
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(
    null,
  );
  const [relationTypeFilter, setRelationTypeFilter] = useState<
    RelationType | "all"
  >("all");

  const handleNodeClick = useCallback((character: Character) => {
    setSelectedCharacter((prev) =>
      prev?.id === character.id ? null : character,
    );
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedCharacter(null);
  }, []);

  return {
    selectedCharacter,
    setSelectedCharacter,
    relationTypeFilter,
    setRelationTypeFilter,
    handleNodeClick,
    clearSelection,
  };
}
