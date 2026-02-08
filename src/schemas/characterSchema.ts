/**
 * Character API 응답 Zod 스키마
 *
 * 목적:
 * 1. 백엔드 응답의 런타임 검증
 * 2. snake_case → camelCase 정규화
 * 3. 다양한 ID 필드명 통합 (_id, id, character_id, characterId)
 *
 * @see characterService.ts - transformBackendCharacter() 함수 대체
 */
import { z } from "zod";

// ─────────────────────────────────────────────
// Helper: 안전한 ID 추출 (6가지 필드명 폴백)
// ─────────────────────────────────────────────
const extractId = (data: Record<string, unknown>): string => {
  return (
    (data.id as string) ||
    (data._id as string) ||
    (data.character_id as string) ||
    (data.characterId as string) ||
    ((data.profile as Record<string, unknown>)?.character_id as string) ||
    ((data.profile as Record<string, unknown>)?.characterId as string) ||
    ""
  );
};

// ─────────────────────────────────────────────
// 관계(Relationship) 스키마
// ─────────────────────────────────────────────
const RelationshipSchema = z
  .object({
    id: z.string().optional(),
    _id: z.string().optional(),
    relationship_id: z.string().optional(),
    relationshipId: z.string().optional(),
    target: z.string().optional(),
    targetId: z.string().optional(),
    type: z.string().optional(),
    relationType: z.string().optional(),
    relation_type: z.string().optional(),
    strength: z.number().optional().default(5),
    description: z.string().optional().default(""),
    history: z.string().nullable().optional(),
    public_stance: z.string().optional(),
    publicStance: z.string().optional(),
    private_feeling: z.string().optional(),
    privateFeeling: z.string().optional(),
    bidirectional: z.boolean().optional(),
    emotional_bond: z.number().optional(),
    emotionalBond: z.number().optional(),
    functional_trust: z.number().optional(),
    functionalTrust: z.number().optional(),
    value_alignment: z.number().optional(),
    valueAlignment: z.number().optional(),
    interdependence: z.number().optional(),
    latent_tension: z.number().optional(),
    latentTension: z.number().optional(),
  })
  .transform((rel) => ({
    id: rel.id || rel._id || rel.relationship_id || rel.relationshipId,
    target: rel.target || rel.targetId || "",
    type: rel.type || rel.relationType || rel.relation_type || "ALLY",
    strength: rel.strength ?? 5,
    description: rel.description ?? "",
    history: rel.history ?? null,
    publicStance: rel.public_stance || rel.publicStance || "",
    privateFeeling: rel.private_feeling || rel.privateFeeling || "",
    bidirectional: rel.bidirectional,
    emotionalBond: rel.emotional_bond ?? rel.emotionalBond,
    functionalTrust: rel.functional_trust ?? rel.functionalTrust,
    valueAlignment: rel.value_alignment ?? rel.valueAlignment,
    interdependence: rel.interdependence,
    latentTension: rel.latent_tension ?? rel.latentTension,
  }));

// ─────────────────────────────────────────────
// 성격(Personality) 스키마
// ─────────────────────────────────────────────
const PersonalitySchema = z
  .object({
    core_traits: z.array(z.string()).optional(),
    coreTraits: z.array(z.string()).optional(),
    flaws: z.array(z.string()).optional(),
    values: z.array(z.string()).optional(),
  })
  .transform((p) => ({
    coreTraits: p.core_traits || p.coreTraits || [],
    flaws: p.flaws || [],
    values: p.values || [],
  }));

// ─────────────────────────────────────────────
// 외모(Appearance) 스키마
// ─────────────────────────────────────────────
const AppearanceSchema = z
  .object({
    physique: z.string().optional(),
    skin_tone: z.string().optional(),
    skinTone: z.string().optional(),
    eyes: z.string().optional(),
    nose: z.string().optional(),
    mouth: z.string().optional(),
    hair_style: z.string().optional(),
    hairStyle: z.string().optional(),
    hair_color: z.string().optional(),
    hairColor: z.string().optional(),
    attire: z.array(z.string()).optional(),
    clothing: z.string().optional(),
    expression: z.string().optional(),
    scars_tattoos: z.array(z.string()).optional(),
    scarsTattoos: z.array(z.string()).optional(),
    distinctive_features: z.string().optional(),
    style_context: z
      .object({
        art_style: z.string().optional(),
        artStyle: z.string().optional(),
      })
      .optional(),
    styleContext: z
      .object({
        art_style: z.string().optional(),
        artStyle: z.string().optional(),
      })
      .optional(),
  })
  .transform((a) => ({
    physique: a.physique || "",
    skinTone: a.skin_tone || a.skinTone || "",
    eyes: a.eyes || "",
    nose: a.nose || "",
    mouth: a.mouth || "",
    hairStyle: a.hair_style || a.hairStyle || "",
    hairColor: a.hair_color || a.hairColor || "",
    attire: a.attire || (a.clothing ? [a.clothing] : []),
    expression: a.expression || "",
    scarsTattoos:
      a.scars_tattoos ||
      a.scarsTattoos ||
      (a.distinctive_features ? [a.distinctive_features] : []),
    styleContext: {
      artStyle:
        a.style_context?.art_style ||
        a.style_context?.artStyle ||
        a.styleContext?.art_style ||
        a.styleContext?.artStyle ||
        "Digital Illustration",
    },
  }));

