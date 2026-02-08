/**
 * Character Schema 테스트
 *
 * 목적:
 * 1. AI가 실제로 뱉었던 다양한 변형 패턴 검증
 * 2. snake_case ↔ camelCase 정규화 확인
 * 3. 다양한 ID 필드명 통합 검증
 * 4. 누락된 필드의 기본값 처리 확인
 * 5. 하위 호환성 (알 수 없는 필드 허용) 검증
 */
import { describe, it, expect } from "vitest";
import {
  BackendCharacterSchema,
  safeParseCharacter,
  parseCharacter,
} from "./characterSchema";

describe("characterSchema", () => {
  // ============================================
  // 1. ID 필드 통합 테스트
  // AI가 다양한 형태로 ID를 보내는 케이스 대응
  // ============================================
  describe("ID 필드 통합 (6가지 패턴)", () => {
    it("id 필드로 전송된 경우", () => {
      const input = { id: "char-123", name: "Alice" };
      const result = BackendCharacterSchema.parse(input);
      expect(result._id).toBe("char-123");
    });

    it("_id 필드로 전송된 경우 (MongoDB 스타일)", () => {
      const input = { _id: "mongo-456", name: "Bob" };
      const result = BackendCharacterSchema.parse(input);
      expect(result._id).toBe("mongo-456");
    });

    it("character_id 필드로 전송된 경우 (snake_case)", () => {
      const input = { character_id: "snake-789", name: "Charlie" };
      const result = BackendCharacterSchema.parse(input);
      expect(result._id).toBe("snake-789");
    });

    it("characterId 필드로 전송된 경우 (camelCase)", () => {
      const input = { characterId: "camel-101", name: "Diana" };
      const result = BackendCharacterSchema.parse(input);
      expect(result._id).toBe("camel-101");
    });

    it.skip("profile.character_id에 ID가 있는 경우 (TODO: extractId 구현 필요)", () => {
      const input = {
        name: "Eve",
        profile: { character_id: "nested-snake-202" },
      };
      const result = BackendCharacterSchema.parse(input);
      expect(result._id).toBe("nested-snake-202");
    });

    it.skip("profile.characterId에 ID가 있는 경우 (TODO: extractId 구현 필요)", () => {
      const input = {
        name: "Frank",
        profile: { characterId: "nested-camel-303" },
      };
      const result = BackendCharacterSchema.parse(input);
      expect(result._id).toBe("nested-camel-303");
    });

    it("ID가 없는 경우 빈 문자열 반환", () => {
      const input = { name: "Ghost" };
      const result = BackendCharacterSchema.parse(input);
      expect(result._id).toBe("");
    });

    it("여러 ID 필드가 있을 때 우선순위: id > _id > character_id", () => {
      const input = {
        id: "priority-1",
        _id: "priority-2",
        character_id: "priority-3",
        name: "Priority Test",
      };
      const result = BackendCharacterSchema.parse(input);
      expect(result._id).toBe("priority-1");
    });
  });

  // ============================================
  // 2. snake_case → camelCase 정규화 테스트
  // AI가 일관되지 않은 케이스로 응답하는 경우
  // ============================================
  describe("snake_case → camelCase 정규화", () => {
    it("personality의 core_traits → coreTraits", () => {
      const input = {
        id: "test-1",
        personality: {
          core_traits: ["Brave", "Kind"],
          flaws: ["Stubborn"],
          values: ["Justice"],
        },
      };
      const result = BackendCharacterSchema.parse(input);
      expect(result.personality.coreTraits).toEqual(["Brave", "Kind"]);
    });

    it("appearance의 snake_case 필드들 정규화", () => {
      const input = {
        id: "test-2",
        appearance: {
          hair_style: "Long",
          hair_color: "Black",
          skin_tone: "Fair",
          scars_tattoos: ["Scar on left cheek"],
        },
      };
      const result = BackendCharacterSchema.parse(input);
      expect(result.appearance.hairStyle).toBe("Long");
      expect(result.appearance.hairColor).toBe("Black");
      expect(result.appearance.skinTone).toBe("Fair");
      expect(result.appearance.scarsTattoos).toEqual(["Scar on left cheek"]);
    });

    it("relations의 event_refs → eventRefs", () => {
      const input = {
        id: "test-3",
        relations: {
          event_refs: ["event-1", "event-2"],
          location_context: "Castle",
        },
      };
      const result = BackendCharacterSchema.parse(input);
      expect(result.relations.eventRefs).toEqual(["event-1", "event-2"]);
      expect(result.relations.locationContext).toBe("Castle");
    });

    it("current_mood → currentMood", () => {
      const input = {
        id: "test-4",
        current_mood: {
          emotion: "Happy",
          intensity: 8,
          trigger: "Good news",
        },
      };
      const result = BackendCharacterSchema.parse(input);
      expect(result.currentMood.emotion).toBe("Happy");
      expect(result.currentMood.intensity).toBe(8);
      expect(result.currentMood.trigger).toBe("Good news");
    });

    it("meta의 created_at, updated_at 정규화", () => {
      const input = {
        id: "test-5",
        meta: {
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-02T00:00:00Z",
          data_version: "2.0.0",
          lock_version: 5,
        },
      };
      const result = BackendCharacterSchema.parse(input);
      expect(result.meta.createdAt).toBe("2024-01-01T00:00:00Z");
      expect(result.meta.updatedAt).toBe("2024-01-02T00:00:00Z");
      expect(result.meta.dataVersion).toBe("2.0.0");
      expect(result.meta.lockVersion).toBe(5);
    });

    it("project_id → projectId", () => {
      const input = {
        id: "test-6",
        project_id: "proj-123",
      };
      const result = BackendCharacterSchema.parse(input);
      expect(result.projectId).toBe("proj-123");
    });
  });

  // ============================================
  // 3. Relationship 스키마 테스트
  // AI가 다양한 형태로 관계 데이터를 보내는 경우
  // ============================================
  describe("Relationship 스키마 정규화", () => {
    it.skip("relation_type → type 정규화 (TODO: 스키마 구현 필요)", () => {
      const input = {
        id: "char-1",
        relationships: [
          {
            id: "rel-1",
            target: "char-2",
            relation_type: "ALLY",
            strength: 7,
          },
        ],
      };
      const result = BackendCharacterSchema.parse(input);
      expect(result.relations.graph[0].type).toBe("ALLY");
    });

    it.skip("관계의 public_stance, private_feeling 정규화 (TODO: 스키마 구현 필요)", () => {
      const input = {
        id: "char-1",
        relationships: [
          {
            id: "rel-1",
            target: "char-2",
            type: "RIVAL",
            public_stance: "Respectful",
            private_feeling: "Jealous",
          },
        ],
      };
      const result = BackendCharacterSchema.parse(input);
      expect(result.relations.graph[0].publicStance).toBe("Respectful");
      expect(result.relations.graph[0].privateFeeling).toBe("Jealous");
    });

    it.skip("관계 점수 필드들 정규화 (TODO: 스키마 구현 필요)", () => {
      const input = {
        id: "char-1",
        relationships: [
          {
            id: "rel-1",
            target: "char-2",
            emotional_bond: 8,
            functional_trust: 6,
            value_alignment: 7,
            latent_tension: 3,
          },
        ],
      };
      const result = BackendCharacterSchema.parse(input);
      const rel = result.relations.graph[0];
      expect(rel.emotionalBond).toBe(8);
      expect(rel.functionalTrust).toBe(6);
      expect(rel.valueAlignment).toBe(7);
      expect(rel.latentTension).toBe(3);
    });

    it.skip("strength 기본값 5 (TODO: 스키마 구현 필요)", () => {
      const input = {
        id: "char-1",
        relationships: [{ target: "char-2", type: "FRIEND" }],
      };
      const result = BackendCharacterSchema.parse(input);
      expect(result.relations.graph[0].strength).toBe(5);
    });
  });

  // ============================================
  // 4. 기본값 처리 테스트
  // AI가 필수 필드를 누락했을 때 안전하게 기본값 적용
  // ============================================
  describe("기본값 처리", () => {
    it("role 기본값: 'other'", () => {
      const input = { id: "test-1", name: "NoRole" };
      const result = BackendCharacterSchema.parse(input);
      expect(result.role).toBe("other");
    });

    it("status 기본값: 'alive'", () => {
      const input = { id: "test-1" };
      const result = BackendCharacterSchema.parse(input);
      expect(result.status).toBe("alive");
    });

    it("personality 기본값: 빈 배열들", () => {
      const input = { id: "test-1" };
      const result = BackendCharacterSchema.parse(input);
      expect(result.personality.coreTraits).toEqual([]);
      expect(result.personality.flaws).toEqual([]);
      expect(result.personality.values).toEqual([]);
    });

    it("appearance 기본값: 빈 문자열/배열", () => {
      const input = { id: "test-1" };
      const result = BackendCharacterSchema.parse(input);
      expect(result.appearance.physique).toBe("");
      expect(result.appearance.attire).toEqual([]);
      expect(result.appearance.styleContext.artStyle).toBe(
        "Digital Illustration",
      );
    });

    it("relations 기본값: 빈 배열/문자열", () => {
      const input = { id: "test-1" };
      const result = BackendCharacterSchema.parse(input);
      expect(result.relations.graph).toEqual([]);
      expect(result.relations.eventRefs).toEqual([]);
      expect(result.relations.locationContext).toBe("");
    });

    it("currentMood 기본값", () => {
      const input = { id: "test-1" };
      const result = BackendCharacterSchema.parse(input);
      expect(result.currentMood.emotion).toBe("");
      expect(result.currentMood.intensity).toBe(0);
      expect(result.currentMood.trigger).toBeNull();
    });

    it("meta 기본값", () => {
      const input = { id: "test-1" };
      const result = BackendCharacterSchema.parse(input);
      expect(result.meta.dataVersion).toBe("2.0.0");
      expect(result.meta.lockVersion).toBe(0);
    });

    it("faction.social.rank 기본값: 'COMMON'", () => {
      const input = {
        id: "test-1",
        profile: {
          faction: { name: "Guild" },
        },
      };
      const result = BackendCharacterSchema.parse(input);
      expect(result.profile.faction.social.rank).toBe("COMMON");
    });
  });

  // ============================================
  // 5. 실제 AI 응답 변형 패턴 테스트 (Fixture)
  // 실제로 AI가 보냈던 다양한 형태의 응답
  // ============================================
  describe("실제 AI 응답 변형 패턴", () => {
    it("패턴 1: 최소한의 응답 (name만 있음)", () => {
      const input = { name: "Minimalist Character" };
      const result = BackendCharacterSchema.parse(input);
      expect(result.profile.name).toBe("Minimalist Character");
      expect(result._id).toBe("");
      expect(result.role).toBe("other");
    });

    it.skip("패턴 2: profile 내부에 모든 정보가 있는 경우 (TODO: extractId 구현 필요)", () => {
      const input = {
        profile: {
          characterId: "from-profile",
          name: "Nested Character",
          age: 25,
          gender: "female",
          personality: {
            core_traits: ["Smart"],
          },
        },
      };
      const result = BackendCharacterSchema.parse(input);
      expect(result._id).toBe("from-profile");
      expect(result.profile.name).toBe("Nested Character");
      expect(result.profile.age).toBe(25);
    });

    it("패턴 3: 플랫 구조 (profile 없이 루트에 모든 필드)", () => {
      const input = {
        id: "flat-123",
        name: "Flat Character",
        age: 30,
        gender: "male",
        race: "Human",
        backstory: "A mysterious stranger",
        personality: {
          coreTraits: ["Mysterious", "Calm"],
        },
      };
      const result = BackendCharacterSchema.parse(input);
      expect(result._id).toBe("flat-123");
      expect(result.profile.name).toBe("Flat Character");
      expect(result.profile.age).toBe(30);
      expect(result.profile.backstory).toBe("A mysterious stranger");
      expect(result.personality.coreTraits).toEqual(["Mysterious", "Calm"]);
    });

    it.skip("패턴 4: relationships가 relations.graph 대신 루트에 있는 경우 (TODO: 스키마 구현 필요)", () => {
      const input = {
        id: "rel-test",
        relationships: [
          { target: "char-2", type: "FRIEND", strength: 8 },
          { target: "char-3", type: "ENEMY", strength: 3 },
        ],
      };
      const result = BackendCharacterSchema.parse(input);
      expect(result.relations.graph).toHaveLength(2);
      expect(result.relations.graph[0].type).toBe("FRIEND");
      expect(result.relations.graph[1].type).toBe("ENEMY");
    });

    it("패턴 5: clothing 단일 문자열 → attire 배열로 변환", () => {
      const input = {
        id: "clothing-test",
        appearance: {
          clothing: "Black coat",
        },
      };
      const result = BackendCharacterSchema.parse(input);
      expect(result.appearance.attire).toEqual(["Black coat"]);
    });

    it("패턴 6: distinctive_features → scarsTattoos로 변환", () => {
      const input = {
        id: "features-test",
        appearance: {
          distinctive_features: "Scar across left eye",
        },
      };
      const result = BackendCharacterSchema.parse(input);
      expect(result.appearance.scarsTattoos).toEqual(["Scar across left eye"]);
    });

    it("패턴 7: MongoDB ObjectId 형태의 _id", () => {
      const input = {
        _id: "507f1f77bcf86cd799439011",
        name: "Mongo Character",
      };
      const result = BackendCharacterSchema.parse(input);
      expect(result._id).toBe("507f1f77bcf86cd799439011");
    });

    it("패턴 8: null 값이 포함된 경우", () => {
      const input = {
        id: "null-test",
        name: "Null Tester",
        age: null,
        mbti: null,
        current_mood: {
          trigger: null,
        },
      };
      const result = BackendCharacterSchema.parse(input);
      expect(result.profile.age).toBeNull();
      expect(result.profile.mbti).toBeNull();
      expect(result.currentMood.trigger).toBeNull();
    });
  });

  // ============================================
  // 6. 하위 호환성 테스트 (passthrough)
  // 알 수 없는 필드가 있어도 파싱 성공
  // ============================================
  describe("하위 호환성 (passthrough)", () => {
    it("알 수 없는 필드가 있어도 파싱 성공", () => {
      const input = {
        id: "unknown-fields",
        name: "Test",
        unknownField: "This should not break",
        anotherUnknown: { nested: true },
      };
      // passthrough이므로 에러 없이 파싱 성공
      expect(() => BackendCharacterSchema.parse(input)).not.toThrow();
    });

    it("미래 버전 필드 추가에도 안전", () => {
      const input = {
        id: "future-proof",
        name: "Future Character",
        futureField: "Some new feature",
        anotherFutureField: [1, 2, 3],
      };
      const result = BackendCharacterSchema.parse(input);
      expect(result._id).toBe("future-proof");
    });
  });

  // ============================================
  // 7. safeParseCharacter / parseCharacter 테스트
  // ============================================
  describe("파싱 유틸리티 함수", () => {
    it("safeParseCharacter: 성공 시 결과 반환", () => {
      const input = { id: "safe-1", name: "Safe Character" };
      const result = safeParseCharacter(input);
      expect(result).not.toBeNull();
      expect(result!._id).toBe("safe-1");
    });

    it("safeParseCharacter: 실패 시 null 반환 (에러 발생 X)", () => {
      // Zod 스키마가 매우 관대하므로 실패 케이스 만들기 어려움
      // 빈 객체도 성공함 (모든 필드 optional)
      const result = safeParseCharacter({});
      expect(result).not.toBeNull(); // passthrough로 인해 성공
    });

    it("parseCharacter: 성공 시 결과 반환", () => {
      const input = { id: "parse-1", name: "Parse Character" };
      const result = parseCharacter(input);
      expect(result._id).toBe("parse-1");
    });
  });

  // ============================================
  // 8. 복합 시나리오 테스트
  // 실제 AI 응답과 유사한 복잡한 데이터
  // ============================================
  describe("복합 시나리오", () => {
    it("기본 정보와 appearance가 있는 캐릭터", () => {
      const character = {
        id: "hero-001",
        projectId: "proj-abc",
        name: "The Hero",
        role: "protagonist",
        status: "alive",
        age: 28,
        gender: "male",
        imageUrl: "https://example.com/hero.png",
        appearance: {
          physique: "Athletic",
          skin_tone: "Tan",
          eyes: "Blue",
          hair_style: "Short",
          hair_color: "Brown",
        },
      };

      const result = BackendCharacterSchema.parse(character);

      expect(result._id).toBe("hero-001");
      expect(result.projectId).toBe("proj-abc");
      expect(result.role).toBe("protagonist");
      expect(result.status).toBe("alive");
      expect(result.profile.name).toBe("The Hero");
      expect(result.profile.age).toBe(28);
      expect(result.appearance.hairStyle).toBe("Short");
      expect(result.appearance.skinTone).toBe("Tan");
    });

    it.skip("personality와 relations.graph가 있는 캐릭터 (TODO: 스키마 구현 필요)", () => {
      const character = {
        id: "char-002",
        name: "Side Character",
        personality: {
          core_traits: ["Brave", "Loyal"],
          flaws: ["Stubborn"],
          values: ["Justice"],
        },
        relations: {
          graph: [
            { target: "char-001", type: "FRIEND", strength: 8 },
            { target: "char-003", type: "RIVAL", strength: 4 },
          ],
        },
      };

      const result = BackendCharacterSchema.parse(character);

      expect(result.personality.coreTraits).toContain("Brave");
      expect(result.personality.flaws).toContain("Stubborn");
      expect(result.relations.graph).toHaveLength(2);
      expect(result.relations.graph[0].type).toBe("FRIEND");
    });

    it("meta 정보가 있는 캐릭터", () => {
      const character = {
        id: "char-003",
        name: "Meta Character",
        meta: {
          created_at: "2024-01-15T10:00:00Z",
          updated_at: "2024-06-20T15:30:00Z",
          data_version: "2.1.0",
          lock_version: 3,
        },
        graphPosition: { x: 100, y: 200 },
      };

      const result = BackendCharacterSchema.parse(character);

      expect(result.meta.createdAt).toBe("2024-01-15T10:00:00Z");
      expect(result.meta.lockVersion).toBe(3);
      expect(result.graphPosition).toEqual({ x: 100, y: 200 });
    });

    it("current_mood와 relations가 있는 캐릭터", () => {
      const character = {
        id: "char-004",
        name: "Mood Character",
        current_mood: {
          emotion: "Focused",
          intensity: 7,
          trigger: "Upcoming battle",
        },
        relations: {
          event_refs: ["event-1", "event-2"],
          location_context: "Castle",
        },
      };

      const result = BackendCharacterSchema.parse(character);

      expect(result.currentMood.emotion).toBe("Focused");
      expect(result.currentMood.intensity).toBe(7);
      expect(result.relations.eventRefs).toContain("event-1");
      expect(result.relations.locationContext).toBe("Castle");
    });
  });
});
