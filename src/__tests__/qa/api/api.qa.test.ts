/**
 * QA API 테스트 케이스 (Stolink Comprehensive)
 * Range: TC-STO-001 ~ TC-STO-057
 */
import { describe, it, beforeEach, vi } from "vitest";
import { runApiTest, type ApiTestCase } from "@/test/api-helpers";

vi.mock("idb-keyval", () => ({
  get: vi.fn().mockResolvedValue(null),
  set: vi.fn().mockResolvedValue(undefined),
  del: vi.fn().mockResolvedValue(undefined),
}));

const testGroups: { title: string; tests: ApiTestCase[] }[] = [
  {
    title: "[Auth] TC-STO-001 ~ 007",
    tests: [
      {
        id: "TC-STO-001",
        description: "회원가입 (POST /api/auth/register)",
        method: "POST",
        url: "/auth/register",
        mockResponse: {
          status: 201,
          body: {
            data: {
              user: { id: "new-user", email: "new@test.com" },
              accessToken: "at",
              refreshToken: "rt",
            },
          },
        },
        expectedStatus: 201,
        verify: (json) => {
          if (json.data.user.email !== "new@test.com")
            throw new Error("Email mismatch");
        },
      },
      {
        id: "TC-STO-002",
        description: "로그인 (POST /api/auth/login)",
        method: "POST",
        url: "/auth/login",
        mockResponse: { body: { data: { accessToken: "valid-token" } } },
        verify: (json) => {
          if (json.data.accessToken !== "valid-token")
            throw new Error("Token mismatch");
        },
      },
      {
        id: "TC-STO-003",
        description: "토큰 갱신 (POST /api/auth/refresh)",
        method: "POST",
        url: "/auth/refresh",
        mockResponse: { body: { data: { accessToken: "refreshed-token" } } },
      },
      {
        id: "TC-STO-004",
        description: "로그아웃 (POST /api/auth/logout)",
        method: "POST",
        url: "/auth/logout",
        mockResponse: { body: { success: true } },
      },
      {
        id: "TC-STO-005",
        description: "비밀번호 찾기 (POST /api/auth/forgot-password)",
        method: "POST",
        url: "/auth/forgot-password",
        mockResponse: { body: { success: true } },
      },
      {
        id: "TC-STO-006",
        description: "내 정보 조회 (GET /api/auth/me)",
        method: "GET",
        url: "/auth/me",
        mockResponse: { body: { data: { id: "me", email: "me@test.com" } } },
        verify: (json) => {
          if (json.data.email !== "me@test.com")
            throw new Error("Email mismatch");
        },
      },
      {
        id: "TC-STO-007",
        description: "내 정보 수정 (PATCH /api/auth/me)",
        method: "PATCH",
        url: "/auth/me",
        mockResponse: { body: { data: { id: "me", nickname: "Updated" } } },
        verify: (json) => {
          if (json.data.nickname !== "Updated")
            throw new Error("Nickname mismatch");
        },
      },
    ],
  },
  {
    title: "[Projects] TC-STO-008 ~ 014",
    tests: [
      {
        id: "TC-STO-008",
        description: "프로젝트 목록 조회 (GET /api/projects)",
        method: "GET",
        url: "/projects",
        mockResponse: {
          body: {
            data: {
              projects: [{ id: "p1", title: "Project 1" }],
              pagination: { total: 1 },
            },
          },
        },
        verify: (json) => {
          if (json.data.projects.length !== 1)
            throw new Error("Length mismatch");
        },
      },
      {
        id: "TC-STO-009",
        description: "프로젝트 생성 (POST /api/projects)",
        method: "POST",
        url: "/projects",
        mockResponse: {
          status: 201,
          body: { data: { id: "p-new", title: "New Project" } },
        },
        expectedStatus: 201,
      },
      {
        id: "TC-STO-010",
        description: "프로젝트 상세 조회 (GET /api/projects/:id)",
        method: "GET",
        url: "/projects/:id",
        requestUrl: "/projects/p1",
        mockResponse: { body: { data: { id: "p1", title: "Detail" } } },
        verify: (json) => {
          if (json.data.title !== "Detail") throw new Error("Title mismatch");
        },
      },
      {
        id: "TC-STO-011",
        description: "프로젝트 수정 (PATCH /api/projects/:id)",
        method: "PATCH",
        url: "/projects/:id",
        requestUrl: "/projects/p1",
        mockResponse: { body: { data: { id: "p1", title: "Modified" } } },
        verify: (json) => {
          if (json.data.title !== "Modified") throw new Error("Title mismatch");
        },
      },
      {
        id: "TC-STO-012",
        description: "프로젝트 삭제 (DELETE /api/projects/:id)",
        method: "DELETE",
        url: "/projects/:id",
        requestUrl: "/projects/p1",
        mockResponse: { body: { success: true } },
      },
      {
        id: "TC-STO-013",
        description: "프로젝트 통계 조회 (GET /api/projects/:id/stats)",
        method: "GET",
        url: "/projects/:id/stats",
        requestUrl: "/projects/p1/stats",
        mockResponse: { body: { data: { totalWords: 10000 } } },
        verify: (json) => {
          if (json.data.totalWords !== 10000) throw new Error("Stats mismatch");
        },
      },
      {
        id: "TC-STO-014",
        description: "프로젝트 복제 (POST /api/projects/:id/duplicate)",
        method: "POST",
        url: "/projects/:id/duplicate",
        requestUrl: "/projects/p1/duplicate",
        mockResponse: { status: 201, body: { data: { id: "p-copy" } } },
        expectedStatus: 201,
      },
    ],
  },
  {
    title: "[Documents] TC-STO-015 ~ 023",
    tests: [
      {
        id: "TC-STO-015",
        description: "문서 트리 조회",
        method: "GET",
        url: "/projects/:pid/documents",
        requestUrl: "/projects/p1/documents?tree=true",
        mockResponse: {
          body: { data: [{ id: "d1", type: "folder", children: [] }] },
        },
        verify: (json) => {
          if (json.data[0].type !== "folder") throw new Error("Type mismatch");
        },
      },
      {
        id: "TC-STO-016",
        description: "문서 생성",
        method: "POST",
        url: "/projects/:pid/documents",
        requestUrl: "/projects/p1/documents",
        mockResponse: { status: 201, body: { data: { id: "d-new" } } },
        expectedStatus: 201,
      },
      {
        id: "TC-STO-017",
        description: "문서 상세 조회",
        method: "GET",
        url: "/documents/:id",
        requestUrl: "/documents/d1",
        mockResponse: { body: { data: { id: "d1", title: "Detail" } } },
        verify: (json) => {
          if (json.data.title !== "Detail") throw new Error("Title mismatch");
        },
      },
      {
        id: "TC-STO-018",
        description: "문서 수정",
        method: "PATCH",
        url: "/documents/:id",
        requestUrl: "/documents/d1",
        mockResponse: { body: { data: { id: "d1", title: "Updated" } } },
        verify: (json) => {
          if (json.data.title !== "Updated") throw new Error("Title mismatch");
        },
      },
      {
        id: "TC-STO-019",
        description: "문서 삭제",
        method: "DELETE",
        url: "/documents/:id",
        requestUrl: "/documents/d1",
        mockResponse: { body: { success: true } },
      },
      {
        id: "TC-STO-020",
        description: "본문 조회",
        method: "GET",
        url: "/documents/:id/content",
        requestUrl: "/documents/d1/content",
        mockResponse: { body: { data: { content: "Some content" } } },
        verify: (json) => {
          if (json.data.content !== "Some content")
            throw new Error("Content mismatch");
        },
      },
      {
        id: "TC-STO-021",
        description: "본문 수정",
        method: "PATCH",
        url: "/documents/:id/content",
        requestUrl: "/documents/d1/content",
        mockResponse: { body: { data: { wordCount: 100 } } },
        verify: (json) => {
          if (json.data.wordCount !== 100)
            throw new Error("WordCount mismatch");
        },
      },
      {
        id: "TC-STO-022",
        description: "문서 순서 변경",
        method: "POST",
        url: "/documents/reorder",
        mockResponse: { body: { success: true } },
      },
      {
        id: "TC-STO-023",
        description: "문서 일괄 업데이트",
        method: "POST",
        url: "/documents/bulk-update",
        mockResponse: { body: { updatedCount: 5 } },
        verify: (json) => {
          if (json.updatedCount !== 5) throw new Error("Count mismatch");
        },
      },
    ],
  },
  {
    title: "[Characters] TC-STO-024 ~ 029",
    tests: [
      {
        id: "TC-STO-024",
        description: "캐릭터 목록 조회",
        method: "GET",
        url: "/projects/:pid/characters",
        requestUrl: "/projects/p1/characters",
        mockResponse: { body: { data: [{ id: "c1", name: "Char 1" }] } },
        verify: (json) => {
          if (json.data.length !== 1) throw new Error("Length mismatch");
        },
      },
      {
        id: "TC-STO-025",
        description: "캐릭터 생성",
        method: "POST",
        url: "/projects/:pid/characters",
        requestUrl: "/projects/p1/characters",
        mockResponse: { status: 201, body: { data: { id: "c-new" } } },
        expectedStatus: 201,
      },
      {
        id: "TC-STO-026",
        description: "캐릭터 상세 조회",
        method: "GET",
        url: "/characters/:id",
        requestUrl: "/characters/c1",
        mockResponse: { body: { data: { id: "c1", name: "Detail" } } },
        verify: (json) => {
          if (json.data.name !== "Detail") throw new Error("Name mismatch");
        },
      },
      {
        id: "TC-STO-027",
        description: "캐릭터 수정",
        method: "PATCH",
        url: "/characters/:id",
        requestUrl: "/characters/c1",
        mockResponse: { body: { data: { id: "c1", name: "Updated" } } },
        verify: (json) => {
          if (json.data.name !== "Updated") throw new Error("Name mismatch");
        },
      },
      {
        id: "TC-STO-028",
        description: "캐릭터 삭제",
        method: "DELETE",
        url: "/characters/:id",
        requestUrl: "/characters/c1",
        mockResponse: { body: { success: true } },
      },
      {
        id: "TC-STO-029",
        description: "캐릭터 이미지 재생성",
        method: "POST",
        url: "/characters/:id/regenerate",
        requestUrl: "/characters/c1/regenerate",
        mockResponse: { body: { data: { imageUrl: "new-image.jpg" } } },
        verify: (json) => {
          if (json.data.imageUrl !== "new-image.jpg")
            throw new Error("Image mismatch");
        },
      },
    ],
  },
  {
    title: "[Relationships] TC-STO-030 ~ 033",
    tests: [
      {
        id: "TC-STO-030",
        description: "관계 목록 조회",
        method: "GET",
        url: "/projects/:pid/relationships",
        requestUrl: "/projects/p1/relationships",
        mockResponse: { body: { data: [{ id: "r1" }] } },
        verify: (json) => {
          if (json.data.length !== 1) throw new Error("Length mismatch");
        },
      },
      {
        id: "TC-STO-031",
        description: "관계 생성",
        method: "POST",
        url: "/relationships",
        mockResponse: { status: 201, body: { data: { id: "r-new" } } },
        expectedStatus: 201,
      },
      {
        id: "TC-STO-032",
        description: "관계 수정",
        method: "PATCH",
        url: "/relationships/:id",
        requestUrl: "/relationships/r1",
        mockResponse: { body: { data: { strength: 10 } } },
        verify: (json) => {
          if (json.data.strength !== 10) throw new Error("Strength mismatch");
        },
      },
      {
        id: "TC-STO-033",
        description: "관계 삭제",
        method: "DELETE",
        url: "/relationships/:id",
        requestUrl: "/relationships/r1",
        mockResponse: { body: { success: true } },
      },
    ],
  },
  {
    title: "[Foreshadowing] TC-STO-034 ~ 041",
    tests: [
      {
        id: "TC-STO-034",
        description: "복선 목록 조회",
        method: "GET",
        url: "/projects/:pid/foreshadowing",
        requestUrl: "/projects/p1/foreshadowing",
        mockResponse: { body: { data: [{ id: "f1" }] } },
        verify: (json) => {
          if (json.data.length !== 1) throw new Error("Length mismatch");
        },
      },
      {
        id: "TC-STO-035",
        description: "복선 생성",
        method: "POST",
        url: "/projects/:pid/foreshadowing",
        requestUrl: "/projects/p1/foreshadowing",
        mockResponse: { status: 201, body: { data: { id: "f-new" } } },
        expectedStatus: 201,
      },
      {
        id: "TC-STO-036",
        description: "복선 상세 조회",
        method: "GET",
        url: "/foreshadowing/:id",
        requestUrl: "/foreshadowing/f1",
        mockResponse: { body: { data: { tag: "Detail" } } },
        verify: (json) => {
          if (json.data.tag !== "Detail") throw new Error("Tag mismatch");
        },
      },
      {
        id: "TC-STO-037",
        description: "복선 수정",
        method: "PATCH",
        url: "/foreshadowing/:id",
        requestUrl: "/foreshadowing/f1",
        mockResponse: { body: { data: { importance: "High" } } },
        verify: (json) => {
          if (json.data.importance !== "High")
            throw new Error("Importance mismatch");
        },
      },
      {
        id: "TC-STO-038",
        description: "복선 삭제",
        method: "DELETE",
        url: "/foreshadowing/:id",
        requestUrl: "/foreshadowing/f1",
        mockResponse: { body: { success: true } },
      },
      {
        id: "TC-STO-039",
        description: "등장 위치 추가",
        method: "POST",
        url: "/foreshadowing/:id/appearances",
        requestUrl: "/foreshadowing/f1/appearances",
        mockResponse: { body: { data: { chapterId: "c1" } } },
        verify: (json) => {
          if (json.data.chapterId !== "c1")
            throw new Error("ChapterId mismatch");
        },
      },
      {
        id: "TC-STO-040",
        description: "회수 처리",
        method: "PATCH",
        url: "/foreshadowing/:id/recover",
        requestUrl: "/foreshadowing/f1/recover",
        mockResponse: { body: { data: { status: "recovered" } } },
        verify: (json) => {
          if (json.data.status !== "recovered")
            throw new Error("Status mismatch");
        },
      },
      {
        id: "TC-STO-041",
        description: "미회수 복선 조회",
        method: "GET",
        url: "/projects/:pid/foreshadowing/unresolved",
        requestUrl: "/projects/p1/foreshadowing/unresolved",
        mockResponse: { body: { data: [{ status: "pending" }] } },
        verify: (json) => {
          if (json.data[0].status !== "pending")
            throw new Error("Status mismatch");
        },
      },
    ],
  },
  {
    title: "[World] TC-STO-042 ~ 050",
    tests: [
      {
        id: "TC-STO-042",
        description: "장소 목록 조회",
        method: "GET",
        url: "/projects/:pid/places",
        requestUrl: "/projects/p1/places",
        mockResponse: { body: { data: [{ id: "pl1" }] } },
        verify: (j) => expect(j.data.length).toBe(1),
      },
      {
        id: "TC-STO-043",
        description: "장소 생성",
        method: "POST",
        url: "/projects/:pid/places",
        requestUrl: "/projects/p1/places",
        mockResponse: { status: 201, body: { data: { id: "pl-new" } } },
        expectedStatus: 201,
      },
      {
        id: "TC-STO-044",
        description: "장소 수정",
        method: "PATCH",
        url: "/places/:id",
        requestUrl: "/places/pl1",
        mockResponse: { body: { data: { name: "Updated Place" } } },
        verify: (j) => expect(j.data.name).toBe("Updated Place"),
      },
      {
        id: "TC-STO-045",
        description: "장소 삭제",
        method: "DELETE",
        url: "/places/:id",
        requestUrl: "/places/pl1",
        mockResponse: { body: { success: true } },
      },

      {
        id: "TC-STO-046",
        description: "아이템 목록 조회",
        method: "GET",
        url: "/projects/:pid/items",
        requestUrl: "/projects/p1/items",
        mockResponse: { body: { data: [{ id: "item1" }] } },
        verify: (j) => expect(j.data.length).toBe(1),
      },
      {
        id: "TC-STO-047",
        description: "아이템 생성",
        method: "POST",
        url: "/projects/:pid/items",
        requestUrl: "/projects/p1/items",
        mockResponse: { status: 201, body: { data: { id: "item-new" } } },
        expectedStatus: 201,
      },
      {
        id: "TC-STO-048",
        description: "아이템 수정",
        method: "PATCH",
        url: "/items/:id",
        requestUrl: "/items/item1",
        mockResponse: { body: { data: { name: "Updated Item" } } },
        verify: (j) => expect(j.data.name).toBe("Updated Item"),
      },
      {
        id: "TC-STO-049",
        description: "아이템 삭제",
        method: "DELETE",
        url: "/items/:id",
        requestUrl: "/items/item1",
        mockResponse: { body: { success: true } },
      },
      {
        id: "TC-STO-050",
        description: "아이템 소유권 이전",
        method: "PATCH",
        url: "/items/:id/transfer",
        requestUrl: "/items/item1/transfer",
        mockResponse: { body: { data: { ownerId: "c2" } } },
        verify: (j) => expect(j.data.ownerId).toBe("c2"),
      },
    ],
  },
  {
    title: "[Export] TC-STO-051 ~ 053",
    tests: [
      {
        id: "TC-STO-051",
        description: "내보내기 요청",
        method: "POST",
        url: "/projects/:id/export",
        requestUrl: "/projects/p1/export",
        mockResponse: { status: 202, body: { data: { jobId: "job-1" } } },
        expectedStatus: 202,
      },
      {
        id: "TC-STO-052",
        description: "내보내기 상태 조회",
        method: "GET",
        url: "/exports/:jobId",
        requestUrl: "/exports/job-1",
        mockResponse: { body: { data: { status: "completed" } } },
        verify: (j) => expect(j.data.status).toBe("completed"),
      },
      {
        id: "TC-STO-053",
        description: "가져오기",
        method: "POST",
        url: "/projects/:id/import",
        requestUrl: "/projects/p1/import",
        mockResponse: { body: { data: { importedItems: 5 } } },
        verify: (j) => expect(j.data.importedItems).toBe(5),
      },
    ],
  },
  {
    title: "[Share] TC-STO-054 ~ 057",
    tests: [
      {
        id: "TC-STO-054",
        description: "공유 링크 생성",
        method: "POST",
        url: "/projects/:id/share",
        requestUrl: "/projects/p1/share",
        mockResponse: { status: 201, body: { data: { shareLink: "link" } } },
        expectedStatus: 201,
      },
      {
        id: "TC-STO-055",
        description: "공유 설정 조회",
        method: "GET",
        url: "/projects/:id/share",
        requestUrl: "/projects/p1/share",
        mockResponse: { body: { data: { isShared: true } } },
        verify: (j) => expect(j.data.isShared).toBe(true),
      },
      {
        id: "TC-STO-056",
        description: "공유 비활성화",
        method: "DELETE",
        url: "/projects/:id/share",
        requestUrl: "/projects/p1/share",
        mockResponse: { body: { success: true } },
      },
      {
        id: "TC-STO-057",
        description: "공개 작품 조회",
        method: "GET",
        url: "/share/:shareId",
        requestUrl: "/share/s1",
        mockResponse: { body: { data: { title: "Shared Project" } } },
        verify: (j) => expect(j.data.title).toBe("Shared Project"),
      },
    ],
  },
];

describe("Stolink API Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  testGroups.forEach((group) => {
    describe(group.title, () => {
      group.tests.forEach((tc) => {
        it(`${tc.id}: ${tc.description}`, async () => {
          await runApiTest(tc);
        });
      });
    });
  });
});
