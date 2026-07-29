import type { User } from "@prisma/client";
import type {
  AuthResponseDto,
  ForgotPasswordResponseDto,
  MessageResponseDto,
  RefreshResponseDto,
  UserResponseDto,
} from "../../dtos/auth/auth.dto.js";
import {
  passwordResetRepository,
  refreshTokenRepository,
  userRepository,
} from "../../repositories/auth/index.js";
import type {
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
} from "../../validators/auth/auth.validator.js";
import { jwtConfig } from "../../config/jwt.config.js";
import { env, isDevelopment } from "../../config/env.js";
import { logger } from "../../lib/logger.js";
import {
  AppError,
  addDuration,
  comparePassword,
  generateSecureToken,
  hashPassword,
  hashToken,
  signAccessToken,
} from "../../utils/index.js";

const PASSWORD_RESET_EXPIRY = "1h";
const REMEMBER_ME_REFRESH_EXPIRY = "30d";

interface RequestMeta {
  userAgent?: string;
  ipAddress?: string;
}

export class AuthService {
  readonly serviceName = "AuthService";

  async register(input: RegisterInput, meta: RequestMeta = {}): Promise<AuthResponseDto> {
    const emailExists = await userRepository.emailExists(input.email);
    if (emailExists) {
      throw AppError.conflict("Email is already registered", "AUTH_EMAIL_EXISTS");
    }

    const passwordHash = await hashPassword(input.password);
    const user = await userRepository.create({
      email: input.email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
    });

    const tokens = await this.issueTokenPair(user, false, meta);

    logger.info("User registered", { userId: user.id, email: user.email });

    return {
      user: this.toUserDto(user),
      tokens,
    };
  }

  async login(input: LoginInput, meta: RequestMeta = {}): Promise<AuthResponseDto> {
    const user = await userRepository.findByEmail(input.email);

    if (!user || !(await comparePassword(input.password, user.passwordHash))) {
      throw AppError.unauthorized("Invalid email or password", "AUTH_INVALID_CREDENTIALS");
    }

    if (!user.isActive) {
      throw AppError.forbidden("Account is deactivated", "AUTH_USER_INACTIVE");
    }

    await userRepository.updateLastLogin(user.id);
    const tokens = await this.issueTokenPair(user, input.rememberMe, meta);

    logger.info("User logged in", { userId: user.id });

    return {
      user: this.toUserDto({ ...user, lastLoginAt: new Date() }),
      tokens,
    };
  }

  async refresh(rawRefreshToken: string, meta: RequestMeta = {}): Promise<RefreshResponseDto> {
    if (!rawRefreshToken) {
      throw AppError.unauthorized("Refresh token is required", "AUTH_TOKEN_MISSING");
    }

    const tokenHash = hashToken(rawRefreshToken);
    const storedToken = await refreshTokenRepository.findValidByTokenHash(tokenHash);

    if (!storedToken) {
      throw AppError.unauthorized("Invalid or expired refresh token", "AUTH_TOKEN_INVALID");
    }

    const user = await userRepository.findById(storedToken.userId);
    if (!user || !user.isActive) {
      throw AppError.unauthorized("User not found or inactive", "AUTH_USER_INACTIVE");
    }

    // Rotate refresh token — revoke old, issue new
    await refreshTokenRepository.revoke(storedToken.id);
    const tokens = await this.issueTokenPair(user, false, meta);

    return tokens;
  }

  async logout(rawRefreshToken?: string, userId?: string): Promise<MessageResponseDto> {
    if (rawRefreshToken) {
      await refreshTokenRepository.revokeByTokenHash(hashToken(rawRefreshToken));
    }

    if (userId) {
      await refreshTokenRepository.revokeAllForUser(userId);
    }

    return { message: "Logged out successfully" };
  }

  async forgotPassword(input: ForgotPasswordInput): Promise<ForgotPasswordResponseDto> {
    const genericMessage =
      "If an account with that email exists, a password reset link has been sent.";

    const user = await userRepository.findByEmail(input.email);
    if (!user) {
      return { message: genericMessage };
    }

    await passwordResetRepository.invalidateExisting(user.email);

    const rawToken = generateSecureToken(32);
    const tokenHash = hashToken(rawToken);

    await passwordResetRepository.create({
      email: user.email,
      token: tokenHash,
      expiresAt: addDuration(new Date(), PASSWORD_RESET_EXPIRY),
    });

    // Email delivery will be wired to BullMQ in the notification module
    logger.info("Password reset token created", {
      email: user.email,
      resetLink: `${env.FRONTEND_URL}/reset-password?token=${rawToken}`,
    });

    const response: ForgotPasswordResponseDto = { message: genericMessage };

    // Expose token in development only for testing without email
    if (isDevelopment) {
      response.resetToken = rawToken;
    }

    return response;
  }

  async resetPassword(input: ResetPasswordInput): Promise<MessageResponseDto> {
    const tokenHash = hashToken(input.token);
    const resetToken = await passwordResetRepository.findValidByTokenHash(tokenHash);

    if (!resetToken) {
      throw AppError.badRequest("Invalid or expired reset token", "AUTH_RESET_TOKEN_INVALID");
    }

    const user = await userRepository.findByEmail(resetToken.email);
    if (!user) {
      throw AppError.notFound("User not found", "AUTH_USER_NOT_FOUND");
    }

    const passwordHash = await hashPassword(input.password);
    await userRepository.updatePassword(user.id, passwordHash);
    await passwordResetRepository.markUsed(resetToken.id);
    await refreshTokenRepository.revokeAllForUser(user.id);

    logger.info("Password reset completed", { userId: user.id });

    return { message: "Password has been reset successfully" };
  }

  async getProfile(userId: string): Promise<UserResponseDto> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw AppError.notFound("User not found", "AUTH_USER_NOT_FOUND");
    }
    return this.toUserDto(user);
  }

  private async issueTokenPair(
    user: User,
    rememberMe: boolean,
    meta: RequestMeta
  ): Promise<{ accessToken: string; refreshToken: string; expiresIn: string }> {
    const accessToken = signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    const rawRefreshToken = generateSecureToken(48);
    const refreshExpiry = rememberMe ? REMEMBER_ME_REFRESH_EXPIRY : jwtConfig.refreshExpiresIn;

    await refreshTokenRepository.create({
      token: hashToken(rawRefreshToken),
      userId: user.id,
      expiresAt: addDuration(new Date(), refreshExpiry),
      userAgent: meta.userAgent,
      ipAddress: meta.ipAddress,
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      expiresIn: jwtConfig.accessExpiresIn,
    };
  }

  private toUserDto(user: User): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
      avatarUrl: user.avatarUrl,
      lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
      createdAt: user.createdAt.toISOString(),
    };
  }
}

export const authService = new AuthService();
