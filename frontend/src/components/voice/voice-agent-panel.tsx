"use client";

import { Mic, MicOff, Play, Square, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { useVoiceAgent } from "@/hooks/use-voice-agent";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<string, string> = {
  idle: "Idle",
  listening: "Listening",
  processing: "Processing",
  speaking: "Speaking",
};

export function VoiceAgentPanel() {
  const {
    status,
    transcript,
    sessionId,
    error,
    providersReady,
    isPushToTalk,
    startSession,
    stopSession,
    startListening,
    stopListening,
  } = useVoiceAgent();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Voice Agent"
        description="Real-time voice AI — Deepgram STT, OpenAI reasoning, ElevenLabs TTS"
      >
        <Badge variant={status === "idle" ? "secondary" : "default"}>
          {STATUS_LABELS[status] ?? status}
        </Badge>
      </PageHeader>

      {providersReady === false && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Voice agent requires OPENAI_API_KEY, DEEPGRAM_API_KEY, and ELEVENLABS_API_KEY in backend
          .env
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Live Transcript</CardTitle>
            <CardDescription>
              {sessionId ? `Session ${sessionId.slice(0, 8)}…` : "Start a session to begin"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="min-h-[320px] rounded-lg border bg-muted/30 p-4 space-y-3 overflow-y-auto max-h-[480px]">
              {transcript.length === 0 ? (
                <p className="text-center text-muted-foreground py-16">
                  Click Start to begin a voice session
                </p>
              ) : (
                transcript.map((entry) => (
                  <div
                    key={entry.id}
                    className={cn(
                      "text-sm rounded-lg px-3 py-2",
                      entry.role === "USER"
                        ? "bg-primary/10 text-primary font-medium ml-8"
                        : "bg-muted mr-8"
                    )}
                  >
                    <span className="text-xs text-muted-foreground block mb-0.5">
                      {entry.role === "USER" ? "You" : "Agent"}
                    </span>
                    {entry.content}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Controls</CardTitle>
            <CardDescription>Microphone → Deepgram → OpenAI → ElevenLabs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3">
              {status === "idle" ? (
                <Button
                  onClick={() => void startSession()}
                  size="lg"
                  className="w-full"
                  disabled={providersReady === false}
                >
                  <Play className="mr-2 h-4 w-4" />
                  Start Session
                </Button>
              ) : (
                <Button
                  onClick={() => void stopSession()}
                  variant="destructive"
                  size="lg"
                  className="w-full"
                >
                  <Square className="mr-2 h-4 w-4" />
                  Stop Session
                </Button>
              )}

              {status === "listening" && (
                <Button
                  variant={isPushToTalk ? "default" : "outline"}
                  size="lg"
                  className={cn("w-full select-none", isPushToTalk && "animate-pulse")}
                  onMouseDown={() => startListening()}
                  onMouseUp={() => void stopListening()}
                  onMouseLeave={() => isPushToTalk && void stopListening()}
                  onTouchStart={() => startListening()}
                  onTouchEnd={() => void stopListening()}
                >
                  <Mic className="mr-2 h-4 w-4" />
                  {isPushToTalk ? "Release to Send" : "Hold to Speak"}
                </Button>
              )}

              {(status === "processing" || status === "speaking") && (
                <Button disabled size="lg" className="w-full">
                  {status === "processing" ? "Processing…" : "Speaking…"}
                </Button>
              )}
            </div>

            <div className="rounded-lg bg-muted p-4 text-center">
              <div
                className={cn(
                  "mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full",
                  status === "listening" && isPushToTalk
                    ? "bg-primary/30 animate-pulse"
                    : status === "listening"
                      ? "bg-primary/20"
                      : status === "processing" || status === "speaking"
                        ? "bg-primary/10 animate-pulse"
                        : "bg-muted-foreground/20"
                )}
              >
                {status === "idle" ? (
                  <MicOff className="h-8 w-8 text-muted-foreground" />
                ) : (
                  <Mic className="h-8 w-8 text-primary" />
                )}
              </div>
              <p className="text-sm font-medium">{STATUS_LABELS[status]}</p>
            </div>

            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Deepgram Nova-2 speech-to-text</li>
              <li>• OpenAI GPT-4o with function calling</li>
              <li>• ElevenLabs neural text-to-speech</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
