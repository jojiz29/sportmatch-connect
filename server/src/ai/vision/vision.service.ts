import { Injectable, Logger } from "@nestjs/common";
import { VertexAiService } from "../vertex-ai.service";
import {
  AnalyzeImageResponseDto,
  AnalyzeVideoResponseDto,
  FormAnalyzeResponseDto,
  FakeProfileResponseDto,
  DniVerifyResponseDto,
} from "./dto/vision.dto";

@Injectable()
export class VisionService {
  private readonly logger = new Logger(VisionService.name);

  constructor(private readonly vertexAi: VertexAiService) {}

  async analyzeImage(
    imageBuffer: Buffer,
    mimeType: string,
    prompt?: string,
    language?: "es" | "en" | "pt",
  ): Promise<AnalyzeImageResponseDto> {
    const defaultPrompt = prompt || "Describe esta imagen en detalle.";
    const base64Data = imageBuffer.toString("base64");

    const result = await this.vertexAi.generateContentWithMedia(defaultPrompt, {
      language,
      mediaParts: [{ inlineData: { mimeType, data: base64Data } }],
    });

    return {
      analysis: result.text,
      latencyMs: result.latencyMs,
      model: result.model,
      tokens: result.tokens,
    };
  }

  async analyzeVideo(
    frames: Buffer[],
    mimeType: string,
    prompt?: string,
    language?: "es" | "en" | "pt",
  ): Promise<AnalyzeVideoResponseDto> {
    const defaultPrompt =
      prompt ||
      "Analiza este video frame a frame. Evalúa la postura deportiva, técnica y movimientos. " +
        "Proporciona un score del 0-100 y 3 recomendaciones específicas para mejorar. " +
        "Responde en formato JSON con los campos: analysis (string), score (number 0-100), recommendations (string[]).";

    const mediaParts = frames.map((frame) => ({
      inlineData: { mimeType, data: frame.toString("base64") },
    }));

    const result = await this.vertexAi.generateContentWithMedia(defaultPrompt, {
      language,
      mediaParts,
    });

    let score: number | undefined;
    let recommendations: string[] | undefined;
    let analysis = result.text;

    try {
      const parsed = JSON.parse(result.text);
      if (parsed.analysis) analysis = parsed.analysis;
      if (typeof parsed.score === "number") score = parsed.score;
      if (Array.isArray(parsed.recommendations)) recommendations = parsed.recommendations;
    } catch {
      // response is plain text, not JSON — use as-is
    }

    return {
      analysis,
      score,
      recommendations,
      latencyMs: result.latencyMs,
      framesAnalyzed: frames.length,
      model: result.model,
      tokens: result.tokens,
    };
  }

  // ============================================================
  // #8 — FORM ANALYZER
  // ============================================================
  async analyzeForm(
    frames: Buffer[],
    mimeType: string,
    sport: string,
    prompt?: string,
    language?: "es" | "en" | "pt",
  ): Promise<FormAnalyzeResponseDto> {
    const promptText =
      prompt ||
      `Eres un entrenador deportivo experto en ${sport}. Analiza estos frames de video y evalúa la técnica del jugador. ` +
        "Responde ESTRICTAMENTE en formato JSON sin markdown ni texto adicional externo con los siguientes campos:\n" +
        '  "score": number 0-100,\n' +
        '  "analysis": string (descripción detallada en 2-3 oraciones),\n' +
        '  "recommendations": string[] (3 recomendaciones específicas para mejorar),\n' +
        '  "keyPoints": string[] (3-5 puntos clave observados),\n' +
        '  "detectedLevel": "principiante" | "intermedio" | "avanzado" | "profesional"\n' +
        "}";

    const mediaParts = frames.map((frame) => ({
      inlineData: { mimeType, data: frame.toString("base64") },
    }));

    const result = await this.vertexAi.generateContentWithMedia(promptText, {
      language,
      mediaParts,
    });

    try {
      const parsed = JSON.parse(result.text);
      return {
        score: parsed.score ?? 50,
        analysis: parsed.analysis || result.text,
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
        keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
        detectedLevel: parsed.detectedLevel || "intermedio",
        latencyMs: result.latencyMs,
        framesAnalyzed: frames.length,
        model: result.model,
        tokens: result.tokens,
      };
    } catch {
      return {
        score: 50,
        analysis: result.text,
        recommendations: [],
        keyPoints: [],
        detectedLevel: "intermedio",
        latencyMs: result.latencyMs,
        framesAnalyzed: frames.length,
        model: result.model,
        tokens: result.tokens,
      };
    }
  }

