// ============================================================
// src/features/voice/ui/VoiceControl.tsx
// Feature #10/#13 — Botón mic + speaker para chat de Sporty
// Usa Web Speech API (gratis, on-device) y fallback a Google Cloud
// ============================================================

import { motion, AnimatePresence } from "framer-motion";
import { Mic, Volume2, VolumeX, Loader2, AlertTriangle, Square } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useVoiceRecorder } from "../hooks/useVoiceRecorder";
import { synthesizeSpeech } from "../api/voiceApi";
import {
  useAiAssistantStore,
  SupportedLanguage,
} from "@/features/ai-assistant/model/useAiAssistantStore";

interface VoiceControlProps {
  onTranscript?: (text: string) => void;
  textToSpeak?: string;
  textKey?: string | number;
}

// ============================================================
// HELPERS DE VOZ NATURAL
// ============================================================

/** BCP-47 con prefijo regional para Web Speech API */
function toBcp47(lang: SupportedLanguage): string {
  switch (lang) {
    case "en":
      return "en-US";
    case "pt":
      return "pt-BR";
    case "es":
    default:
      return "es-ES";
  }
}

/**
 * Elige la mejor voz disponible del navegador para el idioma dado.
 * Estrategia:
 *   1. Buscar voces "premium" / "neural" / "natural" (macOS, Edge, Chrome)
 *   2. Si no, primera voz cuyo lang coincida con el código BCP-47 exacto
 *   3. Si no, primera voz cuyo prefijo (es-, en-, pt-) coincida
 *   4. Si no, null (caller usa la default del sistema)
 */
function pickNaturalVoice(
  voices: SpeechSynthesisVoice[],
  bcp47: string,
): SpeechSynthesisVoice | null {
  if (!voices || voices.length === 0) return null;

  const langPrefix = bcp47.split("-")[0];

  // 1) Premium voices (Samantha, Ava, Allison, Microsoft Neural, etc.)
  const premium = voices.find(
    (v) => v.lang.startsWith(langPrefix) && /premium|neural|natural|enhanced|google/i.test(v.name),
  );
  if (premium) return premium;

  // 2) Coincidencia exacta de locale
  const exact = voices.find((v) => v.lang === bcp47);
  if (exact) return exact;

  // 3) Cualquier voz del idioma (sin importar el locale)
  const any = voices.find((v) => v.lang.startsWith(langPrefix));
  if (any) return any;

  return null;
}

export function VoiceControl({ onTranscript, textToSpeak, textKey }: VoiceControlProps) {
  const { t } = useTranslation();
  const language = useAiAssistantStore((s) => s.language) as SupportedLanguage;
  const { state, error, transcript, start, stop, hasWebSpeechSupport } = useVoiceRecorder({
    language,
    onTranscript: (text) => onTranscript?.(text),
    onError: (msg) => console.error("Voice error:", msg),
  });

  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const lastSpokenKey = useRef<string | number | null>(null);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Web Speech API carga las voces de forma asíncrona en algunos navegadores
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const synth = window.speechSynthesis;

    const loadVoices = () => {
      const v = synth.getVoices();
      if (v.length > 0) setAvailableVoices(v);
    };
    loadVoices();
    // Algunos navegadores (Chrome) disparan 'voiceschanged' cuando están listas
    synth.addEventListener("voiceschanged", loadVoices);
    return () => synth.removeEventListener("voiceschanged", loadVoices);
  }, []);

  const speakText = useCallback(
    async (text: string) => {
      if (!text) return;
      setIsSpeaking(true);
      try {
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(text);
          const bcp47 = toBcp47(language);
          utterance.lang = bcp47;

          // Voz natural según idioma
          const voice = pickNaturalVoice(availableVoices, bcp47);
          if (voice) utterance.voice = voice;

          // Parámetros para sonar más humano (menos robótico)
          utterance.rate = 0.98; // ligeramente más lento = más claro
          utterance.pitch = 1.0; // neutral, no agudo
          utterance.volume = 1.0;

          utterance.onend = () => setIsSpeaking(false);
          utterance.onerror = () => setIsSpeaking(false);
          utteranceRef.current = utterance;
          window.speechSynthesis.speak(utterance);
          return;
        }
        // Fallback: Google Cloud TTS
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
    [language, availableVoices],
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

  // Detener la voz cuando se desmonta el componente
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return (
    <div className="flex items-center gap-1">
      {/* Botón micrófono para STT */}
      <motion.button
        type="button"
        onClick={state === "recording" ? stop : start}
        disabled={state === "processing"}
        aria-label={state === "recording" ? t("voice.stop_recording") : t("voice.start_recording")}
        title={
          state === "recording"
            ? t("voice.stop_recording")
            : hasWebSpeechSupport
              ? t("voice.start_recording_web")
              : t("voice.start_recording_cloud")
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

      {/* Botón speaker para TTS (solo si hay texto para leer) */}
      {textToSpeak && (
        <motion.button
          type="button"
          onClick={isSpeaking ? stopSpeaking : () => speakText(textToSpeak)}
          aria-label={isSpeaking ? t("voice.stop_speaking") : t("voice.read_aloud")}
          title={isSpeaking ? t("voice.stop_speaking") : t("voice.read_aloud")}
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
            className="absolute -bottom-6 left-0 right-0 text-[9px] text-primary animate-pulse whitespace-nowrap"
          >
            {t("voice.listening", { transcript: transcript.slice(0, 40) })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
