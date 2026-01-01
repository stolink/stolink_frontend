import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Mail, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string>("");
  const [activeTab, setActiveTab] = useState("login");

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
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";
    const BACKEND_URL = API_URL.replace(/\/api\/?$/, "");
    window.location.href = `${BACKEND_URL}/oauth2/authorization/google`;
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
          alert("가입이 완료되었습니다. 로그인해주세요.");
          setActiveTab("login");
        },
        onError: (err) => handleApiError(err, "회원가입에 실패했습니다"),
      },
    );
  };

  return (
    <Card
      className={`w-full max-w-md bg-white shadow-xl border-mocha-100 ${className}`}
    >
      <CardHeader className="space-y-1 text-center pb-2">
        <h2 className="text-2xl font-heading font-bold text-ink">환영합니다</h2>
        <p className="text-sm text-muted-foreground">
          StoLink와 함께 당신의 이야기를 완성하세요
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Google Login (Primary) */}
        <Button
          type="button"
          size="lg"
          className="w-full h-12 text-base font-medium relative bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900 shadow-sm"
          onClick={onGoogleLogin}
        >
          <svg
            className="mr-3 h-5 w-5"
            aria-hidden="true"
            viewBox="0 0 488 512"
          >
            <path
              fill="currentColor"
              d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
            />
          </svg>
          Google로 계속하기
        </Button>

        {/* Divider */}
        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-muted-foreground">또는</span>
          </div>
        </div>

        {/* Email Login Toggle */}
        <div className="text-center">
          <Button
            variant="ghost"
            type="button"
            onClick={() => setShowEmailForm(!showEmailForm)}
            className="text-mocha-500 hover:text-mocha-600 hover:bg-mocha-50"
          >
            <Mail className="w-4 h-4 mr-2" />
            이메일로 계속하기
            {showEmailForm ? (
              <ChevronUp className="w-4 h-4 ml-1" />
            ) : (
              <ChevronDown className="w-4 h-4 ml-1" />
            )}
          </Button>
        </div>

        {/* Email Form (Collapsible) */}
        <AnimatePresence>
          {showEmailForm && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-2 pb-1">
                <Tabs
                  value={activeTab}
                  onValueChange={(val) => {
                    setActiveTab(val);
                    setApiError("");
                  }}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2 mb-4 bg-muted/50">
                    <TabsTrigger value="login">로그인</TabsTrigger>
                    <TabsTrigger value="register">회원가입</TabsTrigger>
                  </TabsList>

                  {/* Login Form */}
                  <TabsContent value="login">
                    <form
                      onSubmit={loginForm.handleSubmit(onLogin)}
                      className="space-y-4"
                    >
                      <div className="space-y-2">
                        <Label htmlFor="email">이메일</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="name@example.com"
                          {...loginForm.register("email")}
                        />
                        {loginForm.formState.errors.email && (
                          <p className="text-xs text-red-500">
                            {loginForm.formState.errors.email.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="password">비밀번호</Label>
                        </div>
                        <div className="relative">
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            {...loginForm.register("password")}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                        {loginForm.formState.errors.password && (
                          <p className="text-xs text-red-500">
                            {loginForm.formState.errors.password.message}
                          </p>
                        )}
                      </div>
                      <Button
                        type="submit"
                        className="w-full bg-mocha-500 hover:bg-mocha-600"
                        disabled={isLoginPending}
                      >
                        {isLoginPending ? "로그인 중..." : "로그인"}
                      </Button>
                    </form>
                  </TabsContent>

                  {/* Register Form */}
                  <TabsContent value="register">
                    <form
                      onSubmit={registerForm.handleSubmit(onRegister)}
                      className="space-y-4"
                    >
                      <div className="space-y-2">
                        <Label htmlFor="reg-email">이메일</Label>
                        <Input
                          id="reg-email"
                          type="email"
                          {...registerForm.register("email")}
                        />
                        {registerForm.formState.errors.email && (
                          <p className="text-xs text-red-500">
                            {registerForm.formState.errors.email.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reg-nickname">닉네임</Label>
                        <Input
                          id="reg-nickname"
                          {...registerForm.register("nickname")}
                        />
                        {registerForm.formState.errors.nickname && (
                          <p className="text-xs text-red-500">
                            {registerForm.formState.errors.nickname.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reg-pass">비밀번호</Label>
                        <Input
                          id="reg-pass"
                          type="password"
                          placeholder="8자 이상"
                          {...registerForm.register("password")}
                        />
                        {registerForm.formState.errors.password && (
                          <p className="text-xs text-red-500">
                            {registerForm.formState.errors.password.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reg-confirm">비밀번호 확인</Label>
                        <Input
                          id="reg-confirm"
                          type="password"
                          {...registerForm.register("confirmPassword")}
                        />
                        {registerForm.formState.errors.confirmPassword && (
                          <p className="text-xs text-red-500">
                            {
                              registerForm.formState.errors.confirmPassword
                                .message
                            }
                          </p>
                        )}
                      </div>
                      <Button
                        type="submit"
                        className="w-full bg-mocha-500 hover:bg-mocha-600"
                        disabled={isRegisterPending}
                      >
                        {isRegisterPending ? "가입 중..." : "회원가입"}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>

                {apiError && (
                  <p className="mt-3 text-sm text-center text-red-500 bg-red-50 py-2 rounded">
                    {apiError}
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
