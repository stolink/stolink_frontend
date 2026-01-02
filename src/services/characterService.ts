import api from "@/api/client";
import type { ApiResponse } from "@/types/api";
import type {
  Character,
  CharacterRole,
  CharacterProfile,
  SimpleCharacter,
} from "@/types/character";
import { resolveImageUrl } from "@/utils/imageUtils";

export type { Character };

const MOCK_SIMPLE_CHARACTERS: SimpleCharacter[] = [
  {
    name: "세라",
    role: "protagonist",
    relationships: [
      { targetCharacterName: "아르노", type: "mentor" },
      { targetCharacterName: "카인", type: "enemy" },
    ],
  },
];

/**
 * 캐릭터 생성 입력 (새 스키마)
 */
export interface CreateCharacterInput {
  role?: CharacterRole;
  profile: Partial<CharacterProfile> & { name: string };
  aliases?: string[];
  status?: string;
}

/**
 * 캐릭터 업데이트 입력
 */
export type UpdateCharacterInput = Partial<CreateCharacterInput>;

/**
 * 백엔드 응답 → 프론트엔드 Character 타입 변환
 */
// Helper to safe parse or return object
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const safeParse = (data: any, defaultVal: any) => {
  if (typeof data === "string") {
    try {
      return JSON.parse(data);
    } catch {
      return defaultVal;
    }
  }
  return data || defaultVal;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformBackendCharacter(backendChar: any): Character {
  // Parse JSON fields (handle both stringified JSON and pre-parsed objects)
  const aliases = safeParse(backendChar.aliases, backendChar.aliasesJson || []);
  const appearance = safeParse(
    backendChar.appearance,
    backendChar.appearanceJson || {}
  );
  const personality = safeParse(
    backendChar.personality,
    backendChar.personalityJson || { core_traits: [], flaws: [], values: [] }
  );

  // 🆕 백엔드 relationships 배열을 relations.graph로 매핑
  const relationshipsGraph = Array.isArray(backendChar.relationships)
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
      backendChar.relationships.map((rel: any) => ({
        target: rel.target || rel.targetId,
        type: rel.type || rel.relationType || rel.relation_type || "friendly",
        history: rel.history || null,
        strength: rel.strength || 5,
        description: rel.description || "",
      }))
    : [];

  return {
    _id: backendChar.id,
    projectId: backendChar.projectId,
    role: backendChar.role || "other",
    profile: {
      characterId: backendChar.id || "",
      name: backendChar.profile?.name || backendChar.name || "Unknown",
      age: backendChar.profile?.age,
      gender: backendChar.profile?.gender || backendChar.gender, // fallback to root gender
      race: backendChar.profile?.race || backendChar.race, // fallback to root race
      mbti: backendChar.profile?.mbti || backendChar.mbti, // fallback to root mbti
      occupation: backendChar.profile?.occupation,
      birthplace: backendChar.profile?.birthplace,
      family: backendChar.profile?.family,
      personality: backendChar.profile?.personality || [],
      backstory: backendChar.backstory || backendChar.profile?.backstory || "",
      faction: {
        name: backendChar.profile?.faction?.name || null,
        social: backendChar.profile?.faction?.social || {
          rank: "unknown",
          influence: 0,
          factionReputation: {},
        },
      },
    },
    aliases: backendChar.profile?.aliases || aliases || [],
    status: backendChar.status || "active",
    motivation: backendChar.motivation,
    firstAppearance: backendChar.firstAppearance,
    appearance: {
      physique: appearance.physique || "",
      skinTone: appearance.skinTone || "",
      eyes: appearance.eyes || "",
      nose: appearance.nose || "",
      mouth: appearance.mouth || "",
      hairStyle: appearance.hairStyle || "",
      hairColor: appearance.hairColor || "",
      attire:
        appearance.attire || (appearance.clothing ? [appearance.clothing] : []),
      expression: appearance.expression || "",
      scarsTattoos:
        appearance.scarsTattoos ||
        (appearance.distinctive_features
          ? [appearance.distinctive_features]
          : []),
      styleContext: appearance.styleContext || { artStyle: "default" },
    },
    personality: {
      coreTraits: personality.coreTraits || personality.core_traits || [],
      flaws: personality.flaws || personality.flaws || [],
      values: personality.values || personality.values || [],
    },
    relations: {
      graph: relationshipsGraph,
      eventRefs: [],
      locationContext: "",
    },
    currentMood: {
      emotion: "",
      intensity: 0,
      trigger: null,
    },
    inventory: [],
    meta: {
      createdAt: backendChar.createdAt || null,
      updatedAt: backendChar.updatedAt || null,
      dataVersion: "1.0",
      lockVersion: 0,
    },
    imageUrl: resolveImageUrl(backendChar.imageUrl),
  };
}

export const characterService = {
  getAll: async (projectId: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await api.get<ApiResponse<any[]>>(
      `/projects/${projectId}/characters`
    );

    // Transform backend response to frontend type
    const characters = Array.isArray(response.data.data)
      ? response.data.data.map(transformBackendCharacter)
      : [];

    return { ...response.data, data: characters };
  },

  getById: async (id: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await api.get<ApiResponse<any>>(`/characters/${id}`);
    return {
      ...response.data,
      data: transformBackendCharacter(response.data.data),
    };
  },

  create: async (projectId: string, payload: CreateCharacterInput) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await api.post<ApiResponse<any>>(
      `/projects/${projectId}/characters`,
      payload
    );
    return {
      ...response.data,
      data: transformBackendCharacter(response.data.data),
    };
  },

  update: async (id: string, payload: UpdateCharacterInput) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await api.patch<ApiResponse<any>>(
      `/characters/${id}`,
      payload
    );
    return {
      ...response.data,
      data: transformBackendCharacter(response.data.data),
    };
  },

  delete: async (id: string) => {
    const response = await api.delete<ApiResponse<null>>(`/characters/${id}`);
    return response.data;
  },

  regenerateImage: async (id: string) => {
    const response = await api.post<ApiResponse<{ jobId: string }>>(
      `/characters/${id}/regenerate`
    );
    return response.data;
  },

  // 🧪 Integration Test Method
  fetchSimpleCharacters: async (): Promise<SimpleCharacter[]> => {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(MOCK_SIMPLE_CHARACTERS);
      }, 500);
    });
  },
};
