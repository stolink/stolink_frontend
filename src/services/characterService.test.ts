import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/mocks/server";
import { characterService } from "./characterService";

// ─────────────────────────────────────────────
// characterService 테스트
//
// projectService와 달리 이 서비스에는 핵심 로직이 있습니다:
// transformBackendCharacter() — 백엔드의 snake_case 응답을
// 프론트엔드의 camelCase 타입으로 변환합니다.
//
// 이 함수는 export되지 않아 직접 테스트할 수 없으므로,
// 서비스 메서드를 호출하되 MSW 응답을 "실제 백엔드와 유사한 형태"로
// 오버라이드해서 변환 로직을 간접 검증합니다.
// ─────────────────────────────────────────────

describe("characterService", () => {
  // ═══════════════════════════════════════════
  // Part 1: 기본 CRUD 동작 확인
  // 기본 MSW 핸들러(handlers.ts)를 사용합니다.
  // ═══════════════════════════════════════════

  describe("기본 CRUD", () => {
    it("getAll: 캐릭터 목록을 조회하고 변환된 형태로 반환한다", async () => {
      const result = await characterService.getAll("project-1");

      // handlers.ts가 반환하는 단순한 형태도 transformBackendCharacter를 거침
      expect(result.data).toHaveLength(1);

      const character = result.data[0];
      // 변환 후에도 이름이 유지되는지 확인
      expect(character.profile.name).toBe("홍길동");
      // projectId가 주입되는지 확인 (백엔드가 누락할 수 있음)
      expect(character.projectId).toBe("project-1");
    });

    it("getById: 단일 캐릭터를 조회한다", async () => {
      const result = await characterService.getById("char-1");

      expect(result.data._id).toBe("char-1");
      expect(result.data.profile.name).toBe("홍길동");
    });

    it("delete: 캐릭터를 삭제한다", async () => {
      const result = await characterService.delete("char-1");

      expect(result.data).toBeDefined();
    });

    it("regenerateImage: 이미지 재생성 작업을 요청한다", async () => {
      const result = await characterService.regenerateImage("char-1");

      // 비동기 작업이므로 jobId를 반환
      expect(result.data.jobId).toBe("job-123");
    });
  });

  // ═══════════════════════════════════════════
  // Part 2: 백엔드 데이터 변환 (핵심 테스트)
  //
  // 실제 백엔드는 snake_case + 다양한 필드명을 사용합니다.
  // server.use()로 MSW 핸들러를 "이 테스트에서만" 오버라이드하여
  // 실제와 유사한 응답을 시뮬레이션합니다.
  //
  // server.use()가 끝나면 setup.ts의 afterEach에서
  // server.resetHandlers()가 원래 핸들러로 복원합니다.
  // ═══════════════════════════════════════════

  describe("백엔드 snake_case → 프론트엔드 camelCase 변환", () => {
    it("snake_case 필드를 camelCase로 변환한다", async () => {
      // Arrange: 실제 백엔드가 보내는 형태를 시뮬레이션
      server.use(
        http.get("/api/characters/:id", () => {
          return HttpResponse.json({
            data: {
              // 백엔드는 character_id, project_id 같은 snake_case를 씀
              character_id: "char-uuid-123",
              project_id: "project-1",
              name: "아르노",
              role: "protagonist",
              // profile이 별도 객체로 옴
              profile: {
                name: "아르노",
                age: 28,
                gender: "male",
                race: "human",
                occupation: "기사",
                personality: {
                  core_traits: ["용감함", "정직함"],
                  flaws: ["고집"],
                  values: ["명예"],
                },
              },
              // 외모 정보: snake_case
              appearance: {
                physique: "건장한 체격",
                skin_tone: "밝은 피부",
                hair_style: "짧은 머리",
                hair_color: "검정",
                eyes: "갈색 눈",
              },
              // 관계 정보
              relations: {
                graph: [
                  {
                    target: "char-2",
                    type: "ALLY",
                    strength: 8,
                    description: "전우",
                    public_stance: "동맹",
                    private_feeling: "신뢰",
                  },
                ],
                event_refs: ["event-1", "event-2"],
                location_context: "왕국 수도",
              },
              // 감정 상태: snake_case
              current_mood: {
                emotion: "determined",
                intensity: 7,
                trigger: "전투 준비",
              },
              // 메타 정보: snake_case
              meta: {
                created_at: "2025-01-01T00:00:00Z",
                updated_at: "2025-06-15T00:00:00Z",
                data_version: "2.0.0",
                lock_version: 3,
              },
            },
          });
        }),
      );

      // Act
      const result = await characterService.getById("char-uuid-123");
      const char = result.data;

      // Assert: snake_case가 camelCase로 변환되었는지 확인

      // ID 매핑: character_id → _id
      expect(char._id).toBe("char-uuid-123");

      // 프로필 기본 정보
      expect(char.profile.name).toBe("아르노");
      expect(char.profile.age).toBe(28);
      expect(char.profile.occupation).toBe("기사");

      // 프로필 성격: core_traits → coreTraits
      expect(char.profile.personality.coreTraits).toEqual(["용감함", "정직함"]);
      expect(char.profile.personality.flaws).toEqual(["고집"]);

      // 외모: snake_case → camelCase
      expect(char.appearance.skinTone).toBe("밝은 피부");
      expect(char.appearance.hairStyle).toBe("짧은 머리");
      expect(char.appearance.hairColor).toBe("검정");

      // 관계: public_stance → publicStance
      expect(char.relations.graph).toHaveLength(1);
      expect(char.relations.graph[0].publicStance).toBe("동맹");
      expect(char.relations.graph[0].privateFeeling).toBe("신뢰");

      // 관계 메타: event_refs → eventRefs
      expect(char.relations.eventRefs).toEqual(["event-1", "event-2"]);
      expect(char.relations.locationContext).toBe("왕국 수도");

      // 감정: current_mood → currentMood
      expect(char.currentMood.emotion).toBe("determined");
      expect(char.currentMood.intensity).toBe(7);
      expect(char.currentMood.trigger).toBe("전투 준비");

      // 메타: created_at → createdAt
      expect(char.meta.createdAt).toBe("2025-01-01T00:00:00Z");
      expect(char.meta.updatedAt).toBe("2025-06-15T00:00:00Z");
      expect(char.meta.dataVersion).toBe("2.0.0");
      expect(char.meta.lockVersion).toBe(3);
    });

    it("누락된 필드에 안전한 기본값을 채운다", async () => {
      // Arrange: 최소한의 데이터만 보내는 백엔드 응답
      server.use(
        http.get("/api/characters/:id", () => {
          return HttpResponse.json({
            data: {
              id: "char-minimal",
              name: "이름만있는캐릭터",
              // profile, appearance, personality, relations 등 모두 누락
            },
          });
        }),
      );

      // Act
      const result = await characterService.getById("char-minimal");
      const char = result.data;

      // Assert: 기본값으로 채워져서 프론트엔드가 crash하지 않음
      expect(char._id).toBe("char-minimal");
      expect(char.profile.name).toBe("이름만있는캐릭터");
      expect(char.role).toBe("other"); // 기본 역할
      expect(char.status).toBe("alive"); // 기본 상태

      // 빈 배열/객체로 초기화
      expect(char.profile.personality.coreTraits).toEqual([]);
      expect(char.appearance.physique).toBe("");
      expect(char.relations.graph).toEqual([]);
      expect(char.relations.eventRefs).toEqual([]);
      expect(char.currentMood.emotion).toBe("");
      expect(char.meta.dataVersion).toBe("2.0.0");
    });
  });
});
