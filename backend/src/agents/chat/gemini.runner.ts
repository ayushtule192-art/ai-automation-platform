import type { FunctionCall } from "@google/generative-ai";
import type { Content } from "./gemini.client.js";
import { CHAT_TOOLS } from "./chat.tools.js";
import { getGeminiModel } from "./gemini.client.js";

export interface GeminiGenerateResult {
  text: string;
  functionCalls: FunctionCall[];
  tokensUsed: number;
}

export interface GeminiStreamCallbacks {
  onToken: (text: string) => void;
}

/** Non-streaming generation with optional function calling */
export async function generateWithGemini(
  contents: Content[],
  options: {
    systemInstruction: string;
    maxOutputTokens?: number;
    temperature?: number;
    withTools?: boolean;
  }
): Promise<GeminiGenerateResult> {
  const model = getGeminiModel({
    systemInstruction: options.systemInstruction,
    tools: options.withTools !== false ? CHAT_TOOLS : undefined,
    maxOutputTokens: options.maxOutputTokens,
    temperature: options.temperature,
  });

  const result = await model.generateContent({ contents });
  const response = result.response;

  return {
    text: response.text()?.trim() ?? "",
    functionCalls: response.functionCalls() ?? [],
    tokensUsed: response.usageMetadata?.totalTokenCount ?? 0,
  };
}

/** Streaming generation — yields text tokens; returns final function calls if any */
export async function streamWithGemini(
  contents: Content[],
  callbacks: GeminiStreamCallbacks,
  options: {
    systemInstruction: string;
    maxOutputTokens?: number;
    temperature?: number;
  }
): Promise<{ text: string; functionCalls: FunctionCall[]; tokensUsed: number }> {
  const model = getGeminiModel({
    systemInstruction: options.systemInstruction,
    tools: CHAT_TOOLS,
    maxOutputTokens: options.maxOutputTokens,
    temperature: options.temperature,
  });

  const streamResult = await model.generateContentStream({ contents });

  let text = "";
  for await (const chunk of streamResult.stream) {
    try {
      const chunkText = chunk.text();
      if (chunkText) {
        text += chunkText;
        callbacks.onToken(chunkText);
      }
    } catch {
      // Chunk may contain only function-call parts
    }
  }

  const response = await streamResult.response;

  return {
    text: text || (response.text()?.trim() ?? ""),
    functionCalls: response.functionCalls() ?? [],
    tokensUsed: response.usageMetadata?.totalTokenCount ?? 0,
  };
}
