import { aiConfig, isAiProviderConfigured } from "../../config/ai.config.js";
import { AppError } from "../../utils/errors/app.error.js";
import { logger } from "../../lib/logger.js";

/** Synthesize speech from text using ElevenLabs TTS */
export async function synthesizeSpeech(text: string): Promise<Buffer> {
  if (!isAiProviderConfigured("elevenlabs")) {
    throw AppError.badRequest(
      "ElevenLabs API key is not configured. Set ELEVENLABS_API_KEY in your environment.",
      "AI_NOT_CONFIGURED"
    );
  }

  const voiceId = aiConfig.elevenlabs.defaultVoiceId;
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key": aiConfig.elevenlabs.apiKey!,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: aiConfig.elevenlabs.modelId,
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.0,
        use_speaker_boost: true,
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    logger.error("ElevenLabs TTS error", { status: response.status, body: errorBody });
    throw AppError.badRequest("Text-to-speech synthesis failed", "TTS_ERROR");
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/** Synthesize speech and return as base64 for JSON transport */
export async function synthesizeSpeechBase64(text: string): Promise<string> {
  const buffer = await synthesizeSpeech(text);
  return buffer.toString("base64");
}
