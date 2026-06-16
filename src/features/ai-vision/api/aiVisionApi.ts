import { backendApi } from "@/shared/api/backendApi";
import { supabase } from "@/shared/api/supabase";
import { AnalyzeVisionPayload, VisionAnalysisResponse } from "../types";

/**
 * analyzeVisionImage(): Llama al backend NestJS para procesar y analizar la imagen
 * con Vertex AI.
 */
export async function analyzeVisionImage<T>(
  payload: AnalyzeVisionPayload,
): Promise<VisionAnalysisResponse<T>> {
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;
  if (!token) {
    throw new Error("No hay sesión activa para realizar el análisis de IA.");
  }

  const response = await backendApi.vision.analyze(token, payload);
  if (response.error) {
    throw new Error(response.error);
  }

  if (!response.data) {
    throw new Error("La respuesta del servidor no contiene datos de análisis.");
  }

  return response.data as VisionAnalysisResponse<T>;
}
