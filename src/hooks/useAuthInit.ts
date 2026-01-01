import { useEffect, useState, useRef } from "react";
import { useAuthStore } from "@/stores";
import { authService } from "@/services/authService";

export function useAuthInit() {
  const [isInitializing, setIsInitializing] = useState(true);
  const updateTokens = useAuthStore((state) => state.updateTokens);
  const setUser = useAuthStore((state) => state.setUser);
  const logout = useAuthStore((state) => state.logout);
  const refreshTokenInStore = useAuthStore((state) => state.refreshToken);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const initialized = useRef(false);

  useEffect(() => {
    // 1. 하이드레이션이 완료될 때까지 대기
    if (!hasHydrated) return;

    // 2. 이미 초기화가 진행되었거나 완료되었다면 중복 실행 방지
    if (initialized.current) return;
    initialized.current = true;

    const initAuth = async () => {
      // 3. 이전에 로그인한 기록(Zustand persisted state)이 없거나 토큰이 없으면 조기 종료
      if (!isAuthenticated || !refreshTokenInStore) {
        setIsInitializing(false);
        return;
      }

      try {
        // 4. 세션 복구 시도 (Refresh Token 명시적 전달)
        const refreshResponse = await authService.refresh(
          refreshTokenInStore || undefined,
        );
        const { accessToken, refreshToken } = refreshResponse.data;
        updateTokens(accessToken, refreshToken);

        const userResponse = await authService.getMe();
        setUser(userResponse.data, accessToken);
      } catch (error) {
        // 토큰 만료 등 복구 실패 시에만 로그아웃
        console.warn("[AuthInit] Session recovery failed:", error);
        logout();
      } finally {
        setIsInitializing(false);
      }
    };

    initAuth();
  }, [
    hasHydrated,
    isAuthenticated,
    refreshTokenInStore,
    updateTokens,
    setUser,
    logout,
  ]);

  return isInitializing;
}
