import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { apiClient } from "@/shared/api/apiClient";
import { Court } from "@/entities/types";
import { Star, MapPin, Check, QrCode, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/shared/api/supabase";
import { useAuthStore } from "@/entities/user/useAuth";
import { toast } from "sonner";

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

  if (!selected) {
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

      // 2. Perform INSERT
      await apiClient.bookings.create({
        court_id: selected.id,
        user_id: user.id,
        date: todayStr,
        time_slot: slot,
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
                        {c.distance_km ?? 0} km
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
            <div className="bg-gradient-card border border-neon/40 rounded-2xl p-5 text-center shadow-neon">
              <div className="h-14 w-14 mx-auto rounded-full bg-neon/20 grid place-items-center mb-3">
                <Check className="h-7 w-7 text-neon" />
              </div>
              <div className="font-semibold">¡Listo, {slot}!</div>
              <p className="text-xs text-muted-foreground mt-1">Mostrá este QR al ingresar</p>
              <div className="mt-4 mx-auto h-32 w-32 rounded-xl bg-white grid place-items-center">
                <QrCode className="h-24 w-24 text-black" />
              </div>
            </div>
          )}
        </div>
      </div>
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
