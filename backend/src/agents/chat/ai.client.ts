import { getOpenAIClient, CHAT_MODEL } from "./openai.client.js";
import { getGeminiClient, GEMINI_MODEL } from "./gemini.client.js";
import { isAiProviderConfigured } from "../../config/ai.config.js";

export type AIProvider = "openai" | "gemini";

export function getAIProvider(): AIProvider {
  if (isAiProviderConfigured("openai")) {
    return "openai";
  }

  if (isAiProviderConfigured("gemini")) {
    return "gemini";
  }

  throw new Error("No AI provider configured");
}

export function getAIClient() {
  const provider = getAIProvider();

  if (provider === "openai") {
    return {
      provider,
      client: getOpenAIClient(),
      model: CHAT_MODEL,
    };
  }

  return {
    provider,
    client: getGeminiClient(),
    model: GEMINI_MODEL,
  };
}