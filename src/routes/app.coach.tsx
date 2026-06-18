/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { useAuthStore } from "@/entities/user/useAuth";
import {
  Sparkles,
  Send,
  Activity,
  Award,
  Apple,
  MessageSquare,
  History,
  Crown,
  Layers,
  Check,
  X,
} from "lucide-react";
import { backendApi } from "@/shared/api/backendApi";
import { supabase } from "@/shared/api/supabase";
import { toast } from "sonner";
import { withTimeout } from "@/shared/api/timeoutHelper";
import { aiSecurityService } from "@/features/ai-security/services/aiSecurityService";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { PaymentCheckout, PaymentSelection } from "@/components/PaymentCheckout";
import { usePaymentGatewayStore } from "@/features/wallet/usePaymentGatewayStore";
import type { Stripe, StripeElements } from "@stripe/stripe-js";
import { apiClient } from "@/shared/api/apiClient";

export const Route = createFileRoute("/app/coach")({
  head: () => ({ meta: [{ title: "Coach IA Premium — SportMatch" }] }),
  component: CoachPage,
});

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: string;
}

interface NutritionLog {
  id: string;
  sport: string;
  duration: number;
  intensity: string;
  calories_burned: number;
  snack_name: string;
  calories: number;
  ingredients: string[];
  reasoning: string;
  created_at: string;
}

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

