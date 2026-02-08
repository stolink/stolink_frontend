import { describe, it, expect } from "vitest";
import { projectService } from "./projectService";

// ─────────────────────────────────────────────
// projectService 테스트
//
// 이 테스트는 "서비스 레이어가 API를 올바르게 호출하고,
// 응답을 올바른 형태로 반환하는가?"를 검증합니다.
//
// 실제 HTTP 요청은 MSW(Mock Service Worker)가 가로채서
// 미리 정의된 가짜 응답을 돌려줍니다.
// (src/test/mocks/handlers.ts에 정의됨)
// ─────────────────────────────────────────────

describe("projectService", () => {
  // ═══════════════════════════════════════════
  // 1. getAll - 프로젝트 목록 조회
  // ═══════════════════════════════════════════
  describe("getAll", () => {
    it("프로젝트 목록을 반환한다", async () => {
      // Act: 서비스 함수 호출
      const result = await projectService.getAll();

      // Assert: MSW handlers.ts의 GET /projects 핸들러가 반환하는 값과 대조
      expect(result).toBeDefined();
      expect(result.data).toBeDefined();

      // handlers.ts에서 data는 배열 형태로 반환됨
      // → [{ id: "project-1", title: "Test Project", ... }]
      const projects = result.data as unknown as Array<Record<string, unknown>>;
      expect(projects).toHaveLength(1);
      expect(projects[0].id).toBe("project-1");
      expect(projects[0].title).toBe("Test Project");
      expect(projects[0].genre).toBe("fantasy");
    });
  });

  // ═══════════════════════════════════════════
  // 2. getById - 단일 프로젝트 조회
  // ═══════════════════════════════════════════
  describe("getById", () => {
    it("ID로 프로젝트를 조회한다", async () => {
      const result = await projectService.getById("project-1");

      expect(result.data).toBeDefined();
      // MSW 핸들러가 params.id를 그대로 반환하므로
      // 우리가 넘긴 "project-1"이 응답에 포함됨
      expect(result.data.id).toBe("project-1");
      expect(result.data.title).toBe("Test Project");
    });
  });

  // ═══════════════════════════════════════════
  // 3. create - 프로젝트 생성
  // ═══════════════════════════════════════════
  describe("create", () => {
    it("새 프로젝트를 생성하고 결과를 반환한다", async () => {
      const payload = {
        title: "나의 소설",
        genre: "romance",
        description: "로맨스 장편",
      };

      const result = await projectService.create(payload);

      expect(result.data).toBeDefined();
      // MSW 핸들러가 요청 body의 title, genre을 그대로 반영
      expect(result.data.id).toBe("new-project-id");
      expect(result.data.title).toBe("나의 소설");
      expect(result.data.genre).toBe("romance");
    });
  });

  // ═══════════════════════════════════════════
  // 4. update - 프로젝트 수정
  // ═══════════════════════════════════════════
  describe("update", () => {
    it("프로젝트 정보를 수정한다", async () => {
      const result = await projectService.update("project-1", {
        title: "수정된 제목",
      });

      expect(result.data).toBeDefined();
      expect(result.data.id).toBe("project-1");
      // MSW 핸들러: body.title이 있으면 그 값을 반환
      expect(result.data.title).toBe("수정된 제목");
    });
  });

  // ═══════════════════════════════════════════
  // 5. delete - 프로젝트 삭제
  // ═══════════════════════════════════════════
  describe("delete", () => {
    it("프로젝트를 삭제한다", async () => {
      const result = await projectService.delete("project-1");

      // MSW 핸들러: { data: { id: params.id } } 반환
      expect(result.data).toBeDefined();
    });
  });

  // ═══════════════════════════════════════════
  // 6. getStats - 프로젝트 통계 조회
  // ═══════════════════════════════════════════
  describe("getStats", () => {
    it("프로젝트 통계를 반환한다", async () => {
      const result = await projectService.getStats("project-1");

      expect(result.data).toBeDefined();
      // handlers.ts에 정의된 통계 값 확인
      expect(result.data.wordCount).toBe(5000);
      expect(result.data.characterCount).toBe(3);
      expect(result.data.documentCount).toBe(10);
      expect(result.data.foreshadowingCount).toBe(5);
    });
  });

  // ═══════════════════════════════════════════
  // 7. duplicate - 프로젝트 복제
  // ═══════════════════════════════════════════
  describe("duplicate", () => {
    it("프로젝트를 복제한다", async () => {
      const result = await projectService.duplicate("project-1");

      expect(result.data).toBeDefined();
      // MSW 핸들러: id는 "${params.id}-copy"
      expect(result.data.id).toBe("project-1-copy");
      expect(result.data.title).toBe("Test Project (Copy)");
    });
  });
});
