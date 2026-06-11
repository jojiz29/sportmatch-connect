import { Link, useNavigate } from "@tanstack/react-router";
import {
  X,
  Info,
  MapPin,
  Sparkles,
  MessageSquare,
  Shield,
  TrendingUp,
  Users,
  Swords,
  Clock3,
  Check,
} from "lucide-react";
import { useMatchmaking } from "./useMatchmaking";
import { User, Match, Sport } from "@/entities/types";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useMemo } from "react";
import { useChatStore } from "@/features/chat/useChatStore";
import { useAuthStore } from "@/entities/user/useAuth";
import { useTranslation } from "react-i18next";
import { apiClient } from "@/shared/api/apiClient";
import { supabase } from "@/shared/api/supabase";
import { backendApi } from "@/shared/api/backendApi";
import { VerifiedBadge } from "@/shared/ui/VerifiedBadge";

export function MatchmakingFeature({ initialStack }: { initialStack: User[] }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.user);
  const [matchedUser, setMatchedUser] = useState<User | null>(null);
  const [matchMessage, setMatchMessage] = useState("");
  const [inspectedUser, setInspectedUser] = useState<User | null>(null);
  const [inspectedUserMatches, setInspectedUserMatches] = useState<Match[]>([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);
  const [challengeTarget, setChallengeTarget] = useState<User | null>(null);
  const [challengeMessage, setChallengeMessage] = useState("");
  const [, setPendingChallengeUserIds] = useState<string[]>([]);
  const [isSavingConnection, setIsSavingConnection] = useState(false);
  const [isSendingChallenge, setIsSendingChallenge] = useState(false);
  const [receivedChallenges, setReceivedChallenges] = useState<PlayerChallenge[]>([]);
  const [resolvingChallengeId, setResolvingChallengeId] = useState<string | null>(null);
  const [contactedUserIds, setContactedUserIds] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    if (!inspectedUser) {
      setInspectedUserMatches([]);
      return;
    }

    setIsLoadingMatches(true);

    // Try backend first for user matches, fallback to Supabase
    backendApi.matches
      .getAll()
      .then((backendMatches) => {
        if (active) {
          const userMatches = (backendMatches as Match[]).filter(
            (m) => m.creator_id === inspectedUser.id,
          );
          setInspectedUserMatches(userMatches);
        }
      })
      .catch(() => {
        apiClient.matches
          .getUserMatches(inspectedUser.id)
          .then((data) => {
            if (active) {
              setInspectedUserMatches(data);
            }
          })
          .catch((err) => {
            console.error("Error loading inspected user matches:", err);
          });
      })
      .finally(() => {
        if (active) {
          setIsLoadingMatches(false);
        }
      });

    return () => {
      active = false;
    };
  }, [inspectedUser]);

  const { stack, isLoading, swipe } = useMatchmaking(initialStack, (user) => {
    setMatchedUser(user);
  });

  const preferredSports = currentUser?.preferred_sports || ["Fútbol"];
  const [activeSport, setActiveSport] = useState<string>("Todos");

  const filteredStack = useMemo(() => {
    // Cuando el usuario ya envió una acción de conexión, retiramos ese candidato
    // del carrusel para continuar con la siguiente recomendación.
    const availableStack = stack.filter((candidate) => !contactedUserIds.includes(candidate.id));
    if (activeSport === "Todos") return availableStack;

    return availableStack.filter((p) => {
      const matrix = p.sport_preferences?.sports_matrix;
      if (matrix) {
        return !!matrix[activeSport];
      }
      return p.preferred_sports?.includes(activeSport as Sport);
    });
  }, [stack, activeSport, contactedUserIds]);

  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

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
          console.warn(
            "Geolocation API unavailable or permission denied for matchmaking.",
            error.message,
          );
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 },
      );
    }
  }, []);

  const baseLocation = useMemo(() => {
    if (userCoords) return userCoords;
    if (currentUser && currentUser.last_location_lat && currentUser.last_location_lng) {
      return { lat: currentUser.last_location_lat, lng: currentUser.last_location_lng };
    }
    return null;
  }, [userCoords, currentUser]);

  // Recalculate after the sport or location changes so the visible order always reflects
  // the same compatibility values shown in the card and detail panel.
  const rankedStack = useMemo(
    () =>
      currentUser
        ? rankMatchCandidates(currentUser, filteredStack, {
            activeSport: activeSport === "Todos" ? undefined : activeSport,
            currentLocation: baseLocation,
          })
        : [],
    [activeSport, baseLocation, currentUser, filteredStack],
  );

  const topRecommendation = rankedStack[0];
  const challengeSport =
    rankedStack.find((recommendation) => recommendation.user.id === challengeTarget?.id)
      ?.matchedSport ??
    (activeSport === "Todos" ? challengeTarget?.preferred_sports?.[0] : activeSport);
  useEffect(() => {
    if (!currentUser) return;
    let active = true;

    // Restauramos pendientes del deporte activo para mantener el estado entre recargas.
    getPendingChallengesSent(currentUser.id)
      .then((challenges) => {
        if (active) {
          setPendingChallengeUserIds(
            challenges
              .filter((challenge) => activeSport === "Todos" || challenge.sport === activeSport)
              .map((challenge) => challenge.challenged_id),
          );
          setContactedUserIds((current) =>
            Array.from(
              new Set([...current, ...challenges.map((challenge) => challenge.challenged_id)]),
            ),
          );
        }
      })
      .catch((error) => {
        console.error("Error al cargar desafíos pendientes:", error);
      });

    return () => {
      active = false;
    };
  }, [activeSport, currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    let active = true;

    // La bandeja muestra únicamente solicitudes que todavía requieren respuesta.
    getPendingChallengesReceived(currentUser.id)
      .then((challenges) => {
        if (active) setReceivedChallenges(challenges);
      })
      .catch((error) => console.error("Error al cargar desafíos recibidos:", error));

    return () => {
      active = false;
    };
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser || useAuthStore.getState().isDemoMode) return;

    // El primer usuario también recibe el modal cuando la otra persona completa el match.
    const channel = supabase
      .channel(`mutual-matches-${currentUser.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "player_connections",
          filter: `connected_user_id=eq.${currentUser.id}`,
        },
        async (payload) => {
          const incomingUserId = (payload.new as { user_id: string }).user_id;
          const { data: ownConnection } = await supabase
            .from("player_connections")
            .select("id")
            .eq("user_id", currentUser.id)
            .eq("connected_user_id", incomingUserId)
            .maybeSingle();
          if (!ownConnection) return;

          await supabase.rpc("create_direct_conversation", { other_user_id: incomingUserId });
          const matched =
            stack.find((candidate) => candidate.id === incomingUserId) ||
            (await apiClient.users.getMatches()).find(
              (candidate) => candidate.id === incomingUserId,
            );
          if (matched) {
            setMatchedUser(matched);
            setMatchMessage("");
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, stack]);

  useEffect(() => {
    if (!currentUser) return;
    let active = true;

    // Las conexiones guardadas no vuelven a mostrarse en el carrusel después de recargar.
    getPlayerConnections(currentUser.id)
      .then((connections) => {
        if (active) {
          setContactedUserIds((current) =>
            Array.from(
              new Set([
                ...current,
                ...connections.map((connection) => connection.connected_user_id),
              ]),
            ),
          );
        }
      })
      .catch((error) => console.error("Error al cargar conexiones deportivas:", error));

    return () => {
      active = false;
    };
  }, [currentUser]);

  const handleConnect = async (target: User) => {
    if (!currentUser || isSavingConnection) return;
    const recommendation = rankedStack.find((item) => item.user.id === target.id);

    try {
      setIsSavingConnection(true);
      const result = await createPlayerConnection({
        userId: currentUser.id,
        connectedUserId: target.id,
        sport:
          recommendation?.matchedSport ??
          (activeSport === "Todos" ? target.preferred_sports?.[0] : activeSport),
        compatibilityScore: recommendation?.score ?? null,
      });

      // Retirar la tarjeta produce el avance inmediato al siguiente recomendado.
      setContactedUserIds((current) =>
        current.includes(target.id) ? current : [...current, target.id],
      );
      if (result.isMutualMatch) {
        setMatchedUser(target);
        setMatchMessage("");
        toast.success("Nueva conexión deportiva", {
          description: `${target.name} también quiere conectar contigo.`,
        });
      } else {
        toast.success("Solicitud de conexión enviada", {
          description: `Te avisaremos cuando ${target.name} también quiera conectar.`,
        });
      }
    } catch (error) {
      console.error("Error al guardar conexión deportiva:", error);
      const description =
        error instanceof Error && error.message.includes("límite")
          ? "Supabase no respondió a tiempo. Recarga la página e inténtalo nuevamente."
          : "No se pudo guardar la conexión con tu sesión actual.";
      toast.error("No se pudo guardar la conexión", {
        description,
      });
    } finally {
      setIsSavingConnection(false);
    }
  };

  const handleSendChallenge = async () => {
    if (!challengeTarget || !currentUser || !challengeSport) return;

    try {
      setIsSendingChallenge(true);
      await createPlayerChallenge({
        challengerId: currentUser.id,
        challengedId: challengeTarget.id,
        sport: challengeSport,
        message: challengeMessage,
      });
      setPendingChallengeUserIds((current) =>
        current.includes(challengeTarget.id) ? current : [...current, challengeTarget.id],
      );
      setContactedUserIds((current) =>
        current.includes(challengeTarget.id) ? current : [...current, challengeTarget.id],
      );
      toast.success("Desafío enviado", {
        description: `${challengeTarget.name} recibió tu desafío de ${challengeSport}.`,
      });
      setChallengeTarget(null);
      setChallengeMessage("");
    } catch (error) {
      console.error("Error al enviar desafío:", error);
      toast.error("No se pudo enviar el desafío", {
        description: "Verifica que la migración de desafíos esté aplicada en Supabase.",
      });
    } finally {
      setIsSendingChallenge(false);
    }
  };

  const handleChallengeResponse = async (
    challenge: PlayerChallenge,
    decision: "accepted" | "rejected",
  ) => {
    if (!currentUser) return;

    try {
      setResolvingChallengeId(challenge.id);
      await respondToPlayerChallenge(challenge.id, currentUser.id, decision);
      setReceivedChallenges((current) => current.filter((item) => item.id !== challenge.id));

      if (decision === "accepted") {
        // Aceptar conecta a ambos jugadores inmediatamente para que puedan coordinar.
        const chatStore = useChatStore.getState();
        const chatId = await chatStore.createChat(challenge.challenger_id);
        await chatStore.sendMessage(
          chatId,
          `Acepté tu desafío de ${challenge.sport}. Coordinemos el partido.`,
        );
        chatStore.setActiveConversation(chatId);
        toast.success("Desafío aceptado", {
          description: "Abrimos el chat para coordinar el partido.",
        });
        navigate({ to: "/app/chat" });
      } else {
        toast.info("Desafío rechazado");
      }
    } catch (error) {
      console.error("Error al responder desafío:", error);
      toast.error("No se pudo responder el desafío");
    } finally {
      setResolvingChallengeId(null);
    }
  };

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      {/* Sport Selector Tabs */}
      <div className="lg:col-span-3 flex flex-wrap gap-2 mb-2 p-1.5 bg-background/40 border border-border/60 rounded-2xl animate-fade-in">
        {Array.from(new Set(["Todos", ...preferredSports])).map((sport) => {
          const isFilterActive = activeSport === sport;
          return (
            <button
              key={sport}
              onClick={() => setActiveSport(sport)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                isFilterActive
                  ? "bg-[#39FF14] text-black border-transparent shadow-[0_0_10px_rgba(57,255,20,0.3)]"
                  : "bg-white/5 text-white/70 border-white/10 hover:bg-white/10"
              }`}
            >
              {sport}
            </button>
          );
        })}
      </div>

      <div className="lg:col-span-2 flex justify-center">
        <div className="relative w-full max-w-md h-[560px]">
          {isLoading ? (
            <div className="absolute inset-0 bg-muted animate-pulse rounded-3xl" />
          ) : rankedStack.length === 0 ? (
            <div className="absolute inset-0 grid place-items-center bg-gradient-card border border-border rounded-3xl">
              <div className="text-center">
                <Sparkles className="h-10 w-10 mx-auto text-neon mb-3" />
                <div className="font-semibold">{t("matchmaking.empty_stack")}</div>
              </div>
            </div>
          ) : (
            <AnimatePresence>
              {rankedStack
                .slice(0, 3)
                .reverse()
                .map((recommendation, i, arr) => {
                  const p = recommendation.user;
                  const idx = arr.length - 1 - i;
                  const isTop = idx === 0;
                  const dist = recommendation.distanceKm ?? p.distance_km ?? null;

                  return (
                    <motion.div
                      key={p.id}
                      drag={isTop ? "x" : false}
                      dragConstraints={{ left: 0, right: 0 }}
                      dragElastic={1}
                      onDragEnd={(e, info) => {
                        if (info.offset.x > 100) void handleConnect(p);
                        else if (info.offset.x < -100) swipe(p.id, "pass");
                      }}
                      className="absolute inset-0 bg-gradient-card border border-border rounded-3xl shadow-card overflow-hidden transition-all cursor-grab active:cursor-grabbing"
                      style={{
                        transform: `translateY(${idx * 12}px) scale(${1 - idx * 0.03})`,
                        zIndex: 10 - idx,
                        opacity: 1 - idx * 0.1,
                      }}
                      animate={isTop ? { x: 0, rotate: 0 } : undefined}
                      exit={{ x: isTop ? 200 : 0, opacity: 0, transition: { duration: 0.2 } }}
                      whileDrag={{ rotate: 5, scale: 1.05 }}
                    >
                      {/* ── HEADER BADGES ── */}
                      <div className="flex items-center justify-between px-5 pt-5 pb-2 z-10 relative">
                        {/* La compatibilidad representa recomendación, no un match confirmado. */}
                        <span className="px-3 py-1.5 rounded-lg bg-[#39FF14]/15 border border-[#39FF14]/35 text-[#39FF14] text-[11px] font-black uppercase tracking-widest font-mono shadow-[0_0_8px_rgba(57,255,20,0.25)]">
                          {recommendation.score}% COMPATIBLE
                        </span>
                        {/* Top-Right: Grey Trust Score badge */}
                        <span className="px-2.5 py-1 rounded-full bg-white/8 border border-white/12 text-white/80 text-[10px] font-semibold backdrop-blur-sm">
                          {p.trust_score || 0}% Trust Score
                        </span>
                      </div>

                      {/* ── AVATAR with World Cup gradient ring & status dot ── */}
                      <div className="flex justify-center items-center py-4 relative z-10">
                        {/* Gradient aura glow */}
                        <div className="absolute h-[136px] w-[136px] rounded-full bg-gradient-to-br from-[#FF007F] to-[#7B2CBF] opacity-30 blur-lg pointer-events-none" />
                        {/* Thick gradient ring */}
                        <div
                          className="h-[130px] w-[130px] rounded-full p-[3px] relative flex items-center justify-center"
                          style={{
                            background: "linear-gradient(135deg, #FF007F, #FF6B35, #7B2CBF)",
                          }}
                        >
                          {/* Inner avatar */}
                          <div className="h-full w-full rounded-full overflow-hidden border-2 border-[#0D152D] bg-[#1A2544]">
                            <Link
                              to="/app/profile/$userId"
                              params={{ userId: p.id }}
                              className="block h-full w-full"
                            >
                              <img
                                src={p.avatar_url}
                                alt={p.name}
                                className="w-full h-full object-cover"
                              />
                            </Link>
                          </div>
                          {/* Glowing active status dot */}
                          <span
                            className="absolute bottom-1.5 right-1.5 h-5 w-5 rounded-full bg-[#39FF14] border-[3px] border-[#0D152D] flex items-center justify-center"
                            style={{ boxShadow: "0 0 6px 2px rgba(57,255,20,0.6)" }}
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                          </span>
                        </div>
                      </div>

                      {/* ── PROFILE INFO ── */}
                      <div className="px-5 pb-2 space-y-2 z-10 relative">
                        {/* Name + age */}
                        <div className="flex items-baseline justify-center gap-2 text-center">
                          <h2 className="text-xl font-black text-foreground flex items-center justify-center gap-1.5">
                            {p.company_name || p.name || t("matchmaking.user_default")}
                            {p.dni_verificado && <VerifiedBadge />}
                          </h2>
                          {p.user_role !== "BUSINESS" && (
                            <span className="text-sm font-semibold text-muted-foreground">
                              {p.age || "?"}a
                            </span>
                          )}
                        </div>

                        {/* Sport / Level / Distance capsule badges */}
                        {(() => {
                          const matrix = p.sport_preferences?.sports_matrix;
                          const sportLevel = matrix?.[activeSport]?.level || p.level;
                          const displayLevel =
                            sportLevel === "Amateur"
                              ? t("skills.amateur", "Amateur")
                              : sportLevel === "Intermediate" || sportLevel === "Intermedio"
                                ? t("skills.intermedio", "Intermedio")
                                : sportLevel === "Advanced" || sportLevel === "Avanzado"
                                  ? t("skills.avanzado", "Avanzado")
                                  : sportLevel === "Pro"
                                    ? t("skills.pro", "Pro")
                                    : sportLevel;
                          return (
                            <div className="flex flex-wrap justify-center gap-1.5">
                              <span className="px-2.5 py-1 rounded-md bg-[#FF6B35]/15 border border-[#FF6B35]/30 text-[#FF6B35] text-[10px] font-extrabold uppercase tracking-wide">
                                {recommendation.matchedSport || activeSport}
                              </span>
                              <span className="px-2.5 py-1 rounded-md bg-violet-500/15 border border-violet-500/30 text-violet-500 dark:text-violet-300 text-[10px] font-bold">
                                {displayLevel}
                              </span>
                              <span className="px-2.5 py-1 rounded-md bg-muted border border-border text-foreground/75 text-[10px] font-medium flex items-center gap-1">
                                <MapPin className="h-2.5 w-2.5 text-[#39FF14]" />{" "}
                                {dist == null ? p.city || "Sin ubicación" : `${dist.toFixed(1)} km`}
                              </span>
                            </div>
                          );
                        })()}

                        {/* Bio italic */}
                        {p.bio && (
                          <p className="text-xs text-muted-foreground leading-relaxed italic text-center line-clamp-2 px-2">
                            "{p.bio}"
                          </p>
                        )}

                        {/* Hashtag pills from trust_score tiers */}
                        <div className="flex flex-wrap justify-center gap-1 pt-0.5">
                          {(p.trust_score || 0) >= 90 && (
                            <span className="text-[9px] px-2 py-0.5 rounded bg-[#39FF14]/10 border border-[#39FF14]/15 text-[#39FF14]/80 font-semibold">
                              #Confiable
                            </span>
                          )}
                          {(p.trust_score || 0) >= 80 && (
                            <span className="text-[9px] px-2 py-0.5 rounded bg-muted border border-border text-muted-foreground font-semibold">
                              #BuenNivel
                            </span>
                          )}
                          <span className="text-[9px] px-2 py-0.5 rounded bg-muted border border-border text-muted-foreground font-semibold">
                            #Puntual
                          </span>
                        </div>
                      </div>

                      {/* ── ACTION BUTTONS (always shown for top card) ── */}
                      {isTop && (
                        <div className="flex items-center justify-center gap-5 px-5 pt-3 pb-5 border-t border-border/40 mt-auto">
                          {/* Dislike / Pass */}
                          <button
                            onClick={() => swipe(p.id, "pass")}
                            className="h-14 w-14 rounded-full border border-red-500/30 bg-red-500/8 hover:bg-red-500/20 active:scale-90 text-red-400 flex items-center justify-center transition-all duration-200 cursor-pointer shadow-lg"
                            aria-label={t("matchmaking.keep_swiping")}
                          >
                            <X className="h-6 w-6" />
                          </button>
                          {/* Info / View Profile */}
                          <button
                            onClick={() => setInspectedUser(p)}
                            className="h-10 w-10 rounded-full border border-border bg-muted/80 hover:bg-muted active:scale-95 text-foreground/75 flex items-center justify-center transition-all duration-200 cursor-pointer"
                            aria-label={t("matchmaking.view_profile")}
                          >
                            <Info className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => void handleConnect(p)}
                            disabled={isSavingConnection}
                            className="h-14 px-5 rounded-full border border-[#39FF14]/35 bg-[#39FF14]/10 hover:bg-[#39FF14]/22 active:scale-90 text-[#39FF14] flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer shadow-[0_0_12px_rgba(57,255,20,0.25)]"
                            aria-label={`Conectar con ${p.name}`}
                          >
                            <Users className="h-5 w-5" />
                            <span className="text-xs font-bold">Conectar</span>
                          </button>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
            </AnimatePresence>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-gradient-card border border-border rounded-2xl p-5">
          <h3 className="font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-neon" /> {t("matchmaking.compatibility")}
          </h3>
          {topRecommendation && (
            <div className="mt-4 space-y-3">
              <Bar
                label={topRecommendation.matchedSport || activeSport}
                value={topRecommendation.breakdown.sport}
              />
              <Bar label={t("matchmaking.level")} value={topRecommendation.breakdown.level} />
              <Bar
                label={t("matchmaking.schedule")}
                value={topRecommendation.breakdown.availability}
              />
              <Bar label={t("matchmaking.distance")} value={topRecommendation.breakdown.location} />
              <Bar label={t("matchmaking.reputation")} value={topRecommendation.breakdown.trust} />
            </div>
          )}
        </div>

        {/* La bandeja solo ocupa espacio cuando existe una solicitud que responder. */}
        {receivedChallenges.length > 0 && (
          <div className="bg-gradient-card border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Swords className="h-4 w-4 text-primary" /> Desafíos recibidos
              </h3>
              <span className="h-5 min-w-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold grid place-items-center">
                {receivedChallenges.length}
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {receivedChallenges.map((challenge) => {
                const challenger =
                  challenge.challenger ||
                  stack.find((candidate) => candidate.id === challenge.challenger_id);
                const isResolving = resolvingChallengeId === challenge.id;

                return (
                  <div
                    key={challenge.id}
                    className="rounded-2xl border border-border/70 bg-background/50 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={challenger?.avatar_url || ""}
                        alt={challenger?.name || "Jugador"}
                        className="h-10 w-10 rounded-full bg-muted object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm truncate">
                          {challenger?.name || "Jugador"}
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          Te desafió a jugar {challenge.sport}
                        </div>
                      </div>
                    </div>

                    {challenge.message && (
                      <p className="mt-3 text-xs text-muted-foreground italic leading-relaxed">
                        “{challenge.message}”
                      </p>
                    )}

                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <button
                        onClick={() => handleChallengeResponse(challenge, "rejected")}
                        disabled={isResolving}
                        className="py-2 rounded-xl border border-red-500/25 bg-red-500/5 text-red-400 text-xs font-semibold hover:bg-red-500/10 cursor-pointer disabled:opacity-50"
                      >
                        Rechazar
                      </button>
                      <button
                        onClick={() => handleChallengeResponse(challenge, "accepted")}
                        disabled={isResolving}
                        className="py-2 rounded-xl bg-neon text-neon-foreground text-xs font-bold flex items-center justify-center gap-1.5 hover:shadow-neon cursor-pointer disabled:opacity-50"
                      >
                        {isResolving ? (
                          <Clock3 className="h-3.5 w-3.5 animate-pulse" />
                        ) : (
                          <Check className="h-3.5 w-3.5" />
                        )}
                        Aceptar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Vista previa del desafío. La persistencia real se agregará en la siguiente etapa. */}
      <AnimatePresence>
        {challengeTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/90 backdrop-blur-md"
              onClick={() => setChallengeTarget(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 24 }}
              className="relative z-10 w-full max-w-md bg-gradient-card border border-border rounded-3xl p-6 shadow-card"
            >
              <button
                onClick={() => setChallengeTarget(null)}
                className="absolute top-4 right-4 h-8 w-8 rounded-full bg-muted hover:bg-accent grid place-items-center cursor-pointer"
                aria-label="Cerrar desafío"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-3 pr-10">
                <div className="h-12 w-12 rounded-2xl bg-primary/15 border border-primary/30 grid place-items-center">
                  <Swords className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="text-[10px] text-primary font-bold uppercase tracking-wider">
                    Nuevo desafío
                  </div>
                  <h2 className="text-xl font-bold">Desafiar a {challengeTarget.name}</h2>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-border bg-background/50 p-4 flex items-center gap-3">
                <img
                  src={challengeTarget.avatar_url}
                  alt={challengeTarget.name}
                  className="h-12 w-12 rounded-full bg-muted object-cover"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{challengeTarget.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {challengeSport} · Nivel {challengeTarget.level}
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-neon/10 border border-neon/20 text-neon text-xs font-bold">
                  {topRecommendation?.user.id === challengeTarget.id
                    ? `${topRecommendation.score}% match`
                    : challengeSport}
                </span>
              </div>

              <label className="block mt-5">
                <span className="text-xs font-semibold">Mensaje opcional</span>
                <textarea
                  value={challengeMessage}
                  onChange={(event) => setChallengeMessage(event.target.value)}
                  maxLength={240}
                  rows={3}
                  placeholder={`Hola ${challengeTarget.name}, ¿jugamos ${challengeSport}?`}
                  className="mt-2 w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-primary"
                />
                <span className="block text-right text-[10px] text-muted-foreground mt-1">
                  {challengeMessage.length}/240
                </span>
              </label>

              <div className="grid grid-cols-2 gap-3 mt-5">
                <button
                  onClick={() => setChallengeTarget(null)}
                  className="py-3 rounded-xl border border-border bg-muted/60 text-sm font-semibold hover:bg-muted cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSendChallenge}
                  disabled={isSendingChallenge}
                  className="py-3 rounded-xl bg-gradient-primary text-primary-foreground text-sm font-bold flex items-center justify-center gap-2 shadow-glow hover:scale-[1.01] cursor-pointer disabled:opacity-60 disabled:pointer-events-none"
                >
                  {isSendingChallenge ? (
                    <>
                      <Clock3 className="h-4 w-4 animate-pulse" /> Enviando...
                    </>
                  ) : (
                    <>
                      <Swords className="h-4 w-4" /> Enviar desafío
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Match Overlay Modal */}
      <AnimatePresence>
        {matchedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/90 backdrop-blur-md"
              onClick={() => setMatchedUser(null)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 50 }}
              className="relative w-full max-w-md bg-gradient-card border border-border rounded-3xl p-8 text-center shadow-card overflow-hidden z-10"
            >
              {/* Background glows */}
              <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-neon/20 blur-3xl" />
              <div className="absolute -left-20 -bottom-20 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />

              <div className="text-neon text-xs font-bold uppercase tracking-wider mb-2 animate-pulse">
                {t("matchmaking.its_a_match")}
              </div>
              <h2 className="text-3xl font-extrabold bg-gradient-neon bg-clip-text text-transparent mb-6">
                {t("matchmaking.sport_connection")}
              </h2>

              <div className="flex items-center justify-center gap-6 mb-8 relative">
                {/* Current User Avatar */}
                <div className="relative">
                  <img
                    src={currentUser?.avatar_url}
                    alt=""
                    className="h-24 w-24 rounded-full bg-muted object-cover border-4 border-primary shadow-glow animate-bounce-slow"
                  />
                  <span className="absolute -bottom-2 right-2 px-2 py-0.5 rounded-full bg-primary text-white text-[10px] font-bold">
                    {t("matchmaking.me")}
                  </span>
                </div>

                {/* Las espadas representan una conexión para competir o jugar juntos. */}
                <div className="relative z-10 h-12 w-12 rounded-full bg-gradient-neon flex items-center justify-center shadow-neon animate-pulse">
                  <Swords className="h-6 w-6 text-neon-foreground" />
                </div>

                {/* Matched User Avatar */}
                <div className="relative">
                  <img
                    src={matchedUser.avatar_url}
                    alt=""
                    className="h-24 w-24 rounded-full bg-muted object-cover border-4 border-neon shadow-neon animate-bounce-slow delay-150"
                  />
                  <span className="absolute -bottom-2 left-2 px-2 py-0.5 rounded-full bg-neon text-neon-foreground text-[10px] font-bold">
                    {matchedUser.name}
                  </span>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-6">
                {t("matchmaking.match_desc", {
                  name: matchedUser.name,
                  sport: matchedUser.preferred_sports?.[0] || t("matchmaking.sport_default"),
                })}
              </p>

              <textarea
                value={matchMessage}
                onChange={(event) => setMatchMessage(event.target.value)}
                maxLength={240}
                rows={3}
                placeholder={`Hola ${matchedUser.name}, ¿coordinamos para jugar?`}
                className="relative z-10 mb-3 w-full resize-none rounded-xl border border-border bg-background/70 px-3 py-2 text-sm text-left focus:outline-none focus:border-neon"
              />

              <div className="flex flex-col gap-2">
                <button
                  onClick={async () => {
                    // El match mutuo comparte una única conversación persistente.
                    try {
                      const chatStore = useChatStore.getState();
                      const chatId = await chatStore.createChat(matchedUser.id);
                      if (!chatId) throw new Error("No se obtuvo un chatId persistente.");
                      await chatStore.sendMessage(
                        chatId,
                        matchMessage.trim() || `Hola ${matchedUser.name}, ¿coordinamos para jugar?`,
                      );
                      chatStore.setActiveConversation(chatId);
                      setMatchedUser(null);
                      navigate({ to: "/app/chat" });
                    } catch (error) {
                      console.error("[chat] match-greeting:error", {
                        targetUserId: matchedUser.id,
                        error,
                      });
                      toast.error("No se pudo abrir el chat del match");
                    }
                  }}
                  className="w-full py-3 rounded-xl bg-gradient-primary text-primary-foreground font-bold hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-glow flex items-center justify-center gap-2 cursor-pointer"
                >
                  <MessageSquare className="h-4 w-4" /> Enviar saludo y abrir chat
                </button>
                <button
                  onClick={async () => {
                    const chatStore = useChatStore.getState();
                    const chatId = await chatStore.createChat(matchedUser.id);
                    if (!chatId) {
                      toast.error("No se pudo abrir el chat del match");
                      return;
                    }
                    chatStore.setActiveConversation(chatId);
                    setMatchedUser(null);
                    navigate({ to: "/app/chat" });
                  }}
                  className="w-full py-3 rounded-xl border border-neon/30 bg-neon/10 text-neon text-sm font-semibold hover:bg-neon/15 cursor-pointer"
                >
                  Abrir chat sin enviar mensaje
                </button>
                <button
                  onClick={() => setMatchedUser(null)}
                  className="w-full py-3 rounded-xl glass border border-border text-sm font-semibold hover:bg-accent transition-colors cursor-pointer"
                >
                  {t("matchmaking.keep_swiping")}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Inspected User Profile Modal */}
      <AnimatePresence>
        {inspectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/90 backdrop-blur-md"
              onClick={() => setInspectedUser(null)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 50 }}
              className="relative w-full max-w-2xl bg-gradient-card border border-border rounded-3xl p-6 md:p-8 shadow-card overflow-y-auto max-h-[90vh] z-10 worldcup-card"
            >
              {/* Background glows */}
              <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-gradient-primary opacity-20 blur-3xl" />
              <div className="absolute -left-20 -bottom-20 h-56 w-56 rounded-full bg-neon/10 blur-3xl" />

              <button
                onClick={() => setInspectedUser(null)}
                className="absolute top-4 right-4 p-2 rounded-full glass hover:bg-accent transition-colors cursor-pointer"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>

              <div className="flex flex-wrap md:flex-nowrap items-start gap-6 relative mb-6">
                <div className="relative shrink-0">
                  <img
                    src={inspectedUser.avatar_url}
                    alt={inspectedUser.name}
                    className="h-24 w-24 rounded-2xl bg-muted ring-4 ring-primary/30 object-cover"
                  />
                  <div className="absolute -bottom-2 -right-2 px-2 py-1 rounded-full bg-gradient-neon text-neon-foreground text-xs font-bold">
                    {inspectedUser.level}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl font-bold text-gradient flex items-center gap-1.5">
                    {inspectedUser.name}
                    {inspectedUser.dni_verificado && <VerifiedBadge />}
                  </h2>
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <MapPin className="h-3 w-3" />
                    {inspectedUser.city} · {t("profile.age_label", { age: inspectedUser.age })}
                  </p>
                  <p className="text-sm mt-2 font-light">
                    {inspectedUser.bio || t("register.default_player_bio")}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {inspectedUser.preferred_sports?.map((s) => (
                      <span
                        key={s}
                        className="px-3 py-1 rounded-full bg-violet/20 text-xs border border-violet/30"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <Stat
                  icon={<TrendingUp className="h-4 w-4 text-electric" />}
                  label={t("profile.matches")}
                  value={inspectedUser.matches_played ?? 0}
                />
                <Stat
                  icon={<Shield className="h-4 w-4 text-neon" />}
                  label={t("profile.trust_score")}
                  value={`${inspectedUser.trust_score ?? 0}%`}
                />
                <Stat
                  icon={<Users className="h-4 w-4 text-neon" />}
                  label={t("profile.followers")}
                  value={inspectedUser.followers_count ?? 0}
                />
                <Stat
                  icon={<Users className="h-4 w-4 text-electric" />}
                  label={t("profile.following")}
                  value={inspectedUser.following_count ?? 0}
                />
              </div>

              {/* Trust Score & Sports History */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="glass rounded-2xl p-4">
                  <h3 className="font-semibold flex items-center gap-2 text-sm mb-3">
                    <Shield className="h-4 w-4 text-neon" /> {t("profile.trust_score")}
                  </h3>
                  <div className="mt-2 text-center">
                    <div className="text-4xl font-extrabold text-gradient">
                      {inspectedUser.trust_score ?? 0}%
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {(inspectedUser.trust_score || 0) >= 90
                        ? t("profile.trust_level_excellent")
                        : (inspectedUser.trust_score || 0) >= 70
                          ? t("profile.trust_level_good")
                          : t("profile.trust_level_risk")}
                    </div>
                  </div>
                  <div className="mt-4 space-y-2 text-xs">
                    <Metric label={t("profile.punctuality")} value={98} />
                    <Metric label={t("profile.attendance")} value={94} />
                    <Metric label={t("profile.cancellations")} value={88} />
                    <Metric label={t("profile.behavior")} value={92} />
                  </div>
                </div>

                <div className="glass rounded-2xl p-4">
                  <h3 className="font-semibold text-sm mb-3">{t("profile.recent_history")}</h3>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                    {isLoadingMatches ? (
                      <div className="space-y-2">
                        <div className="h-10 w-full bg-muted animate-pulse rounded-lg" />
                        <div className="h-10 w-full bg-muted animate-pulse rounded-lg" />
                      </div>
                    ) : inspectedUserMatches.length > 0 ? (
                      inspectedUserMatches.map((m) => (
                        <div
                          key={m.id}
                          className="flex items-center gap-3 text-xs p-2 rounded-xl hover:bg-accent/50 transition-colors border border-border/20"
                        >
                          <div className="h-7 w-7 rounded-lg bg-gradient-primary grid place-items-center text-[10px] font-bold">
                            {m.sport.slice(0, 2)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{m.title}</div>
                            <div className="text-[10px] text-muted-foreground">
                              {new Date(m.date).toLocaleDateString()}
                            </div>
                          </div>
                          <span
                            className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                              m.status === "Finished"
                                ? "bg-muted text-muted-foreground"
                                : m.status === "IN_PROGRESS"
                                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                  : "bg-primary/20 text-primary-foreground border border-primary/30"
                            }`}
                          >
                            {m.status === "Finished"
                              ? t("profile.status_finished", { defaultValue: "Finalizado" })
                              : m.status === "IN_PROGRESS"
                                ? t("profile.status_in_progress", { defaultValue: "En Curso" })
                                : t("profile.status_open", { defaultValue: "Abierto" })}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-xs text-muted-foreground">
                        {t("profile.no_matches_yet")}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="glass rounded-xl p-3 text-center">
      <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
        {icon} <span>{label}</span>
      </div>
      <div className="text-lg font-bold mt-1">{value}</div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-[10px]">
        <span className="text-muted-foreground">{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-1 rounded-full bg-muted mt-1 overflow-hidden">
        <div className="h-full bg-gradient-primary" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function Bar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold">{Math.round(value)}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className="h-full bg-gradient-primary" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
