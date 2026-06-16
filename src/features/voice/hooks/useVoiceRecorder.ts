// ============================================================
// src/features/voice/hooks/useVoiceRecorder.ts
// Feature #10 — Web Speech API + MediaRecorder fallback a Google Cloud STT
//
// FIX 15-jun-2026 — Refactor completo del flujo de captura de audio.
// Problema original: cuando Web Speech API fallaba con "network",
// el hook se quedaba en estado "error" sin hacer fallback al backend
// Google Cloud Speech. El usuario veía el mensaje de error pero no
// tenía otra opción.
//
// Nuevo flujo:
//   1. Verificar permisos de micrófono ANTES de invocar Web Speech
//   2. Probar Web Speech con timeout de 3s
//   3. Si falla (network, not-allowed, language-not-supported) →
//      fallback automático a MediaRecorder + backend /voice/transcribe
//   4. UI indica el modo actual (web | cloud | error)
//   5. Auto-stop después de 30s de silencio (MediaRecorder analyzer)
// ============================================================

import { useCallback, useEffect, useRef, useState } from "react";
import { transcribeAudio } from "../api/voiceApi";
import type { SupportedVoiceLanguage } from "../api/types";

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

/** Modo del reconocedor: indica qué backend está usando el STT */
export type VoiceMode = "web-speech" | "google-cloud" | "unknown";

interface UseVoiceRecorderOptions {
  language?: SupportedVoiceLanguage;
  onTranscript?: (text: string, confianza: number) => void;
  onError?: (error: string) => void;
  /** Timeout en ms para considerar que Web Speech falló (default 3000) */
  webSpeechTimeoutMs?: number;
  /** Auto-stop después de N ms de silencio (default 30000) */
  silenceTimeoutMs?: number;
}

/** Errores que NO justifican fallback (usuario canceló, etc.) */
const USER_CANCELLED_ERRORS = new Set(["no-speech", "aborted"]);

