import { useAuthStore } from "@/stores";
import type { ApiResponse } from "@/types/api";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "/api";

interface QueueItem {
  resolve: (token: string) => void;
  reject: (error: Error) => void;
}

/**
 * Token Refresh Manager
 * - Mutex 패턴으로 동시 재발급 요청 방지
 * - 대기 중인 요청들을 큐에 보관
 * - 새 토큰 발급 후 대기 중인 요청 재시도
 */
class TokenRefreshManager {
  private isRefreshing = false;
  private failedQueue: QueueItem[] = [];

  /**
   * 큐에 있는 모든 대기 요청 처리
   */
  private processQueue(error: Error | null, token: string | null): void {
    this.failedQueue.forEach((item) => {
      if (error) {
        item.reject(error);
      } else if (token) {
        item.resolve(token);
      }
    });
    this.failedQueue = [];
  }

  /**
   * 토큰 재발급 요청 (Mutex 패턴)
   * - 이미 재발급 중이면 큐에 추가하고 대기
   * - 재발급 완료 시 큐의 모든 요청에 새 토큰 전달
   */
  async refreshToken(): Promise<string> {
    // 이미 재발급 중이면 큐에 추가하고 대기
    if (this.isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        this.failedQueue.push({ resolve, reject });
      });
    }

    this.isRefreshing = true;

    try {
      const refreshToken = useAuthStore.getState().refreshToken;

      // 순환 참조 방지를 위해 별도의 axios 인스턴스 사용
      const response = await axios.post<
        ApiResponse<{ accessToken: string; refreshToken: string }>
      >(
        `${API_URL}/auth/refresh`,
        { refreshToken: refreshToken || "" },
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        },
      );

      if (response.data.success && response.data.data) {
        const { accessToken, refreshToken: newRefreshToken } =
          response.data.data;

        // Store 업데이트
        useAuthStore.getState().updateTokens(accessToken, newRefreshToken);

        // 큐의 모든 대기 요청에 새 토큰 전달
        this.processQueue(null, accessToken);

        return accessToken;
      }

      throw new Error("Token refresh failed: Invalid response");
    } catch (error) {
      // 재발급 실패 시 큐의 모든 요청에 에러 전달
      const refreshError =
        error instanceof Error ? error : new Error("Token refresh failed");
      this.processQueue(refreshError, null);
      throw refreshError;
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * 재발급 상태 초기화 (로그아웃 시 사용)
   */
  reset(): void {
    this.isRefreshing = false;
    this.failedQueue = [];
  }
}

// 싱글톤 인스턴스 export
export const tokenRefreshManager = new TokenRefreshManager();
