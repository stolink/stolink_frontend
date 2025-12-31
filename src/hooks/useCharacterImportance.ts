/**
 * useCharacterImportance Hook
 *
 * 캐릭터 중요도 점수를 계산하고 관리하는 훅
 */

import { useMemo } from "react";
import type { Character, RelationshipLink } from "@/types";
import type { Scene } from "@/types/scene";
import {
  calculateAllImportanceScores,
  type CharacterImportance,
  type ImportanceWeights,
  type SceneData,
  DEFAULT_WEIGHTS,
} from "@/utils/characterImportance";

interface UseCharacterImportanceOptions {
  weights?: ImportanceWeights;
}

interface UseCharacterImportanceReturn {
  importanceScores: CharacterImportance[];
  getImportance: (characterId: string) => CharacterImportance | undefined;
  getScore: (characterId: string) => number;
  topCharacters: (limit?: number) => CharacterImportance[];
}

/**
 * 캐릭터 중요도 계산 훅
 *
 * @param characters 캐릭터 배열
 * @param links 관계 링크 배열
 * @param scenes 씬 배열 (선택)
 * @param options 옵션 (가중치 커스터마이징)
 */
export function useCharacterImportance(
  characters: Character[],
  links: RelationshipLink[],
  scenes: Scene[] = [],
  options: UseCharacterImportanceOptions = {},
): UseCharacterImportanceReturn {
  const { weights = DEFAULT_WEIGHTS } = options;

  // Scene을 SceneData로 변환
  const sceneData: SceneData[] = useMemo(() => {
    return scenes.map((scene) => ({
      id: scene.id,
      characterIds: scene.characterIds || [],
      beatType: undefined, // Scene 타입에 beatType이 없으면 undefined
    }));
  }, [scenes]);

  // 모든 캐릭터의 중요도 계산 (메모이제이션)
  const importanceScores = useMemo(() => {
    if (characters.length === 0) return [];
    return calculateAllImportanceScores(characters, links, sceneData, weights);
  }, [characters, links, sceneData, weights]);

  // ID로 중요도 조회
  const importanceMap = useMemo(() => {
    const map = new Map<string, CharacterImportance>();
    importanceScores.forEach((score) => {
      map.set(score.id, score);
    });
    return map;
  }, [importanceScores]);

  // 특정 캐릭터 중요도 조회
  const getImportance = (
    characterId: string,
  ): CharacterImportance | undefined => {
    return importanceMap.get(characterId);
  };

  // 특정 캐릭터 점수만 조회 (없으면 0)
  const getScore = (characterId: string): number => {
    return importanceMap.get(characterId)?.score ?? 0;
  };

  // 상위 N명 캐릭터 조회
  const topCharacters = (limit: number = 5): CharacterImportance[] => {
    return importanceScores.slice(0, limit);
  };

  return {
    importanceScores,
    getImportance,
    getScore,
    topCharacters,
  };
}