export function useVoiceRecorder(options: UseVoiceRecorderOptions = {}) {
  const { webSpeechTimeoutMs = 3000, silenceTimeoutMs = 30000 } = options;

  const [state, setState] = useState<VoiceRecorderState>("idle");
  const [mode, setMode] = useState<VoiceMode>("unknown");
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string>("");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const stateRef = useRef<VoiceRecorderState>(state);
  const transcriptRef = useRef<string>(transcript);
  const modeRef = useRef<VoiceMode>(mode);
  const onTranscriptRef = useRef(options.onTranscript);
  const onErrorRef = useRef(options.onError);
  const languageRef = useRef(options.language);
  const silenceTimerRef = useRef<number | null>(null);
  const webSpeechTimeoutRef = useRef<number | null>(null);
  const fallbackInProgressRef = useRef(false);

  stateRef.current = state;
  transcriptRef.current = transcript;
  modeRef.current = mode;
  onTranscriptRef.current = options.onTranscript;
  onErrorRef.current = options.onError;
  languageRef.current = options.language;

  const hasWebSpeechSupport =
    typeof window !== "undefined" &&
    ("webkitSpeechRecognition" in window || "SpeechRecognition" in window);

  /**
   * Verifica permisos de micrófono antes de iniciar cualquier captura.
   * Devuelve true si tenemos permiso (granted o prompt).
   */
  const checkMicrophonePermission = useCallback(async (): Promise<boolean> => {
    if (typeof navigator === "undefined" || !navigator.permissions) return true;
    try {
      const result = await navigator.permissions.query({ name: "microphone" as PermissionName });
      return result.state !== "denied";
    } catch {
      // Algunos navegadores no soportan permissions API para micrófono.
      // Asumimos que se puede pedir y dejamos que el getUserMedia falle
      // con un error claro.
      return true;
    }
  }, []);

  /** Detecta silencio en MediaRecorder usando AudioContext + AnalyserNode */
  const startSilenceDetection = useCallback(
    (stream: MediaStream, onSilence: () => void) => {
      if (typeof window === "undefined" || !window.AudioContext) return;
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);

      let lastSoundTime = Date.now();
      const checkSilence = () => {
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        if (avg > 5) {
          // Hay sonido
          lastSoundTime = Date.now();
        } else if (Date.now() - lastSoundTime > silenceTimeoutMs) {
          // Silencio prolongado
          onSilence();
          return;
        }
        silenceTimerRef.current = window.setTimeout(checkSilence, 200);
      };
      silenceTimerRef.current = window.setTimeout(checkSilence, 200);
    },
    [silenceTimeoutMs],
  );

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current !== null) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const clearWebSpeechTimeout = useCallback(() => {
    if (webSpeechTimeoutRef.current !== null) {
      clearTimeout(webSpeechTimeoutRef.current);
      webSpeechTimeoutRef.current = null;
    }
  }, []);

  /**
   * Fallback: usa MediaRecorder para capturar el audio, luego lo
   * envía al backend /voice/transcribe (Google Cloud Speech).
   */
  const startMediaRecorderFallback = useCallback(
    async (language: SupportedVoiceLanguage) => {
      if (fallbackInProgressRef.current) return;
      fallbackInProgressRef.current = true;
      setMode("google-cloud");

      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("Tu navegador no soporta grabación de audio");
        }
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        chunksRef.current = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        recorder.onstop = async () => {
          clearSilenceTimer();
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
          } finally {
            fallbackInProgressRef.current = false;
          }
        };

        recorder.start();
        mediaRecorderRef.current = recorder;
        setState("recording");

        // Auto-stop por silencio (solo en modo cloud)
        startSilenceDetection(stream, () => {
          if (recorder.state !== "inactive") {
            recorder.stop();
          }
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Error desconocido";
        setError(msg);
        setState("error");
        onErrorRef.current?.(msg);
        fallbackInProgressRef.current = false;
      }
    },
    [clearSilenceTimer, startSilenceDetection],
  );

  /**
   * Inicia Web Speech API. Devuelve una promesa que se resuelve a:
   *   - "success" si el reconocimiento produjo texto
   *   - "error" si ocurrió un error que justifica fallback
   *   - "timeout" si no se recibió ningún resultado en webSpeechTimeoutMs
   *   - "no-speech" si el usuario no habló (no es un error de fallback)
   */
  const startWebSpeech = useCallback(
    (language: SupportedVoiceLanguage): Promise<"success" | "error" | "timeout" | "no-speech"> => {
      return new Promise((resolve) => {
        if (!hasWebSpeechSupport) {
          resolve("error");
          return;
        }
        const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognitionCtor();
        recognition.lang = language === "pt" ? "pt-BR" : language === "en" ? "en-US" : "es-ES";
        recognition.continuous = false;
        recognition.interimResults = true;

        let resolved = false;
        const safeResolve = (result: "success" | "error" | "timeout" | "no-speech") => {
          if (resolved) return;
          resolved = true;
          clearWebSpeechTimeout();
          resolve(result);
        };

        recognition.onresult = (event: any) => {
          let finalText = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            finalText += event.results[i][0]?.transcript ?? "";
          }
          setTranscript(finalText);
          if (finalText.trim().length > 0) {
            safeResolve("success");
          }
        };

        recognition.onerror = (event: any) => {
          const code = event.error;
          if (USER_CANCELLED_ERRORS.has(code)) {
            safeResolve("no-speech");
          } else {
            safeResolve("error");
          }
        };

        recognition.onend = () => {
          // Si Web Speech terminó sin error pero sin texto, es "no-speech"
          if (transcriptRef.current.trim().length > 0) {
            safeResolve("success");
          } else {
            safeResolve("no-speech");
          }
        };

        // Timeout: si en N ms no hubo resultado, fallback
        webSpeechTimeoutRef.current = window.setTimeout(() => {
          safeResolve("timeout");
        }, webSpeechTimeoutMs);

        try {
          recognition.start();
          recognitionRef.current = recognition;
          setMode("web-speech");
        } catch {
          safeResolve("error");
        }
      });
    },
    [hasWebSpeechSupport, webSpeechTimeoutMs, clearWebSpeechTimeout],
  );

  const start = useCallback(async () => {
    setError(null);
    setTranscript("");
    setAudioBlob(null);
    chunksRef.current = [];
    fallbackInProgressRef.current = false;
    const language = languageRef.current || "es";

    // 1. Verificar permisos primero
    const hasPermission = await checkMicrophonePermission();
    if (!hasPermission) {
      const msg = "Permiso de micrófono denegado. Habilítalo en tu navegador.";
      setError(msg);
      setState("error");
      onErrorRef.current?.(msg);
      return;
    }

    // 2. Si Web Speech NO está soportado, ir directo a fallback
    if (!hasWebSpeechSupport) {
      await startMediaRecorderFallback(language);
      return;
    }

    // 3. Probar Web Speech con timeout
    setState("recording");
    const result = await startWebSpeech(language);

    if (result === "success" || result === "no-speech") {
      // Web Speech funcionó (o terminó sin resultado)
      if (result === "success" && transcriptRef.current) {
        onTranscriptRef.current?.(transcriptRef.current, 0.9);
      }
      setState("idle");
      // Detener el recognition si sigue activo
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          /* ignore */
        }
        recognitionRef.current = null;
      }
      return;
    }

    // 4. Web Speech falló con un error de fallback → usar Google Cloud
    if (result === "error" || result === "timeout") {
      // Detener el recognition de Web Speech
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          /* ignore */
        }
        recognitionRef.current = null;
      }
      await startMediaRecorderFallback(language);
    }
  }, [checkMicrophonePermission, hasWebSpeechSupport, startWebSpeech, startMediaRecorderFallback]);

  const stop = useCallback(() => {
    clearSilenceTimer();
    clearWebSpeechTimeout();
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
  }, [clearSilenceTimer, clearWebSpeechTimeout]);

  const reset = useCallback(() => {
    setTranscript("");
    setError(null);
    setAudioBlob(null);
    setState("idle");
    setMode("unknown");
  }, []);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    state,
    mode,
    error,
    transcript,
    audioBlob,
    start,
    stop,
    reset,
    hasWebSpeechSupport,
  };
}
