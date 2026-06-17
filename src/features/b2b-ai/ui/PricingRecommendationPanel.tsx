// ============================================================
// src/features/b2b-ai/ui/PricingRecommendationPanel.tsx
// Feature #9 — Panel de recomendación de precio dinámico.
// Form: courtId + date + hour → display: recommendedPrice, baseline,
// delta, occupancy, confidence, SHAP drivers, narrative.
// ============================================================

import { useState, useEffect } from "react";
import { Loader2, TrendingUp, Calendar, Clock, Target, BarChart3 } from "lucide-react";
import { Card } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Skeleton } from "@/shared/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/ui/tabs";
import { useB2bAiStore } from "../model/useB2bAiStore";
import { ShapExplanation } from "./ShapExplanation";
import { InsightBanner } from "./InsightBanner";
import {
  formatPEN,
  formatPercent,
  deltaColor,
  getTomorrowDate,
  isValidDate,
  isValidHour,
} from "../model/pricingHelpers";

interface PricingRecommendationPanelProps {
  /** Lista de canchas del business (courtId + name) para el select */
  courts: Array<{ id: string; name: string }>;
  defaultCourtId?: string;
}

export function PricingRecommendationPanel({
  courts,
  defaultCourtId,
}: PricingRecommendationPanelProps) {
  const { pricingRecommendation, pricingLoading, pricingError, fetchPricing } = useB2bAiStore();

  const [courtId, setCourtId] = useState(defaultCourtId || courts[0]?.id || "");
  const [date, setDate] = useState(getTomorrowDate());
  const [hour, setHour] = useState<string>(""); // string vacío = "no especificar"

  // Auto-fetch si tenemos courtId + date
  useEffect(() => {
    if (courtId && isValidDate(date) && !pricingRecommendation) {
      void handleFetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleFetch() {
    if (!courtId) {
      return;
    }
    if (!isValidDate(date)) {
      return;
    }
    const parsedHour = hour === "" ? undefined : parseInt(hour, 10);
    if (parsedHour !== undefined && !isValidHour(parsedHour)) {
      return;
    }
    await fetchPricing({ courtId, date, hour: parsedHour });
  }

  return (
    <div className="space-y-4">
      {/* Form */}
      <Card className="p-4 md:p-5 bg-gradient-card border border-border rounded-2xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold flex items-center gap-1">
              <Target className="h-3 w-3" /> Cancha
            </Label>
            <select
              value={courtId}
              onChange={(e) => setCourtId(e.target.value)}
              className="w-full h-9 px-3 rounded-xl bg-background border border-border text-sm focus:ring-1 focus:ring-primary outline-none"
            >
              {courts.length === 0 && <option value="">(Sin canchas)</option>}
              {courts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Fecha
            </Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-9 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold flex items-center gap-1">
              <Clock className="h-3 w-3" /> Hora (opcional)
            </Label>
            <Input
              type="number"
              min={0}
              max={23}
              placeholder="19 = 19h"
              value={hour}
              onChange={(e) => setHour(e.target.value)}
              className="h-9 text-sm"
            />
          </div>

          <Button
            onClick={handleFetch}
            disabled={pricingLoading || !courtId || !isValidDate(date)}
            className="h-9 bg-gradient-primary hover:scale-[1.02] active:scale-[0.98] text-primary-foreground font-bold rounded-xl shadow-glow transition-all"
          >
            {pricingLoading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                Calculando...
              </>
            ) : (
              <>
                <TrendingUp className="h-3.5 w-3.5 mr-1.5" />
                Recomendar
              </>
            )}
          </Button>
        </div>
        {pricingError && (
          <div className="mt-3 text-xs text-red-500 bg-red-500/10 border border-red-500/30 rounded-lg p-2">
            {pricingError}
          </div>
        )}
      </Card>

      {/* Results */}
      {pricingLoading && <PricingSkeleton />}

      {pricingRecommendation && !pricingLoading && (
        <Tabs defaultValue="resumen" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="resumen">Resumen</TabsTrigger>
            <TabsTrigger value="detalle">Detalle</TabsTrigger>
          </TabsList>

          <TabsContent value="resumen" className="space-y-4 mt-4">
            <InsightBanner
              narrative={pricingRecommendation.narrative}
              model={pricingRecommendation.metadata.model}
              onRegenerate={handleFetch}
              regenerating={pricingLoading}
            />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <MetricCard
                id="price-recommended"
                label="Precio recomendado"
                value={formatPEN(pricingRecommendation.recommendedPrice)}
                accentClass="text-primary bg-primary/10 border-primary/30"
              />
              <MetricCard
                label="Cambio vs baseline"
                value={formatPercent(pricingRecommendation.deltaPct)}
                accentClass={`${deltaColor(pricingRecommendation.deltaPct)} bg-muted/40 border-border/40`}
              />
              <MetricCard
                label="Ocupación esperada"
                value={formatPercent(pricingRecommendation.occupancyRate, 0, false)}
                accentClass="text-electric bg-electric/10 border-electric/30"
              />
              <MetricCard
                label="Confianza"
                value={formatPercent(pricingRecommendation.confidence, 0, false)}
                accentClass="text-neon bg-neon/10 border-neon/30"
              />
            </div>

            <Card className="p-4 bg-background/50 border border-border/40 rounded-2xl">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-muted-foreground">Baseline actual de la cancha</div>
                <div className="text-sm font-mono font-semibold text-foreground">
                  {formatPEN(pricingRecommendation.baseline)} / hora
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  {pricingRecommendation.bestHour !== undefined &&
                  pricingRecommendation.bestHour !== null
                    ? "Mejor hora del día (basado en histórico)"
                    : "Slot solicitado"}
                </div>
                <div className="text-sm font-mono font-semibold text-foreground">
                  {pricingRecommendation.bestHour !== undefined &&
                  pricingRecommendation.bestHour !== null
                    ? `${pricingRecommendation.bestHour}:00`
                    : hour !== ""
                      ? `${hour}:00`
                      : "—"}
                </div>
              </div>
              <div className="flex items-center justify-between mt-1">
                <div className="text-xs text-muted-foreground">Reservas históricas usadas</div>
                <div className="text-sm font-mono font-semibold text-foreground">
                  {pricingRecommendation.sampleSize}
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="detalle" className="mt-4">
            <Card className="p-4 md:p-5 bg-background/50 border border-border/40 rounded-2xl">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm">¿Por qué este precio?</h3>
              </div>
              <ShapExplanation drivers={pricingRecommendation.drivers} unit="PEN" />
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {!pricingRecommendation && !pricingLoading && (
        <Card className="p-8 text-center bg-muted/20 border border-dashed border-border rounded-2xl">
          <Target className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            Selecciona una cancha y fecha, y pulsa <strong>Recomendar</strong> para ver el precio
            dinámico óptimo basado en ocupación histórica y patrones de demanda.
          </p>
        </Card>
      )}
    </div>
  );
}

function MetricCard({
  id,
  label,
  value,
  accentClass,
}: {
  id?: string;
  label: string;
  value: string;
  accentClass: string;
}) {
  return (
    <div id={id} className={`p-3 rounded-2xl border ${accentClass} text-left`}>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="text-lg md:text-xl font-bold mt-0.5 font-mono tabular-nums">{value}</div>
    </div>
  );
}

function PricingSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-20 w-full rounded-2xl" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-20 w-full rounded-2xl" />
      </div>
    </div>
  );
}
