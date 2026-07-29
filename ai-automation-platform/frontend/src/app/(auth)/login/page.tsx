import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Login",
};

function LoginFallback() {
  return (
    <div className="w-full max-w-md space-y-4">
      <Skeleton className="h-8 w-48 mx-auto" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}
