import { useEffect, useState, useRef } from "react";
import { useAuthStore } from "@/stores";
import { authService } from "@/services/authService";

export function useAuthInit() {
  const [isInitializing, setIsInitializing] = useState(true);
  const setUser = useAuthStore((state) => state.setUser);
  const logout = useAuthStore((state) => state.logout);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const initialized = useRef(false);

  useEffect(() => {
    // 1. 하이드레이션이 완료될 때까지 대기
    if (!hasHydrated) return;

    // 2. 이미 초기화가 진행되었거나 완료되었다면 중복 실행 방지
    if (initialized.current) return;
    initialized.current = true;

    // 3. 인증 관련 페이지에서는 자동 로그인 체크 건너뛰기
    const pathname = window.location.pathname;
    if (
      pathname === "/auth" ||
      pathname.startsWith("/oauth2/") ||
      pathname === "/"
    ) {
      setIsInitializing(false);
      return;
    }

    const initAuth = async () => {
      try {
        // 4. 쿠키가 유효하면 바로 사용자 정보 조회 (자동 로그인)
        const userResponse = await authService.getMe();
        setUser(userResponse.data);
      } catch {
        // 5. 401 에러 시 refresh 시도
        try {
          await authService.refresh();
          const userResponse = await authService.getMe();
          setUser(userResponse.data);
        } catch {
          // refresh도 실패하면 로그아웃 상태 유지 (조용히)
          logout();
        }
      } finally {
        setIsInitializing(false);
      }
    };

    initAuth();
  }, [hasHydrated, setUser, logout]);

  return isInitializing;
}
