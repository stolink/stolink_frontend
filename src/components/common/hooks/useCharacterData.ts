import { useMemo } from "react";
import type { Character } from "@/types";

/**
 * 캐릭터 extras에서 데이터 추출 훅
 */
export function useCharacterData(character: Character | null) {
  // 성격 특성 추출
  const traits = useMemo(() => {
    if (!character?.extras) return [];
    return extractTraits(character.extras as Record<string, unknown>);
  }, [character?.extras]);

  // 관계 추출
  const relationships = useMemo(() => {
    if (!character?.extras) return [];
    return extractRelationships(character.extras as Record<string, unknown>);
  }, [character?.extras]);

  // 등장 챕터 추출
  const appearances = useMemo(() => {
    if (!character?.extras) return [];
    return extractAppearances(character.extras as Record<string, unknown>);
  }, [character?.extras]);

  // 캐릭터 설명
  const description = useMemo(() => {
    const extras = character?.extras as Record<string, unknown> | undefined;
    if (!extras) return "";
    const descKeys = ["설명", "소개", "description", "bio", "한줄소개"];
    for (const key of Object.keys(extras)) {
      for (const descKey of descKeys) {
        if (key.toLowerCase().includes(descKey.toLowerCase())) {
          return String(extras[key]);
        }
      }
    }
    return "";
  }, [character?.extras]);

  // 캐릭터 아크 진행률
  const arcProgress = useMemo(() => {
    const extras = character?.extras as Record<string, unknown> | undefined;
    if (!extras) return 20;
    const progressValue = extras["진행률"] || extras["progress"];
    if (progressValue && typeof progressValue === "number")
      return progressValue;
    return 20;
  }, [character?.extras]);

  return {
    traits,
    relationships,
    appearances,
    description,
    arcProgress,
  };
}

// --- 추출 함수들 ---

function extractTraits(extras: Record<string, unknown> = {}): string[] {
  const traitKeys = ["성격", "특성", "성향", "traits", "personality"];
  for (const key of Object.keys(extras)) {
    for (const traitKey of traitKeys) {
      if (key.toLowerCase().includes(traitKey.toLowerCase())) {
        const value = extras[key];
        if (Array.isArray(value)) return value.map(String);
        if (typeof value === "string")
          return value.split(",").map((s) => s.trim());
      }
    }
  }
  return [];
}

function extractRelationships(
  extras: Record<string, unknown> = {}
): Array<{ name: string; relation: string }> {
  const relationKeys = ["관계", "relationships", "인물관계"];
  for (const key of Object.keys(extras)) {
    for (const relationKey of relationKeys) {
      if (key.toLowerCase().includes(relationKey.toLowerCase())) {
        const value = extras[key];
        if (Array.isArray(value)) {
          return value.map((v) => {
            const str = String(v);
            const match = str.match(/^(.+?)\s*\((.+?)\)$/);
            if (match) {
              return { name: match[1].trim(), relation: match[2].trim() };
            }
            return { name: str, relation: "" };
          });
        }
      }
    }
  }
  return [];
}

function extractAppearances(extras: Record<string, unknown> = {}): string[] {
  const appearanceKeys = ["등장", "챕터", "chapters", "appearances"];
  for (const key of Object.keys(extras)) {
    for (const appKey of appearanceKeys) {
      if (key.toLowerCase().includes(appKey.toLowerCase())) {
        const value = extras[key];
        if (Array.isArray(value)) return value.map(String);
        if (typeof value === "string")
          return value.split(",").map((s) => s.trim());
      }
    }
  }
  return [];
}
