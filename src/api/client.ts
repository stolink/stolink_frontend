import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/stores";
import { tokenRefreshManager } from "./tokenRefreshManager";

const API_URL = import.meta.env.VITE_API_URL || "/api";

// 재시도 플래그를 위한 타입 확장
interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: Add Authorization header and X-User-Id
api.interceptors.request.use(
  (config) => {
    const { user, accessToken } = useAuthStore.getState();

    // 1. Access Token이 있다면 Authorization 헤더 우선 사용
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    // 2. 토큰이 없고 User ID가 있다면 X-User-Id 사용 (레거시 대응용)
    else if (user?.id) {
      config.headers["X-User-Id"] = user.id;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor: Handle 401 with token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomAxiosRequestConfig;

    // 401 에러이고, 재시도가 아닌 경우에만 토큰 재발급 시도
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      // /auth/refresh 요청 자체가 실패한 경우는 재시도하지 않음
      if (originalRequest.url?.includes("/auth/refresh")) {
        useAuthStore.getState().logout();
        return Promise.reject(error);
      }

      try {
        // 토큰 재발급 시도 (Mutex 패턴으로 동시 요청 처리)
        const newToken = await tokenRefreshManager.refreshToken();

        // 새 토큰으로 원래 요청 재시도
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // 토큰 재발급 실패 시 로그아웃
        tokenRefreshManager.reset();
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
