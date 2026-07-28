export type MessageRole = "USER" | "ASSISTANT" | "SYSTEM" | "FUNCTION";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  toolCalls?: unknown;
  createdAt: string;
}

export interface ConversationSummary {
  id: string;
  title: string;
  status: string;
  agentType: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationDetail {
  conversation: {
    id: string;
    title: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  };
  messages: ChatMessage[];
}

export type ChatStreamEvent =
  | { event: "token"; data: { content: string } }
  | { event: "tool_call"; data: { name: string; status: string; result?: string } }
  | { event: "done"; data: { conversationId: string; messageId: string; title?: string; tokensUsed?: number } }
  | { event: "error"; data: { message: string } };
