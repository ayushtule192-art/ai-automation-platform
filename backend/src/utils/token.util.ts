import { createHash, randomBytes } from "node:crypto";

/** Generate a cryptographically secure random token */
export function generateSecureToken(byteLength = 32): string {
  return randomBytes(byteLength).toString("hex");
}

/** SHA-256 hash for storing opaque tokens (refresh, password reset) */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
