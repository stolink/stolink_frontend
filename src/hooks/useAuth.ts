import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { authService, type User } from "@/services/authService";
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
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: (payload: {
      email: string;
      password: string;
      nickname: string;
    }) => authService.register(payload),
    onSuccess: (response) => {
      if (response.success && response.data) {
        const { user, accessToken, refreshToken } = response.data;
        setAuth(user, accessToken, refreshToken);
        navigate("/library");
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
    onSuccess: (response) => {
      if (response.success && response.data) {
        const { user, accessToken, refreshToken } = response.data;
        setAuth(user, accessToken, refreshToken);
        navigate("/library");
      }
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
      navigate("/auth");
    },
    onError: () => {
      // Even if API call fails, clear local auth state
      logout();
      queryClient.clear();
      navigate("/auth");
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
