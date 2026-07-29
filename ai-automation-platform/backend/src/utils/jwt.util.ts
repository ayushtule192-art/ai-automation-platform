import jwt, { type SignOptions } from "jsonwebtoken";
import { jwtConfig, type JwtAccessPayload, type JwtRefreshPayload } from "../config/jwt.config.js";
import { AppError } from "./errors/app.error.js";

const signOptions: SignOptions = {
  algorithm: jwtConfig.algorithm,
  issuer: jwtConfig.issuer,
  audience: jwtConfig.audience,
};

/** Sign a short-lived access token */
export function signAccessToken(payload: Omit<JwtAccessPayload, "type">): string {
  const tokenPayload: JwtAccessPayload = { ...payload, type: "access" };
  return jwt.sign(tokenPayload, jwtConfig.accessSecret, {
    ...signOptions,
    expiresIn: jwtConfig.accessExpiresIn as SignOptions["expiresIn"],
  });
}

/** Sign a refresh JWT (optional layer on top of opaque DB token) */
export function signRefreshToken(payload: Omit<JwtRefreshPayload, "type">): string {
  const tokenPayload: JwtRefreshPayload = { ...payload, type: "refresh" };
  return jwt.sign(tokenPayload, jwtConfig.refreshSecret, {
    ...signOptions,
    expiresIn: jwtConfig.refreshExpiresIn as SignOptions["expiresIn"],
  });
}

/** Verify and decode an access token */
export function verifyAccessToken(token: string): JwtAccessPayload {
  try {
    const decoded = jwt.verify(token, jwtConfig.accessSecret, {
      algorithms: [jwtConfig.algorithm],
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience,
    });

    if (typeof decoded === "string" || decoded.type !== "access") {
      throw AppError.unauthorized("Invalid access token", "AUTH_TOKEN_INVALID");
    }

    return decoded as JwtAccessPayload;
  } catch (error) {
    if (error instanceof AppError) throw error;

    if (error instanceof jwt.TokenExpiredError) {
      throw AppError.unauthorized("Access token expired", "AUTH_TOKEN_EXPIRED");
    }

    throw AppError.unauthorized("Invalid access token", "AUTH_TOKEN_INVALID");
  }
}

/** Verify and decode a refresh JWT */
export function verifyRefreshToken(token: string): JwtRefreshPayload {
  try {
    const decoded = jwt.verify(token, jwtConfig.refreshSecret, {
      algorithms: [jwtConfig.algorithm],
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience,
    });

    if (typeof decoded === "string" || decoded.type !== "refresh") {
      throw AppError.unauthorized("Invalid refresh token", "AUTH_TOKEN_INVALID");
    }

    return decoded as JwtRefreshPayload;
  } catch (error) {
    if (error instanceof AppError) throw error;

    if (error instanceof jwt.TokenExpiredError) {
      throw AppError.unauthorized("Refresh token expired", "AUTH_TOKEN_EXPIRED");
    }

    throw AppError.unauthorized("Invalid refresh token", "AUTH_TOKEN_INVALID");
  }
}
