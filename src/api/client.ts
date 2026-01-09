import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/stores";
import { QueryClient } from "@tanstack/react-query";

const API_URL = import.meta.env.VITE_API_URL || "/api";

// 재시도 플래그를 위한 타입 확장
interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// QueryClient 인스턴스를 저장 (App에서 설정)
let queryClientInstance: QueryClient | null = null;

export const setQueryClient = (client: QueryClient) => {
  queryClientInstance = client;
};

const clearCacheAndLogout = () => {
  useAuthStore.getState().logout();
  if (queryClientInstance) {
    queryClientInstance.clear();
  }
};

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // 쿠키 자동 전송
  // Content-Type은 axios가 데이터 타입에 따라 자동 설정
  // - 일반 객체: application/json
  // - FormData: multipart/form-data
});

// Request interceptor: X-User-Id 추가 (선택적)
api.interceptors.request.use(
  (config) => {
    // 디버깅 요청: API 요청 로그
    console.log(
      `[API Request] ${config.method?.toUpperCase()} ${config.url}`,
      config.params || "",
    );

    const { user } = useAuthStore.getState();

    // User ID가 있다면 X-User-Id 헤더 사용 (레거시 대응용)
    if (user?.id) {
      config.headers["X-User-Id"] = user.id;
    }

    return config;
  },
  (error) => {
    console.error("[API Request Error]", error);
    return Promise.reject(error);
  },
);

// Response interceptor: 401 시 토큰 재발급 시도
api.interceptors.response.use(
  (response) => {
    // 디버깅 응답: API 응답 로그
    console.log(
      `[API Response] ${response.status} ${response.config.url}`,
      response.data,
    );
    return response;
  },
  async (error: AxiosError) => {
    console.error(
      `[API Error] ${error.response?.status} ${error.config?.url}`,
      error.response?.data || error.message,
    );

    const originalRequest = error.config as CustomAxiosRequestConfig;

    // 401 에러이고, 재시도가 아닌 경우에만 토큰 재발급 시도
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      // /auth/refresh 요청 자체가 실패한 경우는 재시도하지 않음
      if (originalRequest.url?.includes("/auth/refresh")) {
        clearCacheAndLogout();
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        // Web Locks API를 사용하여 탭 간 동기화
        // 'auth_refresh_lock'을 획득한 탭만 refresh 요청을 수행
        await navigator.locks.request("auth_refresh_lock", async () => {
          // 마지막 refresh 시간을 확인하여 중복 요청 방지 (2초 내 재요청이면 스킵)
          const lastRefreshTime = localStorage.getItem("last_refresh_time");
          const now = Date.now();

          if (lastRefreshTime && now - parseInt(lastRefreshTime) < 2000) {
            // 이미 다른 탭/요청에서 refresh를 완료함 -> 바로 재시도
            return;
          }

          // 토큰 재발급 시도
          console.log("[Auth] Token refresh attempt...");
          await api.post("/auth/refresh");
          localStorage.setItem("last_refresh_time", now.toString());
        });

        // 락 해제 후 원래 요청 재시도
        // 락 내에서 refresh가 성공했거나, 다른 탭이 이미 성공했으므로
        // 쿠키가 갱신된 상태에서 요청을 다시 보냄
        console.log("[Auth] Retrying original request...");
        return api(originalRequest);
      } catch (refreshError) {
        // 토큰 재발급 실패 시 로그아웃 및 캐시 정리
        console.error("[Auth] Token refresh failed", refreshError);
        clearCacheAndLogout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
