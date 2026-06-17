// ============================================================
// src/features/b2b-ai/ui/InsightBanner.tsx
// Banner con la narrative generada por Vertex AI (gemini-2.5-flash).
// Si la narrativa viene del skeleton fallback (LLM no disponible),
// el banner se ve igual — el contenido sigue siendo útil.
// ============================================================

import { Sparkles, RefreshCw } from "lucide-react";

interface InsightBannerProps {
  narrative: string;
  model?: string;
  onRegenerate?: () => void;
  regenerating?: boolean;
}

export function InsightBanner({
  narrative,
  model,
  onRegenerate,
  regenerating = false,
}: InsightBannerProps) {
  if (!narrative) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-background to-electric/5 p-4 md:p-5">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 h-9 w-9 rounded-xl bg-gradient-primary grid place-items-center text-primary-foreground shadow-glow">
          <Sparkles className="h-4.5 w-4.5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-primary">
              Recomendación IA
            </div>
            {model && (
              <div className="text-[10px] text-muted-foreground font-mono opacity-70">{model}</div>
            )}
          </div>
          <p className="text-sm text-foreground leading-relaxed">{narrative}</p>
        </div>

        {onRegenerate && (
          <button
            type="button"
            onClick={onRegenerate}
            disabled={regenerating}
            className="flex-shrink-0 h-8 w-8 rounded-lg bg-background/80 hover:bg-accent border border-border/50 grid place-items-center text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Regenerar recomendación"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${regenerating ? "animate-spin" : ""}`} />
          </button>
        )}
      </div>
    </div>
  );
}
