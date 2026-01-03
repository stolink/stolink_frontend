import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/stores";

const API_URL = import.meta.env.VITE_API_URL || "/api";

// 재시도 플래그를 위한 타입 확장
interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // 쿠키 자동 전송
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: X-User-Id 추가 (선택적)
api.interceptors.request.use(
  (config) => {
    const { user } = useAuthStore.getState();

    // User ID가 있다면 X-User-Id 헤더 사용 (레거시 대응용)
    if (user?.id) {
      config.headers["X-User-Id"] = user.id;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor: 401 시 토큰 재발급 시도
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
        // 토큰 재발급 시도 (쿠키 자동 전송)
        await api.post("/auth/refresh");
        // 새 토큰은 쿠키에 자동 설정됨, 원래 요청 재시도
        return api(originalRequest);
      } catch (refreshError) {
        // 토큰 재발급 실패 시 로그아웃
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
