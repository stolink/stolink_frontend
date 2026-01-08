import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "@/stores";
import { authService } from "@/services/authService";

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

          // 2. accessToken이 발급된 후 사용자 정보 조회
          const userResponse = await authService.getMe();
          setUser(userResponse.data);
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
