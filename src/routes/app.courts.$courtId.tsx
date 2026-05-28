import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Star, MapPin, Calendar as CalendarIcon, Clock, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Court } from "@/entities/types";
import { supabase } from "@/shared/api/supabase";

export const Route = createFileRoute("/app/courts/$courtId")({
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

const SLOTS = ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "19:00", "20:00", "21:00"];

function CourtDetail() {
  const court = Route.useLoaderData() as Court;
  const [slot, setSlot] = useState<string | null>(null);
  const [isBooking, setIsBooking] = useState(false);

  const handleBook = () => {
    setIsBooking(true);
    setTimeout(() => {
      setIsBooking(false);
      toast.success("¡Cancha reservada con éxito!", {
        description: `Te esperamos el día de hoy a las ${slot} hrs.`,
      });
      // Here we would normally mutate the calendar cache
    }, 1000);
  };

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
              <div className="text-sm text-white/80 flex items-center gap-4 mt-2">
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {court.distance_km} km
                </span>
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-warning text-warning" />
                  {court.rating} ({court.reviews_count})
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-card border border-border rounded-2xl p-6 shadow-card">
            <h3 className="font-semibold mb-4">Comodidades</h3>
            <div className="flex flex-wrap gap-2">
              {court.amenities.map((a) => (
                <span key={a} className="px-3 py-1 rounded-xl bg-accent text-sm">
                  {a}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="bg-gradient-card border border-border rounded-3xl p-6 md:p-8 shadow-card sticky top-8">
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
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {SLOTS.map((s, i) => {
                    // Randomize some taken slots deterministically for mock
                    const taken = i % 3 === 0 || !court.is_available;
                    return (
                      <button
                        key={s}
                        disabled={taken}
                        onClick={() => setSlot(s)}
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
                    amigos después de reservar.
                  </span>
                </div>
                <button
                  disabled={!slot || isBooking}
                  onClick={handleBook}
                  className="w-full py-4 rounded-xl bg-gradient-primary text-primary-foreground font-bold shadow-glow disabled:opacity-50 disabled:shadow-none transition-all active:scale-[0.98]"
                >
                  {isBooking
                    ? "Procesando reserva..."
                    : slot
                      ? `Confirmar reserva para las ${slot}`
                      : "Selecciona un horario"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
