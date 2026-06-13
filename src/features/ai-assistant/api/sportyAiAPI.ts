/**
 * ===================================================================
 * ARCHIVO: src/features/ai-assistant/api/sportyAiAPI.ts
 * PROPÓSITO: Capa de servicio para el Asistente Deportivo IA ("Sporty").
 *            Realiza la llamada HTTP al endpoint /api/v1/ai/chat del
 *            backend NestJS, el cual orquesta Vertex AI con las
 *            credenciales seguras del Service Account.
 * ===================================================================
 */

import { supabase } from "@/shared/api/supabase";

// ==============================================================
// TIPOS PÚBLICOS DEL CONTRATO LLM
// ==============================================================

/** Payload de entrada para el endpoint de IA */
export interface AiChatRequest {
  message: string;
}

/** Payload de salida del backend (debe coincidir con ChatResponseDto) */
export interface AiChatResponse {
  reply: string;
  suggestions: string[];
  metadata: {
    tokens: number;
    model?: string;
    latencyMs?: number;
  };
}

// ==============================================================
// CONFIGURACIÓN
// ==============================================================

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
const CHAT_ENDPOINT = `${API_BASE_URL}/api/v1/ai/chat`;

// ==============================================================
// FUNCIÓN PRINCIPAL
// ==============================================================

/**
 * sendMessageToAI(): Envía un mensaje del usuario al backend de IA.
 * ------------------------------------------------------------------
 * El backend NestJS (protegido por SupabaseAuthGuard) se encarga de:
 *  1. Validar el token del usuario.
 *  2. Aplicar rate limiting por userId.
 *  3. Inyectar el system prompt y delegar a Vertex AI.
 *  4. Devolver { reply, suggestions, metadata }.
 *
 * Si la petición falla por red, timeout o 5xx, se lanza un error
 * para que el store pueda mostrar un mensaje contextual al usuario.
 */
export async function sendMessageToAI(message: string): Promise<AiChatResponse> {
  const trimmed = message.trim();
  if (!trimmed) {
    throw new Error("El mensaje no puede estar vacío");
  }

  // 1. Obtener el Bearer token de la sesión actual de Supabase
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;

  if (!token) {
    throw new Error("Sesión expirada. Por favor, inicia sesión de nuevo.");
  }

  // 2. Llamada HTTP al backend NestJS
  const response = await fetch(CHAT_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ message: trimmed } satisfies AiChatRequest),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("No autorizado. Por favor, inicia sesión de nuevo.");
    }
    if (response.status === 429) {
      throw new Error("Has enviado demasiados mensajes. Espera un momento.");
    }
    // Intenta extraer el mensaje de error del backend
    const errorPayload = await response
      .json()
      .catch(() => ({ message: `HTTP ${response.status}` }));
    throw new Error(
      errorPayload.message || `Error al contactar con el asistente (HTTP ${response.status})`,
    );
  }

  return (await response.json()) as AiChatResponse;
}
