import { executeChatTool, serializeFunctionArgs } from "../../agents/chat/chat.tools.js";
import {
  appendFunctionResult,
  appendModelFunctionCalls,
  buildGeminiContents,
} from "../../agents/chat/gemini.messages.js";
import { generateWithGemini } from "../../agents/chat/gemini.runner.js";
import { transcribeAudio } from "../../agents/voice/deepgram.client.js";
import { synthesizeSpeechBase64 } from "../../agents/voice/elevenlabs.client.js";
import { VOICE_GREETING, VOICE_SYSTEM_PROMPT } from "../../agents/voice/voice.prompt.js";
import { prisma } from "../../lib/prisma.js";
import { logger } from "../../lib/logger.js";
import { conversationRepository } from "../../repositories/conversations/conversation.repository.js";
import type { AuthenticatedUser } from "../../types/index.js";
import { AppError } from "../../utils/errors/app.error.js";
import { isAiProviderConfigured } from "../../config/index.js";

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
    gemini: boolean;
    elevenlabs: boolean;
  };
}

export class VoiceService {
  readonly serviceName = "VoiceService";

  getProviderStatus() {
    return {
      deepgram: isAiProviderConfigured("deepgram"),
      gemini: isAiProviderConfigured("gemini"),
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

  /** Full voice turn: audio → Deepgram STT → Gemini → ElevenLabs TTS */
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

    const userTranscript = await transcribeAudio(audioBuffer, mimeType);

    if (!userTranscript) {
      throw AppError.badRequest(
        "Could not detect speech in the audio. Please try again.",
        "STT_EMPTY"
      );
    }

    await conversationRepository.addMessage({
      conversationId: sessionId,
      role: "USER",
      content: userTranscript,
    });

    const { assistantText, toolsUsed, tokensUsed } = await this.generateResponse(
      sessionId
    );

    await conversationRepository.addMessage({
      conversationId: sessionId,
      role: "ASSISTANT",
      content: assistantText,
      tokenCount: tokensUsed,
    });

    await conversationRepository.touchConversation(sessionId);

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
    const dbMessages = await conversationRepository.getMessages(sessionId);
    const contents = buildGeminiContents(dbMessages);
    const toolsUsed: string[] = [];
    let totalTokens = 0;

    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const result = await generateWithGemini(contents, {
        systemInstruction: VOICE_SYSTEM_PROMPT,
        maxOutputTokens: VOICE_MAX_TOKENS,
      });

      totalTokens += result.tokensUsed;

      if (result.functionCalls.length > 0) {
        appendModelFunctionCalls(contents, result.functionCalls, result.text);

        for (const fc of result.functionCalls) {
          toolsUsed.push(fc.name);
          const argsJson = serializeFunctionArgs(fc.args);
          const toolResult = await executeChatTool(fc.name, argsJson);

          await conversationRepository.addMessage({
            conversationId: sessionId,
            role: "FUNCTION",
            content: toolResult,
            toolCalls: { name: fc.name },
          });

          appendFunctionResult(contents, fc.name, toolResult);
        }

        continue;
      }

      const assistantText =
        result.text.trim() ||
        "I'm sorry, I didn't catch that. Could you please repeat?";

      return { assistantText, toolsUsed, tokensUsed: totalTokens };
    }

    return {
      assistantText: "I'm having trouble processing that. Could you try again?",
      toolsUsed,
      tokensUsed: totalTokens,
    };
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
