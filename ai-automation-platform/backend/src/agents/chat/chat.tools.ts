import { SchemaType, type FunctionDeclaration } from "@google/generative-ai";

/** Gemini function calling tool definitions */
export const CHAT_TOOLS: FunctionDeclaration[] = [
  {
    name: "get_current_datetime",
    description: "Get the current date and time in the user's timezone or UTC",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        timezone: {
          type: SchemaType.STRING,
          description: "IANA timezone e.g. America/New_York. Defaults to UTC.",
        },
      },
    },
  },
  {
    name: "search_knowledge_base",
    description:
      "Search the product knowledge base for documentation, FAQs, and feature information. Use for accurate product answers.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        query: {
          type: SchemaType.STRING,
          description: "Search query",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "schedule_demo",
    description: "Schedule a product demo or sales call for the user",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        name: { type: SchemaType.STRING, description: "Contact name" },
        email: { type: SchemaType.STRING, description: "Contact email" },
        preferredDate: {
          type: SchemaType.STRING,
          description: "Preferred date in YYYY-MM-DD format",
        },
        notes: { type: SchemaType.STRING, description: "Additional notes" },
      },
      required: ["name", "email", "preferredDate"],
    },
  },
];

export interface ToolCallInput {
  id: string;
  name: string;
  arguments: string;
}

/** Execute a tool call and return the result string for the model */
export async function executeChatTool(
  name: string,
  argsJson: string
): Promise<string> {
  let args: Record<string, string> = {};
  try {
    args = JSON.parse(argsJson) as Record<string, string>;
  } catch {
    return JSON.stringify({ error: "Invalid tool arguments" });
  }

  switch (name) {
    case "get_current_datetime": {
      const tz = args.timezone ?? "UTC";
      try {
        const formatted = new Intl.DateTimeFormat("en-US", {
          timeZone: tz,
          dateStyle: "full",
          timeStyle: "long",
        }).format(new Date());
        return JSON.stringify({ datetime: formatted, timezone: tz });
      } catch {
        return JSON.stringify({
          datetime: new Date().toISOString(),
          timezone: "UTC",
        });
      }
    }

    case "search_knowledge_base": {
      const query = (args.query ?? "").toLowerCase();
      const articles: Record<string, string> = {
        pricing:
          "Starter: $49/mo (1,000 AI minutes). Professional: $149/mo (5,000 minutes, all agents). Enterprise: custom pricing with unlimited minutes.",
        voice:
          "Voice Agent provides real-time STT → Gemini → TTS pipeline with Deepgram and ElevenLabs integration.",
        calling:
          "Calling Agent supports CSV upload, scheduled outbound calls via Twilio, transcripts, and AI summaries.",
        chat: "Chat Agent supports streaming responses, conversation memory, markdown, and function calling.",
        security:
          "All data encrypted in transit and at rest. JWT auth, RBAC, SOC 2 compliant. Enterprise on-premise available.",
      };

      const matches = Object.entries(articles)
        .filter(([key, value]) => query.includes(key) || value.toLowerCase().includes(query))
        .map(([, value]) => value);

      return JSON.stringify({
        results:
          matches.length > 0
            ? matches
            : [
                "AI Automation Platform helps automate support, sales, and voice workflows.",
                "Contact sales@example.com for detailed documentation.",
              ],
      });
    }

    case "schedule_demo": {
      const { name: contactName, email, preferredDate, notes } = args;
      return JSON.stringify({
        success: true,
        confirmationId: `DEMO-${Date.now()}`,
        message: `Demo scheduled for ${contactName} (${email}) on ${preferredDate}.`,
        notes: notes ?? "",
      });
    }

    default:
      return JSON.stringify({ error: `Unknown tool: ${name}` });
  }
}

/** Serialize Gemini function-call args to JSON string for DB storage */
export function serializeFunctionArgs(args: object): string {
  return JSON.stringify(args);
}
