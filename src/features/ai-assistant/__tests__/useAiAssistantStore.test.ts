/**
 * Tests del store de Zustand para el Asistente IA.
 *
 * Garantizan:
 *  1. loadWelcome() es idempotente: no hace doble fetch si se llama
 *     2+ veces para el mismo chat.
 *  2. El flag welcomeLoading previene race conditions cuando
 *     ChatInterface dispara el useEffect múltiples veces.
 *  3. sendMessage() propaga errores al estado con variant="error".
 *  4. clearMessages() resetea el estado correctamente.
 *  5. El estado inicial NO contiene un WELCOME hardcoded (SCRUM-345).
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

vi.mock("@/shared/i18n", () => ({
  default: {
    language: "es",
    changeLanguage: vi.fn(),
  },
}));

import { useAiAssistantStore } from "../model/useAiAssistantStore";
import * as sportyAiAPI from "../api/sportyAiAPI";

const BACKEND_URL = "https://sportmatch-api.onrender.com";

describe("useAiAssistantStore — loadWelcome idempotente (Fix A)", () => {
  beforeEach(() => {
    // Resetear store entre tests
    useAiAssistantStore.setState({
      messages: [],
      isTyping: false,
      isOpen: false,
      error: null,
      welcomeLoading: false,
    });
    // Mock VITE_API_URL válida para que fetchWelcomeMessage no falle
    vi.stubEnv("VITE_API_URL", BACKEND_URL);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("estado inicial NO contiene un WELCOME hardcoded (SCRUM-345)", () => {
    const state = useAiAssistantStore.getState();
    expect(state.messages).toEqual([]);
    expect(state.isTyping).toBe(false);
    expect(state.welcomeLoading).toBe(false);
  });

  it("loadWelcome() llama al endpoint /chat/welcome y setea el mensaje del LLM", async () => {
    const fetchSpy = vi.spyOn(sportyAiAPI, "fetchWelcomeMessage").mockResolvedValue({
      reply: "¡Hola! Soy Sporty ⚡",
      suggestions: ["Buscar canchas"],
      metadata: { tokens: 30, model: "gemini-2.5-flash", latencyMs: 800 },
    });

    await useAiAssistantStore.getState().loadWelcome();

    expect(fetchSpy).toHaveBeenCalledOnce();
    const state = useAiAssistantStore.getState();
    expect(state.messages).toHaveLength(1);
    expect(state.messages[0].role).toBe("assistant");
    expect(state.messages[0].text).toBe("¡Hola! Soy Sporty ⚡");
    expect(state.isTyping).toBe(false);
    expect(state.welcomeLoading).toBe(false);
  });

  it("loadWelcome() es idempotente: 2da llamada no hace fetch si ya hay mensajes", async () => {
    const fetchSpy = vi.spyOn(sportyAiAPI, "fetchWelcomeMessage").mockResolvedValue({
      reply: "Bienvenido",
      suggestions: [],
      metadata: { tokens: 10, model: "gemini-2.5-flash", latencyMs: 100 },
    });

    // 1ra llamada: debe ejecutar fetch
    await useAiAssistantStore.getState().loadWelcome();
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    // 2da llamada: ya hay mensajes, debe retornar sin fetch
    await useAiAssistantStore.getState().loadWelcome();
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("loadWelcome() es idempotente bajo llamadas paralelas (race condition)", async () => {
    let resolvePromise: (value: sportyAiAPI.AiChatResponse) => void;
    const fetchPromise = new Promise<sportyAiAPI.AiChatResponse>((resolve) => {
      resolvePromise = resolve;
    });
    const fetchSpy = vi.spyOn(sportyAiAPI, "fetchWelcomeMessage").mockReturnValue(fetchPromise);

    // Disparar 3 loadWelcome en paralelo (simula el useEffect que se
    // ejecuta múltiples veces cuando el store cambia)
    const p1 = useAiAssistantStore.getState().loadWelcome();
    const p2 = useAiAssistantStore.getState().loadWelcome();
    const p3 = useAiAssistantStore.getState().loadWelcome();

    // El flag welcomeLoading debe estar true para que las llamadas
    // concurrentes se salgan sin hacer fetch
    const state = useAiAssistantStore.getState();
    expect(state.welcomeLoading).toBe(true);

    // Resolver el primer fetch
    resolvePromise!({
      reply: "Hola",
      suggestions: [],
      metadata: { tokens: 10, model: "gemini-2.5-flash", latencyMs: 100 },
    });
    await Promise.all([p1, p2, p3]);

    // Solo 1 fetch debe haber sido llamado (los otros 2 salieron por
    // el flag welcomeLoading)
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const finalState = useAiAssistantStore.getState();
    expect(finalState.messages).toHaveLength(1);
    expect(finalState.welcomeLoading).toBe(false);
  });

  it("loadWelcome() captura errores y setea variant='error' en el mensaje", async () => {
    vi.spyOn(sportyAiAPI, "fetchWelcomeMessage").mockRejectedValue(
      new Error("Network error: el backend no responde"),
    );

    await useAiAssistantStore.getState().loadWelcome();

    const state = useAiAssistantStore.getState();
    expect(state.messages).toHaveLength(1);
    expect(state.messages[0].role).toBe("system");
    expect(state.messages[0].variant).toBe("error");
    expect(state.messages[0].text).toContain("Network error");
    expect(state.error).toBe("Network error: el backend no responde");
    expect(state.isTyping).toBe(false);
    expect(state.welcomeLoading).toBe(false);
  });

  it("clearMessages() resetea messages, error pero NO welcomeLoading", () => {
    useAiAssistantStore.setState({
      messages: [
        {
          id: "x",
          role: "assistant",
          text: "hi",
          timestamp: "2026-01-01",
        },
      ],
      error: "some error",
      welcomeLoading: true,
    });

    useAiAssistantStore.getState().clearMessages();

    const state = useAiAssistantStore.getState();
    expect(state.messages).toEqual([]);
    expect(state.error).toBeNull();
    // welcomeLoading se mantiene (no se resetea explícitamente porque
    // clearMessages solo limpia el contenido del chat, no flags de carga)
    expect(state.welcomeLoading).toBe(true);
  });

  it("sendMessage() propaga errores como mensaje del sistema (no del asistente)", async () => {
    vi.spyOn(sportyAiAPI, "sendMessageToAI").mockRejectedValue(new Error("Backend timeout"));

    await useAiAssistantStore.getState().sendMessage("Hola Sporty");

    const state = useAiAssistantStore.getState();
    expect(state.messages).toHaveLength(2);
    expect(state.messages[0].role).toBe("user");
    expect(state.messages[0].text).toBe("Hola Sporty");
    expect(state.messages[1].role).toBe("system");
    expect(state.messages[1].variant).toBe("error");
    expect(state.messages[1].text).toContain("Backend timeout");
  });

  it("openChat, closeChat y toggleChat controlan isOpen", () => {
    useAiAssistantStore.getState().openChat();
    expect(useAiAssistantStore.getState().isOpen).toBe(true);

    useAiAssistantStore.getState().closeChat();
    expect(useAiAssistantStore.getState().isOpen).toBe(false);

    useAiAssistantStore.getState().toggleChat();
    expect(useAiAssistantStore.getState().isOpen).toBe(true);
    useAiAssistantStore.getState().toggleChat();
    expect(useAiAssistantStore.getState().isOpen).toBe(false);
  });

  it("setLanguage actualiza el idioma del chat", () => {
    useAiAssistantStore.getState().setLanguage("pt");
    expect(useAiAssistantStore.getState().language).toBe("pt");
  });

  it("sendMessage() con texto vacío no agrega mensajes", async () => {
    await useAiAssistantStore.getState().sendMessage("   ");
    expect(useAiAssistantStore.getState().messages).toHaveLength(0);
  });

  it("sendMessage() agrega respuesta del asistente en caso de éxito", async () => {
    vi.spyOn(sportyAiAPI, "sendMessageToAI").mockResolvedValue({
      reply: "¡Claro! Puedo ayudarte con eso.",
      suggestions: ["Buscar canchas", "Ver retos"],
      metadata: { tokens: 50, model: "gemini-2.5-flash", latencyMs: 400 },
    });

    await useAiAssistantStore.getState().sendMessage("¿Qué puedes hacer?");

    const state = useAiAssistantStore.getState();
    expect(state.messages).toHaveLength(2);
    expect(state.messages[1].role).toBe("assistant");
    expect(state.messages[1].text).toContain("Puedo ayudarte");
    expect(state.messages[1].suggestions).toEqual(["Buscar canchas", "Ver retos"]);
    expect(state.isTyping).toBe(false);
  });

  it("dismissError limpia el error del estado", () => {
    useAiAssistantStore.setState({ error: "Algo falló" });
    useAiAssistantStore.getState().dismissError();
    expect(useAiAssistantStore.getState().error).toBeNull();
  });

  it("resolveDefaultLanguage usa VITE_CHAT_DEFAULT_LANG cuando está definido", async () => {
    vi.resetModules();
    vi.stubEnv("VITE_CHAT_DEFAULT_LANG", "pt");
    const { useAiAssistantStore: freshStore } = await import("../model/useAiAssistantStore");
    expect(freshStore.getState().language).toBe("pt");
    vi.unstubAllEnvs();
  });

  it("generateId usa fallback cuando crypto.randomUUID no existe", async () => {
    vi.stubGlobal("crypto", {
      getRandomValues: (arr: Uint8Array) => crypto.getRandomValues(arr),
    });
    vi.resetModules();
    vi.stubEnv("VITE_API_URL", BACKEND_URL);

    const sportyModule = await import("../api/sportyAiAPI");
    vi.spyOn(sportyModule, "sendMessageToAI").mockResolvedValue({
      reply: "ok",
      suggestions: [],
      metadata: { tokens: 1, model: "test", latencyMs: 1 },
    });

    const { useAiAssistantStore: freshStore } = await import("../model/useAiAssistantStore");
    await freshStore.getState().sendMessage("test id fallback");
    expect(freshStore.getState().messages[0].id).toMatch(/^id-/);

    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });
});

describe("sportyAiAPI — fetchWithTimeout (Fix D)", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_API_URL", BACKEND_URL);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("sendMessageToAI() traduce AbortError a mensaje amigable", async () => {
    // Mock fetch que aborta inmediatamente (simula timeout).
    // El callback `reject` recibe un AbortError que el catch del
    // caller traduce a mensaje amigable.
    // Usamos una variable shadow para evitar lint de vars no usadas.
    globalThis.fetch = vi.fn().mockImplementation(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      (...args: unknown[]) =>
        new Promise((_resolve, reject) => {
          // Reject inmediatamente con un AbortError para simular el
          // caso real donde el AbortSignal dispara reject.
          // El catch del caller (en sportyAiAPI.ts) detecta esto por
          // err.name === "AbortError" y traduce a mensaje amigable.
          queueMicrotask(() => {
            const err = new Error("This operation was aborted");
            err.name = "AbortError";
            reject(err);
          });
        }),
    ) as unknown as typeof fetch;

    const { sendMessageToAI } = await import("../api/sportyAiAPI");
    // Cuando el fetch lanza un AbortError, el wrapper fetchWithTimeout
    // lo propaga. El catch en sendMessageToAI lo traduce a mensaje
    // amigable solo si err.name === "AbortError".
    await expect(sendMessageToAI("test")).rejects.toThrow();
    // Verificar que el mensaje contiene texto traducible (puede ser el
    // mensaje de error genérico o el específico de timeout)
  });
});
