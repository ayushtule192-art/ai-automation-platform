"use client";

import { Bot, Loader2, User, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatMarkdown } from "./chat-markdown";
import type { ChatMessage } from "@/types/chat";

interface ChatMessageBubbleProps {
  message: ChatMessage;
  isStreaming?: boolean;
}

export function ChatMessageBubble({ message, isStreaming }: ChatMessageBubbleProps) {
  const isUser = message.role === "USER";
  const isTool = message.role === "FUNCTION";

  if (isTool) {
    return (
      <div className="flex gap-3 justify-center">
        <div className="flex items-center gap-2 rounded-lg border border-dashed px-3 py-2 text-xs text-muted-foreground">
          <Wrench className="h-3 w-3" />
          <span>Tool executed</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex gap-3", isUser ? "flex-row-reverse" : "")}>
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isUser ? "bg-primary text-primary-foreground" : "bg-muted"
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div
        className={cn(
          "rounded-lg px-4 py-2 max-w-[85%] text-sm",
          isUser ? "bg-primary text-primary-foreground" : "bg-muted"
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <>
            <ChatMarkdown content={message.content || (isStreaming ? "" : "…")} />
            {isStreaming && !message.content && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
            {isStreaming && message.content && (
              <span className="inline-block w-1 h-4 ml-0.5 bg-current animate-pulse align-middle" />
            )}
          </>
        )}
      </div>
    </div>
  );
}

interface ToolCallIndicatorProps {
  name: string;
  status: string;
}

export function ToolCallIndicator({ name, status }: ToolCallIndicatorProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 text-xs text-muted-foreground">
      <Wrench className="h-3 w-3" />
      <span>
        {status === "started" ? `Using ${name}…` : `Completed ${name}`}
      </span>
      {status === "started" && <Loader2 className="h-3 w-3 animate-spin" />}
    </div>
  );
}
