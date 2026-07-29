import { API_URL } from "./constants";
import { useAuthStore } from "@/stores/auth-store";

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export class ApiClientError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  const json = (await response.json()) as ApiResponse<T> | ApiError;

  if (!response.ok || !json.success) {
    const error = json as ApiError;
    throw new ApiClientError(
      error.error?.message ?? "Request failed",
      response.status,
      error.error?.code
    );
  }

  return (json as ApiResponse<T>).data;
}

/** Refresh access token using httpOnly refresh cookie */
async function refreshAccessToken(): Promise<string> {
  const response = await fetch(`${API_URL}/api/auth/refresh`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });

  const data = await parseResponse<{ accessToken: string }>(response);
  useAuthStore.getState().setAccessToken(data.accessToken);
  return data.accessToken;
}

/** Authenticated fetch with automatic token refresh on 401 */
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  retry = true
): Promise<T> {
  const { accessToken } = useAuthStore.getState();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (response.status === 401 && retry && path !== "/api/auth/refresh") {
    try {
      const newToken = await refreshAccessToken();
      headers.Authorization = `Bearer ${newToken}`;
      const retryResponse = await fetch(`${API_URL}${path}`, {
        ...options,
        headers,
        credentials: "include",
      });
      return parseResponse<T>(retryResponse);
    } catch {
      useAuthStore.getState().clearAuth();
      throw new ApiClientError("Session expired", 401, "AUTH_TOKEN_EXPIRED");
    }
  }

  return parseResponse<T>(response);
}

/** Public fetch — no auth header */
export async function publicFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    },
    credentials: "include",
  });

  return parseResponse<T>(response);
}
