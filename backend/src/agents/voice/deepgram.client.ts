import { aiConfig, isAiProviderConfigured } from "../../config/ai.config.js";
import { AppError } from "../../utils/errors/app.error.js";
import { logger } from "../../lib/logger.js";

interface DeepgramResponse {
  results?: {
    channels?: Array<{
      alternatives?: Array<{ transcript?: string }>;
    }>;
  };
}

/** Transcribe audio buffer to text using Deepgram REST API (Nova-2) */
export async function transcribeAudio(
  audioBuffer: Buffer,
  mimeType: string
): Promise<string> {
  if (!isAiProviderConfigured("deepgram")) {
    throw AppError.badRequest(
      "Deepgram API key is not configured. Set DEEPGRAM_API_KEY in your environment.",
      "AI_NOT_CONFIGURED"
    );
  }

  const params = new URLSearchParams({
    model: aiConfig.deepgram.model,
    language: aiConfig.deepgram.language,
    smart_format: "true",
    punctuate: "true",
  });

  const response = await fetch(`https://api.deepgram.com/v1/listen?${params.toString()}`, {
    method: "POST",
    headers: {
      Authorization: `Token ${aiConfig.deepgram.apiKey}`,
      "Content-Type": mimeType,
    },
    body: audioBuffer,
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error("Deepgram transcription error", {
      status: response.status,
      body: errorText,
    });
    throw AppError.badRequest("Transcription failed", "STT_ERROR");
  }

  const data = (await response.json()) as DeepgramResponse;
  const transcript =
    data.results?.channels?.[0]?.alternatives?.[0]?.transcript?.trim() ?? "";

  return transcript;
}
