import type { Request, Response, NextFunction } from "express";
import { env } from "../config/env.js";
import { validateTwilioSignature } from "../lib/twilio.client.js";
import { logger } from "../lib/logger.js";

/** Validate Twilio webhook signatures on incoming requests */
export function twilioWebhookAuth(req: Request, res: Response, next: NextFunction): void {
  const signature = req.headers["x-twilio-signature"] as string | undefined;

  // Skip validation in development if no signature (local testing)
  if (env.NODE_ENV === "development" && !signature) {
    next();
    return;
  }

  const url = `${env.API_URL}${req.originalUrl}`;
  const params = req.body as Record<string, string>;

  if (!validateTwilioSignature(signature, url, params)) {
    logger.warn("Invalid Twilio webhook signature", { url });
    res.status(403).send("Forbidden");
    return;
  }

  next();
}
