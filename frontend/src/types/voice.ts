export interface VoiceSession {
  id: string;
  title: string;
  greeting: string;
  greetingAudioBase64: string;
  providers: {
    deepgram: boolean;
    openai: boolean;
    elevenlabs: boolean;
  };
}

export interface VoiceTurnResult {
  sessionId: string;
  userTranscript: string;
  assistantText: string;
  audioBase64: string;
  toolsUsed: string[];
}

export interface VoiceTranscriptEntry {
  id: string;
  role: "USER" | "ASSISTANT" | "SYSTEM" | "FUNCTION";
  content: string;
  createdAt: string;
}

export type VoiceAgentStatus = "idle" | "listening" | "processing" | "speaking";
