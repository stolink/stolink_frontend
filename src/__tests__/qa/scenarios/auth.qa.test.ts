/**
 * QA 테스트 케이스: 인증 (TC-AUTH-001 ~ TC-AUTH-005)
 *
 * Excel QA 문서의 인증 관련 테스트 케이스를 구현합니다.
 * - TC-AUTH-001: 정상 회원가입
 * - TC-AUTH-002: 중복 이메일 회원가입
 * - TC-AUTH-003: 정상 로그인
 * - TC-AUTH-004: 비밀번호 오류 로그인
 * - TC-AUTH-005: 로그아웃
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@/test/utils";
import { useRegister, useLogin, useLogout } from "@/hooks/useAuth";
import { authService } from "@/services/authService";
import { useAuthStore } from "@/stores";

vi.mock("idb-keyval", () => ({
  get: vi.fn().mockResolvedValue(null),
  set: vi.fn().mockResolvedValue(undefined),
  del: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

describe("[TC-AUTH] 인증 테스트", () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, isAuthenticated: false });
    vi.clearAllMocks();
  });

  describe("TC-AUTH-001: 정상 회원가입", () => {
    /**
     * 사전 조건: 미가입 이메일
     * 테스트 시나리오: 1./auth 접근 2.정보입력 3.가입클릭
     * 기대 결과: 가입 성공 후 로그인 페이지로 이동 (실제 구현에서는 로그인 후 /library로 이동)
     *
     * Note: 현재 StoLink에서 회원가입 성공 후 자동 로그인이 아닌 로그인 페이지로 리디렉션됨
     */
    it("미가입 이메일로 정상 회원가입 시 성공해야 함", async () => {
      vi.spyOn(authService, "register").mockResolvedValueOnce({
        data: {
          id: "new-user-id",
          email: "newuser@example.com",
          nickname: "새사용자",
          createdAt: "2025-01-09T00:00:00Z",
        },
        success: true,
      });

      const { result } = renderHook(() => useRegister());

      await result.current.mutateAsync({
        email: "newuser@example.com",
        password: "Password123!",
        nickname: "새사용자",
      });

      // 서비스 호출 확인
      expect(authService.register).toHaveBeenCalledWith({
        email: "newuser@example.com",
        password: "Password123!",
        nickname: "새사용자",
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // 회원가입 성공 후에는 로그인 페이지로 이동 (자동 로그인 아님)
      // 따라서 isAuthenticated는 false 유지
      const authState = useAuthStore.getState();
      expect(authState.isAuthenticated).toBe(false);
    });
  });

  describe("TC-AUTH-002: 중복 이메일 회원가입", () => {
    /**
     * 사전 조건: 기가입 이메일
     * 테스트 시나리오: 1.중복 이메일 입력 후 가입 시도
     * 기대 결과: 에러 메시지 표시
     */
    it("이미 가입된 이메일로 회원가입 시도 시 에러가 발생해야 함", async () => {
      const error = new Error("이미 사용 중인 이메일입니다.");
      vi.spyOn(authService, "register").mockRejectedValueOnce(error);

      const { result } = renderHook(() => useRegister());

      await expect(
        result.current.mutateAsync({
          email: "existing@example.com",
          password: "Password123!",
          nickname: "사용자",
        }),
      ).rejects.toThrow("이미 사용 중인 이메일입니다.");

      // 인증 상태가 변경되지 않아야 함
      const authState = useAuthStore.getState();
      expect(authState.isAuthenticated).toBe(false);
      expect(authState.user).toBeNull();
    });
  });

  describe("TC-AUTH-003: 정상 로그인", () => {
    /**
     * 사전 조건: 가입 계정 존재
     * 테스트 시나리오: 1.아이디/비번 입력 후 로그인 클릭
     * 기대 결과: 로그인 성공 및 /library 이동
     */
    it("올바른 자격 증명으로 로그인 시 성공해야 함", async () => {
      vi.spyOn(authService, "login").mockResolvedValueOnce({
        data: {
          user: {
            id: "user-id",
            email: "test@example.com",
            nickname: "테스트 사용자",
            createdAt: "2025-01-01T00:00:00Z",
          },
          expiresIn: 1800,
        },
        success: true,
      });

      const { result } = renderHook(() => useLogin());

      await result.current.mutateAsync({
        email: "test@example.com",
        password: "correctPassword123",
      });

      expect(authService.login).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "correctPassword123",
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // 인증 상태 확인
      const authState = useAuthStore.getState();
      expect(authState.isAuthenticated).toBe(true);
      expect(authState.user?.email).toBe("test@example.com");
      expect(authState.user?.nickname).toBe("테스트 사용자");
    });
  });

  describe("TC-AUTH-004: 비밀번호 오류 로그인", () => {
    /**
     * 사전 조건: 가입 계정 존재
     * 테스트 시나리오: 1.잘못된 비번 입력 후 로그인 시도
     * 기대 결과: 에러 메시지 표시
     */
    it("잘못된 비밀번호로 로그인 시도 시 에러가 발생해야 함", async () => {
      const error = new Error("이메일 또는 비밀번호가 올바르지 않습니다.");
      vi.spyOn(authService, "login").mockRejectedValueOnce(error);

      const { result } = renderHook(() => useLogin());

      await expect(
        result.current.mutateAsync({
          email: "test@example.com",
          password: "wrongPassword",
        }),
      ).rejects.toThrow("이메일 또는 비밀번호가 올바르지 않습니다.");

      // 인증 상태가 변경되지 않아야 함
      const authState = useAuthStore.getState();
      expect(authState.isAuthenticated).toBe(false);
      expect(authState.user).toBeNull();
    });

    it("존재하지 않는 이메일로 로그인 시도 시 에러가 발생해야 함", async () => {
      const error = new Error("이메일 또는 비밀번호가 올바르지 않습니다.");
      vi.spyOn(authService, "login").mockRejectedValueOnce(error);

      const { result } = renderHook(() => useLogin());

      await expect(
        result.current.mutateAsync({
          email: "nonexistent@example.com",
          password: "anyPassword",
        }),
      ).rejects.toThrow("이메일 또는 비밀번호가 올바르지 않습니다.");
    });
  });

  describe("TC-AUTH-005: 로그아웃", () => {
    /**
     * 사전 조건: 로그인 상태
     * 테스트 시나리오: 1.프로필 클릭 2.로그아웃 버튼 클릭
     * 기대 결과: 로그아웃 및 랜딩페이지 이동
     */
    beforeEach(() => {
      // 로그인 상태 설정
      useAuthStore.setState({
        user: {
          id: "user-id",
          email: "test@example.com",
          nickname: "테스트 사용자",
          createdAt: "2025-01-01T00:00:00Z",
        },
        isAuthenticated: true,
      });
    });

    it("로그아웃 시 인증 상태가 초기화되어야 함", async () => {
      vi.spyOn(authService, "logout").mockResolvedValueOnce({
        data: null,
      });

      const { result } = renderHook(() => useLogout());

      await result.current.mutateAsync();

      expect(authService.logout).toHaveBeenCalled();

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // 인증 상태 초기화 확인
      const authState = useAuthStore.getState();
      expect(authState.isAuthenticated).toBe(false);
      expect(authState.user).toBeNull();
    });

    it("API 에러가 발생해도 로그아웃 처리가 되어야 함", async () => {
      const error = new Error("네트워크 오류");
      vi.spyOn(authService, "logout").mockRejectedValueOnce(error);

      const { result } = renderHook(() => useLogout());

      // 에러가 발생해도 로컬 상태는 초기화되어야 함
      try {
        await result.current.mutateAsync();
      } catch {
        // 에러 무시
      }

      // 인증 상태 초기화 확인
      const authState = useAuthStore.getState();
      expect(authState.isAuthenticated).toBe(false);
      expect(authState.user).toBeNull();
    });
  });
});
