"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  createVoiceSession,
  endVoiceSession,
  getVoiceStatus,
  playAudioBase64,
  sendVoiceTurn,
} from "@/lib/voice-api";
import type { VoiceAgentStatus, VoiceTranscriptEntry } from "@/types/voice";

interface UseVoiceAgentReturn {
  status: VoiceAgentStatus;
  transcript: VoiceTranscriptEntry[];
  sessionId: string | null;
  error: string | null;
  providersReady: boolean | null;
  isPushToTalk: boolean;
  startSession: () => Promise<void>;
  stopSession: () => Promise<void>;
  startListening: () => void;
  stopListening: () => Promise<void>;
}

export function useVoiceAgent(): UseVoiceAgentReturn {
  const [status, setStatus] = useState<VoiceAgentStatus>("idle");
  const [transcript, setTranscript] = useState<VoiceTranscriptEntry[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [providersReady, setProvidersReady] = useState<boolean | null>(null);
  const [isPushToTalk, setIsPushToTalk] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    void getVoiceStatus()
      .then(({ providers }) => {
        setProvidersReady(providers.deepgram && providers.openai && providers.elevenlabs);
      })
      .catch(() => setProvidersReady(false));
  }, []);

  const cleanupStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    mediaRecorderRef.current = null;
    chunksRef.current = [];
  }, []);

  const startSession = useCallback(async () => {
    setError(null);
    try {
      const { session } = await createVoiceSession();
      setSessionId(session.id);
      sessionIdRef.current = session.id;

      setTranscript([
        {
          id: "greeting",
          role: "ASSISTANT",
          content: session.greeting,
          createdAt: new Date().toISOString(),
        },
      ]);

      setStatus("speaking");
      await playAudioBase64(session.greetingAudioBase64);
      setStatus("listening");

      // Request microphone permission early
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start session");
      setStatus("idle");
      cleanupStream();
    }
  }, [cleanupStream]);

  const stopSession = useCallback(async () => {
    cleanupStream();
    if (sessionIdRef.current) {
      try {
        await endVoiceSession(sessionIdRef.current);
      } catch {
        // ignore cleanup errors
      }
    }
    setSessionId(null);
    sessionIdRef.current = null;
    setStatus("idle");
    setIsPushToTalk(false);
  }, [cleanupStream]);

  const startListening = useCallback(() => {
    if (!streamRef.current || status !== "listening") return;

    setIsPushToTalk(true);
    chunksRef.current = [];

    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : "audio/webm";

    const recorder = new MediaRecorder(streamRef.current, { mimeType });
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.start(100);
  }, [status]);

  const stopListening = useCallback(async () => {
    setIsPushToTalk(false);

    const recorder = mediaRecorderRef.current;
    const currentSessionId = sessionIdRef.current;

    if (!recorder || recorder.state === "inactive" || !currentSessionId) return;

    await new Promise<void>((resolve) => {
      recorder.onstop = () => resolve();
      recorder.stop();
    });

    const mimeType = recorder.mimeType || "audio/webm";
    const audioBlob = new Blob(chunksRef.current, { type: mimeType });
    chunksRef.current = [];

    if (audioBlob.size < 1000) {
      setError("Recording too short. Hold the button and speak clearly.");
      return;
    }

    setStatus("processing");
    setError(null);

    try {
      const { turn } = await sendVoiceTurn(currentSessionId, audioBlob);

      const now = new Date().toISOString();

      setTranscript((prev) => [
        ...prev,
        {
          id: `user-${now}`,
          role: "USER",
          content: turn.userTranscript,
          createdAt: now,
        },
        {
          id: `assistant-${now}`,
          role: "ASSISTANT",
          content: turn.assistantText,
          createdAt: now,
        },
      ]);

      setStatus("speaking");
      await playAudioBase64(turn.audioBase64);
      setStatus("listening");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Voice processing failed");
      setStatus("listening");
    }
  }, []);

  useEffect(() => {
    return () => {
      cleanupStream();
    };
  }, [cleanupStream]);

  return {
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
  };
}
