/**
 * useNotificationStore 테스트
 *
 * 📚 학습 포인트:
 *
 * 1. 미들웨어 체이닝: create(persist(immer(...)))
 *    - 안쪽에서 바깥쪽으로 실행됨
 *    - immer가 먼저 적용되어 불변성 관리
 *    - persist가 나중에 적용되어 localStorage 저장
 *
 * 2. immer 미들웨어의 장점
 *    - 일반: set(state => ({ ...state, value: newValue }))
 *    - immer: set(state => { state.value = newValue }) // 직접 수정!
 *    - 중첩 객체 업데이트가 훨씬 간결해짐
 *
 * 3. persist 미들웨어
 *    - localStorage에 상태 자동 저장
 *    - 페이지 새로고침 후에도 상태 유지
 *    - 테스트에서는 동작하지 않음 (모킹 필요 없음)
 *
 * 4. 미들웨어 순서가 중요한 이유
 *    - persist(immer()): immer로 수정 → persist로 저장 ✅
 *    - immer(persist()): persist가 먼저 → immer가 나중 ❓
 *    - 일반적으로 persist는 가장 바깥에 위치
 */
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { useNotificationStore } from "./useNotificationStore";

describe("useNotificationStore", () => {
  /**
   * 🔑 persist 미들웨어가 있는 스토어 테스트
   *
   * persist는 localStorage를 사용하지만,
   * Vitest 환경에서는 localStorage가 모킹되어 있거나
   * 실제로 동작하지 않을 수 있습니다.
   *
   * 우리는 "상태 로직"만 테스트하므로,
   * localStorage 동작은 무시합니다.
   */

  beforeEach(() => {
    // persist 미들웨어가 있어도 setState로 직접 리셋 가능
    useNotificationStore.setState({
      goalNotification: true,
      foreshadowingNotification: true,
      aiSuggestionNotification: false,
    });
  });

  // localStorage mock cleanup (persist용)
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ═══════════════════════════════════════════
  // 개별 설정 변경 테스트
  // ═══════════════════════════════════════════

  describe("setGoalNotification", () => {
    /**
     * 💡 immer 패턴 분석:
     *
     * setGoalNotification: (enabled) =>
     *   set((state) => {
     *     state.goalNotification = enabled;  // 직접 수정!
     *   })
     *
     * 일반 Zustand에서는 이렇게 해야 함:
     * set((state) => ({ ...state, goalNotification: enabled }))
     *
     * immer를 사용하면 직접 수정 문법이 가능합니다.
     * immer가 내부적으로 불변성을 유지한 새 객체를 생성합니다.
     */
    it("목표 알림을 비활성화한다", () => {
      useNotificationStore.getState().setGoalNotification(false);

      expect(useNotificationStore.getState().goalNotification).toBe(false);
    });

    it("목표 알림을 활성화한다", () => {
      useNotificationStore.setState({ goalNotification: false });

      useNotificationStore.getState().setGoalNotification(true);

      expect(useNotificationStore.getState().goalNotification).toBe(true);
    });
  });

  describe("setForeshadowingNotification", () => {
    it("복선 알림을 비활성화한다", () => {
      useNotificationStore.getState().setForeshadowingNotification(false);

      expect(useNotificationStore.getState().foreshadowingNotification).toBe(
        false,
      );
    });

    it("복선 알림을 활성화한다", () => {
      useNotificationStore.setState({ foreshadowingNotification: false });

      useNotificationStore.getState().setForeshadowingNotification(true);

      expect(useNotificationStore.getState().foreshadowingNotification).toBe(
        true,
      );
    });
  });

  describe("setAiSuggestionNotification", () => {
    /**
     * 💡 기본값 분석:
     *
     * const defaultSettings = {
     *   goalNotification: true,
     *   foreshadowingNotification: true,
     *   aiSuggestionNotification: false,  // 기본 OFF
     * }
     *
     * AI 제안 알림만 기본 OFF인 이유:
     * - AI 제안은 빈번할 수 있음
     * - 사용자가 원할 때만 켜도록 함
     * - "알림 피로" 방지
     */
    it("AI 제안 알림을 활성화한다", () => {
      useNotificationStore.getState().setAiSuggestionNotification(true);

      expect(useNotificationStore.getState().aiSuggestionNotification).toBe(
        true,
      );
    });

    it("AI 제안 알림을 비활성화한다", () => {
      useNotificationStore.setState({ aiSuggestionNotification: true });

      useNotificationStore.getState().setAiSuggestionNotification(false);

      expect(useNotificationStore.getState().aiSuggestionNotification).toBe(
        false,
      );
    });
  });

  // ═══════════════════════════════════════════
  // 기본값 복원 테스트
  // ═══════════════════════════════════════════

  describe("resetToDefaults", () => {
    /**
     * 💡 기본값 복원 패턴:
     *
     * resetToDefaults: () => set(() => ({ ...defaultSettings }))
     *
     * 주의: set()에 콜백을 전달하지만, state 인자를 사용하지 않습니다.
     * 이는 현재 상태와 관계없이 항상 같은 값으로 리셋하기 때문입니다.
     *
     * 스프레드 연산자 {...defaultSettings}는
     * defaultSettings 객체의 복사본을 생성합니다.
     * 원본 객체를 직접 반환하면 참조가 공유되어 문제가 생길 수 있습니다.
     */
    it("모든 설정을 기본값으로 복원한다", () => {
      // Arrange: 모든 값을 변경
      useNotificationStore.setState({
        goalNotification: false,
        foreshadowingNotification: false,
        aiSuggestionNotification: true,
      });

      // Act
      useNotificationStore.getState().resetToDefaults();

      // Assert
      const state = useNotificationStore.getState();
      expect(state.goalNotification).toBe(true);
      expect(state.foreshadowingNotification).toBe(true);
      expect(state.aiSuggestionNotification).toBe(false);
    });

    it("일부만 변경된 상태에서도 전체가 복원된다", () => {
      // Arrange: 하나만 변경
      useNotificationStore.getState().setGoalNotification(false);

      // Act
      useNotificationStore.getState().resetToDefaults();

      // Assert: 모든 값이 기본값
      const state = useNotificationStore.getState();
      expect(state.goalNotification).toBe(true);
      expect(state.foreshadowingNotification).toBe(true);
      expect(state.aiSuggestionNotification).toBe(false);
    });
  });

  // ═══════════════════════════════════════════
  // 상태 독립성 테스트
  // ═══════════════════════════════════════════

  describe("상태 독립성", () => {
    /**
     * 💡 각 setter는 다른 상태에 영향을 주지 않아야 합니다.
     *
     * immer는 "변경한 부분만" 업데이트합니다.
     * state.goalNotification = false는
     * goalNotification만 변경하고 나머지는 그대로 둡니다.
     */
    it("하나의 설정 변경이 다른 설정에 영향을 주지 않는다", () => {
      // Act: 하나만 변경
      useNotificationStore.getState().setGoalNotification(false);

      // Assert: 나머지는 그대로
      const state = useNotificationStore.getState();
      expect(state.goalNotification).toBe(false); // 변경됨
      expect(state.foreshadowingNotification).toBe(true); // 유지
      expect(state.aiSuggestionNotification).toBe(false); // 유지
    });

    it("연속 변경이 누적된다", () => {
      useNotificationStore.getState().setGoalNotification(false);
      useNotificationStore.getState().setForeshadowingNotification(false);
      useNotificationStore.getState().setAiSuggestionNotification(true);

      const state = useNotificationStore.getState();
      expect(state.goalNotification).toBe(false);
      expect(state.foreshadowingNotification).toBe(false);
      expect(state.aiSuggestionNotification).toBe(true);
    });
  });

  // ═══════════════════════════════════════════
  // 통합 시나리오 테스트
  // ═══════════════════════════════════════════

  describe("통합 시나리오", () => {
    it("설정 변경 → 복원 → 재변경", () => {
      // 1. 초기 상태 확인
      expect(useNotificationStore.getState().goalNotification).toBe(true);

      // 2. 설정 변경
      useNotificationStore.getState().setGoalNotification(false);
      expect(useNotificationStore.getState().goalNotification).toBe(false);

      // 3. 기본값 복원
      useNotificationStore.getState().resetToDefaults();
      expect(useNotificationStore.getState().goalNotification).toBe(true);

      // 4. 다시 변경
      useNotificationStore.getState().setGoalNotification(false);
      expect(useNotificationStore.getState().goalNotification).toBe(false);
    });
  });
});
