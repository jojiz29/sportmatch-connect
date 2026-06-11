import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import {
  MapPin,
  Trophy,
  Award,
  Shield,
  TrendingUp,
  Users,
  UserPlus,
  UserMinus,
  Star,
  ShieldAlert,
} from "lucide-react";
import { useSocialStore } from "@/features/social/model/useSocialStore";
import { apiClient } from "@/shared/api/apiClient";
import { backendApi } from "@/shared/api/backendApi";
import { supabase } from "@/shared/api/supabase";
import { useAuthStore } from "@/entities/user/useAuth";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Match, User } from "@/entities/types";
import { BadgeEngine } from "@/components/BadgeEngine";
import { ReviewModal } from "@/features/matchmaking/ui/ReviewModal";
import { ReportModal } from "@/components/ReportModal";
import { usePublicMatchStore } from "@/features/matchmaking/usePublicMatchStore";

export const Route = createFileRoute("/app/profile/$userId")({
  head: () => ({ meta: [{ title: "Perfil de Jugador — SportMatch" }] }),
  component: UserProfile,
});

const BADGES = [
  {
    id: 1,
    emoji: "🔥",
    key: "streak",
    checkUnlock: (u: User) => (u.matches_played || 0) >= 5,
    progress: (u: User, t: (key: string) => string) =>
      `${u.matches_played || 0}/5 ${t("profile.matches").toLowerCase()}`,
  },
  {
    id: 2,
    emoji: "🤝",
    key: "partner",
    checkUnlock: (u: User) => (u.trust_score || 0) >= 90 && (u.matches_played || 0) >= 3,
    progress: (u: User, t: (key: string) => string) =>
      `${u.trust_score || 0}% Trust, ${u.matches_played || 0}/3 ${t("profile.matches").toLowerCase().slice(0, 4)}.`,
  },
  {
    id: 3,
    emoji: "🏆",
    key: "mvp",
    checkUnlock: (u: User) => (u.matches_played || 0) >= 15,
    progress: (u: User, t: (key: string) => string) =>
      `${u.matches_played || 0}/15 ${t("profile.matches").toLowerCase()}`,
  },
  {
    id: 4,
    emoji: "⭐",
    key: "top",
    checkUnlock: (u: User) => (u.fitcoins_balance || 0) >= 1000,
    progress: (u: User) => `${u.fitcoins_balance || 0}/1000 FC`,
  },
];

