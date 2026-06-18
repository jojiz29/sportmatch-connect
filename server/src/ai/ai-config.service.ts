// ============================================================
// ai-config.service.ts - Configuracion central de Vertex AI
// ============================================================
// Este servicio valida las variables necesarias para usar IA, pero
// no debe tumbar todo el backend cuando falta el JSON en desarrollo.
// En ese caso deja Vertex en modo degradado y los endpoints IA fallan
// de forma controlada, mientras el resto de la app sigue funcionando.

import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";

export interface VertexAiConfig {
  projectId: string;
  location: string;
  modelId: string;
  maxTokens: number;
  temperature: number;
  maxRetries: number;
  timeoutMs: number;
  rateLimitPerMinute: number;
  /** Credenciales en formato JSON inline para despliegues serverless. */
  credentialsJson?: Record<string, unknown>;
  /** Ruta absoluta al archivo de credenciales en desarrollo local. */
  credentialsPath?: string;
  /** Indica si Vertex AI esta realmente listo para recibir llamadas. */
  isAvailable: boolean;
  /** Motivo que se muestra en logs cuando Vertex queda deshabilitado. */
  unavailableReason?: string;
}

@Injectable()
export class AiConfigService implements OnModuleInit {
  private readonly logger = new Logger(AiConfigService.name);
  private config!: VertexAiConfig;

  onModuleInit(): void {
    const projectId = process.env.GOOGLE_CLOUD_PROJECT;
    const location = process.env.VERTEX_AI_LOCATION;
    const modelId = process.env.VERTEX_AI_MODEL_ID;
    const credentialsJsonRaw = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

    let unavailableReason: string | undefined;
    let resolvedJson: Record<string, unknown> | undefined;
    let resolvedPath: string | undefined;

    if (!projectId || !location || !modelId) {
      unavailableReason = "Faltan GOOGLE_CLOUD_PROJECT, VERTEX_AI_LOCATION o VERTEX_AI_MODEL_ID.";
    }

    if (!unavailableReason && credentialsJsonRaw) {
      try {
        const parsed: Record<string, unknown> = JSON.parse(credentialsJsonRaw);
        if (parsed.type !== "service_account") {
          throw new Error("El JSON no corresponde a un service_account.");
        }
        resolvedJson = parsed;
      } catch (err) {
        unavailableReason = `GOOGLE_APPLICATION_CREDENTIALS_JSON no es valido: ${
          err instanceof Error ? err.message : "Unknown"
        }`;
      }
    } else if (!unavailableReason && credentialsPath) {
      const absolutePath = path.isAbsolute(credentialsPath)
        ? credentialsPath
        : path.resolve(process.cwd(), credentialsPath);

      if (!fs.existsSync(absolutePath)) {
        unavailableReason =
          "El archivo de credenciales de Vertex AI no existe. Verifica GOOGLE_APPLICATION_CREDENTIALS.";
      } else {
        try {
          fs.accessSync(absolutePath, fs.constants.R_OK);
          resolvedPath = absolutePath;
        } catch {
          unavailableReason = "El archivo de credenciales de Vertex AI existe pero no es legible.";
        }
      }
    } else if (!unavailableReason) {
      unavailableReason =
        "No se encontraron credenciales. Define GOOGLE_APPLICATION_CREDENTIALS_JSON o GOOGLE_APPLICATION_CREDENTIALS.";
    }

    const isAvailable = Boolean(!unavailableReason && (resolvedJson || resolvedPath));

    this.config = {
      projectId: projectId ?? "",
      location: location ?? "",
      modelId: modelId ?? "",
      maxTokens: this.parseNumber(process.env.VERTEX_AI_MAX_TOKENS, 1024),
      temperature: this.parseNumber(process.env.VERTEX_AI_TEMPERATURE, 0.7),
      maxRetries: this.parseNumber(process.env.VERTEX_AI_MAX_RETRIES, 3),
      timeoutMs: this.parseNumber(process.env.VERTEX_AI_TIMEOUT_MS, 30000),
      rateLimitPerMinute: this.parseNumber(process.env.VERTEX_AI_RATE_LIMIT_PER_MINUTE, 20),
      credentialsJson: resolvedJson,
      credentialsPath: resolvedPath,
      isAvailable,
      unavailableReason,
    };

    if (isAvailable) {
      this.logger.log("Vertex AI configuration validated successfully");
    } else {
      this.logger.warn(
        `Vertex AI deshabilitado en modo degradado: ${unavailableReason}. El backend seguira arrancando.`,
      );
    }
  }

  getConfig(): VertexAiConfig {
    if (!this.config) {
      throw new Error("AiConfigService accessed before initialization");
    }
    return this.config;
  }

  isVertexAiAvailable(): boolean {
    return this.getConfig().isAvailable;
  }

  private parseNumber(value: string | undefined, defaultValue: number): number {
    if (!value) return defaultValue;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : defaultValue;
  }
}
