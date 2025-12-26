import { useMemo } from "react";
import type { Character } from "@/types";
import {
  TRAIT_KEYS,
  RELATION_KEYS,
  APPEARANCE_KEYS,
  DESCRIPTION_KEYS,
} from "../constants";

// 성격 특성 추출
function extractTraits(extras: Record<string, unknown> = {}): string[] {
  for (const key of Object.keys(extras)) {
    for (const traitKey of TRAIT_KEYS) {
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

// 관계 추출
function extractRelationships(
  extras: Record<string, unknown> = {}
): Array<{ name: string; relation: string }> {
  for (const key of Object.keys(extras)) {
    for (const relationKey of RELATION_KEYS) {
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

// 등장 챕터 추출
function extractAppearances(extras: Record<string, unknown> = {}): string[] {
  for (const key of Object.keys(extras)) {
    for (const appKey of APPEARANCE_KEYS) {
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

export function useCharacterData(character: Character | null) {
  const traits = useMemo(
    () => extractTraits(character?.extras as Record<string, unknown>),
    [character?.extras]
  );

  const relationships = useMemo(
    () => extractRelationships(character?.extras as Record<string, unknown>),
    [character?.extras]
  );

  const appearances = useMemo(
    () => extractAppearances(character?.extras as Record<string, unknown>),
    [character?.extras]
  );

  const description = useMemo(() => {
    const extras = character?.extras as Record<string, unknown> | undefined;
    if (!extras) return "";
    for (const key of Object.keys(extras)) {
      for (const descKey of DESCRIPTION_KEYS) {
        if (key.toLowerCase().includes(descKey.toLowerCase())) {
          return String(extras[key]);
        }
      }
    }
    return "";
  }, [character?.extras]);

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
