import { Link, useSearchParams } from "react-router-dom";
import { PaperTexture } from "@/components/effects";
import { AuthCard } from "@/components/auth/AuthCard";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores";
import { useEffect } from "react";

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);

  // 이미 로그인되어 있으면 라이브러리로 리다이렉트 (뒤로가기 방지)
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate("/library", { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  // 로딩 중이거나 이미 인증된 상태면 화면 깜빡임 방지를 위해 null 반환
  if (isAuthenticated) return null;

  // URL 에러 파라미터 처리 (예: ?error=oauth_failed)
  const error = searchParams.get("error");
  const errorMessage =
    error === "oauth_failed"
      ? "소셜 로그인에 실패했습니다."
      : error === "no_token"
        ? "토큰을 받아오지 못했습니다."
        : "";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative bg-paper">
      {/* Ver.4: 미묘한 종이 질감 배경 */}
      <PaperTexture opacity={1} />

      <div className="w-full max-w-md relative z-10 space-y-8">
        {/* Logo */}
        <Link to="/" className="flex justify-center">
          <img
            src="/assets/main_logo.png"
            alt="Sto-Link"
            className="h-24 w-auto drop-shadow-sm hover:scale-105 transition-transform duration-300"
          />
        </Link>

        {/* Error Message if any */}
        {errorMessage && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm text-center border border-red-100">
            {errorMessage}
          </div>
        )}

        {/* Auth Card */}
        <AuthCard onSuccess={() => navigate("/library")} />
      </div>
    </div>
  );
}
