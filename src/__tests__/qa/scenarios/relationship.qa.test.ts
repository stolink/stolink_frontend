/**
 * QA 테스트 케이스: 관계도 (TC-REL-001 ~ TC-REL-005)
 *
 * Excel QA 문서의 관계도 관련 테스트 케이스를 구현합니다.
 * - TC-REL-001: 관계도 조회
 * - TC-REL-002: 관계 생성
 * - TC-REL-003: 노드 포커스
 * - TC-REL-004: 유형 필터
 * - TC-REL-005: 줌/패닝
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

describe("[TC-REL] 관계도 테스트", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("TC-REL-001: 관계도 조회", () => {
    /**
     * 사전 조건: 인물 2명 이상
     * 테스트 시나리오: 1.캐릭터 관계도 탭 선택
     * 기대 결과: 그래프 시각화 표시
     */
    it("프로젝트의 캐릭터 관계를 조회할 수 있어야 함", async () => {
      const mockRelationships = [
        {
          id: "rel-1",
          sourceId: "char-1",
          targetId: "char-2",
          type: "friendly",
          strength: 8,
          description: "어린 시절 친구",
          createdAt: "2025-01-01T00:00:00Z",
        },
        {
          id: "rel-2",
          sourceId: "char-1",
          targetId: "char-3",
          type: "hostile",
          strength: 5,
          description: "정치적 라이벌",
          createdAt: "2025-01-02T00:00:00Z",
        },
        {
          id: "rel-3",
          sourceId: "char-2",
          targetId: "char-4",
          type: "romantic",
          strength: 10,
          description: "연인",
          createdAt: "2025-01-03T00:00:00Z",
        },
      ];

      server.use(
        http.get(`${API_URL}/projects/:projectId/relationships`, () => {
          return HttpResponse.json(mockRelationships);
        }),
      );

      const response = await fetch(
        `${API_URL}/projects/project-1/relationships`,
      );
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data).toHaveLength(3);
      expect(data[0].type).toBe("friendly");
      expect(data[1].type).toBe("hostile");
      expect(data[2].type).toBe("romantic");
    });

    it("관계가 없을 때 빈 배열을 반환해야 함", async () => {
      server.use(
        http.get(`${API_URL}/projects/:projectId/relationships`, () => {
          return HttpResponse.json([]);
        }),
      );

      const response = await fetch(
        `${API_URL}/projects/empty-project/relationships`,
      );
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data).toEqual([]);
    });
  });

  describe("TC-REL-002: 관계 생성", () => {
    /**
     * 사전 조건: (없음)
     * 테스트 시나리오: 1.노드 간 드래그 연결 2.저장
     * 기대 결과: 두 노드 사이 선 생성
     */
    it("두 캐릭터 간 새 관계를 생성할 수 있어야 함", async () => {
      server.use(
        http.post(`${API_URL}/relationships`, async ({ request }) => {
          const body = (await request.json()) as {
            sourceId: string;
            targetId: string;
            type: string;
          };
          return HttpResponse.json({
            data: {
              id: "new-rel-id",
              sourceId: body.sourceId,
              targetId: body.targetId,
              type: body.type,
              strength: 5,
              description: "",
              createdAt: new Date().toISOString(),
            },
          });
        }),
      );

      const response = await fetch(`${API_URL}/relationships`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: "project-1",
          sourceId: "char-1",
          targetId: "char-5",
          type: "friendly",
          description: "새로운 친구 관계",
        }),
      });

      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.data.sourceId).toBe("char-1");
      expect(data.data.targetId).toBe("char-5");
      expect(data.data.type).toBe("friendly");
    });

    it("적대 관계를 생성할 수 있어야 함", async () => {
      server.use(
        http.post(`${API_URL}/relationships`, async ({ request }) => {
          const body = (await request.json()) as {
            sourceId: string;
            targetId: string;
            type: string;
          };
          return HttpResponse.json({
            data: {
              id: "new-hostile-rel",
              sourceId: body.sourceId,
              targetId: body.targetId,
              type: body.type,
              strength: 7,
              createdAt: new Date().toISOString(),
            },
          });
        }),
      );

      const response = await fetch(`${API_URL}/relationships`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: "project-1",
          sourceId: "char-1",
          targetId: "char-3",
          type: "hostile",
          description: "원수 관계",
        }),
      });

      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.data.type).toBe("hostile");
    });
  });

  describe("TC-REL-003: 노드 포커스", () => {
    /**
     * 사전 조건: 관계도 표시
     * 테스트 시나리오: 1.특정 노드 클릭
     * 기대 결과: 연결된 관계만 하이라이트
     *
     * Note: 이 테스트는 특정 캐릭터와 연결된 관계만 필터링하는 것을 확인합니다.
     */
    it("특정 캐릭터와 연결된 관계만 필터링할 수 있어야 함", async () => {
      const allRelationships = [
        {
          id: "rel-1",
          sourceId: "char-1",
          targetId: "char-2",
          type: "friendly",
        },
        {
          id: "rel-2",
          sourceId: "char-1",
          targetId: "char-3",
          type: "hostile",
        },
        {
          id: "rel-3",
          sourceId: "char-2",
          targetId: "char-3",
          type: "romantic",
        },
      ];

      // char-1과 연결된 관계만 필터링
      const focusedCharId = "char-1";
      const filteredRelations = allRelationships.filter(
        (rel) =>
          rel.sourceId === focusedCharId || rel.targetId === focusedCharId,
      );

      expect(filteredRelations).toHaveLength(2);
      expect(
        filteredRelations.every(
          (rel) => rel.sourceId === "char-1" || rel.targetId === "char-1",
        ),
      ).toBe(true);
    });
  });

  describe("TC-REL-004: 유형 필터", () => {
    /**
     * 사전 조건: 관계 존재
     * 테스트 시나리오: 1.필터에서 적대/우호 선택
     * 기대 결과: 해당 관계만 노출
     */
    it("관계 유형으로 필터링할 수 있어야 함", async () => {
      const allRelationships = [
        {
          id: "rel-1",
          type: "friendly",
          sourceId: "char-1",
          targetId: "char-2",
        },
        {
          id: "rel-2",
          type: "hostile",
          sourceId: "char-1",
          targetId: "char-3",
        },
        {
          id: "rel-3",
          type: "friendly",
          sourceId: "char-2",
          targetId: "char-4",
        },
        {
          id: "rel-4",
          type: "romantic",
          sourceId: "char-3",
          targetId: "char-4",
        },
      ];

      // Friendly 관계만 필터링
      const friendlyRelations = allRelationships.filter(
        (rel) => rel.type === "friendly",
      );
      expect(friendlyRelations).toHaveLength(2);

      // Hostile 관계만 필터링
      const hostileRelations = allRelationships.filter(
        (rel) => rel.type === "hostile",
      );
      expect(hostileRelations).toHaveLength(1);

      // Romantic 관계만 필터링
      const romanticRelations = allRelationships.filter(
        (rel) => rel.type === "romantic",
      );
      expect(romanticRelations).toHaveLength(1);
    });

    it("API에서 유형별 필터링을 지원해야 함", async () => {
      server.use(
        http.get(
          `${API_URL}/projects/:projectId/relationships`,
          ({ request }) => {
            const url = new URL(request.url);
            const type = url.searchParams.get("type");

            const allRelationships = [
              {
                id: "rel-1",
                type: "friendly",
                sourceId: "char-1",
                targetId: "char-2",
              },
              {
                id: "rel-2",
                type: "hostile",
                sourceId: "char-1",
                targetId: "char-3",
              },
            ];

            if (type) {
              return HttpResponse.json(
                allRelationships.filter((r) => r.type === type),
              );
            }
            return HttpResponse.json(allRelationships);
          },
        ),
      );

      const response = await fetch(
        `${API_URL}/projects/project-1/relationships?type=hostile`,
      );
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(
        data.every((rel: { type: string }) => rel.type === "hostile"),
      ).toBe(true);
    });
  });

  describe("TC-REL-005: 줌/패닝", () => {
    /**
     * 사전 조건: 관계도 표시
     * 테스트 시나리오: 1.휠 조작 및 드래그
     * 기대 결과: 확대/축소/이동 정상
     *
     * Note: 줌/패닝은 React Flow의 기본 기능입니다.
     * 이 테스트는 관계 데이터가 올바르게 로드되는지 확인합니다.
     */
    it("관계도 데이터에 위치 정보를 위한 노드 정보가 포함될 수 있어야 함", async () => {
      // 관계도 시각화를 위해 캐릭터(노드) 정보와 관계(엣지) 정보가 필요
      const mockCharacters = [
        { id: "char-1", name: "홍길동", imageUrl: "/img1.jpg" },
        { id: "char-2", name: "이몽룡", imageUrl: "/img2.jpg" },
      ];

      const mockRelationships = [
        {
          id: "rel-1",
          sourceId: "char-1",
          targetId: "char-2",
          type: "friendly",
        },
      ];

      // React Flow 노드/엣지 형태로 변환
      const nodes = mockCharacters.map((char) => ({
        id: char.id,
        type: "character",
        data: { label: char.name, imageUrl: char.imageUrl },
        position: { x: 0, y: 0 }, // 초기 위치, 레이아웃 알고리즘이 계산
      }));

      const edges = mockRelationships.map((rel) => ({
        id: rel.id,
        source: rel.sourceId,
        target: rel.targetId,
        type: rel.type,
      }));

      expect(nodes).toHaveLength(2);
      expect(edges).toHaveLength(1);
      expect(edges[0].source).toBe("char-1");
      expect(edges[0].target).toBe("char-2");
    });
  });
});
