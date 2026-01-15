import { useMemo } from "react";
import type { Character, CharacterRelation } from "@/types";
import { useCharacters } from "@/hooks/useCharacters";
import {
  RELATION_LABELS,
  toUIRelationType,
} from "@/components/CharacterGraph/constants";

/**
 * 캐릭터 데이터에서 UI 표시용 데이터 추출 (새 스키마 대응)
 */
export function useCharacterData(character: Character | null) {
  // 프로젝트 내 모든 캐릭터 조회 (ID -> 이름 매핑용)
  // projectId가 없으면 실행되지 않음
  const projectId = character?.projectId || "";
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

    // ID -> Name & Image 매핑 생성
    const charMap = new Map<string, { name: string; imageUrl?: string }>();
    if (allCharacters) {
      allCharacters.forEach((char) => {
        charMap.set(char._id, {
          name: char.profile.name,
          imageUrl: char.imageUrl,
        });
      });
    }

    // 1. Outgoing Relationships (내가 -> 남을)
    interface ExtendedRelation extends CharacterRelation {
      direction?: "outgoing" | "incoming";
      public_stance?: string;
      private_feeling?: string;
    }

    const outgoingMap = new Map<string, ExtendedRelation>();
    graph.forEach((rel) => {
      // ID 기반 중복 제거를 위해 Map 사용
      const targetId = rel.target;
      outgoingMap.set(targetId, {
        ...rel,
        direction: "outgoing",
      } as ExtendedRelation);
    });

    // 2. Incoming Relationships (남이 -> 나를)
    // 현재 캐릭터의 ID
    const myId = character?._id;

    if (myId && allCharacters) {
      allCharacters.forEach((otherChar) => {
        // 자기 자신 제외
        if (otherChar._id === myId) return;

        const otherGraph = otherChar.relations?.graph || [];
        const linkToMe = otherGraph.find((r) => r.target === myId);

        if (linkToMe) {
          // 이미 Outgoing에 있으면 건너뜀 (단순화를 위해 Outgoing 우선 표시)
          if (!outgoingMap.has(otherChar._id)) {
            outgoingMap.set(otherChar._id, {
              target: otherChar._id, // UI에서는 "상대방"이 target임
              type: linkToMe.type,
              description: linkToMe.description,
              emotionalBond: linkToMe.emotionalBond,
              functionalTrust: linkToMe.functionalTrust,
              valueAlignment: linkToMe.valueAlignment,
              interdependence: linkToMe.interdependence,
              latentTension: linkToMe.latentTension,
              publicStance: linkToMe.publicStance,
              public_stance: (linkToMe as ExtendedRelation).public_stance,
              privateFeeling: linkToMe.privateFeeling,
              private_feeling: (linkToMe as ExtendedRelation).private_feeling,
              direction: "incoming",
            } as ExtendedRelation);
          }
        }
      });
    }

    return Array.from(outgoingMap.values()).map((rel) => {
      // 1. 이름 및 이미지 찾기
      const targetChar = charMap.get(rel.target);
      let targetName = targetChar?.name;
      const targetImageUrl = targetChar?.imageUrl;

      if (!targetName) {
        // 만약 rel.target이 이미 이름이라면 그대로 표시 (레거시 데이터 등)
        targetName = rel.target;
      }

      // 관계 설명이 있더라도 배지에는 타입(우호, 적대 등)만 표시하고
      // 설명은 별도 필드로 전달하여 상세 설명칸에 표시하도록 분리
      // 2. 관계 타입 라벨 통일 (Graph Mapping Standard)
      const uiType = toUIRelationType(rel.type || "neutral");
      const typeLabel = RELATION_LABELS[uiType] || uiType;

      // relation: 배지에 들어갈 짧은 라벨
      // description: 상세 설명 텍스트

      return {
        name: targetName,
        relation: typeLabel, // Fixed: Always use short label for badge
        type: rel.type || "friendly",
        imageUrl: targetImageUrl,
        // Detailed Fields
        publicStance: rel.publicStance || rel.public_stance,
        privateFeeling: rel.privateFeeling || rel.private_feeling,
        description: rel.description, // User description stays here
        // Metrics
        emotionalBond: rel.emotionalBond,
        functionalTrust: rel.functionalTrust,
        valueAlignment: rel.valueAlignment,
        interdependence: rel.interdependence,
        latentTension: rel.latentTension,
        // UI Flag for direction (Optional use)
        isIncoming: rel.direction === "incoming",
      };
    });
  }, [character?._id, character?.relations?.graph, allCharacters]);

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
