import { API_URL } from "./constants";
import { apiFetch } from "./api-client";
import { useAuthStore } from "@/stores/auth-store";
import type { VoiceSession, VoiceTurnResult } from "@/types/voice";

export async function getVoiceStatus(): Promise<{
  providers: { deepgram: boolean; openai: boolean; elevenlabs: boolean };
}> {
  return apiFetch("/api/voice/status");
}

export async function createVoiceSession(): Promise<{ session: VoiceSession }> {
  return apiFetch<{ session: VoiceSession }>("/api/voice/sessions", {
    method: "POST",
  });
}

export async function getVoiceSession(sessionId: string): Promise<{
  session: { id: string; title: string | null; status: string; createdAt: string };
  transcript: Array<{ id: string; role: string; content: string; createdAt: string }>;
}> {
  return apiFetch(`/api/voice/sessions/${sessionId}`);
}

export async function endVoiceSession(sessionId: string): Promise<{ message: string }> {
  return apiFetch(`/api/voice/sessions/${sessionId}`, { method: "DELETE" });
}

/** Send audio blob for a full STT → LLM → TTS turn */
export async function sendVoiceTurn(
  sessionId: string,
  audioBlob: Blob
): Promise<{ turn: VoiceTurnResult }> {
  const { accessToken } = useAuthStore.getState();

  const formData = new FormData();
  formData.append("audio", audioBlob, "recording.webm");

  const response = await fetch(`${API_URL}/api/voice/sessions/${sessionId}/turn`, {
    method: "POST",
    headers: {
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    credentials: "include",
    body: formData,
  });

  const json = (await response.json()) as {
    success: boolean;
    data?: { turn: VoiceTurnResult };
    error?: { message: string };
  };

  if (!response.ok || !json.success) {
    throw new Error(json.error?.message ?? "Voice turn failed");
  }

  return json.data as { turn: VoiceTurnResult };
}

/** Decode base64 MP3 and play via HTML Audio */
export function playAudioBase64(base64: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const audio = new Audio(`data:audio/mpeg;base64,${base64}`);
    audio.onended = () => resolve();
    audio.onerror = () => reject(new Error("Failed to play audio"));
    void audio.play().catch(reject);
  });
}
