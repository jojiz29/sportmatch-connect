// ============================================================
// src/features/voice/hooks/useVoiceRecorder.ts
// Feature #10 — Web Speech API fallback + MediaRecorder para STT
// ============================================================

import { useCallback, useEffect, useRef, useState } from "react";
import { transcribeAudio } from "../api/voiceApi";
import type { SupportedVoiceLanguage } from "../api/types";

// Type declarations for Web Speech API
/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
  class SpeechRecognition extends EventTarget {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    onresult: ((event: any) => void) | null;
    onerror: ((event: any) => void) | null;
    onend: (() => void) | null;
    start(): void;
    stop(): void;
  }
}

export type VoiceRecorderState = "idle" | "recording" | "processing" | "error";

interface UseVoiceRecorderOptions {
  language?: SupportedVoiceLanguage;
  onTranscript?: (text: string, confianza: number) => void;
  onError?: (error: string) => void;
}

export function useVoiceRecorder(options: UseVoiceRecorderOptions = {}) {
  const [state, setState] = useState<VoiceRecorderState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [transcript, setTranscript] = useState<string>("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const stateRef = useRef<VoiceRecorderState>(state);
  const transcriptRef = useRef<string>(transcript);
  const onTranscriptRef = useRef(options.onTranscript);
  const onErrorRef = useRef(options.onError);
  const languageRef = useRef(options.language);

  stateRef.current = state;
  transcriptRef.current = transcript;
  onTranscriptRef.current = options.onTranscript;
  onErrorRef.current = options.onError;
  languageRef.current = options.language;

  const hasWebSpeechSupport =
    typeof window !== "undefined" &&
    ("webkitSpeechRecognition" in window || "SpeechRecognition" in window);

  const start = useCallback(async () => {
    setError(null);
    setTranscript("");
    setAudioBlob(null);
    chunksRef.current = [];
    const language = languageRef.current;

    try {
      if (hasWebSpeechSupport) {
        const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognitionCtor();
        recognition.lang = language === "pt" ? "pt-BR" : language === "en" ? "en-US" : "es-ES";
        recognition.continuous = false;
        recognition.interimResults = true;

        recognition.onresult = (event: any) => {
          let finalText = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            finalText += event.results[i][0]?.transcript ?? "";
          }
          setTranscript(finalText);
        };
        recognition.onerror = (event: any) => {
          setError(`Error Web Speech: ${event.error}`);
          setState("error");
          onErrorRef.current?.(event.error);
        };
        recognition.onend = () => {
          if (stateRef.current === "recording") {
            setState("idle");
            if (transcriptRef.current) {
              onTranscriptRef.current?.(transcriptRef.current, 0.9);
            }
          }
        };

        recognition.start();
        recognitionRef.current = recognition;

        if (navigator.mediaDevices?.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const recorder = new MediaRecorder(stream);
          recorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunksRef.current.push(e.data);
          };
          recorder.onstop = () => {
            const blob = new Blob(chunksRef.current, { type: "audio/webm" });
            setAudioBlob(blob);
            stream.getTracks().forEach((t) => t.stop());
          };
          recorder.start();
          mediaRecorderRef.current = recorder;
        }

        setState("recording");
      } else {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("Tu navegador no soporta grabación de audio");
        }
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };
        recorder.onstop = async () => {
          const blob = new Blob(chunksRef.current, { type: "audio/webm" });
          setAudioBlob(blob);
          stream.getTracks().forEach((t) => t.stop());
          setState("processing");
          try {
            const res = await transcribeAudio({ audio: blob, language });
            setTranscript(res.text);
            onTranscriptRef.current?.(res.text, res.confianza);
            setState("idle");
          } catch (err) {
            const msg = err instanceof Error ? err.message : "Error desconocido";
            setError(msg);
            setState("error");
            onErrorRef.current?.(msg);
          }
        };
        recorder.start();
        mediaRecorderRef.current = recorder;
        setState("recording");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      setError(msg);
      setState("error");
      onErrorRef.current?.(msg);
    }
  }, [hasWebSpeechSupport]);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
    }
  }, []);

  const reset = useCallback(() => {
    setTranscript("");
    setError(null);
    setAudioBlob(null);
    setState("idle");
  }, []);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return { state, error, transcript, audioBlob, start, stop, reset, hasWebSpeechSupport };
}
