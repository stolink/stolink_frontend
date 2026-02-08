/**
 * useAuthStore 테스트
 *
 * 📚 학습 포인트:
 *
 * 1. Zustand 테스트의 기본 패턴
 *    - beforeEach에서 상태 초기화 (테스트 격리)
 *    - getState()로 액션 호출
 *    - getState()로 결과 검증
 *
 * 2. `set()` 함수의 동작
 *    - set({ key: value }): 해당 키만 업데이트 (얕은 병합)
 *    - 나머지 상태는 그대로 유지됨
 *
 * 3. 왜 Redux보다 간단한가?
 *    - Action Type 상수 불필요
 *    - Reducer switch문 불필요
 *    - Dispatch 호출 불필요
 *    - 모든 것이 하나의 create() 함수 안에!
 */
import { describe, it, expect, beforeEach } from "vitest";
import { useAuthStore } from "./useAuthStore";
import type { User } from "@/types";

// 테스트용 Mock User 데이터
const mockUser: User = {
  id: "user-123",
  email: "test@example.com",
  name: "테스트 사용자",
  role: "author",
  imageUrl: null,
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-01T00:00:00Z",
};

describe("useAuthStore", () => {
  /**
   * 🔑 핵심 개념: 테스트 격리 (Test Isolation)
   *
   * Zustand 스토어는 모듈 수준에서 싱글톤으로 존재합니다.
   * 각 테스트가 독립적으로 실행되려면 beforeEach에서
   * 상태를 초기화해야 합니다.
   *
   * setState()를 직접 호출하여 상태를 리셋합니다.
   * 이는 테스트 환경에서만 사용하는 패턴입니다.
   */
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  });

  // ═══════════════════════════════════════════
  // setAuth 테스트
  // ═══════════════════════════════════════════

  describe("setAuth", () => {
    /**
     * 💡 setAuth의 역할:
     * 로그인 성공 시 호출되어 사용자 정보와 인증 상태를 동시에 설정합니다.
     *
     * 구현 코드:
     * setAuth: (user) => set({ user, isAuthenticated: true })
     *
     * set()은 객체를 받아 기존 상태와 얕은 병합(shallow merge)을 수행합니다.
     * 위 코드는 user와 isAuthenticated만 업데이트하고,
     * isLoading 등 다른 상태는 그대로 유지합니다.
     */
    it("사용자를 설정하고 인증 상태를 true로 변경한다", () => {
      // Act: 액션 실행
      useAuthStore.getState().setAuth(mockUser);

      // Assert: 상태 검증
      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
    });

    it("기존 로딩 상태는 유지된다", () => {
      // Arrange: 테스트 전 상태 설정
      useAuthStore.setState({ isLoading: true });

      // Act
      useAuthStore.getState().setAuth(mockUser);

      // Assert: isLoading은 변경되지 않음
      const state = useAuthStore.getState();
      expect(state.isLoading).toBe(true); // 유지됨!
    });
  });

  // ═══════════════════════════════════════════
  // setUser 테스트
  // ═══════════════════════════════════════════

  describe("setUser", () => {
    /**
     * 💡 setUser vs setAuth:
     * 현재 구현에서는 동일한 동작을 합니다.
     * 하지만 의미론적으로 분리된 이유:
     * - setAuth: 최초 로그인 시
     * - setUser: 사용자 정보 업데이트 시 (예: 프로필 수정)
     *
     * 나중에 setUser가 isAuthenticated를 건드리지 않도록
     * 변경될 수 있습니다.
     */
    it("사용자 정보를 업데이트한다", () => {
      useAuthStore.getState().setUser(mockUser);

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
    });
  });

  // ═══════════════════════════════════════════
  // logout 테스트
  // ═══════════════════════════════════════════

  describe("logout", () => {
    /**
     * 💡 상태 리셋 패턴:
     *
     * logout: () => set({
     *   user: null,
     *   isAuthenticated: false,
     * })
     *
     * 로그아웃 시 사용자 정보와 인증 상태만 초기화합니다.
     * isLoading은 유지됩니다 (로그아웃 중 로딩 표시 가능).
     */
    it("사용자를 null로 설정하고 인증 상태를 false로 변경한다", () => {
      // Arrange: 로그인된 상태로 설정
      useAuthStore.setState({
        user: mockUser,
        isAuthenticated: true,
      });

      // Act
      useAuthStore.getState().logout();

      // Assert
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });

    it("이미 로그아웃된 상태에서도 안전하게 동작한다", () => {
      // 이미 초기 상태 (로그아웃 상태)

      // Act: 중복 로그아웃
      useAuthStore.getState().logout();

      // Assert: 에러 없이 동작
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  // ═══════════════════════════════════════════
  // setLoading 테스트
  // ═══════════════════════════════════════════

  describe("setLoading", () => {
    /**
     * 💡 단순 setter 패턴:
     *
     * setLoading: (loading) => set({ isLoading: loading })
     *
     * 가장 단순한 형태의 액션입니다.
     * 인자를 받아 해당 상태 키에 직접 할당합니다.
     */
    it("로딩 상태를 true로 설정한다", () => {
      useAuthStore.getState().setLoading(true);

      expect(useAuthStore.getState().isLoading).toBe(true);
    });

    it("로딩 상태를 false로 설정한다", () => {
      // Arrange
      useAuthStore.setState({ isLoading: true });

      // Act
      useAuthStore.getState().setLoading(false);

      // Assert
      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it("인증 상태에 영향을 주지 않는다", () => {
      // Arrange
      useAuthStore.setState({
        user: mockUser,
        isAuthenticated: true,
      });

      // Act
      useAuthStore.getState().setLoading(true);

      // Assert: 인증 상태 유지
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(mockUser);
    });
  });

  // ═══════════════════════════════════════════
  // 통합 시나리오 테스트
  // ═══════════════════════════════════════════

  describe("통합 시나리오", () => {
    /**
     * 💡 실제 사용 흐름을 테스트
     *
     * 로그인 → 사용자 정보 업데이트 → 로그아웃
     * 전체 흐름이 상태를 올바르게 변경하는지 확인합니다.
     */
    it("로그인 → 로그아웃 전체 흐름", () => {
      // 1. 로그인 시도 (로딩 시작)
      useAuthStore.getState().setLoading(true);
      expect(useAuthStore.getState().isLoading).toBe(true);

      // 2. 로그인 성공
      useAuthStore.getState().setAuth(mockUser);
      useAuthStore.getState().setLoading(false);

      let state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user?.name).toBe("테스트 사용자");
      expect(state.isLoading).toBe(false);

      // 3. 로그아웃
      useAuthStore.getState().logout();

      state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
    });
  });
});
