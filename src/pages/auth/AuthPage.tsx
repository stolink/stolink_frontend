import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PenLine, Eye, EyeOff } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthStore } from '@/stores';

// Validation schemas
const loginSchema = z.object({
  email: z.string().email('유효한 이메일을 입력하세요'),
  password: z.string().min(1, '비밀번호를 입력하세요'),
});

const registerSchema = z.object({
  email: z.string().email('유효한 이메일을 입력하세요'),
  password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다'),
  confirmPassword: z.string(),
  nickname: z.string().min(2, '닉네임은 2자 이상이어야 합니다').max(20, '닉네임은 20자 이하여야 합니다'),
  agree: z.boolean().refine((val) => val === true, '이용약관에 동의해주세요'),
}).refine((data) => data.password === data.confirmPassword, {
  message: '비밀번호가 일치하지 않습니다',
  path: ['confirmPassword'],
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', password: '', confirmPassword: '', nickname: '', agree: false },
  });

  const onLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      // Mock login - replace with actual API call
      console.log('Login:', data);

      // Simulate API response
      const mockUser = {
        id: '1',
        email: data.email,
        nickname: '작가님',
        createdAt: new Date().toISOString(),
      };

      setUser(mockUser, 'mock-access-token');
      navigate('/library');
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRegister = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      // Mock register - replace with actual API call
      console.log('Register:', data);

      // Simulate API response
      const mockUser = {
        id: '1',
        email: data.email,
        nickname: data.nickname,
        createdAt: new Date().toISOString(),
      };

      setUser(mockUser, 'mock-access-token');
      navigate('/library');
    } catch (error) {
      console.error('Register failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <PenLine className="h-8 w-8 text-sage-500" />
          <span className="text-3xl font-heading font-bold text-ink">Sto-link</span>
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
                <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">이메일</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="name@example.com"
                      {...loginForm.register('email')}
                    />
                    {loginForm.formState.errors.email && (
                      <p className="text-sm text-status-error">{loginForm.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">비밀번호</Label>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        {...loginForm.register('password')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {loginForm.formState.errors.password && (
                      <p className="text-sm text-status-error">{loginForm.formState.errors.password.message}</p>
                    )}
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? '로그인 중...' : '로그인'}
                  </Button>

                  <p className="text-center text-sm text-muted-foreground">
                    <a href="#" className="hover:text-sage-500">비밀번호를 잊으셨나요?</a>
                  </p>
                </form>
              </TabsContent>

              {/* Register Tab */}
              <TabsContent value="register">
                <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-email">이메일</Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="name@example.com"
                      {...registerForm.register('email')}
                    />
                    {registerForm.formState.errors.email && (
                      <p className="text-sm text-status-error">{registerForm.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-nickname">닉네임 (필명)</Label>
                    <Input
                      id="register-nickname"
                      placeholder="작가의 이름"
                      {...registerForm.register('nickname')}
                    />
                    {registerForm.formState.errors.nickname && (
                      <p className="text-sm text-status-error">{registerForm.formState.errors.nickname.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-password">비밀번호</Label>
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="8자 이상"
                      {...registerForm.register('password')}
                    />
                    {registerForm.formState.errors.password && (
                      <p className="text-sm text-status-error">{registerForm.formState.errors.password.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-confirm">비밀번호 확인</Label>
                    <Input
                      id="register-confirm"
                      type="password"
                      placeholder="비밀번호 재입력"
                      {...registerForm.register('confirmPassword')}
                    />
                    {registerForm.formState.errors.confirmPassword && (
                      <p className="text-sm text-status-error">{registerForm.formState.errors.confirmPassword.message}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="register-agree"
                      className="h-4 w-4 rounded border-input"
                      {...registerForm.register('agree')}
                    />
                    <Label htmlFor="register-agree" className="text-sm font-normal">
                      <a href="#" className="text-sage-500 hover:underline">이용약관</a> 및{' '}
                      <a href="#" className="text-sage-500 hover:underline">개인정보처리방침</a>에 동의합니다
                    </Label>
                  </div>
                  {registerForm.formState.errors.agree && (
                    <p className="text-sm text-status-error">{registerForm.formState.errors.agree.message}</p>
                  )}

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? '가입 중...' : '회원가입'}
                  </Button>
                </form>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
