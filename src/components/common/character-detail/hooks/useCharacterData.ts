import { useMemo } from "react";
import type { Character } from "@/types";
import { useCharacters } from "@/hooks/useCharacters";
import { relationLabels } from "../constants";

/**
 * 캐릭터 데이터에서 UI 표시용 데이터 추출 (새 스키마 대응)
 */
export function useCharacterData(character: Character | null) {
  // 프로젝트 내 모든 캐릭터 조회 (ID -> 이름 매핑용)
  // projectId가 없으면 실행되지 않음
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const projectId = (character as any)?.projectId || "";
  const { data: allCharacters } = useCharacters(projectId, {
    enabled: !!projectId,
  });

  // 성격 특성 추출 (새 스키마: personality.coreTraits)
  const traits = useMemo(() => {
    return character?.personality?.coreTraits || [];
  }, [character?.personality?.coreTraits]);

  // 관계 추출 (새 스키마: relations.graph)
  // target ID를 이름으로 변환
  const relationships = useMemo(() => {
    const graph = character?.relations?.graph || [];

    // ID -> Name 매핑 생성
    const nameMap = new Map<string, string>();
    if (allCharacters) {
      allCharacters.forEach((char) => {
        nameMap.set(char._id, char.profile.name);
      });
    }

    return graph.map((rel) => {
      // 1. 이름 찾기: 매핑된 이름 > target 문자열(혹시 이름일 경우) > "알 수 없음"
      let targetName = nameMap.get(rel.target);

      if (!targetName) {
        // 만약 rel.target이 이미 이름이라면 그대로 표시 (레거시 데이터 등)
        // 하지만 UUID 형식이면 이름 못 찾음
        targetName = rel.target;
      }

      // 관계 설명이 있으면 그것을, 없으면 타입(friendly 등)을 표시
      // 관계 설명이 있으면 그것을, 없으면 타입(friendly 등)을 표시 (한글 변환)
      // 백엔드의 description 필드가 사용자 정의 관계명(예: "팀원이자 친구")을 담고 있음
      const typeLabel =
        relationLabels[rel.type || "friendly"] || rel.type || "우호";
      const relationLabel = rel.description || typeLabel;

      return {
        name: targetName,
        relation: relationLabel,
      };
    });
  }, [character?.relations?.graph, allCharacters]);

  // 등장 챕터는 새 스키마에 없음 - 빈 배열 반환
  const appearances = useMemo(() => {
    // TODO: EventRefs나 LocationContext를 해석해서 등장 정보 생성 필요
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
