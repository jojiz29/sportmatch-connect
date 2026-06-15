/**
 * Tests para el cliente AI Text (Features #2, #3, #6)
 *
 * Garantizan que:
 *  1. No hay catálogos hardcoded (anti-mock safeguard)
 *  2. La validación de host funciona
 *  3. Las funciones hacen POST al endpoint correcto
 *  4. Los errores HTTP se propagan correctamente
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

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

describe("AI Text API — anti-mock safeguards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("VITE_API_URL", BACKEND_URL);
    globalThis.fetch = vi.fn() as unknown as typeof fetch;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("textApi.ts no contiene catálogos hardcoded de respuestas", async () => {
    const fs = await import("node:fs");
    const source = await fs.promises.readFile("src/features/ai-text/api/textApi.ts", "utf-8");
    expect(source).not.toMatch(/FALLBACK_AI_TAGS\s*=/);
    expect(source).not.toMatch(/FALLBACK_SUGGESTIONS\s*=/);
    expect(source).not.toMatch(/MOCK_COMMENTS\s*=/);
  });

  it("getCommentSuggestions() hace POST al endpoint /text/comment-suggestion", async () => {
    (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        suggestions: ["¡Qué buena!", "¡Increíble!", "Cuéntanos más"],
        metadata: { tokens: 50, model: "gemini-2.5-flash", latencyMs: 800 },
      }),
    });

    const { getCommentSuggestions } = await import("../api/textApi");
    const res = await getCommentSuggestions({
      postContext: "Gran partido hoy",
      partialText: "Qué",
      language: "es",
    });
    const [url, init] = (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe(`${BACKEND_URL}/api/v1/ai/text/comment-suggestion`);
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({
      postContext: "Gran partido hoy",
      partialText: "Qué",
      language: "es",
    });
    expect(res.suggestions).toHaveLength(3);
  });

  it("generateHashtags() normaliza tags a lowercase sin acentos", async () => {
    (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        tags: ["Pádel", "Miraflores", "Competitivo", "Avanzado"],
        metadata: { tokens: 30, model: "gemini-2.5-flash", latencyMs: 500 },
      }),
    });

    const { generateHashtags } = await import("../api/textApi");
    const res = await generateHashtags({
      content: "Pádel competitivo en Miraflores nivel avanzado",
    });
    expect(res.tags).toEqual(["padel", "miraflores", "competitivo", "avanzado"]);
  });

  it("moderateContent() propaga el flag flagged del backend", async () => {
    (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        safe: false,
        flagged: true,
        categorias: { toxicity: 0.92, harassment: 0.1, sexual: 0.05, violence: 0.0 },
        confidencia: 0.95,
        preview: "Te voy a matar",
      }),
    });

    const { moderateContent } = await import("../api/textApi");
    const res = await moderateContent({ text: "Te voy a matar", context: "comment" });
    expect(res.flagged).toBe(true);
    expect(res.categorias.toxicity).toBeGreaterThan(0.7);
  });

  it("lanza error 429 cuando se excede el rate limit", async () => {
    (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({ message: "Demasiadas solicitudes" }),
    });

    const { getCommentSuggestions } = await import("../api/textApi");
    await expect(
      getCommentSuggestions({ postContext: "test", partialText: "test test test" }),
    ).rejects.toThrow(/demasiadas/i);
  });

  it("rechaza VITE_API_URL inválido (apunta a frontend de Vercel)", async () => {
    vi.stubEnv("VITE_API_URL", "https://sportmatch-connect-juan-alonso.vercel.app");

    const { getCommentSuggestions } = await import("../api/textApi");
    await expect(getCommentSuggestions({ postContext: "x", partialText: "abc" })).rejects.toThrow(
      /no apunta a un backend/i,
    );
  });
});

describe("Voice API — anti-mock safeguards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("VITE_API_URL", BACKEND_URL);
    globalThis.fetch = vi.fn() as unknown as typeof fetch;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("voiceApi.ts no contiene TTS hardcodeado", async () => {
    const fs = await import("node:fs");
    const source = await fs.promises.readFile("src/features/voice/api/voiceApi.ts", "utf-8");
    expect(source).not.toMatch(/MOCK_AUDIO\s*=/);
    expect(source).not.toMatch(/HARDCODED_VOICE/);
  });

  it("transcribeAudio() hace POST multipart al endpoint /voice/transcribe", async () => {
    (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        text: "Hola Sporty",
        confianza: 0.95,
        language: "es-ES",
        latencyMs: 1200,
      }),
    });

    const { transcribeAudio } = await import("../../voice/api/voiceApi");
    const audio = new Blob([new Uint8Array([0, 1, 2, 3])], { type: "audio/webm" });
    const res = await transcribeAudio({ audio, language: "es" });
    const [url, init] = (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe(`${BACKEND_URL}/api/v1/ai/voice/transcribe`);
    expect(init.method).toBe("POST");
    expect(res.text).toBe("Hola Sporty");
  });

  it("synthesizeSpeech() hace POST JSON al endpoint /voice/synthesize", async () => {
    (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        audioBase64: "bW9ja2F1ZGlv",
        format: "mp3",
        voice: "es-ES-Neural2-A",
        latencyMs: 1500,
      }),
    });

    const { synthesizeSpeech } = await import("../../voice/api/voiceApi");
    const res = await synthesizeSpeech({ text: "Hola mundo", language: "es" });
    expect(res.audioBase64).toBe("bW9ja2F1ZGlv");
    expect(res.format).toBe("mp3");
  });
});
