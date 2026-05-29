import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Star,
  MapPin,
  Calendar as CalendarIcon,
  Clock,
  Users,
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
import { InsufficientBalanceModal } from "@/components/InsufficientBalanceModal";
import { calculateDistance } from "@/shared/api/geoService";
import { usePaymentGatewayStore } from "@/features/wallet/usePaymentGatewayStore";

export const Route = createFileRoute("/app/courts/$courtId")({
  validateSearch: (search: Record<string, unknown>): { book?: boolean } => {
    return {
      book: search.book === "true" || search.book === true || undefined,
    };
  },
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
  loader: async ({ params }: { params: { courtId: string } }) => {
    if (useAuthStore.getState().isDemoMode) {
      const court = MOCK_COURTS.find((c) => c.id === params.courtId);
      if (!court) {
        throw new Error("Cancha no encontrada");
      }
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
  const [slot, setSlot] = useState<string | null>(null);
  const [isBooking, setIsBooking] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

  const { book } = Route.useSearch();
  const { isProcessing, transactionId, processPayment, resetPayment } = usePaymentGatewayStore();

  useEffect(() => {
    if (book) {
      const timer = setTimeout(() => {
        const element = document.getElementById("booking-section");
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [book]);

  useEffect(() => {
    resetPayment();
  }, [slot, court.id, resetPayment]);

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
    if (!court || !user) return;

    const todayStr = new Date().toISOString().split("T")[0];

    async function fetchBookedSlots() {
      try {
        setLoadingBookings(true);
        const booked = await apiClient.bookings.getByCourtAndDate(court.id, todayStr);
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
      .channel(`public:bookings:court_id=eq.${court.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
          filter: `court_id=eq.${court.id}`,
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
  }, [court, user]);

  if (!court || !user) {
    return (
      <div className="container mx-auto px-4 lg:px-8 py-8 animate-pulse bg-muted h-[560px] rounded-3xl" />
    );
  }

  const handleBook = async () => {
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
      const booked = await apiClient.bookings.getByCourtAndDate(court.id, todayStr);
      if (booked.includes(slot)) {
        toast.error("Este horario ya ha sido reservado. Por favor elige otro.");
        setBookedSlots(booked); // Sync state
        setIsBooking(false);
        return;
      }

      // 2. Process Simulated Payment
      const paymentSuccess = await processPayment(cost, court.name);
      if (!paymentSuccess) {
        const currentError = usePaymentGatewayStore.getState().error;
        toast.error(currentError || "El pago no pudo ser procesado.");
        setIsBooking(false);
        return;
      }

      // 3. Perform INSERT
      await apiClient.bookings.create({
        court_id: court.id,
        user_id: user.id,
        date: todayStr,
        time_slot: slot,
        operating_hours: court.operating_hours,
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

  // Dynamic slots based on court metadata
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

  // Dynamic players limit based on court metadata
  const maxPlayers = court.max_players || 4;
  const pricePerPerson = (court.price_per_hour + 3) / maxPlayers;

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8">
      <Link
        to="/app/map"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Volver al mapa
      </Link>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="rounded-3xl overflow-hidden h-64 sm:h-96 relative shadow-card">
            <img
              src={court.image_url}
              alt={court.name}
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

              <div className="pt-6 border-t border-border">
                <div className="flex items-center gap-3 mb-6 bg-accent/50 p-4 rounded-xl text-sm">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Podrás dividir el pago de{" "}
                    <strong className="text-foreground">${court.price_per_hour}</strong> con tus
                    amigos después de reservar. Dividido entre {maxPlayers} jugadores, tu parte es
                    de <strong className="text-neon">${pricePerPerson.toFixed(2)}</strong>.
                  </span>
                </div>
                <button
                  disabled={!slot || isBooking || confirmed}
                  onClick={handleBook}
                  className="w-full py-4 rounded-xl bg-gradient-primary text-primary-foreground font-bold shadow-glow disabled:opacity-50 disabled:shadow-none transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                >
                  {isBooking ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Procesando reserva...</span>
                    </>
                  ) : confirmed ? (
                    "Reserva confirmada ✓"
                  ) : slot ? (
                    `Confirmar reserva para las ${slot}`
                  ) : (
                    "Selecciona un horario"
                  )}
                </button>
              </div>
            </div>
          </div>

          {confirmed && (
            <div className="bg-gradient-card border border-neon/40 rounded-3xl p-6 text-center shadow-neon mt-6 relative overflow-hidden font-sans">
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
