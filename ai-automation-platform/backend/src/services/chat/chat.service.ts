import type { Response } from "express";
import type { Message } from "@prisma/client";
import { CHAT_SYSTEM_PROMPT } from "../../agents/chat/chat.prompt.js";
import {
  executeChatTool,
  serializeFunctionArgs,
  type ToolCallInput,
} from "../../agents/chat/chat.tools.js";
import { CHAT_MODEL } from "../../agents/chat/gemini.client.js";
import {
  appendFunctionResult,
  appendModelFunctionCalls,
  buildGeminiContents,
} from "../../agents/chat/gemini.messages.js";
import { streamWithGemini } from "../../agents/chat/gemini.runner.js";
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

    await conversationRepository.addMessage({
      conversationId,
      role: "USER",
      content,
    });

    const isFirstMessage = (await conversationRepository.countMessages(conversationId)) === 1;

    const dbMessages = await conversationRepository.getMessages(conversationId);
    const geminiContents = buildGeminiContents(dbMessages);

    let totalTokens = 0;
    let finalAssistantContent = "";

    try {
      for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
        const { text, functionCalls, tokensUsed } = await streamWithGemini(
          geminiContents,
          {
            onToken: (token) => {
              writeSSE(res, { event: "token", data: { content: token } });
            },
          },
          { systemInstruction: CHAT_SYSTEM_PROMPT }
        );

        totalTokens += tokensUsed;

        if (functionCalls.length > 0) {
          const toolCalls: ToolCallInput[] = functionCalls.map((fc, i) => ({
            id: `call_${Date.now()}_${i}`,
            name: fc.name,
            arguments: serializeFunctionArgs(fc.args),
          }));

          await conversationRepository.addMessage({
            conversationId,
            role: "ASSISTANT",
            content: text || "",
            toolCalls: toolCalls.map((t) => ({
              id: t.id,
              name: t.name,
              arguments: t.arguments,
            })),
          });

          appendModelFunctionCalls(geminiContents, functionCalls, text);

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

            appendFunctionResult(geminiContents, toolCall.name, result);
          }

          continue;
        }

        finalAssistantContent = text;
        const savedMessage = await conversationRepository.addMessage({
          conversationId,
          role: "ASSISTANT",
          content: text,
          tokenCount: tokensUsed,
        });

        await conversationRepository.touchConversation(conversationId);

        let title: string | undefined;
        if (isFirstMessage && !conversation.title) {
          title = content.slice(0, 60) + (content.length > 60 ? "…" : "");
          await conversationRepository.updateTitle(conversationId, title);
        }

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
