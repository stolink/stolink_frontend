import { useMemo } from "react";
import type { Character } from "@/types";

/**
 * 캐릭터 데이터에서 UI 표시용 데이터 추출 (새 스키마 대응)
 */
export function useCharacterData(character: Character | null) {
  // 성격 특성 추출 (새 스키마: personality.core_traits)
  const traits = useMemo(() => {
    return character?.personality?.core_traits || [];
  }, [character?.personality?.core_traits]);

  // 관계 추출 (새 스키마: relations.graph)
  const relationships = useMemo(() => {
    const graph = character?.relations?.graph || [];
    return graph.map((rel) => ({
      name: rel.target,
      relation: rel.relation_type,
    }));
  }, [character?.relations?.graph]);

  // 등장 챕터는 새 스키마에 없음 - 빈 배열 반환
  const appearances = useMemo(() => {
    return [];
  }, []);

  // 설명 (새 스키마: profile.backstory)
  const description = useMemo(() => {
    return character?.profile?.backstory || "";
  }, [character?.profile?.backstory]);

  // 진행률 (새 스키마에 없음 - 기본값 반환)
  const arcProgress = useMemo(() => {
    return 50; // 기본값
  }, []);

  return {
    traits,
    relationships,
    appearances,
    description,
    arcProgress,
  };
}
