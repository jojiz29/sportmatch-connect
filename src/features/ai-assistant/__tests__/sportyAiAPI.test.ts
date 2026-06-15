/**
 * Tests anti-mock para el módulo de AI Assistant.
 *
 * Garantizan que:
 *  1. No exista un catálogo de respuestas hardcodeadas (la causa raíz del
 *     bug visto en producción el 13-jun-2026).
 *  2. sendMessageToAI() siempre llame al endpoint real del backend.
 *  3. La configuración de VITE_API_URL apunte a un backend válido.
 *  4. El store delegue al backend (no haga fallback a texto local).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock supabase para que la capa de auth no falle en el entorno de tests
vi.mock("@/shared/api/supabase", () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { access_token: "fake-jwt-token" } },
      }),
    },
  },
}));

const BACKEND_URL = "https://sportmatch-api.onrender.com";

describe("AI Assistant — anti-mock safeguards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Por defecto, VITE_API_URL apunta a un backend válido para que las
    // pruebas de la API funcionen sin el guardarraíl de configuración.
    vi.stubEnv("VITE_API_URL", BACKEND_URL);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("sportyAiAPI.ts no contiene catálogos de respuestas hardcodeadas", async () => {
    // El bug que vimos en producción: el archivo tenía un array
    // SPORTY_RESPONSES con 7 textos fijos. Si vuelve a aparecer,
    // este test lo detecta inmediatamente.
    const fs = await import("node:fs");
    const source = await fs.promises.readFile(
      "src/features/ai-assistant/api/sportyAiAPI.ts",
      "utf-8",
    );

    expect(source).not.toMatch(/SPORTY_RESPONSES/);
    expect(source).not.toMatch(/Math\.random\(\)\s*\*\s*[\w[\].]+Responses\./);
    expect(source).not.toMatch(/FALLBACK_REPLY\s*=\s*["']/);
  });

  it("sendMessageToAI() hace POST al endpoint del backend NestJS", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        reply: "¡Hola! Soy Sporty ⚡",
        suggestions: ["Buscar canchas"],
        metadata: { tokens: 42, model: "gemini-2.5-flash", latencyMs: 1200 },
      }),
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const { sendMessageToAI } = await import("../api/sportyAiAPI");
    const response = await sendMessageToAI("Hola Sporty");

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe(`${BACKEND_URL}/api/v1/ai/chat`);
    expect(init.method).toBe("POST");
    expect(init.headers.Authorization).toBe("Bearer fake-jwt-token");
    expect(JSON.parse(init.body)).toEqual({ message: "Hola Sporty" });

    expect(response.reply).toBe("¡Hola! Soy Sporty ⚡");
    expect(response.metadata.model).toBe("gemini-2.5-flash");
  });

  it("sendMessageToAI() lanza error si no hay token de sesión", async () => {
    const { supabase } = await import("@/shared/api/supabase");
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: null },
      error: null,
    } as never);

    const { sendMessageToAI } = await import("../api/sportyAiAPI");
    await expect(sendMessageToAI("Hola")).rejects.toThrow(/sesi[oó]n/i);
  });

  it("sendMessageToAI() propaga errores HTTP 401", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ message: "Token inválido" }),
    }) as unknown as typeof fetch;

    const { sendMessageToAI } = await import("../api/sportyAiAPI");
    await expect(sendMessageToAI("test")).rejects.toThrow(/No autorizado/);
  });

  it("fetchWelcomeMessage() hace POST al endpoint /chat/welcome y devuelve respuesta del LLM", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        reply: "¡Hola! Soy Sporty, tu asistente deportivo ⚡ ¿En qué te ayudo hoy?",
        suggestions: ["Buscar canchas", "Ver mi racha", "Reservar"],
        metadata: { tokens: 30, model: "gemini-2.5-flash", latencyMs: 800 },
      }),
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const { fetchWelcomeMessage } = await import("../api/sportyAiAPI");
    const response = await fetchWelcomeMessage({ language: "es" });

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe(`${BACKEND_URL}/api/v1/ai/chat/welcome`);
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({ language: "es" });
    expect(response.reply).toMatch(/Sporty/);
    expect(response.suggestions).toHaveLength(3);
  });

  it("fetchWelcomeMessage() rechaza si la respuesta del LLM está vacía", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        reply: "",
        suggestions: [],
        metadata: { tokens: 0, model: "gemini-2.5-flash", latencyMs: 100 },
      }),
    }) as unknown as typeof fetch;

    const { fetchWelcomeMessage } = await import("../api/sportyAiAPI");
    await expect(fetchWelcomeMessage({ language: "es" })).rejects.toThrow(/vacío/);
  });

  it("ChatInterface.tsx NO contiene textos hardcoded de bienvenida (debe venir del LLM)", async () => {
    // El bug que vimos: el JSX tenía "¡Hola! Soy Sporty" hardcoded.
    // Ahora debe venir del LLM via fetchWelcomeMessage().
    const fs = await import("node:fs");
    const source = await fs.promises.readFile(
      "src/features/ai-assistant/ui/ChatInterface.tsx",
      "utf-8",
    );

    // No debe haber texto de bienvenida hardcoded en el JSX principal
    expect(source).not.toMatch(/¡Hola! Soy Sporty/);
    expect(source).not.toMatch(/Tu asistente deportivo\. Pregúntame/);
  });

  it("sendMessageToAI() propaga errores HTTP 429 (rate limit)", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({ message: "Too many requests" }),
    }) as unknown as typeof fetch;

    const { sendMessageToAI } = await import("../api/sportyAiAPI");
    await expect(sendMessageToAI("test")).rejects.toThrow(/demasiados mensajes/);
  });

  it("sendMessageToAI() rechaza si VITE_API_URL apunta al frontend de Vercel", async () => {
    vi.stubEnv("VITE_API_URL", "https://sportmatch-connect-juan-alonso.vercel.app");

    const { sendMessageToAI } = await import("../api/sportyAiAPI");
    await expect(sendMessageToAI("test")).rejects.toThrow(/Configuraci[oó]n inv[aá]lida/);
  });

  it("sendMessageToAI() rechaza respuestas vacías del backend", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ reply: "", suggestions: [], metadata: {} }),
    }) as unknown as typeof fetch;

    const { sendMessageToAI } = await import("../api/sportyAiAPI");
    await expect(sendMessageToAI("test")).rejects.toThrow(/vac[ií]a/);
  });
});

describe("AI Assistant Store — sin respuestas locales", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.stubEnv("VITE_API_URL", BACKEND_URL);
    // Resetear el estado del store entre tests
    const { useAiAssistantStore } = await import("../model/useAiAssistantStore");
    useAiAssistantStore.setState({ messages: [], isTyping: false, error: null });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("useAiAssistantStore inicia con messages vacío (sin WELCOME quemado)", async () => {
    const { useAiAssistantStore } = await import("../model/useAiAssistantStore");
    const state = useAiAssistantStore.getState();
    expect(state.messages).toEqual([]);
    expect(state.error).toBeNull();
  });

  it("sendMessage() añade mensaje del usuario y luego el del asistente (vía API)", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        reply: "Claro, te ayudo con eso ⚽",
        suggestions: ["Buscar canchas", "Ver partidos"],
        metadata: { tokens: 50, model: "gemini-2.5-flash", latencyMs: 800 },
      }),
    }) as unknown as typeof fetch;

    const { useAiAssistantStore } = await import("../model/useAiAssistantStore");
    await useAiAssistantStore.getState().sendMessage("Necesito una cancha");

    const state = useAiAssistantStore.getState();
    expect(state.messages).toHaveLength(2);
    expect(state.messages[0]?.role).toBe("user");
    expect(state.messages[0]?.text).toBe("Necesito una cancha");
    expect(state.messages[1]?.role).toBe("assistant");
    expect(state.messages[1]?.text).toBe("Claro, te ayudo con eso ⚽");
    expect(state.isTyping).toBe(false);
  });

  it("sendMessage() guarda el error como mensaje del sistema (no como texto del asistente)", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ message: "Internal Server Error" }),
    }) as unknown as typeof fetch;

    const { useAiAssistantStore } = await import("../model/useAiAssistantStore");
    await useAiAssistantStore.getState().sendMessage("test");

    const state = useAiAssistantStore.getState();
    const lastMsg = state.messages[state.messages.length - 1];
    expect(lastMsg?.role).toBe("system");
    expect(lastMsg?.variant).toBe("error");
  });
});
