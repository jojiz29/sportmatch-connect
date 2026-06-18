// === BLOQUE: Ruta de Detalle de Cancha ===
// Página individual de cada cancha con información detallada, selección
// de horarios, temporizador de retención, flujo completo de pago
// (Stripe/Yape/Plin/FitCoins) y confirmación con ticket QR.
// NOTA: Actualmente redirige a /app (integrado en el dashboard).
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import {
  ArrowLeft,
  Star,
  MapPin,
  Calendar as CalendarIcon,
  Clock,
  Loader2,
  Check,
  QrCode,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { Court } from "@/entities/types";
import { supabase } from "@/shared/api/supabase";
import { useAuthStore } from "@/entities/user/useAuth";
import { apiClient, MOCK_COURTS } from "@/shared/api/apiClient";
import { backendApi } from "@/shared/api/backendApi";
import { InsufficientBalanceModal } from "@/components/InsufficientBalanceModal";
import { calculateDistance } from "@/shared/api/geoService";
import {
  usePaymentGatewayStore,
  PaymentPayload,
  PaymentResult,
} from "@/features/wallet/usePaymentGatewayStore";
import { getSportFallbackImage } from "@/shared/lib/imageUtils";
import { logPaymentAttempt } from "@/services/paymentService";
import { PaymentCheckout, PaymentSelection } from "@/components/PaymentCheckout";
import type { Stripe, StripeElements } from "@stripe/stripe-js";

export const Route = createFileRoute("/app/courts/$courtId")({
  beforeLoad: () => {
    throw redirect({ to: "/app" });
  },
  // === BLOQUE: Validación de query params ===
  // El parámetro `book=true` hace scroll automático a la sección de reserva.
  validateSearch: (search: Record<string, unknown>): { book?: boolean } => {
    return {
      book: search.book === "true" || search.book === true || undefined,
    };
  },
  // === BLOQUE: Head tags dinámicos según la cancha ===
  head: ({ loaderData }: { loaderData?: Court }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Cargando Cancha — Reservas SportMatch" },
          { name: "description", content: "Cargando información de la cancha..." },
        ],
      };
    }
    return {
      meta: [
        { title: `${loaderData.name} — Reservas SportMatch` },
        { name: "description", content: `Reserva tu horario en ${loaderData.name}` },
      ],
    };
  },
  // === BLOQUE: Loader ===
  // En modo demo busca en MOCK_COURTS; en producción consulta Supabase.
  loader: async ({ params }: { params: { courtId: string } }) => {
    if (useAuthStore.getState().isDemoMode) {
      const court = MOCK_COURTS.find((c) => c.id === params.courtId);
      if (!court) throw new Error("Cancha no encontrada");
      return court;
    }

    const { data: court, error } = await supabase
      .from("courts")
      .select("*")
      .eq("id", params.courtId)
      .single();

    if (error || !court) {
      console.error("Court details not found in Supabase:", error);
      throw new Error("Cancha no encontrada");
    }
    return court as Court;
  },
  component: CourtDetail,
});

