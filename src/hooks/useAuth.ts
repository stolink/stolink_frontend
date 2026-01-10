import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ApiResponse } from "@/types/api";

import { useNavigate } from "react-router-dom";
import {
  authService,
  type User,
  type AuthResponse,
} from "@/services/authService";
import { useAuthStore } from "@/stores";

// Query Keys
export const authKeys = {
  me: ["auth", "me"] as const,
};

/**
 * Hook for user registration
 */
export function useRegister() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (payload: {
      email: string;
      password: string;
      nickname: string;
    }) => authService.register(payload),
    onSuccess: (response) => {
      console.log("Register Response:", response);

      // Check for success via boolean, string status code, or HTTP numeric code
      const isSuccess =
        response.success || response.status === "OK" || response.code === 200;

      // If success flag is present OR if response seems to be a valid User object (has email/id)
      if (isSuccess || (response.data?.email && response.data?.id)) {
        // 회원가입 성공 시 로그인 페이지로 이동
        alert("회원가입이 완료되었습니다. 로그인해주세요.");
        navigate("/auth?tab=login");
      }
    },
  });
}

/**
 * Hook for user login
 */
export function useLogin() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: (payload: { email: string; password: string }) =>
      authService.login(payload),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onSuccess: (response: ApiResponse<AuthResponse> | any) => {
      console.log("Login Response:", response);

      // 1. Standard ApiResponse format
      const isStandardSuccess =
        response.success || response.status === "OK" || response.code === 200;

      if ((isStandardSuccess && response.data) || response.data?.user) {
        // 토큰은 쿠키에 자동 저장됨, user만 store에 저장
        setAuth(response.data.user);
        navigate("/library");
        return;
      }

      // 2. Unwrapped response (Direct data return) or missing success flag
      // If the response contains 'user' object directly, we assume it's data
      if (response.user) {
        setAuth(response.user);
        navigate("/library");
        return;
      }

      // 3. Fallback: Check if response itself is the data (though unlikely for AuthResponse which usually has structure)
      // If we can't determine success, we might want to alert or check specific fields.
    },
    onError: () => {
      // Login failure is expected (wrong password, etc.) - no console log needed
      // UI error is handled by the component
    },
  });
}

/**
 * Hook for user logout
 */
export function useLogout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const logout = useAuthStore((state) => state.logout);

  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      logout();
      queryClient.clear(); // Clear all cached data
      navigate("/");
    },
    onError: () => {
      // Even if API call fails, clear local auth state
      logout();
      queryClient.clear();
      navigate("/");
    },
  });
}

/**
 * Hook for getting current user info
 */
export function useMe(options?: { enabled?: boolean }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: authKeys.me,
    queryFn: async () => {
      const response = await authService.getMe();
      return response.data;
    },
    enabled: options?.enabled !== false && isAuthenticated,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Hook for updating user profile
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    mutationFn: (payload: Partial<Pick<User, "nickname" | "avatarUrl">>) =>
      authService.updateMe(payload),
    onSuccess: (response) => {
      if (response.success && response.data) {
        setUser(response.data);
        queryClient.invalidateQueries({ queryKey: authKeys.me });
      }
    },
  });
}

/**
 * Hook for forgot password
 */
export function useForgotPassword() {
  return useMutation({
    mutationFn: (email: string) => authService.forgotPassword(email),
  });
}
