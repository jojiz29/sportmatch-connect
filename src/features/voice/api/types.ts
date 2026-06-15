// ============================================================
// src/features/voice/api/types.ts — Tipos para endpoints Voice AI
// Feature #10 (STT) + #13 (TTS)
// ============================================================

export type SupportedVoiceLanguage = "es" | "en" | "pt";

export type VoiceGender = "MALE" | "FEMALE" | "NEUTRAL";

export interface VoiceTranscriptionRequest {
  audio: Blob;
  language?: SupportedVoiceLanguage;
}

export interface VoiceTranscriptionResponse {
  text: string;
  confianza: number;
  language: string;
  latencyMs: number;
}

export interface VoiceSynthesizeRequest {
  text: string;
  voice?: string;
  language?: SupportedVoiceLanguage;
  speed?: number;
}

export interface VoiceSynthesizeResponse {
  audioBase64: string;
  format: "mp3";
  voice: string;
  latencyMs: number;
}
