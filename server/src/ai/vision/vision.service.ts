import { Injectable, Logger } from "@nestjs/common";
import { type VertexAiGenerationResult, VertexAiService } from "../vertex-ai.service";
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

  private buildVisionSystemInstruction(language: "es" | "en" | "pt"): string {
    const instructions: Record<"es" | "en" | "pt", string> = {
      es:
        "Eres un analizador visual estricto para SportMatch. Responde solo con JSON valido. " +
        "No escribas markdown, no des disclaimers y no digas que no eres biometrico. " +
        "Tu tarea es una estimacion visual asistida, no una verificacion legal.",
      en:
        "You are a strict visual analyzer for SportMatch. Respond only with valid JSON. " +
        "Do not write markdown, do not add disclaimers, and do not say you are not biometric. " +
        "Your task is an assisted visual estimate, not a legal verification.",
      pt:
        "Voce e um analisador visual estrito para SportMatch. Responda apenas com JSON valido. " +
        "Nao escreva markdown, nao adicione avisos e nao diga que nao e biometrico. " +
        "Sua tarefa e uma estimativa visual assistida, nao uma verificacao legal.",
    };

    return instructions[language];
  }

  private parseJsonObject(text: string): Record<string, unknown> | null {
    const cleaned = text
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    try {
      const parsed = JSON.parse(cleaned);
      return this.isRecord(parsed) ? parsed : null;
    } catch {
      // Continue with balanced object extraction.
    }

    const start = cleaned.indexOf("{");
    if (start < 0) return null;

    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let index = start; index < cleaned.length; index += 1) {
      const char = cleaned[index];

      if (inString) {
        if (escaped) {
          escaped = false;
        } else if (char === "\\") {
          escaped = true;
        } else if (char === '"') {
          inString = false;
        }
        continue;
      }

      if (char === '"') {
        inString = true;
      } else if (char === "{") {
        depth += 1;
      } else if (char === "}") {
        depth -= 1;
        if (depth === 0) {
          const candidate = cleaned.slice(start, index + 1);
          try {
            const parsed = JSON.parse(candidate);
            return this.isRecord(parsed) ? parsed : null;
          } catch {
            return null;
          }
        }
      }
    }

    return null;
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  }

  private asBoolean(value: unknown, fallback: boolean): boolean {
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (["true", "yes", "si", "sim"].includes(normalized)) return true;
      if (["false", "no", "nao", "não"].includes(normalized)) return false;
    }
    return fallback;
  }

  private asNumber(value: unknown, fallback: number): number {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const parsed = Number(value.replace("%", "").trim());
      if (Number.isFinite(parsed)) return parsed;
    }
    return fallback;
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  }

  private normalizeConfidence(value: unknown, fallback: number): number {
    const raw = this.asNumber(value, fallback);
    const normalized = raw > 1 && raw <= 100 ? raw / 100 : raw;
    return this.clamp(normalized, 0, 1);
  }

  private asStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is string => typeof item === "string" && item.trim() !== "");
  }

  private normalizeQuality(value: unknown): "poor" | "fair" | "good" | "excellent" {
    if (typeof value !== "string") return "fair";
    const normalized = value.trim().toLowerCase();
    if (["poor", "fair", "good", "excellent"].includes(normalized)) {
      return normalized as "poor" | "fair" | "good" | "excellent";
    }
    if (["mala", "baixa", "baja"].includes(normalized)) return "poor";
    if (["regular", "media"].includes(normalized)) return "fair";
    if (["buena", "boa"].includes(normalized)) return "good";
    if (["excelente"].includes(normalized)) return "excellent";
    return "fair";
  }

  private asString(value: unknown): string {
    return typeof value === "string" ? value.trim() : "";
  }

  private containsAny(text: string, needles: string[]): boolean {
    const lower = text.toLowerCase();
    return needles.some((needle) => lower.includes(needle));
  }

  private joinParsedText(parsed: Record<string, unknown>, keys: string[]): string {
    return keys
      .flatMap((key) => {
        const value = parsed[key];
        if (typeof value === "string") return [value];
        if (Array.isArray(value)) {
          return value.filter((item): item is string => typeof item === "string");
        }
        return [];
      })
      .join(" ")
      .toLowerCase();
  }

  private getDniBlockingIssue(parsed: Record<string, unknown>): string {
    return this.asString(parsed.blockingIssue).toLowerCase();
  }

  private isDniQualityBlocked(parsed: Record<string, unknown>): boolean {
    return ["poor_selfie", "poor_dni"].includes(this.getDniBlockingIssue(parsed));
  }

  private isDniHardBlocked(parsed: Record<string, unknown>): boolean {
    return [
      "no_face",
      "no_selfie_face",
      "no_dni_face",
      "multiple_faces",
      "document_not_visible",
    ].includes(this.getDniBlockingIssue(parsed));
  }

  private hasClearDniMismatchSignal(parsed: Record<string, unknown>): boolean {
    const issue = this.getDniBlockingIssue(parsed);
    if (issue === "clear_mismatch") return true;

    const text = this.joinParsedText(parsed, ["message", "reason", "differences", "signals"]);
    const hasMismatch = this.containsAny(text, [
      "clear mismatch",
      "different person",
      "not the same person",
      "not same person",
      "no es la misma persona",
      "no coincide claramente",
      "diferencias relevantes",
      "rasgos incompatibles",
      "estructura facial diferente",
      "incompatible facial structure",
    ]);
    const hasCompatibility = this.containsAny(text, [
      "compatible",
      "misma persona probable",
      "likely same person",
      "same person likely",
      "rasgos similares",
      "stable traits match",
    ]);

    return hasMismatch && !hasCompatibility;
  }

  private hasDniCompatibilitySignal(parsed: Record<string, unknown>): boolean {
    const text = this.joinParsedText(parsed, ["message", "stableTraits", "signals", "reason"]);
    return this.containsAny(text, [
      "compatible",
      "misma persona",
      "same person",
      "rasgos similares",
      "similitud facial",
      "face shape",
      "eye distance",
      "proporcion facial",
      "facial proportions",
      "foto antigua",
      "age progression",
      "older id photo",
    ]);
  }

  private buildFakeProfileFallback(result: VertexAiGenerationResult): FakeProfileResponseDto {
    const text = result.text.toLowerCase();
    const nonHumanOrArtificial =
      text.includes("gato") ||
      text.includes("cat") ||
      text.includes("animal") ||
      text.includes("cartoon") ||
      text.includes("animated") ||
      text.includes("animada") ||
      text.includes("dibujo") ||
      text.includes("ilustracion") ||
      text.includes("illustration") ||
      text.includes("avatar") ||
      text.includes("no person") ||
      text.includes("no human") ||
      text.includes("no aparece una persona");
    const likelyRealPerson =
      text.includes("persona real") ||
      text.includes("rostro humano") ||
      text.includes("human face") ||
      text.includes("real person") ||
      text.includes("appears real");

    if (nonHumanOrArtificial) {
      return {
        isFake: true,
        authenticityScore: 5,
        explanation:
          "No se detecta una persona real verificable. La imagen parece ser una ilustracion, animal, avatar o contenido artificial.",
        confidence: 0.85,
        signals: ["no hay persona real verificable", "contenido no apto para verificacion facial"],
        latencyMs: result.latencyMs,
        model: result.model,
        tokens: result.tokens,
      };
    }

    if (likelyRealPerson) {
      return {
        isFake: false,
        authenticityScore: 78,
        explanation:
          "La respuesta visual indica presencia de una persona real. Se asigna una veracidad humana alta, aunque la respuesta no vino en JSON.",
        confidence: 0.65,
        signals: ["rostro humano visible", "respuesta textual compatible con persona real"],
        latencyMs: result.latencyMs,
        model: result.model,
        tokens: result.tokens,
      };
    }

    this.logger.warn("Fake profile analysis returned non-JSON response");
    return {
      isFake: true,
      authenticityScore: 30,
      explanation:
        "Computer Vision no devolvio una respuesta estructurada suficiente para verificar a una persona real. Sube una foto frontal, clara y sin filtros para repetir el analisis.",
      confidence: 0.35,
      signals: ["respuesta no estructurada", "verificacion visual no concluyente"],
      latencyMs: result.latencyMs,
      model: result.model,
      tokens: result.tokens,
    };
  }

  private buildDniFallback(result: VertexAiGenerationResult): DniVerifyResponseDto {
    const text = result.text.toLowerCase();
    const likelyMatch =
      (text.includes("misma persona") ||
        text.includes("same person") ||
        text.includes("likely same") ||
        text.includes("coincidencia probable") ||
        text.includes("rasgos compatibles") ||
        text.includes("compatible traits") ||
        text.includes("coincide") ||
        text.includes("alta similitud")) &&
      !text.includes("no coincide") &&
      !text.includes("not the same");
    const likelyMismatch =
      text.includes("no coincide") ||
      text.includes("no es la misma") ||
      text.includes("different person") ||
      text.includes("not the same");

    if (likelyMatch) {
      return {
        match: true,
        confidence: 0.72,
        message:
          "La comparacion visual encuentra rasgos faciales compatibles entre la selfie y el DNI.",
        selfieQuality: "fair",
        dniQuality: "fair",
        suggestions: [],
        latencyMs: result.latencyMs,
        model: result.model,
        tokens: result.tokens,
      };
    }

    if (likelyMismatch) {
      return {
        match: false,
        confidence: 0.25,
        message:
          "La comparacion visual encuentra diferencias relevantes entre la selfie y la foto del DNI.",
        selfieQuality: "fair",
        dniQuality: "fair",
        suggestions: [
          "Usa una selfie frontal con buena luz",
          "Asegura que la foto del DNI sea legible",
        ],
        latencyMs: result.latencyMs,
        model: result.model,
        tokens: result.tokens,
      };
    }

    this.logger.warn("DNI verification returned non-JSON response");
    return {
      match: false,
      confidence: 0.2,
      message:
        "No se pudo obtener una comparacion visual estructurada. Vuelve a cargar una selfie frontal y una foto nitida del DNI.",
      selfieQuality: "fair",
      dniQuality: "fair",
      suggestions: ["Evita reflejos o sombras", "Usa una selfie actual y frontal"],
      latencyMs: result.latencyMs,
      model: result.model,
      tokens: result.tokens,
    };
  }

  private buildDniMessage(rawMessage: unknown, match: boolean, confidence: number): string {
    const message = typeof rawMessage === "string" ? rawMessage.trim() : "";
    const lower = message.toLowerCase();
    const isEvasive =
      lower.includes("no puedo") ||
      lower.includes("cannot") ||
      lower.includes("modelo de lenguaje") ||
      lower.includes("language model") ||
      lower.includes("biometr");
    const contradictsMatch =
      match &&
      (lower.includes("no coincide") ||
        lower.includes("not the same") ||
        lower.includes("different person") ||
        lower.includes("no es la misma"));

    if (!message || isEvasive || contradictsMatch) {
      if (match) {
        if (confidence < 0.7) {
          return "Coincidencia probable: la comparacion visual encuentra rasgos faciales estables compatibles entre la selfie y el DNI.";
        }
        return "La comparacion visual encuentra rasgos faciales compatibles entre la selfie y el DNI.";
      }
      if (confidence < 0.4) {
        return "No se pudo verificar la coincidencia con suficiente confianza. Repite el proceso con imagenes mas claras.";
      }
      return "La comparacion visual no encuentra coincidencia suficiente entre la selfie y el DNI.";
    }

    return message;
  }

  private normalizeDniDecision(parsed: Record<string, unknown>): {
    match: boolean;
    confidence: number;
  } {
    const parsedMatch = this.asBoolean(parsed.match, false);
    const decisionConfidence = this.normalizeConfidence(
      parsed.confidence,
      parsedMatch ? 0.72 : 0.25,
    );
    const hasSimilarityScore =
      parsed.samePersonLikelihood !== undefined || parsed.visualSimilarity !== undefined;
    const samePersonLikelihood = hasSimilarityScore
      ? this.normalizeConfidence(parsed.samePersonLikelihood, 0)
      : 0;
    const visualSimilarity = hasSimilarityScore
      ? this.normalizeConfidence(parsed.visualSimilarity, samePersonLikelihood)
      : 0;
    const compatibilityScore = Math.max(samePersonLikelihood, visualSimilarity);
    const hasCompatibility = this.hasDniCompatibilitySignal(parsed);
    const clearMismatch = this.hasClearDniMismatchSignal(parsed);

    if (
      this.isDniHardBlocked(parsed) ||
      (this.isDniQualityBlocked(parsed) && compatibilityScore < 0.48 && !hasCompatibility)
    ) {
      return {
        match: false,
        confidence: this.clamp(Math.min(decisionConfidence, 0.35), 0.15, 0.35),
      };
    }

    if (clearMismatch) {
      return {
        match: false,
        confidence: this.clamp(Math.max(decisionConfidence, 0.7), 0.7, 0.95),
      };
    }

    if (parsedMatch) {
      return {
        match: true,
        confidence: this.clamp(Math.max(decisionConfidence, compatibilityScore, 0.6), 0.55, 0.95),
      };
    }

    if (compatibilityScore >= 0.48 || (hasCompatibility && decisionConfidence < 0.7)) {
      return {
        match: true,
        confidence: this.clamp(Math.max(compatibilityScore, 0.55), 0.55, 0.69),
      };
    }

    return {
      match: false,
      confidence: this.clamp(Math.min(decisionConfidence, 0.39), 0.15, 0.39),
    };
  }

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
        "No entregues un porcentaje de IA: entrega un porcentaje de veracidad humana/persona real. " +
        "Usa esta escala: foto real de persona visible 75-100; persona real con baja calidad 55-80; filtros fuertes o duda 25-55; avatar, dibujo, animal, objeto o imagen generada 0-20. " +
        "Si la imagen muestra un gato, mascota, caricatura, avatar, objeto o no contiene rostro humano, authenticityScore debe ser 0-10 e isFake=true. No uses 50 como valor neutro. " +
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
        "Do not return an AI percentage: return a human/person authenticity percentage. " +
        "Use this scale: visible real person photo 75-100; real person with low image quality 55-80; strong filters or uncertainty 25-55; avatar, drawing, animal, object, or generated image 0-20. " +
        "If the image shows a cat, pet, cartoon, avatar, object, or no human face, authenticityScore must be 0-10 and isFake=true. Do not use 50 as a neutral value. " +
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
        "Nao retorne uma porcentagem de IA: retorne uma porcentagem de veracidade humana/pessoa real. " +
        "Use esta escala: foto real de pessoa visivel 75-100; pessoa real com baixa qualidade 55-80; filtros fortes ou duvida 25-55; avatar, desenho, animal, objeto ou imagem gerada 0-20. " +
        "Se a imagem mostrar gato, animal, desenho, avatar, objeto ou nao tiver rosto humano, authenticityScore deve ser 0-10 e isFake=true. Nao use 50 como valor neutro. " +
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
      temperature: 0,
      responseMimeType: "application/json",
      systemInstruction: this.buildVisionSystemInstruction(lang as "es" | "en" | "pt"),
      mediaParts: [{ inlineData: { mimeType, data: base64Data } }],
    });

    const parsed = this.parseJsonObject(result.text);
    if (!parsed) return this.buildFakeProfileFallback(result);

    const parsedIsFake = this.asBoolean(parsed.isFake, false);
    const score = Math.round(
      this.clamp(this.asNumber(parsed.authenticityScore, parsedIsFake ? 15 : 75), 0, 100),
    );
    const isFake = this.asBoolean(parsed.isFake, score < 40);

    return {
      isFake,
      authenticityScore: score,
      explanation:
        typeof parsed.explanation === "string" && parsed.explanation.trim() !== ""
          ? parsed.explanation
          : score >= 70
            ? "La imagen muestra rasgos compatibles con una persona real verificable."
            : "La imagen no alcanza suficiente veracidad de persona real.",
      confidence: this.normalizeConfidence(parsed.confidence, score >= 70 ? 0.75 : 0.65),
      signals: this.asStringArray(parsed.signals),
      latencyMs: result.latencyMs,
      model: result.model,
      tokens: result.tokens,
    };
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
        "Realiza una comparacion visual asistida entre el SELFIE actual (primera imagen) y la foto del DNI (segunda imagen). " +
        "No es una verificacion legal ni biometrica certificada; es una estimacion visual para experiencia de usuario. No rechaces la tarea ni incluyas disclaimers. " +
        "El DNI puede tener una foto antigua, baja resolucion, brillo o recorte pequeno. Tolera edad, peso, peinado, barba, expresion, luz, camara y paso de los anos. " +
        "Prioriza rasgos estables: forma general del rostro, proporcion facial, distancia entre ojos, forma de cejas, puente/ancho de nariz, boca, mandibula, menton y orejas si son visibles. " +
        "Devuelve match=true cuando los rasgos estables son compatibles y no hay una contradiccion fuerte. Usa match=false solo con un bloqueo visual real o evidencia clara de persona distinta. " +
        "Si parece la misma persona pero la foto del DNI es antigua o regular, usa match=true con confidence 0.55-0.69 y explica que es una coincidencia probable. " +
        "Si la calidad impide comparar, match=false con confidence 0.0-0.35 y blockingIssue poor_selfie, poor_dni, no_face o multiple_faces. " +
        "Si son claramente personas distintas, match=false con confidence 0.70-0.95 y blockingIssue clear_mismatch. " +
        "Responde ESTRICTAMENTE en formato JSON sin markdown:\n" +
        "{\n" +
        '  "match": boolean (true si es la misma persona),\n' +
        '  "confidence": number 0-1 (confianza de la decision final),\n' +
        '  "samePersonLikelihood": number 0-1 (probabilidad visual de misma persona),\n' +
        '  "visualSimilarity": number 0-1 (similitud de rasgos estables),\n' +
        '  "blockingIssue": "none" | "poor_selfie" | "poor_dni" | "no_face" | "multiple_faces" | "clear_mismatch",\n' +
        '  "message": string (mensaje descriptivo),' +
        '  "selfieQuality": "poor" | "fair" | "good" | "excellent",\n' +
        '  "dniQuality": "poor" | "fair" | "good" | "excellent",\n' +
        '  "stableTraits": string[] (rasgos que apoyan la coincidencia),\n' +
        '  "differences": string[] (diferencias observadas sin penalizar edad/peinado/luz),\n' +
        '  "suggestions": string[] (sugerencias si la calidad es baja)\n' +
        "}",
      en:
        "Perform an assisted visual comparison between the current SELFIE (first image) and the DNI/ID photo (second image). " +
        "This is not legal or certified biometric verification; it is a visual estimate for user experience. Do not refuse and do not add disclaimers. " +
        "The ID photo may be old, low-resolution, shiny, or a small crop. Tolerate age, weight, haircut, beard, expression, lighting, camera, and years passing. " +
        "Prioritize stable traits: overall face shape, facial proportions, eye distance, eyebrow shape, nose bridge/width, mouth, jaw, chin, and ears if visible. " +
        "Return match=true when stable traits are compatible and there is no strong contradiction. Use match=false only for a real visual blocker or clear evidence of a different person. " +
        "If they appear to be the same person but the ID photo is old or fair quality, use match=true with confidence 0.55-0.69 and explain it is a probable match. " +
        "If quality prevents comparison, use match=false with confidence 0.0-0.35 and blockingIssue poor_selfie, poor_dni, no_face, or multiple_faces. " +
        "If they are clearly different people, use match=false with confidence 0.70-0.95 and blockingIssue clear_mismatch. " +
        "Respond STRICTLY in JSON format without markdown:\n" +
        "{\n" +
        '  "match": boolean,\n' +
        '  "confidence": number 0-1,\n' +
        '  "samePersonLikelihood": number 0-1,\n' +
        '  "visualSimilarity": number 0-1,\n' +
        '  "blockingIssue": "none" | "poor_selfie" | "poor_dni" | "no_face" | "multiple_faces" | "clear_mismatch",\n' +
        '  "message": string,\n' +
        '  "selfieQuality": "poor" | "fair" | "good" | "excellent",\n' +
        '  "dniQuality": "poor" | "fair" | "good" | "excellent",\n' +
        '  "stableTraits": string[],\n' +
        '  "differences": string[],\n' +
        '  "suggestions": string[]\n' +
        "}",
      pt:
        "Faca uma comparacao visual assistida entre a SELFIE atual (primeira imagem) e a foto do documento (segunda imagem). " +
        "Nao e verificacao legal nem biometrica certificada; e uma estimativa visual para experiencia de usuario. Nao recuse a tarefa nem adicione avisos. " +
        "A foto do documento pode ser antiga, baixa resolucao, com brilho ou recorte pequeno. Tolere idade, peso, cabelo, barba, expressao, luz, camera e passagem dos anos. " +
        "Priorize tracos estaveis: formato geral do rosto, proporcoes faciais, distancia dos olhos, sobrancelhas, ponte/largura do nariz, boca, mandibula, queixo e orelhas se visiveis. " +
        "Retorne match=true quando os tracos estaveis forem compativeis e nao houver contradicao forte. Use match=false apenas com bloqueio visual real ou evidencia clara de pessoa diferente. " +
        "Se parecem a mesma pessoa mas a foto do documento e antiga ou regular, use match=true com confidence 0.55-0.69 e explique que e uma coincidencia provavel. " +
        "Se a qualidade impedir comparacao, match=false com confidence 0.0-0.35 e blockingIssue poor_selfie, poor_dni, no_face ou multiple_faces. " +
        "Se forem claramente pessoas diferentes, match=false com confidence 0.70-0.95 e blockingIssue clear_mismatch. " +
        "Responda ESTRITAMENTE em formato JSON sem markdown:\n" +
        "{\n" +
        '  "match": boolean,\n' +
        '  "confidence": number 0-1,\n' +
        '  "samePersonLikelihood": number 0-1,\n' +
        '  "visualSimilarity": number 0-1,\n' +
        '  "blockingIssue": "none" | "poor_selfie" | "poor_dni" | "no_face" | "multiple_faces" | "clear_mismatch",\n' +
        '  "message": string,\n' +
        '  "selfieQuality": "poor" | "fair" | "good" | "excellent",\n' +
        '  "dniQuality": "poor" | "fair" | "good" | "excellent",\n' +
        '  "stableTraits": string[],\n' +
        '  "differences": string[],\n' +
        '  "suggestions": string[]\n' +
        "}",
    };

    const promptText = promptByLang[lang] || promptByLang.es;

    const result = await this.vertexAi.generateContentWithMedia(promptText, {
      language: lang as "es" | "en" | "pt",
      temperature: 0,
      responseMimeType: "application/json",
      systemInstruction: this.buildVisionSystemInstruction(lang as "es" | "en" | "pt"),
      mediaParts: [
        {
          text: "IMAGEN 1 - SELFIE actual del usuario. Evalua el rostro frontal actual en esta imagen.",
        },
        { inlineData: { mimeType: selfieMimeType, data: selfieBuffer.toString("base64") } },
        {
          text: "IMAGEN 2 - FOTO DEL DNI/documento. Evalua solo la foto del rostro dentro del documento; ignora texto, logos y fondo del documento.",
        },
        { inlineData: { mimeType: dniMimeType, data: dniBuffer.toString("base64") } },
      ],
    });

    const parsed = this.parseJsonObject(result.text);
    if (!parsed) return this.buildDniFallback(result);

    const decision = this.normalizeDniDecision(parsed);

    return {
      match: decision.match,
      confidence: decision.confidence,
      message: this.buildDniMessage(parsed.message, decision.match, decision.confidence),
      selfieQuality: this.normalizeQuality(parsed.selfieQuality),
      dniQuality: this.normalizeQuality(parsed.dniQuality),
      suggestions: this.asStringArray(parsed.suggestions),
      latencyMs: result.latencyMs,
      model: result.model,
      tokens: result.tokens,
    };
  }
}