function CoachPage() {
  const user = useAuthStore((s) => s.user);
  const isDemoMode = useAuthStore((s) => s.isDemoMode);
  const login = useAuthStore((s) => s.login);

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "nutrition">("chat");
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const { processPayment } = usePaymentGatewayStore();

  // === ANALYTICS FUNNEL LOGGER ===
  const logFunnelEvent = (
    stepName: "premium_cta_clicked" | "checkout_initiated" | "payment_completed",
  ) => {
    try {
      const stored = localStorage.getItem("sportmatch_conversion_analytics");
      const data = stored
        ? JSON.parse(stored)
        : { premium_cta_clicked: 0, checkout_initiated: 0, payment_completed: 0 };
      data[stepName] = (data[stepName] || 0) + 1;
      localStorage.setItem("sportmatch_conversion_analytics", JSON.stringify(data));
    } catch (err) {
      console.error("Failed to log funnel event:", err);
    }
  };

  // === CHECKOUT SUBSCRIPTION FLOW ===
  const handleSubscribe = async (plan: any) => {
    setSelectedPlan(plan);
    logFunnelEvent("premium_cta_clicked");
    logFunnelEvent("checkout_initiated");
    setPaymentDialogOpen(true);
  };

  const handlePaymentConfirm = async (
    selection: PaymentSelection,
    stripe?: Stripe | null,
    elements?: StripeElements | null,
  ) => {
    if (!user || !selectedPlan) return;
    setLoading(true);
    try {
      const planPrice = selectedPlan.price;
      const netAmount = Math.max(
        0,
        planPrice - (selection.useFitcoins ? selection.fitcoinsToUse : 0),
      );
      const paymentPayload = {
        method: selection.method,
        amount: netAmount,
        useFitcoins: selection.useFitcoins,
        fitcoinsToUse: selection.fitcoinsToUse,
        cardHolderName: selection.cardHolderName,
      };

      const result = await processPayment(
        paymentPayload,
        `Suscripción SportMatch ${selectedPlan.name}`,
        stripe,
        elements,
      );

      if (!result.success) {
        toast.error(usePaymentGatewayStore.getState().error || "El pago no pudo ser completado.");
        return;
      }

      // Descontar FitCoins si se usaron
      if (selection.useFitcoins && selection.fitcoinsToUse > 0) {
        const newBalance = (user.fitcoins_balance || 0) - selection.fitcoinsToUse;
        if (!isDemoMode) {
          const { data: sessionData } = await supabase.auth.getSession();
          const token = sessionData?.session?.access_token;
          if (token) {
            await backendApi.wallet.createTransaction(token, {
              user_id: user.id,
              amount: -selection.fitcoinsToUse,
              description: `Suscripción ${selectedPlan.name} con FitCoins`,
              type: "SPEND",
            });
          }
        } else {
          apiClient.wallet.updateBalance(user.id, newBalance);
          apiClient.wallet.saveTransaction(user.id, {
            id: `tx-premium-${Date.now()}`,
            user_id: user.id,
            amount: -selection.fitcoinsToUse,
            description: `Suscripción ${selectedPlan.name} con FitCoins (Demo)`,
            type: "SPEND",
            created_at: new Date().toISOString(),
          });
        }
        login({ ...user, fitcoins_balance: newBalance });
      }

      // Guardar plan contratado de forma local
      localStorage.setItem(`sportmatch_subscription_plan_${user.id}`, selectedPlan.id);

      // Activar PREMIUM
      if (isDemoMode) {
        const upgradedUser = { ...useAuthStore.getState().user!, tier: "PREMIUM" as const };
        login(upgradedUser);

        try {
          const storedUsers = localStorage.getItem("sportmatch_demo_users");
          if (storedUsers) {
            const users = JSON.parse(storedUsers);
            const updatedUsers = users.map((u: any) =>
              u.id === user.id ? { ...u, tier: "PREMIUM" } : u,
            );
            localStorage.setItem("sportmatch_demo_users", JSON.stringify(updatedUsers));
          }
        } catch (e) {
          console.error(e);
        }

        logFunnelEvent("payment_completed");
        toast.success(`¡Suscripción ${selectedPlan.name} activada exitosamente (Modo Demo)!`);
        setPaymentDialogOpen(false);
      } else {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;
        if (!token) {
          toast.error("Por favor inicia sesión de nuevo.");
          return;
        }

        const response = await backendApi.payments.mockUpgrade(token);
        if (response.error) {
          toast.error(response.error);
        } else {
          logFunnelEvent("payment_completed");
          const upgradedUser = { ...useAuthStore.getState().user!, tier: "PREMIUM" as const };
          login(upgradedUser);
          toast.success(`¡Suscripción ${selectedPlan.name} activada exitosamente!`);
          setPaymentDialogOpen(false);
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Error al procesar la suscripción");
    } finally {
      setLoading(false);
    }
  };

  // Check query params for payments redirection success/cancel
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment_success") === "true" || params.get("mock_payment_success") === "true") {
      logFunnelEvent("payment_completed");
      if (user && user.tier !== "PREMIUM") {
        login({ ...user, tier: "PREMIUM" });
      }
      toast.success("¡Suscripción Premium activada! Disfruta de tus ventajas.");
      // Clean query params
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (params.get("payment_canceled") === "true") {
      toast.error("El pago fue cancelado.");
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // If Free user, render locking screen
  if (!user || user.tier !== "PREMIUM") {
    const userTier = user?.tier || "FREE";
    return (
      <div className="flex-1 p-4 lg:p-8 flex flex-col items-center justify-start space-y-12 relative min-h-[85vh] overflow-y-auto max-w-7xl mx-auto w-full">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-neon/10 rounded-full blur-3xl -z-10" />

        {/* Header Title */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="flex items-center justify-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 grid place-items-center shadow-glow shrink-0 animate-pulse">
              <Crown className="h-5.5 w-5.5 text-white" />
            </div>
            <h1 className="text-3xl font-black uppercase tracking-wider text-gradient">
              Desbloquea SportMatch Pro
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-black uppercase tracking-widest shadow-md">
              PRO
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Elige el plan ideal para tu ritmo deportivo. Desbloquea límites, accede a herramientas
            premium de IA, entrena con el Coach Sporty e interactúa con un matchmaking premium.
          </p>
        </div>

        {/* Premium Benefits Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
          <div className="p-5 rounded-2xl bg-background/40 border border-border/40 flex flex-col space-y-3 hover:border-primary/30 transition-all card-lift">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Sparkles className="h-5.5 w-5.5" />
            </div>
            <h3 className="font-bold text-sm text-foreground">Coach IA 1-a-1</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Asesoría de entrenamiento continua e interactiva con telemetría integrada de tus
              partidos en tiempo real.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-background/40 border border-border/40 flex flex-col space-y-3 hover:border-neon/30 transition-all card-lift">
            <div className="h-10 w-10 rounded-xl bg-neon/10 flex items-center justify-center text-neon">
              <Apple className="h-5.5 w-5.5" />
            </div>
            <h3 className="font-bold text-sm text-foreground">Snacks Recomendados</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Recomendaciones de nutrición inteligente post-partido adaptadas a tu nivel, calorías
              quemadas y esfuerzo.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-background/40 border border-border/40 flex flex-col space-y-3 hover:border-purple-500/30 transition-all card-lift">
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
              <Award className="h-5.5 w-5.5" />
            </div>
            <h3 className="font-bold text-sm text-foreground">Retos de Squads</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Reta a squads rivales apostando tus FitCoins con un sistema oficial de arbitraje,
              votación y canje.
            </p>
          </div>
        </div>

        {/* Pricing Plans Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full pt-4">
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
                    <p className="text-[11px] text-muted-foreground mt-1 leading-snug min-h-[2.5rem] text-left">
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

                  {/* Limits List */}
                  <div className="p-3.5 rounded-2xl bg-muted/60 border border-border/40 space-y-2">
                    <div className="text-[10px] font-black uppercase tracking-wider text-muted-foreground text-left">
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
                    <div className="text-[10px] font-black uppercase tracking-wider text-muted-foreground text-left">
                      Qué incluye:
                    </div>
                    <ul className="space-y-1.5 text-left">
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
                  onClick={() => handleSubscribe(plan)}
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
        <div className="bg-gradient-card border border-border/50 rounded-3xl p-6 space-y-4 shadow-card w-full">
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

        {/* Dialog de pago inline */}
        <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
          <DialogContent className="max-w-md bg-background/95 border-border shadow-2xl rounded-3xl p-6 text-foreground overflow-y-auto max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="text-lg font-black uppercase text-white tracking-wide">
                Adquirir Suscripción Pro
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
                  isProcessing={loading}
                />
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 flex flex-col lg:flex-row gap-6 max-w-6xl mx-auto w-full min-h-[85vh]">
      {/* Sidebar - Features & Nutrition */}
      <div className="w-full lg:w-80 flex flex-col gap-6 shrink-0">
        {/* Tier Info Card */}
        <div className="glass p-5 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 to-transparent flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-primary flex items-center justify-center text-white shadow-glow">
              <Award className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <div className="text-xs font-semibold text-primary uppercase tracking-wider">
                Plan Activo
              </div>
              <div className="text-base font-bold text-foreground">SportMatch Premium ★</div>
            </div>
          </div>
          <button
            onClick={async () => {
              if (isDemoMode) {
                // Mock Downgrade
                const downgraded = { ...user, tier: "FREE" as const };
                login(downgraded);
                toast.success("Cuenta restablecida a FREE (Modo Demo).");
                return;
              }
              try {
                const { data: sessionData } = await supabase.auth.getSession();
                const token = sessionData?.session?.access_token;
                if (token) {
                  const res = await backendApi.payments.portal(token, window.location.href);
                  if (res.data?.url) {
                    window.location.href = res.data.url;
                  }
                }
              } catch (e: any) {
                toast.error("Error al redirigir al portal: " + e.message);
              }
            }}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-border bg-background/50 hover:bg-muted text-foreground cursor-pointer transition-all"
          >
            Gestionar
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="glass p-2 rounded-2xl border border-border/40 grid grid-cols-2 gap-1">
          <button
            onClick={() => setActiveTab("chat")}
            className={`py-2 px-3 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "chat"
                ? "bg-gradient-primary text-white shadow-glow"
                : "text-muted-foreground hover:text-foreground hover:bg-white/5"
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            <span>Chat Coach</span>
          </button>
          <button
            onClick={() => setActiveTab("nutrition")}
            className={`py-2 px-3 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "nutrition"
                ? "bg-gradient-primary text-white shadow-glow"
                : "text-muted-foreground hover:text-foreground hover:bg-white/5"
            }`}
          >
            <Apple className="h-4 w-4" />
            <span>Nutrición</span>
          </button>
        </div>

        {/* Feature Sub-panels */}
        <div className="flex-1">
          {activeTab === "chat" ? <CoachInfoPanel /> : <NutritionRecommenderPanel />}
        </div>
      </div>

      {/* Main Panel */}
      <div className="flex-1 glass rounded-3xl border border-border/40 shadow-2xl flex flex-col overflow-hidden min-h-[60vh]">
        {activeTab === "chat" ? <CoachChatTab /> : <NutritionLogsTab />}
      </div>
    </div>
  );
}

// ==============================================================
// SUBCOMPONENTE: Panel lateral de Info del Coach
// ==============================================================
function CoachInfoPanel() {
  return (
    <div className="glass p-5 rounded-2xl border border-border/40 space-y-4">
      <h3 className="font-heading text-sm text-foreground flex items-center gap-2 border-b border-border/10 pb-3">
        <Activity className="h-4 w-4 text-primary animate-pulse" />
        <span>Telemetría & Perfil</span>
      </h3>
      <p className="text-xs text-muted-foreground leading-relaxed">
        El Coach Sporty analiza tu historial deportivo de los partidos jugados en la plataforma y
        tus respuestas previas para sugerir rutinas, corregir técnica e incentivar tus rachas.
      </p>

      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-neon/10 flex items-center justify-center text-neon text-xs font-bold">
            20
          </div>
          <div className="text-xs text-foreground font-semibold">Mensajes diarios permitidos</div>
        </div>

        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
            Gem
          </div>
          <div className="text-xs text-foreground font-semibold">
            Modelo: Google Gemini 2.0 Flash
          </div>
        </div>
      </div>
    </div>
  );
}

// ==============================================================
// SUBCOMPONENTE: Chat Principal del Coach
// ==============================================================
function CoachChatTab() {
  const isDemoMode = useAuthStore((s) => s.isDemoMode);
  const user = useAuthStore((s) => s.user);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatCount, setChatCount] = useState(0);
  const [chatLimit, setChatLimit] = useState(3);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      const isPremium = user.tier === "PREMIUM";
      const plan = localStorage.getItem(`sportmatch_subscription_plan_${user.id}`) || "free";

      let limit = 3;
      if (isPremium) {
        if (plan === "bronce") limit = 15;
        else if (plan === "plata") limit = 50;
        else limit = 9999;
      }
      setChatLimit(limit);

      const todayStr = new Date().toISOString().split("T")[0];
      const chatKey = `sportmatch_chat_usage_${user.id}`;
      const chatSaved = localStorage.getItem(chatKey);
      const chatData = chatSaved ? JSON.parse(chatSaved) : { date: todayStr, count: 0 };
      if (chatData.date === todayStr) {
        setChatCount(chatData.count);
      } else {
        setChatCount(0);
      }
    }
  }, [user]);

  // Load welcome message on start
  useEffect(() => {
    // Check if we already have a chat in local/session storage for demo continuity
    const stored = sessionStorage.getItem("sportmatch_premium_coach_chat");
    if (stored) {
      setMessages(JSON.parse(stored));
      return;
    }

    const loadWelcome = async () => {
      setLoading(true);
      if (isDemoMode) {
        setTimeout(() => {
          setMessages([
            {
              id: "welcome",
              role: "assistant",
              text: "¡Hola campeón! Soy tu Coach Sporty. Analizando tu perfil, veo que te gusta entrenar con pasión. Estoy listo para ayudarte a planificar tu rutina, mejorar tu rendimiento o aconsejarte sobre tu técnica. ¿En qué nos enfocaremos hoy?",
              timestamp: new Date().toLocaleTimeString(),
            },
          ]);
          setLoading(false);
        }, 800);
        return;
      }

      try {
        let token: string | undefined;
        try {
          const sessionResult = await withTimeout(supabase.auth.getSession(), 2000);
          token = sessionResult?.data?.session?.access_token;
        } catch (sessionErr) {
          console.warn("Could not retrieve Supabase session for Coach welcome:", sessionErr);
        }

        if (token) {
          const res = await withTimeout(
            backendApi.ai.coachChat(token, { message: "Hola, preséntate" }),
            8000,
          );
          if (res.error) {
            throw new Error(res.error);
          } else if (res.data?.reply) {
            setMessages([
              {
                id: "welcome",
                role: "assistant",
                text: res.data.reply,
                timestamp: new Date().toLocaleTimeString(),
              },
            ]);
            setLoading(false);
            return;
          }
        }
      } catch (err: any) {
        console.warn("Failed to fetch welcome from backend, falling back to local welcome:", err);
      }

      setMessages([
        {
          id: "welcome",
          role: "assistant",
          text: "¡Hola campeón! Soy tu Coach Sporty. Analizando tu perfil, veo que te gusta entrenar con pasión. Estoy listo para ayudarte a planificar tu rutina, mejorar tu rendimiento o aconsejarte sobre tu técnica. ¿En qué nos enfocaremos hoy?",
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
      setLoading(false);
    };

    loadWelcome();
  }, [isDemoMode]);

  // Persist session messages
  useEffect(() => {
    if (messages.length > 0) {
      sessionStorage.setItem("sportmatch_premium_coach_chat", JSON.stringify(messages));
    }
    // Scroll to bottom
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (textToSend?: string) => {
    const messageText = textToSend || input;
    if (!messageText.trim()) return;

    // Verificar límites de interacciones con el Chatbot (Freemium)
    const isPremium = user?.tier === "PREMIUM";
    const plan = localStorage.getItem(`sportmatch_subscription_plan_${user?.id}`) || "free";

    let limit = 3;
    if (isPremium) {
      if (plan === "bronce") limit = 15;
      else if (plan === "plata") limit = 50;
      else limit = 9999;
    }

    const todayStr = new Date().toISOString().split("T")[0];
    const chatKey = `sportmatch_chat_usage_${user?.id}`;
    const chatSaved = localStorage.getItem(chatKey);
    let chatData = chatSaved ? JSON.parse(chatSaved) : { date: todayStr, count: 0 };

    if (chatData.date !== todayStr) {
      chatData = { date: todayStr, count: 0 };
    }

    if (limit < 9999) {
      if (plan === "free" && chatData.count >= limit) {
        toast.error(
          "Has alcanzado tu límite de prueba de 3 interacciones gratuitas con el Coach Sporty. Suscríbete para continuar conversando.",
          { duration: 5000 },
        );
        return;
      } else if (chatData.count >= limit) {
        toast.error(
          `Has alcanzado tu límite diario de ${limit} mensajes en tu plan. ¡Suscríbete a un plan superior para continuar!`,
          { duration: 5000 },
        );
        return;
      }
    }

    // Incrementar contador y guardar
    chatData.count += 1;
    localStorage.setItem(chatKey, JSON.stringify(chatData));
    setChatCount(chatData.count);

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: messageText,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    // SEC-01: Moderar el mensaje antes de enviarlo
    try {
      const securityResult = await aiSecurityService.evaluateSecurity(messageText, "mensaje");
      if (securityResult.action_recommended === "block") {
        toast.error("Mensaje bloqueado: Contenido inapropiado detectado.");
        setMessages((prev) => [
          ...prev,
          {
            id: `system-${Date.now()}`,
            role: "assistant",
            text: "⚠️ [Mensaje bloqueado por el sistema de seguridad IA por contener palabras ofensivas o comportamiento inadecuado].",
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
        setLoading(false);
        return;
      }
    } catch (secErr) {
      console.warn("Security check failed:", secErr);
    }

    if (isDemoMode) {
      // Simulate reply from Coach
      setTimeout(() => {
        const replyText = getMockCoachReply(messageText);
        setMessages((prev) => [
          ...prev,
          {
            id: `coach-${Date.now()}`,
            role: "assistant",
            text: replyText,
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
        setLoading(false);
      }, 1000);
      return;
    }

    let token: string | undefined;
    try {
      const sessionResult = await withTimeout(supabase.auth.getSession(), 2000);
      token = sessionResult?.data?.session?.access_token;
    } catch (sessionErr) {
      console.warn("Could not retrieve Supabase session for sending message:", sessionErr);
    }

    if (token) {
      try {
        // Map chat messages format for Vertex AI history
        const history = messages.map((m) => ({
          role: m.role,
          text: m.text,
        }));

        const res = await withTimeout(
          backendApi.ai.coachChat(token, {
            message: messageText,
            history: history,
          }),
          12000,
        );

        if (res.error) {
          throw new Error(res.error);
        } else if (res.data) {
          const replyText = res.data.reply;
          setMessages((prev) => [
            ...prev,
            {
              id: `coach-${Date.now()}`,
              role: "assistant",
              text: replyText,
              timestamp: new Date().toLocaleTimeString(),
            },
          ]);
        }
        setLoading(false);
        return;
      } catch (backendErr: any) {
        console.warn("Coach IA backend error, falling back to mock reply:", backendErr);
      }
    }

    // FALLBACK: Simular respuesta local si el backend falló o no se pudo obtener el token
    setTimeout(() => {
      const replyText = getMockCoachReply(messageText);
      setMessages((prev) => [
        ...prev,
        {
          id: `coach-${Date.now()}`,
          role: "assistant",
          text: replyText,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
      setLoading(false);
      toast.info("Coach IA respondiendo en modo sin conexión.");
    }, 1000);
  };

  const suggestions = [
    "¿Cómo puedo mejorar mi resistencia cardiovascular?",
    "Planifica mi calentamiento para jugar tenis",
    "¿Qué estiramientos debo hacer después del fútbol?",
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header bar */}
      <div className="px-5 py-4 border-b border-border/30 flex items-center justify-between bg-background/40">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
            <Sparkles className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-foreground">Coach Sporty IA</h4>
            <div className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Activo en tiempo real
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs text-muted-foreground">Mensajes Hoy</div>
          <div className="text-sm font-bold text-primary">
            {chatLimit >= 9999 ? "Ilimitados" : `${chatCount}/${chatLimit}`}
          </div>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] p-4 rounded-2xl leading-relaxed text-sm ${
                m.role === "user"
                  ? "bg-gradient-primary text-white rounded-br-none shadow-md"
                  : "bg-background/80 border border-border/40 text-foreground rounded-bl-none shadow-sm"
              }`}
            >
              <p>{m.text}</p>
              <span className="block text-[9px] text-muted-foreground/60 text-right mt-1.5 font-medium">
                {m.timestamp}
              </span>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-background/80 border border-border/40 text-foreground p-4 rounded-2xl rounded-bl-none flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
              <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
              <span className="h-2 w-2 rounded-full bg-primary animate-bounce" />
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Suggestions List */}
      {messages.length < 3 && (
        <div className="px-5 py-2 overflow-x-auto flex gap-2 no-scrollbar bg-background/20">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => handleSend(s)}
              className="text-xs px-3 py-2 rounded-xl bg-background border border-border/40 hover:border-primary/40 text-muted-foreground hover:text-foreground cursor-pointer transition-all whitespace-nowrap"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="p-4 border-t border-border/30 bg-background/40">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-3"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Chatea con tu entrenador Premium..."
            className="flex-1 px-4 py-3 bg-background border border-border/40 rounded-2xl text-sm focus:outline-none focus:border-primary/60 text-foreground"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="p-3 bg-gradient-primary text-white rounded-2xl shadow-glow hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
}

// Helper mock reply builder
function getMockCoachReply(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("resistencia") || lower.includes("cardio")) {
    return "Para mejorar tu resistencia cardiovascular, te recomiendo sesiones de HIIT 2 veces por semana (ej. 30 segundos a máxima velocidad y 30 de descanso, por 15 minutos), combinadas con carreras continuas en zona aeróbica baja. ¡Eso construirá una base pulmonar sólida!";
  }
  if (lower.includes("calentamiento") || lower.includes("tenis") || lower.includes("padel")) {
    return "Un buen calentamiento para tenis o pádel requiere movilidad articular de hombros y cadera, saltos ligeros para activar gemelos y 3 a 5 minutos de trote lateral con arranques cortos. Eso prepara tus tendones para frenados bruscos.";
  }
  if (lower.includes("rutina") || lower.includes("entrenar")) {
    return "Te sugiero comenzar con una rutina dividida fullbody. Concéntrate en ejercicios compuestos: sentadillas para piernas potentes, lagartijas o press de banca para empuje, y dominadas o remo para tracción. Compleméntalo con 3 series de plancha abdominal.";
  }
  return "Excelente pregunta deportiva. Desde mi punto de vista, la clave está en la consistencia. Si logras estructurar tus entrenamientos para descansar adecuadamente e hidratarte bien durante el juego, verás mejoras sustanciales en tu ritmo cardíaco y aguante. ¡Sigue presionando tus límites!";
}

// ==============================================================
// SUBCOMPONENTE: Panel lateral de Nutricion Recommender
// ==============================================================
function NutritionRecommenderPanel() {
  const isDemoMode = useAuthStore((s) => s.isDemoMode);
  const [sport, setSport] = useState("Tenis");
  const [duration, setDuration] = useState(60);
  const [intensity, setIntensity] = useState("media");
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<any>(null);

  const handleRecommend = async () => {
    setLoading(true);
    setRecommendation(null);

    if (isDemoMode) {
      setTimeout(() => {
        setRecommendation({
          snack_name: "Yogurt Griego con Almendras y Plátano",
          calories: 280,
          ingredients: [
            "150g de Yogurt griego natural",
            "1 Plátano mediano picado",
            "10 Almendras tostadas",
            "1 cucharadita de Miel de abejas",
          ],
          reasoning: `Después de entrenar ${sport} durante ${duration} minutos con intensidad ${intensity}, requieres una porción de proteína magra de absorción rápida para reparar fibras musculares dañadas y carbohidratos simples cargados de potasio para reponer las reservas de energía.`,
          calories_burned: Math.round(
            duration * (intensity === "alta" ? 10 : intensity === "media" ? 7 : 4),
          ),
          snack_image:
            "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=500&auto=format&fit=crop",
        });
        setLoading(false);
        toast.success("¡Recomendación nutricional simulada!");
      }, 1200);
      return;
    }

    let token: string | undefined;
    try {
      const sessionResult = await withTimeout(supabase.auth.getSession(), 2000);
      token = sessionResult?.data?.session?.access_token;
    } catch (sessionErr) {
      console.warn("Could not retrieve Supabase session for snack recommendation:", sessionErr);
    }

    if (token) {
      try {
        const res = await withTimeout(
          backendApi.ai.recommendSnack(token, {
            sport,
            duration,
            intensity,
          }),
          8000,
        );

        if (res.error) {
          throw new Error(res.error);
        } else if (res.data) {
          setRecommendation(res.data);
          toast.success("¡Nutricionista IA generó tu snack ideal!");
          setLoading(false);
          return;
        }
      } catch (err: any) {
        console.warn(
          "RecommendSnack backend failed, falling back to simulated recommendation:",
          err,
        );
      }
    }

    // FALLBACK: Simular recomendación local si el backend falló o no hay sesión
    setTimeout(() => {
      setRecommendation({
        snack_name: "Yogurt Griego con Almendras y Plátano",
        calories: 280,
        ingredients: [
          "150g de Yogurt griego natural",
          "1 Plátano mediano picado",
          "10 Almendras tostadas",
          "1 cucharadita de Miel de abejas",
        ],
        reasoning: `Después de entrenar ${sport} durante ${duration} minutos con intensidad ${intensity}, requieres una porción de proteína magra de absorción rápida para reparar fibras musculares dañadas y carbohidratos simples cargados de potasio para reponer las reservas de energía.`,
        calories_burned: Math.round(
          duration * (intensity === "alta" ? 10 : intensity === "media" ? 7 : 4),
        ),
        snack_image:
          "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=500&auto=format&fit=crop",
      });
      setLoading(false);
      toast.info("Recomendación deportiva en modo sin conexión.");
    }, 1000);
  };

  return (
    <div className="glass p-5 rounded-2xl border border-border/40 space-y-4">
      <h3 className="font-heading text-sm text-foreground flex items-center gap-2 border-b border-border/10 pb-3">
        <Apple className="h-4 w-4 text-neon" />
        <span>Snack Recomendado</span>
      </h3>

      <div className="space-y-3">
        <div>
          <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
            Deporte
          </label>
          <select
            value={sport}
            onChange={(e) => setSport(e.target.value)}
            className="w-full bg-background border border-border/40 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none"
          >
            <option>Tenis</option>
            <option>Pádel</option>
            <option>Fútbol</option>
            <option>Básquet</option>
            <option>Running</option>
            <option>Natación</option>
            <option>Gimnasio</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
            Duración (minutos)
          </label>
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(Math.max(1, parseInt(e.target.value) || 0))}
            className="w-full bg-background border border-border/40 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none"
          />
        </div>

        <div>
          <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
            Intensidad
          </label>
          <div className="grid grid-cols-3 gap-1">
            {["baja", "media", "alta"].map((int) => (
              <button
                key={int}
                type="button"
                onClick={() => setIntensity(int)}
                className={`py-1.5 text-[10px] font-bold rounded-lg border transition-all cursor-pointer capitalize ${
                  intensity === int
                    ? "bg-neon/15 border-neon text-neon"
                    : "border-border/40 bg-background/50 text-muted-foreground hover:text-foreground"
                }`}
              >
                {int}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleRecommend}
          disabled={loading}
          className="w-full py-2.5 rounded-xl bg-neon hover:bg-neon/90 text-black font-extrabold text-xs tracking-wider transition-all duration-200 cursor-pointer shadow-glow flex items-center justify-center gap-2"
        >
          {loading ? "Calculando..." : "Calcular Recuperación"}
        </button>
      </div>

      {recommendation && (
        <div className="pt-2 border-t border-border/10 animate-fade-in space-y-3">
          <div className="relative rounded-xl overflow-hidden h-32 border border-border/40">
            <img
              src={
                recommendation.snack_image ||
                "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop"
              }
              alt={recommendation.snack_name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
            <div className="absolute bottom-3 left-3 right-3 text-white">
              <h4 className="font-extrabold text-sm truncate">{recommendation.snack_name}</h4>
              <div className="text-[10px] text-neon font-medium mt-0.5">
                🔥 Quemado: {recommendation.calories_burned} kcal | Snack: {recommendation.calories}{" "}
                kcal
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="text-[10px] uppercase font-bold text-muted-foreground">
              Ingredientes
            </div>
            <ul className="list-disc list-inside text-xs text-foreground/80 pl-1 space-y-0.5">
              {recommendation.ingredients?.map((ing: string, i: number) => (
                <li key={i}>{ing}</li>
              ))}
            </ul>
          </div>

          <div className="space-y-1">
            <div className="text-[10px] uppercase font-bold text-muted-foreground">
              Justificación
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {recommendation.reasoning}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ==============================================================
// SUBCOMPONENTE: Pestaña de Historial de Nutricion
// ==============================================================
function NutritionLogsTab() {
  const isDemoMode = useAuthStore((s) => s.isDemoMode);
  const [logs, setLogs] = useState<NutritionLog[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      if (isDemoMode) {
        setLogs([
          {
            id: "1",
            sport: "Pádel",
            duration: 90,
            intensity: "alta",
            calories_burned: 650,
            snack_name: "Batido de Proteína con Plátano",
            calories: 350,
            ingredients: [
              "Leche de almendras",
              "1 Plátano",
              "1 scoop proteína Whey",
              "Semillas de chía",
            ],
            reasoning:
              "Perfecto para reponer carbohidratos rápidos e iniciar síntesis proteica post-juego de alta velocidad.",
            created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: "2",
            sport: "Natación",
            duration: 45,
            intensity: "media",
            calories_burned: 420,
            snack_name: "Sandwich de Pavo y Palta",
            calories: 310,
            ingredients: ["Pan integral", "Pechuga de pavo", "1/4 de Palta", "Rodaja de tomate"],
            reasoning:
              "Aporte de grasas saludables y carbohidratos complejos para restablecer energía aeróbica sostenida.",
            created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ]);
        setLoading(false);
        return;
      }

      try {
        const sessionResult = await withTimeout(supabase.auth.getSession(), 3000);
        const session = sessionResult?.data?.session;
        if (session) {
          const queryResult = await withTimeout(
            supabase
              .from("premium_nutrition_logs")
              .select("*")
              .order("created_at", { ascending: false }),
            4000,
          );
          if (queryResult.error) {
            console.error("Supabase nutrition query error:", queryResult.error);
          } else if (queryResult.data) {
            setLogs(queryResult.data as NutritionLog[]);
          }
        }
      } catch (e) {
        console.error("Failed to fetch nutrition logs:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [isDemoMode]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="px-5 py-4 border-b border-border/30 bg-background/40">
        <h4 className="font-bold text-sm text-foreground">Historial Nutricional Premium</h4>
        <p className="text-xs text-muted-foreground">
          Tus snacks y estadísticas de recuperación sugeridas por el Nutricionista IA.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {loading ? (
          <div className="text-center py-10 text-muted-foreground text-xs">
            Cargando historial...
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-xs flex flex-col items-center justify-center space-y-2">
            <History className="h-8 w-8 text-muted-foreground/30" />
            <span>Aún no tienes recomendaciones de snacks. Obtén una en la barra lateral.</span>
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className="p-4 bg-background/40 border border-border/20 rounded-2xl flex flex-col md:flex-row gap-4 hover:border-primary/20 transition-all"
            >
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neon">
                    {log.sport} • {log.duration} mins ({log.intensity})
                  </span>
                  <span className="text-[10px] text-muted-foreground font-semibold">
                    {new Date(log.created_at).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="text-base font-bold text-foreground">{log.snack_name}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{log.reasoning}</p>

                <div className="pt-2 flex flex-wrap gap-2">
                  {log.ingredients?.map((ing, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 border border-border/20 text-muted-foreground"
                    >
                      {ing}
                    </span>
                  ))}
                </div>
              </div>

              <div className="md:w-36 flex flex-row md:flex-col justify-between md:justify-center items-center text-center p-3 rounded-xl bg-background/50 border border-border/10 shrink-0 gap-2">
                <div>
                  <div className="text-[9px] uppercase font-bold text-muted-foreground">
                    Calorías Quemadas
                  </div>
                  <div className="text-sm font-black text-rose-400 mt-0.5">
                    {log.calories_burned} kcal
                  </div>
                </div>
                <div className="h-px w-full bg-border/10 hidden md:block" />
                <div>
                  <div className="text-[9px] uppercase font-bold text-muted-foreground">
                    Calorías Snack
                  </div>
                  <div className="text-sm font-black text-emerald-400 mt-0.5">
                    {log.calories} kcal
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
