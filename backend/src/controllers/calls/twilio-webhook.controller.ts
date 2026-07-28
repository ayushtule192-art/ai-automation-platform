import type { Request, Response } from "express";
import { callingService } from "../../services/calls/calling.service.js";

function queryCallId(req: Request): string {
  const id = req.query.callId;
  if (typeof id === "string") return id;
  if (Array.isArray(id) && typeof id[0] === "string") return id[0];
  return "";
}

export class TwilioWebhookController {
  /** Initial voice TwiML when outbound call is answered */
  voice = async (req: Request, res: Response): Promise<void> => {
    const callId = queryCallId(req);
    try {
      const twiml = await callingService.handleVoiceWebhook(callId);
      res.type("text/xml").send(twiml);
    } catch {
      res.type("text/xml").status(500).send(
        '<?xml version="1.0"?><Response><Say>An error occurred.</Say><Hangup/></Response>'
      );
    }
  };

  /** Process speech input from caller */
  gather = async (req: Request, res: Response): Promise<void> => {
    const callId = queryCallId(req);
    const speechResult = (req.body as { SpeechResult?: string }).SpeechResult ?? "";

    try {
      const twiml = await callingService.handleGatherWebhook(callId, speechResult);
      res.type("text/xml").send(twiml);
    } catch {
      res.type("text/xml").status(500).send(
        '<?xml version="1.0"?><Response><Say>An error occurred.</Say><Hangup/></Response>'
      );
    }
  };

  /** Call status updates from Twilio */
  status = async (req: Request, res: Response): Promise<void> => {
    const callId = queryCallId(req);
    const body = req.body as { CallStatus?: string; CallDuration?: string };
    await callingService.handleStatusWebhook(
      callId,
      body.CallStatus ?? "",
      body.CallDuration
    );
    res.status(200).send("OK");
  };

  /** Recording completed callback */
  recording = async (req: Request, res: Response): Promise<void> => {
    const callId = queryCallId(req);
    const body = req.body as { RecordingUrl?: string };
    if (body.RecordingUrl) {
      await callingService.handleRecordingWebhook(callId, body.RecordingUrl);
    }
    res.status(200).send("OK");
  };
}

export const twilioWebhookController = new TwilioWebhookController();
