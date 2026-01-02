import api from "@/api/client";
import type { ApiResponse } from "@/types/api";
import type {
  Character,
  CharacterRole,
  CharacterProfile,
  SimpleCharacter,
} from "@/types/character";

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
    backendChar.appearanceJson || {},
  );
  const personality = safeParse(
    backendChar.personality,
    backendChar.personalityJson || { core_traits: [], flaws: [], values: [] },
  );

  // 🆕 백엔드 relationships 배열을 relations.graph로 매핑
  const relationshipsGraph = Array.isArray(backendChar.relationships)
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
      backendChar.relationships.map((rel: any) => ({
        target: rel.target || rel.targetId,
        type: rel.type || rel.relation_type || "friendly",
        history: rel.history || null,
        strength: rel.strength || 5,
        description: rel.description || "",
      }))
    : [];

  return {
    _id: backendChar.id,
    projectId: backendChar.projectId, // 👈 Added projectId
    role: backendChar.role || "other",
    profile: {
      character_id: backendChar.characterId || backendChar.id,
      name: backendChar.name || "이름 없음",
      age: backendChar.age || null,
      gender: backendChar.gender || "",
      race: backendChar.race || "",
      mbti: backendChar.mbti || null,
      personality: personality.core_traits || [],
      backstory: backendChar.backstory || "",
      faction: {
        name: backendChar.faction || null,
        social: {
          rank: "",
          influence: 0,
          faction_reputation: {},
        },
      },
    },
    aliases,
    status: backendChar.status || "alive",
    appearance: {
      physique: appearance.physique || "",
      skin_tone: appearance.skin_tone || "",
      eyes: appearance.eyes || "",
      nose: "",
      mouth: "",
      hair_style: appearance.hair || "",
      hair_color: "",
      attire: Array.isArray(appearance.attire)
        ? appearance.attire
        : [appearance.attire || ""],
      expression: "",
      scars_tattoos: [],
      style_context: {
        art_style: "",
      },
    },
    personality: {
      core_traits: personality.core_traits || [],
      flaws: personality.flaws || [],
      values: personality.values || [],
    },
    relations: {
      graph: relationshipsGraph,
      event_refs: [],
      location_context: "",
    },
    current_mood: {
      emotion: "",
      intensity: 0,
      trigger: null,
    },
    inventory: [],
    meta: {
      created_at: backendChar.createdAt || null,
      updated_at: backendChar.updatedAt || null,
      data_version: "1.0",
      lock_version: 0,
    },
    imageUrl: backendChar.imageUrl,
  };
}

export const characterService = {
  getAll: async (projectId: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await api.get<ApiResponse<any[]>>(
      `/projects/${projectId}/characters`,
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
      payload,
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
      payload,
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
      `/characters/${id}/regenerate`,
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
