import type { Response } from "express";
import type OpenAI from "openai";
import type { Message, MessageRole } from "@prisma/client";
import { CHAT_SYSTEM_PROMPT } from "../../agents/chat/chat.prompt.js";
import { CHAT_TOOLS, executeChatTool, type ToolCallInput } from "../../agents/chat/chat.tools.js";
import {
  CHAT_MAX_TOKENS,
  CHAT_MODEL,
  CHAT_TEMPERATURE,
  getOpenAIClient,
} from "../../agents/chat/openai.client.js";
import { prisma } from "../../lib/prisma.js";
import { logger } from "../../lib/logger.js";
import { conversationRepository } from "../../repositories/conversations/conversation.repository.js";
import type { AuthenticatedUser } from "../../types/index.js";
import { AppError } from "../../utils/errors/app.error.js";

const MAX_TOOL_ROUNDS = 5;

export interface StreamEvent {
  event: "token" | "tool_call" | "done" | "error";
  data: Record<string, unknown>;
}

/** Write a Server-Sent Event to the response stream */
export function writeSSE(res: Response, event: StreamEvent): void {
  res.write(`event: ${event.event}\n`);
  res.write(`data: ${JSON.stringify(event.data)}\n\n`);
}

export class ChatService {
  readonly serviceName = "ChatService";

  async listConversations(user: AuthenticatedUser) {
    const conversations = await conversationRepository.listByUser(user.id);
    return conversations.map((c) => ({
      id: c.id,
      title: c.title ?? "New conversation",
      status: c.status,
      agentType: c.agentType,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    }));
  }

  async getConversation(user: AuthenticatedUser, conversationId: string) {
    const conversation = await conversationRepository.findByIdForUser(
      conversationId,
      user.id
    );
    if (!conversation) {
      throw AppError.notFound("Conversation not found", "CONVERSATION_NOT_FOUND");
    }

    const messages = await conversationRepository.getMessages(conversationId);

    return {
      conversation: {
        id: conversation.id,
        title: conversation.title ?? "New conversation",
        status: conversation.status,
        createdAt: conversation.createdAt.toISOString(),
        updatedAt: conversation.updatedAt.toISOString(),
      },
      messages: messages.map((m) => this.toMessageDto(m)),
    };
  }

  async createConversation(user: AuthenticatedUser, title?: string) {
    const conversation = await conversationRepository.create(user.id, title);
    return {
      id: conversation.id,
      title: conversation.title ?? "New conversation",
      status: conversation.status,
      createdAt: conversation.createdAt.toISOString(),
    };
  }

  async archiveConversation(user: AuthenticatedUser, conversationId: string) {
    const conversation = await conversationRepository.findByIdForUser(
      conversationId,
      user.id
    );
    if (!conversation) {
      throw AppError.notFound("Conversation not found", "CONVERSATION_NOT_FOUND");
    }
    await conversationRepository.archive(conversationId, user.id);
    return { message: "Conversation archived" };
  }

  /** Stream an AI response via SSE, persisting messages to the database */
  async streamMessage(
    user: AuthenticatedUser,
    conversationId: string,
    content: string,
    res: Response
  ): Promise<void> {
    const conversation = await conversationRepository.findByIdForUser(
      conversationId,
      user.id
    );
    if (!conversation) {
      writeSSE(res, { event: "error", data: { message: "Conversation not found" } });
      res.end();
      return;
    }

    // Persist user message
    await conversationRepository.addMessage({
      conversationId,
      role: "USER",
      content,
    });

    const isFirstMessage = (await conversationRepository.countMessages(conversationId)) === 1;

    const dbMessages = await conversationRepository.getMessages(conversationId);
    const openaiMessages = this.buildOpenAIMessages(dbMessages);

    let totalTokens = 0;
    let finalAssistantContent = "";

    try {
      const openai = getOpenAIClient();

      for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
        const stream = await openai.chat.completions.create({
          model: CHAT_MODEL,
          messages: openaiMessages,
          tools: CHAT_TOOLS,
          tool_choice: "auto",
          temperature: CHAT_TEMPERATURE,
          max_tokens: CHAT_MAX_TOKENS,
          stream: true,
          stream_options: { include_usage: true },
        });

        let assistantContent = "";
        const toolCallAccum: Map<number, ToolCallInput> = new Map();
        let finishReason: string | null = null;
        let roundTokens = 0;

        for await (const chunk of stream) {
          const choice = chunk.choices[0];
          if (!choice) continue;

          finishReason = choice.finish_reason ?? finishReason;
          const delta = choice.delta;

          if (delta.content) {
            assistantContent += delta.content;
            writeSSE(res, { event: "token", data: { content: delta.content } });
          }

          if (delta.tool_calls) {
            for (const tc of delta.tool_calls) {
              const idx = tc.index;
              if (!toolCallAccum.has(idx)) {
                toolCallAccum.set(idx, {
                  id: tc.id ?? "",
                  name: tc.function?.name ?? "",
                  arguments: "",
                });
              }
              const acc = toolCallAccum.get(idx)!;
              if (tc.id) acc.id = tc.id;
              if (tc.function?.name) acc.name = tc.function.name;
              if (tc.function?.arguments) acc.arguments += tc.function.arguments;
            }
          }

          if (chunk.usage) {
            roundTokens = chunk.usage.total_tokens;
          }
        }

        totalTokens += roundTokens;

        const toolCalls = Array.from(toolCallAccum.values()).filter((t) => t.name);

        if (toolCalls.length > 0 && finishReason === "tool_calls") {
          // Save assistant message with tool calls
          await conversationRepository.addMessage({
            conversationId,
            role: "ASSISTANT",
            content: assistantContent || "",
            toolCalls: toolCalls.map((t) => ({
              id: t.id,
              name: t.name,
              arguments: t.arguments,
            })),
          });

          openaiMessages.push({
            role: "assistant",
            content: assistantContent || null,
            tool_calls: toolCalls.map((t) => ({
              id: t.id,
              type: "function" as const,
              function: { name: t.name, arguments: t.arguments },
            })),
          });

          // Execute tools and append results
          for (const toolCall of toolCalls) {
            writeSSE(res, {
              event: "tool_call",
              data: { name: toolCall.name, status: "started" },
            });

            const result = await executeChatTool(toolCall.name, toolCall.arguments);

            writeSSE(res, {
              event: "tool_call",
              data: { name: toolCall.name, status: "completed", result },
            });

            await conversationRepository.addMessage({
              conversationId,
              role: "FUNCTION",
              content: result,
              toolCalls: { tool_call_id: toolCall.id, name: toolCall.name },
            });

            openaiMessages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: result,
            });
          }

          continue;
        }

