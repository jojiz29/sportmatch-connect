/**
 * ===================================================================
 * ARCHIVO: src/features/ai-security/types/index.ts
 * PROPÓSITO: Definición de interfaces TypeScript para el módulo
 *            de Seguridad Avanzada con IA (FSD Layer: Features).
 * ===================================================================
 */

/**
 * Resultado de una evaluación de moderación avanzada por el ensemble.
 */
export interface ModerationResult {
  ensemble_score: number; // Score final de 0 a 100
  signals: BlockSignal[];  // Señales individuales que componen el score
  action_recommended: "allow" | "warn" | "block";
  reasoning: string;       // Justificación detallada de la acción recomendada
}

/**
 * Señal de bloqueo individual evaluada por un sub-modelo o regla.
 */
export interface BlockSignal {
  name: string;        // Nombre de la señal (ej: "Vertex AI", "Filtro Regex", "Historial")
  score: number;       // Score de 0 a 100 para esta señal
  description?: string; // Explicación opcional
}

/**
 * Representa una puntuación calculada junto con su umbral de acción.
 */
export interface EnsembleScore {
  score: number;
  threshold: number; // Normalmente 75 para bloqueos automáticos
  isExceeded: boolean;
}

/**
 * Evento de seguridad que describe una acción sospechosa o bloqueada.
 */
export interface SecurityEvent {
  id: string;
  userId: string;
  timestamp: string;
  content?: string;
  contextType: "mensaje" | "comentario" | "perfil";
  result: ModerationResult;
}
