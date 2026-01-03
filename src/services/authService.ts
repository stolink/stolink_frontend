import api from "@/api/client";
import type { ApiResponse } from "@/types/api";

export interface User {
  id: string;
  email: string;
  nickname: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  expiresIn: number; // 초 단위
}

export const authService = {
  register: async (payload: {
    email: string;
    password: string;
    nickname: string;
  }) => {
    const response = await api.post<ApiResponse<User>>(
      "/auth/register",
      payload,
    );
    return response.data;
  },

  login: async (payload: { email: string; password: string }) => {
    const response = await api.post<ApiResponse<AuthResponse>>(
      "/auth/login",
      payload,
    );
    return response.data;
  },

  logout: async () => {
    const response = await api.post<ApiResponse<null>>("/auth/logout");
    return response.data;
  },

  refresh: async () => {
    // 쿠키 기반 - body 없이 POST (쿠키 자동 전송)
    const response =
      await api.post<ApiResponse<{ expiresIn: number }>>("/auth/refresh");
    return response.data;
  },

  forgotPassword: async (email: string) => {
    const response = await api.post<ApiResponse<null>>(
      "/auth/forgot-password",
      { email },
    );
    return response.data;
  },

  getMe: async () => {
    const response = await api.get<ApiResponse<User>>("/auth/me");
    return response.data;
  },

  updateMe: async (payload: Partial<Pick<User, "nickname" | "avatarUrl">>) => {
    // Backend uses @RequestParam, so send as query parameters
    const params = new URLSearchParams();
    if (payload.nickname) params.append("nickname", payload.nickname);
    if (payload.avatarUrl) params.append("avatarUrl", payload.avatarUrl);

    const response = await api.patch<ApiResponse<User>>(
      `/auth/me?${params.toString()}`,
    );
    return response.data;
  },
};