// ─────────────────────────────────────────────
// 감정 상태(CurrentMood) 스키마
// ─────────────────────────────────────────────
const CurrentMoodSchema = z
  .object({
    emotion: z.string().optional(),
    intensity: z.number().optional(),
    trigger: z.string().nullable().optional(),
  })
  .optional()
  .default({})
  .transform((m) => ({
    emotion: m?.emotion || "",
    intensity: m?.intensity || 0,
    trigger: m?.trigger ?? null,
  }));

// ─────────────────────────────────────────────
// 메타 정보(Meta) 스키마
// ─────────────────────────────────────────────
const MetaSchema = z
  .object({
    created_at: z.string().nullable().optional(),
    createdAt: z.string().nullable().optional(),
    updated_at: z.string().nullable().optional(),
    updatedAt: z.string().nullable().optional(),
    data_version: z.string().optional(),
    dataVersion: z.string().optional(),
    lock_version: z.number().optional(),
    lockVersion: z.number().optional(),
  })
  .optional()
  .default({})
  .transform((m) => ({
    createdAt: m?.created_at || m?.createdAt || null,
    updatedAt: m?.updated_at || m?.updatedAt || null,
    dataVersion: m?.data_version || m?.dataVersion || "2.0.0",
    lockVersion: m?.lock_version ?? m?.lockVersion ?? 0,
  }));

// ─────────────────────────────────────────────
// 관계 컨테이너(Relations) 스키마
// ─────────────────────────────────────────────
const RelationsSchema = z
  .object({
    graph: z.array(RelationshipSchema).optional(),
    event_refs: z.array(z.string()).optional(),
    eventRefs: z.array(z.string()).optional(),
    location_context: z.string().optional(),
    locationContext: z.string().optional(),
  })
  .optional()
  .default({})
  .transform((r) => ({
    graph: r?.graph || [],
    eventRefs: r?.event_refs || r?.eventRefs || [],
    locationContext: r?.location_context || r?.locationContext || "",
  }));

// ─────────────────────────────────────────────
// 프로필(Profile) 스키마
// ─────────────────────────────────────────────
const ProfileSchema = z
  .object({
    name: z.string().optional(),
    age: z.number().nullable().optional(),
    gender: z.string().optional(),
    race: z.string().optional(),
    mbti: z.string().nullable().optional(),
    occupation: z.string().optional(),
    birthplace: z.string().optional(),
    family: z.string().optional(),
    backstory: z.string().optional(),
    personality: PersonalitySchema.optional(),
    faction: z
      .object({
        name: z.string().nullable().optional(),
        social: z
          .object({
            rank: z.string().optional(),
            influence: z.number().optional(),
            faction_reputation: z.record(z.unknown()).optional(),
            factionReputation: z.record(z.unknown()).optional(),
          })
          .optional(),
      })
      .optional(),
  })
  .optional()
  .default({});

