/**
 * ===================================================================
 * ARCHIVO: src/features/ai-assistant/api/sportyAiAPI.ts
 * PROPÓSITO: Capa de servicio para el Asistente Deportivo IA ("Sporty").
 *            Realiza la llamada HTTP al endpoint /api/v1/ai/chat del
 *            backend NestJS, el cual orquesta Vertex AI con las
 *            credenciales seguras del Service Account.
 *
 * ⚠️  IMPORTANTE: Esta capa NO contiene respuestas hardcodeadas ni
 * mocks. Todas las respuestas provienen EXCLUSIVAMENTE de Vertex AI
 * a través del backend NestJS. Si el backend falla, el error se
 * propaga al store y la UI lo muestra como burbuja de error visible.
 *
 * Flujo:  [Chat UI] → [sendMessageToAI] → [/api/v1/ai/chat (NestJS)]
 *        → [VertexAiService] → [Google Gen AI (gemini-2.5-flash)]
 *        → respuesta natural del LLM al usuario.
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

// Lista explícita de hosts permitidos. Bloquea llamadas accidentales a
// páginas estáticas (e.g. el propio frontend de Vercel) que devolverían
// HTML en vez de JSON, confundiendo al usuario con respuestas vacías.
const ALLOWED_HOST_PATTERNS = [
  /^https?:\/\/localhost(:\d+)?$/,
  /^https?:\/\/[a-z0-9-]+\.onrender\.com$/,
  /^https?:\/\/[a-z0-9-]+\.render\.com$/,
  /^https?:\/\/[a-z0-9-]+\.fly\.dev$/,
  /^https?:\/\/[a-z0-9-]+\.railway\.app$/,
  /^https?:\/\/api\.[a-z0-9-]+\.(com|dev|app)$/,
];

function isAllowedApiHost(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ALLOWED_HOST_PATTERNS.some((pattern) => pattern.test(parsed.origin));
  } catch {
    return false;
  }
}

function getApiBaseUrl(): string {
  // Se evalúa en cada llamada para que los tests puedan sobreescribir
  // import.meta.env.VITE_API_URL y para que la config en runtime surta
  // efecto sin reiniciar el bundle.
  return import.meta.env.VITE_API_URL || "http://localhost:3000";
}

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
 * Esta función SIEMPRE lanza un Error si la petición falla.
 * NO hace fallback a respuestas hardcodeadas: el usuario debe ver
 * el error real y poder reportarlo, en lugar de recibir texto
 * incoherente que no responde a su mensaje.
 */
export async function sendMessageToAI(message: string): Promise<AiChatResponse> {
  const trimmed = message.trim();
  if (!trimmed) {
    throw new Error("El mensaje no puede estar vacío");
  }

  // 0. Validación de configuración: evita llamadas a hosts no permitidos
  //    (caso típico: VITE_API_URL apunta al frontend de Vercel en lugar
  //    del backend de Render).
  const apiBaseUrl = getApiBaseUrl();
  if (!isAllowedApiHost(apiBaseUrl)) {
    const errorMessage =
      `Configuración inválida: VITE_API_URL="${apiBaseUrl}" no apunta a un backend válido. ` +
      `Verifica la variable de entorno en tu archivo .env o en el dashboard de Vercel. ` +
      `Debe ser la URL del backend NestJS (e.g. https://sportmatch-api.onrender.com).`;
    console.error("[sportyAiAPI]", errorMessage);
    throw new Error(errorMessage);
  }

  const chatEndpoint = `${apiBaseUrl}/api/v1/ai/chat`;

  // 1. Obtener el Bearer token de la sesión actual de Supabase
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;

  if (!token) {
    throw new Error("Sesión expirada. Por favor, inicia sesión de nuevo.");
  }

  // 2. Llamada HTTP al backend NestJS
  let response: Response;
  try {
    response = await fetch(chatEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ message: trimmed } satisfies AiChatRequest),
    });
  } catch (err) {
    // Error de red (sin conexión, DNS, CORS preflight, etc.)
    const networkError = err instanceof Error ? err.message : "Error de red desconocido";
    throw new Error(
      `No se pudo contactar al asistente. Verifica tu conexión o inténtalo más tarde. (${networkError})`,
    );
  }

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

  // Validar que la respuesta es JSON con la forma esperada
  let data: AiChatResponse;
  try {
    data = (await response.json()) as AiChatResponse;
  } catch {
    throw new Error("La respuesta del asistente no es JSON válido.");
  }

  if (typeof data?.reply !== "string" || data.reply.trim().length === 0) {
    throw new Error("El asistente devolvió una respuesta vacía.");
  }

  return data;
}
