import { API_URL } from "./constants";
import { apiFetch } from "./api-client";
import { useAuthStore } from "@/stores/auth-store";
import type {
  ChatStreamEvent,
  ConversationDetail,
  ConversationSummary,
} from "@/types/chat";

export async function listConversations(): Promise<{ conversations: ConversationSummary[] }> {
  return apiFetch<{ conversations: ConversationSummary[] }>("/api/chat/conversations");
}

export async function getConversation(id: string): Promise<ConversationDetail> {
  return apiFetch<ConversationDetail>(`/api/chat/conversations/${id}`);
}

export async function createConversation(
  title?: string
): Promise<{ conversation: ConversationSummary }> {
  return apiFetch<{ conversation: ConversationSummary }>("/api/chat/conversations", {
    method: "POST",
    body: JSON.stringify({ title }),
  });
}

export async function archiveConversation(id: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/api/chat/conversations/${id}`, {
    method: "DELETE",
  });
}

/** Parse SSE stream from the chat messages endpoint */
function parseSSEBuffer(
  buffer: string,
  onEvent: (event: ChatStreamEvent) => void
): string {
  const parts = buffer.split("\n\n");
  const remaining = parts.pop() ?? "";

  for (const part of parts) {
    if (!part.trim()) continue;

    let eventType = "message";
    let data = "";

    for (const line of part.split("\n")) {
      if (line.startsWith("event: ")) eventType = line.slice(7);
      if (line.startsWith("data: ")) data = line.slice(6);
    }

    if (data) {
      try {
        const parsed = JSON.parse(data) as Record<string, unknown>;
        onEvent({ event: eventType, data: parsed } as ChatStreamEvent);
      } catch {
        // skip malformed events
      }
    }
  }

  return remaining;
}

/** Stream a chat message and receive SSE events */
export async function streamChatMessage(
  conversationId: string,
  content: string,
  onEvent: (event: ChatStreamEvent) => void,
  signal?: AbortSignal
): Promise<void> {
  const { accessToken } = useAuthStore.getState();

  const response = await fetch(
    `${API_URL}/api/chat/conversations/${conversationId}/messages`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      credentials: "include",
      body: JSON.stringify({ content }),
      signal,
    }
  );

  if (!response.ok) {
    const json = (await response.json()) as { error?: { message?: string } };
    throw new Error(json.error?.message ?? "Failed to send message");
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response stream");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    buffer = parseSSEBuffer(buffer, onEvent);
  }

  if (buffer.trim()) {
    parseSSEBuffer(`${buffer}\n\n`, onEvent);
  }
}
