import twilio from "twilio";
import { aiConfig, isAiProviderConfigured } from "../config/ai.config.js";
import { env } from "../config/env.js";
import { AppError } from "../utils/errors/app.error.js";

let client: twilio.Twilio | null = null;

export function getTwilioClient(): twilio.Twilio {
  if (!isAiProviderConfigured("twilio")) {
    throw AppError.badRequest(
      "Twilio is not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER.",
      "TWILIO_NOT_CONFIGURED"
    );
  }

  if (!client) {
    client = twilio(aiConfig.twilio.accountSid!, aiConfig.twilio.authToken!);
  }

  return client;
}

export function getTwilioPhoneNumber(): string {
  if (!aiConfig.twilio.phoneNumber) {
    throw AppError.badRequest("TWILIO_PHONE_NUMBER is not configured", "TWILIO_NOT_CONFIGURED");
  }
  return aiConfig.twilio.phoneNumber;
}

/** Validate incoming Twilio webhook signature */
export function validateTwilioSignature(
  signature: string | undefined,
  url: string,
  params: Record<string, string>
): boolean {
  if (!signature || !aiConfig.twilio.authToken) return false;

  return twilio.validateRequest(aiConfig.twilio.authToken, signature, url, params);
}

export function buildWebhookUrl(path: string): string {
  return `${env.API_URL}${path}`;
}
