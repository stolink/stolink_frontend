import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "@/stores";
import { authService } from "@/services/authService";

export default function OAuth2Callback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const updateTokens = useAuthStore((state) => state.updateTokens);
  const setUser = useAuthStore((state) => state.setUser);

  // React.StrictMode에서 두 번 실행 방지
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;

    const processLogin = async () => {
      const accessToken = searchParams.get("accessToken");
      const refreshToken = searchParams.get("refreshToken"); // 혹시 URL로 올 수도 있음

      if (accessToken) {
        processedRef.current = true;

        try {
          // 1. 토큰 저장 (Refresh Token은 쿠키에 있거나 URL에 있음)
          // URL에 refreshToken이 없으면 빈 문자열 (쿠키 사용)
          updateTokens(accessToken, refreshToken || "");

          // 2. 사용자 정보 가져오기
          // (client interceptor가 방금 저장한 accessToken을 헤더에 넣음)
          const userResponse = await authService.getMe();

          // 3. 최종 로그인 상태 설정
          setUser(userResponse.data, accessToken);

          // 4. 메인으로 이동 (replace: true로 히스토리에서 토큰 URL 제거)
          navigate("/library", { replace: true });
        } catch (error) {
          console.error("OAuth2 Login Failed:", error);
          navigate("/auth?error=oauth_failed", { replace: true });
        }
      } else {
        // 토큰이 없으면 로그인 실패 처리
        console.error("No access token found in URL");
        navigate("/auth?error=no_token", { replace: true });
      }
    };

    processLogin();
  }, [searchParams, navigate, updateTokens, setUser]);

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-paper text-mocha-600 font-serif gap-4">
      <div className="w-8 h-8 border-2 border-mocha-600 border-t-transparent rounded-full animate-spin" />
      <p>로그인 처리 중...</p>
    </div>
  );
}
