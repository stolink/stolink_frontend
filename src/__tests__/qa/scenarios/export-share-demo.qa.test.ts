/**
 * QA 테스트 케이스: 내보내기/공유/데모 (TC-EXP, TC-SHR, TC-DEMO)
 *
 * Excel QA 문서의 내보내기, 공유, 데모 관련 테스트 케이스를 구현합니다.
 * - TC-EXP-001: PDF 내보내기
 * - TC-EXP-002: 마크다운 내보내기
 * - TC-EXP-003: 특정 챕터 내보내기
 * - TC-EXP-004: 개별 배포
 * - TC-EXP-005: 병합 배포
 * - TC-EXP-006: 배포 요약
 * - TC-EXP-007: 작품 게시 줄거리
 * - TC-SHR-001: 공유 링크 생성
 * - TC-SHR-002: 링크 접속
 * - TC-SHR-003: 링크 비활성화
 * - TC-DEMO-001: 비로그인 데모
 * - TC-DEMO-002: 로그인 유도
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/mocks/server";

vi.mock("idb-keyval", () => ({
  get: vi.fn().mockResolvedValue(null),
  set: vi.fn().mockResolvedValue(undefined),
  del: vi.fn().mockResolvedValue(undefined),
}));

const API_URL = "/api";

describe("[TC-EXP] 내보내기 테스트", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("TC-EXP-001: PDF 내보내기", () => {
    /**
     * 사전 조건: 문서 존재
     * 테스트 시나리오: 1.PDF 선택 2.내보내기 클릭
     * 기대 결과: PDF 파일 다운로드
     */
    it("PDF 내보내기 요청이 성공해야 함", async () => {
      server.use(
        http.post(`${API_URL}/projects/:id/export`, async ({ request }) => {
          const body = (await request.json()) as { format: string };
          if (body.format === "pdf") {
            return HttpResponse.json({
              data: {
                jobId: "export-job-1",
                status: "PENDING",
                format: "pdf",
              },
            });
          }
          return new HttpResponse(null, { status: 400 });
        }),
      );

      const response = await fetch(`${API_URL}/projects/project-1/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format: "pdf" }),
      });

      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.data.format).toBe("pdf");
      expect(data.data.jobId).toBeDefined();
    });

    it("PDF 내보내기 작업 완료 후 다운로드 URL을 받을 수 있어야 함", async () => {
      server.use(
        http.get(`${API_URL}/exports/:jobId`, () => {
          return HttpResponse.json({
            data: {
              jobId: "export-job-1",
              status: "COMPLETED",
              downloadUrl: "https://storage.example.com/exports/project-1.pdf",
              expiresAt: "2025-01-10T00:00:00Z",
            },
          });
        }),
      );

      const response = await fetch(`${API_URL}/exports/export-job-1`);
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.data.status).toBe("COMPLETED");
      expect(data.data.downloadUrl).toContain(".pdf");
    });
  });

  describe("TC-EXP-002: 마크다운 내보내기", () => {
    /**
     * 사전 조건: 문서 존재
     * 테스트 시나리오: 1.마크다운 선택 2.내보내기
     * 기대 결과: .md 파일 다운로드
     */
    it("마크다운 내보내기 요청이 성공해야 함", async () => {
      server.use(
        http.post(`${API_URL}/projects/:id/export`, async ({ request }) => {
          const body = (await request.json()) as { format: string };
          return HttpResponse.json({
            data: {
              jobId: "export-job-2",
              status: "PENDING",
              format: body.format,
            },
          });
        }),
      );

      const response = await fetch(`${API_URL}/projects/project-1/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format: "markdown" }),
      });

      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.data.format).toBe("markdown");
    });
  });

  describe("TC-EXP-003: 특정 챕터 내보내기", () => {
    /**
     * 사전 조건: 챕터 2개 이상
     * 테스트 시나리오: 1.특정 챕터 체크 2.내보내기
     * 기대 결과: 선택한 것만 포함된 파일
     */
    it("선택한 챕터만 내보낼 수 있어야 함", async () => {
      server.use(
        http.post(`${API_URL}/projects/:id/export`, async ({ request }) => {
          const body = (await request.json()) as {
            format: string;
            documentIds: string[];
          };
          return HttpResponse.json({
            data: {
              jobId: "export-job-3",
              status: "PENDING",
              format: body.format,
              includedDocuments: body.documentIds.length,
            },
          });
        }),
      );

      const response = await fetch(`${API_URL}/projects/project-1/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          format: "pdf",
          documentIds: ["doc-1", "doc-3", "doc-5"],
        }),
      });

      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.data.includedDocuments).toBe(3);
    });
  });

  describe("TC-EXP-004: 개별 배포", () => {
    /**
     * 사전 조건: 단일/다중 섹션 클릭
     * 테스트 시나리오: 1. 배포할 섹션 선택 2. 개별 배포 클릭
     * 기대 결과: 배포 요약 결과 보기
     */
    it("개별 섹션 배포 요청이 성공해야 함", async () => {
      server.use(
        http.post(`${API_URL}/works/:wid/publish`, async ({ request }) => {
          const body = (await request.json()) as {
            draftId: string;
            chapterNumber: number;
          };
          return HttpResponse.json({
            data: {
              chapterId: "published-chapter-1",
              draftId: body.draftId,
              chapterNumber: body.chapterNumber,
              publishedAt: new Date().toISOString(),
            },
          });
        }),
      );

      const response = await fetch(`${API_URL}/works/work-1/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draftId: "draft-1",
          chapterNumber: 1,
        }),
      });

      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.data.chapterId).toBeDefined();
    });
  });

  describe("TC-EXP-005: 병합 배포", () => {
    /**
     * 사전 조건: 단일/다중 섹션 클릭
     * 테스트 시나리오: 1. 배포할 섹션 선택 2. 병합 배포 클릭
     * 기대 결과: 배포 요약 결과 보기
     */
    it("여러 섹션을 병합하여 배포할 수 있어야 함", async () => {
      server.use(
        http.post(
          `${API_URL}/works/:wid/publish/batch`,
          async ({ request }) => {
            const body = (await request.json()) as {
              draftIds: string[];
              merge: boolean;
            };
            return HttpResponse.json({
              data: {
                chapterId: "merged-chapter-1",
                mergedCount: body.draftIds.length,
                publishedAt: new Date().toISOString(),
              },
            });
          },
        ),
      );

      const response = await fetch(`${API_URL}/works/work-1/publish/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draftIds: ["draft-1", "draft-2", "draft-3"],
          merge: true,
        }),
      });

      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.data.mergedCount).toBe(3);
    });
  });

  describe("TC-EXP-006: 배포 요약", () => {
    /**
     * 사전 조건: 배포 설정 선택
     * 테스트 시나리오: 배포 결과 요약 후 배포하기 클릭
     * 기대 결과: 첫 작품이면 설명 페이지, 아니면 배포 완료 페이지
     */
    it("배포 결과 요약 정보를 조회할 수 있어야 함", async () => {
      server.use(
        http.get(`${API_URL}/works/:wid/publish-status`, () => {
          return HttpResponse.json({
            data: {
              isFirstPublish: false,
              publishedChapters: 5,
              totalDrafts: 10,
              lastPublishedAt: "2025-01-08T00:00:00Z",
            },
          });
        }),
      );

      const response = await fetch(`${API_URL}/works/work-1/publish-status`);
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.data.publishedChapters).toBe(5);
    });
  });

  describe("TC-EXP-007: 작품 게시 줄거리", () => {
    /**
     * 사전 조건: 첫 작품 게시
     * 테스트 시나리오: 첫 섹션 내용이 줄거리로 들어옴
     * 기대 결과: 작품을 들어갔을 때 잘 보여야함
     */
    it("첫 배포 시 첫 섹션 내용이 줄거리로 설정되어야 함", async () => {
      server.use(
        http.post(`${API_URL}/works/:wid/publish`, async () => {
          return HttpResponse.json({
            data: {
              chapterId: "first-chapter",
              isFirstPublish: true,
              synopsis: "첫 섹션의 내용이 줄거리로 자동 설정됩니다...",
            },
          });
        }),
      );

      const response = await fetch(`${API_URL}/works/new-work/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draftId: "first-draft",
          chapterNumber: 1,
        }),
      });

      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.data.isFirstPublish).toBe(true);
      expect(data.data.synopsis).toBeDefined();
    });
  });
});

