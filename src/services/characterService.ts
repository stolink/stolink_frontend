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
  imageUrl?: string;
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
const safeParse = (data: unknown, defaultVal: unknown): unknown => {
  if (typeof data === "string") {
    try {
      return JSON.parse(data);
    } catch {
      return defaultVal;
    }
  }
  return data || defaultVal;
};

interface BackendCharacter {
  _id?: string;
  characterId?: string;
  character_id?: string;
  projectId?: string;
  project_id?: string;
  name?: string;
  imageUrl?: string;
  profile?: unknown;
  profilejson?: unknown;
  profile_json?: unknown;
  appearance?: unknown;
  appearancejson?: unknown;
  appearance_json?: unknown;
  personality?: unknown;
  personalityjson?: unknown;
  personality_json?: unknown;
  relations?: unknown;
  appearances?: unknown[];
  data_version?: number;
  dataVersion?: number;
  lock_version?: number;
  lockVersion?: number;
  [key: string]: unknown;
}

function transformBackendCharacter(backendChar: BackendCharacter): Character {
  const profile = (safeParse(
    backendChar.profile,
    backendChar.profilejson || backendChar.profile_json || {},
  ) || {}) as Record<string, unknown>;

  // 🆕 relations 데이터 추출 로직 강화: 다양한 필드명과 파싱 상태 대응
  const relationsFromObj = (backendChar.relations || {}) as Record<
    string,
    unknown
  >;
  const relationsFromJson = (safeParse(
    backendChar.relationsjson ||
      backendChar.relations_json ||
      backendChar.relationsJson,
    {},
  ) || {}) as Record<string, unknown>;

  // graph 데이터가 있는 쪽을 선택 (JSON 문자열 파싱 결과 우선)
  const relations = (
    Array.isArray(relationsFromJson?.graph) &&
    relationsFromJson.graph.length > 0
      ? relationsFromJson
      : relationsFromObj
  ) as Record<string, unknown>;

  const aliases = safeParse(
    backendChar.aliases,
    backendChar.aliasesjson ||
      backendChar.aliases_json ||
      backendChar.aliasesJson ||
      [],
  );
  const rawAppearance = (safeParse(
    backendChar.appearance,
    backendChar.appearancejson ||
      backendChar.appearance_json ||
      backendChar.appearanceJson ||
      {},
  ) || {}) as Record<string, unknown>;

  // 🆕 profile.personality 및 기타 필드 복구
  const profilePersonality = (profile?.personality || {}) as Record<
    string,
    unknown
  >;
  const rawPersonality = (safeParse(
    backendChar.personality,
    backendChar.personalityjson ||
      backendChar.personality_json ||
      backendChar.personalityJson || { core_traits: [], flaws: [], values: [] },
  ) || {}) as Record<string, unknown>;

  const mapRelation = (rel: Record<string, unknown>) => ({
    target: (rel.target || rel.targetId) as string,
    type: (rel.type ||
      rel.relationType ||
      rel.relation_type ||
      "ALLY") as string,
    history: (rel.history as string | null) || null,
    strength: (rel.strength as number) || 5,
    description: (rel.description as string) || "",
    publicStance: (rel.public_stance || rel.publicStance) as string,
    privateFeeling: (rel.private_feeling || rel.privateFeeling) as string,
    bidirectional: rel.bidirectional as boolean | undefined,
    emotionalBond: (rel.emotional_bond || rel.emotionalBond) as
      | number
      | undefined,
    functionalTrust: (rel.functional_trust || rel.functionalTrust) as
      | number
      | undefined,
    valueAlignment: (rel.value_alignment || rel.valueAlignment) as
      | number
      | undefined,
    interdependence: rel.interdependence as number | undefined,
    latentTension: (rel.latent_tension || rel.latentTension) as
      | number
      | undefined,
  });

  const relationsGraph =
    Array.isArray(relations?.graph) && relations.graph.length > 0
      ? (relations.graph as Record<string, unknown>[]).map(mapRelation)
      : Array.isArray(backendChar.relationships)
        ? (backendChar.relationships as Record<string, unknown>[]).map(
            mapRelation,
          )
        : Array.isArray(relations)
          ? (relations as Record<string, unknown>[]).map(mapRelation)
          : [];

  // 🆕 callback_result.json: current_mood 객체 처리
  const currentMood = (backendChar.current_mood ||
    backendChar.currentMood ||
    {}) as Record<string, unknown>;

  // 🆕 callback_result.json: meta 객체 (snake_case)
  const meta = (backendChar.meta || {}) as Record<string, unknown>;

  // 🚨 HOTFIX: ID Mapping for known characters with missing IDs
  // This resolves the 404 error in EventService by forcing the correct UUID expected by the Event Service
  // (The backend is 100% Neo4j, but the Character Service response is missing this specific ID)
  const finalId = (backendChar.id ||
    backendChar.character_id ||
    backendChar._id ||
    (profile?.character_id as string) ||
    backendChar.characterId ||
    (profile?.characterId as string) ||
    "") as string;

  return {
    _id: finalId,
    projectId: backendChar.projectId || backendChar.project_id || "",
    role: backendChar.role || "other",
    profile: {
      _id: finalId,
      characterId: finalId,
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
          (profilePersonality.core_traits as string[]) ||
          (profilePersonality.coreTraits as string[]) ||
          (rawPersonality.core_traits as string[]) ||
          (rawPersonality.coreTraits as string[]) ||
          [],
        flaws:
          (profilePersonality.flaws as string[]) ||
          (rawPersonality.flaws as string[]) ||
          [],
        values:
          (profilePersonality.values as string[]) ||
          (rawPersonality.values as string[]) ||
          [],
      },
      backstory:
        (profile?.backstory as string) ||
        (backendChar.backstory as string) ||
        "",
      faction: {
        name: (profile?.faction as Record<string, unknown>)?.name as
          | string
          | null,
        social: {
          rank:
            ((
              (profile?.faction as Record<string, unknown>)?.social as Record<
                string,
                unknown
              >
            )?.rank as string) || "COMMON",
          influence:
            ((
              (profile?.faction as Record<string, unknown>)?.social as Record<
                string,
                unknown
              >
            )?.influence as number) || 0,
          // 🆕 callback_result.json: faction_reputation
          factionReputation:
            ((
              (profile?.faction as Record<string, unknown>)?.social as Record<
                string,
                unknown
              >
            )?.faction_reputation as Record<string, unknown>) ||
            ((
              (profile?.faction as Record<string, unknown>)?.social as Record<
                string,
                unknown
              >
            )?.factionReputation as Record<string, unknown>) ||
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
        (relations?.event_refs as string[]) ||
        (relations?.eventRefs as string[]) ||
        (backendChar.relations?.event_refs as string[]) ||
        (backendChar.relations?.eventRefs as string[]) ||
        [],
      locationContext:
        (relations?.location_context as string) ||
        (relations?.locationContext as string) ||
        (backendChar.relations?.location_context as string) ||
        (backendChar.relations?.locationContext as string) ||
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
    imageUrl: resolveImageUrl(backendChar.imageUrl as string),
    embedding: backendChar.embedding as number[] | undefined,
    graphPosition:
      (backendChar.graphPosition as { x: number; y: number }) || undefined,
  };
}

export const characterService = {
  getAll: async (projectId: string) => {
    const response = await api.get<ApiResponse<Record<string, unknown>[]>>(
      `/projects/${projectId}/characters`,
    );

    // Transform backend response to frontend type
    // Inject projectId if not present in backend response
    const characters = Array.isArray(response.data.data)
      ? response.data.data.map((char) => {
          const transformed = transformBackendCharacter(
            char as BackendCharacter,
          );
          // Ensure projectId is set (backend may omit project_id)
          if (!transformed.projectId) {
            transformed.projectId = projectId;
          }
          return transformed;
        })
      : [];

    return { ...response.data, data: characters };
  },

  getById: async (id: string) => {
    const response = await api.get<ApiResponse<Record<string, unknown>>>(
      `/characters/${id}`,
    );
    return {
      ...response.data,
      data: transformBackendCharacter(response.data.data as BackendCharacter),
    };
  },

  create: async (projectId: string, payload: CreateCharacterInput) => {
    const response = await api.post<ApiResponse<Record<string, unknown>>>(
      `/projects/${projectId}/characters`,
      payload,
    );
    return {
      ...response.data,
      data: transformBackendCharacter(response.data.data as BackendCharacter),
    };
  },

  update: async (id: string, payload: UpdateCharacterInput) => {
    console.log(`[characterService] PATCH /characters/${id}`, payload);
    const response = await api.patch<ApiResponse<Record<string, unknown>>>(
      `/characters/${id}`,
      payload,
    );
    console.log(
      `[characterService] PATCH /characters/${id} Response:`,
      response.data,
    );
    return {
      ...response.data,
      data: transformBackendCharacter(response.data.data as BackendCharacter),
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
