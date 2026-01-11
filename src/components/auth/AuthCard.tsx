import { useState } from "react";
import { useToast } from "@/hooks/useToast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff } from "lucide-react";

import { Button } from "@stolink/ui";
import { Input } from "@stolink/ui";
import { Label } from "@/components/ui/label";
import { Card } from "@stolink/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLogin, useRegister } from "@/hooks/useAuth";

// --- Validation Schemas ---
const loginSchema = z.object({
  email: z.string().email("유효한 이메일을 입력하세요"),
  password: z.string().min(1, "비밀번호를 입력하세요"),
});

const registerSchema = z
  .object({
    email: z.string().email("유효한 이메일을 입력하세요"),
    password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다"),
    confirmPassword: z.string(),
    nickname: z
      .string()
      .min(2, "닉네임은 2자 이상이어야 합니다")
      .max(20, "닉네임은 20자 이하여야 합니다"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "비밀번호가 일치하지 않습니다",
    path: ["confirmPassword"],
  });

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

// --- Components ---

export function AuthCard({
  className,
  onSuccess,
}: {
  className?: string;
  onSuccess?: () => void;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string>("");
  const [activeTab, setActiveTab] = useState("login");
  const { toast } = useToast();

  // React Query hooks
  const { mutate: login, isPending: isLoginPending } = useLogin();
  const { mutate: register, isPending: isRegisterPending } = useRegister();

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      nickname: "",
    },
  });

  const onGoogleLogin = () => {
    const BACKEND_URL =
      import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";
    window.location.href = `${BACKEND_URL}/api/oauth2/authorization/google`;
  };

  const handleApiError = (error: Error, defaultMsg: string) => {
    const errorMsg =
      (error as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message || defaultMsg;
    setApiError(errorMsg);
  };

  const onLogin = (data: LoginFormData) => {
    setApiError("");
    login(data, {
      onSuccess: () => onSuccess?.(),
      onError: (err) => handleApiError(err, "로그인에 실패했습니다"),
    });
  };

  const onRegister = (data: RegisterFormData) => {
    setApiError("");
    register(
      { email: data.email, password: data.password, nickname: data.nickname },
      {
        onSuccess: () => {
          // useRegister 내부에서 페이지 이동을 처리하더라도, 여기서 추가 작업을 할 수 있음
          // 현재 useRegister가 /auth?tab=login으로 이동시키므로
          // 모달에서는 "가입 완료! 로그인해주세요" 메시지를 띄우거나 탭을 전환해야 함.
          toast({
            title: "가입 완료!",
            description: "로그인해주세요.",
            variant: "success",
          });
          setActiveTab("login");
        },
        onError: (err) => handleApiError(err, "회원가입에 실패했습니다"),
      },
    );
  };

  return (
    <Card
      className={`w-full overflow-hidden bg-paper rounded-[2rem] shadow-xl border-none ${className}`}
      style={{
        boxShadow: "0 25px 50px -12px rgba(61, 48, 42, 0.25)", // Warm Mocha Shadow
      }}
    >
      <div className="flex flex-col md:flex-row min-h-[550px]">
        {/* Left Column: Auth Form */}
        <div className="flex-1 p-8 md:p-10 bg-paper">
          <div className="mb-8">
            <h2 className="text-2xl font-heading font-bold text-ink tracking-tight mb-1">
              {activeTab === "login" ? "다시 만나서 반갑습니다" : "새로운 시작"}
            </h2>
            <p className="text-sm text-ink/60 font-medium">
              {activeTab === "login"
                ? "StoLink와 함께 당신의 이야기를 계속 이어가세요"
                : "작가님을 위한 최고의 도구, StoLink에 가입하세요"}
            </p>
          </div>

          <div className="space-y-6">
            {/* Google Login (Primary) */}
            <Button
              type="button"
              className="w-full h-12 text-sm font-bold relative bg-white border border-cloud-200 text-espresso-900 hover:bg-cloud-50 hover:border-mocha-400 transition-all duration-200 shadow-sm rounded-2xl"
              onClick={onGoogleLogin}
            >
              <svg
                className="mr-3 h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 48 48"
              >
                <path
                  fill="#FFC107"
                  d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
                />
                <path
                  fill="#FF3D00"
                  d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
                />
                <path
                  fill="#4CAF50"
                  d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
                />
                <path
                  fill="#1976D2"
                  d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
                />
              </svg>
              Google로 계속하기
            </Button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-cloud-50" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase">
                <span className="bg-paper px-3 text-ink/30 font-bold tracking-widest">
                  또는 이메일로 계속하기
                </span>
              </div>
            </div>

            <Tabs
              value={activeTab}
              onValueChange={(val) => {
                setActiveTab(val);
                setApiError("");
              }}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 mb-6 h-12 bg-cloud-100 p-1.5 rounded-xl">
                <TabsTrigger
                  value="login"
                  className="text-sm font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:text-mocha-600 data-[state=active]:shadow-sm transition-all duration-300"
                >
                  로그인
                </TabsTrigger>
                <TabsTrigger
                  value="register"
                  className="text-sm font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:text-mocha-600 data-[state=active]:shadow-sm transition-all duration-300"
                >
                  회원가입
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form
                  onSubmit={loginForm.handleSubmit(onLogin)}
                  className="space-y-4"
                >
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="email"
                      className="text-xs font-bold text-ink/80 ml-0.5"
                    >
                      이메일 주소
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      className="h-10 text-sm border-cloud-200 bg-white focus:bg-white focus:ring-2 focus:ring-mocha-400/30 focus:border-mocha-500 transition-all font-medium"
                      {...loginForm.register("email")}
                    />
                    {loginForm.formState.errors.email && (
                      <p className="text-[11px] text-status-error font-bold mt-1 ml-0.5">
                        {loginForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor="password"
                        className="text-xs font-bold text-ink/80 ml-0.5"
                      >
                        비밀번호
                      </Label>
                      <button
                        type="button"
                        className="text-[11px] font-bold text-mocha-500 hover:text-mocha-700 hover:underline transition-colors"
                      >
                        비밀번호를 잊으셨나요?
                      </button>
                    </div>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        className="h-10 text-sm border-cloud-200 bg-white focus:bg-white focus:ring-2 focus:ring-mocha-400/30 focus:border-mocha-500 transition-all"
                        {...loginForm.register("password")}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/30 hover:text-ink/60 transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {loginForm.formState.errors.password && (
                      <p className="text-[11px] text-status-error font-bold mt-1 ml-0.5">
                        {loginForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-12 text-sm font-bold bg-mocha-500 hover:bg-mocha-600 text-white transition-all shadow-md hover:shadow-lg mt-4 border-none"
                    disabled={isLoginPending}
                  >
                    {isLoginPending ? "처리 중..." : "로그인"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form
                  onSubmit={registerForm.handleSubmit(onRegister)}
                  className="space-y-3"
                >
                  <div className="space-y-1">
                    <Label
                      htmlFor="reg-email"
                      className="text-xs font-bold text-ink/80"
                    >
                      이메일
                    </Label>
                    <Input
                      id="reg-email"
                      type="email"
                      className="h-10 text-sm border-cloud-50 bg-cloud-50/20 focus:bg-white focus:ring-2 focus:ring-mocha-400/30 focus:border-mocha-500 transition-all font-medium"
                      {...registerForm.register("email")}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label
                      htmlFor="reg-nickname"
                      className="text-xs font-bold text-ink/80"
                    >
                      닉네임
                    </Label>
                    <Input
                      id="reg-nickname"
                      className="h-10 text-sm border-cloud-200 bg-white focus:bg-white focus:ring-2 focus:ring-mocha-400/30 focus:border-mocha-500 transition-all font-medium"
                      {...registerForm.register("nickname")}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label
                      htmlFor="reg-pass"
                      className="text-xs font-bold text-ink/80"
                    >
                      비밀번호
                    </Label>
                    <Input
                      id="reg-pass"
                      type="password"
                      placeholder="8자 이상"
                      className="h-10 text-sm border-cloud-200 bg-white focus:bg-white focus:ring-2 focus:ring-mocha-400/30 focus:border-mocha-500 transition-all"
                      {...registerForm.register("password")}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label
                      htmlFor="reg-confirm"
                      className="text-xs font-bold text-ink/80"
                    >
                      비밀번호 확인
                    </Label>
                    <Input
                      id="reg-confirm"
                      type="password"
                      className="h-10 text-sm border-cloud-200 bg-white focus:bg-white focus:ring-2 focus:ring-mocha-400/30 focus:border-mocha-500 transition-all"
                      {...registerForm.register("confirmPassword")}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-12 text-sm font-bold bg-mocha-500 hover:bg-mocha-600 text-white transition-all shadow-md hover:shadow-lg mt-4 border-none"
                    disabled={isRegisterPending}
                  >
                    {isRegisterPending ? "처리 중..." : "회원가입 완료"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            {apiError && (
              <p className="text-xs text-status-error bg-red-50 p-2.5 rounded-md text-center border border-red-100 font-bold">
                {apiError}
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Brand Visual - Calm Sage Glass Design (Hidden on mobile) */}
        <div className="hidden md:flex flex-1 p-10 text-white flex-col justify-between relative overflow-hidden">
          {/* Sage Green Gradient Background - Using new muted palette */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(145deg, #647A53 0%, #4D5E40 50%, #3D5A40 100%)",
            }}
          />

          {/* Soft Light Overlay */}
          <div
            className="absolute inset-0 opacity-25"
            style={{
              background:
                "radial-gradient(ellipse 70% 50% at 30% 20%, rgba(255,255,255,0.25) 0%, transparent 60%)",
            }}
          />

          {/* Single Decorative Orb */}
          <div
            className="absolute w-48 h-48 rounded-full blur-3xl opacity-20"
            style={{
              background: "#7D9668",
              top: "-15%",
              right: "-10%",
            }}
          />

          {/* Content Layer */}
          <div className="relative z-10">
            {/* Logo */}
            <div className="flex items-center space-x-2.5 mb-10">
              <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center font-heading font-black text-white border border-white/20">
                S
              </div>
              <span className="font-heading font-bold text-xl tracking-tight text-white">
                StoLink
              </span>
            </div>

            <h3 className="text-3xl font-heading font-bold mb-4 leading-tight text-white">
              당신의 세계관이
              <br />
              데이터로 피어납니다
            </h3>
            <p className="text-white/85 text-sm leading-relaxed max-w-[280px]">
              NLP 기술로 캐릭터 관계와 스토리 복선을 시각화하세요. StoLink가
              작가님의 창작 여정을 함께합니다.
            </p>
          </div>

          {/* Testimonial Card - Glass Effect */}
          <div className="relative z-10">
            <div
              className="backdrop-blur-md rounded-2xl p-5"
              style={{
                background: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.2)",
              }}
            >
              <div className="flex items-center space-x-4 mb-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{
                    background: "rgba(255,255,255,0.15)",
                    border: "1px solid rgba(255,255,255,0.25)",
                  }}
                >
                  <svg
                    className="w-5 h-5 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-bold text-white">
                    수많은 작가들의 선택
                  </div>
                  <div className="text-xs text-white/70">
                    데이터 기반 세계관 관리 도구
                  </div>
                </div>
              </div>
              <p className="text-sm italic text-white/90 leading-relaxed">
                "인물 관계가 복잡해질 때마다 막막했는데, StoLink의 그래프 덕분에
                전체 흐름을 놓치지 않게 되었어요."
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
