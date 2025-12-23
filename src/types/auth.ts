// Auth Types
export interface User {
  id: string;
  email: string;
  nickname: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  nickname: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}
