import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "@/stores";
import { authService } from "@/services/authService";

/**
 * 지정된 시간 동안 대기
 */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * 사용자 정보를 가져오는 함수 (재시도 로직 포함)
 * 쿠키 전파 타이밍 이슈로 인해 첫 번째 시도가 실패할 수 있음
 */
async function fetchUserWithRetry(maxRetries = 3, delayMs = 500) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await authService.getMe();

      // 다양한 API 응답 형식 처리
      // 1. 표준 형식: { success: true, data: User }
      // 2. 직접 형식: { id, email, ... }
      // 3. 중첩 형식: { data: { id, email, ... } }
      const userData = response.data || response;

      if (userData && (userData.id || userData.email)) {
        return userData;
      }

      throw new Error("Invalid user data format");
    } catch (error) {
      lastError = error;

      // 마지막 시도가 아니면 대기 후 재시도
      if (attempt < maxRetries) {
        await delay(delayMs);
      }
    }
  }

  throw lastError;
}

export default function OAuth2Callback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);

  // React.StrictMode에서 두 번 실행 방지
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    const processLogin = async () => {
      const success = searchParams.get("success");
      const error = searchParams.get("error");

      if (success === "true") {
        // 성공 → refresh 먼저 호출하여 accessToken 발급 후 사용자 정보 조회
        try {
          // 1. refresh 호출 (쿠키 기반으로 accessToken 발급)
          await authService.refresh();

          // 2. 쿠키 전파를 위한 약간의 대기 (브라우저-서버 간 타이밍 이슈 방지)
          await delay(100);

          // 3. accessToken이 발급된 후 사용자 정보 조회 (재시도 로직 포함)
          const userData = await fetchUserWithRetry(3, 500);
          setUser(userData);
          navigate("/library", { replace: true });
        } catch (err) {
          console.error("OAuth2 Login Failed:", err);
          navigate("/auth?error=oauth_failed", { replace: true });
        }
      } else if (error === "login_required") {
        // 구글에 로그인 안 됨 → 일반 로그인으로 안내
        navigate("/auth?message=google_login_required", { replace: true });
      } else if (error) {
        // 기타 에러
        navigate(`/auth?error=${error}`, { replace: true });
      } else {
        // success도 error도 없는 경우
        navigate("/auth?error=unknown", { replace: true });
      }
    };

    processLogin();
  }, [searchParams, navigate, setUser]);

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-paper text-mocha-600  gap-4">
      <div className="w-8 h-8 border-2 border-mocha-600 border-t-transparent rounded-full animate-spin" />
      <p>로그인 처리 중...</p>
    </div>
  );
}
