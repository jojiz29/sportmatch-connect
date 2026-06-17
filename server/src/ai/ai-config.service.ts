// ============================================================
// ai-config.service.ts — Configuración y validación temprana
// de las credenciales de Vertex AI / Google Gen AI Key
// Soporta tres modos:
//   1. API KEY (Recomendado): GOOGLE_GENAI_API_KEY directa (cero IAM, conecta al instante)
//   2. SERVERLESS: GOOGLE_APPLICATION_CREDENTIALS_JSON contiene el JSON inline
//   3. LOCAL: GOOGLE_APPLICATION_CREDENTIALS apunta a un archivo
// ============================================================

import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";

export interface VertexAiConfig {
  projectId?: string;
  location?: string;
  modelId: string;
  maxTokens: number;
  temperature: number;
  maxRetries: number;
  timeoutMs: number;
  rateLimitPerMinute: number;
  /** API Key directa (modo Express/AI Studio — sin roles IAM ni fricción) */
  apiKey?: string;
  /** Credenciales en formato JSON inline (para Vercel/Render serverless) */
  credentialsJson?: Record<string, unknown>;
  /** Ruta al archivo de credenciales (para desarrollo local) */
  credentialsPath?: string;
}

@Injectable()
export class AiConfigService implements OnModuleInit {
  private readonly logger = new Logger("VertexAI");
  private config: VertexAiConfig | null = null;
  private degraded = false;
  private degradedReason = "";

  onModuleInit(): void {
    try {
      this.validateAndLoadConfig();
    } catch (err) {
      this.degraded = true;
      this.degradedReason = err instanceof Error ? err.message : String(err);
      this.logger.error(`Módulo de IA degradado: ${this.degradedReason}`);
    }
  }

  isHealthy(): boolean {
    return !this.degraded && this.config !== null;
  }

  getDegradedReason(): string {
    return this.degradedReason;
  }

  getConfig(): VertexAiConfig {
    if (!this.config) {
      throw new Error(
        `AiConfigService accessed before initialization or degraded: ${this.degradedReason || "unknown"}`,
      );
    }
    return this.config;
  }

  private validateAndLoadConfig(): void {
    const modelId = process.env.VERTEX_AI_MODEL_ID || "gemini-3.5-flash";
    const apiKey = process.env.GOOGLE_GENAI_API_KEY;

    // --- MODO 1: API KEY DIRECTO (Opción ultrarrápida y libre de IAM) ---
    if (apiKey && apiKey.trim().length > 0) {
      this.config = {
        modelId,
        apiKey: apiKey.trim(),
        maxTokens: this.parseNumber(process.env.VERTEX_AI_MAX_TOKENS, 1024),
        temperature: this.parseNumber(process.env.VERTEX_AI_TEMPERATURE, 0.7),
        maxRetries: this.parseNumber(process.env.VERTEX_AI_MAX_RETRIES, 3),
        timeoutMs: this.parseNumber(process.env.VERTEX_AI_TIMEOUT_MS, 30000),
        rateLimitPerMinute: this.parseNumber(process.env.VERTEX_AI_RATE_LIMIT_PER_MINUTE, 20),
      };
      this.logger.log("Credenciales de API Key cargadas (Modo Directo)");
      return;
    }

    // --- MODO 2 & 3: SERVICE ACCOUNT JSON (Vertex AI tradicional) ---
    const projectId = process.env.GOOGLE_CLOUD_PROJECT;
    const location = process.env.VERTEX_AI_LOCATION || "global";

    if (!projectId) {
      throw new Error(
        "Falta GOOGLE_CLOUD_PROJECT en las variables de entorno para Vertex AI tradicional.",
      );
    }

    const credentialsJsonRaw = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

    let resolvedJson: Record<string, unknown> | undefined;
    let resolvedPath: string | undefined;

    if (credentialsJsonRaw) {
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
        "No se encontraron credenciales de Vertex AI ni GOOGLE_GENAI_API_KEY. " +
          "Por favor configura tu API Key o tu JSON de cuenta de servicio.",
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

    this.logger.log("Credenciales cargadas y conectadas");
  }

  private parseNumber(value: string | undefined, defaultValue: number): number {
    if (!value) return defaultValue;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : defaultValue;
  }
}
