import { supabase } from "@/shared/api/supabase";
import {
  AiRecommendationResponse,
  AiRecommendationType,
  BusinessChallengeValidationStatus,
  BusinessVenueChallenge,
  EngagementAnalytics,
  EngagementAchievement,
  EngagementAchievementEvaluation,
  EngagementAchievementInput,
  EngagementChallenge,
  EngagementChallengeInput,
  EngagementContent,
  EngagementContentInput,
  EngagementDiagnostics,
  EngagementEmbeddingSummary,
  EngagementEventInput,
  EngagementProfile,
  SmartNotificationInput,
  SmartNotificationResult,
} from "./types";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:3000") + "/api/v1";

async function getAuthorizationHeader(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("No existe una sesión activa para registrar engagement.");
  }

  return { Authorization: `Bearer ${session.access_token}` };
}

/**
 * Registra una señal privada sin bloquear la acción principal del usuario.
 * Los errores se reportan en desarrollo, pero no interrumpen publicaciones o partidos.
 */
export async function trackEngagementEvent(input: EngagementEventInput): Promise<void> {
  try {
    const authorization = await getAuthorizationHeader();
    const response = await fetch(`${API_URL}/engagement/events`, {
      method: "POST",
      headers: { ...authorization, "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      throw new Error(`El backend rechazó el evento de engagement (${response.status}).`);
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn("[Engagement AI] No se pudo registrar la señal:", error);
    }
  }
}

/** Obtiene el resumen estructurado que posteriormente se convertirá en embedding. */
export async function getEngagementProfile(): Promise<EngagementProfile> {
  const authorization = await getAuthorizationHeader();
  const response = await fetch(`${API_URL}/engagement/profile`, { headers: authorization });

  if (!response.ok) {
    throw new Error(`No se pudo obtener el perfil de engagement (${response.status}).`);
  }

  return response.json() as Promise<EngagementProfile>;
}

/** Obtiene metricas privadas para medir calidad y conversion del motor. */
export async function getEngagementAnalytics(): Promise<EngagementAnalytics> {
  const authorization = await getAuthorizationHeader();
  const response = await fetch(`${API_URL}/engagement/analytics`, { headers: authorization });

  if (!response.ok) {
    throw new Error(`No se pudo obtener analytics de engagement (${response.status}).`);
  }

  return response.json() as Promise<EngagementAnalytics>;
}

/** Verifica que backend, tablas y configuracion de IA esten listos para probar. */
export async function getEngagementDiagnostics(): Promise<EngagementDiagnostics> {
  const authorization = await getAuthorizationHeader();
  const response = await fetch(`${API_URL}/engagement/diagnostics`, { headers: authorization });

  if (!response.ok) {
    throw new Error(`No se pudo obtener diagnostico de engagement (${response.status}).`);
  }

  return response.json() as Promise<EngagementDiagnostics>;
}

/** Reconstruye la huella vectorial privada del usuario desde sus senales reales. */
export async function rebuildEngagementEmbedding(): Promise<EngagementEmbeddingSummary> {
  const authorization = await getAuthorizationHeader();
  const response = await fetch(`${API_URL}/engagement/embedding/rebuild`, {
    method: "POST",
    headers: authorization,
  });

  if (!response.ok) {
    throw new Error(`No se pudo reconstruir el embedding (${response.status}).`);
  }

  return response.json() as Promise<EngagementEmbeddingSummary>;
}

/**
 * Pide al backend recomendaciones reales generadas con Vertex AI.
 * El backend arma primero un contexto seguro con datos reales y luego llama al modelo.
 */
export async function getAiRecommendations(options?: {
  type?: AiRecommendationType;
  limit?: number;
  language?: "es" | "en" | "pt";
}): Promise<AiRecommendationResponse> {
  const authorization = await getAuthorizationHeader();
  const response = await fetch(`${API_URL}/ai/recommend`, {
    method: "POST",
    headers: { ...authorization, "Content-Type": "application/json" },
    body: JSON.stringify({
      type: options?.type ?? "overview",
      limit: options?.limit ?? 6,
      language: options?.language ?? "es",
    }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(body.message || `No se pudo generar recomendaciones (${response.status}).`);
  }

  return response.json() as Promise<AiRecommendationResponse>;
}

/**
 * Obtiene el paquete diario cacheado. Solo consume IA si el backend no tiene
 * recomendaciones vigentes para el dia actual.
 */
export async function getTodayAiRecommendations(): Promise<AiRecommendationResponse> {
  const authorization = await getAuthorizationHeader();
  const controller = new AbortController();
  // Timeout defensivo para que Home no quede en carga infinita si backend/IA demora demasiado.
  const timeoutId = globalThis.setTimeout(() => controller.abort(), 15000);
  let response: Response;
  try {
    response = await fetch(`${API_URL}/engagement/recommendations/today`, {
      headers: authorization,
      signal: controller.signal,
    });
  } finally {
    globalThis.clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(
      body.message || `No se pudo cargar recomendaciones del dia (${response.status}).`,
    );
  }

  return response.json() as Promise<AiRecommendationResponse>;
}

/**
 * Guarda el borrador de notificacion inteligente como alerta in-app.
 * La campana de notificaciones recibe el insert por realtime o por el retorno inmediato.
 */
export async function saveSmartNotification(
  input: SmartNotificationInput,
): Promise<SmartNotificationResult> {
  const authorization = await getAuthorizationHeader();
  const response = await fetch(`${API_URL}/engagement/smart-notification`, {
    method: "POST",
    headers: { ...authorization, "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(body.message || `No se pudo guardar la notificacion (${response.status}).`);
  }

  return response.json() as Promise<SmartNotificationResult>;
}

/** Guarda un reto diario sugerido por recomendaciones como estado persistente. */
export async function saveEngagementChallenge(
  input: EngagementChallengeInput,
): Promise<EngagementChallenge> {
  const authorization = await getAuthorizationHeader();
  const response = await fetch(`${API_URL}/engagement/challenges`, {
    method: "POST",
    headers: { ...authorization, "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(`No se pudo guardar el reto (${response.status}).`);
  }

  return response.json() as Promise<EngagementChallenge>;
}

/** Lista los ultimos retos persistidos del usuario. */
export async function getEngagementChallenges(): Promise<EngagementChallenge[]> {
  const authorization = await getAuthorizationHeader();
  const response = await fetch(`${API_URL}/engagement/challenges`, { headers: authorization });

  if (!response.ok) {
    throw new Error(`No se pudo listar retos (${response.status}).`);
  }

  return response.json() as Promise<EngagementChallenge[]>;
}

/** Lista retos que usuarios asignaron a sedes de la empresa autenticada. */
export async function getBusinessVenueChallenges(): Promise<BusinessVenueChallenge[]> {
  const authorization = await getAuthorizationHeader();
  const response = await fetch(`${API_URL}/engagement/business/venue-challenges`, {
    headers: authorization,
  });

  if (!response.ok) {
    throw new Error(`No se pudo listar retos de sedes (${response.status}).`);
  }

  return response.json() as Promise<BusinessVenueChallenge[]>;
}

/** Actualiza la validacion empresarial de un reto realizado en una sede propia. */
export async function updateBusinessVenueChallengeStatus(
  challengeId: string,
  status: BusinessChallengeValidationStatus,
  note?: string,
): Promise<EngagementChallenge> {
  const authorization = await getAuthorizationHeader();
  const response = await fetch(
    `${API_URL}/engagement/business/venue-challenges/${challengeId}/status`,
    {
      method: "POST",
      headers: { ...authorization, "Content-Type": "application/json" },
      body: JSON.stringify({ status, note }),
    },
  );

  if (!response.ok) {
    const body = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(body.message || `No se pudo validar el reto (${response.status}).`);
  }

  return response.json() as Promise<EngagementChallenge>;
}

/** Completa un reto persistido. */
export async function completeEngagementChallenge(
  challengeId: string,
): Promise<EngagementChallenge> {
  const authorization = await getAuthorizationHeader();
  const response = await fetch(`${API_URL}/engagement/challenges/${challengeId}/complete`, {
    method: "POST",
    headers: authorization,
  });

  if (!response.ok) {
    throw new Error(`No se pudo completar el reto (${response.status}).`);
  }

  return response.json() as Promise<EngagementChallenge>;
}

/** Guarda un logro sugerido por recomendaciones como objetivo persistente. */
export async function saveEngagementAchievement(
  input: EngagementAchievementInput,
): Promise<EngagementAchievement> {
  const authorization = await getAuthorizationHeader();
  const response = await fetch(`${API_URL}/engagement/achievements`, {
    method: "POST",
    headers: { ...authorization, "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(`No se pudo guardar el logro (${response.status}).`);
  }

  return response.json() as Promise<EngagementAchievement>;
}

/** Lista los ultimos logros persistidos del usuario. */
export async function getEngagementAchievements(): Promise<EngagementAchievement[]> {
  const authorization = await getAuthorizationHeader();
  const response = await fetch(`${API_URL}/engagement/achievements`, { headers: authorization });

  if (!response.ok) {
    throw new Error(`No se pudo listar logros (${response.status}).`);
  }

  return response.json() as Promise<EngagementAchievement[]>;
}

/** Evalua logros guardados y desbloquea los que ya cumplen reglas reales. */
export async function evaluateEngagementAchievements(): Promise<EngagementAchievementEvaluation> {
  const authorization = await getAuthorizationHeader();
  const response = await fetch(`${API_URL}/engagement/achievements/evaluate`, {
    method: "POST",
    headers: authorization,
  });

  if (!response.ok) {
    throw new Error(`No se pudo evaluar logros (${response.status}).`);
  }

  return response.json() as Promise<EngagementAchievementEvaluation>;
}

/** Guarda contenido personalizado de recomendaciones para consultarlo luego. */
export async function saveEngagementContent(
  input: EngagementContentInput,
): Promise<EngagementContent> {
  const authorization = await getAuthorizationHeader();
  const response = await fetch(`${API_URL}/engagement/contents`, {
    method: "POST",
    headers: { ...authorization, "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(`No se pudo guardar el contenido (${response.status}).`);
  }

  return response.json() as Promise<EngagementContent>;
}

/** Lista newsletters y narrativas guardadas por el usuario autenticado. */
export async function getEngagementContents(): Promise<EngagementContent[]> {
  const authorization = await getAuthorizationHeader();
  const response = await fetch(`${API_URL}/engagement/contents`, { headers: authorization });

  if (!response.ok) {
    throw new Error(`No se pudo listar contenidos (${response.status}).`);
  }

  return response.json() as Promise<EngagementContent[]>;
}
