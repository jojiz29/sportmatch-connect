import { VisionService } from "./vision.service";
import { VertexAiService, VertexAiGenerationResult } from "../vertex-ai.service";

describe("VisionService", () => {
  const buildResult = (text: string): VertexAiGenerationResult => ({
    text,
    latencyMs: 12,
    model: "test-model",
    tokens: 33,
  });

  const buildService = (text: string) => {
    const vertexAi = {
      generateContentWithMedia: jest.fn().mockResolvedValue(buildResult(text)),
    } as unknown as jest.Mocked<VertexAiService>;

    return {
      service: new VisionService(vertexAi),
      vertexAi,
    };
  };

  describe("detectFakeProfile", () => {
    it("parsea JSON aunque venga envuelto en markdown", async () => {
      const { service, vertexAi } = buildService(
        '```json\n{"isFake":false,"authenticityScore":91,"explanation":"Rostro humano real visible.","confidence":0.88,"signals":["rostro visible"]}\n```',
      );

      const result = await service.detectFakeProfile(Buffer.from("image"), "image/jpeg", "es");

      expect(result.isFake).toBe(false);
      expect(result.authenticityScore).toBe(91);
      expect(result.confidence).toBe(0.88);
      expect(vertexAi.generateContentWithMedia).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          temperature: 0,
          responseMimeType: "application/json",
        }),
      );
    });

    it("clasifica imagen no humana como no verificable y evita el 50 neutro", async () => {
      const { service } = buildService(
        "La imagen muestra un gato naranja animado sin rostro humano.",
      );

      const result = await service.detectFakeProfile(Buffer.from("image"), "image/png", "es");

      expect(result.isFake).toBe(true);
      expect(result.authenticityScore).toBeLessThanOrEqual(10);
      expect(result.explanation).toContain("persona real");
    });
  });

  describe("verifyDniWithSelfie", () => {
    it("parsea coincidencia visual en JSON con fotos de diferente antiguedad", async () => {
      const { service } = buildService(
        '{"match":true,"confidence":0.74,"message":"Rasgos faciales compatibles pese al paso de los anos.","selfieQuality":"good","dniQuality":"fair","suggestions":[]}',
      );

      const result = await service.verifyDniWithSelfie(
        Buffer.from("selfie"),
        "image/jpeg",
        Buffer.from("dni"),
        "image/jpeg",
        "es",
      );

      expect(result.match).toBe(true);
      expect(result.confidence).toBe(0.74);
      expect(result.message).toContain("compatibles");
    });

    it("no muestra respuestas evasivas del modelo cuando DNI no devuelve JSON", async () => {
      const { service } = buildService(
        "Como IA no puedo realizar biometria certificada ni confirmar identidades.",
      );

      const result = await service.verifyDniWithSelfie(
        Buffer.from("selfie"),
        "image/jpeg",
        Buffer.from("dni"),
        "image/jpeg",
        "es",
      );

      expect(result.match).toBe(false);
      expect(result.confidence).toBeLessThanOrEqual(0.35);
      expect(result.message).not.toMatch(/biometr|no puedo|modelo/i);
      expect(result.suggestions ?? []).toHaveLength(2);
    });
  });
});
