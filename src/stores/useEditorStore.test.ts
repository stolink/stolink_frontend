/**
 * useEditorStore 테스트
 *
 * 📚 학습 포인트:
 *
 * 1. get() 함수의 역할
 *    - 액션 내에서 현재 상태를 읽을 때 사용
 *    - set()은 상태 변경, get()은 상태 읽기
 *    - 예: const chapter = get().chapters.find(c => c.id === id)
 *
 * 2. 파생 상태 (Derived State)
 *    - buildChapterTree: 평면 배열 → 트리 구조 변환
 *    - 상태에서 계산된 값을 반환하는 함수
 *    - React의 useMemo와 비슷한 역할
 *
 * 3. 직렬화 호환성
 *    - Set<string> 대신 string[] 사용
 *    - localStorage에 저장하려면 JSON 직렬화 가능해야 함
 *    - Set, Map, Date 등은 JSON.stringify 시 손실!
 *
 * 4. 트리 알고리즘 (buildChapterTree)
 *    - Map으로 ID→노드 매핑 (O(1) 조회)
 *    - 단일 순회로 트리 구축 (O(n))
 *    - 재귀 정렬로 order 적용
 */
import { describe, it, expect, beforeEach } from "vitest";
import { useEditorStore } from "./useEditorStore";
import type { Chapter } from "@/types";

// 테스트용 Mock 챕터 데이터
const mockChapters: Chapter[] = [
  {
    id: "ch-1",
    projectId: "project-1",
    title: "1장: 시작",
    content: "첫 번째 챕터 내용",
    type: "chapter",
    order: 0,
    parentId: null,
    isPlot: false,
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
  },
  {
    id: "ch-2",
    projectId: "project-1",
    title: "2장: 전개",
    content: "두 번째 챕터 내용",
    type: "chapter",
    order: 1,
    parentId: null,
    isPlot: false,
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
  },
  {
    id: "ch-1-1",
    projectId: "project-1",
    title: "1-1: 첫 장면",
    content: "하위 씬 내용",
    type: "scene",
    order: 0,
    parentId: "ch-1", // 1장의 하위
    isPlot: false,
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
  },
];

