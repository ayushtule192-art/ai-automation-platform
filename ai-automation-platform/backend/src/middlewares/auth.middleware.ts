import type { NextFunction, Request, Response } from "express";
import type { UserRole } from "@prisma/client";
import { verifyAccessToken } from "../utils/jwt.util.js";
import { AppError } from "../utils/errors/app.error.js";

/**
 * Authenticates requests via Bearer JWT access token.
 * Attaches decoded user to req.user for downstream handlers.
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    next(AppError.unauthorized("Access token is required", "AUTH_TOKEN_MISSING"));
    return;
  }

  const token = authHeader.slice(7);

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role as UserRole,
    };
    next();
  } catch (error) {
    next(error);
  }
}

/** Optional auth — attaches user if token present, continues otherwise */
export function optionalAuthenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    next();
    return;
  }

  try {
    const payload = verifyAccessToken(authHeader.slice(7));
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role as UserRole,
    };
  } catch {
    // Ignore invalid tokens for optional auth
  }

  next();
}
