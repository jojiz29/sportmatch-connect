import { createFileRoute, Link } from "@tanstack/react-router";
import { MOCK_USERS } from "@/lib/mock";
import { ArrowLeft, Star, MapPin, Activity, Award } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { User } from "@/entities/types";

export const Route = createFileRoute("/app/match/$userId")({
  head: ({ loaderData }: { loaderData?: User }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Cargando perfil... — SportMatch" }],
      };
    }
    return {
      meta: [{ title: `Perfil de ${loaderData.name} — SportMatch` }],
    };
  },
  loader: ({ params }: { params: { userId: string } }) => {
    const user = MOCK_USERS.find((u) => u.id === params.userId);
    if (!user) throw new Error("Usuario no encontrado");
    return user;
  },
  component: UserProfileDetail,
});

function UserProfileDetail() {
  const user = Route.useLoaderData() as User;

  const handleInvite = () => {
    toast.success(`¡Invitación enviada a ${user.name}!`, {
      description: "Te notificaremos si acepta el reto.",
    });
  };

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8">
      <Link
        to="/app/match"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Volver al Matchmaking
      </Link>

      <div className="grid lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
        <div className="lg:col-span-1">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gradient-card border border-border rounded-3xl p-6 shadow-card text-center relative overflow-hidden"
          >
            <div className="absolute top-0 inset-x-0 h-32 bg-gradient-primary opacity-20" />
            <div className="relative">
              <img
                src={user.avatar_url}
                alt={user.name}
                className="h-32 w-32 rounded-full mx-auto border-4 border-card shadow-lg mb-4 bg-muted"
              />
              <h1 className="text-2xl font-bold">
                {user.name}, {user.age}
              </h1>
              <p className="text-muted-foreground text-sm mb-4 flex items-center justify-center gap-1">
                <MapPin className="h-4 w-4" /> {user.city} ({user.distance_km || 0} km)
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neon/10 text-neon text-sm font-semibold border border-neon/20 mb-6">
                <Star className="h-4 w-4 fill-neon" /> Trust Score: {user.trust_score}
              </div>
              <button
                onClick={handleInvite}
                className="w-full py-3 rounded-xl bg-gradient-primary text-primary-foreground font-bold shadow-glow hover:scale-105 transition-transform"
              >
                Invitar a jugar
              </button>
            </div>
          </motion.div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gradient-card border border-border rounded-3xl p-6 md:p-8 shadow-card">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-neon" /> Sobre mí
            </h2>
            <p className="text-muted-foreground">{user.bio}</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <div className="bg-gradient-card border border-border rounded-3xl p-6 shadow-card">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Award className="h-5 w-5 text-electric" /> Deportes y Nivel
              </h3>
              <div className="space-y-4">
                {user.preferred_sports.map((s) => (
                  <div key={s} className="flex items-center justify-between">
                    <span className="font-medium">{s}</span>
                    <span className="px-2 py-1 rounded-md bg-accent text-xs font-semibold">
                      {user.level}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-card border border-border rounded-3xl p-6 shadow-card">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Star className="h-5 w-5 text-warning" /> Historial Reciente
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <div className="h-2 w-2 rounded-full bg-neon" />
                  <span className="text-muted-foreground">Ganador Torneo Pádel Surco</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="h-2 w-2 rounded-full bg-muted-foreground" />
                  <span className="text-muted-foreground">Jugó 12 partidos este mes</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="h-2 w-2 rounded-full bg-muted-foreground" />
                  <span className="text-muted-foreground">Puntualidad perfecta (100%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
