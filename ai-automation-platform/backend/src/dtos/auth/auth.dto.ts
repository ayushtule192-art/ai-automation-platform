import type { UserRole } from "@prisma/client";

/** Safe user fields returned to clients — never expose passwordHash */
export interface UserResponseDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  emailVerified: boolean;
  avatarUrl: string | null;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface AuthTokensResponseDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface AuthResponseDto {
  user: UserResponseDto;
  tokens: AuthTokensResponseDto;
}

export interface RefreshResponseDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface MessageResponseDto {
  message: string;
}

/** Dev-only: exposes reset token when email is not configured */
export interface ForgotPasswordResponseDto {
  message: string;
  resetToken?: string;
}
