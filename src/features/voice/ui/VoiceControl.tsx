// ============================================================
// src/features/voice/ui/VoiceControl.tsx
// Feature #10/#13 — Botón mic + speaker para chat de Sporty
// Usa Web Speech API (gratis, on-device) y fallback a Google Cloud
// ============================================================

import { motion, AnimatePresence } from "framer-motion";
import { Mic, Volume2, VolumeX, Loader2, AlertTriangle, Square } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useVoiceRecorder } from "../hooks/useVoiceRecorder";
import { synthesizeSpeech } from "../api/voiceApi";
import {
  useAiAssistantStore,
  SupportedLanguage,
} from "@/features/ai-assistant/model/useAiAssistantStore";

interface VoiceControlProps {
  onTranscript?: (text: string) => void;
  textToSpeak?: string;
  textKey?: string | number; // Cuando cambia, se reproduce este nuevo texto
}

export function VoiceControl({ onTranscript, textToSpeak, textKey }: VoiceControlProps) {
  const language = useAiAssistantStore((s) => s.language) as SupportedLanguage;
  const { state, error, transcript, start, stop, hasWebSpeechSupport } = useVoiceRecorder({
    language,
    onTranscript: (text) => onTranscript?.(text),
    onError: (msg) => console.error("Voice error:", msg),
  });

  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const lastSpokenKey = useRef<string | number | null>(null);

  const speakText = useCallback(
    async (text: string) => {
      if (!text) return;
      setIsSpeaking(true);
      try {
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = language === "pt" ? "pt-BR" : language === "en" ? "en-US" : "es-ES";
          utterance.rate = 1.0;
          utterance.onend = () => setIsSpeaking(false);
          utterance.onerror = () => setIsSpeaking(false);
          utteranceRef.current = utterance;
          window.speechSynthesis.speak(utterance);
          return;
        }
        const res = await synthesizeSpeech({ text, language });
        const audio = new Audio(`data:audio/mpeg;base64,${res.audioBase64}`);
        audio.onended = () => setIsSpeaking(false);
        audio.onerror = () => setIsSpeaking(false);
        await audio.play();
      } catch (err) {
        console.error("TTS failed:", err);
        setIsSpeaking(false);
      }
    },
    [language],
  );

  // Auto-reproducir textToSpeak cuando cambie
  useEffect(() => {
    if (textToSpeak && textKey !== undefined && textKey !== lastSpokenKey.current) {
      lastSpokenKey.current = textKey;
      speakText(textToSpeak);
    }
  }, [textToSpeak, textKey, speakText]);

  const stopSpeaking = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  return (
    <div className="flex items-center gap-1">
      {/* Botón micrófono para STT */}
      <motion.button
        type="button"
        onClick={state === "recording" ? stop : start}
        disabled={state === "processing"}
        aria-label={state === "recording" ? "Detener grabación" : "Grabar audio"}
        title={
          state === "recording"
            ? "Detener grabación"
            : hasWebSpeechSupport
              ? "Grabar audio (Web Speech API)"
              : "Grabar audio (Google Cloud Speech)"
        }
        className={`h-8 w-8 rounded-lg grid place-items-center transition-all cursor-pointer ${
          state === "recording"
            ? "bg-destructive text-destructive-foreground animate-pulse"
            : state === "processing"
              ? "bg-muted cursor-not-allowed"
              : "bg-[color:var(--color-chat-input-bg)] hover:bg-accent text-primary"
        }`}
      >
        {state === "processing" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : state === "recording" ? (
          <Square className="h-3 w-3" fill="currentColor" />
        ) : (
          <Mic className="h-4 w-4" />
        )}
      </motion.button>

      {/* Botón speaker para TTS */}
      {textToSpeak && (
        <motion.button
          type="button"
          onClick={isSpeaking ? stopSpeaking : () => speakText(textToSpeak)}
          aria-label={isSpeaking ? "Detener lectura" : "Leer mensaje en voz alta"}
          title={isSpeaking ? "Detener lectura" : "Leer mensaje en voz alta"}
          className={`h-8 w-8 rounded-lg grid place-items-center transition-all cursor-pointer ${
            isSpeaking
              ? "bg-primary text-primary-foreground"
              : "bg-[color:var(--color-chat-input-bg)] hover:bg-accent text-primary"
          }`}
        >
          {isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </motion.button>
      )}

      {/* Error inline */}
      {error && (
        <div className="absolute -bottom-6 left-0 right-0 text-[9px] text-destructive flex items-center gap-1">
          <AlertTriangle className="h-2.5 w-2.5" />
          {error}
        </div>
      )}

      {/* Indicador de transcripción en vivo */}
      <AnimatePresence>
        {state === "recording" && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="absolute -bottom-6 left-0 right-0 text-[9px] text-primary animate-pulse"
          >
            🎤 Escuchando... {transcript && `"${transcript.slice(0, 40)}..."`}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
