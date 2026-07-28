import OpenAI from "openai";
import { aiConfig, isAiProviderConfigured } from "../../config/ai.config.js";
import { AppError } from "../../utils/errors/app.error.js";

let client: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!isAiProviderConfigured("openai")) {
    throw AppError.badRequest(
      "OpenAI API key is not configured. Set OPENAI_API_KEY in your environment.",
      "AI_NOT_CONFIGURED"
    );
  }

  if (!client) {
    client = new OpenAI({ apiKey: aiConfig.openai.apiKey });
  }

  return client;
}

export const CHAT_MODEL = aiConfig.openai.defaultModel;
export const CHAT_MAX_TOKENS = aiConfig.openai.maxTokens;
export const CHAT_TEMPERATURE = aiConfig.openai.temperature;
