import type OpenAI from "openai";
import type { Message, MessageRole } from "@prisma/client";
import { CHAT_TOOLS, executeChatTool } from "../../agents/chat/chat.tools.js";
import {
  CHAT_MODEL,
  CHAT_TEMPERATURE,
  getOpenAIClient,
} from "../../agents/chat/openai.client.js";
import { transcribeAudio } from "../../agents/voice/deepgram.client.js";
import { synthesizeSpeechBase64 } from "../../agents/voice/elevenlabs.client.js";
import { VOICE_GREETING, VOICE_SYSTEM_PROMPT } from "../../agents/voice/voice.prompt.js";
import { prisma } from "../../lib/prisma.js";
import { logger } from "../../lib/logger.js";
import { conversationRepository } from "../../repositories/conversations/conversation.repository.js";
import type { AuthenticatedUser } from "../../types/index.js";
import { AppError } from "../../utils/errors/app.error.js";
import {
  isAiProviderConfigured,
} from "../../config/index.js";

const MAX_TOOL_ROUNDS = 3;
const VOICE_MAX_TOKENS = 300;

export interface VoiceTurnResult {
  sessionId: string;
  userTranscript: string;
  assistantText: string;
  audioBase64: string;
  toolsUsed: string[];
}

export interface VoiceSessionInfo {
  id: string;
  title: string;
  greeting: string;
  greetingAudioBase64: string;
  providers: {
    deepgram: boolean;
    openai: boolean;
    elevenlabs: boolean;
  };
}

export class VoiceService {
  readonly serviceName = "VoiceService";

  getProviderStatus() {
    return {
      deepgram: isAiProviderConfigured("deepgram"),
      openai: isAiProviderConfigured("openai"),
      elevenlabs: isAiProviderConfigured("elevenlabs"),
    };
  }

  async createSession(user: AuthenticatedUser): Promise<VoiceSessionInfo> {
    this.assertProvidersConfigured();

    const conversation = await conversationRepository.create(
      user.id,
      "Voice session",
      "voice"
    );

    const greetingAudioBase64 = await synthesizeSpeechBase64(VOICE_GREETING);

    await conversationRepository.addMessage({
      conversationId: conversation.id,
      role: "ASSISTANT",
      content: VOICE_GREETING,
    });

    await prisma.analyticsEvent.create({
      data: {
        userId: user.id,
        eventType: "VOICE_SESSION",
        payload: { sessionId: conversation.id, action: "started" },
      },
    });

    return {
      id: conversation.id,
      title: conversation.title ?? "Voice session",
      greeting: VOICE_GREETING,
      greetingAudioBase64,
      providers: this.getProviderStatus(),
    };
  }

