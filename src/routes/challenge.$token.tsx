import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, Zap, Clock, MapPin, Loader2, AlertCircle, Check } from "lucide-react";
import { invitationService, type ChallengeInvitation } from "@/shared/api/invitationService";
import { useAuthStore } from "@/entities/user/useAuth";

export const Route = createFileRoute("/challenge/$token")({
  component: ChallengeLandingPage,
});

function useInvitation(token: string) {
  const [invitation, setInvitation] = useState<ChallengeInvitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    invitationService
      .getByToken(token)
      .then((data) => {
        if (!data) setError("Invitación no encontrada");
        else setInvitation(data);
      })
      .catch(() => setError("Error al cargar invitación"))
      .finally(() => setLoading(false));
  }, [token]);

  return { invitation, loading, error };
}

const SPORT_EMOJIS: Record<string, string> = {
  Fútbol: "⚽",
  Básquet: "🏀",
  Tenis: "🎾",
  Pádel: "🎾",
  Vóley: "🏐",
  Running: "🏃",
  Ciclismo: "🚴",
  Natación: "🏊",
};

function getSportEmoji(sport: string): string {
  return SPORT_EMOJIS[sport] || "⚽";
}

function ChallengeLandingPage() {
  const { token } = Route.useParams();
  const { invitation, loading, error } = useInvitation(token);
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);

  const isExpired =
    invitation?.status === "expired" ||
    (invitation?.expires_at && new Date(invitation.expires_at) < new Date());
  const isOwnChallenge = invitation?.challenger_id === user?.id;

  const handleAccept = async () => {
    if (!user) return;
    setAccepting(true);
    setAcceptError(null);
    const result = await invitationService.accept(token);
    if (result.success) {
      setAccepted(true);
      setTimeout(() => navigate({ to: "/app/chat" }), 2000);
    } else {
      setAcceptError("No se pudo aceptar el reto. Intenta de nuevo.");
    }
    setAccepting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Cargando invitación...</p>
        </div>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <AlertCircle className="h-16 w-16 mx-auto text-destructive mb-4" />
          <h1 className="text-2xl font-bold mb-2">Invitación no encontrada</h1>
          <p className="text-muted-foreground mb-6">
            {error || "El enlace es inválido o la invitación ya no existe."}
          </p>
          <Link
            to="/"
            className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold inline-block"
          >
            Ir a SportMatch
          </Link>
        </div>
      </div>
    );
  }

  if (accepted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="h-20 w-20 mx-auto rounded-full bg-neon/20 flex items-center justify-center mb-4"
          >
            <Check className="h-10 w-10 text-neon" />
          </motion.div>
          <h1 className="text-2xl font-bold mb-2">¡Reto aceptado!</h1>
          <p className="text-muted-foreground">Redirigiendo al chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background bg-gradient-to-b from-background to-background/80 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gradient-card border border-border/40 rounded-3xl p-8 shadow-2xl">
        {isExpired ? (
          <>
            <div className="text-center mb-6">
              <div className="h-16 w-16 mx-auto rounded-full bg-warning/20 flex items-center justify-center mb-4">
                <Clock className="h-8 w-8 text-warning" />
              </div>
              <h1 className="text-2xl font-bold">Reto expirado</h1>
              <p className="text-muted-foreground mt-2">Este reto ya no está disponible.</p>
            </div>
            <Link
              to="/"
              className="block w-full text-center px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold"
            >
              Ir a SportMatch
            </Link>
          </>
        ) : (
          <>
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">{getSportEmoji(invitation.sport)}</div>
              <h1 className="text-2xl font-bold">¡Te han retado!</h1>
            </div>

            {invitation.challenger && (
              <div className="flex items-center gap-3 p-4 bg-accent/30 rounded-2xl mb-4">
                <img
                  src={invitation.challenger.avatar_url || "/images/default-avatar.png"}
                  alt={invitation.challenger.name}
                  className="h-12 w-12 rounded-full bg-muted object-cover"
                />
                <div>
                  <p className="font-semibold">{invitation.challenger.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Nivel {invitation.challenger.level} · {invitation.challenger.label}
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-2 mb-6">
              <div className="flex items-center gap-2 text-sm">
                <Trophy className="h-4 w-4 text-primary" />
                <span className="font-semibold">{invitation.sport}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-accent text-muted-foreground">
                  {invitation.modality}
                </span>
              </div>
              {invitation.location && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{invitation.location}</span>
                </div>
              )}
              {invitation.message && (
                <p className="text-sm text-muted-foreground italic mt-2">"{invitation.message}"</p>
              )}
            </div>

            {isOwnChallenge ? (
              <p className="text-center text-sm text-muted-foreground p-3 bg-warning/10 rounded-xl">
                No puedes aceptar tu propio reto
              </p>
            ) : !user ? (
              <div className="space-y-3">
                <Link
                  to="/login"
                  search={{ redirect: `/challenge/${token}` } as Record<string, string>}
                  className="block w-full text-center px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all"
                >
                  Iniciar Sesión — Aceptar Reto
                </Link>
                <Link
                  to="/app/register"
                  search={{ ref: "challenge", token } as Record<string, string>}
                  className="block w-full text-center px-6 py-3 rounded-xl bg-accent text-foreground font-semibold hover:bg-accent/80 transition-all"
                >
                  Registrarme en SportMatch
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={handleAccept}
                  disabled={accepting}
                  className="w-full px-6 py-3 rounded-xl bg-neon text-neon-foreground font-bold hover:bg-neon/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 min-h-[48px]"
                >
                  {accepting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Zap className="h-5 w-5" />
                      Aceptar Reto
                    </>
                  )}
                </button>
                {acceptError && (
                  <p className="text-sm text-destructive text-center">{acceptError}</p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
