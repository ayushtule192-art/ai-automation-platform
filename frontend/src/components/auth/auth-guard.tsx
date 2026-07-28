"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { getMe } from "@/lib/auth-api";
import { setSessionCookie } from "@/lib/session-cookie";
import { Skeleton } from "@/components/ui/skeleton";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { accessToken, user, isHydrated, setAuth, clearAuth, setHydrated } = useAuthStore();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!useAuthStore.getState().isHydrated) {
        setHydrated(true);
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [setHydrated]);

  useEffect(() => {
    if (!isHydrated) return;

    async function verifySession() {
      if (!accessToken) {
        router.replace("/login");
        return;
      }

      try {
        const profile = await getMe();
        setAuth(profile, accessToken);
        setSessionCookie();
      } catch {
        clearAuth();
        router.replace("/login");
      }
    }

    void verifySession();
  }, [isHydrated, accessToken, router, setAuth, clearAuth, user?.id]);

  if (!isHydrated || !accessToken) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="space-y-4 w-full max-w-md p-8">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
