import {
  GoogleGenerativeAI,
  type Content,
  type FunctionDeclaration,
  type GenerativeModel,
  type Part,
} from "@google/generative-ai";
import { aiConfig, isAiProviderConfigured } from "../../config/ai.config.js";
import { AppError } from "../../utils/errors/app.error.js";

let genAI: GoogleGenerativeAI | null = null;

export function getGeminiClient(): GoogleGenerativeAI {
  if (!isAiProviderConfigured("gemini")) {
    throw AppError.badRequest(
      "Gemini API key is not configured. Set GEMINI_API_KEY in your environment.",
      "AI_NOT_CONFIGURED"
    );
  }

  if (!genAI) {
    genAI = new GoogleGenerativeAI(aiConfig.gemini.apiKey!);
  }

  return genAI;
}

export function getGeminiModel(options: {
  systemInstruction?: string;
  tools?: FunctionDeclaration[];
  maxOutputTokens?: number;
  temperature?: number;
} = {}): GenerativeModel {
  const client = getGeminiClient();

  return client.getGenerativeModel({
    model: CHAT_MODEL,
    systemInstruction: options.systemInstruction,
    tools: options.tools ? [{ functionDeclarations: options.tools }] : undefined,
    generationConfig: {
      temperature: options.temperature ?? CHAT_TEMPERATURE,
      maxOutputTokens: options.maxOutputTokens ?? CHAT_MAX_TOKENS,
    },
  });
}

export const CHAT_MODEL = aiConfig.gemini.defaultModel;
export const CHAT_MAX_TOKENS = aiConfig.gemini.maxTokens;
export const CHAT_TEMPERATURE = aiConfig.gemini.temperature;

export type { Content, Part };