        // Final assistant response
        finalAssistantContent = assistantContent;
        const savedMessage = await conversationRepository.addMessage({
          conversationId,
          role: "ASSISTANT",
          content: assistantContent,
          tokenCount: roundTokens,
        });

        await conversationRepository.touchConversation(conversationId);

        // Auto-title from first user message
        let title: string | undefined;
        if (isFirstMessage && !conversation.title) {
          title = content.slice(0, 60) + (content.length > 60 ? "…" : "");
          await conversationRepository.updateTitle(conversationId, title);
        }

        // Track analytics
        await prisma.analyticsEvent.create({
          data: {
            userId: user.id,
            eventType: "CHAT_MESSAGE",
            tokensUsed: totalTokens,
            payload: { conversationId, model: CHAT_MODEL },
          },
        });

        writeSSE(res, {
          event: "done",
          data: {
            conversationId,
            messageId: savedMessage.id,
            title,
            tokensUsed: totalTokens,
          },
        });

        break;
      }
    } catch (error) {
      logger.error("Chat stream error", {
        error: error instanceof Error ? error.message : String(error),
        conversationId,
        userId: user.id,
      });

      writeSSE(res, {
        event: "error",
        data: {
          message:
            error instanceof AppError
              ? error.message
              : error instanceof Error
                ? error.message
                : "Failed to generate response",
        },
      });
    } finally {
      res.end();
    }

    logger.info("Chat message streamed", {
      conversationId,
      userId: user.id,
      tokens: totalTokens,
      contentLength: finalAssistantContent.length,
    });
  }

  private buildOpenAIMessages(dbMessages: Message[]): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: CHAT_SYSTEM_PROMPT },
    ];

    for (const msg of dbMessages) {
      switch (msg.role as MessageRole) {
        case "USER":
          messages.push({ role: "user", content: msg.content });
          break;

        case "ASSISTANT": {
          const toolCallsRaw = msg.toolCalls as
            | Array<{ id: string; name: string; arguments: string }>
            | null;

          if (toolCallsRaw && toolCallsRaw.length > 0) {
            messages.push({
              role: "assistant",
              content: msg.content || null,
              tool_calls: toolCallsRaw.map((t) => ({
                id: t.id,
                type: "function" as const,
                function: { name: t.name, arguments: t.arguments },
              })),
            });
          } else {
            messages.push({ role: "assistant", content: msg.content });
          }
          break;
        }

        case "FUNCTION": {
          const meta = msg.toolCalls as { tool_call_id?: string } | null;
          messages.push({
            role: "tool",
            tool_call_id: meta?.tool_call_id ?? "unknown",
            content: msg.content,
          });
          break;
        }

        case "SYSTEM":
          messages.push({ role: "system", content: msg.content });
          break;
      }
    }

    return messages;
  }

  private toMessageDto(message: Message) {
    return {
      id: message.id,
      role: message.role,
      content: message.content,
      toolCalls: message.toolCalls,
      createdAt: message.createdAt.toISOString(),
    };
  }
}

export const chatService = new ChatService();
