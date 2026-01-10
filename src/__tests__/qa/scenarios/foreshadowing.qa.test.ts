/**
 * QA 테스트 케이스: 복선 (TC-FS-001 ~ TC-FS-005)
 *
 * Excel QA 문서의 복선 관련 테스트 케이스를 구현합니다.
 * - TC-FS-001: 태그 삽입
 * - TC-FS-002: 목록 조회
 * - TC-FS-003: 위치 이동
 * - TC-FS-004: 수동 회수
 * - TC-FS-005: 자동완성
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@/test/utils";
import {
  useForeshadowing,
  useCreateForeshadowing,
  useRecoverForeshadowing,
  useAddAppearance,
} from "@/hooks/useForeshadowing";
import {
  foreshadowingService,
  type Foreshadowing,
} from "@/services/foreshadowingService";

vi.mock("idb-keyval", () => ({
  get: vi.fn().mockResolvedValue(null),
  set: vi.fn().mockResolvedValue(undefined),
  del: vi.fn().mockResolvedValue(undefined),
}));

describe("[TC-FS] 복선 테스트", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("TC-FS-001: 태그 삽입", () => {
    /**
     * 사전 조건: 편집 상태
     * 테스트 시나리오: 1. #복선:이름 입력
     * 기대 결과: 하이라이트 태그 생성
     */
    it("새 복선 태그를 생성할 수 있어야 함", async () => {
      vi.spyOn(foreshadowingService, "create").mockResolvedValueOnce({
        data: {
          id: "new-foreshadow-id",
          projectId: "project-1",
          tag: "보물의_비밀",
          description: "숨겨진 보물에 대한 복선",
          status: "pending",
          importance: "major",
          appearances: [],
          createdAt: "2025-01-09T00:00:00Z",
          updatedAt: "2025-01-09T00:00:00Z",
        },
      });

      const { result } = renderHook(() => useCreateForeshadowing());

      await result.current.mutateAsync({
        projectId: "project-1",
        payload: {
          tag: "보물의_비밀",
          description: "숨겨진 보물에 대한 복선",
        },
      });

      expect(foreshadowingService.create).toHaveBeenCalledWith("project-1", {
        tag: "보물의_비밀",
        description: "숨겨진 보물에 대한 복선",
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it("복선 등장 위치를 추가할 수 있어야 함", async () => {
      vi.spyOn(foreshadowingService, "addAppearance").mockResolvedValueOnce({
        data: {
          id: "foreshadow-1",
          projectId: "project-1",
          tag: "보물의_비밀",
          status: "pending",
          createdAt: "2025-01-01T00:00:00Z",
          updatedAt: "2025-01-01T00:00:00Z",
          appearances: [
            {
              chapterId: "chapter-1",
              chapterTitle: "제1장 시작",
              line: 42,
              context: "보물 지도를 발견했다.",
              isRecovery: false,
            },
          ],
        },
      });

      const { result } = renderHook(() => useAddAppearance());

      await result.current.mutateAsync({
        id: "foreshadow-1",
        appearance: {
          chapterId: "chapter-1",
          chapterTitle: "제1장 시작",
          line: 42,
          context: "보물 지도를 발견했다.",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
      });

      expect(foreshadowingService.addAppearance).toHaveBeenCalled();

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });

  describe("TC-FS-002: 목록 조회", () => {
    /**
     * 사전 조건: 복선 존재
     * 테스트 시나리오: 1.우측 사이드바 복선 탭 클릭
     * 기대 결과: 전체 복선 리스트 표시
     */
    it("프로젝트의 모든 복선을 조회할 수 있어야 함", async () => {
      const mockForeshadowing: Foreshadowing[] = [
        {
          id: "foreshadow-1",
          projectId: "project-1",
          tag: "보물의_비밀",
          description: "숨겨진 보물",
          status: "pending",
          importance: "major",
          appearances: [
            {
              chapterId: "chapter-1",
              chapterTitle: "제1장",
              line: 10,
              context: "보물 지도",
              isRecovery: false,
            },
          ],
          createdAt: "2025-01-01T00:00:00Z",
          updatedAt: "2025-01-01T00:00:00Z",
        },
        {
          id: "foreshadow-2",
          projectId: "project-1",
          tag: "검은_그림자",
          description: "정체불명의 그림자",
          status: "pending",
          importance: "minor",
          appearances: [],
          createdAt: "2025-01-02T00:00:00Z",
          updatedAt: "2025-01-02T00:00:00Z",
        },
      ];

      vi.spyOn(foreshadowingService, "getAll").mockResolvedValueOnce({
        data: mockForeshadowing,
      });

      const { result } = renderHook(() => useForeshadowing("project-1"));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toHaveLength(2);
      expect(result.current.data?.[0].tag).toBe("보물의_비밀");
      expect(result.current.data?.[1].tag).toBe("검은_그림자");
    });

    it("빈 프로젝트에서 빈 배열을 반환해야 함", async () => {
      vi.spyOn(foreshadowingService, "getAll").mockResolvedValueOnce({
        data: [],
      });

      const { result } = renderHook(() => useForeshadowing("empty-project"));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual([]);
    });

    it("상태 필터로 복선을 필터링할 수 있어야 함", async () => {
      vi.spyOn(foreshadowingService, "getAll").mockResolvedValueOnce({
        data: [
          {
            id: "foreshadow-1",
            projectId: "project-1",
            tag: "활성_복선",
            description: "",
            status: "pending",
            importance: "major",
            appearances: [],
            createdAt: "2025-01-01T00:00:00Z",
            updatedAt: "2025-01-01T00:00:00Z",
          },
        ],
      });

      const { result } = renderHook(() =>
        useForeshadowing("project-1", { status: "pending" }),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(foreshadowingService.getAll).toHaveBeenCalledWith("project-1", {
        status: "pending",
      });
    });
  });

  describe("TC-FS-003: 위치 이동", () => {
    /**
     * 사전 조건: 복선 존재
     * 테스트 시나리오: 1.복선 목록에서 항목 클릭
     * 기대 결과: 해당 문서/위치로 스크롤
     *
     * Note: 이 테스트는 복선의 appearances 데이터를 확인합니다.
     * 실제 스크롤 동작은 UI 컴포넌트 테스트에서 수행됩니다.
     */
    it("복선에 등장 위치 정보가 포함되어야 함", async () => {
      const mockForeshadowing: Foreshadowing[] = [
        {
          id: "foreshadow-1",
          projectId: "project-1",
          tag: "보물의_비밀",
          description: "",
          status: "pending",
          importance: "major",
          appearances: [
            {
              chapterId: "chapter-1",
              chapterTitle: "제1장 시작",
              line: 42,
              context: "보물 지도를 발견했다.",
              isRecovery: false,
            },
            {
              chapterId: "chapter-3",
              chapterTitle: "제3장 탐험",
              line: 88,
              context: "지도의 표시를 따라갔다.",
              isRecovery: false,
            },
          ],
          createdAt: "2025-01-01T00:00:00Z",
          updatedAt: "2025-01-01T00:00:00Z",
        },
      ];

      vi.spyOn(foreshadowingService, "getAll").mockResolvedValueOnce({
        data: mockForeshadowing,
      });

      const { result } = renderHook(() => useForeshadowing("project-1"));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const foreshadow = result.current.data?.[0];
      expect(foreshadow?.appearances).toHaveLength(2);
      expect(foreshadow?.appearances[0].chapterId).toBe("chapter-1");
      expect(foreshadow?.appearances[0].line).toBe(42);
    });
  });

  describe("TC-FS-004: 수동 회수", () => {
    /**
     * 사전 조건: 복선 존재
     * 테스트 시나리오: 1.회수 처리 버튼 클릭
     * 기대 결과: 상태 '회수됨' 변경
     */
    it("복선을 회수 처리할 수 있어야 함", async () => {
      vi.spyOn(foreshadowingService, "recover").mockResolvedValueOnce({
        data: {
          id: "foreshadow-1",
          projectId: "project-1",
          tag: "보물의_비밀",
          description: "",
          status: "recovered",
          importance: "major",
          appearances: [],
          createdAt: "2025-01-01T00:00:00Z",
          updatedAt: "2025-01-01T00:00:00Z",
        },
      });

      const { result } = renderHook(() => useRecoverForeshadowing());

      await result.current.mutateAsync({
        id: "foreshadow-1",
        recoveryInfo: {
          chapterId: "chapter-10",
          chapterTitle: "제10장 결말",
          line: 200,
          context: "드디어 보물을 찾았다!",
        },
      });

      expect(foreshadowingService.recover).toHaveBeenCalledWith(
        "foreshadow-1",
        {
          chapterId: "chapter-10",
          chapterTitle: "제10장 결말",
          line: 200,
          context: "드디어 보물을 찾았다!",
        },
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });

  describe("TC-FS-005: 자동완성", () => {
    /**
     * 사전 조건: 기존 복선 존재
     * 테스트 시나리오: 1. #복선: 입력 시도
     * 기대 결과: 기존 태그 목록 추천
     *
     * Note: 자동완성은 기존 복선 목록을 기반으로 합니다.
     * 목록 조회 API가 올바르게 동작하면 자동완성에 사용할 수 있습니다.
     */
    it("기존 복선 태그 목록을 조회하여 자동완성에 사용할 수 있어야 함", async () => {
      const mockForeshadowing: Foreshadowing[] = [
        {
          id: "foreshadow-1",
          projectId: "project-1",
          tag: "보물의_비밀",
          description: "",
          status: "pending",
          importance: "major",
          appearances: [],
          createdAt: "2025-01-01T00:00:00Z",
          updatedAt: "2025-01-01T00:00:00Z",
        },
        {
          id: "foreshadow-2",
          projectId: "project-1",
          tag: "보물_지도",
          description: "",
          status: "pending",
          importance: "minor",
          appearances: [],
          createdAt: "2025-01-02T00:00:00Z",
          updatedAt: "2025-01-02T00:00:00Z",
        },
        {
          id: "foreshadow-3",
          projectId: "project-1",
          tag: "검은_그림자",
          description: "",
          status: "pending",
          importance: "minor",
          appearances: [],
          createdAt: "2025-01-03T00:00:00Z",
          updatedAt: "2025-01-03T00:00:00Z",
        },
      ];

      vi.spyOn(foreshadowingService, "getAll").mockResolvedValueOnce({
        data: mockForeshadowing,
      });

      const { result } = renderHook(() => useForeshadowing("project-1"));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // 자동완성을 위해 태그 목록 추출
      const tags = result.current.data?.map((f) => f.tag);
      expect(tags).toContain("보물의_비밀");
      expect(tags).toContain("보물_지도");
      expect(tags).toContain("검은_그림자");

      // "보물"로 시작하는 태그 필터링 (클라이언트 측 자동완성 로직)
      const filteredTags = tags?.filter((tag) => tag.startsWith("보물"));
      expect(filteredTags).toHaveLength(2);
    });
  });
});
