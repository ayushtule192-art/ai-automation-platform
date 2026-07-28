/** Client-side session flag for Next.js middleware (cross-origin refresh cookie workaround) */
const SESSION_COOKIE = "has_session";

export function setSessionCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${SESSION_COOKIE}=1; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
}

export function clearSessionCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE;
