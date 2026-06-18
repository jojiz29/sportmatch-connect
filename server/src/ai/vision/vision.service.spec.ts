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
      const { service, vertexAi } = buildService(
        '{"match":true,"confidence":0.74,"samePersonLikelihood":0.76,"visualSimilarity":0.72,"blockingIssue":"none","message":"Rasgos faciales compatibles pese al paso de los anos.","selfieQuality":"good","dniQuality":"fair","suggestions":[]}',
      );

      const result = await service.verifyDniWithSelfie(
        Buffer.from("selfie"),
        "image/jpeg",
        Buffer.from("dni"),
        "image/jpeg",
        "es",
      );

      expect(result.match).toBe(true);
      expect(result.confidence).toBe(0.76);
      expect(result.message).toContain("compatibles");
      expect(vertexAi.generateContentWithMedia).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          mediaParts: expect.arrayContaining([
            expect.objectContaining({ text: expect.stringContaining("SELFIE") }),
            expect.objectContaining({ text: expect.stringContaining("DNI") }),
          ]),
        }),
      );
    });

    it("aprueba como coincidencia probable cuando el DNI antiguo baja la confianza pero hay rasgos compatibles", async () => {
      const { service } = buildService(
        '{"match":false,"confidence":0.42,"samePersonLikelihood":0.58,"visualSimilarity":0.56,"blockingIssue":"none","message":"Rasgos estables compatibles, aunque la foto del DNI parece antigua y de menor calidad.","selfieQuality":"good","dniQuality":"fair","stableTraits":["forma del rostro compatible","distancia ocular similar"],"differences":["peinado e iluminacion"],"suggestions":["Usa una foto del DNI sin reflejos"]}',
      );

      const result = await service.verifyDniWithSelfie(
        Buffer.from("selfie"),
        "image/jpeg",
        Buffer.from("dni"),
        "image/jpeg",
        "es",
      );

      expect(result.match).toBe(true);
      expect(result.confidence).toBeGreaterThanOrEqual(0.55);
      expect(result.confidence).toBeLessThan(0.7);
      expect(result.message).toContain("compatibles");
    });

    it("no bloquea por poor_dni cuando aun hay similitud facial compatible", async () => {
      const { service } = buildService(
        '{"match":false,"confidence":0.36,"samePersonLikelihood":0.57,"visualSimilarity":0.54,"blockingIssue":"poor_dni","message":"La foto del DNI es antigua y borrosa, pero conserva rasgos compatibles con la selfie.","selfieQuality":"good","dniQuality":"poor","stableTraits":["proporcion facial compatible"],"differences":["calidad del documento"],"suggestions":["Sube una foto del DNI con menos brillo"]}',
      );

      const result = await service.verifyDniWithSelfie(
        Buffer.from("selfie"),
        "image/jpeg",
        Buffer.from("dni"),
        "image/jpeg",
        "es",
      );

      expect(result.match).toBe(true);
      expect(result.confidence).toBeGreaterThanOrEqual(0.55);
      expect(result.dniQuality).toBe("poor");
    });

    it("mantiene rechazo cuando el modelo reporta mismatch claro", async () => {
      const { service } = buildService(
        '{"match":false,"confidence":0.82,"samePersonLikelihood":0.12,"visualSimilarity":0.18,"blockingIssue":"clear_mismatch","message":"No es la misma persona: estructura facial diferente y rasgos incompatibles.","selfieQuality":"good","dniQuality":"good","stableTraits":[],"differences":["estructura facial diferente"],"suggestions":[]}',
      );

      const result = await service.verifyDniWithSelfie(
        Buffer.from("selfie"),
        "image/jpeg",
        Buffer.from("dni"),
        "image/jpeg",
        "es",
      );

      expect(result.match).toBe(false);
      expect(result.confidence).toBeGreaterThanOrEqual(0.7);
      expect(result.message).toContain("No es la misma persona");
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
