// ============================================================
// src/features/b2b-ai/ui/ChurnPredictorPanel.tsx
// Feature #23 — Panel de predicción de churn (RFM-lite).
// Form: businessId + lookbackDays → display: risk badge, score,
// factores con acciones sugeridas, SHAP drivers.
// ============================================================

import { useState, useEffect } from "react";
import { Loader2, AlertTriangle, TrendingDown, Users, DollarSign, Activity } from "lucide-react";
import { Card } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/ui/tabs";
import { useB2bAiStore } from "../model/useB2bAiStore";
import { ShapExplanation } from "./ShapExplanation";
import { InsightBanner } from "./InsightBanner";
import { formatPercent, riskLevelColor, riskLevelLabel } from "../model/pricingHelpers";

interface ChurnPredictorPanelProps {
  businessId: string;
  businessName?: string;
}

export function ChurnPredictorPanel({ businessId, businessName }: ChurnPredictorPanelProps) {
  const { churnPrediction, churnLoading, churnError, fetchChurnPrediction } = useB2bAiStore();
  const [lookbackDays, setLookbackDays] = useState<number>(30);

  useEffect(() => {
    if (businessId && !churnPrediction) {
      void handleFetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleFetch() {
    if (!businessId) return;
    await fetchChurnPrediction({ businessId, lookbackDays });
  }

  return (
    <div className="space-y-4">
      {/* Form */}
      <Card className="p-4 md:p-5 bg-gradient-card border border-border rounded-2xl">
        <div className="flex flex-col md:flex-row md:items-end gap-3">
          <div className="flex-1 space-y-1.5">
            <label className="text-xs font-semibold flex items-center gap-1">
              <Activity className="h-3 w-3" /> Período de análisis
            </label>
            <select
              value={lookbackDays}
              onChange={(e) => setLookbackDays(parseInt(e.target.value, 10))}
              className="w-full h-9 px-3 rounded-xl bg-background border border-border text-sm focus:ring-1 focus:ring-primary outline-none"
            >
              <option value={7}>Últimos 7 días</option>
              <option value={30}>Últimos 30 días (recomendado)</option>
              <option value={60}>Últimos 60 días</option>
              <option value={90}>Últimos 90 días</option>
            </select>
          </div>

          <Button
            onClick={handleFetch}
            disabled={churnLoading || !businessId}
            className="h-9 bg-gradient-primary hover:scale-[1.02] active:scale-[0.98] text-primary-foreground font-bold rounded-xl shadow-glow transition-all"
          >
            {churnLoading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                Analizando...
              </>
            ) : (
              <>
                <TrendingDown className="h-3.5 w-3.5 mr-1.5" />
                Analizar riesgo
              </>
            )}
          </Button>
        </div>
        {churnError && (
          <div className="mt-3 text-xs text-red-500 bg-red-500/10 border border-red-500/30 rounded-lg p-2">
            {churnError}
          </div>
        )}
      </Card>

      {/* Results */}
      {churnLoading && <ChurnSkeleton />}

      {churnPrediction && !churnLoading && (
        <Tabs defaultValue="resumen" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="resumen">Resumen</TabsTrigger>
            <TabsTrigger value="detalle">Detalle</TabsTrigger>
          </TabsList>

          <TabsContent value="resumen" className="space-y-4 mt-4">
            <InsightBanner
              narrative={churnPrediction.narrative}
              model={churnPrediction.metadata.model}
              onRegenerate={handleFetch}
              regenerating={churnLoading}
            />

            {/* Risk badge */}
            <Card
              className={`p-5 md:p-6 rounded-2xl border-2 ${riskLevelColor(
                churnPrediction.riskLevel,
              )} text-center`}
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Riesgo {riskLevelLabel(churnPrediction.riskLevel)}
                </span>
              </div>
              <div className="text-5xl md:text-6xl font-extrabold font-mono tabular-nums">
                {formatPercent(churnPrediction.churnScore, 0, false)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Probabilidad de churn</div>
            </Card>

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <KpiSmall
                icon={<Activity className="h-3.5 w-3.5" />}
                label="Última interacción"
                value={
                  churnPrediction.daysSinceLastInteraction === Infinity
                    ? "Nunca"
                    : `${churnPrediction.daysSinceLastInteraction}d`
                }
              />
              <KpiSmall
                icon={<Users className="h-3.5 w-3.5" />}
                label="Anuncios activos"
                value={String(churnPrediction.activeAdsCount)}
              />
              <KpiSmall
                icon={<DollarSign className="h-3.5 w-3.5" />}
                label="Revenue (período)"
                value={`S/ ${churnPrediction.totalRevenue.toFixed(0)}`}
              />
              <KpiSmall
                icon={<Activity className="h-3.5 w-3.5" />}
                label="Engagement total"
                value={String(churnPrediction.totalEngagement)}
              />
            </div>

            {/* Factores */}
            <div>
              <h3 className="font-semibold text-sm mb-2 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-warning" />
                Factores principales y acciones sugeridas
              </h3>
              <div className="space-y-2">
                {churnPrediction.factors.map((f, idx) => (
                  <Card
                    key={idx}
                    className="p-3 md:p-4 rounded-2xl border border-border bg-background/40"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 h-9 w-9 rounded-lg bg-warning/10 border border-warning/30 grid place-items-center text-warning font-mono font-bold text-xs">
                        {(f.severity * 100).toFixed(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-foreground">{f.name}</div>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                          {f.description}
                        </p>
                        <div className="mt-2 p-2 rounded-lg bg-primary/5 border border-primary/20 text-xs">
                          <span className="font-semibold text-primary">Acción sugerida: </span>
                          <span className="text-foreground">{f.suggestedAction}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="detalle" className="mt-4">
            <Card className="p-4 md:p-5 bg-background/50 border border-border/40 rounded-2xl">
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm">¿Por qué este score?</h3>
              </div>
              <ShapExplanation drivers={churnPrediction.drivers} unit="score" />
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {!churnPrediction && !churnLoading && (
        <Card className="p-8 text-center bg-muted/20 border border-dashed border-border rounded-2xl">
          <TrendingDown className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            {businessName
              ? `Predice el riesgo de churn de "${businessName}" usando el modelo RFM-lite.`
              : "Selecciona un período y pulsa Analizar para ver el riesgo de churn del negocio."}
          </p>
        </Card>
      )}
    </div>
  );
}

function KpiSmall({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="p-3 rounded-2xl border border-border bg-background/40 text-left">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
        {icon}
        {label}
      </div>
      <div className="text-base font-bold mt-0.5 font-mono tabular-nums">{value}</div>
    </div>
  );
}

function ChurnSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-20 w-full rounded-2xl" />
      <Skeleton className="h-32 w-full rounded-2xl" />
      <Skeleton className="h-24 w-full rounded-2xl" />
    </div>
  );
}
