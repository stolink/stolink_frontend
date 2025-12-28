import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@/test/utils";
import {
  useRegister,
  useLogin,
  useLogout,
  useMe,
  useUpdateProfile,
  useForgotPassword,
  authKeys,
} from "./useAuth";
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

describe("authKeys", () => {
  it("should generate correct query keys", () => {
    expect(authKeys.me).toEqual(["auth", "me"]);
  });
});

describe("useRegister", () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, isAuthenticated: false });
  });

  it("should register a new user", async () => {
    vi.spyOn(authService, "register").mockResolvedValueOnce({
      data: {
        id: "new-user-id",
        email: "new@example.com",
        nickname: "New User",
        createdAt: "2025-01-01T00:00:00Z",
      },
      success: true,
    });

    const { result } = renderHook(() => useRegister());

    await result.current.mutateAsync({
      email: "new@example.com",
      password: "password123",
      nickname: "New User",
    });

    expect(authService.register).toHaveBeenCalledWith({
      email: "new@example.com",
      password: "password123",
      nickname: "New User",
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Check if auth state was set
    const authState = useAuthStore.getState();
    expect(authState.isAuthenticated).toBe(true);
    expect(authState.user?.email).toBe("new@example.com");
  });
});

describe("useLogin", () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, isAuthenticated: false });
  });

  it("should login successfully", async () => {
    vi.spyOn(authService, "login").mockResolvedValueOnce({
      data: {
        id: "test-user-id",
        email: "test@example.com",
        nickname: "Test User",
        createdAt: "2025-01-01T00:00:00Z",
      },
      success: true,
    });

    const { result } = renderHook(() => useLogin());

    await result.current.mutateAsync({
      email: "test@example.com",
      password: "password",
    });

    expect(authService.login).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "password",
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Check if auth state was set
    const authState = useAuthStore.getState();
    expect(authState.isAuthenticated).toBe(true);
    expect(authState.user?.email).toBe("test@example.com");
  });

  it("should handle login errors", async () => {
    const error = new Error("Invalid credentials");
    vi.spyOn(authService, "login").mockRejectedValueOnce(error);

    const { result } = renderHook(() => useLogin());

    await expect(
      result.current.mutateAsync({
        email: "wrong@example.com",
        password: "wrongpassword",
      }),
    ).rejects.toThrow("Invalid credentials");
  });
});

describe("useLogout", () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: {
        id: "test-user-id",
        email: "test@example.com",
        nickname: "Test User",
        createdAt: "2025-01-01T00:00:00Z",
      },
      isAuthenticated: true,
    });
  });

  it("should logout successfully", async () => {
    vi.spyOn(authService, "logout").mockResolvedValueOnce({
      data: { message: "Logged out successfully" },
    });

    const { result } = renderHook(() => useLogout());

    await result.current.mutateAsync();

    expect(authService.logout).toHaveBeenCalled();

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Check if auth state was cleared
    const authState = useAuthStore.getState();
    expect(authState.isAuthenticated).toBe(false);
    expect(authState.user).toBeNull();
  });

  it("should logout even on API error", async () => {
    const error = new Error("API error");
    vi.spyOn(authService, "logout").mockRejectedValueOnce(error);

    const { result } = renderHook(() => useLogout());

    // Mutation will throw, but onError should still clear auth
    try {
      await result.current.mutateAsync();
    } catch {
      // Expected to throw
    }

    // Check if auth state was cleared even on error
    const authState = useAuthStore.getState();
    expect(authState.isAuthenticated).toBe(false);
    expect(authState.user).toBeNull();
  });
});

describe("useMe", () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: {
        id: "test-user-id",
        email: "test@example.com",
        nickname: "Test User",
        createdAt: "2025-01-01T00:00:00Z",
      },
      isAuthenticated: true,
    });
  });

  it("should fetch current user info", async () => {
    const { result } = renderHook(() => useMe());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeDefined();
    expect(result.current.data?.email).toBe("test@example.com");
  });

  it("should not fetch when not authenticated", () => {
    useAuthStore.setState({ isAuthenticated: false, user: null });

    const { result } = renderHook(() => useMe());

    expect(result.current.data).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
  });

  it("should respect enabled option", () => {
    const { result } = renderHook(() => useMe({ enabled: false }));

    expect(result.current.data).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
  });
});

describe("useUpdateProfile", () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: {
        id: "test-user-id",
        email: "test@example.com",
        nickname: "Test User",
        createdAt: "2025-01-01T00:00:00Z",
      },
      isAuthenticated: true,
    });
  });

  it("should update user profile", async () => {
    vi.spyOn(authService, "updateMe").mockResolvedValueOnce({
      data: {
        id: "test-user-id",
        email: "test@example.com",
        nickname: "Updated Nickname",
        createdAt: "2025-01-01T00:00:00Z",
      },
      success: true,
    });

    const { result } = renderHook(() => useUpdateProfile());

    await result.current.mutateAsync({ nickname: "Updated Nickname" });

    expect(authService.updateMe).toHaveBeenCalledWith({
      nickname: "Updated Nickname",
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Check if user state was updated
    const authState = useAuthStore.getState();
    expect(authState.user?.nickname).toBe("Updated Nickname");
  });

  it("should update avatar URL", async () => {
    vi.spyOn(authService, "updateMe").mockResolvedValueOnce({
      data: {
        id: "test-user-id",
        email: "test@example.com",
        nickname: "Test User",
        avatarUrl: "https://example.com/avatar.jpg",
        createdAt: "2025-01-01T00:00:00Z",
      },
      success: true,
    });

    const { result } = renderHook(() => useUpdateProfile());

    await result.current.mutateAsync({
      avatarUrl: "https://example.com/avatar.jpg",
    });

    expect(authService.updateMe).toHaveBeenCalledWith({
      avatarUrl: "https://example.com/avatar.jpg",
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });
});

describe("useForgotPassword", () => {
  it("should send forgot password request", async () => {
    vi.spyOn(authService, "forgotPassword").mockResolvedValueOnce({
      data: { message: "Password reset email sent" },
    });

    const { result } = renderHook(() => useForgotPassword());

    await result.current.mutateAsync("test@example.com");

    expect(authService.forgotPassword).toHaveBeenCalledWith("test@example.com");

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });
});
