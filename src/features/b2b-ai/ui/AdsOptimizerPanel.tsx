// ============================================================
// src/features/b2b-ai/ui/AdsOptimizerPanel.tsx
// Feature #21 — Panel de optimización de anuncios (UCB1 + LLM).
// Form: adId + goal → display: ranked variants + recommendation + SHAP.
// ============================================================

import { useState, useEffect } from "react";
import { Loader2, Sparkles, Megaphone, MousePointer, TrendingUp } from "lucide-react";
import { Card } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/ui/tabs";
import { useB2bAiStore } from "../model/useB2bAiStore";
import { ShapExplanation } from "./ShapExplanation";
import { InsightBanner } from "./InsightBanner";
import { formatPercent } from "../model/pricingHelpers";
import type { Ad } from "@/entities/types";
import { toast } from "sonner";

interface AdsOptimizerPanelProps {
  ads: Ad[];
  /** Callback opcional cuando el usuario aplica una variante al ad */
  onApplyVariant?: (adId: string, variantIndex: number) => Promise<void>;
}

const STYLE_BADGE: Record<Ad["category"] | string, string> = {
  original: "bg-muted text-muted-foreground border-border/50",
  emocional: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  racional: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  urgencia: "bg-orange-500/20 text-orange-400 border-orange-500/30",
};

const STYLE_ICON: Record<string, string> = {
  original: "📄",
  emocional: "❤️",
  racional: "🧠",
  urgencia: "⚡",
};

