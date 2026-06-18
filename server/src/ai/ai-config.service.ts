// ============================================================
// ai-config.service.ts — Configuración y validación temprana
// de las credenciales de Vertex AI
// Soporta dos modos:
//   1. LOCAL: GOOGLE_APPLICATION_CREDENTIALS apunta a un archivo
//   2. SERVERLESS: GOOGLE_APPLICATION_CREDENTIALS_JSON contiene el JSON inline
// ============================================================

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
  /** Credenciales en formato JSON inline (para Vercel/Render serverless) */
  credentialsJson?: Record<string, unknown>;
  /** Ruta al archivo de credenciales (para desarrollo local) */
  credentialsPath?: string;
}

@Injectable()
export class AiConfigService implements OnModuleInit {
  private readonly logger = new Logger(AiConfigService.name);
  private config!: VertexAiConfig;

  onModuleInit(): void {
    const projectId = process.env.GOOGLE_CLOUD_PROJECT;
    const location = process.env.VERTEX_AI_LOCATION;
    const modelId = process.env.VERTEX_AI_MODEL_ID;

    if (!projectId || !location || !modelId) {
      throw new Error(
        "Faltan variables de entorno críticas para Vertex AI. " +
          "Verifica GOOGLE_CLOUD_PROJECT, VERTEX_AI_LOCATION " +
          "y VERTEX_AI_MODEL_ID en server/.env o en el dashboard del proveedor.",
      );
    }

    // Resolución de credenciales: serverless (JSON inline) tiene prioridad sobre local (archivo)
    const credentialsJsonRaw = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

    let resolvedJson: Record<string, unknown> | undefined;
    let resolvedPath: string | undefined;

    if (credentialsJsonRaw) {
      // Modo serverless: parsear el JSON inline
      try {
        const parsed: Record<string, unknown> = JSON.parse(credentialsJsonRaw);
        if (!parsed.type || parsed.type !== "service_account") {
          throw new Error("El JSON no parece ser un Service Account válido (falta 'type')");
        }
        resolvedJson = parsed;
      } catch (err) {
        throw new Error(
          `GOOGLE_APPLICATION_CREDENTIALS_JSON no es un JSON válido: ${
            err instanceof Error ? err.message : "Unknown"
          }`,
        );
      }
    } else if (credentialsPath) {
      // Modo local: validar el archivo en disco
      const absolutePath = path.isAbsolute(credentialsPath)
        ? credentialsPath
        : path.resolve(process.cwd(), credentialsPath);

      if (!fs.existsSync(absolutePath)) {
        throw new Error(
          "El archivo de credenciales de Vertex AI no existe. " +
            "Verifica la variable GOOGLE_APPLICATION_CREDENTIALS.",
        );
      }

      try {
        fs.accessSync(absolutePath, fs.constants.R_OK);
      } catch {
        throw new Error(
          "El archivo de credenciales existe pero no es legible. " +
            "Verifica los permisos del sistema de archivos (chmod 600).",
        );
      }

      resolvedPath = absolutePath;
    } else {
      throw new Error(
        "No se encontraron credenciales de Vertex AI. " +
          "Define GOOGLE_APPLICATION_CREDENTIALS_JSON (serverless) o " +
          "GOOGLE_APPLICATION_CREDENTIALS (local) en el entorno.",
      );
    }

    this.config = {
      projectId,
      location,
      modelId,
      maxTokens: this.parseNumber(process.env.VERTEX_AI_MAX_TOKENS, 1024),
      temperature: this.parseNumber(process.env.VERTEX_AI_TEMPERATURE, 0.7),
      maxRetries: this.parseNumber(process.env.VERTEX_AI_MAX_RETRIES, 3),
      timeoutMs: this.parseNumber(process.env.VERTEX_AI_TIMEOUT_MS, 30000),
      rateLimitPerMinute: this.parseNumber(process.env.VERTEX_AI_RATE_LIMIT_PER_MINUTE, 20),
      credentialsJson: resolvedJson,
      credentialsPath: resolvedPath,
    };

    // Log seguro: nunca expone la ruta completa ni el contenido
    this.logger.log("Vertex AI configuration validated successfully");
  }

  getConfig(): VertexAiConfig {
    if (!this.config) {
      throw new Error("AiConfigService accessed before initialization");
    }
    return this.config;
  }

  private parseNumber(value: string | undefined, defaultValue: number): number {
    if (!value) return defaultValue;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : defaultValue;
  }
}
