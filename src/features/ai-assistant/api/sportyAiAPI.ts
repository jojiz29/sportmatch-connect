/**
 * ===================================================================
 * ARCHIVO: src/features/ai-assistant/api/sportyAiAPI.ts
 * PROPÓSITO: Capa de servicio para el Asistente Deportivo IA ("Sporty").
 *            Aísla la lógica de red de los componentes de UI.
 *            Cuando el backend Node.js + Vertex AI esté disponible,
 *            solo se reemplaza el cuerpo de sendMessageToAI().
 * ===================================================================
 */

// ==============================================================
// TIPOS PÚBLICOS DEL CONTRATO LLM
// ==============================================================

/** Payload de entrada para el endpoint de IA */
export interface AiChatRequest {
  message: string;
}

/** Payload de salida (lo que el backend / mock retorna) */
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
// CATÁLOGO MOCK (se elimina cuando el backend real esté listo)
// ==============================================================

const SPORTY_RESPONSES: string[] = [
  "¡Genial! Veo 3 canchas de fútbol 7 disponibles a menos de 2 km. ¿Te reservo una?",
  "Tienes 2 partidos abiertos de pádel esta tarde. ¿Quieres unirte?",
  "Según tu nivel Avanzado en fútbol, te recomiendo la Liga Élite que empieza este sábado.",
  "Hay una promoción en FitCenter: 20% de descuento en reservas hechas antes de las 6 PM.",
  "¿Prefieres jugar al vóley? Hay 4 jugadores buscando equipo en tu zona ahora mismo.",
  "Tu racha actual es de 3 días seguidos. ¡Sigue así y ganarás 500 FitCoins extra!",
  "He detectado que hace buen clima para correr. ¿Quieres que te muestre rutas cerca de tu casa?",
];

const FALLBACK_REPLY = "Lo siento, tuve un problema al procesar eso. ¿Puedes repetirlo?";

const DEFAULT_SUGGESTIONS: string[] = [
  "Buscar canchas cerca",
  "Ver mi racha",
  "Recomiéndame un partido",
];

// ==============================================================
// FUNCIÓN PRINCIPAL
// ==============================================================

/**
 * sendMessageToAI(): Envía un mensaje del usuario al backend de IA.
 * ------------------------------------------------------------------
 *  - En modo mock: simula latencia 800-2000ms y retorna una respuesta
 *    aleatoria del catálogo SPORTY_RESPONSES.
 *  - En modo real (futuro): hace POST a ${VITE_API_URL}/api/v1/ai/chat
 *    con el cuerpo { message } y espera un AiChatResponse.
 *
 *  IMPORTANTE: Esta función NUNCA lanza excepciones. En caso de
 *  error, retorna un objeto con un mensaje amigable para que la UI
 *  siempre tenga algo que renderizar.
 */
export async function sendMessageToAI(message: string): Promise<AiChatResponse> {
  // Construye URL del endpoint (se usará cuando se conecte el backend real).
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const url = `${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api/v1/ai/chat`;
  // Mantiene la firma del contrato: cuando se conecte el backend real,
  // `message` se usará en el body del POST.
  void message;

  try {
    // --- MOCK IMPLEMENTATION (reemplazar con fetch real cuando exista el backend) ---
    const delay = 800 + Math.random() * 1200;
    await new Promise((resolve) => setTimeout(resolve, delay));

    const idx = Math.floor(Math.random() * SPORTY_RESPONSES.length);
    return {
      reply: SPORTY_RESPONSES[idx],
      suggestions: DEFAULT_SUGGESTIONS,
      metadata: {
        tokens: 42 + Math.floor(Math.random() * 30),
        model: "vertex-ai-gemini-pro-mock",
        latencyMs: Math.round(delay),
      },
    };

    // --- CÓDIGO REAL (descomentar cuando el endpoint exista) ---
    // const response = await fetch(url, {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({ message } satisfies AiChatRequest),
    // });
    //
    // if (!response.ok) {
    //   throw new Error(`AI service responded with HTTP ${response.status}`);
    // }
    //
    // return (await response.json()) as AiChatResponse;
  } catch (err) {
    console.error("[sportyAiAPI] sendMessageToAI failed:", err);
    return {
      reply: FALLBACK_REPLY,
      suggestions: [],
      metadata: { tokens: 0, latencyMs: 0 },
    };
  }
}
