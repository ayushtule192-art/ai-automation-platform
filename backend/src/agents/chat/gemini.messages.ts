import type { FunctionCall } from "@google/generative-ai";
import type { Message, MessageRole } from "@prisma/client";
import type { Content, Part } from "./gemini.client.js";

/** Convert persisted DB messages into Gemini Content history */
export function buildGeminiContents(dbMessages: Message[]): Content[] {
  const contents: Content[] = [];

  for (const msg of dbMessages) {
    switch (msg.role as MessageRole) {
      case "USER":
        contents.push({ role: "user", parts: [{ text: msg.content }] });
        break;

      case "ASSISTANT": {
        const toolCallsRaw = msg.toolCalls as
          | Array<{ id: string; name: string; arguments: string }>
          | null;

        if (toolCallsRaw && toolCallsRaw.length > 0) {
          const parts: Part[] = [];
          if (msg.content) parts.push({ text: msg.content });

          for (const tc of toolCallsRaw) {
            let args: object = {};
            try {
              args = JSON.parse(tc.arguments || "{}") as object;
            } catch {
              args = {};
            }
            parts.push({ functionCall: { name: tc.name, args } });
          }

          contents.push({ role: "model", parts });
        } else {
          contents.push({ role: "model", parts: [{ text: msg.content }] });
        }
        break;
      }

      case "FUNCTION": {
        const meta = msg.toolCalls as { name?: string } | null;
        let response: object;
        try {
          response = JSON.parse(msg.content) as object;
        } catch {
          response = { result: msg.content };
        }

        contents.push({
          role: "function",
          parts: [
            {
              functionResponse: {
                name: meta?.name ?? "unknown",
                response,
              },
            },
          ],
        });
        break;
      }

      case "SYSTEM":
        // System prompt is passed via systemInstruction on the model
        break;
    }
  }

  return contents;
}

export function appendModelFunctionCalls(
  contents: Content[],
  functionCalls: FunctionCall[],
  text = ""
): void {
  const parts: Part[] = [];
  if (text) parts.push({ text });
  for (const call of functionCalls) {
    parts.push({ functionCall: call });
  }
  contents.push({ role: "model", parts });
}

export function appendFunctionResult(
  contents: Content[],
  name: string,
  resultJson: string
): void {
  let response: object;
  try {
    response = JSON.parse(resultJson) as object;
  } catch {
    response = { result: resultJson };
  }

  contents.push({
    role: "function",
    parts: [{ functionResponse: { name, response } }],
  });
}