  async getSession(user: AuthenticatedUser, sessionId: string) {
    const conversation = await conversationRepository.findByIdForUser(
      sessionId,
      user.id
    );
    if (!conversation || conversation.agentType !== "voice") {
      throw AppError.notFound("Voice session not found", "SESSION_NOT_FOUND");
    }

    const messages = await conversationRepository.getMessages(sessionId);

    return {
      session: {
        id: conversation.id,
        title: conversation.title,
        status: conversation.status,
        createdAt: conversation.createdAt.toISOString(),
      },
      transcript: messages
        .filter((m) => m.role === "USER" || m.role === "ASSISTANT")
        .map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          createdAt: m.createdAt.toISOString(),
        })),
    };
  }

  async endSession(user: AuthenticatedUser, sessionId: string) {
    const conversation = await conversationRepository.findByIdForUser(
      sessionId,
      user.id
    );
    if (!conversation) {
      throw AppError.notFound("Voice session not found", "SESSION_NOT_FOUND");
    }

    await conversationRepository.archive(sessionId, user.id);

    await prisma.analyticsEvent.create({
      data: {
        userId: user.id,
        eventType: "VOICE_SESSION",
        payload: { sessionId, action: "ended" },
      },
    });

    return { message: "Voice session ended" };
  }

  /** Full voice turn: audio → Deepgram STT → OpenAI → ElevenLabs TTS */
  async processTurn(
    user: AuthenticatedUser,
    sessionId: string,
    audioBuffer: Buffer,
    mimeType: string
  ): Promise<VoiceTurnResult> {
    this.assertProvidersConfigured();

    const conversation = await conversationRepository.findByIdForUser(
      sessionId,
      user.id
    );
    if (!conversation || conversation.agentType !== "voice") {
      throw AppError.notFound("Voice session not found", "SESSION_NOT_FOUND");
    }

    // 1. Speech-to-text via Deepgram
    const userTranscript = await transcribeAudio(audioBuffer, mimeType);

    if (!userTranscript) {
      throw AppError.badRequest(
        "Could not detect speech in the audio. Please try again.",
        "STT_EMPTY"
      );
    }

    // 2. Persist user message
    await conversationRepository.addMessage({
      conversationId: sessionId,
      role: "USER",
      content: userTranscript,
    });

    // 3. OpenAI reasoning with function calling
    const { assistantText, toolsUsed, tokensUsed } = await this.generateResponse(
      sessionId
    );

    // 4. Persist assistant message
    await conversationRepository.addMessage({
      conversationId: sessionId,
      role: "ASSISTANT",
      content: assistantText,
      tokenCount: tokensUsed,
    });

    await conversationRepository.touchConversation(sessionId);

    // 5. Text-to-speech via ElevenLabs
    const audioBase64 = await synthesizeSpeechBase64(assistantText);

    await prisma.analyticsEvent.create({
      data: {
        userId: user.id,
        eventType: "AI_REQUEST",
        tokensUsed,
        payload: { sessionId, type: "voice_turn", toolsUsed },
      },
    });

    logger.info("Voice turn completed", {
      sessionId,
      userId: user.id,
      transcriptLength: userTranscript.length,
      responseLength: assistantText.length,
      toolsUsed,
    });

    return {
      sessionId,
      userTranscript,
      assistantText,
      audioBase64,
      toolsUsed,
    };
  }

  private async generateResponse(sessionId: string): Promise<{
    assistantText: string;
    toolsUsed: string[];
    tokensUsed: number;
  }> {
    const openai = getOpenAIClient();
    const dbMessages = await conversationRepository.getMessages(sessionId);
    const messages = this.buildOpenAIMessages(dbMessages);
    const toolsUsed: string[] = [];
    let totalTokens = 0;

    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const completion = await openai.chat.completions.create({
        model: CHAT_MODEL,
        messages,
        tools: CHAT_TOOLS,
        tool_choice: "auto",
        temperature: CHAT_TEMPERATURE,
        max_tokens: VOICE_MAX_TOKENS,
      });

      const choice = completion.choices[0];
      if (!choice) break;

      totalTokens += completion.usage?.total_tokens ?? 0;
      const msg = choice.message;

      if (msg.tool_calls && msg.tool_calls.length > 0) {
        messages.push({
          role: "assistant",
          content: msg.content,
          tool_calls: msg.tool_calls,
        });

        for (const toolCall of msg.tool_calls) {
          if (toolCall.type !== "function") continue;

          toolsUsed.push(toolCall.function.name);

          const result = await executeChatTool(
            toolCall.function.name,
            toolCall.function.arguments
          );

          await conversationRepository.addMessage({
            conversationId: sessionId,
            role: "FUNCTION",
            content: result,
            toolCalls: {
              tool_call_id: toolCall.id,
              name: toolCall.function.name,
            },
          });

          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: result,
          });
        }

        continue;
      }

      const assistantText =
        msg.content?.trim() ||
        "I'm sorry, I didn't catch that. Could you please repeat?";

      return { assistantText, toolsUsed, tokensUsed: totalTokens };
    }

    return {
      assistantText: "I'm having trouble processing that. Could you try again?",
      toolsUsed,
      tokensUsed: totalTokens,
    };
  }

  private buildOpenAIMessages(
    dbMessages: Message[]
  ): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: VOICE_SYSTEM_PROMPT },
    ];

    for (const msg of dbMessages) {
      switch (msg.role as MessageRole) {
        case "USER":
          messages.push({ role: "user", content: msg.content });
          break;
        case "ASSISTANT":
          messages.push({ role: "assistant", content: msg.content });
          break;
        case "FUNCTION": {
          const meta = msg.toolCalls as { tool_call_id?: string } | null;
          messages.push({
            role: "tool",
            tool_call_id: meta?.tool_call_id ?? "unknown",
            content: msg.content,
          });
          break;
        }
      }
    }

    return messages;
  }

  private assertProvidersConfigured(): void {
    const status = this.getProviderStatus();
    const missing = Object.entries(status)
      .filter(([, ok]) => !ok)
      .map(([name]) => name);

    if (missing.length > 0) {
      throw AppError.badRequest(
        `Voice agent requires API keys for: ${missing.join(", ")}`,
        "AI_NOT_CONFIGURED"
      );
    }
  }
}

export const voiceService = new VoiceService();
