// ============================================================
// ai.service.ts — Capa de negocio
// Orquesta: rate limiting + llamada a Vertex AI + formateo
// ============================================================

import { Injectable, Logger, InternalServerErrorException } from "@nestjs/common";
import { VertexAiService, VertexAiGenerationResult } from "./vertex-ai.service";
import { ChatResponseDto } from "./dto/chat.dto";

interface UserRateLimit {
  count: number;
  resetTime: number;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly userRateLimits = new Map<string, UserRateLimit>();
  private readonly rateLimitWindowMs = 60_000; // 1 minuto
  private readonly maxRequestsPerWindow = 20;

  constructor(private readonly vertexAiService: VertexAiService) {}

  /**
   * Procesa un mensaje del usuario autenticado.
   * Aplica rate limiting, invoca Vertex AI y estructura la respuesta.
   */
  async chat(userId: string, message: string): Promise<ChatResponseDto> {
    this.checkRateLimit(userId);

    let result: VertexAiGenerationResult;
    try {
      result = await this.vertexAiService.generateContent(message);
    } catch (err) {
      // Extrae un mensaje de error legible sin exponer detalles sensibles
      const rawError = err instanceof Error ? err.message : String(err);
      const friendlyMessage = this.parseVertexAiError(rawError);

      this.logger.error(`AI generation failed for authenticated user: ${friendlyMessage}`);

      throw new InternalServerErrorException(friendlyMessage);
    }

    return {
      reply: result.text,
      suggestions: this.extractSuggestions(result.text),
      metadata: {
        tokens: result.tokens,
        model: result.model,
        latencyMs: result.latencyMs,
      },
    };
  }

  /**
   * Convierte errores crudos de Vertex AI en mensajes amigables para el usuario.
   * Detecta patrones comunes: modelo no encontrado, region inválida, auth, etc.
   */
  private parseVertexAiError(rawError: string): string {
    if (rawError.includes("NOT_FOUND") || rawError.includes("was not found")) {
      return "El modelo de IA no está disponible. Por favor, contacta al administrador.";
    }
    if (rawError.includes("PERMISSION_DENIED") || rawError.includes("permission")) {
      return "No tienes permisos para usar el asistente de IA.";
    }
    if (rawError.includes("UNAUTHENTICATED") || rawError.includes("credentials")) {
      return "Error de autenticación con el servicio de IA. Por favor, contacta al administrador.";
    }
    if (rawError.includes("RESOURCE_EXHAUSTED") || rawError.includes("quota")) {
      return "Se ha alcanzado el límite de uso de IA. Por favor, intenta más tarde.";
    }
    if (rawError.includes("DEADLINE_EXCEEDED") || rawError.includes("timeout")) {
      return "La IA tardó demasiado en responder. Por favor, intenta de nuevo.";
    }
    // Mensaje genérico para errores no clasificados
    return "No se pudo procesar tu solicitud en este momento. Por favor, intenta de nuevo.";
  }

  /**
   * Rate limiting simple en memoria (suficiente para single-instance).
   * Para producción multi-instancia, migrar a Redis (Bull/Throttler).
   */
  private checkRateLimit(userId: string): void {
    const now = Date.now();
    const userLimit = this.userRateLimits.get(userId);

    if (!userLimit || now > userLimit.resetTime) {
      this.userRateLimits.set(userId, {
        count: 1,
        resetTime: now + this.rateLimitWindowMs,
      });
      return;
    }

    if (userLimit.count >= this.maxRequestsPerWindow) {
      throw new InternalServerErrorException(
        "Has excedido el límite de mensajes por minuto. Por favor, espera un momento.",
      );
    }

    userLimit.count++;
  }

  /**
   * Extrae sugerencias contextuales de la respuesta del LLM.
   * Estrategia: si el modelo devolvió texto JSON con un campo "suggestions",
   * lo usa. Si no, devuelve un set genérico de acciones deportivas.
   */
  private extractSuggestions(reply: string): string[] {
    // Intenta parsear la respuesta como JSON estructurado (formato opcional)
    try {
      const trimmed = reply.trim();
      if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
        const parsed = JSON.parse(trimmed) as { suggestions?: unknown };
        if (Array.isArray(parsed?.suggestions)) {
          return parsed.suggestions.filter((s): s is string => typeof s === "string").slice(0, 4);
        }
      }
    } catch {
      // No era JSON; caer al set genérico
    }
    return ["Buscar canchas cerca", "Ver mi racha", "Recomiéndame un partido"];
  }
}
