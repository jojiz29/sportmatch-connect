import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Video,
  Box,
  Crown,
  Check,
  X,
  ArrowRight,
  Sparkles,
  Layers,
  ChevronDown,
  IdCard,
  ScanEye,
  ShieldCheck,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/entities/user/useAuth";
import { usePaymentGatewayStore } from "@/features/wallet/usePaymentGatewayStore";
import { PaymentCheckout, PaymentSelection } from "@/components/PaymentCheckout";
import type { Stripe, StripeElements } from "@stripe/stripe-js";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/shared/api/supabase";
import { backendApi } from "@/shared/api/backendApi";

export const Route = createFileRoute("/app/ai-vision/")({
  component: AiVisionOverview,
});

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  period: string;
  badge?: string;
  oldPrice?: string;
  description: string;
  features: string[];
  limits: {
    formAnalyzer: string;
    arPreview: string;
    matchmaking: string;
    sportyChat: string;
  };
}

const PLANS: PricingPlan[] = [
  {
    id: "free",
    name: "Plan Gratuito",
    price: 0,
    period: "Siempre",
    description: "Para probar la plataforma con limitaciones estrictas",
    features: ["Límites extremadamente bajos", "Soporte básico", "Publicidad activa en la app"],
    limits: {
      formAnalyzer: "1 uso de prueba",
      arPreview: "1 uso de prueba",
      matchmaking: "5 Me Gusta al día",
      sportyChat: "3 interacciones gratis",
    },
  },
  {
    id: "bronce",
    name: "Plan Inicial",
    price: 5.99,
    oldPrice: "S/ 9.99",
    period: "Mensual",
    badge: "OFERTA",
    description: "Ideal para jugadores casuales que desean ventajas IA",
    features: ["Sin publicidad", "AR Court Preview ilimitado", "Acceso prioritario a canchas"],
    limits: {
      formAnalyzer: "5 análisis / mes",
      arPreview: "Ilimitado",
      matchmaking: "20 Me Gusta al día",
      sportyChat: "15 interacciones / día",
    },
  },
  {
    id: "plata",
    name: "Plan Plata",
    price: 19.99,
    period: "Semestral",
    badge: "MÁS POPULAR",
    description: "Perfecto para deportistas constantes y competitivos",
    features: [
      "Sin publicidad",
      "AR Court Preview ilimitado",
      "Insignia de Plata en perfil",
      "Análisis avanzado de técnica",
    ],
    limits: {
      formAnalyzer: "30 análisis / mes",
      arPreview: "Ilimitado",
      matchmaking: "50 Me Gusta al día",
      sportyChat: "50 interacciones / día",
    },
  },
  {
    id: "oro",
    name: "Plan Oro / Elite",
    price: 24.99,
    period: "Anual",
    badge: "ELITE",
    description: "Acceso total, definitivo y profesional de SportMatch",
    features: [
      "Sin publicidad",
      "AR Court Preview ilimitado",
      "Insignia Dorada VIP",
      "Prioridad máxima en matchmaking",
    ],
    limits: {
      formAnalyzer: "Ilimitado",
      arPreview: "Ilimitado",
      matchmaking: "Ilimitado",
      sportyChat: "Ilimitado",
    },
  },
];

