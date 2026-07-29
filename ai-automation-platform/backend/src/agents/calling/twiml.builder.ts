import { buildWebhookUrl } from "../../lib/twilio.client.js";

/** Build TwiML XML string for Twilio voice responses */
export class TwimlBuilder {
  static say(text: string): string {
    return `<Say voice="Polly.Joanna-Neural">${escapeXml(text)}</Say>`;
  }

  static gather(callId: string, prompt: string): string {
    const action = buildWebhookUrl(`/api/calls/webhook/gather?callId=${callId}`);
    return `<Gather input="speech" action="${action}" method="POST" speechTimeout="auto" language="en-US">
      ${this.say(prompt)}
    </Gather>`;
  }

  static response(parts: string[]): string {
    return `<?xml version="1.0" encoding="UTF-8"?><Response>${parts.join("")}</Response>`;
  }

  static initialGreeting(callId: string, greeting: string): string {
    return this.response([this.gather(callId, greeting)]);
  }

  static aiReply(callId: string, text: string, isFinal = false): string {
    if (isFinal) {
      return this.response([this.say(text), `<Hangup/>`]);
    }
    return this.response([this.gather(callId, text)]);
  }

  static error(message: string): string {
    return this.response([this.say(message), `<Hangup/>`]);
  }
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