  // ============================================================
  // #26 — FAKE PROFILE DETECTOR
  // ============================================================
  async detectFakeProfile(
    imageBuffer: Buffer,
    mimeType: string,
    language?: "es" | "en" | "pt",
  ): Promise<FakeProfileResponseDto> {
    const lang = language || "es";
    const promptByLang: Record<string, string> = {
      es:
        "Eres un experto en verificacion visual de perfiles. Analiza la imagen enviada y determina si muestra una persona real y verificable. " +
        "No entregues un porcentaje de IA: entrega un porcentaje de veracidad humana/persona real. Marca isFake=true solo si hay evidencia fuerte de imagen artificial, alterada o si no aparece una persona real. " +
        "Responde ESTRICTAMENTE en formato JSON sin markdown ni texto adicional:\n" +
        "{\n" +
        '  "isFake": boolean (true solo con evidencia alta de imagen artificial/alterada o ausencia de persona real),\n' +
        '  "authenticityScore": number 0-100 (100 = persona real muy probable, 0 = artificial o no verificable),\n' +
        '  "explanation": string (explicacion del analisis en 2-3 oraciones),\n' +
        '  "confidence": number 0-1 (nivel de confianza del analisis),\n' +
        '  "signals": string[] (senales especificas: rostro visible, consistencia facial, iluminacion, piel, artefactos, edicion o ausencia de persona)\n' +
        "}",
      en:
        "You are an expert in visual profile verification. Analyze the submitted image and determine whether it shows a real, verifiable person. " +
        "Do not return an AI percentage: return a human/person authenticity percentage. Set isFake=true only when there is strong evidence of an artificial/edited image or no real person appears. " +
        "Respond STRICTLY in JSON format without markdown:\n" +
        "{\n" +
        '  "isFake": boolean,\n' +
        '  "authenticityScore": number 0-100,\n' +
        '  "explanation": string (2-3 sentences),\n' +
        '  "confidence": number 0-1,\n' +
        '  "signals": string[]\n' +
        "}",
      pt:
        "Voce e especialista em verificacao visual de perfis. Analise a imagem enviada e determine se mostra uma pessoa real e verificavel. " +
        "Nao retorne uma porcentagem de IA: retorne uma porcentagem de veracidade humana/pessoa real. Marque isFake=true apenas se houver evidencia forte de imagem artificial, alterada ou se nao aparecer uma pessoa real. " +
        "Responda ESTRITAMENTE em formato JSON sem markdown:\n" +
        "{\n" +
        '  "isFake": boolean,\n' +
        '  "authenticityScore": number 0-100,\n' +
        '  "explanation": string,\n' +
        '  "confidence": number 0-1,\n' +
        '  "signals": string[]\n' +
        "}",
    };

    const promptText = promptByLang[lang] || promptByLang.es;
    const base64Data = imageBuffer.toString("base64");

    const result = await this.vertexAi.generateContentWithMedia(promptText, {
      language: lang as "es" | "en" | "pt",
      mediaParts: [{ inlineData: { mimeType, data: base64Data } }],
    });

    try {
      const parsed = JSON.parse(result.text);
      return {
        isFake: parsed.isFake ?? false,
        authenticityScore: parsed.authenticityScore ?? 50,
        explanation: parsed.explanation || result.text,
        confidence: parsed.confidence ?? 0.5,
        signals: Array.isArray(parsed.signals) ? parsed.signals : [],
        latencyMs: result.latencyMs,
        model: result.model,
        tokens: result.tokens,
      };
    } catch {
      return {
        isFake: false,
        authenticityScore: 50,
        explanation: result.text,
        confidence: 0.5,
        signals: [],
        latencyMs: result.latencyMs,
        model: result.model,
        tokens: result.tokens,
      };
    }
  }

