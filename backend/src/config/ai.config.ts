import { env } from "./env.js";

export const aiConfig = {
  openai: {
    apiKey: env.OPENAI_API_KEY,
    defaultModel: "gpt-4o",
    embeddingModel: "text-embedding-3-small",
    maxTokens: 4096,
    temperature: 0.7,
  },
  elevenlabs: {
    apiKey: env.ELEVENLABS_API_KEY,
    defaultVoiceId: "21m00Tcm4TlvDq8ikWAM",
    modelId: "eleven_multilingual_v2",
  },
  deepgram: {
    apiKey: env.DEEPGRAM_API_KEY,
    model: "nova-2",
    language: "en",
  },
  twilio: {
    accountSid: env.TWILIO_ACCOUNT_SID,
    authToken: env.TWILIO_AUTH_TOKEN,
    phoneNumber: env.TWILIO_PHONE_NUMBER,
  },
} as const;

export type AiConfig = typeof aiConfig;

/** Returns true when all required keys for a given provider are configured */
export function isAiProviderConfigured(
  provider: keyof typeof aiConfig
): boolean {
  const config = aiConfig[provider];
  return Object.values(config).every(
    (value) => value !== undefined && value !== ""
  );
}
