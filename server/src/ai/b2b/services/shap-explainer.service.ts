// ============================================================
// server/src/ai/b2b/services/shap-explainer.service.ts
// Genera contribuciones SHAP-style para las features del modelo.
// IMPORTANTE: NO usa la librería SHAP oficial. Calcula contribuciones
// marginales vs un baseline (la media histórica) — es explicabilidad
// simulada, documentada como tal. Ver docs/b2b-ai/shap-explainability.md
// para el disclaimer académico completo.
// ============================================================

import { Injectable } from "@nestjs/common";
import { ShapFeatureDto } from "../dto/b2b-common.dto";

export interface ShapInputFeature {
  /** Nombre legible de la feature (en español, para mostrar en UI) */
  name: string;
  /** Valor crudo observado (0-1 normalizado o valor absoluto) */
  value: number;
  /** Peso de la feature en el modelo (0-1, suma de todos los pesos no necesariamente = 1) */
  weight: number;
  /** Dirección: si true, un valor alto empuja la predicción hacia ARRIBA */
  positiveDirection: boolean;
  /** Valor baseline típico (media histórica) para calcular la desviación */
  baseline: number;
}

@Injectable()
export class ShapExplainerService {
  /**
   * Calcula contribuciones SHAP-style.
   * Fórmula:
   *   deviation = (value - baseline) / max(|baseline|, epsilon)
   *   signedDeviation = positiveDirection ? deviation : -deviation
   *   contribution = signedDeviation * weight * outputScale
   *
   * @param features  Features que entraron al modelo
   * @param outputScale  Escala del output (ej: 50 si output es precio en PEN ±50)
   * @returns Array ordenado por |contribution| descendente
   */
  computeContributions(features: ShapInputFeature[], outputScale: number): ShapFeatureDto[] {
    const epsilon = 1e-6;
    const contributions = features.map((f) => {
      const safeBaseline = Math.max(Math.abs(f.baseline), epsilon);
      const deviation = (f.value - f.baseline) / safeBaseline;
      const signedDeviation = f.positiveDirection ? deviation : -deviation;
      const contribution = +(signedDeviation * f.weight * outputScale).toFixed(2);

      return {
        feature: f.name,
        contribution,
        value: +f.value.toFixed(4),
        weight: +f.weight.toFixed(3),
      };
    });

    return contributions.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));
  }

  /**
   * Helper: genera la narrativa natural a partir de las top-K contributions.
   * NO llama al LLM (eso lo hace el orchestrator). Aquí solo arma el esqueleto
   * que el LLM luego reformula. Si el caller no quiere usar LLM, puede devolver
   * esto directamente como `narrative`.
   */
  buildSkeletonNarrative(
    topContributors: ShapFeatureDto[],
    summary: { direction: "up" | "down" | "flat"; magnitude: number },
  ): string {
    if (topContributors.length === 0) {
      return "No hay suficientes datos históricos para generar una explicación.";
    }

    const signs = topContributors.slice(0, 3).map((c) => {
      if (c.contribution > 0.5) return `${c.feature} empuja al alza`;
      if (c.contribution < -0.5) return `${c.feature} empuja a la baja`;
      return `${c.feature} tiene efecto neutro`;
    });

    const directionLabel =
      summary.direction === "up"
        ? `sube un ${(summary.magnitude * 100).toFixed(1)}%`
        : summary.direction === "down"
          ? `baja un ${(summary.magnitude * 100).toFixed(1)}%`
          : "se mantiene estable";

    return `El precio ${directionLabel} respecto al baseline. ${signs.join(". ")}.`;
  }
}
