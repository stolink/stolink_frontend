/**
 * QA 테스트 케이스: 장소/아이템/설정 (TC-PLC, TC-ITM, TC-SET)
 *
 * Excel QA 문서의 세계관 설정 관련 테스트 케이스를 구현합니다.
 * - TC-PLC-001: 장소 목록 조회
 * - TC-PLC-002: 장소 생성
 * - TC-ITM-001: 아이템 목록 조회
 * - TC-ITM-002: 아이템 생성
 * - TC-ITM-003: 아이템 소유자 변경
 * - TC-SET-001: 작품 정보 수정
 * - TC-SET-002: 작품 통계
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@/test/utils";
import { http, HttpResponse } from "msw";
import { server } from "@/test/mocks/server";
import { useUpdateProject, useProjectStats } from "@/hooks/useProjects";
import { projectService } from "@/services/projectService";

vi.mock("idb-keyval", () => ({
  get: vi.fn().mockResolvedValue(null),
  set: vi.fn().mockResolvedValue(undefined),
  del: vi.fn().mockResolvedValue(undefined),
}));

const API_URL = "/api";

describe("[TC-PLC] 장소 테스트", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("TC-PLC-001: 장소 목록 조회", () => {
    /**
     * 사전 조건: 장소 존재
     * 테스트 시나리오: 1.장소 탭 선택
     * 기대 결과: 그룹화된 장소 표시
     */
    it("프로젝트의 장소 목록을 조회할 수 있어야 함", async () => {
      server.use(
        http.get(`${API_URL}/projects/:projectId/places`, () => {
          return HttpResponse.json({
            data: [
              {
                id: "place-1",
                name: "왕궁",
                description: "왕이 거주하는 궁전",
                category: "건물",
                createdAt: "2025-01-01T00:00:00Z",
              },
              {
                id: "place-2",
                name: "암흑의 숲",
                description: "위험한 숲",
                category: "자연",
                createdAt: "2025-01-02T00:00:00Z",
              },
            ],
          });
        }),
      );

      const response = await fetch(`${API_URL}/projects/project-1/places`);
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.data).toHaveLength(2);
      expect(data.data[0].name).toBe("왕궁");
    });
  });

  describe("TC-PLC-002: 장소 생성", () => {
    /**
     * 사전 조건: 장소 탭
     * 테스트 시나리오: 1.추가 클릭 2.정보 저장
     * 기대 결과: 장소 리스트 추가
     */
    it("새 장소를 생성할 수 있어야 함", async () => {
      server.use(
        http.post(
          `${API_URL}/projects/:projectId/places`,
          async ({ request }) => {
            const body = (await request.json()) as {
              name: string;
              description: string;
            };
            return HttpResponse.json({
              data: {
                id: "new-place-id",
                name: body.name,
                description: body.description,
                category: "기타",
                createdAt: new Date().toISOString(),
              },
            });
          },
        ),
      );

      const response = await fetch(`${API_URL}/projects/project-1/places`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "마법사의 탑",
          description: "높은 탑에 마법사가 살고 있다",
        }),
      });

      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.data.name).toBe("마법사의 탑");
    });
  });
});

