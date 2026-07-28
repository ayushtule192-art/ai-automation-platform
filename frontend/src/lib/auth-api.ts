import { publicFetch, apiFetch } from "./api-client";
import type {
  LoginInput,
  LoginResponse,
  MeResponse,
  RegisterInput,
  RegisterResponse,
  User,
} from "@/types/auth";

export async function login(input: LoginInput): Promise<LoginResponse> {
  return publicFetch<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function register(input: RegisterInput): Promise<RegisterResponse> {
  return publicFetch<RegisterResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function logout(): Promise<void> {
  try {
    await apiFetch<{ message: string }>("/api/auth/logout", { method: "POST" });
  } catch {
    // Clear local session even if server logout fails
  }
}

export async function getMe(): Promise<User> {
  const data = await apiFetch<MeResponse>("/api/auth/me");
  return data.user;
}

export async function forgotPassword(email: string): Promise<{ message: string }> {
  return publicFetch<{ message: string }>("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(
  token: string,
  password: string
): Promise<{ message: string }> {
  return publicFetch<{ message: string }>("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, password }),
  });
}
