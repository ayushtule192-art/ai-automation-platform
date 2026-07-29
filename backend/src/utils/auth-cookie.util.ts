import type { CookieOptions, Request, Response } from "express";
import { jwtConfig } from "../config/jwt.config.js";
import { appConfig } from "../config/app.config.js";

const REFRESH_COOKIE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function getCookieOptions(maxAge?: number): CookieOptions {
  return {
    httpOnly: true,
    secure: appConfig.isProduction,
    sameSite: appConfig.isProduction ? "none" : "lax",
    path: "/",
    maxAge: maxAge ?? REFRESH_COOKIE_MAX_AGE_MS,
  };
}

export function setRefreshTokenCookie(res: Response, token: string, rememberMe = false): void {
  const maxAge = rememberMe ? REFRESH_COOKIE_MAX_AGE_MS : undefined;
  res.cookie(jwtConfig.refreshTokenCookieName, token, getCookieOptions(maxAge));
}

export function clearRefreshTokenCookie(res: Response): void {
  res.clearCookie(jwtConfig.refreshTokenCookieName, {
    httpOnly: true,
    secure: appConfig.isProduction,
    sameSite: appConfig.isProduction ? "none" : "lax",
    path: "/",
  });
}

export function getRefreshTokenFromRequest(req: Request): string | undefined {
  const cookieToken = req.cookies?.[jwtConfig.refreshTokenCookieName] as string | undefined;
  const bodyToken = (req.body as { refreshToken?: string })?.refreshToken;
  return cookieToken ?? bodyToken;
}

export function getRequestMeta(req: Request): { userAgent?: string; ipAddress?: string } {
  return {
    userAgent: req.headers["user-agent"],
    ipAddress: req.ip ?? req.socket.remoteAddress,
  };
}