"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ChatMessageBubble, ToolCallIndicator } from "@/components/chat/chat-message";
import { PageHeader } from "@/components/dashboard/page-header";
import { cn } from "@/lib/utils";
import {
  archiveConversation,
  createConversation,
  getConversation,
  listConversations,
  streamChatMessage,
} from "@/lib/chat-api";
import type { ChatMessage, ConversationSummary } from "@/types/chat";

const WELCOME: ChatMessage = {
  id: "welcome",
  role: "ASSISTANT",
  content:
    "Hello! I'm your AI chat agent. I can help with customer support, product questions, scheduling demos, and more. How can I assist you?",
  createdAt: new Date().toISOString(),
};

export function ChatAgentPanel({ initialConversationId }: { initialConversationId?: string }) {
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(initialConversationId ?? null);
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [toolStatus, setToolStatus] = useState<{ name: string; status: string } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const { data: conversationsData, isLoading: loadingList } = useQuery({
    queryKey: ["chat", "conversations"],
    queryFn: listConversations,
  });

  const { data: conversationData, isLoading: loadingConversation } = useQuery({
    queryKey: ["chat", "conversation", activeId],
    queryFn: () => getConversation(activeId!),
    enabled: Boolean(activeId),
  });

  useEffect(() => {
    if (conversationData?.messages) {
      const visible = conversationData.messages.filter((m) => m.role !== "FUNCTION");
      setLocalMessages(visible.length > 0 ? visible : [WELCOME]);
    }
  }, [conversationData]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [localMessages, toolStatus]);

  const createMutation = useMutation({
    mutationFn: () => createConversation(),
    onSuccess: (data) => {
      setActiveId(data.conversation.id);
      setLocalMessages([WELCOME]);
      void queryClient.invalidateQueries({ queryKey: ["chat", "conversations"] });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => archiveConversation(id),
    onSuccess: () => {
      setActiveId(null);
      setLocalMessages([WELCOME]);
      void queryClient.invalidateQueries({ queryKey: ["chat", "conversations"] });
    },
  });

  const handleNewChat = () => {
    createMutation.mutate();
  };

  const handleSelectConversation = (id: string) => {
    if (isStreaming) return;
    setActiveId(id);
  };

  const sendMessage = useCallback(
    async (text: string) => {
      let conversationId = activeId;

      if (!conversationId) {
        const created = await createConversation();
        conversationId = created.conversation.id;
        setActiveId(conversationId);
        void queryClient.invalidateQueries({ queryKey: ["chat", "conversations"] });
      }

      const userMsg: ChatMessage = {
        id: `temp-user-${Date.now()}`,
        role: "USER",
        content: text,
        createdAt: new Date().toISOString(),
      };

      const assistantId = `temp-assistant-${Date.now()}`;
      const assistantMsg: ChatMessage = {
        id: assistantId,
        role: "ASSISTANT",
        content: "",
        createdAt: new Date().toISOString(),
      };

      setLocalMessages((prev) => [...prev.filter((m) => m.id !== "welcome"), userMsg, assistantMsg]);
      setIsStreaming(true);
      setToolStatus(null);

      abortRef.current = new AbortController();

      try {
        await streamChatMessage(
          conversationId,
          text,
          (event) => {
            if (event.event === "token") {
              setLocalMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, content: m.content + event.data.content }
                    : m
                )
              );
            } else if (event.event === "tool_call") {
              setToolStatus({ name: event.data.name, status: event.data.status });
            } else if (event.event === "done") {
              setLocalMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, id: event.data.messageId } : m
                )
              );
              void queryClient.invalidateQueries({ queryKey: ["chat", "conversations"] });
              void queryClient.invalidateQueries({
                queryKey: ["chat", "conversation", conversationId],
              });
            } else if (event.event === "error") {
              setLocalMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, content: `Error: ${event.data.message}` }
                    : m
                )
              );
            }
          },
          abortRef.current.signal
        );
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setLocalMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: `Error: ${(error as Error).message}` }
                : m
            )
          );
        }
      } finally {
        setIsStreaming(false);
        setToolStatus(null);
      }
    },
    [activeId, queryClient]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput("");
    await sendMessage(text);
  }

  const conversations = conversationsData?.conversations ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Chat Agent"
        description="OpenAI-powered chat with streaming, memory, and function calling"
      >
        <Button onClick={handleNewChat} disabled={createMutation.isPending || isStreaming}>
          <Plus className="mr-2 h-4 w-4" />
          New Chat
        </Button>
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-[260px_1fr] h-[calc(100vh-14rem)]">
        {/* Conversation history sidebar */}
        <Card className="hidden lg:flex flex-col overflow-hidden">
          <CardHeader className="py-3 px-4 border-b shrink-0">
            <CardTitle className="text-sm">History</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-2 space-y-1">
            {loadingList ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))
            ) : conversations.length === 0 ? (
              <p className="text-xs text-muted-foreground p-2">No conversations yet</p>
            ) : (
              conversations.map((conv: ConversationSummary) => (
                <button
                  key={conv.id}
                  type="button"
                  onClick={() => handleSelectConversation(conv.id)}
                  className={cn(
                    "w-full text-left rounded-md px-3 py-2 text-sm truncate transition-colors",
                    activeId === conv.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent"
                  )}
                >
                  {conv.title}
                </button>
              ))
            )}
          </CardContent>
        </Card>

        {/* Chat area */}
        <Card className="flex flex-col overflow-hidden min-h-0">
          <CardHeader className="border-b shrink-0 py-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">
                  {conversationData?.conversation.title ??
                    (activeId ? "Conversation" : "New Conversation")}
                </CardTitle>
                <CardDescription className="text-xs">
                  GPT-4o · Streaming · Function calling
                </CardDescription>
              </div>
              {activeId && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => archiveMutation.mutate(activeId)}
                  disabled={archiveMutation.isPending || isStreaming}
                  title="Archive conversation"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="flex flex-1 flex-col p-0 min-h-0">
            {loadingConversation && activeId ? (
              <div className="flex-1 p-4 space-y-4">
                <Skeleton className="h-16 w-3/4" />
                <Skeleton className="h-16 w-1/2 ml-auto" />
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {localMessages.map((message) => (
                  <ChatMessageBubble
                    key={message.id}
                    message={message}
                    isStreaming={
                      isStreaming &&
                      message.role === "ASSISTANT" &&
                      message.id === localMessages[localMessages.length - 1]?.id
                    }
                  />
                ))}
                {toolStatus && (
                  <ToolCallIndicator name={toolStatus.name} status={toolStatus.status} />
                )}
                <div ref={bottomRef} />
              </div>
            )}

            <form onSubmit={handleSubmit} className="border-t p-4 flex gap-2 shrink-0">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything — try 'What are your pricing plans?' or 'Schedule a demo'"
                disabled={isStreaming}
                className="flex-1"
              />
              <Button type="submit" disabled={isStreaming || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
