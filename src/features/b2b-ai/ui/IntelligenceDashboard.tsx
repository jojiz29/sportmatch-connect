// ============================================================
// src/features/b2b-ai/ui/IntelligenceDashboard.tsx
// Compone los 3 paneles de B2B-AI con sub-tabs internas.
// Feature #9 (Pricing) | #21 (Ads Optimizer) | #23 (Churn Predictor).
// Recibe las canchas y ads del business como props desde la ruta.
// ============================================================

import { useState } from "react";
import { Sparkles, TrendingUp, Megaphone, TrendingDown } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/ui/tabs";
import { Card } from "@/shared/ui/card";
import { PricingRecommendationPanel } from "./PricingRecommendationPanel";
import { AdsOptimizerPanel } from "./AdsOptimizerPanel";
import { ChurnPredictorPanel } from "./ChurnPredictorPanel";
import type { Ad } from "@/entities/types";

interface IntelligenceDashboardProps {
  businessId: string;
  businessName?: string;
  /** Canchas del business para el panel de pricing */
  courts: Array<{ id: string; name: string }>;
  /** Anuncios del business para el panel de ads */
  ads: Ad[];
  /** Callback opcional al aplicar una variante del Ads Optimizer */
  onApplyAdVariant?: (adId: string, variantIndex: number) => Promise<void>;
}

export function IntelligenceDashboard({
  businessId,
  businessName,
  courts,
  ads,
  onApplyAdVariant,
}: IntelligenceDashboardProps) {
  const [activeSubtab, setActiveSubtab] = useState<"pricing" | "ads" | "churn">("churn");

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-5 md:p-6 bg-gradient-to-br from-primary/10 via-background to-electric/5 border border-primary/20 rounded-3xl">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 h-12 w-12 rounded-2xl bg-gradient-primary grid place-items-center text-primary-foreground shadow-glow">
            <Sparkles className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl md:text-2xl font-extrabold text-foreground">Inteligencia B2B</h2>
            <p className="text-xs md:text-sm text-muted-foreground mt-1 leading-relaxed">
              Recomendaciones accionables generadas con IA para tu negocio{" "}
              {businessName && <strong className="text-foreground">{businessName}</strong>}. Los
              modelos se entrenan con tus datos históricos de ocupación, anuncios e interacciones.{" "}
              <span className="italic opacity-70">
                La explicabilidad es simulada (no usa la librería SHAP oficial).
              </span>
            </p>
          </div>
        </div>
      </Card>

      {/* Sub-tabs */}
      <Tabs value={activeSubtab} onValueChange={(v) => setActiveSubtab(v as typeof activeSubtab)}>
        <TabsList className="grid w-full grid-cols-3 max-w-2xl">
          <TabsTrigger value="churn" className="gap-1.5">
            <TrendingDown className="h-3.5 w-3.5" />
            Churn
          </TabsTrigger>
          <TabsTrigger value="pricing" className="gap-1.5">
            <TrendingUp className="h-3.5 w-3.5" />
            Pricing
          </TabsTrigger>
          <TabsTrigger value="ads" className="gap-1.5">
            <Megaphone className="h-3.5 w-3.5" />
            Ads
          </TabsTrigger>
        </TabsList>

        <TabsContent value="churn" className="mt-6">
          <ChurnPredictorPanel businessId={businessId} businessName={businessName} />
        </TabsContent>

        <TabsContent value="pricing" className="mt-6">
          <PricingRecommendationPanel courts={courts} />
        </TabsContent>

        <TabsContent value="ads" className="mt-6">
          <AdsOptimizerPanel ads={ads} onApplyVariant={onApplyAdVariant} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
