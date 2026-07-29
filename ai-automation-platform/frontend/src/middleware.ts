import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_ROUTES, PROTECTED_ROUTES, REFRESH_TOKEN_COOKIE } from "@/lib/dashboard-nav";
import { SESSION_COOKIE_NAME } from "@/lib/session-cookie";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession =
    request.cookies.has(REFRESH_TOKEN_COOKIE) || request.cookies.has(SESSION_COOKIE_NAME);

  const isProtected = PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname === route);

  if (isProtected && !hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/voice-agent/:path*",
    "/calling-agent/:path*",
    "/chat-agent/:path*",
    "/analytics/:path*",
    "/settings/:path*",
    "/profile/:path*",
    "/customers/:path*",
    "/orders/:path*",
    "/call-logs/:path*",
    "/conversations/:path*",
    "/login",
    "/signup",
    "/forgot-password",
  ],
};
