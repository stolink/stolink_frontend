import api from "@/api/client";
import type { ApiResponse } from "@/types/api";
import type {
  Character,
  CharacterAppearance,
  CharacterPersonality,
  CharacterProfile,
  CharacterRole,
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
  const profile = safeParse(
    backendChar.profile,
    backendChar.profilejson || backendChar.profile_json || {},
  );

  // 🆕 relations 데이터 추출 로직 강화: 다양한 필드명과 파싱 상태 대응
  const relationsFromObj = backendChar.relations || {};
  const relationsFromJson = safeParse(
    backendChar.relationsjson ||
      backendChar.relations_json ||
      backendChar.relationsJson,
    {},
  );

  // graph 데이터가 있는 쪽을 선택 (JSON 문자열 파싱 결과 우선)
  const relations =
    Array.isArray(relationsFromJson?.graph) &&
    relationsFromJson.graph.length > 0
      ? relationsFromJson
      : relationsFromObj;

  const aliases = safeParse(
    backendChar.aliases,
    backendChar.aliasesjson ||
      backendChar.aliases_json ||
      backendChar.aliasesJson ||
      [],
  );
  const rawAppearance = safeParse(
    backendChar.appearance,
    backendChar.appearancejson ||
      backendChar.appearance_json ||
      backendChar.appearanceJson ||
      {},
  );

  // 🆕 profile.personality 및 기타 필드 복구
  const profilePersonality = profile?.personality || {};
  const rawPersonality = safeParse(
    backendChar.personality,
    backendChar.personalityjson ||
      backendChar.personality_json ||
      backendChar.personalityJson || { core_traits: [], flaws: [], values: [] },
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRelation = (rel: any) => ({
    target: rel.target || rel.targetId,
    type: rel.type || rel.relationType || rel.relation_type || "ALLY",
    history: rel.history || null,
    strength: rel.strength || 5,
    description: rel.description || "",
    publicStance: rel.public_stance || rel.publicStance,
    privateFeeling: rel.private_feeling || rel.privateFeeling,
    bidirectional: rel.bidirectional,
    emotionalBond: rel.emotional_bond || rel.emotionalBond,
    functionalTrust: rel.functional_trust || rel.functionalTrust,
    valueAlignment: rel.value_alignment || rel.valueAlignment,
    interdependence: rel.interdependence,
    latentTension: rel.latent_tension || rel.latentTension,
  });

  const relationsGraph =
    Array.isArray(relations?.graph) && relations.graph.length > 0
      ? relations.graph.map(mapRelation)
      : Array.isArray(backendChar.relationships)
        ? backendChar.relationships.map(mapRelation)
        : Array.isArray(relations)
          ? relations.map(mapRelation)
          : [];

  // 🆕 callback_result.json: current_mood 객체 처리
  const currentMood = backendChar.current_mood || backendChar.currentMood || {};

  // 🆕 callback_result.json: meta 객체 (snake_case)
  const meta = backendChar.meta || {};

  return {
    _id:
      backendChar._id ||
      backendChar.id ||
      backendChar.characterId ||
      backendChar.character_id ||
      profile?.character_id ||
      profile?.characterId ||
      "",
    projectId: backendChar.projectId || backendChar.project_id || "",
    role: backendChar.role || "other",
    profile: {
      characterId:
        profile?.character_id ||
        profile?.characterId ||
        backendChar.characterId ||
        backendChar.character_id ||
        backendChar._id ||
        "",
      name: profile?.name || backendChar.name || "Unknown",
      age: profile?.age ?? null,
      gender: profile?.gender || backendChar.gender || "unknown",
      race: profile?.race || backendChar.race || "unknown",
      mbti: profile?.mbti || backendChar.mbti || null,
      occupation: profile?.occupation,
      birthplace: profile?.birthplace,
      family: profile?.family,
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
      backstory: profile?.backstory || backendChar.backstory || "",
      faction: {
        name: profile?.faction?.name || null,
        social: {
          rank: profile?.faction?.social?.rank || "COMMON",
          influence: profile?.faction?.social?.influence || 0,
          // 🆕 callback_result.json: faction_reputation
          factionReputation:
            profile?.faction?.social?.faction_reputation ||
            profile?.faction?.social?.factionReputation ||
            {},
        },
      },
    },
    aliases: backendChar.aliases || aliases || [],
    status: backendChar.status || "alive",
    motivation: backendChar.motivation,
    firstAppearance: backendChar.firstAppearance,
    // ... appearance remains same ...
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
        relations?.event_refs ||
        relations?.eventRefs ||
        backendChar.relations?.event_refs ||
        backendChar.relations?.eventRefs ||
        [],
      locationContext:
        relations?.location_context ||
        relations?.locationContext ||
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
    console.log(`[characterService] Extracting for projectId: ${projectId}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await api.get<ApiResponse<any[]>>(
      `/projects/${projectId}/characters`,
    );

    console.log("[characterService] getAll response data:", response.data);

    // [PROBE] Check if dedicated relationships endpoint still exists despite deprecation warning
    api
      .get(`/projects/${projectId}/relationships`)
      .then((res) => console.log("[PROBE] /relationships response:", res.data))
      .catch((err) =>
        console.log(
          "[PROBE] /relationships failed (as expected if deprecated):",
          err.message,
        ),
      );

    if (response.data.data && response.data.data.length > 0) {
      console.log(
        "[characterService] Raw item 0 details:",
        response.data.data[0],
      );
    }

    // Transform backend response to frontend type
    const characters = Array.isArray(response.data.data)
      ? response.data.data.map(transformBackendCharacter)
      : [];

    if (characters.length > 0) {
      console.log(
        "[characterService] Transformed item 0 details:",
        characters[0],
      );
      console.log(
        "[characterService] Item 0 relations graph:",
        characters[0].relations.graph,
      );
    }

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
