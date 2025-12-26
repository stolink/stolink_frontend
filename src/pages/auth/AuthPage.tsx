import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLogin, useRegister } from "@/hooks/useAuth";

// Validation schemas
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
    agree: z.boolean().refine((val) => val === true, "이용약관에 동의해주세요"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "비밀번호가 일치하지 않습니다",
    path: ["confirmPassword"],
  });

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string>("");

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
      agree: false,
    },
  });

  const onLogin = (data: LoginFormData) => {
    setApiError("");
    login(
      { email: data.email, password: data.password },
      {
        onError: (error: Error) => {
          const errorMsg =
            (
              error as {
                response?: { data?: { error?: { message?: string } } };
              }
            )?.response?.data?.error?.message || "로그인에 실패했습니다";
          setApiError(errorMsg);
        },
      }
    );
  };

  const onRegister = (data: RegisterFormData) => {
    setApiError("");
    register(
      {
        email: data.email,
        password: data.password,
        nickname: data.nickname,
      },
      {
        onError: (error: Error) => {
          const errorMsg =
            (
              error as {
                response?: { data?: { error?: { message?: string } } };
              }
            )?.response?.data?.error?.message || "회원가입에 실패했습니다";
          setApiError(errorMsg);
        },
      }
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center mb-8">
          <img
            src="/assets/main_logo.png"
            alt="Sto-Link"
            className="h-24 w-auto"
          />
        </Link>

        <Card>
          <Tabs defaultValue="login">
            <CardHeader>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">로그인</TabsTrigger>
                <TabsTrigger value="register">회원가입</TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent>
              {/* Login Tab */}
              <TabsContent value="login">
                <form
                  onSubmit={loginForm.handleSubmit(onLogin)}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="login-email">이메일</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="name@example.com"
                      {...loginForm.register("email")}
                    />
                    {loginForm.formState.errors.email && (
                      <p className="text-sm text-status-error">
                        {loginForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">비밀번호</Label>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        {...loginForm.register("password")}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {loginForm.formState.errors.password && (
                      <p className="text-sm text-status-error">
                        {loginForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoginPending}
                  >
                    {isLoginPending ? "로그인 중..." : "로그인"}
                  </Button>

                  {apiError && (
                    <p className="text-sm text-status-error text-center">
                      {apiError}
                    </p>
                  )}

                  <p className="text-center text-sm text-muted-foreground">
                    <a href="#" className="hover:text-sage-500">
                      비밀번호를 잊으셨나요?
                    </a>
                  </p>
                </form>
              </TabsContent>

              {/* Register Tab */}
              <TabsContent value="register">
                <form
                  onSubmit={registerForm.handleSubmit(onRegister)}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="register-email">이메일</Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="name@example.com"
                      {...registerForm.register("email")}
                    />
                    {registerForm.formState.errors.email && (
                      <p className="text-sm text-status-error">
                        {registerForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-nickname">닉네임 (필명)</Label>
                    <Input
                      id="register-nickname"
                      placeholder="작가의 이름"
                      {...registerForm.register("nickname")}
                    />
                    {registerForm.formState.errors.nickname && (
                      <p className="text-sm text-status-error">
                        {registerForm.formState.errors.nickname.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-password">비밀번호</Label>
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="8자 이상"
                      {...registerForm.register("password")}
                    />
                    {registerForm.formState.errors.password && (
                      <p className="text-sm text-status-error">
                        {registerForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-confirm">비밀번호 확인</Label>
                    <Input
                      id="register-confirm"
                      type="password"
                      placeholder="비밀번호 재입력"
                      {...registerForm.register("confirmPassword")}
                    />
                    {registerForm.formState.errors.confirmPassword && (
                      <p className="text-sm text-status-error">
                        {registerForm.formState.errors.confirmPassword.message}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="register-agree"
                      className="h-4 w-4 rounded border-input"
                      {...registerForm.register("agree")}
                    />
                    <Label
                      htmlFor="register-agree"
                      className="text-sm font-normal"
                    >
                      <a href="#" className="text-sage-500 hover:underline">
                        이용약관
                      </a>{" "}
                      및{" "}
                      <a href="#" className="text-sage-500 hover:underline">
                        개인정보처리방침
                      </a>
                      에 동의합니다
                    </Label>
                  </div>
                  {registerForm.formState.errors.agree && (
                    <p className="text-sm text-status-error">
                      {registerForm.formState.errors.agree.message}
                    </p>
                  )}

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isRegisterPending}
                  >
                    {isRegisterPending ? "가입 중..." : "회원가입"}
                  </Button>

                  {apiError && (
                    <p className="text-sm text-status-error text-center">
                      {apiError}
                    </p>
                  )}
                </form>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
