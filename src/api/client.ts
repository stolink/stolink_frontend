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
  // Force redirect to landing page (only if not already there to prevent infinite loop)
  if (window.location.pathname !== "/") {
    window.location.href = "/";
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

    const { user } = useAuthStore.getState();

    // User ID가 있다면 X-User-Id 헤더 사용 (레거시 대응용)
    if (user?.id) {
      config.headers["X-User-Id"] = user.id;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor: 401 시 토큰 재발급 시도
api.interceptors.response.use(
  (response) => {
    // 디버깅 응답: API 응답 로그

    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomAxiosRequestConfig;

    // 401 에러이고, 재시도가 아닌 경우에만 토큰 재발급 시도
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      console.log("[Auth] 401 error detected. Attempting to refresh token...");

      // /auth/refresh 요청 자체가 실패한 경우는 재시도하지 않음
      if (originalRequest.url?.includes("/auth/refresh")) {
        console.log("[Auth] Refresh token request failed. Logging out.");
        clearCacheAndLogout();
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        console.log(
          `[Auth] Acquiring refresh lock for ${originalRequest.url}...`,
        );

        // Web Locks API를 사용하여 탭 간 동기화
        await navigator.locks.request("auth_refresh_lock", async () => {
          // 마지막 refresh 시간을 확인하여 중복 요청 방지 (3초 내 재요청이면 스킵)
          const lastRefreshTime = localStorage.getItem("last_refresh_time");
          const now = Date.now();

          if (lastRefreshTime && now - parseInt(lastRefreshTime) < 3000) {
            console.log(
              `[Auth] Token refreshed recently (${now - parseInt(lastRefreshTime)}ms ago). Skipping refresh for ${originalRequest.url}.`,
            );
            return;
          }

          // 토큰 재발급 시도
          console.log("[Auth] Sending refresh request...");
          const response = await api.post("/auth/refresh");

          // 백엔드가 200 OK를 주더라도 실제로는 실패했을 수 있으므로 응답 확인 (ApiResponse 형태인 경우)
          const responseData = response.data as Record<string, unknown>;
          if (responseData && responseData.success === false) {
            const errorObj = responseData.error as
              | Record<string, string>
              | undefined;
            throw new Error(
              errorObj?.message || "Refresh returned success: false",
            );
          }

          console.log("[Auth] Refresh successful.");
          localStorage.setItem("last_refresh_time", Date.now().toString());
        });

        // 락 해제 후 원래 요청 재시도
        console.log(`[Auth] Retrying original request: ${originalRequest.url}`);
        return api(originalRequest);
      } catch (refreshError) {
        console.error("[Auth] Refresh process failed:", refreshError);

        // 이미 다른 요청에 의해 로그아웃 처리 중일 수 있으므로 중복 실행 방지
        const { isAuthenticated } = useAuthStore.getState();
        if (isAuthenticated) {
          console.log("[Auth] Logging out due to refresh failure.");
          clearCacheAndLogout();
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
