import { env } from "./env.js";

export const jwtConfig = {
  accessSecret: env.JWT_ACCESS_SECRET,
  refreshSecret: env.JWT_REFRESH_SECRET,
  accessExpiresIn: env.JWT_ACCESS_EXPIRES_IN,
  refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
  /** Cookie name for refresh token (httpOnly) */
  refreshTokenCookieName: "refresh_token",
  /** Algorithm used for signing tokens */
  algorithm: "HS256" as const,
  /** Issuer claim */
  issuer: "ai-automation-platform",
  /** Audience claim */
  audience: "ai-automation-platform-api",
} as const;

export type JwtConfig = typeof jwtConfig;

/** Payload shape embedded in JWT access tokens */
export interface JwtAccessPayload {
  sub: string;
  email: string;
  role: string;
  type: "access";
}

/** Payload shape embedded in JWT refresh tokens */
export interface JwtRefreshPayload {
  sub: string;
  tokenId: string;
  type: "refresh";
}
