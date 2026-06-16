// ============================================================
// src/features/voice/api/voiceApi.ts — Cliente para endpoints Voice
// Feature #10 STT + #13 TTS
// ============================================================

import { supabase } from "@/shared/api/supabase";
import type {
  VoiceTranscriptionRequest,
  VoiceTranscriptionResponse,
  VoiceSynthesizeRequest,
  VoiceSynthesizeResponse,
} from "./types";

const BACKEND_URL = (import.meta.env.VITE_API_URL as string) || "http://localhost:3000";
const VOICE_BASE = `${BACKEND_URL}/api/v1/ai/voice`;

const ALLOWED_HOSTS = [
  /^https?:\/\/localhost(:\d+)?$/,
  /^https?:\/\/[a-z0-9-]+\.onrender\.com$/,
  /^https?:\/\/[a-z0-9-]+\.render\.com$/,
  /^https?:\/\/[a-z0-9-]+\.fly\.dev$/,
  /^https?:\/\/[a-z0-9-]+\.railway\.app$/,
  /^https?:\/\/api\.[a-z0-9-]+\.(com|dev|app)$/,
];

function validateApiHost(): void {
  const apiBaseUrl = BACKEND_URL;
  try {
    const parsed = new URL(apiBaseUrl);
    if (!ALLOWED_HOSTS.some((p) => p.test(parsed.origin))) {
      throw new Error(`VITE_API_URL="${apiBaseUrl}" no es un backend válido`);
    }
  } catch (err) {
    if (err instanceof TypeError) {
      throw new Error(`VITE_API_URL no es URL válida: ${apiBaseUrl}`);
    }
    throw err;
  }
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error("Sesión expirada. Por favor, inicia sesión de nuevo.");
  }
  return { Authorization: `Bearer ${session.access_token}` };
}

/**
 * transcribeAudio(): Envía audio al backend /ai/voice/transcribe
 * Feature #10 — Speech-to-Text via Google Cloud Speech o Web Speech API.
 */
export async function transcribeAudio(
  request: VoiceTranscriptionRequest,
): Promise<VoiceTranscriptionResponse> {
  validateApiHost();
  const headers = await getAuthHeaders();
  const formData = new FormData();
  formData.append("audio", request.audio, "recording.webm");
  if (request.language) formData.append("language", request.language);

  const response = await fetch(`${VOICE_BASE}/transcribe`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!response.ok) {
    if (response.status === 401) throw new Error("No autorizado. Inicia sesión de nuevo.");
    if (response.status === 429) throw new Error("Demasiadas solicitudes. Espera un momento.");
    const errPayload = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
    throw new Error(errPayload.message || `Error STT (HTTP ${response.status})`);
  }

  const data = (await response.json()) as VoiceTranscriptionResponse;
  if (typeof data?.text !== "string") {
    throw new TypeError("La transcripción recibida no es válida.");
  }
  return data;
}

/**
 * synthesizeSpeech(): Solicita audio TTS al backend /ai/voice/synthesize
 * Feature #13 — Text-to-Speech via Google Cloud TTS o Web Speech API.
 */
export async function synthesizeSpeech(
  request: VoiceSynthesizeRequest,
): Promise<VoiceSynthesizeResponse> {
  validateApiHost();
  const headers = await getAuthHeaders();
  headers["Content-Type"] = "application/json";

  const response = await fetch(`${VOICE_BASE}/synthesize`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      text: request.text,
      voice: request.voice,
      language: request.language,
      speed: request.speed,
    }),
  });

  if (!response.ok) {
    if (response.status === 401) throw new Error("No autorizado. Inicia sesión de nuevo.");
    const errPayload = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
    throw new Error(errPayload.message || `Error TTS (HTTP ${response.status})`);
  }

  return (await response.json()) as VoiceSynthesizeResponse;
}
