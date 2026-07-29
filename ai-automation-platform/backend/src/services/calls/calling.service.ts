import { generateWithGemini } from "../../agents/chat/gemini.runner.js";
import { CALLING_SYSTEM_PROMPT, CALL_GOODBYE, CALL_GREETING } from "../../agents/calling/calling.prompt.js";
import { TwimlBuilder } from "../../agents/calling/twiml.builder.js";
import {
  buildWebhookUrl,
  getTwilioClient,
  getTwilioPhoneNumber,
} from "../../lib/twilio.client.js";
import { isAiProviderConfigured } from "../../config/index.js";
import { prisma } from "../../lib/prisma.js";
import { logger } from "../../lib/logger.js";
import {
  callRepository,
  type CallMetadata,
} from "../../repositories/calls/call.repository.js";
import type { AuthenticatedUser } from "../../types/index.js";
import { AppError } from "../../utils/errors/app.error.js";
import { parseContactsCsv, type CsvContact } from "../../utils/csv.util.js";
import { scheduleCallExecution } from "../../jobs/calling/calling.queue.js";

const MAX_TURNS = 8;

export class CallingService {
  readonly serviceName = "CallingService";

  isConfigured(): boolean {
    return isAiProviderConfigured("twilio") && isAiProviderConfigured("gemini");
  }

  async listCalls(user: AuthenticatedUser) {
    const calls = await callRepository.listByUser(user.id);
    return calls.map((c) => this.toCallDto(c));
  }

  async getCall(user: AuthenticatedUser, callId: string) {
    const call = await callRepository.findByIdForUser(callId, user.id);
    if (!call) throw AppError.notFound("Call not found", "CALL_NOT_FOUND");
    return this.toCallDto(call);
  }

  async getAnalytics(user: AuthenticatedUser) {
    return callRepository.getAnalytics(user.id);
  }

  async cancelCall(user: AuthenticatedUser, callId: string) {
    const call = await callRepository.findByIdForUser(callId, user.id);
    if (!call) throw AppError.notFound("Call not found", "CALL_NOT_FOUND");

    if (call.status !== "SCHEDULED") {
      throw AppError.badRequest("Only scheduled calls can be cancelled", "CALL_NOT_CANCELLABLE");
    }

    await callRepository.updateStatus(callId, "CANCELLED");
    return { message: "Call cancelled" };
  }

  /** Schedule calls from parsed CSV contacts */
  async scheduleFromCsv(
    user: AuthenticatedUser,
    csvBuffer: Buffer,
    scheduledAt: Date
  ): Promise<{ scheduled: number; callIds: string[] }> {
    const contacts = parseContactsCsv(csvBuffer);
    return this.scheduleContacts(user, contacts, scheduledAt);
  }

  /** Schedule calls from contact array */
  async scheduleContacts(
    user: AuthenticatedUser,
    contacts: CsvContact[],
    scheduledAt: Date
  ): Promise<{ scheduled: number; callIds: string[] }> {
    if (!this.isConfigured()) {
      throw AppError.badRequest("Twilio and Gemini must be configured", "CALLING_NOT_CONFIGURED");
    }

    const callIds: string[] = [];

    for (const contact of contacts) {
      let customerId: string | undefined;

      if (contact.email || contact.name) {
        const customer = await prisma.customer.create({
          data: {
            userId: user.id,
            name: contact.name,
            email: contact.email,
            phone: contact.phone,
            notes: contact.notes,
          },
        });
        customerId = customer.id;
      }

      const metadata: CallMetadata = {
        contactName: contact.name,
        email: contact.email,
        notes: contact.notes,
        turns: [],
        turnCount: 0,
      };

      const call = await callRepository.create({
        userId: user.id,
        phoneNumber: contact.phone,
        customerId,
        scheduledAt,
        metadata,
      });

      callIds.push(call.id);
      await scheduleCallExecution(call.id, scheduledAt);
    }

    logger.info("Calls scheduled", {
      userId: user.id,
      count: callIds.length,
      scheduledAt: scheduledAt.toISOString(),
    });

    return { scheduled: callIds.length, callIds };
  }

  /** Execute outbound call via Twilio REST API */
  async executeCall(callId: string): Promise<void> {
    const call = await callRepository.findById(callId);
    if (!call || call.status !== "SCHEDULED") return;

    try {
      const client = getTwilioClient();
      const from = getTwilioPhoneNumber();

      const twilioCall = await client.calls.create({
        to: call.phoneNumber,
        from,
        url: buildWebhookUrl(`/api/calls/webhook/voice?callId=${callId}`),
        statusCallback: buildWebhookUrl(`/api/calls/webhook/status?callId=${callId}`),
        statusCallbackEvent: ["initiated", "ringing", "answered", "completed"],
        statusCallbackMethod: "POST",
        record: true,
        recordingStatusCallback: buildWebhookUrl(
          `/api/calls/webhook/recording?callId=${callId}`
        ),
        timeout: 30,
      });

      await callRepository.update(callId, {
        status: "IN_PROGRESS",
        twilioCallSid: twilioCall.sid,
        startedAt: new Date(),
      });

      logger.info("Outbound call initiated", { callId, twilioSid: twilioCall.sid });
    } catch (error) {
      logger.error("Failed to execute call", {
        callId,
        error: error instanceof Error ? error.message : String(error),
      });
      await callRepository.updateStatus(callId, "FAILED");
    }
  }

