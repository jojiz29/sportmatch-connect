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
// HELPERS DE FETCH CON TIMEOUT
// ==============================================================
// fetchWithTimeout(): Wrapper de fetch() con AbortSignal que aborta
// automáticamente después de `timeoutMs`. Sin esto, un backend colgado
// (ej. Render free tier dormido) podía hacer que el chat se quedara
// en "Conectando con Sporty..." indefinidamente.
//
// El error resultante es un DOMException con `name === "AbortError"`,
// que el catch del caller traduce a un mensaje amigable para el usuario.
const DEFAULT_TIMEOUT_MS = 30000; // 30 segundos es suficiente para LLMs

function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(input, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer));
}

// ==============================================================
// TIPOS PÚBLICOS DEL CONTRATO LLM
// ==============================================================

export interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

export interface SendMessageOptions {
  language?: "es" | "en" | "pt";
  history?: ChatMessage[];
}

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
  return (import.meta.env.VITE_API_URL as string) || "http://localhost:3000";
}

// ==============================================================
// FUNCIÓN PRINCIPAL
// ==============================================================

/**
 * fetchWelcomeMessage(): Pide al backend el primer mensaje del LLM
 * (Vertex AI) para arrancar la conversación. El backend genera este
 * mensaje dinámicamente con Gemini según el idioma del usuario y
 * opcionalmente el contexto (ubicación, racha, etc.).
 *
 * El mensaje de bienvenida se genera en cada sesión nueva para que sea
 * contextual (hora del día, idioma, racha deportiva). No se cachea en
 * el cliente — el LLM decide el saludo apropiado cada vez.
 */
export async function fetchWelcomeMessage(
  options: { language?: "es" | "en" | "pt" } = {},
): Promise<AiChatResponse> {
  const apiBaseUrl = getApiBaseUrl();
  if (!isAllowedApiHost(apiBaseUrl)) {
    throw new Error(
      `Configuración inválida: VITE_API_URL="${apiBaseUrl}" no apunta a un backend válido.`,
    );
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error("Sesión expirada. Por favor, inicia sesión de nuevo.");
  }

  const body: Record<string, unknown> = {};
  if (options.language) body.language = options.language;

  const response = await fetchWithTimeout(
    `${apiBaseUrl}/api/v1/ai/chat/welcome`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(body),
    },
    30000,
  );

  if (!response.ok) {
    if (response.status === 401) throw new Error("No autorizado. Inicia sesión de nuevo.");
    if (response.status === 429) throw new Error("Demasiadas solicitudes. Espera un momento.");
    const errPayload = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
    throw new Error(errPayload.message || `Error welcome (HTTP ${response.status})`);
  }

  const data = (await response.json()) as AiChatResponse;
  if (typeof data?.reply !== "string" || data.reply.trim().length === 0) {
    throw new Error("El asistente devolvió un mensaje de bienvenida vacío.");
  }
  return data;
}

// ==============================================================
// HELPERS PRIVADOS DE MANEJO DE ERRORES
// ==============================================================

/**
 * Traduce errores de red o AbortError a mensajes de usuario claros.
 * AbortError viene del timeout de fetchWithTimeout(); TypeError de red caída.
 */
function handleNetworkError(err: unknown): never {
  if (err instanceof Error && err.name === "AbortError") {
    throw new Error(
      "El asistente está tardando demasiado en responder. Por favor, intenta de nuevo.",
    );
  }
  const networkError = err instanceof Error ? err.message : "Error de red desconocido";
  throw new Error(
    `No se pudo contactar al asistente. Verifica tu conexión o inténtalo más tarde. (${networkError})`,
  );
}

/**
 * Lanza un error tipado según el código de estado HTTP de la respuesta.
 * 401 → sesión expirada, 429 → rate limit, resto → error de backend con payload.
 */
async function handleHttpError(response: Response): Promise<never> {
  if (response.status === 401) {
    throw new Error("No autorizado. Por favor, inicia sesión de nuevo.");
  }
  if (response.status === 429) {
    throw new Error("Has enviado demasiados mensajes. Espera un momento.");
  }
  const errorPayload = await response
    .json()
    .catch(() => ({ message: `HTTP ${response.status}` }));
  throw new Error(
    errorPayload.message || `Error al contactar con el asistente (HTTP ${response.status})`,
  );
}

/**
 * sendMessageToAI(): Envía un mensaje del usuario al backend de IA.
 * ------------------------------------------------------------------
 * Soporta multi-idioma y memoria conversacional.
 */
export async function sendMessageToAI(
  message: string,
  options: SendMessageOptions = {},
): Promise<AiChatResponse> {
  const trimmed = message.trim();
  if (!trimmed) {
    throw new Error("El mensaje no puede estar vacío");
  }

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

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;

  if (!token) {
    throw new Error("Sesión expirada. Por favor, inicia sesión de nuevo.");
  }

  const body: Record<string, unknown> = { message: trimmed };
  if (options.language) body.language = options.language;
  if (options.history && options.history.length > 0) body.history = options.history;

  let response: Response;
  try {
    response = await fetchWithTimeout(
      chatEndpoint,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      },
      30000,
    );
  } catch (err) {
    handleNetworkError(err);
  }

  if (!response.ok) {
    await handleHttpError(response);
  }

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
