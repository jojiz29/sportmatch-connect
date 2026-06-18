import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Video, Box, Crown, ArrowRight, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/entities/user/useAuth";
import { toast } from "sonner";

export const Route = createFileRoute("/app/ai-vision/")({
  component: AiVisionOverview,
});

function AiVisionOverview() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const [trials, setTrials] = useState({
    form_analyzer: 0,
    ar_preview: 0,
  });

  // Cargar trials del localStorage
  useEffect(() => {
    if (user) {
      const key = `sportmatch_trials_${user.id}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        setTrials({
          form_analyzer: parsed.form_analyzer || 0,
          ar_preview: parsed.ar_preview || 0,
        });
      } else {
        const initial = { form_analyzer: 0, ar_preview: 0 };
        localStorage.setItem(key, JSON.stringify(initial));
        setTrials(initial);
      }
    }
  }, [user]);

  const handleCardClick = (toolKey: "form_analyzer" | "ar_preview", targetRoute: string) => {
    if (!user) return;

    const hasPaidPlan = user.tier !== "FREE" && user.tier != null;
    const usedCount = trials[toolKey] || 0;

    if (hasPaidPlan) {
      navigate({ to: targetRoute });
    } else {
      if (usedCount < 1) {
        // Usar prueba gratuita única
        const key = `sportmatch_trials_${user.id}`;
        const updated = { ...trials, [toolKey]: usedCount + 1 };
        localStorage.setItem(key, JSON.stringify(updated));
        setTrials(updated);
        toast.info(
          `⚡ Iniciando tu única prueba gratuita de ${toolKey === "form_analyzer" ? "Form Analyzer" : "AR Court Preview"}...`,
        );
        navigate({ to: targetRoute });
      } else {
        // Excedió límite, abrir paywall redireccionando a Coach Pro
        toast.error(
          "Límite de prueba gratuita excedido. Suscríbete a nuestros planes para continuar.",
        );
        navigate({ to: "/app/coach" });
      }
    }
  };

  const userTier = user?.tier || "FREE";

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8 space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-card border border-border/50 rounded-3xl p-6 relative overflow-hidden shadow-card">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-amber-500/10 blur-2xl" />
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-600 grid place-items-center shadow-glow shrink-0 animate-pulse">
            <Crown className="h-7 w-7 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-foreground uppercase tracking-wide">
                Visión por Computadora
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-black uppercase tracking-widest shadow-md">
                PRO
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Herramientas de análisis visual avanzadas con Vertex AI Gemini 2.5 Flash
            </p>
          </div>
        </div>

        <div className="bg-accent/40 px-5 py-3 rounded-2xl border border-border/40 shrink-0">
          <div className="text-xs text-muted-foreground uppercase font-black tracking-widest">
            Suscripción Actual
          </div>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                userTier !== "FREE" ? "bg-amber-400 animate-pulse" : "bg-muted-foreground"
              }`}
            />
            <span className="text-sm font-bold uppercase tracking-wider">
              {userTier !== "FREE" ? `🏆 ${userTier}` : "🆓 PLAN GRATUITO"}
            </span>
          </div>
        </div>
      </div>

      {/* Free Trial Banner Notice */}
      {userTier === "FREE" && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-3xl p-5 flex items-start gap-4 shadow-sm">
          <Sparkles className="h-6 w-6 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-amber-300">
              ¡Tienes 1 prueba gratis de cada herramienta de visión!
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Disfruta de una prueba única sin costo para Form Analyzer y AR Court Preview. Para
              continuar usándolas de forma ilimitada, suscríbete a nuestros planes de SportMatch Pro
              en la sección correspondiente.
            </p>
          </div>
        </div>
      )}

      {/* Premium Tools Cards Grid */}
      <div className="grid md:grid-cols-2 gap-6 pt-2">
        {/* Card 1: Form Analyzer */}
        <div
          onClick={() => handleCardClick("form_analyzer", "/app/ai-vision/form-analyzer")}
          className="group block bg-gradient-card border border-border/50 rounded-3xl p-6 hover:border-amber-500/40 hover:shadow-glow transition-all duration-300 cursor-pointer relative"
        >
          <div className="absolute right-6 top-6 flex items-center gap-1.5">
            {userTier !== "FREE" ? (
              <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/20">
                ILIMITADO
              </span>
            ) : (
              <span className="text-[10px] px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 font-bold border border-amber-500/20 uppercase tracking-widest">
                Prueba: {trials.form_analyzer}/1 Usada
              </span>
            )}
          </div>

          <div className="flex items-start gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 grid place-items-center shrink-0 shadow-lg group-hover:scale-110 transition-transform">
              <Video className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0 pr-16 text-left">
              <div className="flex items-center gap-1.5">
                <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                  Form Analyzer
                </h3>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-black tracking-widest uppercase">
                  PRO
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                Analiza tu técnica deportiva mediante video. Sube un clip de hasta 30s de tu tiro,
                swing o zancada y obtén retroalimentación biométrica por IA con Gemini.
              </p>
              <div className="flex items-center gap-1 mt-4 text-xs font-bold text-primary group-hover:gap-2 transition-all">
                Abrir herramienta <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: AR Court Preview */}
        <div
          onClick={() => handleCardClick("ar_preview", "/app/map")}
          className="group block bg-gradient-card border border-border/50 rounded-3xl p-6 hover:border-amber-500/40 hover:shadow-glow transition-all duration-300 cursor-pointer relative"
        >
          <div className="absolute right-6 top-6 flex items-center gap-1.5">
            {userTier !== "FREE" ? (
              <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/20">
                ILIMITADO
              </span>
            ) : (
              <span className="text-[10px] px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 font-bold border border-amber-500/20 uppercase tracking-widest">
                Prueba: {trials.ar_preview}/1 Usada
              </span>
            )}
          </div>

          <div className="flex items-start gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 grid place-items-center shrink-0 shadow-lg group-hover:scale-110 transition-transform">
              <Box className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0 pr-16 text-left">
              <div className="flex items-center gap-1.5">
                <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                  AR Court Preview
                </h3>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-black tracking-widest uppercase">
                  PRO
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                Vista previa en realidad aumentada 3D de las canchas afiliadas. Ve al mapa,
                selecciona una cancha y pulsa el cubo para proyectar el terreno en 3D.
              </p>
              <div className="flex items-center gap-1 mt-4 text-xs font-bold text-primary group-hover:gap-2 transition-all">
                Abrir Mapa <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