function CourtDetail() {
  const court = Route.useLoaderData() as Court;
  const user = useAuthStore((s) => s.user);

  // === BLOQUE: Estado de reserva y pago ===
  const [slot, setSlot] = useState<string | null>(null);
  const [isBooking, setIsBooking] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [paymentSelection, setPaymentSelection] = useState<PaymentSelection | null>(null);
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
  const [holdExpiry, setHoldExpiry] = useState<number | null>(null);
  const [holdCountdown, setHoldCountdown] = useState("05:00");

  const { book } = Route.useSearch();
  const { isProcessing, transactionId, processPayment, resetPayment } = usePaymentGatewayStore();

  // === BLOQUE: Auto-scroll a reserva si `book=true` ===
  useEffect(() => {
    if (book) {
      const timer = setTimeout(() => {
        const element = document.getElementById("booking-section");
        if (element) element.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [book]);

  // === BLOQUE: Reset de pago al cambiar slot o cancha ===
  useEffect(() => {
    resetPayment();
  }, [slot, court.id, resetPayment]);

  // === BLOQUE: Temporizador de retención del horario (5 min) ===
  // Cuando el usuario selecciona un horario, se inicia un conteo
  // regresivo de 5 minutos. Al vencer, se libera el slot.
  useEffect(() => {
    if (!slot) {
      setHoldExpiry(null);
      return;
    }
    setHoldExpiry(Date.now() + 5 * 60 * 1000);
  }, [slot]);

  useEffect(() => {
    if (!holdExpiry) return;
    const interval = window.setInterval(() => {
      const diff = holdExpiry - Date.now();
      if (diff <= 0) {
        setSlot(null);
        setHoldExpiry(null);
        setHoldCountdown("00:00");
        toast.error("El tiempo de retención del horario venció. Selecciona otro horario.");
        return;
      }
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setHoldCountdown(
        `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`,
      );
    }, 1000);
    return () => window.clearInterval(interval);
  }, [holdExpiry]);

  // === BLOQUE: Geolocalización ===
  useEffect(() => {
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
        },
        (error) => {
          console.warn("Geolocation unavailable.", error.message);
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 },
      );
    }
  }, []);

  const baseLocation = useMemo(() => {
    if (userCoords) return userCoords;
    if (user && user.last_location_lat && user.last_location_lng) {
      return { lat: user.last_location_lat, lng: user.last_location_lng };
    }
    return null;
  }, [userCoords, user]);

  // === BLOQUE: Carga de horarios reservados + suscripción Realtime ===
  // Obtiene los slots ya reservados para hoy desde backend o Supabase,
  // y se suscribe a cambios en la tabla bookings para actualización en vivo.
  useEffect(() => {
    if (!court || !user) return;

    const todayStr = new Date().toISOString().split("T")[0];

    async function fetchBookedSlots() {
      try {
        setLoadingBookings(true);
        const backendResult = await backendApi.bookings.getByCourtAndDate(court.id, todayStr);
        const booked = (backendResult.data as string[]) || [];
        setBookedSlots(booked);
      } catch {
        try {
          const booked = await apiClient.bookings.getByCourtAndDate(court.id, todayStr);
          setBookedSlots(booked);
        } catch (err) {
          console.error("Error loading booked slots:", err);
        }
      } finally {
        setLoadingBookings(false);
      }
    }
    fetchBookedSlots();

    const channel = supabase
      .channel(`public:bookings:court_id=eq.${court.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings", filter: `court_id=eq.${court.id}` },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newBooking = payload.new as { date: string; time_slot: string };
            if (newBooking.date === todayStr) {
              setBookedSlots((prev) =>
                prev.includes(newBooking.time_slot) ? prev : [...prev, newBooking.time_slot],
              );
            }
          } else if (payload.eventType === "DELETE") {
            const oldBooking = payload.old as { date: string; time_slot: string };
            if (oldBooking.date === todayStr) {
              setBookedSlots((prev) => prev.filter((s) => s !== oldBooking.time_slot));
            }
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [court, user]);

  if (!court || !user) {
    return (
      <div className="container mx-auto px-4 lg:px-8 py-8 animate-pulse bg-muted h-[560px] rounded-3xl" />
    );
  }

  // === BLOQUE: Cálculo de costos ===
  const maxPlayers = court.max_players || 4;
  const baseCourtPrice = court.price_per_hour / maxPlayers;
  const commissionPercentage = 10;
  const commissionAmount = baseCourtPrice * 0.1;
  const totalCost = baseCourtPrice + commissionAmount;
  const pricePerPerson = totalCost;

  // === BLOQUE: handlePaymentConfirm ===
  // Procesa el pago completo: verifica disponibilidad, ejecuta el pago
  // contra la pasarela (Stripe/Yape/Plin/FitCoins), crea la reserva en
  // Supabase y (en demo) crea un partido asociado.
  const handlePaymentConfirm = async (
    selection: PaymentSelection,
    stripe?: Stripe | null,
    elements?: StripeElements | null,
  ) => {
    if (!slot) {
      toast.error("Por favor selecciona un horario.");
      return;
    }
    if (!user) {
      toast.error("Debes iniciar sesión para realizar una reserva.");
      return;
    }

    setPaymentSelection(selection);
    setIsBooking(true);
    let currentPaymentResult: PaymentResult | null = null;

    try {
      const todayStr = new Date().toISOString().split("T")[0];

      const booked = await apiClient.bookings.getByCourtAndDate(court.id, todayStr);
      if (booked.includes(slot)) {
        toast.error("Este horario ya ha sido reservado. Por favor elige otro.");
        setBookedSlots(booked);
        setIsBooking(false);
        return;
      }

      const paymentPayload: PaymentPayload = {
        ...selection,
        amount: Math.ceil(pricePerPerson),
      };

      currentPaymentResult = await processPayment(paymentPayload, court.name, stripe, elements);
      setPaymentResult(currentPaymentResult);

      if (!currentPaymentResult.success) {
        const currentError = usePaymentGatewayStore.getState().error;
        toast.error(currentError || "El pago no pudo ser procesado.");
        setIsBooking(false);
        return;
      }

      await apiClient.bookings.create({
        court_id: court.id,
        user_id: user.id,
        date: todayStr,
        time_slot: slot,
        operating_hours: court.operating_hours,
        precio_cancha: baseCourtPrice,
        porcentaje_comision: commissionPercentage,
        monto_comision: commissionAmount,
        total_cobrado: totalCost,
      });

      // En demo mode, crea también el partido en memoria
      if (useAuthStore.getState().isDemoMode) {
        const backendResult = await backendApi.matches
          .create(user.id, {
            title: `Partido en ${court.name}`,
            sport: court.sport,
            court_id: court.id,
            date: todayStr,
            time: slot,
            max_players: maxPlayers,
            required_level: user.level || "Intermedio",
          })
          .catch(() => null);

        if (!backendResult?.data) {
          await apiClient.matches.create({
            title: `Partido en ${court.name}`,
            sport: court.sport,
            court_id: court.id,
            date: todayStr,
            time: slot,
            max_players: maxPlayers,
            required_level: user.level || "Intermedio",
            creator_id: user.id,
          });
        }
      }

      setConfirmed(true);
      toast.success("¡Reserva y Partido creados!", {
        description: `Turno hoy a las ${slot} hrs. ¡Partido publicado!`,
      });
    } catch (err: unknown) {
      console.error("Booking error:", err);
      if (currentPaymentResult?.success) {
        logPaymentAttempt({
          id: `pay-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          timestamp: new Date().toISOString(),
          courtName: court.name,
          method: selection.method,
          amount: Math.ceil(pricePerPerson),
          status: "partial_failure",
          errorCode: "BOOKING_PARTIAL_FAILURE",
        });
      }

      const pgErr = err as { code?: string };
      if (pgErr?.code === "23505") {
        toast.error("Este horario ya ha sido reservado por otro usuario.");
      } else {
        toast.error("Error al procesar la reserva. Por favor intenta de nuevo.");
      }
    } finally {
      setIsBooking(false);
    }
  };

  // === BLOQUE: Slots dinámicos ===
  const slots = court.operating_hours || [
    "08:00",
    "10:00",
    "12:00",
    "14:00",
    "16:00",
    "18:00",
    "19:00",
    "20:00",
    "21:00",
  ];

  const holdPaymentDiscount = 0;
  const chargeAmount = paymentResult?.amountCharged ?? Math.ceil(pricePerPerson);

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8">
      {/* === BLOQUE: Volver al mapa === */}
      <Link
        to="/app/map"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Volver al mapa
      </Link>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* === BLOQUE: Información de la cancha === */}
        <div className="space-y-6">
          <div className="rounded-3xl overflow-hidden h-64 sm:h-96 relative shadow-card">
            <img
              src={court.image_url || getSportFallbackImage(court.sport)}
              alt={court.name}
              onError={(e) => {
                e.currentTarget.src = getSportFallbackImage(court.sport);
              }}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <span className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold mb-3 inline-block">
                {court.sport}
              </span>
              <h1 className="text-3xl font-bold text-white">{court.name}</h1>
              <div className="text-sm text-white/80 flex items-center gap-4 mt-2 flex-wrap">
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {baseLocation
                    ? `${calculateDistance(baseLocation.lat, baseLocation.lng, court.lat, court.lng).toFixed(1)} km`
                    : `${court.distance_km ?? 0} km`}
                </span>
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-warning text-warning" />
                  {court.rating} ({court.reviews_count})
                </span>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${court.lat},${court.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all"
                >
                  <MapPin className="h-3 w-3 text-neon" /> Cómo llegar
                </a>
              </div>
            </div>
          </div>

          {/* === BLOQUE: Comodidades === */}
          <div className="bg-gradient-card border border-border rounded-2xl p-6 shadow-card">
            <h3 className="font-semibold mb-4">Comodidades</h3>
            <div className="flex flex-wrap gap-2">
              {court.amenities?.map((a) => (
                <span key={a} className="px-3 py-1 rounded-xl bg-accent text-sm">
                  {a}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* === BLOQUE: Sección de reserva y pago === */}
        <div>
          <div
            id="booking-section"
            className="bg-gradient-card border border-border rounded-3xl p-6 md:p-8 shadow-card sticky top-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Reserva tu turno</h2>
              <div className="text-xl font-semibold text-neon">
                ${court.price_per_hour}
                <span className="text-sm text-muted-foreground">/h</span>
              </div>
            </div>

            <div className="space-y-6">
              {/* Fecha (hoy, fijo) */}
              <div>
                <label className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-primary" /> Fecha
                </label>
                <div className="p-3 rounded-xl border border-border bg-background text-sm flex justify-between items-center cursor-not-allowed opacity-80">
                  <span>
                    Hoy,{" "}
                    {new Date().toLocaleDateString("es-AR", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                  <span className="text-neon text-xs font-semibold">Seleccionado</span>
                </div>
              </div>

              {/* Horarios disponibles */}
              <div>
                <label className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-electric" /> Horarios disponibles
                  {loadingBookings && (
                    <Loader2 className="h-3 w-3 animate-spin text-primary ml-2" />
                  )}
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {slots.map((s) => {
                    const taken = bookedSlots.includes(s) || !court.is_available;
                    return (
                      <button
                        key={s}
                        disabled={taken}
                        onClick={() => {
                          if (!confirmed) setSlot(s);
                        }}
                        className={`py-3 rounded-xl text-sm font-medium transition-all ${
                          taken
                            ? "bg-muted/30 text-muted-foreground/30 line-through cursor-not-allowed"
                            : slot === s
                              ? "bg-gradient-primary text-primary-foreground shadow-glow scale-105"
                              : "glass hover:border-primary/50"
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Temporizador de retención */}
              {slot && holdExpiry && (
                <div className="rounded-2xl border border-warning/30 bg-warning/10 p-3 text-[12px] text-warning-foreground mb-4">
                  <strong>Horario pendiente:</strong> el horario seleccionado se mantiene bloqueado
                  por {holdCountdown} mientras completas el pago.
                </div>
              )}

              {/* === BLOQUE: Checkout de pago === */}
              <PaymentCheckout
                cost={Math.ceil(pricePerPerson)}
                onConfirm={handlePaymentConfirm}
                isProcessing={isProcessing}
                disabled={isBooking || confirmed}
              />
            </div>
          </div>
        </div>

        {/* === BLOQUE: Confirmación con ticket QR === */}
        {confirmed && (
          <div className="bg-gradient-card border border-neon/40 rounded-3xl p-6 text-center shadow-neon mt-6 relative overflow-hidden font-sans">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-1 bg-gradient-neon rounded-b-full" />

            <div className="h-12 w-12 mx-auto rounded-full bg-neon/20 grid place-items-center mb-3 mt-2">
              <Check className="h-6 w-6 text-neon" />
            </div>
            <h3 className="text-lg font-bold text-foreground">¡Reserva Confirmada!</h3>
            <p className="text-xs text-muted-foreground">Tu ticket digital está listo</p>

            <div className="my-5 border-t-2 border-dashed border-border/60 relative">
              <div className="absolute -left-8 -top-2 w-4 h-4 bg-background border-r border-neon/30 rounded-full" />
              <div className="absolute -right-8 -top-2 w-4 h-4 bg-background border-l border-neon/30 rounded-full" />
            </div>

            {/* Detalle de la transacción */}
            <div className="text-left space-y-3.5 text-sm bg-accent/30 p-4 rounded-2xl border border-border/50">
              <div className="flex justify-between items-center pb-2 border-b border-border/30">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                  Transacción
                </span>
                <span className="font-mono text-xs font-bold text-neon">
                  {transactionId || "TXN-DEMO123"}
                </span>
              </div>
              <div className="space-y-1">
                <div className="font-bold text-foreground text-sm">{court.name}</div>
                <div className="text-[11px] text-muted-foreground leading-normal">
                  {court.address}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-1">
                <div>
                  <div className="text-[10px] text-muted-foreground font-semibold">Deporte</div>
                  <div className="text-xs font-bold text-foreground">{court.sport}</div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground font-semibold">
                    Fecha y Hora
                  </div>
                  <div className="text-xs font-bold text-foreground">Hoy, {slot}</div>
                </div>
              </div>

              {/* Detalle del pago */}
              <div className="pt-3 border-t border-border/30 space-y-1.5">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  Detalle del Pago
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Precio Cancha / Hora</span>
                  <span>S/ {court.price_per_hour.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Comisión de Servicio</span>
                  <span>S/ 3.00</span>
                </div>
                {holdPaymentDiscount > 0 && (
                  <div className="flex justify-between text-xs text-emerald-500">
                    <span>Descuento (FitCoins gastados)</span>
                    <span className="font-semibold">-S/ {holdPaymentDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Método de pago</span>
                  <span>
                    {paymentSelection?.method === "fitcoins"
                      ? "FitCoins"
                      : paymentSelection?.method === "card"
                        ? "Tarjeta"
                        : paymentSelection?.method === "yape"
                          ? "Yape"
                          : "Plin"}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold text-foreground pt-1.5 border-t border-dashed border-border/40">
                  <span>Total Pagado</span>
                  <span>S/ {chargeAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* QR Code */}
            <div className="mt-5 space-y-3">
              <p className="text-[10px] text-muted-foreground">
                Mostrá este QR de check-in al ingresar al club
              </p>
              <div className="mx-auto h-32 w-32 rounded-2xl bg-white border border-border p-2 flex items-center justify-center shadow-glow">
                <QrCode className="h-28 w-28 text-black" />
              </div>
              <Link
                to="/app/profile"
                className="mx-auto inline-flex items-center justify-center rounded-2xl bg-neon px-5 py-3 text-sm font-semibold text-background shadow-glow hover:scale-[1.01] transition-all"
              >
                Ver mi reserva
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* === BLOQUE: Overlay de procesamiento de pago === */}
      {isProcessing && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex flex-col items-center justify-center space-y-6">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-gradient-primary blur-xl opacity-50 animate-pulse" />
            <div className="relative bg-card border border-border p-6 rounded-full shadow-glow">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          </div>
          <div className="text-center space-y-2 max-w-sm px-6">
            <h3 className="text-xl font-bold text-foreground">Procesando Pago</h3>
            <p className="text-sm text-muted-foreground animate-pulse">
              Conectando de forma segura con la pasarela de pago (Niubiz/Stripe)...
            </p>
          </div>
        </div>
      )}

      <InsufficientBalanceModal
        isOpen={isBalanceModalOpen}
        onOpenChange={setIsBalanceModalOpen}
        cost={Math.ceil(pricePerPerson)}
        balance={user?.fitcoins_balance ?? 0}
      />
    </div>
  );
}
