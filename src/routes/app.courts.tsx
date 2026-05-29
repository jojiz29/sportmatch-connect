import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { apiClient } from "@/shared/api/apiClient";
import { Court } from "@/entities/types";
import { Star, MapPin, Check, QrCode, Loader2 } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/shared/api/supabase";
import { useAuthStore } from "@/entities/user/useAuth";
import { toast } from "sonner";
import { InsufficientBalanceModal } from "@/components/InsufficientBalanceModal";
import { calculateDistance } from "@/shared/api/geoService";
import { usePaymentGatewayStore } from "@/features/wallet/usePaymentGatewayStore";

export const Route = createFileRoute("/app/courts")({
  head: () => ({ meta: [{ title: "Reservas — SportMatch" }] }),
  loader: async () => apiClient.courts.getAll(),
  component: Courts,
});

function Courts() {
  const courts = Route.useLoaderData() as Court[];
  const user = useAuthStore((s) => s.user);
  const [selected, setSelected] = useState<Court | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

  const { isProcessing, transactionId, processPayment, resetPayment } = usePaymentGatewayStore();

  useEffect(() => {
    resetPayment();
  }, [slot, selected?.id, resetPayment]);

  useEffect(() => {
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.warn("Geolocation API unavailable or permission denied.", error.message);
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
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

  useEffect(() => {
    if (courts.length > 0 && !selected) {
      setSelected(courts[0]);
    }
  }, [courts, selected]);

  useEffect(() => {
    if (!selected) return;

    const courtId = selected.id;
    const todayStr = new Date().toISOString().split("T")[0];

    async function fetchBookedSlots() {
      try {
        setLoadingBookings(true);
        const booked = await apiClient.bookings.getByCourtAndDate(courtId, todayStr);
        setBookedSlots(booked);
      } catch (err) {
        console.error("Error loading booked slots:", err);
      } finally {
        setLoadingBookings(false);
      }
    }
    fetchBookedSlots();

    // Subscribe to Postgres changes for bookings of this court on today's date
    const channel = supabase
      .channel(`public:bookings:court_id=eq.${courtId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
          filter: `court_id=eq.${courtId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newBooking = payload.new as { date: string; time_slot: string };
            if (newBooking.date === todayStr) {
              setBookedSlots((prev) => {
                if (prev.includes(newBooking.time_slot)) return prev;
                return [...prev, newBooking.time_slot];
              });
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
  }, [selected]);

  if (!selected || !user) {
    return (
      <div className="container mx-auto px-4 lg:px-8 py-8 animate-pulse bg-muted h-[560px] rounded-3xl" />
    );
  }

  // Dynamic slots based on court metadata
  const slots = selected.operating_hours || [
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

  // Dynamic players limit based on court metadata
  const maxPlayers = selected.max_players || 4;
  const pricePerPerson = (selected.price_per_hour + 3) / maxPlayers;

  const handleConfirmBooking = async () => {
    if (!slot) {
      toast.error("Por favor selecciona un horario.");
      return;
    }
    if (!user) {
      toast.error("Debes iniciar sesión para realizar una reserva.");
      return;
    }

    const cost = Math.ceil(pricePerPerson);
    if (user.fitcoins_balance < cost) {
      setIsBalanceModalOpen(true);
      return;
    }

    try {
      setIsBooking(true);
      const todayStr = new Date().toISOString().split("T")[0];

      // 1. Double Booking Prevention: Check availability in database
      const booked = await apiClient.bookings.getByCourtAndDate(selected.id, todayStr);
      if (booked.includes(slot)) {
        toast.error("Este horario ya ha sido reservado. Por favor elige otro.");
        setBookedSlots(booked); // Sync state
        setIsBooking(false);
        return;
      }

      // 2. Process Simulated Payment
      const paymentSuccess = await processPayment(cost, selected.name);
      if (!paymentSuccess) {
        const currentError = usePaymentGatewayStore.getState().error;
        toast.error(currentError || "El pago no pudo ser procesado.");
        setIsBooking(false);
        return;
      }

      // 3. Perform INSERT
      await apiClient.bookings.create({
        court_id: selected.id,
        user_id: user.id,
        date: todayStr,
        time_slot: slot,
        operating_hours: selected.operating_hours,
      });

      setConfirmed(true);
      toast.success("¡Reserva confirmada con éxito!", {
        description: `Turno reservado para hoy a las ${slot} hrs.`,
      });
    } catch (err: unknown) {
      console.error("Booking error:", err);
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

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8">
      <PageHeader title="Reservar cancha" subtitle="Disponibilidad en tiempo real" />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            {courts.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setSelected(c);
                  setSlot(null);
                  setConfirmed(false);
                }}
                className={`text-left rounded-2xl overflow-hidden border transition-all ${
                  selected.id === c.id
                    ? "border-primary ring-glow"
                    : "border-border hover:border-accent"
                }`}
              >
                <div className="relative h-40">
                  <img
                    src={c.image_url}
                    alt={c.name}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute top-3 right-3">
                    {c.is_available ? (
                      <span className="px-2 py-1 rounded-full bg-neon/90 text-neon-foreground text-xs font-semibold">
                        Disponible
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full bg-destructive/90 text-destructive-foreground text-xs">
                        Ocupado
                      </span>
                    )}
                  </div>
                  <div className="absolute bottom-3 left-3 right-3">
                    <div className="font-semibold">{c.name}</div>
                    <div className="text-xs text-white/80 flex items-center gap-2 mt-0.5">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {baseLocation
                          ? `${calculateDistance(baseLocation.lat, baseLocation.lng, c.lat, c.lng).toFixed(1)} km`
                          : `${c.distance_km ?? 0} km`}
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-warning text-warning" />
                        {c.rating}
                      </span>
                      <span>· ${c.price_per_hour}/h</span>
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-card">
                  <div className="flex flex-wrap gap-1">
                    {c.amenities?.map((a) => (
                      <span key={a} className="text-xs px-2 py-0.5 rounded-full bg-accent">
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-gradient-card border border-border rounded-2xl p-5 shadow-card">
            <h3 className="font-semibold">{selected.name}</h3>
            <p className="text-xs text-muted-foreground">
              {selected.sport} · ${selected.price_per_hour}/h
            </p>

            <div className="mt-4">
              <div className="text-xs text-muted-foreground mb-2 flex justify-between items-center">
                <span>Hoy · Selecciona horario</span>
                {loadingBookings && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {slots.map((s) => {
                  const taken = bookedSlots.includes(s);
                  return (
                    <button
                      key={s}
                      disabled={taken}
                      onClick={() => {
                        if (!confirmed) setSlot(s);
                      }}
                      className={`py-2 rounded-lg text-sm transition-all ${
                        taken
                          ? "bg-muted/40 text-muted-foreground/50 line-through cursor-not-allowed"
                          : slot === s
                            ? "bg-gradient-primary text-primary-foreground shadow-glow"
                            : "glass hover:bg-accent"
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-border space-y-2 text-sm">
              <Row label="Cancha" value={`$${selected.price_per_hour}`} />
              <Row label="Servicio" value="$3" />
              <Row label="Dividir entre" value={`${maxPlayers} jugadores`} />
              <div className="flex justify-between font-semibold pt-2 border-t border-border">
                <span>Tu parte</span>
                <span className="text-neon">${pricePerPerson.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handleConfirmBooking}
              disabled={!slot || isBooking || confirmed}
              className="mt-5 w-full py-3 rounded-xl bg-gradient-primary text-primary-foreground font-semibold shadow-glow disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isBooking ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Procesando...</span>
                </>
              ) : confirmed ? (
                "Reserva confirmada ✓"
              ) : (
                "Confirmar reserva"
              )}
            </button>
          </div>

          {confirmed && (
            <div className="bg-gradient-card border border-neon/40 rounded-3xl p-6 text-center shadow-neon mt-4 relative overflow-hidden font-sans">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-1 bg-gradient-neon rounded-b-full"></div>

              <div className="h-12 w-12 mx-auto rounded-full bg-neon/20 grid place-items-center mb-3 mt-2">
                <Check className="h-6 w-6 text-neon" />
              </div>
              <h3 className="text-lg font-bold text-foreground">¡Reserva Confirmada!</h3>
              <p className="text-xs text-muted-foreground">Tu ticket digital está listo</p>

              {/* Ticket separator dashed line */}
              <div className="my-5 border-t-2 border-dashed border-border/60 relative">
                <div className="absolute -left-8 -top-2 w-4 h-4 bg-background border-r border-neon/30 rounded-full"></div>
                <div className="absolute -right-8 -top-2 w-4 h-4 bg-background border-l border-neon/30 rounded-full"></div>
              </div>

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
                  <div className="font-bold text-foreground text-sm">{selected.name}</div>
                  <div className="text-[11px] text-muted-foreground leading-normal">
                    {selected.address}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div>
                    <div className="text-[10px] text-muted-foreground font-semibold">Deporte</div>
                    <div className="text-xs font-bold text-foreground">{selected.sport}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground font-semibold">
                      Fecha y Hora
                    </div>
                    <div className="text-xs font-bold text-foreground">Hoy, {slot}</div>
                  </div>
                </div>

                <div className="pt-3 border-t border-border/30 space-y-1.5">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    Detalle del Pago
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Precio Cancha / Hora</span>
                    <span>S/ {selected.price_per_hour.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Comisión de Servicio</span>
                    <span>S/ 3.00</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Descuento (FitCoins gastados)</span>
                    <span className="text-neon">-S/ {Math.ceil(pricePerPerson).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-foreground pt-1.5 border-t border-dashed border-border/40">
                    <span>Total Pagado</span>
                    <span>S/ 0.00</span>
                  </div>
                </div>
              </div>

              {/* QR Code section */}
              <div className="mt-5 space-y-2">
                <p className="text-[10px] text-muted-foreground">
                  Mostrá este QR de check-in al ingresar al club
                </p>
                <div className="mx-auto h-32 w-32 rounded-2xl bg-white border border-border p-2 flex items-center justify-center shadow-glow">
                  <QrCode className="h-28 w-28 text-black" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {isProcessing && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex flex-col items-center justify-center space-y-6">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-gradient-primary blur-xl opacity-50 animate-pulse"></div>
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}
