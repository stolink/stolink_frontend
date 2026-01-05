import type { Character } from "./character";
import type { RelationshipLink } from "./characterGraph";

export interface AnalysisDiff {
  newCharacters: Character[];
  updatedCharacters: { id: string; changes: string[] }[];
  newRelations: RelationshipLink[];
  updatedRelations: { id: string; changes: string[] }[];
  removedRelations: string[]; // IDs
}

// Mock Data Generator for verification
export function generateMockAnalysisData(
  existingCharacters: Character[],
  existingLinks: RelationshipLink[],
): AnalysisDiff {
  // 1. Mock New Character
  const newCharId = `new-char-${Date.now()}`;
  const newCharacter: Character = {
    _id: newCharId,
    projectId: "mock-project",
    role: "supporting",
    status: "alive",
    profile: {
      characterId: newCharId,
      name: "에포닌 테나르디에",
      age: 18,
      gender: "female",
      race: "human",
      mbti: null,
      personality: ["희생적", "대담함"],
      backstory:
        "테나르디에의 딸. 마리우스를 짝사랑하며 비극적인 운명을 맞이함.",
      occupation: "빈민",
      faction: {
        name: "테나르디에 일가",
        social: {
          rank: "low",
          influence: 0,
          factionReputation: {},
        },
      },
    },
    appearance: {
      physique: "마름",
      skinTone: "창백함",
      eyes: "슬픔",
      nose: "보통",
      mouth: "보통",
      hairStyle: "헝크러짐",
      hairColor: "갈색",
      attire: ["낡은 드레스"],
      expression: "우울",
      scarsTattoos: [],
      styleContext: { artStyle: "realistic" },
    },
    personality: {
      coreTraits: ["희생적", "대담함"],
      flaws: ["짝사랑"],
      values: ["사랑"],
    },
    relations: {
      graph: [],
      eventRefs: [],
      locationContext: "",
    },
    currentMood: {
      emotion: "sadness",
      intensity: 8,
      trigger: "Marius",
    },
    inventory: [],
    meta: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dataVersion: "1.0",
      lockVersion: 0,
    },
    aliases: [],
    imageUrl: "/placeholder-eponine.jpg",
  };

  // 2. Mock Updated Character (Protagonist)
  const protagonist =
    existingCharacters.find((c) => c.role === "protagonist") ||
    existingCharacters[0];
  const updatedCharDiff = protagonist
    ? {
        id: protagonist._id,
        changes: ["심리 상태 변화: 불안 -> 결의", "소속: 시장 -> 도망자"],
      }
    : undefined;

  // 3. Mock New Relation
  const newRelation: RelationshipLink = {
    id: `new-rel-${Date.now()}`,
    source: newCharId,
    target: protagonist?._id || "unknown",
    type: "romantic", // Using valid RelationType
    strength: 8,
    description: "짝사랑 (일방적)",
    curvature: 0.2,
  };

  // 4. Mock Updated Relation
  const existingLink = existingLinks[0];
  const updatedRelDiff = existingLink
    ? {
        id: existingLink.id,
        changes: ["관계 강도 증가: 3 -> 7", "설명 업데이트: 의심 -> 확신"],
      }
    : undefined;

  return {
    newCharacters: [newCharacter],
    updatedCharacters: updatedCharDiff ? [updatedCharDiff] : [],
    newRelations: [newRelation],
    updatedRelations: updatedRelDiff ? [updatedRelDiff] : [],
    removedRelations: [],
  };
}
