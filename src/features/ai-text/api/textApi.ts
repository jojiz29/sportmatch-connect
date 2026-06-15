// ============================================================
// src/features/ai-text/api/textApi.ts — Cliente para endpoints /ai/text/*
// Feature #2 Smart Comments, #3 Auto-Hashtags, #6 Content Moderation
// ============================================================

import { supabase } from "@/shared/api/supabase";
import type {
  CommentSuggestionRequest,
  CommentSuggestionResponse,
  HashtagsRequest,
  HashtagsResponse,
  ModerateRequest,
  ModerateResponse,
} from "./types";

const BACKEND_URL = (import.meta.env.VITE_API_URL as string) || "http://localhost:3000";
const TEXT_BASE = `${BACKEND_URL}/api/v1/ai/text`;

// Lista de hosts permitidos (mismo patrón que sportyAiAPI)
const ALLOWED_HOSTS = [
  /^https?:\/\/localhost(:\d+)?$/,
  /^https?:\/\/[a-z0-9-]+\.onrender\.com$/,
  /^https?:\/\/[a-z0-9-]+\.render\.com$/,
  /^https?:\/\/[a-z0-9-]+\.fly\.dev$/,
  /^https?:\/\/[a-z0-9-]+\.railway\.app$/,
  /^https?:\/\/api\.[a-z0-9-]+\.(com|dev|app)$/,
];

function getApiBaseUrl(): string {
  return (import.meta.env.VITE_API_URL as string) || "http://localhost:3000";
}

function validateApiHost(): void {
  const apiBaseUrl = getApiBaseUrl();
  try {
    const parsed = new URL(apiBaseUrl);
    const valid = ALLOWED_HOSTS.some((p) => p.test(parsed.origin));
    if (!valid) {
      throw new Error(
        `Configuración inválida: VITE_API_URL="${apiBaseUrl}" no apunta a un backend válido. Verifica tu .env.`,
      );
    }
  } catch (err) {
    if (err instanceof TypeError) {
      throw new Error(`VITE_API_URL no es una URL válida: ${apiBaseUrl}`);
    }
    throw err;
  }
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) {
    throw new Error("Sesión expirada. Por favor, inicia sesión de nuevo.");
  }
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

async function postJson<T>(endpoint: string, body: unknown): Promise<T> {
  validateApiHost();
  const headers = await getAuthHeaders();
  const response = await fetch(`${TEXT_BASE}${endpoint}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("No autorizado. Por favor, inicia sesión de nuevo.");
    }
    if (response.status === 429) {
      throw new Error("Has enviado demasiadas solicitudes. Espera un momento.");
    }
    const errPayload = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
    throw new Error(errPayload.message || `Error en endpoint AI (HTTP ${response.status})`);
  }

  const data = (await response.json()) as T;
  if (!data || typeof data !== "object") {
    throw new Error("Respuesta inválida del servidor");
  }
  return data;
}

// ==============================================================
// FEATURE #2 — SMART COMMENT SUGGESTIONS
// ==============================================================
export async function getCommentSuggestions(
  request: CommentSuggestionRequest,
): Promise<CommentSuggestionResponse> {
  return postJson<CommentSuggestionResponse>("/comment-suggestion", request);
}

// ==============================================================
// FEATURE #3 — AUTO-HASHTAGS
// ==============================================================
function normalizeHashtag(tag: string): string {
  return tag
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .trim();
}

export async function generateHashtags(request: HashtagsRequest): Promise<HashtagsResponse> {
  const response = await postJson<HashtagsResponse>("/hashtags", request);
  return {
    ...response,
    tags: response.tags.map(normalizeHashtag).filter((t) => t.length > 0),
  };
}

// ==============================================================
// FEATURE #6 — CONTENT MODERATION
// ==============================================================
export async function moderateContent(request: ModerateRequest): Promise<ModerateResponse> {
  return postJson<ModerateResponse>("/moderate", request);
}