  // ============================================================
  // #32 — DNI VERIFICATION 2.0 (Selfie + DNI face match)
  // ============================================================
  async verifyDniWithSelfie(
    selfieBuffer: Buffer,
    selfieMimeType: string,
    dniBuffer: Buffer,
    dniMimeType: string,
    language?: "es" | "en" | "pt",
  ): Promise<DniVerifyResponseDto> {
    const lang = language || "es";
    const promptByLang: Record<string, string> = {
      es:
        "Eres un experto en verificación biométrica facial. Compara el SELFIE (primera imagen) con la foto del DNI (segunda imagen). " +
        "Analiza si son la misma persona evaluando: forma del rostro, distribución de ojos/nariz/boca, estructura ósea. " +
        "Responde ESTRICTAMENTE en formato JSON sin markdown:\n" +
        "{\n" +
        '  "match": boolean (true si es la misma persona),\n' +
        '  "confidence": number 0-1 (nivel de confianza del match),\n' +
        '  "message": string (mensaje descriptivo),' +
        '  "selfieQuality": "poor" | "fair" | "good" | "excellent",\n' +
        '  "dniQuality": "poor" | "fair" | "good" | "excellent",\n' +
        '  "suggestions": string[] (sugerencias si la calidad es baja)\n' +
        "}",
      en:
        "You are a biometric facial verification expert. Compare the SELFIE (first image) with the DNI/ID photo (second image). " +
        "Analyze if they are the same person by evaluating: face shape, eye/nose/mouth layout, bone structure. " +
        "Respond STRICTLY in JSON format without markdown:\n" +
        "{\n" +
        '  "match": boolean,\n' +
        '  "confidence": number 0-1,\n' +
        '  "message": string,\n' +
        '  "selfieQuality": "poor" | "fair" | "good" | "excellent",\n' +
        '  "dniQuality": "poor" | "fair" | "good" | "excellent",\n' +
        '  "suggestions": string[]\n' +
        "}",
      pt:
        "Você é um especialista em verificação biométrica facial. Compare a SELFIE (primeira imagem) com a foto do RG (segunda imagem). " +
        "Analise se são a mesma pessoa avaliando: formato do rosto, distribuição dos olhos/nariz/boca, estrutura óssea. " +
        "Responda ESTRITAMENTE em formato JSON sem markdown:\n" +
        "{\n" +
        '  "match": boolean,\n' +
        '  "confidence": number 0-1,\n' +
        '  "message": string,\n' +
        '  "selfieQuality": "poor" | "fair" | "good" | "excellent",\n' +
        '  "dniQuality": "poor" | "fair" | "good" | "excellent",\n' +
        '  "suggestions": string[]\n' +
        "}",
    };

    const promptText = promptByLang[lang] || promptByLang.es;

    const result = await this.vertexAi.generateContentWithMedia(promptText, {
      language: lang as "es" | "en" | "pt",
      mediaParts: [
        { inlineData: { mimeType: selfieMimeType, data: selfieBuffer.toString("base64") } },
        { inlineData: { mimeType: dniMimeType, data: dniBuffer.toString("base64") } },
      ],
    });

    try {
      const parsed = JSON.parse(result.text);
      return {
        match: parsed.match ?? false,
        confidence: parsed.confidence ?? 0,
        message:
          parsed.message ||
          (parsed.match ? "Identidad verificada." : "El rostro no coincide con el DNI."),
        selfieQuality: parsed.selfieQuality || "fair",
        dniQuality: parsed.dniQuality || "fair",
        suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
        latencyMs: result.latencyMs,
        model: result.model,
        tokens: result.tokens,
      };
    } catch {
      return {
        match: false,
        confidence: 0,
        message: result.text,
        selfieQuality: "fair",
        dniQuality: "fair",
        suggestions: [],
        latencyMs: result.latencyMs,
        model: result.model,
        tokens: result.tokens,
      };
    }
  }
}
