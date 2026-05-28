import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { apiClient } from "@/shared/api/apiClient";
import { Court } from "@/entities/types";
import { Star, MapPin, Check, QrCode } from "lucide-react";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/app/courts")({
  head: () => ({ meta: [{ title: "Reservas — SportMatch" }] }),
  loader: async () => apiClient.courts.getAll(),
  component: Courts,
});

const SLOTS = ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "19:00", "20:00", "21:00"];

function Courts() {
  const courts = Route.useLoaderData() as Court[];
  const [selected, setSelected] = useState<Court | null>(null);
  const [slot, setSlot] = useState<string | null>("19:00");
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (courts.length > 0 && !selected) {
      setSelected(courts[0]);
    }
  }, [courts, selected]);

  if (!selected) {
    return (
      <div className="container mx-auto px-4 lg:px-8 py-8 animate-pulse bg-muted h-[560px] rounded-3xl" />
    );
  }

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
                        {c.distance_km} km
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
                    {c.amenities.map((a) => (
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
              <div className="text-xs text-muted-foreground mb-2">Hoy · Selecciona horario</div>
              <div className="grid grid-cols-3 gap-2">
                {SLOTS.map((s) => {
                  const taken = ["12:00", "16:00"].includes(s);
                  return (
                    <button
                      key={s}
                      disabled={taken}
                      onClick={() => setSlot(s)}
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
              <Row label="Dividir entre" value="4 jugadores" />
              <div className="flex justify-between font-semibold pt-2 border-t border-border">
                <span>Tu parte</span>
                <span className="text-neon">${((selected.price_per_hour + 3) / 4).toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={() => setConfirmed(true)}
              disabled={!slot}
              className="mt-5 w-full py-3 rounded-xl bg-gradient-primary text-primary-foreground font-semibold shadow-glow disabled:opacity-50"
            >
              {confirmed ? "Reserva confirmada ✓" : "Confirmar reserva"}
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
