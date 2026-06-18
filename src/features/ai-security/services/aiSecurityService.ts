/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * ===================================================================
 * ARCHIVO: src/features/ai-security/services/aiSecurityService.ts
 * PROPÓSITO: Servicio cliente para invocar la moderación avanzada con IA.
 * ===================================================================
 */

import { backendApi } from "@/shared/api/backendApi";
import { supabase } from "@/shared/api/supabase";
import { ModerationResult } from "../types";
import { useAuthStore } from "@/entities/user/useAuth";

export const aiSecurityService = {
  /**
   * Evalúa el contenido del usuario mediante el ensemble de modelos del backend.
   *
   * @param content - Texto a moderar
   * @param contextType - Tipo de contexto ('mensaje' | 'comentario' | 'perfil')
   * @param metadata - Datos contextuales opcionales
   */
  async evaluateSecurity(
    content: string,
    contextType: "mensaje" | "comentario" | "perfil",
    metadata?: Record<string, any>,
  ): Promise<ModerationResult> {
    // 0. Soporte para modo DEMO local
    if (useAuthStore.getState().isDemoMode) {
      const toxicKeywords = [
        "tonto",
        "estupido",
        "estúpido",
        "imbecil",
        "imbécil",
        "basura",
        "mierda",
        "puto",
        "puta",
        "hijo de puta",
      ];
      const contentLower = content.toLowerCase();
      const hasToxicWord = toxicKeywords.some((word) => contentLower.includes(word));

      if (hasToxicWord) {
        return {
          ensemble_score: 95,
          signals: [
            {
              name: "Modelos IA (Simulado)",
              score: 85,
              description: "Toxicidad simulada detectada",
            },
            {
              name: "Reglas y Palabras Clave (Local)",
              score: 95,
              description: "Palabra clave inapropiada detectada",
            },
            { name: "Historial de Comportamiento (Demo)", score: 0, description: "Limpio" },
          ],
          action_recommended: "block",
          reasoning: "Se detectó lenguaje inapropiado o insultos (Modo Demo).",
        };
      }

      return {
        ensemble_score: 10,
        signals: [
          { name: "Modelos IA (Simulado)", score: 10, description: "Contenido seguro" },
          { name: "Reglas y Palabras Clave (Local)", score: 0, description: "Limpio" },
          { name: "Historial de Comportamiento (Demo)", score: 0, description: "Limpio" },
        ],
        action_recommended: "allow",
        reasoning: "Contenido limpio (Modo Demo).",
      };
    }

    // 1. Obtener la sesión activa de Supabase
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;

    if (!token) {
      throw new Error("Sesión inactiva o expirada. Por favor, vuelve a iniciar sesión.");
    }

    const userId = session.user.id;

    // 2. Invocar el endpoint de moderación avanzada en NestJS
    const response = await backendApi.ai.moderateAdvanced(token, {
      userId,
      content,
      contextType,
      metadata,
    });

    // 3. Propagar errores o devolver resultado
    if (response.error) {
      throw new Error(response.error);
    }

    if (!response.data) {
      throw new Error("No se recibió respuesta del servidor de seguridad avanzada.");
    }

    return response.data;
  },
};