function UserProfile() {
  const { userId } = Route.useParams();
  const { t } = useTranslation();
  const currentUser = useAuthStore((s) => s.user);

  const [profile, setProfile] = useState<User | null>(null);
  const [userMatches, setUserMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const getAverageRating = usePublicMatchStore((s) => s.getAverageRating);
  const averageRating = getAverageRating(userId);

  const relationships = useSocialStore((state) => state.relationships);
  const follow = useSocialStore((state) => state.follow);
  const unfollow = useSocialStore((state) => state.unfollow);

  const isMe = currentUser?.id === userId;

  const isFollowing = useMemo(() => {
    if (!currentUser) return false;
    return relationships.some((r) => r.followerId === currentUser.id && r.followingId === userId);
  }, [relationships, currentUser, userId]);

  useEffect(() => {
    let active = true;
    setIsLoading(true);

    async function loadData() {
      try {
        let userProfile: User | null = null;
        if (useAuthStore.getState().isDemoMode) {
          const { MOCK_USERS } = await import("@/shared/api/apiClient");
          userProfile = MOCK_USERS.find((u) => u.id === userId) || null;
        } else {
          const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
          if (data) {
            userProfile = data as User;
          }
        }

        if (active) {
          setProfile(userProfile);
          if (userProfile) {
            // Try backend first, fallback to Supabase
            const backendMatches = await backendApi.matches.getAll().catch(() => null);
            const matchesData = backendMatches
              ? (backendMatches as Match[]).filter((m) => m.creator_id === userId)
              : await apiClient.matches.getUserMatches(userId);
            setUserMatches(matchesData);
          }
        }
      } catch (err) {
        console.error("Error loading public profile:", err);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    loadData();
    return () => {
      active = false;
    };
  }, [userId]);

  const handleFollowToggle = async () => {
    if (!currentUser) return;
    try {
      if (isFollowing) {
        if (!useAuthStore.getState().isDemoMode) {
          await supabase
            .from("followers")
            .delete()
            .eq("follower_id", currentUser.id)
            .eq("following_id", userId);
        }
        unfollow(currentUser.id, userId);
        toast.success(
          t("profile.unfollow_success", { defaultValue: "Dejaste de seguir a este usuario." }),
        );
      } else {
        if (!useAuthStore.getState().isDemoMode) {
          await supabase.from("followers").insert({
            follower_id: currentUser.id,
            following_id: userId,
          });
        }
        follow(currentUser.id, userId);
        toast.success(
          t("profile.follow_success", { defaultValue: "¡Ahora sigues a este usuario!" }),
        );
      }
    } catch {
      toast.error(t("profile.follow_error", { defaultValue: "Error al procesar la solicitud." }));
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 lg:px-8 py-8 animate-pulse bg-muted h-[560px] rounded-3xl" />
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 lg:px-8 py-8 text-center text-muted-foreground">
        {t("profile.user_not_found", { defaultValue: "Usuario no encontrado." })}
      </div>
    );
  }

  const trustLevel =
    (profile.trust_score || 0) >= 90
      ? t("profile.trust_level_excellent")
      : (profile.trust_score || 0) >= 70
        ? t("profile.trust_level_good")
        : t("profile.trust_level_risk");

  const trustColor =
    (profile.trust_score || 0) >= 90
      ? "text-neon"
      : (profile.trust_score || 0) >= 70
        ? "text-warning"
        : "text-destructive";

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8">
      <PageHeader title={profile.name} />

      <div className="bg-gradient-card border border-border rounded-3xl p-6 md:p-8 shadow-card relative overflow-hidden">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-gradient-primary opacity-15 blur-3xl" />
        <div className="flex flex-wrap md:flex-nowrap items-start gap-6 relative">
          <div className="relative shrink-0">
            <img
              src={profile.avatar_url}
              alt={profile.name}
              className="h-28 w-28 rounded-2xl bg-muted ring-4 ring-primary/30 object-cover"
            />
            <div className="absolute -bottom-2 -right-2 px-2 py-1 rounded-full bg-gradient-neon text-neon-foreground text-xs font-bold">
              {profile.level}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold">{profile.name}</h2>
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
              <MapPin className="h-3 w-3" />
              {profile.city} · {t("profile.age_label", { age: profile.age })}
            </p>
            <p className="text-sm mt-2">{profile.bio || t("register.default_player_bio")}</p>
            <div className="mt-4">
              <BadgeEngine
                sports_matrix={
                  profile.sport_preferences?.sports_matrix ||
                  profile.preferred_sports.reduce(
                    (acc, sport) => {
                      acc[sport] = { level: profile.level || "Intermediate", weight: 2 };
                      return acc;
                    },
                    {} as Record<string, unknown>,
                  )
                }
                size="md"
              />
            </div>
          </div>
          {!isMe && (
            <div className="shrink-0 flex gap-2 flex-wrap">
              <button
                onClick={handleFollowToggle}
                className={`px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-semibold transition-all hover:shadow-glow cursor-pointer ${
                  isFollowing
                    ? "bg-accent text-accent-foreground border border-border hover:bg-accent/80"
                    : "bg-gradient-neon text-neon-foreground hover:shadow-neon"
                }`}
              >
                {isFollowing ? (
                  <>
                    <UserMinus className="h-4 w-4" />{" "}
                    {t("profile.following_status", { defaultValue: "Siguiendo" })}
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" /> {t("profile.follow")}
                  </>
                )}
              </button>

              {/* Review button */}
              <button
                onClick={() => setReviewOpen(true)}
                className="px-3 py-2 rounded-xl glass border border-border flex items-center gap-1.5 text-sm font-semibold hover:bg-accent transition-colors cursor-pointer"
                id="profile-review-btn"
                title="Valorar jugador"
              >
                <Star className="h-4 w-4 text-warning" />
                {averageRating > 0 ? `${averageRating}★` : "Valorar"}
              </button>

              {/* Report button */}
              <button
                onClick={() => setReportOpen(true)}
                className="px-3 py-2 rounded-xl glass border border-border flex items-center gap-1.5 text-sm text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-colors cursor-pointer"
                id="profile-report-btn"
                title="Reportar usuario"
              >
                <ShieldAlert className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mt-8">
          <Stat
            icon={<Trophy className="h-4 w-4 text-neon" />}
            label="FitCoins"
            value={profile.fitcoins_balance}
          />
          <Stat
            icon={<TrendingUp className="h-4 w-4 text-electric" />}
            label={t("profile.matches")}
            value={profile.matches_played}
          />
          <Stat
            icon={<Award className="h-4 w-4 text-warning" />}
            label={t("profile.achievements")}
            value={BADGES.length}
          />
          <Stat
            icon={<Shield className="h-4 w-4 text-neon" />}
            label={t("profile.trust_score")}
            value={`${profile.trust_score}%`}
          />
          {averageRating > 0 && (
            <Stat
              icon={<Star className="h-4 w-4 text-warning fill-warning" />}
              label="Valoración"
              value={`${averageRating}★`}
            />
          )}
          <Stat
            icon={<Users className="h-4 w-4 text-neon" />}
            label={t("profile.followers")}
            value={relationships.filter((r) => r.followingId === profile.id).length}
          />
          <Stat
            icon={<Users className="h-4 w-4 text-electric" />}
            label={t("profile.following")}
            value={relationships.filter((r) => r.followerId === profile.id).length}
          />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mt-6">
        <div className="bg-gradient-card border border-border rounded-2xl p-5">
          <h3 className="font-semibold flex items-center gap-2">
            <Shield className="h-4 w-4 text-neon" /> {t("profile.trust_score")}
          </h3>
          <div className="mt-4 text-center">
            <div className="text-5xl font-bold text-gradient">{profile.trust_score}</div>
            <div className={`text-sm font-semibold mt-1 ${trustColor}`}>{trustLevel}</div>
          </div>
          <div className="mt-4 h-3 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-gradient-neon" style={{ width: `${profile.trust_score}%` }} />
          </div>
          <div className="mt-4 space-y-2 text-sm">
            <Metric label={t("profile.punctuality")} value={98} />
            <Metric label={t("profile.attendance")} value={94} />
            <Metric label={t("profile.cancellations")} value={88} />
            <Metric label={t("profile.behavior")} value={92} />
          </div>
        </div>

        <div className="bg-gradient-card border border-border rounded-2xl p-5">
          <h3 className="font-semibold mb-4">{t("profile.achievements")}</h3>
          <div className="grid grid-cols-2 gap-3">
            {BADGES.map((b) => {
              const isUnlocked = b.checkUnlock(profile);
              const name = t(`profile.badge_${b.key}_name`);
              const description = t(`profile.badge_${b.key}_desc`);
              const progressText = b.progress(profile, t);

              return (
                <div
                  key={b.id}
                  className={`text-center p-3 rounded-xl transition-all cursor-default flex flex-col justify-between items-center ${
                    isUnlocked
                      ? "glass border-primary/30 hover:ring-glow hover:border-primary/50"
                      : "bg-muted/15 border border-border/40 grayscale opacity-45 hover:opacity-75 transition-opacity"
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <div className="text-3xl">{b.emoji}</div>
                    <div className="text-xs mt-1 font-semibold">{name}</div>
                  </div>
                  <div className="mt-2 text-[10px] leading-tight text-muted-foreground w-full">
                    {!isUnlocked ? (
                      <>
                        <span className="block font-medium text-warning/90">{description}</span>
                        <span className="block text-muted-foreground/75 mt-0.5">
                          {progressText}
                        </span>
                      </>
                    ) : (
                      <span className="block font-bold text-neon uppercase tracking-wider text-[9px]">
                        {t("profile.completed")}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-gradient-card border border-border rounded-2xl p-5">
          <h3 className="font-semibold mb-4">{t("profile.recent_history")}</h3>
          <div className="space-y-3">
            {userMatches.length > 0 ? (
              userMatches.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-3 text-sm p-2 rounded-xl hover:bg-accent/50 transition-colors"
                >
                  <div className="h-9 w-9 rounded-lg bg-gradient-primary grid place-items-center text-xs font-bold">
                    {m.sport.slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{m.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(m.date).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-xs text-neon">
                      +{20 + Math.floor(Math.random() * 30)} FC
                    </span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
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

      {/* Review Modal */}
      {profile && !isMe && (
        <ReviewModal
          open={reviewOpen}
          onClose={() => setReviewOpen(false)}
          targetUserId={userId}
          targetUserName={profile.name}
          targetUserAvatar={profile.avatar_url}
        />
      )}

      {/* Report Modal */}
      {profile && !isMe && (
        <ReportModal
          isOpen={reportOpen}
          onClose={() => setReportOpen(false)}
          reportedUserId={userId}
          reportedUserName={profile.name}
          reportedUserAvatar={profile.avatar_url}
        />
      )}
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
    <div className="glass rounded-xl p-4">
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        {icon} {label}
      </div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted mt-1 overflow-hidden">
        <div className="h-full bg-gradient-primary" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