describe("useEditorStore", () => {
  beforeEach(() => {
    useEditorStore.setState({
      viewMode: "editor",
      currentProjectId: null,
      currentChapterId: null,
      currentSceneId: null,
      chapters: [],
      content: "",
      isSaving: false,
      saveStatus: "saved",
      lastSavedAt: null,
      chapterTree: [],
      expandedNodes: [],
      splitView: {
        enabled: false,
        direction: "vertical",
        secondaryDocumentId: null,
      },
    });
  });

  // ═══════════════════════════════════════════
  // 기본 setter 테스트
  // ═══════════════════════════════════════════

  describe("setCurrentProject", () => {
    it("현재 프로젝트 ID를 설정한다", () => {
      useEditorStore.getState().setCurrentProject("project-123");

      expect(useEditorStore.getState().currentProjectId).toBe("project-123");
    });
  });

  describe("setCurrentChapter", () => {
    /**
     * 💡 get() 함수 사용 예시:
     *
     * setCurrentChapter: (chapterId) => {
     *   const chapter = get().chapters.find(c => c.id === chapterId);
     *   set({
     *     currentChapterId: chapterId,
     *     currentSceneId: null,
     *     content: chapter?.content || "",
     *   });
     * }
     *
     * get()으로 현재 chapters를 읽어서
     * 해당 챕터의 content를 가져옵니다.
     */
    it("챕터 ID를 설정하고 해당 챕터 내용을 로드한다", () => {
      // Arrange: 챕터 데이터 설정
      useEditorStore.setState({ chapters: mockChapters });

      // Act
      useEditorStore.getState().setCurrentChapter("ch-1");

      // Assert
      const state = useEditorStore.getState();
      expect(state.currentChapterId).toBe("ch-1");
      expect(state.content).toBe("첫 번째 챕터 내용");
    });

    it("챕터 변경 시 씬 선택을 초기화한다", () => {
      useEditorStore.setState({
        chapters: mockChapters,
        currentSceneId: "some-scene",
      });

      useEditorStore.getState().setCurrentChapter("ch-1");

      expect(useEditorStore.getState().currentSceneId).toBeNull();
    });

    it("존재하지 않는 챕터 ID를 설정하면 빈 콘텐츠가 된다", () => {
      useEditorStore.setState({ chapters: mockChapters });

      useEditorStore.getState().setCurrentChapter("non-existent");

      expect(useEditorStore.getState().content).toBe("");
    });
  });

  describe("setCurrentScene", () => {
    it("현재 씬 ID를 설정한다", () => {
      useEditorStore.getState().setCurrentScene("scene-1");

      expect(useEditorStore.getState().currentSceneId).toBe("scene-1");
    });
  });

  // ═══════════════════════════════════════════
  // 콘텐츠 및 저장 상태 테스트
  // ═══════════════════════════════════════════

  describe("setContent", () => {
    /**
     * 💡 자동 상태 변경:
     *
     * setContent: (content) => set({ content, saveStatus: "unsaved" })
     *
     * 콘텐츠가 변경되면 자동으로 saveStatus가 "unsaved"가 됩니다.
     * 사용자에게 "저장되지 않음" 표시를 보여주기 위해서입니다.
     */
    it("콘텐츠를 설정하고 저장 상태를 unsaved로 변경한다", () => {
      useEditorStore.setState({ saveStatus: "saved" });

      useEditorStore.getState().setContent("새 콘텐츠");

      const state = useEditorStore.getState();
      expect(state.content).toBe("새 콘텐츠");
      expect(state.saveStatus).toBe("unsaved");
    });
  });

  describe("setSaveStatus", () => {
    /**
     * 💡 조건부 상태 업데이트:
     *
     * setSaveStatus: (status) => set({
     *   saveStatus: status,
     *   lastSavedAt: status === "saved"
     *     ? new Date().toISOString()
     *     : get().lastSavedAt,
     * })
     *
     * "saved" 상태가 되면 lastSavedAt 타임스탬프를 업데이트합니다.
     * 다른 상태에서는 기존 타임스탬프를 유지합니다.
     */
    it("saved 상태로 변경하면 lastSavedAt이 업데이트된다", () => {
      expect(useEditorStore.getState().lastSavedAt).toBeNull();

      useEditorStore.getState().setSaveStatus("saved");

      const state = useEditorStore.getState();
      expect(state.saveStatus).toBe("saved");
      expect(state.lastSavedAt).not.toBeNull();
    });

    it("saving 상태에서는 lastSavedAt이 유지된다", () => {
      const previousTime = "2025-01-01T00:00:00Z";
      useEditorStore.setState({ lastSavedAt: previousTime });

      useEditorStore.getState().setSaveStatus("saving");

      expect(useEditorStore.getState().lastSavedAt).toBe(previousTime);
    });

    it("unsaved 상태에서는 lastSavedAt이 유지된다", () => {
      const previousTime = "2025-01-01T00:00:00Z";
      useEditorStore.setState({ lastSavedAt: previousTime });

      useEditorStore.getState().setSaveStatus("unsaved");

      expect(useEditorStore.getState().lastSavedAt).toBe(previousTime);
    });
  });

  // ═══════════════════════════════════════════
  // 노드 확장 상태 테스트
  // ═══════════════════════════════════════════

  describe("toggleNodeExpanded / isNodeExpanded", () => {
    /**
     * 💡 배열 기반 토글 (Set 대신):
     *
     * toggleNodeExpanded: (nodeId) => set((state) => {
     *   const index = state.expandedNodes.indexOf(nodeId);
     *   if (index > -1) {
     *     return { expandedNodes: state.expandedNodes.filter(id => id !== nodeId) };
     *   } else {
     *     return { expandedNodes: [...state.expandedNodes, nodeId] };
     *   }
     * })
     *
     * Set<string>을 사용하면 더 간단하지만 (set.has, set.add, set.delete),
     * JSON 직렬화가 불가능합니다!
     *
     * persist 미들웨어를 사용할 때 문제가 됩니다.
     * 따라서 배열로 구현합니다.
     */
    it("노드를 확장한다", () => {
      useEditorStore.getState().toggleNodeExpanded("ch-1");

      expect(useEditorStore.getState().isNodeExpanded("ch-1")).toBe(true);
    });

    it("확장된 노드를 축소한다", () => {
      useEditorStore.setState({ expandedNodes: ["ch-1"] });

      useEditorStore.getState().toggleNodeExpanded("ch-1");

      expect(useEditorStore.getState().isNodeExpanded("ch-1")).toBe(false);
    });

    it("여러 노드를 독립적으로 토글한다", () => {
      useEditorStore.getState().toggleNodeExpanded("ch-1");
      useEditorStore.getState().toggleNodeExpanded("ch-2");

      expect(useEditorStore.getState().isNodeExpanded("ch-1")).toBe(true);
      expect(useEditorStore.getState().isNodeExpanded("ch-2")).toBe(true);

      // ch-1만 축소
      useEditorStore.getState().toggleNodeExpanded("ch-1");

      expect(useEditorStore.getState().isNodeExpanded("ch-1")).toBe(false);
      expect(useEditorStore.getState().isNodeExpanded("ch-2")).toBe(true);
    });

    it("확장되지 않은 노드는 false를 반환한다", () => {
      expect(useEditorStore.getState().isNodeExpanded("unknown")).toBe(false);
    });
  });

  // ═══════════════════════════════════════════
  // 트리 빌드 알고리즘 테스트
  // ═══════════════════════════════════════════

  describe("buildChapterTree", () => {
    /**
     * 💡 트리 빌드 알고리즘:
     *
     * 1. Map<id, node> 생성 (O(n))
     * 2. 각 노드를 부모에 연결 (O(n))
     * 3. 재귀적으로 order 순 정렬 (O(n log n))
     *
     * 전체 시간복잡도: O(n log n)
     *
     * 이 알고리즘은 프론트엔드의 useDocuments.ts buildTree()와
     * 유사한 패턴입니다!
     */
    it("평면 배열을 트리 구조로 변환한다", () => {
      const tree = useEditorStore.getState().buildChapterTree(mockChapters);

      // 루트 레벨에 2개 (ch-1, ch-2)
      expect(tree.length).toBe(2);
      expect(tree[0].id).toBe("ch-1");
      expect(tree[1].id).toBe("ch-2");
    });

    it("자식 노드를 올바른 부모에 연결한다", () => {
      const tree = useEditorStore.getState().buildChapterTree(mockChapters);

      // ch-1의 children에 ch-1-1이 있어야 함
      expect(tree[0].children.length).toBe(1);
      expect(tree[0].children[0].id).toBe("ch-1-1");
    });

    it("order 순으로 정렬한다", () => {
      // order가 역순인 데이터
      const unorderedChapters: Chapter[] = [
        { ...mockChapters[1], order: 0 }, // 2장이 먼저
        { ...mockChapters[0], order: 1 }, // 1장이 나중
      ];

      const tree = useEditorStore
        .getState()
        .buildChapterTree(unorderedChapters);

      expect(tree[0].title).toBe("2장: 전개"); // order: 0
      expect(tree[1].title).toBe("1장: 시작"); // order: 1
    });

    it("빈 배열에서 빈 트리를 반환한다", () => {
      const tree = useEditorStore.getState().buildChapterTree([]);

      expect(tree).toEqual([]);
    });

    it("부모가 없는 자식은 루트가 된다", () => {
      // parentId가 있지만 해당 부모가 배열에 없는 경우
      const orphanChapter: Chapter[] = [
        {
          ...mockChapters[2],
          parentId: "non-existent-parent", // 존재하지 않는 부모
        },
      ];

      const tree = useEditorStore.getState().buildChapterTree(orphanChapter);

      // 부모를 찾지 못하면 루트로 추가
      expect(tree.length).toBe(1);
      expect(tree[0].id).toBe("ch-1-1");
    });
  });

  describe("setChapters", () => {
    /**
     * 💡 자동 트리 빌드:
     *
     * setChapters: (chapters) => {
     *   const tree = get().buildChapterTree(chapters);
     *   set({ chapters, chapterTree: tree });
     * }
     *
     * 챕터 배열이 설정되면 자동으로 트리도 빌드됩니다.
     * 컴포넌트에서 별도로 트리 빌드를 호출할 필요가 없습니다.
     */
    it("챕터를 설정하고 자동으로 트리를 빌드한다", () => {
      useEditorStore.getState().setChapters(mockChapters);

      const state = useEditorStore.getState();
      expect(state.chapters).toHaveLength(3);
      expect(state.chapterTree).toHaveLength(2);
    });
  });

  // ═══════════════════════════════════════════
  // Split View 테스트
  // ═══════════════════════════════════════════

  describe("Split View", () => {
    /**
     * 💡 중첩 객체 업데이트 패턴:
     *
     * toggleSplitView: () => set((state) => ({
     *   splitView: {
     *     ...state.splitView,  // 기존 값 유지
     *     enabled: !state.splitView.enabled,  // 변경할 값
     *   },
     * }))
     *
     * 중첩 객체를 업데이트할 때는 스프레드 연산자로
     * 기존 값을 복사한 후 변경할 부분만 덮어씁니다.
     *
     * immer를 쓰면 더 간단:
     * set(state => { state.splitView.enabled = !state.splitView.enabled })
     */
    describe("toggleSplitView", () => {
      it("분할 뷰를 활성화한다", () => {
        useEditorStore.getState().toggleSplitView();

        expect(useEditorStore.getState().splitView.enabled).toBe(true);
      });

      it("분할 뷰를 비활성화한다", () => {
        useEditorStore.setState({
          splitView: {
            enabled: true,
            direction: "vertical",
            secondaryDocumentId: null,
          },
        });

        useEditorStore.getState().toggleSplitView();

        expect(useEditorStore.getState().splitView.enabled).toBe(false);
      });
    });

    describe("setSplitDirection", () => {
      it("가로 분할로 변경한다", () => {
        useEditorStore.getState().setSplitDirection("horizontal");

        expect(useEditorStore.getState().splitView.direction).toBe(
          "horizontal",
        );
      });

      it("세로 분할로 변경한다", () => {
        useEditorStore.setState({
          splitView: {
            enabled: true,
            direction: "horizontal",
            secondaryDocumentId: null,
          },
        });

        useEditorStore.getState().setSplitDirection("vertical");

        expect(useEditorStore.getState().splitView.direction).toBe("vertical");
      });
    });

    describe("setSecondaryDocument", () => {
      it("보조 문서를 설정한다", () => {
        useEditorStore.getState().setSecondaryDocument("doc-123");

        expect(useEditorStore.getState().splitView.secondaryDocumentId).toBe(
          "doc-123",
        );
      });

      it("보조 문서를 해제한다", () => {
        useEditorStore.setState({
          splitView: {
            enabled: true,
            direction: "vertical",
            secondaryDocumentId: "doc-123",
          },
        });

        useEditorStore.getState().setSecondaryDocument(null);

        expect(
          useEditorStore.getState().splitView.secondaryDocumentId,
        ).toBeNull();
      });
    });
  });

  // ═══════════════════════════════════════════
  // View Mode 테스트
  // ═══════════════════════════════════════════

  describe("setViewMode", () => {
    it("scrivenings 모드로 변경한다", () => {
      useEditorStore.getState().setViewMode("scrivenings");

      expect(useEditorStore.getState().viewMode).toBe("scrivenings");
    });

    it("outline 모드로 변경한다", () => {
      useEditorStore.getState().setViewMode("outline");

      expect(useEditorStore.getState().viewMode).toBe("outline");
    });

    it("editor 모드로 되돌린다", () => {
      useEditorStore.setState({ viewMode: "outline" });

      useEditorStore.getState().setViewMode("editor");

      expect(useEditorStore.getState().viewMode).toBe("editor");
    });
  });

  // ═══════════════════════════════════════════
  // 통합 시나리오 테스트
  // ═══════════════════════════════════════════

  describe("통합 시나리오", () => {
    it("프로젝트 열기 → 챕터 선택 → 편집 → 저장", () => {
      // 1. 프로젝트 설정
      useEditorStore.getState().setCurrentProject("project-1");
      useEditorStore.getState().setChapters(mockChapters);

      // 2. 챕터 선택
      useEditorStore.getState().setCurrentChapter("ch-1");

      let state = useEditorStore.getState();
      expect(state.currentChapterId).toBe("ch-1");
      expect(state.content).toBe("첫 번째 챕터 내용");

      // 3. 편집
      useEditorStore.getState().setContent("수정된 내용");

      state = useEditorStore.getState();
      expect(state.saveStatus).toBe("unsaved");

      // 4. 저장 시작
      useEditorStore.getState().setSaveStatus("saving");
      expect(useEditorStore.getState().saveStatus).toBe("saving");

      // 5. 저장 완료
      useEditorStore.getState().setSaveStatus("saved");

      state = useEditorStore.getState();
      expect(state.saveStatus).toBe("saved");
      expect(state.lastSavedAt).not.toBeNull();
    });
  });
});