export function AdsOptimizerPanel({ ads, onApplyVariant }: AdsOptimizerPanelProps) {
  const { adsOptimization, adsLoading, adsError, fetchAdsOptimization } = useB2bAiStore();

  const [adId, setAdId] = useState(ads[0]?.id || "");
  const [goal, setGoal] = useState<"ctr" | "conversions">("ctr");
  const [applying, setApplying] = useState<string | null>(null);

  useEffect(() => {
    if (adId && !adsOptimization) {
      void handleFetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleFetch() {
    if (!adId) return;
    await fetchAdsOptimization({ adId, goal });
  }

  async function handleApply(variantId: string) {
    if (!onApplyVariant || !adsOptimization) return;
    const idx = adsOptimization.variants.findIndex((v) => v.variantId === variantId);
    if (idx === -1) return;
    setApplying(variantId);
    try {
      await onApplyVariant(adId, idx);
      toast.success(`Variante ${variantId} aplicada al anuncio`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al aplicar variante";
      toast.error(msg);
    } finally {
      setApplying(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Form */}
      <Card className="p-4 md:p-5 bg-gradient-card border border-border rounded-2xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold flex items-center gap-1">
              <Megaphone className="h-3 w-3" /> Anuncio
            </label>
            <select
              value={adId}
              onChange={(e) => setAdId(e.target.value)}
              className="w-full h-9 px-3 rounded-xl bg-background border border-border text-sm focus:ring-1 focus:ring-primary outline-none"
            >
              {ads.length === 0 && <option value="">(Sin anuncios)</option>}
              {ads.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold flex items-center gap-1">
              <MousePointer className="h-3 w-3" /> Objetivo
            </label>
            <select
              value={goal}
              onChange={(e) => setGoal(e.target.value as "ctr" | "conversions")}
              className="w-full h-9 px-3 rounded-xl bg-background border border-border text-sm focus:ring-1 focus:ring-primary outline-none"
            >
              <option value="ctr">Maximizar CTR</option>
              <option value="conversions">Maximizar contactos</option>
            </select>
          </div>

          <Button
            onClick={handleFetch}
            disabled={adsLoading || !adId}
            className="h-9 bg-gradient-primary hover:scale-[1.02] active:scale-[0.98] text-primary-foreground font-bold rounded-xl shadow-glow transition-all"
          >
            {adsLoading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                Optimizando...
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                Generar variantes
              </>
            )}
          </Button>
        </div>
        {adsError && (
          <div className="mt-3 text-xs text-red-500 bg-red-500/10 border border-red-500/30 rounded-lg p-2">
            {adsError}
          </div>
        )}
      </Card>

      {/* Results */}
      {adsLoading && <AdsSkeleton />}

      {adsOptimization && !adsLoading && (
        <Tabs defaultValue="variantes" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="variantes">Variantes</TabsTrigger>
            <TabsTrigger value="detalle">¿Por qué?</TabsTrigger>
          </TabsList>

          <TabsContent value="variantes" className="space-y-4 mt-4">
            <InsightBanner
              narrative={adsOptimization.narrative}
              model={adsOptimization.metadata.model}
              onRegenerate={handleFetch}
              regenerating={adsLoading}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <MetricMini
                label="CTR actual"
                value={formatPercent(adsOptimization.currentCtr, 2, false)}
                accentClass="text-muted-foreground bg-muted/40"
              />
              <MetricMini
                label="CTR predicho (mejor)"
                value={formatPercent(adsOptimization.variants[0]?.predictedCtr ?? 0, 2, false)}
                accentClass="text-emerald-500 bg-emerald-500/10 border-emerald-500/30"
              />
              <MetricMini
                label="Lift esperado"
                value={formatPercent(adsOptimization.expectedLift, 2)}
                accentClass="text-primary bg-primary/10 border-primary/30"
                icon={<TrendingUp className="h-3 w-3" />}
              />
            </div>

            <div className="space-y-3">
              {adsOptimization.variants.map((v) => {
                const isRecommended = v.variantId === adsOptimization.recommendation;
                const badgeClass = STYLE_BADGE[v.style] || STYLE_BADGE.original;
                return (
                  <Card
                    key={v.variantId}
                    className={`p-4 rounded-2xl border-2 transition-all ${
                      isRecommended
                        ? "border-primary bg-primary/5 shadow-glow"
                        : "border-border bg-background/40"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex-shrink-0 h-10 w-10 rounded-xl grid place-items-center text-lg ${badgeClass} border`}
                      >
                        {STYLE_ICON[v.style] || "📄"}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Variante {v.variantId}
                          </span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-full border font-bold ${badgeClass}`}
                          >
                            {v.style}
                          </span>
                          {isRecommended && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground font-bold">
                              ✓ Recomendada
                            </span>
                          )}
                          <span className="text-[10px] text-muted-foreground ml-auto font-mono">
                            Score: {v.score.toFixed(4)}
                          </span>
                        </div>

                        <h4 className="font-bold text-sm text-foreground">{v.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                          {v.description}
                        </p>

                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/30">
                          <div className="text-[10px] text-muted-foreground">
                            CTR predicho:{" "}
                            <span className="font-mono font-semibold text-foreground">
                              {formatPercent(v.predictedCtr, 2, false)}
                            </span>
                          </div>
                          {onApplyVariant && v.variantId !== "A" && (
                            <Button
                              onClick={() => handleApply(v.variantId)}
                              disabled={applying !== null}
                              size="sm"
                              variant={isRecommended ? "default" : "outline"}
                              className="h-7 text-xs"
                            >
                              {applying === v.variantId ? (
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              ) : null}
                              Aplicar
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="detalle" className="mt-4">
            <Card className="p-4 md:p-5 bg-background/50 border border-border/40 rounded-2xl">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm">¿Por qué esta recomendación?</h3>
              </div>
              <ShapExplanation drivers={adsOptimization.drivers} unit="puntos" />
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {!adsOptimization && !adsLoading && (
        <Card className="p-8 text-center bg-muted/20 border border-dashed border-border rounded-2xl">
          <Megaphone className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            Selecciona un anuncio y pulsa <strong>Generar variantes</strong>. La IA creará versiones
            con copy emocional, racional y de urgencia, y recomendará la mejor usando bandit UCB1.
          </p>
        </Card>
      )}
    </div>
  );
}

function MetricMini({
  label,
  value,
  accentClass,
  icon,
}: {
  label: string;
  value: string;
  accentClass: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className={`p-3 rounded-2xl border ${accentClass} text-left`}>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
        {icon}
        {label}
      </div>
      <div className="text-lg font-bold mt-0.5 font-mono tabular-nums">{value}</div>
    </div>
  );
}

function AdsSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-20 w-full rounded-2xl" />
      <Skeleton className="h-32 w-full rounded-2xl" />
      <Skeleton className="h-32 w-full rounded-2xl" />
      <Skeleton className="h-32 w-full rounded-2xl" />
    </div>
  );
}
