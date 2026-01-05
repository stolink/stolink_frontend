import api from "@/api/client";
import type { ApiResponse } from "@/types/api";
import type {
  Character,
  CharacterRole,
  CharacterProfile,
  CharacterAppearance,
  CharacterPersonality,
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
  appearance?: Partial<CharacterAppearance>;
  personality?: Partial<CharacterPersonality>;
  graphPosition?: { x: number; y: number };
}

/**
 * 캐릭터 업데이트 입력
 */
export type UpdateCharacterInput = Partial<CreateCharacterInput>;

/**
 * 백엔드 응답 → 프론트엔드 Character 타입 변환
 * callback_result.json 스키마 기준 (snake_case → camelCase)
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
  const rawAppearance = safeParse(
    backendChar.appearance,
    backendChar.appearanceJson || {},
  );

  // 🆕 callback_result.json 기준: profile.personality는 객체 (core_traits, flaws, values)
  const profilePersonality = backendChar.profile?.personality || {};
  const rawPersonality = safeParse(
    backendChar.personality,
    backendChar.personalityJson || { core_traits: [], flaws: [], values: [] },
  );

  // 🆕 callback_result.json 기준: relations.graph에서 직접 매핑

  const relationsGraph = Array.isArray(backendChar.relations?.graph)
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
      backendChar.relations.graph.map((rel: any) => ({
        target: rel.target,
        type: rel.type || "ALLY",
        history: rel.history || null,
        strength: rel.strength || 5,
        description: rel.description || "",
        // 🆕 callback_result.json: public_stance, private_feeling
        publicStance: rel.public_stance || rel.publicStance,
        privateFeeling: rel.private_feeling || rel.privateFeeling,
      }))
    : // Fallback: 기존 relationships 배열 형식
      Array.isArray(backendChar.relationships)
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        backendChar.relationships.map((rel: any) => ({
          target: rel.target || rel.targetId,
          type: rel.type || rel.relationType || rel.relation_type || "ALLY",
          history: rel.history || null,
          strength: rel.strength || 5,
          description: rel.description || "",
          publicStance: rel.public_stance,
          privateFeeling: rel.private_feeling,
        }))
      : [];

  // 🆕 callback_result.json: current_mood 객체 처리
  const currentMood = backendChar.current_mood || backendChar.currentMood || {};

  // 🆕 callback_result.json: meta 객체 (snake_case)
  const meta = backendChar.meta || {};

  return {
    _id: backendChar._id || backendChar.id,
    projectId: backendChar.projectId || "",
    role: backendChar.role || "other",
    profile: {
      characterId:
        backendChar.profile?.character_id ||
        backendChar.profile?.characterId ||
        backendChar._id ||
        "",
      name: backendChar.profile?.name || backendChar.name || "Unknown",
      age: backendChar.profile?.age ?? null,
      gender: backendChar.profile?.gender || backendChar.gender || "unknown",
      race: backendChar.profile?.race || backendChar.race || "unknown",
      mbti: backendChar.profile?.mbti || backendChar.mbti || null,
      occupation: backendChar.profile?.occupation,
      birthplace: backendChar.profile?.birthplace,
      family: backendChar.profile?.family,
      // 🆕 profile.personality는 이제 객체 (ProfilePersonality)
      personality: {
        coreTraits:
          profilePersonality.core_traits ||
          profilePersonality.coreTraits ||
          rawPersonality.core_traits ||
          rawPersonality.coreTraits ||
          [],
        flaws: profilePersonality.flaws || rawPersonality.flaws || [],
        values: profilePersonality.values || rawPersonality.values || [],
      },
      backstory: backendChar.profile?.backstory || backendChar.backstory || "",
      faction: {
        name: backendChar.profile?.faction?.name || null,
        social: {
          rank: backendChar.profile?.faction?.social?.rank || "COMMON",
          influence: backendChar.profile?.faction?.social?.influence || 0,
          // 🆕 callback_result.json: faction_reputation
          factionReputation:
            backendChar.profile?.faction?.social?.faction_reputation ||
            backendChar.profile?.faction?.social?.factionReputation ||
            {},
        },
      },
    },
    aliases: backendChar.aliases || aliases || [],
    status: backendChar.status || "alive",
    motivation: backendChar.motivation,
    firstAppearance: backendChar.firstAppearance,
    // 🆕 callback_result.json: appearance 필드 (snake_case → camelCase)
    appearance: {
      physique: rawAppearance.physique || "",
      skinTone: rawAppearance.skin_tone || rawAppearance.skinTone || "",
      eyes: rawAppearance.eyes || "",
      nose: rawAppearance.nose || "",
      mouth: rawAppearance.mouth || "",
      hairStyle: rawAppearance.hair_style || rawAppearance.hairStyle || "",
      hairColor: rawAppearance.hair_color || rawAppearance.hairColor || "",
      attire:
        rawAppearance.attire ||
        (rawAppearance.clothing ? [rawAppearance.clothing] : []),
      expression: rawAppearance.expression || "",
      scarsTattoos:
        rawAppearance.scars_tattoos ||
        rawAppearance.scarsTattoos ||
        (rawAppearance.distinctive_features
          ? [rawAppearance.distinctive_features]
          : []),
      styleContext: {
        artStyle:
          rawAppearance.style_context?.art_style ||
          rawAppearance.styleContext?.artStyle ||
          "Digital Illustration",
      },
    },
    // Character.personality - profile.personality와 동일하게 매핑
    personality: {
      coreTraits:
        profilePersonality.core_traits ||
        profilePersonality.coreTraits ||
        rawPersonality.core_traits ||
        rawPersonality.coreTraits ||
        [],
      flaws: profilePersonality.flaws || rawPersonality.flaws || [],
      values: profilePersonality.values || rawPersonality.values || [],
    },
    relations: {
      graph: relationsGraph,
      // 🆕 callback_result.json: event_refs, location_context
      eventRefs:
        backendChar.relations?.event_refs ||
        backendChar.relations?.eventRefs ||
        [],
      locationContext:
        backendChar.relations?.location_context ||
        backendChar.relations?.locationContext ||
        "",
    },
    // 🆕 callback_result.json: current_mood (snake_case)
    currentMood: {
      emotion: currentMood.emotion || "",
      intensity: currentMood.intensity || 0,
      trigger: currentMood.trigger || null,
    },
    inventory: [],
    // 🆕 callback_result.json: meta (snake_case)
    meta: {
      createdAt: meta.created_at || meta.createdAt || null,
      updatedAt: meta.updated_at || meta.updatedAt || null,
      dataVersion: meta.data_version || meta.dataVersion || "2.0.0",
      lockVersion: meta.lock_version || meta.lockVersion || 0,
    },
    imageUrl: resolveImageUrl(backendChar.imageUrl),
    embedding: backendChar.embedding,
    graphPosition: backendChar.graphPosition || undefined,
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