// ─────────────────────────────────────────────
// 🔥 메인: 백엔드 Character 응답 스키마
// ─────────────────────────────────────────────
export const BackendCharacterSchema = z
  .object({
    // 다양한 ID 필드들 (백엔드 불일치 대응)
    id: z.string().optional(),
    _id: z.string().optional(),
    character_id: z.string().optional(),
    characterId: z.string().optional(),

    // 프로젝트 ID
    projectId: z.string().optional(),
    project_id: z.string().optional(),

    // 기본 필드
    name: z.string().optional(),
    role: z.string().optional(),
    status: z.string().optional(),
    age: z.number().nullable().optional(),
    gender: z.string().optional(),
    race: z.string().optional(),
    mbti: z.string().nullable().optional(),
    backstory: z.string().optional(),
    occupation: z.string().optional(),
    birthplace: z.string().optional(),
    family: z.string().optional(),
    motivation: z.string().optional(),
    firstAppearance: z.string().optional(),
    imageUrl: z.string().optional(),

    // 복합 객체 필드들
    profile: ProfileSchema,
    aliases: z.array(z.string()).optional(),
    appearance: AppearanceSchema.optional(),
    personality: PersonalitySchema.optional(),
    relations: RelationsSchema,
    relationships: z.array(RelationshipSchema).optional(),
    current_mood: CurrentMoodSchema,
    currentMood: CurrentMoodSchema,
    meta: MetaSchema,
    embedding: z.array(z.number()).optional(),
    graphPosition: z.object({ x: z.number(), y: z.number() }).optional(),
  })
  .passthrough() // 알 수 없는 필드도 허용 (하위 호환성)
  .transform((data) => {
    const id = extractId(data as Record<string, unknown>);
    const profile = data.profile || {};
    // personality에 기본값 제공
    const rawPersonality =
      data.personality ||
      (profile as Record<string, unknown>)?.personality ||
      {};
    const personality = {
      coreTraits:
        (rawPersonality as { coreTraits?: string[] })?.coreTraits ||
        (rawPersonality as { core_traits?: string[] })?.core_traits ||
        [],
      flaws: (rawPersonality as { flaws?: string[] })?.flaws || [],
      values: (rawPersonality as { values?: string[] })?.values || [],
    };
    const appearance = data.appearance || {
      physique: "",
      skinTone: "",
      eyes: "",
      nose: "",
      mouth: "",
      hairStyle: "",
      hairColor: "",
      attire: [],
      expression: "",
      scarsTattoos: [],
      styleContext: { artStyle: "Digital Illustration" },
    };
    const relations = data.relations || {};
    const currentMood = data.current_mood || data.currentMood || {};
    const meta = data.meta || {};

    return {
      _id: id,
      projectId: data.projectId || data.project_id || "",
      role: data.role || "other",
      profile: {
        _id: id,
        characterId: id,
        name:
          ((profile as Record<string, unknown>)?.name as string) ||
          data.name ||
          "Unknown",
        age:
          ((profile as Record<string, unknown>)?.age as number) ??
          data.age ??
          null,
        gender:
          ((profile as Record<string, unknown>)?.gender as string) ||
          data.gender ||
          "unknown",
        race:
          ((profile as Record<string, unknown>)?.race as string) ||
          data.race ||
          "unknown",
        mbti:
          ((profile as Record<string, unknown>)?.mbti as string) ||
          data.mbti ||
          null,
        occupation:
          ((profile as Record<string, unknown>)?.occupation as string) ||
          data.occupation ||
          "",
        birthplace:
          ((profile as Record<string, unknown>)?.birthplace as string) ||
          data.birthplace ||
          "",
        family:
          ((profile as Record<string, unknown>)?.family as string) ||
          data.family ||
          "",
        personality: personality as {
          coreTraits: string[];
          flaws: string[];
          values: string[];
        },
        backstory:
          ((profile as Record<string, unknown>)?.backstory as string) ||
          data.backstory ||
          "",
        faction: {
          name: (
            (profile as Record<string, unknown>)?.faction as Record<
              string,
              unknown
            >
          )?.name as string | null,
          social: {
            rank:
              ((
                (
                  (profile as Record<string, unknown>)?.faction as Record<
                    string,
                    unknown
                  >
                )?.social as Record<string, unknown>
              )?.rank as string) || "COMMON",
            influence:
              ((
                (
                  (profile as Record<string, unknown>)?.faction as Record<
                    string,
                    unknown
                  >
                )?.social as Record<string, unknown>
              )?.influence as number) || 0,
            factionReputation:
              ((
                (
                  (profile as Record<string, unknown>)?.faction as Record<
                    string,
                    unknown
                  >
                )?.social as Record<string, unknown>
              )?.faction_reputation as Record<string, unknown>) ||
              ((
                (
                  (profile as Record<string, unknown>)?.faction as Record<
                    string,
                    unknown
                  >
                )?.social as Record<string, unknown>
              )?.factionReputation as Record<string, unknown>) ||
              {},
          },
        },
      },
      aliases: data.aliases || [],
      status: data.status || "alive",
      motivation: data.motivation,
      firstAppearance: data.firstAppearance,
      appearance: appearance as {
        physique: string;
        skinTone: string;
        eyes: string;
        nose: string;
        mouth: string;
        hairStyle: string;
        hairColor: string;
        attire: string[];
        expression: string;
        scarsTattoos: string[];
        styleContext: { artStyle: string };
      },
      personality: personality as {
        coreTraits: string[];
        flaws: string[];
        values: string[];
      },
      relations: {
        graph:
          (relations as { graph?: unknown[] })?.graph ||
          data.relationships ||
          [],
        eventRefs:
          (relations as { eventRefs?: string[] })?.eventRefs ||
          (relations as { event_refs?: string[] })?.event_refs ||
          [],
        locationContext:
          (relations as { locationContext?: string })?.locationContext ||
          (relations as { location_context?: string })?.location_context ||
          "",
      },
      currentMood: currentMood as {
        emotion: string;
        intensity: number;
        trigger: string | null;
      },
      inventory: [],
      meta: meta as {
        createdAt: string | null;
        updatedAt: string | null;
        dataVersion: string;
        lockVersion: number;
      },
      imageUrl: data.imageUrl || "",
      embedding: data.embedding,
      graphPosition: data.graphPosition,
    };
  });

// 타입 추론
export type ParsedCharacter = z.infer<typeof BackendCharacterSchema>;

/**
 * 안전한 파싱 함수 - 실패 시 null 반환
 */
export function safeParseCharacter(data: unknown): ParsedCharacter | null {
  const result = BackendCharacterSchema.safeParse(data);
  if (result.success) {
    return result.data;
  }
  console.error("[characterSchema] Validation failed:", result.error.issues);
  return null;
}

/**
 * 엄격한 파싱 함수 - 실패 시 예외 발생
 */
export function parseCharacter(data: unknown): ParsedCharacter {
  return BackendCharacterSchema.parse(data);
}
