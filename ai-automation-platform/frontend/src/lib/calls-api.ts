import { API_URL } from "./constants";
import { apiFetch } from "./api-client";
import { useAuthStore } from "@/stores/auth-store";
import type { CallAnalytics, CallRecord } from "@/types/calls";

export async function getCallsStatus(): Promise<{ configured: boolean }> {
  return apiFetch("/api/calls/status");
}

export async function listCalls(): Promise<{ calls: CallRecord[] }> {
  return apiFetch("/api/calls");
}

export async function getCall(callId: string): Promise<{ call: CallRecord }> {
  return apiFetch(`/api/calls/${callId}`);
}

export async function getCallAnalytics(): Promise<{ analytics: CallAnalytics }> {
  return apiFetch("/api/calls/analytics");
}

export async function cancelCall(callId: string): Promise<{ message: string }> {
  return apiFetch(`/api/calls/${callId}`, { method: "DELETE" });
}

/** Upload CSV and schedule outbound calls */
export async function uploadAndScheduleCalls(
  file: File,
  scheduledAt: string
): Promise<{ scheduled: number; callIds: string[] }> {
  const { accessToken } = useAuthStore.getState();

  const formData = new FormData();
  formData.append("csv", file);
  formData.append("scheduledAt", scheduledAt);

  const response = await fetch(`${API_URL}/api/calls/upload`, {
    method: "POST",
    headers: {
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    credentials: "include",
    body: formData,
  });

  const json = (await response.json()) as {
    success: boolean;
    data?: { scheduled: number; callIds: string[] };
    error?: { message: string };
  };

  if (!response.ok || !json.success) {
    throw new Error(json.error?.message ?? "Failed to schedule calls");
  }

  return json.data as { scheduled: number; callIds: string[] };
}
