// ============================================================
// ai.service.spec.ts — Pruebas unitarias de AiService & Vision
// Cobertura completa del módulo de visión artificial
// ============================================================

/* eslint-disable @typescript-eslint/no-explicit-any */
import { Test, TestingModule } from "@nestjs/testing";
import { AiService } from "./ai.service";
import { VertexAiService } from "./vertex-ai.service";
import { BadRequestException } from "@nestjs/common";
import { VisionAnalysisType } from "./dto/vision-analyze.dto";

describe("AiService — Vision Analyze", () => {
  let service: AiService;
  let vertexAiMock: any;
  const originalFetch = global.fetch;

  beforeEach(async () => {
    vertexAiMock = {
      generateContent: jest.fn(),
      analyzeImage: jest.fn(),
    };

    global.fetch = jest.fn() as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [AiService, { provide: VertexAiService, useValue: vertexAiMock }],
    }).compile();

    service = module.get<AiService>(AiService);

    jest.clearAllMocks();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it("should successfully process and analyze fake-profile images", async () => {
    // Mock fetch for image download
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      headers: { get: () => "image/png" },
      arrayBuffer: async () => new ArrayBuffer(8),
    });

    // Mock Vertex AI analysis
    vertexAiMock.analyzeImage.mockResolvedValue({
      result: {
        isLikelyAIGenerated: true,
        confidence: 0.92,
        reasons: ["Falta de simetría en pupilas", "Textura plástica en piel"],
      },
      confidence: 0.92,
    });

    const result = await service.analyzeVision(
      "user123",
      "https://example.com/fake-avatar.png",
      VisionAnalysisType.FAKE_PROFILE,
    );

    expect((result as any).success).toBeUndefined(); // returns raw { result, confidence }
    expect(result.confidence).toBe(0.92);
    expect((result.result as any).isLikelyAIGenerated).toBe(true);
    expect((result.result as any).reasons).toContain("Falta de simetría en pupilas");

    expect(global.fetch).toHaveBeenCalledWith("https://example.com/fake-avatar.png");
    expect(vertexAiMock.analyzeImage).toHaveBeenCalledWith(
      {
        mimeType: "image/png",
        base64Data: expect.any(String),
      },
      expect.stringContaining("Analiza esta fotografía de perfil."),
      0.1,
    );
  });

  it("should successfully process and analyze form-analysis (posture) images", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      headers: { get: () => "image/jpeg" },
      arrayBuffer: async () => new ArrayBuffer(8),
    });

    vertexAiMock.analyzeImage.mockResolvedValue({
      result: {
        score: 85,
        strengths: ["Buena alineación de hombros", "Equilibrio correcto"],
        improvements: ["Doblar más las rodillas"],
        confidence: 0.9,
      },
      confidence: 0.9,
    });

    const result = await service.analyzeVision(
      "user123",
      "https://example.com/posture.jpg",
      VisionAnalysisType.FORM_ANALYSIS,
    );

    expect(result.confidence).toBe(0.9);
    expect((result.result as any).score).toBe(85);
    expect((result.result as any).strengths).toContain("Buena alineación de hombros");

    expect(global.fetch).toHaveBeenCalledWith("https://example.com/posture.jpg");
    expect(vertexAiMock.analyzeImage).toHaveBeenCalledWith(
      {
        mimeType: "image/jpeg",
        base64Data: expect.any(String),
      },
      expect.stringContaining("Analiza la postura deportiva"),
      0.1,
    );
  });

  it("should support base64 data URLs without fetching", async () => {
    vertexAiMock.analyzeImage.mockResolvedValue({
      result: {
        score: 95,
        strengths: [],
        improvements: [],
      },
      confidence: 0.95,
    });

    const base64Url = "data:image/webp;base64,U3BvcnRNYXRjaCBDb25uZWN0";

    const result = await service.analyzeVision(
      "user123",
      base64Url,
      VisionAnalysisType.FORM_ANALYSIS,
    );

    expect(result.confidence).toBe(0.95);
    expect(global.fetch).not.toHaveBeenCalled();
    expect(vertexAiMock.analyzeImage).toHaveBeenCalledWith(
      {
        mimeType: "image/webp",
        base64Data: "U3BvcnRNYXRjaCBDb25uZWN0",
      },
      expect.any(String),
      0.1,
    );
  });

  it("should throw BadRequestException if image fetch fails", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      statusText: "Not Found",
    });

    await expect(
      service.analyzeVision(
        "user123",
        "https://example.com/invalid-image.jpg",
        VisionAnalysisType.FAKE_PROFILE,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it("should throw BadRequestException if data URL format is invalid", async () => {
    await expect(
      service.analyzeVision("user123", "data:image/webp;abc", VisionAnalysisType.FAKE_PROFILE),
    ).rejects.toThrow(BadRequestException);
  });

  it("should enforce vision rate limit bucket", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      headers: { get: () => "image/jpeg" },
      arrayBuffer: async () => new ArrayBuffer(8),
    });

    vertexAiMock.analyzeImage.mockResolvedValue({
      result: { ok: true },
      confidence: 1.0,
    });

    // Enviar 30 peticiones (límite es 30 por minuto)
    for (let i = 0; i < 30; i++) {
      await service.analyzeVision(
        "user123",
        "https://example.com/img.jpg",
        VisionAnalysisType.FAKE_PROFILE,
      );
    }

    // La petición 31 debe arrojar un error de rate limit (TOO_MANY_REQUESTS)
    await expect(
      service.analyzeVision(
        "user123",
        "https://example.com/img.jpg",
        VisionAnalysisType.FAKE_PROFILE,
      ),
    ).rejects.toThrow();
  });
});
