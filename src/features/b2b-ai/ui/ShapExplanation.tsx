// ============================================================
// src/features/b2b-ai/ui/ShapExplanation.tsx
// Visualización SHAP-style de las contribuciones de las features.
// Disclaimer: NO es la librería SHAP oficial — son contribuciones
// marginales calculadas en el backend como (value - baseline) * weight * scale.
// Ver docs/b2b-ai/shap-explainability.md para el detalle académico.
// ============================================================

import { TrendingUp, TrendingDown, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/ui/tooltip";
import type { ShapFeature } from "@/entities/types";
import { formatPEN, describeShapFeature } from "../model/pricingHelpers";

interface ShapExplanationProps {
  drivers: ShapFeature[];
  /** Unidad de las contribuciones: "PEN" para pricing, "puntos" para ads, "score" para churn */
  unit?: "PEN" | "puntos" | "score";
  /** Etiqueta compacta (opcional) */
  compact?: boolean;
}

export function ShapExplanation({ drivers, unit = "PEN", compact = false }: ShapExplanationProps) {
  if (!drivers || drivers.length === 0) {
    return (
      <div className="text-xs text-muted-foreground italic p-3 bg-muted/30 rounded-lg">
        No hay suficientes datos para explicar esta predicción.
      </div>
    );
  }

  // Encuentra el máximo absoluto para normalizar el ancho de las barras
  const maxAbs = Math.max(...drivers.map((d) => Math.abs(d.contribution)), 0.01);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <Info className="h-3 w-3" />
          Drivers SHAP-style
          <span className="text-[10px] font-normal normal-case tracking-normal opacity-70">
            (explicabilidad simulada, no SHAP oficial)
          </span>
        </div>

        <div className="space-y-1.5">
          {drivers.map((driver, idx) => {
            const isPositive = driver.contribution >= 0;
            const widthPct = (Math.abs(driver.contribution) / maxAbs) * 50; // máximo 50% del row
            const sign = isPositive ? "+" : "";

            return (
              <Tooltip key={`${driver.feature}-${idx}`}>
                <TooltipTrigger asChild>
                  <div className="group cursor-help">
                    <div className="flex items-center justify-between text-xs mb-0.5">
                      <span className="font-medium text-foreground truncate pr-2">
                        {driver.feature}
                      </span>
                      <span
                        className={`font-mono font-semibold tabular-nums ${
                          isPositive ? "text-emerald-500" : "text-red-500"
                        }`}
                      >
                        {isPositive ? (
                          <TrendingUp className="inline h-3 w-3 mr-0.5" />
                        ) : (
                          <TrendingDown className="inline h-3 w-3 mr-0.5" />
                        )}
                        {sign}
                        {formatContributionValue(driver.contribution, unit)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Línea base centrada (la mitad) */}
                      <div className="flex-1 relative h-5 bg-muted/30 rounded">
                        {/* Centro */}
                        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border" />
                        {/* Barra de contribución */}
                        {isPositive ? (
                          <div
                            className="absolute top-0.5 bottom-0.5 bg-gradient-to-r from-emerald-500/30 to-emerald-500 rounded transition-all"
                            style={{
                              left: "50%",
                              width: `${widthPct}%`,
                            }}
                          />
                        ) : (
                          <div
                            className="absolute top-0.5 bottom-0.5 bg-gradient-to-l from-red-500/30 to-red-500 rounded transition-all"
                            style={{
                              right: "50%",
                              width: `${widthPct}%`,
                            }}
                          />
                        )}
                      </div>
                    </div>
                    {driver.weight !== undefined && !compact && (
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        Peso del modelo: {(driver.weight * 100).toFixed(0)}%
                      </div>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs">
                  <div className="space-y-1">
                    <p className="font-semibold">{driver.feature}</p>
                    <p className="text-xs">{describeShapFeature(driver)}</p>
                    <p className="text-[10px] text-muted-foreground italic">
                      Valor observado: {driver.value}
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
}

function formatContributionValue(value: number, unit: "PEN" | "puntos" | "score"): string {
  if (unit === "PEN") return formatPEN(value);
  if (unit === "puntos") return `${(value * 100).toFixed(2)} pp`;
  return value.toFixed(3);
}