function AiVisionOverview() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isDemoMode = useAuthStore((s) => s.isDemoMode);
  const login = useAuthStore((s) => s.login);

  const { isProcessing, processPayment } = usePaymentGatewayStore();

  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [toolsExpanded, setToolsExpanded] = useState(false);
  const [trials, setTrials] = useState({
    form_analyzer: 0,
    ar_preview: 0,
    sporty_chat: 0,
  });

  // Cargar trials del localStorage
  useEffect(() => {
    if (user) {
      const key = `sportmatch_trials_${user.id}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        setTrials(JSON.parse(saved));
      } else {
        const initial = { form_analyzer: 0, ar_preview: 0, sporty_chat: 0 };
        localStorage.setItem(key, JSON.stringify(initial));
        setTrials(initial);
      }
    }
  }, [user]);

  const handleCardClick = (toolKey: "form_analyzer" | "ar_preview", targetRoute: string) => {
    if (!user) return;

    const isPremium = user.tier === "PREMIUM";
    const usedCount = trials[toolKey] || 0;

    if (isPremium) {
      // Premium tiene acceso ilimitado
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
        // Excedió límite, abrir paywall
        toast.error("Límite de prueba gratuita excedido. Suscríbete para continuar.");
        setSelectedPlan(PLANS[2]); // Pre-seleccionar Plata por defecto
        setIsCheckoutOpen(true);
      }
    }
  };

  const handleSubscribeClick = (plan: PricingPlan) => {
    if (plan.id === "free") {
      toast.info("Ya te encuentras en el Plan Gratuito.");
      return;
    }
    setSelectedPlan(plan);
    setIsCheckoutOpen(true);
  };

  const handlePaymentConfirm = async (
    selection: PaymentSelection,
    stripe?: Stripe | null,
    elements?: StripeElements | null,
  ) => {
    if (!user || !selectedPlan) return;

    try {
      const amountToCharge = Math.max(
        0,
        selectedPlan.price - (selection.useFitcoins ? selection.fitcoinsToUse : 0),
      );

      const payload = {
        method: selection.method,
        amount: amountToCharge,
        useFitcoins: selection.useFitcoins,
        fitcoinsToUse: selection.fitcoinsToUse,
        cardHolderName: selection.cardHolderName,
      };

      const result = await processPayment(
        payload,
        `Suscripción SportMatch ${selectedPlan.name}`,
        stripe,
        elements,
      );

      if (!result.success) {
        toast.error(usePaymentGatewayStore.getState().error || "El pago no pudo ser completado.");
        return;
      }

      // Si usó fitcoins, actualizar balance local
      if (selection.useFitcoins && selection.fitcoinsToUse > 0) {
        const newBalance = Math.max(0, (user.fitcoins_balance || 0) - selection.fitcoinsToUse);
        if (!isDemoMode) {
          const { data: session } = await supabase.auth.getSession();
          const token = session?.session?.access_token;
          if (token) {
            await backendApi.wallet.createTransaction(token, {
              user_id: user.id,
              amount: -selection.fitcoinsToUse,
              description: `Suscripción ${selectedPlan.name} con FitCoins`,
              type: "SPEND",
            });
          }
        }
        login({ ...user, fitcoins_balance: newBalance });
      }

      // Upgrade a PREMIUM
      if (isDemoMode) {
        const upgraded = { ...user, tier: "PREMIUM" as const };
        login(upgraded);
        toast.success(`¡Suscripción ${selectedPlan.name} activada (Modo Demo)!`);
      } else {
        const { data: session } = await supabase.auth.getSession();
        const token = session?.session?.access_token;
        if (token) {
          const response = await backendApi.payments.mockUpgrade(token);
          if (response.error) {
            toast.error(response.error);
          } else {
            login({ ...user, tier: "PREMIUM" });
            toast.success(`¡Suscripción ${selectedPlan.name} activada con éxito!`);
          }
        }
      }

      setIsCheckoutOpen(false);
    } catch (err) {
      console.error("Subscription purchase error:", err);
      toast.error("Ocurrió un error al procesar tu suscripción.");
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
              Herramientas de inteligencia artificial visual con Vertex AI Gemini 2.5 Flash
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
                userTier === "PREMIUM" ? "bg-amber-400 animate-pulse" : "bg-muted-foreground"
              }`}
            />
            <span className="text-sm font-bold uppercase tracking-wider">
              {userTier === "PREMIUM" ? "🏆 PREMIUM" : "🆓 PLAN GRATUITO"}
            </span>
          </div>
        </div>
      </div>

      {/* Free Trial Banner Notice */}
      {userTier !== "PREMIUM" && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-3xl p-5 flex items-start gap-4 shadow-sm">
          <Sparkles className="h-6 w-6 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-amber-300">
              ¡Tienes 1 prueba gratis de cada herramienta premium!
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Disfruta de una prueba sin costo para Form Analyzer y AR Court Preview, y 3
              interacciones con nuestro chatbot inteligente Sporty. Luego de esto, podrás
              suscribirte a cualquiera de nuestros planes de bajo costo.
            </p>
          </div>
        </div>
      )}

      {/* Computer Vision Pro Module */}
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setToolsExpanded((value) => !value)}
          aria-expanded={toolsExpanded}
          className="group w-full rounded-3xl border border-border/50 bg-gradient-card p-6 text-left shadow-card transition-all duration-300 hover:border-amber-500/40 hover:shadow-glow active:scale-[0.99]"
        >
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-600 shadow-glow transition-transform duration-300 group-hover:scale-105">
                <ScanEye className="h-8 w-8 text-white" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-black uppercase tracking-wide text-foreground">
                    Modulo Computer Vision
                  </h2>
                  <span className="rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-black shadow-md">
                    PRO
                  </span>
                </div>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  Form Analyzer, Fake Profile Detector, verificacion DNI y AR Court Preview en un
                  solo modulo.
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center justify-between gap-3 rounded-xl border border-border/40 bg-background/40 px-4 py-3 text-sm font-bold text-foreground md:justify-center">
              <span>{toolsExpanded ? "Ocultar herramientas" : "Ver herramientas"}</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-300 ${
                  toolsExpanded ? "rotate-180 text-amber-400" : ""
                }`}
              />
            </div>
          </div>
        </button>

        <div
          className={`grid gap-4 transition-all duration-300 md:grid-cols-2 ${
            toolsExpanded
              ? "max-h-[980px] opacity-100"
              : "pointer-events-none max-h-0 overflow-hidden opacity-0"
          }`}
        >
          {/* Card 1: Form Analyzer */}
          <div
            onClick={() => handleCardClick("form_analyzer", "/app/ai-vision/form-analyzer")}
            className="group block bg-gradient-card border border-border/50 rounded-3xl p-6 hover:border-amber-500/40 hover:shadow-glow transition-all duration-300 cursor-pointer relative"
          >
            <div className="absolute right-6 top-6 flex items-center gap-1.5">
              {userTier === "PREMIUM" ? (
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
              <div className="flex-1 min-w-0 pr-16">
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
                  swing o zancada y obtén retroalimentación biométrica por IA.
                </p>
                <div className="flex items-center gap-1 mt-4 text-xs font-bold text-primary group-hover:gap-2 transition-all">
                  Abrir herramienta <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </div>
            </div>
          </div>

          <div
            onClick={() => navigate({ to: "/app/ai-vision/fake-profile" })}
            className="group block bg-gradient-card border border-border/50 rounded-3xl p-6 hover:border-amber-500/40 hover:shadow-glow transition-all duration-300 cursor-pointer relative"
          >
            <div className="absolute right-6 top-6 flex items-center gap-1.5">
              <span className="text-[10px] px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 font-bold border border-amber-500/20 uppercase tracking-widest">
                PRO
              </span>
            </div>

            <div className="flex items-start gap-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 grid place-items-center shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                <ShieldCheck className="h-7 w-7 text-white" />
              </div>
              <div className="flex-1 min-w-0 pr-16">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                    Veracidad de persona
                  </h3>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-black tracking-widest uppercase">
                    PRO
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  Evalua si una foto de perfil muestra una persona real y verificable.
                </p>
                <div className="flex items-center gap-1 mt-4 text-xs font-bold text-primary group-hover:gap-2 transition-all">
                  Abrir herramienta <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </div>
            </div>
          </div>

          <div
            onClick={() => navigate({ to: "/app/ai-vision/dni-verify" })}
            className="group block bg-gradient-card border border-border/50 rounded-3xl p-6 hover:border-amber-500/40 hover:shadow-glow transition-all duration-300 cursor-pointer relative"
          >
            <div className="absolute right-6 top-6 flex items-center gap-1.5">
              <span className="text-[10px] px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 font-bold border border-amber-500/20 uppercase tracking-widest">
                PRO
              </span>
            </div>

            <div className="flex items-start gap-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 grid place-items-center shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                <IdCard className="h-7 w-7 text-white" />
              </div>
              <div className="flex-1 min-w-0 pr-16">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                    Verificacion DNI 2.0
                  </h3>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-black tracking-widest uppercase">
                    PRO
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  Compara selfie y documento con matching biometrico asistido por IA.
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
              {userTier === "PREMIUM" ? (
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
              <div className="flex-1 min-w-0 pr-16">
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

      {/* Subscription Pricing Plans Section */}
      <div className="space-y-6 pt-6 border-t border-border/40">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="text-2xl font-black uppercase tracking-wider text-gradient">
            Planes de Suscripción SportMatch
          </h2>
          <p className="text-xs text-muted-foreground">
            Elige el plan ideal para tu ritmo deportivo. Desbloquea límites, accede a herramientas
            premium de IA y obtén insignias exclusivas en tu perfil.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {PLANS.map((plan) => {
            const isCurrent =
              (plan.id === "free" && userTier !== "PREMIUM") ||
              (plan.id !== "free" && userTier === "PREMIUM");

            return (
              <div
                key={plan.id}
                className={`rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden transition-all duration-300 border bg-gradient-card ${
                  plan.badge
                    ? "border-amber-500/50 shadow-glow scale-[1.02]"
                    : "border-border/50 hover:border-border"
                }`}
              >
                {plan.badge && (
                  <div className="absolute right-0 top-0 bg-gradient-to-r from-amber-500 to-yellow-500 text-black text-[9px] font-black uppercase py-1 px-4 rounded-bl-2xl tracking-widest shadow-md">
                    {plan.badge}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <h3 className="text-base font-black uppercase text-foreground">{plan.name}</h3>
                    <p className="text-[11px] text-muted-foreground mt-1 leading-snug min-h-[2.5rem]">
                      {plan.description}
                    </p>
                  </div>

                  <div className="py-2 flex items-baseline gap-1">
                    <span className="text-2xl font-black text-foreground">S/ {plan.price}</span>
                    <span className="text-xs text-muted-foreground">/ {plan.period}</span>
                    {plan.oldPrice && (
                      <span className="text-xs text-muted-foreground line-through ml-2">
                        {plan.oldPrice}
                      </span>
                    )}
                  </div>

                  {/* Limits List (Freemium Focus) */}
                  <div className="p-3.5 rounded-2xl bg-muted/60 border border-border/40 space-y-2">
                    <div className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                      Límites de Uso:
                    </div>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Form Analyzer:</span>
                        <span className="font-bold text-foreground">
                          {plan.limits.formAnalyzer}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">AR Preview:</span>
                        <span className="font-bold text-foreground">{plan.limits.arPreview}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Matchmaking:</span>
                        <span className="font-bold text-foreground">{plan.limits.matchmaking}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Sporty Chat:</span>
                        <span className="font-bold text-foreground">{plan.limits.sportyChat}</span>
                      </div>
                    </div>
                  </div>

                  {/* Key Features */}
                  <div className="space-y-2 pt-2">
                    <div className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                      Qué incluye:
                    </div>
                    <ul className="space-y-1.5">
                      {plan.features.map((feat, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs">
                          <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span className="text-muted-foreground">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isCurrent}
                  onClick={() => handleSubscribeClick(plan)}
                  className={`mt-6 w-full py-2.5 rounded-xl font-bold text-xs transition-all tracking-wider cursor-pointer ${
                    isCurrent
                      ? "bg-muted text-muted-foreground border-border border cursor-not-allowed"
                      : plan.badge
                        ? "bg-gradient-to-r from-amber-500 to-yellow-500 hover:scale-[1.02] text-black shadow-md font-black"
                        : "bg-primary text-primary-foreground hover:bg-primary/95"
                  }`}
                >
                  {isCurrent ? "Plan Actual" : "Suscribirme al Plan"}
                </button>
              </div>
            );
          })}
        </div>

        {/* Freemium vs Premium Complete Comparison Table */}
        <div className="bg-gradient-card border border-border/50 rounded-3xl p-6 space-y-4 shadow-card">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-amber-400" />
            <h3 className="font-black text-sm uppercase tracking-wider text-foreground">
              Comparativa Completa de Beneficios
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border/40 text-muted-foreground uppercase font-bold tracking-widest text-[10px]">
                  <th className="py-3 px-4">Característica</th>
                  <th className="py-3 px-4">Gratuito</th>
                  <th className="py-3 px-4 text-amber-400">Bronce (S/ 5.99)</th>
                  <th className="py-3 px-4">Plata (S/ 19.99)</th>
                  <th className="py-3 px-4">Oro / Elite (S/ 24.99)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20 text-muted-foreground">
                <tr>
                  <td className="py-3 px-4 font-bold text-foreground">Form Analyzer (IA)</td>
                  <td className="py-3 px-4">1 uso único de prueba</td>
                  <td className="py-3 px-4 text-foreground font-semibold">5 análisis / mes</td>
                  <td className="py-3 px-4">30 análisis / mes</td>
                  <td className="py-3 px-4 font-bold text-emerald-400">Ilimitado</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-foreground">AR Court Preview (3D)</td>
                  <td className="py-3 px-4">1 uso único de prueba</td>
                  <td className="py-3 px-4">Acceso Completo</td>
                  <td className="py-3 px-4">Acceso Completo</td>
                  <td className="py-3 px-4 font-bold text-emerald-400">Ilimitado</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-foreground">
                    Me Gusta Matchmaking (Likes)
                  </td>
                  <td className="py-3 px-4 text-rose-400 font-semibold">5 Me Gusta al día</td>
                  <td className="py-3 px-4">20 Me Gusta al día</td>
                  <td className="py-3 px-4">50 Me Gusta al día</td>
                  <td className="py-3 px-4 font-bold text-emerald-400">Ilimitado</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-foreground">
                    Interacciones Sporty Coach
                  </td>
                  <td className="py-3 px-4 text-rose-400">3 interacciones totales</td>
                  <td className="py-3 px-4">15 interacciones / día</td>
                  <td className="py-3 px-4">50 interacciones / día</td>
                  <td className="py-3 px-4 font-bold text-emerald-400">Ilimitado</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-foreground">
                    Publicidad en la Aplicación
                  </td>
                  <td className="py-3 px-4 text-rose-400">Publicidades Activas</td>
                  <td className="py-3 px-4">Sin Publicidad</td>
                  <td className="py-3 px-4">Sin Publicidad</td>
                  <td className="py-3 px-4 font-semibold text-emerald-400 font-bold">
                    Sin Publicidad
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-foreground">
                    Insignia Especial en Perfil
                  </td>
                  <td className="py-3 px-4">
                    <X className="h-4 w-4 text-muted-foreground/40" />
                  </td>
                  <td className="py-3 px-4">
                    <X className="h-4 w-4 text-muted-foreground/40" />
                  </td>
                  <td className="py-3 px-4 text-foreground font-semibold">Insignia de Plata</td>
                  <td className="py-3 px-4 text-amber-400 font-bold">Insignia VIP Oro</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Stripe Payment Checkout Dialog */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="max-w-md bg-background/95 border-border shadow-2xl rounded-3xl p-6 text-foreground overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-lg font-black uppercase text-white tracking-wide">
              Adquirir Suscripción Premium
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-normal">
              Estás por suscribirte al{" "}
              <span className="font-bold text-amber-400">{selectedPlan?.name}</span> por{" "}
              <span className="font-bold text-white">
                S/ {selectedPlan?.price.toFixed(2)} {selectedPlan?.period}
              </span>
              .
            </DialogDescription>
          </DialogHeader>

          {selectedPlan && (
            <div className="py-4">
              <PaymentCheckout
                cost={selectedPlan.price}
                userBalance={user?.fitcoins_balance || 0}
                onConfirm={handlePaymentConfirm}
                isProcessing={isProcessing}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
