// ============================================================
// src/features/b2b-ai/api/b2bAiApi.ts
// Cliente HTTP para los 3 endpoints B2B-AI del backend NestJS.
// Patrón espejo de src/features/ai-text/api/textApi.ts:
//   - validateApiHost() rechaza VITE_API_URL inválido
//   - getAuthHeaders() inyecta Bearer token de Supabase
//   - postJson() maneja 401/429 con mensajes user-friendly
//   - rate-limit buckets separados por feature (no del cliente)
// ============================================================

import { supabase } from "@/shared/api/supabase";
import type {
  PricingRequest,
  PricingResponse,
  AdsOptimizeRequest,
  AdsOptimizeResponse,
  ChurnPredictRequest,
  ChurnPredictResponse,
} from "./types";

const BACKEND_URL = (import.meta.env.VITE_API_URL as string) || "http://localhost:3000";
const B2B_BASE = `${BACKEND_URL}/api/v1/ai/b2b`;

// Lista de hosts permitidos (mismo patrón que textApi.ts y sportyAiAPI.ts)
const ALLOWED_HOSTS = [
  /^https?:\/\/localhost(:\d+)?$/,
  /^https?:\/\/[a-z0-9-]+\.onrender\.com$/,
  /^https?:\/\/[a-z0-9-]+\.render\.com$/,
  /^https?:\/\/[a-z0-9-]+\.fly\.dev$/,
  /^https?:\/\/[a-z0-9-]+\.railway\.app$/,
  /^https?:\/\/api\.[a-z0-9-]+\.(com|dev|app)$/,
];

function getApiBaseUrl(): string {
  return (import.meta.env.VITE_API_URL as string) || "http://localhost:3000";
}

function validateApiHost(): void {
  const apiBaseUrl = getApiBaseUrl();
  try {
    const parsed = new URL(apiBaseUrl);
    const valid = ALLOWED_HOSTS.some((p) => p.test(parsed.origin));
    if (!valid) {
      throw new Error(
        `Configuración inválida: VITE_API_URL="${apiBaseUrl}" no apunta a un backend válido. Verifica tu .env.`,
      );
    }
  } catch (err) {
    if (err instanceof TypeError) {
      throw new Error(`VITE_API_URL no es una URL válida: ${apiBaseUrl}`);
    }
    throw err;
  }
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) {
    throw new Error("Sesión expirada. Por favor, inicia sesión de nuevo.");
  }
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

async function postJson<T>(endpoint: string, body: unknown): Promise<T> {
  validateApiHost();
  const headers = await getAuthHeaders();
  const response = await fetch(`${B2B_BASE}${endpoint}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("No autorizado. Por favor, inicia sesión de nuevo.");
    }
    if (response.status === 403) {
      throw new Error(
        "Acceso restringido. Esta función está disponible solo para cuentas BUSINESS.",
      );
    }
    if (response.status === 429) {
      throw new Error(
        "Has enviado demasiadas solicitudes B2B-AI. Espera un momento antes de reintentar.",
      );
    }
    if (response.status === 404) {
      throw new Error(
        "Recurso no encontrado. Verifica que el anuncio o negocio existe y te pertenece.",
      );
    }
    const errPayload = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
    throw new Error(errPayload.message || `Error en endpoint B2B-AI (HTTP ${response.status})`);
  }

  const data = (await response.json()) as T;
  if (!data || typeof data !== "object") {
    throw new Error("Respuesta inválida del servidor B2B-AI");
  }
  return data;
}

// ============================================================
// FEATURE #9 — DYNAMIC PRICING
// ============================================================
export async function recommendPricing(request: PricingRequest): Promise<PricingResponse> {
  return postJson<PricingResponse>("/pricing", request);
}

// ============================================================
// FEATURE #21 — ADS OPTIMIZER
// ============================================================
export async function optimizeAds(request: AdsOptimizeRequest): Promise<AdsOptimizeResponse> {
  return postJson<AdsOptimizeResponse>("/ads/optimize", request);
}

// ============================================================
// FEATURE #23 — CHURN PREDICTOR
// ============================================================
export async function predictChurn(request: ChurnPredictRequest): Promise<ChurnPredictResponse> {
  return postJson<ChurnPredictResponse>("/churn/predict", request);
}