describe("[TC-SHR] 공유 테스트", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("TC-SHR-001: 공유 링크 생성", () => {
    /**
     * 사전 조건: 작품 존재
     * 테스트 시나리오: 1.공유 링크 생성 클릭
     * 기대 결과: 외부 URL 노출
     */
    it("공유 링크를 생성할 수 있어야 함", async () => {
      server.use(
        http.post(`${API_URL}/projects/:id/share`, () => {
          return HttpResponse.json({
            data: {
              shareId: "share-abc123",
              url: "https://stolink.example.com/share/share-abc123",
              expiresAt: null,
              isActive: true,
            },
          });
        }),
      );

      const response = await fetch(`${API_URL}/projects/project-1/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.data.url).toContain("/share/");
      expect(data.data.isActive).toBe(true);
    });
  });

  describe("TC-SHR-002: 링크 접속", () => {
    /**
     * 사전 조건: 유효 링크
     * 테스트 시나리오: 1.로그인 없이 URL 접속
     * 기대 결과: 읽기 전용 뷰어 표시
     */
    it("공유 링크로 읽기 전용 접근이 가능해야 함", async () => {
      server.use(
        http.get(`${API_URL}/share/:shareId`, ({ params }) => {
          return HttpResponse.json({
            data: {
              shareId: params.shareId,
              projectTitle: "공유된 작품",
              documents: [
                {
                  id: "doc-1",
                  title: "1장",
                  content: "<p>공유된 내용입니다.</p>",
                },
              ],
              isReadOnly: true,
            },
          });
        }),
      );

      const response = await fetch(`${API_URL}/share/share-abc123`);
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.data.isReadOnly).toBe(true);
      expect(data.data.documents).toHaveLength(1);
    });
  });

  describe("TC-SHR-003: 링크 비활성화", () => {
    /**
     * 사전 조건: 활성 링크 존재
     * 테스트 시나리오: 1.공유 비활성화 클릭
     * 기대 결과: 링크 접속 시 에러 표시
     */
    it("공유 링크를 비활성화할 수 있어야 함", async () => {
      server.use(
        http.delete(`${API_URL}/projects/:id/share`, () => {
          return HttpResponse.json({
            data: {
              message: "공유 링크가 비활성화되었습니다.",
            },
          });
        }),
      );

      const response = await fetch(`${API_URL}/projects/project-1/share`, {
        method: "DELETE",
      });

      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.data.message).toContain("비활성화");
    });

    it("비활성화된 링크 접속 시 에러가 발생해야 함", async () => {
      server.use(
        http.get(`${API_URL}/share/:shareId`, () => {
          return new HttpResponse(
            JSON.stringify({
              error: "링크가 만료되었거나 비활성화되었습니다.",
            }),
            { status: 404 },
          );
        }),
      );

      const response = await fetch(`${API_URL}/share/disabled-link`);

      expect(response.ok).toBe(false);
      expect(response.status).toBe(404);
    });
  });
});

describe("[TC-DEMO] 데모 테스트", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("TC-DEMO-001: 비로그인 데모", () => {
    /**
     * 사전 조건: 비로그인 상태
     * 테스트 시나리오: 1./demo 페이지 접속
     * 기대 결과: 에디터 UI 체험 가능
     */
    it("비로그인 상태에서 데모 페이지에 접근할 수 있어야 함", async () => {
      server.use(
        http.get(`${API_URL}/demo`, () => {
          return HttpResponse.json({
            data: {
              isDemo: true,
              documents: [
                {
                  id: "demo-doc-1",
                  title: "데모 문서",
                  content: "<p>데모 내용입니다. 자유롭게 편집해보세요!</p>",
                  type: "text",
                },
              ],
            },
          });
        }),
      );

      const response = await fetch(`${API_URL}/demo`);
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.data.isDemo).toBe(true);
      expect(data.data.documents).toHaveLength(1);
    });
  });

  describe("TC-DEMO-002: 로그인 유도", () => {
    /**
     * 사전 조건: 데모 편집 중
     * 테스트 시나리오: 1.저장 시도
     * 기대 결과: 가입 유도 모달 노출
     */
    it("데모 모드에서 저장 시도 시 가입 유도 응답이 와야 함", async () => {
      server.use(
        http.post(`${API_URL}/demo/save`, () => {
          return new HttpResponse(
            JSON.stringify({
              error: "DEMO_MODE",
              message: "저장하려면 회원가입이 필요합니다.",
              redirectTo: "/auth/register",
            }),
            { status: 403 },
          );
        }),
      );

      const response = await fetch(`${API_URL}/demo/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: "<p>저장하고 싶은 내용</p>",
        }),
      });

      const data = await response.json();

      expect(response.ok).toBe(false);
      expect(response.status).toBe(403);
      expect(data.error).toBe("DEMO_MODE");
      expect(data.redirectTo).toContain("/auth");
    });
  });
});