  /** Twilio voice webhook — initial TwiML when call is answered */
  async handleVoiceWebhook(callId: string): Promise<string> {
    const call = await callRepository.findById(callId);
    if (!call) return TwimlBuilder.error("Call session not found.");

    const metadata = (call.metadata as CallMetadata | null) ?? {};
    const greeting = CALL_GREETING(metadata.contactName ?? "");

    await callRepository.appendTranscriptTurn(callId, {
      role: "agent",
      text: greeting,
      timestamp: new Date().toISOString(),
    });

    return TwimlBuilder.initialGreeting(callId, greeting);
  }

  /** Twilio gather webhook — process caller speech and respond with AI */
  async handleGatherWebhook(callId: string, speechResult: string): Promise<string> {
    const call = await callRepository.findById(callId);
    if (!call) return TwimlBuilder.error("Call session not found.");

    const metadata = (call.metadata as CallMetadata | null) ?? {};
    const turnCount = metadata.turnCount ?? 0;

    if (!speechResult?.trim()) {
      return TwimlBuilder.aiReply(
        callId,
        "I'm sorry, I didn't catch that. Could you please repeat?"
      );
    }

    await callRepository.appendTranscriptTurn(callId, {
      role: "caller",
      text: speechResult,
      timestamp: new Date().toISOString(),
    });

    if (turnCount >= MAX_TURNS) {
      await callRepository.appendTranscriptTurn(callId, {
        role: "agent",
        text: CALL_GOODBYE,
        timestamp: new Date().toISOString(),
      });
      return TwimlBuilder.aiReply(callId, CALL_GOODBYE, true);
    }

    const aiResponse = await this.generateCallResponse(callId, speechResult);

    await callRepository.appendTranscriptTurn(callId, {
      role: "agent",
      text: aiResponse,
      timestamp: new Date().toISOString(),
    });

    const shouldEnd =
      aiResponse.toLowerCase().includes("goodbye") ||
      aiResponse.toLowerCase().includes("have a great day");

    return TwimlBuilder.aiReply(callId, aiResponse, shouldEnd);
  }

  /** Twilio status callback — update call status and generate summary */
  async handleStatusWebhook(
    callId: string,
    callStatus: string,
    duration?: string
  ): Promise<void> {
    const call = await callRepository.findById(callId);
    if (!call) return;

    const durationSec = duration ? Number.parseInt(duration, 10) : undefined;

    if (callStatus === "completed") {
      const summary = await this.generateCallSummary(callId);

      await callRepository.update(callId, {
        status: "COMPLETED",
        endedAt: new Date(),
        duration: durationSec,
        summary,
      });

      await prisma.analyticsEvent.create({
        data: {
          userId: call.userId,
          eventType: "CALL_COMPLETED",
          payload: { callId, duration: durationSec },
        },
      });

      logger.info("Call completed", { callId, duration: durationSec });
    } else if (["failed", "busy", "no-answer", "canceled"].includes(callStatus)) {
      await callRepository.update(callId, {
        status: "FAILED",
        endedAt: new Date(),
        duration: durationSec,
      });
    }
  }

  /** Store recording URL from Twilio callback */
  async handleRecordingWebhook(callId: string, recordingUrl: string): Promise<void> {
    await callRepository.update(callId, { recordingUrl });
  }

  private async generateCallResponse(callId: string, userSpeech: string): Promise<string> {
    const call = await callRepository.findById(callId);
    if (!call) return "I'm having trouble with this call. Goodbye!";

    const metadata = (call.metadata as CallMetadata | null) ?? {};
    const history = (metadata.turns ?? [])
      .slice(-6)
      .map((t) => ({ role: t.role === "agent" ? "assistant" : "user", content: t.text }));

    const result = await generateWithGemini(
      [
        ...history.map((h) => ({
          role: h.role === "assistant" ? "model" : "user",
          parts: [{ text: h.content }],
        })),
        { role: "user", parts: [{ text: userSpeech }] },
      ],
      {
        systemInstruction: CALLING_SYSTEM_PROMPT,
        maxOutputTokens: 150,
        temperature: 0.7,
        withTools: false,
      }
    );

    return result.text || "I understand. Is there anything else I can help you with?";
  }

  private async generateCallSummary(callId: string): Promise<string> {
    const call = await callRepository.findById(callId);
    if (!call?.transcript) return "No transcript available.";

    try {
      const result = await generateWithGemini(
        [{ role: "user", parts: [{ text: call.transcript }] }],
        {
          systemInstruction:
            "Summarize this phone call in 2-3 sentences. Include key topics, caller sentiment, and any action items.",
          maxOutputTokens: 200,
          temperature: 0.5,
          withTools: false,
        }
      );

      return result.text || "Summary unavailable.";
    } catch {
      return "Call completed. Summary generation failed.";
    }
  }

  private toCallDto(call: Awaited<ReturnType<typeof callRepository.listByUser>>[number]) {
    const metadata = call.metadata as CallMetadata | null;
    return {
      id: call.id,
      phoneNumber: call.phoneNumber,
      status: call.status,
      scheduledAt: call.scheduledAt?.toISOString() ?? null,
      startedAt: call.startedAt?.toISOString() ?? null,
      endedAt: call.endedAt?.toISOString() ?? null,
      duration: call.duration,
      transcript: call.transcript,
      summary: call.summary,
      recordingUrl: call.recordingUrl,
      contactName: metadata?.contactName ?? null,
      createdAt: call.createdAt.toISOString(),
    };
  }
}

export const callingService = new CallingService();
