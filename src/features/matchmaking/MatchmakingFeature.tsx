import { Link, useNavigate } from "@tanstack/react-router";
import {
  Heart,
  X,
  Star,
  MapPin,
  Sparkles,
  MessageSquare,
  Shield,
  TrendingUp,
  Users,
} from "lucide-react";
import { useMatchmaking } from "./useMatchmaking";
import { User, Match } from "@/entities/types";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useMemo } from "react";
import { useChatStore } from "@/features/chat/useChatStore";
import { useAuthStore } from "@/entities/user/useAuth";
import { useTranslation } from "react-i18next";
import { calculateDistance } from "@/shared/api/geoService";
import { apiClient } from "@/shared/api/apiClient";

export function MatchmakingFeature({ initialStack }: { initialStack: User[] }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.user);
  const [matchedUser, setMatchedUser] = useState<User | null>(null);
  const [inspectedUser, setInspectedUser] = useState<User | null>(null);
  const [inspectedUserMatches, setInspectedUserMatches] = useState<Match[]>([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);

  useEffect(() => {
    let active = true;
    if (!inspectedUser) {
      setInspectedUserMatches([]);
      return;
    }

    setIsLoadingMatches(true);
    apiClient.matches
      .getUserMatches(inspectedUser.id)
      .then((data) => {
        if (active) {
          setInspectedUserMatches(data);
        }
      })
      .catch((err) => {
        console.error("Error loading inspected user matches:", err);
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
  const top = stack[0];

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

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 flex justify-center">
        <div className="relative w-full max-w-md h-[560px]">
          {isLoading ? (
            <div className="absolute inset-0 bg-muted animate-pulse rounded-3xl" />
          ) : stack.length === 0 ? (
            <div className="absolute inset-0 grid place-items-center bg-gradient-card border border-border rounded-3xl">
              <div className="text-center">
                <Sparkles className="h-10 w-10 mx-auto text-neon mb-3" />
                <div className="font-semibold">{t("matchmaking.empty_stack")}</div>
              </div>
            </div>
          ) : (
            <AnimatePresence>
              {stack
                .slice(0, 3)
                .reverse()
                .map((p, i, arr) => {
                  const idx = arr.length - 1 - i;
                  const isTop = idx === 0;
                  const dist =
                    baseLocation && p.last_location_lat && p.last_location_lng
                      ? calculateDistance(
                          baseLocation.lat,
                          baseLocation.lng,
                          p.last_location_lat,
                          p.last_location_lng,
                        )
                      : p.distance_km || 0;

                  return (
                    <motion.div
                      key={p.id}
                      drag={isTop ? "x" : false}
                      dragConstraints={{ left: 0, right: 0 }}
                      dragElastic={1}
                      onDragEnd={(e, info) => {
                        if (info.offset.x > 100) swipe(p.id, "like");
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
                      <div className="relative h-2/3 bg-gradient-primary">
                        <Link
                          to="/app/profile/$userId"
                          params={{ userId: p.id }}
                          className="absolute inset-0 z-10"
                        >
                          <img
                            src={p.avatar_url}
                            alt={p.name}
                            className="w-full h-full object-cover opacity-90"
                          />
                        </Link>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                        <div className="absolute top-4 left-4 flex gap-2">
                          <span className="px-2 py-1 rounded-full glass text-xs">
                            {p.preferred_sports?.[0] || t("matchmaking.sport_default")}
                          </span>
                          <span className="px-2 py-1 rounded-full glass text-xs text-neon flex items-center gap-1">
                            <Star className="h-3 w-3 fill-neon" /> {p.trust_score || 0}
                          </span>
                        </div>
                        <div className="absolute bottom-4 left-4 right-4">
                          <h2 className="text-2xl font-bold">
                            {p.company_name || p.name || t("matchmaking.user_default")}
                            {p.user_role !== "BUSINESS" ? `, ${p.age || "?"}` : ""}
                          </h2>
                          <p className="text-xs text-white/80 flex items-center gap-1 mt-1 font-sans">
                            <MapPin className="h-3 w-3 text-neon" /> A {dist.toFixed(1)} km de tu
                            ubicación
                          </p>
                        </div>
                      </div>
                      <div className="p-5">
                        <div className="flex items-center gap-2 text-xs mb-2">
                          <span className="px-2 py-0.5 rounded-full bg-violet/20 text-violet-foreground border border-violet/30">
                            {p.level}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{p.bio}</p>
                        {isTop && (
                          <div className="mt-4 flex items-center justify-center gap-4">
                            <button
                              onClick={() => swipe(p.id, "pass")}
                              className="h-14 w-14 rounded-full bg-card border border-border grid place-items-center hover:bg-destructive/20 cursor-pointer"
                            >
                              <X className="h-6 w-6 text-destructive" />
                            </button>
                            <button
                              onClick={() => setInspectedUser(p)}
                              className="px-4 py-2.5 rounded-xl glass border border-border/30 hover:border-primary/50 text-xs font-semibold hover:bg-accent transition-all hover:shadow-glow cursor-pointer"
                            >
                              {t("matchmaking.view_profile")}
                            </button>
                            <button
                              onClick={() => swipe(p.id, "like")}
                              className="h-16 w-16 rounded-full bg-gradient-neon grid place-items-center shadow-neon animate-pulse-ring cursor-pointer"
                            >
                              <Heart className="h-7 w-7 text-neon-foreground fill-neon-foreground" />
                            </button>
                          </div>
                        )}
                      </div>
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
          {top && (
            <div className="mt-4 space-y-3">
              <Bar label={t("matchmaking.level")} value={88} />
              <Bar label={t("matchmaking.schedule")} value={94} />
              <Bar
                label={t("matchmaking.distance")}
                value={Math.max(
                  40,
                  100 -
                    (baseLocation && top.last_location_lat && top.last_location_lng
                      ? calculateDistance(
                          baseLocation.lat,
                          baseLocation.lng,
                          top.last_location_lat,
                          top.last_location_lng,
                        )
                      : top.distance_km || 0) *
                      20,
                )}
              />
              <Bar label={t("matchmaking.reputation")} value={top.trust_score} />
            </div>
          )}
        </div>
      </div>

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

                {/* Heart Icon */}
                <div className="relative z-10 h-12 w-12 rounded-full bg-gradient-neon flex items-center justify-center shadow-neon animate-pulse">
                  <Heart className="h-6 w-6 text-neon-foreground fill-neon-foreground" />
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

              <div className="flex flex-col gap-2">
                <button
                  onClick={async () => {
                    // Create (or open existing) chat and immediately activate it
                    const chatStore = useChatStore.getState();
                    const chatId = await chatStore.createChat(matchedUser.id);
                    if (chatId) {
                      chatStore.setActiveConversation(chatId);
                    }
                    setMatchedUser(null);
                    navigate({ to: "/app/chat" });
                  }}
                  className="w-full py-3 rounded-xl bg-gradient-primary text-primary-foreground font-bold hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-glow flex items-center justify-center gap-2 cursor-pointer"
                >
                  <MessageSquare className="h-4 w-4" /> {t("matchmaking.send_message")}
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
                  <h2 className="text-2xl font-bold text-gradient">{inspectedUser.name}</h2>
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