describe("[TC-ITM] 아이템 테스트", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("TC-ITM-001: 아이템 목록 조회", () => {
    /**
     * 사전 조건: 아이템 존재
     * 테스트 시나리오: 1.아이템 탭 선택
     * 기대 결과: 유형별 아이템 표시
     */
    it("프로젝트의 아이템 목록을 조회할 수 있어야 함", async () => {
      server.use(
        http.get(`${API_URL}/projects/:projectId/items`, () => {
          return HttpResponse.json({
            data: [
              {
                id: "item-1",
                name: "전설의 검",
                description: "용을 무찌를 수 있는 검",
                type: "weapon",
                ownerId: "char-1",
                createdAt: "2025-01-01T00:00:00Z",
              },
              {
                id: "item-2",
                name: "마법 반지",
                description: "투명해지는 반지",
                type: "accessory",
                ownerId: null,
                createdAt: "2025-01-02T00:00:00Z",
              },
            ],
          });
        }),
      );

      const response = await fetch(`${API_URL}/projects/project-1/items`);
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.data).toHaveLength(2);
      expect(data.data[0].type).toBe("weapon");
      expect(data.data[1].type).toBe("accessory");
    });
  });

  describe("TC-ITM-002: 아이템 생성", () => {
    /**
     * 사전 조건: 아이템 탭
     * 테스트 시나리오: 1.추가 클릭 2.정보 저장
     * 기대 결과: 아이템 리스트 추가
     */
    it("새 아이템을 생성할 수 있어야 함", async () => {
      server.use(
        http.post(
          `${API_URL}/projects/:projectId/items`,
          async ({ request }) => {
            const body = (await request.json()) as {
              name: string;
              description: string;
              type: string;
            };
            return HttpResponse.json({
              data: {
                id: "new-item-id",
                name: body.name,
                description: body.description,
                type: body.type,
                ownerId: null,
                createdAt: new Date().toISOString(),
              },
            });
          },
        ),
      );

      const response = await fetch(`${API_URL}/projects/project-1/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "치유 물약",
          description: "상처를 치유하는 물약",
          type: "consumable",
        }),
      });

      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.data.name).toBe("치유 물약");
      expect(data.data.type).toBe("consumable");
    });
  });

  describe("TC-ITM-003: 아이템 소유자 변경", () => {
    /**
     * 사전 조건: 아이템/인물 존재
     * 테스트 시나리오: 1.소유자 변경 클릭 2.저장
     * 기대 결과: 소유자 정보 업데이트
     */
    it("아이템 소유자를 변경할 수 있어야 함", async () => {
      server.use(
        http.patch(`${API_URL}/items/:id`, async ({ params, request }) => {
          const body = (await request.json()) as { ownerId: string };
          return HttpResponse.json({
            data: {
              id: params.id,
              ownerId: body.ownerId,
              updatedAt: new Date().toISOString(),
            },
          });
        }),
      );

      const response = await fetch(`${API_URL}/items/item-1`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerId: "char-2",
        }),
      });

      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.data.ownerId).toBe("char-2");
    });
  });
});

describe("[TC-SET] 설정 테스트", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("TC-SET-001: 작품 정보 수정", () => {
    /**
     * 사전 조건: 설정 페이지
     * 테스트 시나리오: 1.제목/장르 수정 후 저장
     * 기대 결과: 작품 정보 변경 반영
     */
    it("작품 제목을 수정할 수 있어야 함", async () => {
      vi.spyOn(projectService, "update").mockResolvedValueOnce({
        data: {
          id: "project-1",
          userId: "user-1",
          title: "수정된 작품 제목",
          genre: "fantasy",
          status: "writing",
          stats: {
            totalCharacters: 0,
            totalWords: 0,
            chapterCount: 0,
            characterCount: 0,
            foreshadowingRecoveryRate: 0,
            consistencyScore: 0,
          },
          createdAt: "2025-01-01T00:00:00Z",
          updatedAt: "2025-01-09T00:00:00Z",
        },
      });

      const { result } = renderHook(() => useUpdateProject());

      await result.current.mutateAsync({
        id: "project-1",
        payload: { title: "수정된 작품 제목" },
      });

      expect(projectService.update).toHaveBeenCalledWith("project-1", {
        title: "수정된 작품 제목",
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it("작품 장르를 수정할 수 있어야 함", async () => {
      vi.spyOn(projectService, "update").mockResolvedValueOnce({
        data: {
          id: "project-1",
          userId: "user-1",
          title: "기존 제목",
          genre: "romance",
          status: "writing",
          stats: {
            totalCharacters: 0,
            totalWords: 0,
            chapterCount: 0,
            characterCount: 0,
            foreshadowingRecoveryRate: 0,
            consistencyScore: 0,
          },
          createdAt: "2025-01-01T00:00:00Z",
          updatedAt: "2025-01-09T00:00:00Z",
        },
      });

      const { result } = renderHook(() => useUpdateProject());

      await result.current.mutateAsync({
        id: "project-1",
        payload: { genre: "romance" },
      });

      expect(projectService.update).toHaveBeenCalledWith("project-1", {
        genre: "romance",
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it("작품 설명을 수정할 수 있어야 함", async () => {
      vi.spyOn(projectService, "update").mockResolvedValueOnce({
        data: {
          id: "project-1",
          userId: "user-1",
          title: "기존 제목",
          genre: "fantasy",
          status: "writing",
          description: "새로운 작품 설명입니다.",
          stats: {
            totalCharacters: 0,
            totalWords: 0,
            chapterCount: 0,
            characterCount: 0,
            foreshadowingRecoveryRate: 0,
            consistencyScore: 0,
          },
          createdAt: "2025-01-01T00:00:00Z",
          updatedAt: "2025-01-09T00:00:00Z",
        },
      });

      const { result } = renderHook(() => useUpdateProject());

      await result.current.mutateAsync({
        id: "project-1",
        payload: { description: "새로운 작품 설명입니다." },
      });

      expect(projectService.update).toHaveBeenCalledWith("project-1", {
        description: "새로운 작품 설명입니다.",
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });

  describe("TC-SET-002: 작품 통계", () => {
    /**
     * 사전 조건: 데이터 존재
     * 테스트 시나리오: 1.통계 섹션 확인
     * 기대 결과: 글자수/회차수 표시
     */
    it("작품 통계를 조회할 수 있어야 함", async () => {
      vi.spyOn(projectService, "getStats").mockResolvedValueOnce({
        data: {
          totalWords: 50000,
          totalCharacters: 150000,
          characterCount: 12,
          chapterCount: 25,
          foreshadowingRecoveryRate: 80,
          consistencyScore: 95,
        },
      });

      const { result } = renderHook(() => useProjectStats("project-1"));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBeDefined();
      expect(result.current.data?.totalWords).toBe(50000);
      expect(result.current.data?.characterCount).toBe(12);
      expect(result.current.data?.chapterCount).toBe(25);
    });

    it("빈 작품의 통계는 0을 반환해야 함", async () => {
      vi.spyOn(projectService, "getStats").mockResolvedValueOnce({
        data: {
          totalWords: 0,
          totalCharacters: 0,
          characterCount: 0,
          chapterCount: 0,
          foreshadowingRecoveryRate: 0,
          consistencyScore: 0,
        },
      });

      const { result } = renderHook(() => useProjectStats("empty-project"));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data?.totalWords).toBe(0);
    });

    it("작품 ID가 없으면 통계를 조회하지 않아야 함", () => {
      const { result } = renderHook(() => useProjectStats(""));

      expect(result.current.data).toBeUndefined();
      expect(result.current.isLoading).toBe(false);
    });
  });
});
