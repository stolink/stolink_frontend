/**
 * useUIStore 테스트
 *
 * 📚 학습 포인트:
 *
 * 1. UI 상태를 왜 전역으로 관리하는가?
 *    - 사이드바 상태: 여러 컴포넌트(헤더, 레이아웃, 버튼 등)가 공유
 *    - 테마: 앱 전체에 적용
 *    - 모달 상태: 어디서든 열 수 있어야 함
 *
 * 2. 토글 패턴: set((state) => ({ key: !state.key }))
 *    - set에 콜백을 전달하면 현재 상태를 읽을 수 있음
 *    - 이전 상태에 의존하는 업데이트에 필수!
 *
 * 3. vs 컴포넌트 로컬 state
 *    - 로컬: 해당 컴포넌트에서만 사용하는 UI 상태
 *    - 전역: 여러 컴포넌트에서 공유하는 UI 상태
 */
import { describe, it, expect, beforeEach } from "vitest";
import { useUIStore } from "./useUIStore";

describe("useUIStore", () => {
  /**
   * 🔑 테스트 격리
   * 각 테스트 전에 초기 상태로 리셋합니다.
   */
  beforeEach(() => {
    useUIStore.setState({
      leftSidebarOpen: true,
      rightSidebarOpen: true,
      rightSidebarTab: "inspector",
      createChapterModalOpen: false,
      theme: "light",
      pendingAIChatMessage: null,
    });
  });

  // ═══════════════════════════════════════════
  // 사이드바 토글 테스트
  // ═══════════════════════════════════════════

  describe("toggleLeftSidebar", () => {
    /**
     * 💡 토글 패턴 분석:
     *
     * toggleLeftSidebar: () =>
     *   set((state) => ({ leftSidebarOpen: !state.leftSidebarOpen }))
     *
     * set()에 객체가 아닌 "함수"를 전달하면,
     * 그 함수는 현재 상태(state)를 인자로 받습니다.
     *
     * 왜 함수 형태를 써야 하는가?
     * - 토글은 "현재 값"을 알아야 반전할 수 있음
     * - set({ leftSidebarOpen: !leftSidebarOpen })은 불가능
     *   (leftSidebarOpen 변수가 스코프에 없음)
     */
    it("열린 사이드바를 닫는다", () => {
      // Arrange: 초기 상태는 true
      expect(useUIStore.getState().leftSidebarOpen).toBe(true);

      // Act
      useUIStore.getState().toggleLeftSidebar();

      // Assert
      expect(useUIStore.getState().leftSidebarOpen).toBe(false);
    });

    it("닫힌 사이드바를 연다", () => {
      // Arrange
      useUIStore.setState({ leftSidebarOpen: false });

      // Act
      useUIStore.getState().toggleLeftSidebar();

      // Assert
      expect(useUIStore.getState().leftSidebarOpen).toBe(true);
    });

    it("연속 토글이 원래 상태로 돌아온다", () => {
      const initial = useUIStore.getState().leftSidebarOpen;

      useUIStore.getState().toggleLeftSidebar();
      useUIStore.getState().toggleLeftSidebar();

      expect(useUIStore.getState().leftSidebarOpen).toBe(initial);
    });
  });

  describe("toggleRightSidebar", () => {
    it("오른쪽 사이드바를 토글한다", () => {
      expect(useUIStore.getState().rightSidebarOpen).toBe(true);

      useUIStore.getState().toggleRightSidebar();
      expect(useUIStore.getState().rightSidebarOpen).toBe(false);

      useUIStore.getState().toggleRightSidebar();
      expect(useUIStore.getState().rightSidebarOpen).toBe(true);
    });
  });

  describe("setRightSidebarOpen", () => {
    /**
     * 💡 직접 setter vs 토글:
     *
     * 토글: 현재 상태 반전 (UI 버튼 클릭)
     * 직접 setter: 프로그래밍 방식으로 특정 값 설정
     *
     * 예: 특정 기능 시작 시 사이드바 강제 오픈
     */
    it("사이드바를 강제로 연다", () => {
      useUIStore.setState({ rightSidebarOpen: false });

      useUIStore.getState().setRightSidebarOpen(true);

      expect(useUIStore.getState().rightSidebarOpen).toBe(true);
    });

    it("사이드바를 강제로 닫는다", () => {
      useUIStore.getState().setRightSidebarOpen(false);

      expect(useUIStore.getState().rightSidebarOpen).toBe(false);
    });
  });

  // ═══════════════════════════════════════════
  // 탭 변경 테스트
  // ═══════════════════════════════════════════

  describe("setRightSidebarTab", () => {
    /**
     * 💡 Union 타입과 Zustand:
     *
     * rightSidebarTab: "inspector" | "foreshadowing" | "ai" | "consistency"
     *
     * TypeScript Union 타입으로 유효한 값만 허용합니다.
     * 잘못된 값을 전달하면 컴파일 타임에 에러!
     */
    it("탭을 foreshadowing으로 변경한다", () => {
      useUIStore.getState().setRightSidebarTab("foreshadowing");

      expect(useUIStore.getState().rightSidebarTab).toBe("foreshadowing");
    });

    it("탭을 ai로 변경한다", () => {
      useUIStore.getState().setRightSidebarTab("ai");

      expect(useUIStore.getState().rightSidebarTab).toBe("ai");
    });

    it("탭을 consistency로 변경한다", () => {
      useUIStore.getState().setRightSidebarTab("consistency");

      expect(useUIStore.getState().rightSidebarTab).toBe("consistency");
    });

    it("탭을 inspector로 되돌린다", () => {
      useUIStore.setState({ rightSidebarTab: "ai" });

      useUIStore.getState().setRightSidebarTab("inspector");

      expect(useUIStore.getState().rightSidebarTab).toBe("inspector");
    });
  });

  // ═══════════════════════════════════════════
  // 모달 상태 테스트
  // ═══════════════════════════════════════════

  describe("setCreateChapterModalOpen", () => {
    /**
     * 💡 모달 상태를 전역으로 관리하는 이유:
     *
     * - 헤더의 "새 챕터" 버튼 → 모달 열기
     * - 사이드바의 "+" 버튼 → 모달 열기
     * - 키보드 단축키 → 모달 열기
     *
     * 여러 곳에서 동일한 모달을 제어해야 합니다.
     */
    it("모달을 연다", () => {
      useUIStore.getState().setCreateChapterModalOpen(true);

      expect(useUIStore.getState().createChapterModalOpen).toBe(true);
    });

    it("모달을 닫는다", () => {
      useUIStore.setState({ createChapterModalOpen: true });

      useUIStore.getState().setCreateChapterModalOpen(false);

      expect(useUIStore.getState().createChapterModalOpen).toBe(false);
    });
  });

  // ═══════════════════════════════════════════
  // 테마 테스트
  // ═══════════════════════════════════════════

  describe("setTheme", () => {
    it("다크 테마로 변경한다", () => {
      useUIStore.getState().setTheme("dark");

      expect(useUIStore.getState().theme).toBe("dark");
    });

    it("라이트 테마로 변경한다", () => {
      useUIStore.setState({ theme: "dark" });

      useUIStore.getState().setTheme("light");

      expect(useUIStore.getState().theme).toBe("light");
    });
  });

  // ═══════════════════════════════════════════
  // AI 채팅 메시지 버퍼 테스트
  // ═══════════════════════════════════════════

  describe("setPendingAIChatMessage", () => {
    /**
     * 💡 Cross-Component 통신 패턴:
     *
     * 시나리오:
     * 1. 에디터에서 텍스트 선택 → "AI에게 질문" 버튼 클릭
     * 2. 선택한 텍스트를 pendingAIChatMessage에 저장
     * 3. AI 사이드바 탭으로 이동
     * 4. AI 채팅 컴포넌트가 pendingAIChatMessage를 읽어 자동 입력
     * 5. 처리 후 null로 초기화
     *
     * 이는 Zustand를 "이벤트 버스"처럼 사용하는 패턴입니다.
     */
    it("메시지를 설정한다", () => {
      useUIStore.getState().setPendingAIChatMessage("이 문장을 분석해줘");

      expect(useUIStore.getState().pendingAIChatMessage).toBe(
        "이 문장을 분석해줘",
      );
    });

    it("메시지를 null로 초기화한다", () => {
      useUIStore.setState({ pendingAIChatMessage: "기존 메시지" });

      useUIStore.getState().setPendingAIChatMessage(null);

      expect(useUIStore.getState().pendingAIChatMessage).toBeNull();
    });

    it("빈 문자열도 유효한 값이다", () => {
      useUIStore.getState().setPendingAIChatMessage("");

      expect(useUIStore.getState().pendingAIChatMessage).toBe("");
    });
  });

  // ═══════════════════════════════════════════
  // 통합 시나리오 테스트
  // ═══════════════════════════════════════════

  describe("통합 시나리오", () => {
    it("AI 질문 흐름: 에디터 → AI 채팅", () => {
      // 1. 에디터에서 텍스트 선택 후 질문 버튼 클릭
      useUIStore
        .getState()
        .setPendingAIChatMessage("이 복선은 언제 회수되나요?");

      // 2. AI 탭으로 이동
      useUIStore.getState().setRightSidebarTab("ai");

      // 3. 사이드바가 닫혀있으면 열기
      useUIStore.getState().setRightSidebarOpen(true);

      // 검증
      const state = useUIStore.getState();
      expect(state.pendingAIChatMessage).toBe("이 복선은 언제 회수되나요?");
      expect(state.rightSidebarTab).toBe("ai");
      expect(state.rightSidebarOpen).toBe(true);

      // 4. 메시지 처리 후 초기화
      useUIStore.getState().setPendingAIChatMessage(null);
      expect(useUIStore.getState().pendingAIChatMessage).toBeNull();
    });
  });
});
