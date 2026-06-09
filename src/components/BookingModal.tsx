import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import {
  Star,
  MapPin,
  Calendar as CalendarIcon,
  Clock,
  Users,
  Loader2,
  Check,
  QrCode,
} from "lucide-react";
import { Court, Squad } from "@/entities/types";
import { useAuthStore } from "@/entities/user/useAuth";
import { apiClient } from "@/shared/api/apiClient";
import { backendApi } from "@/shared/api/backendApi";
import { supabase } from "@/shared/api/supabase";
import { toast } from "sonner";
import { calculateDistance } from "@/shared/api/geoService";
import { usePaymentGatewayStore } from "@/features/wallet/usePaymentGatewayStore";
import { getSportFallbackImage } from "@/shared/lib/imageUtils";
import { InsufficientBalanceModal } from "@/components/InsufficientBalanceModal";

interface BookingModalProps {
  court: Court | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  baseLocation: { lat: number; lng: number } | null;
  squadForGroupBooking?: Squad | null;
}

export function BookingModal({
  court,
  isOpen,
  onOpenChange,
  baseLocation,
  squadForGroupBooking,
}: BookingModalProps) {
  const user = useAuthStore((s) => s.user);
  const [slot, setSlot] = useState<string | null>(null);
  const [isBooking, setIsBooking] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const [actualSquadMembersCount, setActualSquadMembersCount] = useState<number | null>(null);

  useEffect(() => {
    if (!squadForGroupBooking || !isOpen) {
      setActualSquadMembersCount(null);
      return;
    }
    const currentSquad = squadForGroupBooking;
    let active = true;
    async function loadActualCount() {
      try {
        if (useAuthStore.getState().isDemoMode) {
          const memberships = localStorage.getItem("sportmatch_demo_memberships");
          if (memberships) {
            const parsed = JSON.parse(memberships);
            const count = parsed[currentSquad.id]?.length;
            if (count !== undefined && active) {
              setActualSquadMembersCount(count);
              return;
            }
          }
          if (active) setActualSquadMembersCount(currentSquad.members_count || 1);
        } else {
          const { count, error } = await supabase
            .from("squad_members")
            .select("*", { count: "exact", head: true })
            .eq("squad_id", currentSquad.id);
          if (!error && count !== null && active) {
            setActualSquadMembersCount(count);
          } else if (active) {
            setActualSquadMembersCount(currentSquad.members_count || 1);
          }
        }
      } catch (err) {
        console.warn("Failed to load actual squad members count:", err);
        if (active) setActualSquadMembersCount(currentSquad.members_count || 1);
      }
    }
    loadActualCount();
    return () => {
      active = false;
    };
  }, [squadForGroupBooking, isOpen]);

  const { isProcessing, transactionId, processPayment, resetPayment } = usePaymentGatewayStore();

  useEffect(() => {
    if (isOpen) {
      setSlot(null);
      setConfirmed(false);
      resetPayment();
    }
  }, [isOpen, court?.id, resetPayment]);

  useEffect(() => {
    if (!isOpen || !court) return;

    const todayStr = new Date().toISOString().split("T")[0];

    async function fetchBookedSlots() {
      try {
        setLoadingBookings(true);
        // Try backend first, fallback to Supabase
        const backendResult = await backendApi.bookings.getByCourtAndDate(court!.id, todayStr);
        const booked = (backendResult.data as string[]) || [];
        setBookedSlots(booked);
      } catch {
        try {
          const booked = await apiClient.bookings.getByCourtAndDate(court!.id, todayStr);
          setBookedSlots(booked);
        } catch (err) {
          console.error("Error loading booked slots:", err);
        }
      } finally {
        setLoadingBookings(false);
      }
    }
    fetchBookedSlots();

    // Subscribe to Postgres changes for bookings of this court on today's date
    const channel = supabase
      .channel(`modal:bookings:court_id=eq.${court.id}`)
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
  }, [isOpen, court]);

  if (!court || !user) return null;

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

  const maxPlayers = court.max_players || 4;
  const bookingMembersCount = squadForGroupBooking
    ? actualSquadMembersCount !== null
      ? actualSquadMembersCount
      : squadForGroupBooking.members_count || 1
    : maxPlayers;
  const pricePerPerson = (court.price_per_hour + 3) / bookingMembersCount;
  const cost = Math.ceil(pricePerPerson);

  const handleBook = async () => {
    if (!slot) {
      toast.error("Por favor selecciona un horario.");
      return;
    }

    if (user.fitcoins_balance < cost) {
      setIsBalanceModalOpen(true);
      return;
    }

    try {
      setIsBooking(true);
      const todayStr = new Date().toISOString().split("T")[0];

      // 1. Double Booking Prevention: Check availability in database
      let booked: string[] = [];
      try {
        const backendResult = await backendApi.bookings.getByCourtAndDate(court.id, todayStr);
        booked = (backendResult.data as string[]) || [];
      } catch {
        booked = await apiClient.bookings.getByCourtAndDate(court.id, todayStr);
      }
      if (booked.includes(slot)) {
        toast.error("Este horario ya ha sido reservado. Por favor elige otro.");
        setBookedSlots(booked);
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

      // 3. Perform INSERT Booking
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (token) {
        await backendApi.bookings
          .create(token, {
            court_id: court.id,
            user_id: user.id,
            date: todayStr,
            time: slot,
          })
          .catch(() =>
            apiClient.bookings.create({
              court_id: court.id,
              user_id: user.id,
              date: todayStr,
              time_slot: slot,
              operating_hours: court.operating_hours,
            }),
          );
      } else {
        await apiClient.bookings.create({
          court_id: court.id,
          user_id: user.id,
          date: todayStr,
          time_slot: slot,
          operating_hours: court.operating_hours,
        });
      }

      // 4. AUTOMATICALLY insert into public.matches (Social Cascade Match link)
      if (useAuthStore.getState().isDemoMode) {
        const matchTitle = squadForGroupBooking
          ? `Partido de Squad: ${squadForGroupBooking.name}`
          : `Partido en ${court.name}`;

        const backendResult = await backendApi.matches
          .create(user.id, {
            title: matchTitle,
            sport: court.sport,
            court_id: court.id,
            date: todayStr,
            time: slot,
            max_players: squadForGroupBooking ? bookingMembersCount : maxPlayers,
            required_level: user.level || "Intermedio",
          })
          .catch(() => null);

        if (!backendResult?.data) {
          await apiClient.matches.create({
            title: matchTitle,
            sport: court.sport,
            court_id: court.id,
            date: todayStr,
            time: slot,
            max_players: squadForGroupBooking ? bookingMembersCount : maxPlayers,
            required_level: user.level || "Intermedio",
            creator_id: user.id,
          });
        }
      }

      setConfirmed(true);
      toast.success(
        squadForGroupBooking ? "¡Reserva Grupal y Partido creados!" : "¡Reserva y Partido creados!",
        {
          description: `Turno hoy a las ${slot} hrs. ¡Partido publicado!`,
        },
      );
    } catch (err: unknown) {
      console.error("Booking error:", err);
      const { handleWalletError } = await import("@/services/walletService");
      const handled = handleWalletError(err);
      if (!handled) {
        const pgErr = err as { code?: string };
        if (pgErr?.code === "23505") {
          toast.error("Este horario ya ha sido reservado por otro usuario.");
        } else {
          toast.error("Error al procesar la reserva. Por favor intenta de nuevo.");
        }
      }
    } finally {
      setIsBooking(false);
    }
  };

  const distance = baseLocation
    ? calculateDistance(baseLocation.lat, baseLocation.lng, court.lat, court.lng)
    : (court.distance_km ?? 0);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-background border border-border rounded-3xl p-6 md:p-8 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-2xl font-bold flex items-center justify-between">
            <span>{squadForGroupBooking ? "Reserva Colectiva (Squad)" : "Reservar Cancha"}</span>
            <span className="text-lg font-semibold text-neon">
              S/ {court.price_per_hour}
              <span className="text-xs text-muted-foreground font-normal">/h</span>
            </span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground flex items-center gap-3 flex-wrap">
            <span>{court.name}</span>
            <span>·</span>
            <span>{court.sport}</span>
            <span>·</span>
            <span className="flex items-center gap-0.5">
              <MapPin className="h-3.5 w-3.5 text-neon" /> {distance.toFixed(1)} km
            </span>
            <span>·</span>
            <span className="flex items-center gap-0.5 text-warning">
              <Star className="h-3.5 w-3.5 fill-warning text-warning" /> {court.rating}
            </span>
          </DialogDescription>
        </DialogHeader>

        {!confirmed ? (
          <div className="grid md:grid-cols-2 gap-6 pt-2">
            {/* Court Detail Preview & Info */}
            <div className="space-y-4">
              <div className="relative h-44 rounded-2xl overflow-hidden border border-border/50 shadow-md">
                <img
                  src={court.image_url || getSportFallbackImage(court.sport)}
                  alt={court.name}
                  onError={(e) => {
                    e.currentTarget.src = getSportFallbackImage(court.sport);
                  }}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 text-white text-xs font-medium">
                  {court.address}
                </div>
              </div>

              <div className="bg-gradient-card border border-border/60 rounded-xl p-4 space-y-2.5 text-xs">
                <div className="font-semibold text-foreground border-b border-border/40 pb-1.5 mb-1 text-sm">
                  Detalles de División
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Costo de Cancha / hora</span>
                  <span className="text-foreground">S/ {court.price_per_hour.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Comisión de Servicio</span>
                  <span className="text-foreground">S/ 3.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dividido entre</span>
                  <span className="text-foreground font-semibold">
                    {squadForGroupBooking
                      ? `${bookingMembersCount} miembros (Squad)`
                      : `${maxPlayers} jugadores`}
                  </span>
                </div>
                <div className="flex justify-between border-t border-border/30 pt-2 text-sm font-bold">
                  <span>Tu parte (FitCoins)</span>
                  <span className="text-neon">S/ {pricePerPerson.toFixed(2)} FC</span>
                </div>
              </div>

              <div className="flex items-start gap-2 bg-accent/40 p-3.5 rounded-xl border border-border/50">
                <Users className="h-4.5 w-4.5 text-electric mt-0.5" />
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  <strong>Efecto Cascada Social:</strong> Al reservar esta cancha, se creará
                  automáticamente un partido{" "}
                  <strong>{squadForGroupBooking ? "DE SQUAD" : "ABIERTO"}</strong>.
                  {squadForGroupBooking
                    ? " Solo los miembros del squad formarán parte de la división de costo."
                    : " Otros jugadores compatibles en el área podrán unirse de inmediato para completar los equipos."}
                </p>
              </div>
            </div>

            {/* Slots Selector & Actions */}
            <div className="space-y-5">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                  <CalendarIcon className="h-3.5 w-3.5 text-primary" /> Fecha
                </label>
                <div className="p-3 rounded-xl border border-border bg-background/50 text-xs font-semibold flex justify-between items-center cursor-not-allowed opacity-80">
                  <span>
                    Hoy,{" "}
                    {new Date().toLocaleDateString("es-AR", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                  <span className="text-neon text-[10px] uppercase font-bold tracking-wider">
                    Hoy
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2.5 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-electric" /> Horas Disponibles
                  {loadingBookings && (
                    <Loader2 className="h-3 w-3 animate-spin text-primary ml-2" />
                  )}
                </label>
                <div className="grid grid-cols-3 gap-2.5 max-h-[160px] overflow-y-auto pr-1">
                  {slots.map((s) => {
                    const taken = bookedSlots.includes(s) || !court.is_available;
                    return (
                      <button
                        key={s}
                        type="button"
                        disabled={taken}
                        onClick={() => setSlot(s)}
                        className={`py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          taken
                            ? "bg-muted/30 text-muted-foreground/30 line-through cursor-not-allowed border-transparent"
                            : slot === s
                              ? "bg-gradient-primary text-primary-foreground shadow-glow border-primary scale-[1.03]"
                              : "glass border-border hover:border-primary/40"
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleBook}
                  disabled={!slot || isBooking}
                  className="w-full py-3.5 rounded-xl bg-gradient-primary text-primary-foreground font-bold shadow-glow disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
                >
                  {isBooking ? (
                    <>
                      <Loader2 className="h-4.5 w-4.5 animate-spin" />
                      <span>Procesando reserva...</span>
                    </>
                  ) : slot ? (
                    `Confirmar para las ${slot}`
                  ) : (
                    "Selecciona un horario"
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Confirmation Ticket */
          <div className="bg-gradient-card border border-neon/30 rounded-3xl p-6 text-center shadow-neon relative overflow-hidden font-sans pt-8">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-1 bg-gradient-neon rounded-b-full"></div>

            <div className="h-12 w-12 mx-auto rounded-full bg-neon/20 grid place-items-center mb-3">
              <Check className="h-6 w-6 text-neon" />
            </div>
            <h3 className="text-lg font-bold text-foreground">¡Reserva y Partido Creados!</h3>
            <p className="text-xs text-muted-foreground">
              Tu ticket y partido están activos en la red
            </p>

            {/* Ticket separator dashed line */}
            <div className="my-5 border-t-2 border-dashed border-border/60 relative">
              <div className="absolute -left-8 -top-2 w-4 h-4 bg-background border-r border-neon/30 rounded-full"></div>
              <div className="absolute -right-8 -top-2 w-4 h-4 bg-background border-l border-neon/30 rounded-full"></div>
            </div>

            <div className="text-left space-y-3.5 text-xs bg-accent/20 p-4 rounded-2xl border border-border/50">
              <div className="flex justify-between items-center pb-2 border-b border-border/30">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                  Transacción ID
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
                  <span className="text-neon">-S/ {cost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-foreground pt-1.5 border-t border-dashed border-border/40">
                  <span>Total Pagado</span>
                  <span>S/ 0.00</span>
                </div>
              </div>
            </div>

            {/* QR Code section */}
            <div className="mt-5 space-y-2 flex flex-col items-center">
              <p className="text-[10px] text-muted-foreground">
                Muestra este QR de check-in al ingresar al club
              </p>
              <div className="h-28 w-28 rounded-xl bg-white border border-border p-2 flex items-center justify-center shadow-glow">
                <QrCode className="h-24 w-24 text-black" />
              </div>
            </div>
          </div>
        )}

        {isProcessing && (
          <div className="fixed inset-0 bg-background/85 backdrop-blur-md z-50 flex flex-col items-center justify-center space-y-6">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-gradient-primary blur-xl opacity-50 animate-pulse"></div>
              <div className="relative bg-card border border-border p-6 rounded-full shadow-glow">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              </div>
            </div>
            <div className="text-center space-y-2 max-w-sm px-6">
              <h3 className="text-xl font-bold text-foreground">Procesando Pago</h3>
              <p className="text-sm text-muted-foreground animate-pulse leading-normal">
                Conectando de forma segura con la pasarela de pago (Niubiz/Stripe)...
              </p>
            </div>
          </div>
        )}

        <InsufficientBalanceModal
          isOpen={isBalanceModalOpen}
          onOpenChange={setIsBalanceModalOpen}
          cost={cost}
          balance={user.fitcoins_balance}
        />
      </DialogContent>
    </Dialog>
  );
}
