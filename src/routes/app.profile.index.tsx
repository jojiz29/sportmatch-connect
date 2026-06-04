import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import {
  Edit3,
  MapPin,
  Trophy,
  Award,
  Shield,
  TrendingUp,
  Save,
  X,
  Users,
  Camera,
} from "lucide-react";
import { useProfileStore } from "@/features/profile/useProfileStore";
import { useWalletStore } from "@/features/wallet/useWalletStore";
import { apiClient } from "@/shared/api/apiClient";
import { supabase } from "@/shared/api/supabase";
import { useAuthStore } from "@/entities/user/useAuth";
import { compressToWebP } from "@/shared/lib/imageUtils";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Match, Sport, User } from "@/entities/types";

export const Route = createFileRoute("/app/profile/")({
  head: () => ({ meta: [{ title: "Perfil — SportMatch" }] }),
  component: Profile,
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

function Profile() {
  const { t } = useTranslation();
  const { profile, updateProfile, initProfile } = useProfileStore();
  const { balance } = useWalletStore();
  const [isEditing, setIsEditing] = useState(false);
  const [userMatches, setUserMatches] = useState<Match[]>([]);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [unlockedKeys, setUnlockedKeys] = useState<string[]>([]);
  const [attendanceStats, setAttendanceStats] = useState({
    matchesPlayed: 0,
    attendanceRate: 100,
    cancellations: 0,
    successfulConfirmations: 0,
  });

  useEffect(() => {
    if (profile) {
      apiClient.users
        .getAttendanceStats(profile.id)
        .then(setAttendanceStats)
        .catch((err) => console.error("Error loading attendance stats:", err));
    }
  }, [profile]);

  const [editForm, setEditForm] = useState({
    name: "",
    city: "",
    bio: "",
    preferred_sports: "",
    avatar_url: "",
  });

  useEffect(() => {
    initProfile();
  }, [initProfile]);

  useEffect(() => {
    let active = true;
    if (!profile) return;
    const currentProfile = profile;

    const isDemoMode = useAuthStore.getState().isDemoMode;

    async function loadAndSyncAchievements() {
      if (isDemoMode) {
        const unlocked = BADGES.filter((b) => b.checkUnlock(currentProfile)).map((b) => b.key);
        if (active) {
          setUnlockedKeys(unlocked);
        }
        return;
      }

      try {
        const { data: dbAchievements, error } = await supabase
          .from("user_achievements")
          .select("achievement_key")
          .eq("user_id", currentProfile.id);

        if (error) throw error;

        const dbKeys =
          dbAchievements?.map((row: { achievement_key: string }) => row.achievement_key) || [];

        // Check if there are any new achievements that should be unlocked
        const newlyUnlocked = BADGES.filter(
          (b) => b.checkUnlock(currentProfile) && !dbKeys.includes(b.key),
        );

        if (newlyUnlocked.length > 0) {
          const insertData = newlyUnlocked.map((b) => ({
            user_id: currentProfile.id,
            achievement_key: b.key,
          }));

          const { error: insertError } = await supabase
            .from("user_achievements")
            .insert(insertData);

          if (!insertError && active) {
            setUnlockedKeys([...dbKeys, ...newlyUnlocked.map((b) => b.key)]);
          } else if (active) {
            setUnlockedKeys(dbKeys);
          }
        } else {
          if (active) {
            setUnlockedKeys(dbKeys);
          }
        }
      } catch (err) {
        if (import.meta.env.DEV) console.error("Error loading/syncing achievements:", err);
        const unlocked = BADGES.filter((b) => b.checkUnlock(currentProfile)).map((b) => b.key);
        if (active) {
          setUnlockedKeys(unlocked);
        }
      }
    }

    loadAndSyncAchievements();

    return () => {
      active = false;
    };
  }, [profile]);

  useEffect(() => {
    if (profile) {
      setEditForm({
        name: profile.name,
        city: profile.city,
        bio: profile.bio || "",
        preferred_sports: profile.preferred_sports.join(", "),
        avatar_url: profile.avatar_url || "",
      });

      apiClient.matches
        .getUserMatches(profile.id)
        .then(setUserMatches)
        .catch(() => setUserMatches([]));
    }
  }, [profile]);

  if (!profile) {
    return (
      <div className="container mx-auto px-4 lg:px-8 py-8 animate-pulse bg-muted h-[560px] rounded-3xl" />
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

  const handleStartEdit = () => {
    setEditForm({
      name: profile.name,
      city: profile.city,
      bio: profile.bio || "",
      preferred_sports: profile.preferred_sports.join(", "),
      avatar_url: profile.avatar_url || "",
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    updateProfile({
      name: editForm.name,
      city: editForm.city,
      bio: editForm.bio,
      avatar_url: editForm.avatar_url,
      preferred_sports: editForm.preferred_sports
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean) as Sport[],
    });
    setIsEditing(false);
    toast.success(t("profile.updated"));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = e.target;
    const file = target?.files?.[0];
    if (!file || !profile) return;

    setIsUploadingAvatar(true);
    const toastId = toast.loading(t("profile.uploading_photo"));

    try {
      if (useAuthStore.getState().isDemoMode) {
        const localUrl = URL.createObjectURL(file);
        await updateProfile({ avatar_url: localUrl });
        setEditForm((prev) => ({ ...prev, avatar_url: localUrl }));
        toast.success(t("profile.photo_updated_demo"), { id: toastId });
        return;
      }

      // 1. Compress to WebP via Canvas (max 400px, quality 0.8)
      const webpBlob = await compressToWebP(file, 400, 0.8);

      // 2. Upload to Supabase Storage bucket 'avatars'
      const filePath = `public/${profile.id}.webp`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, webpBlob, {
          contentType: "image/webp",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // 3. Get public URL with cache-busting timestamp
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);

      const publicUrl = `${urlData.publicUrl}?v=${Date.now()}`;

      // 4. Persist the URL to profiles table via the store
      await updateProfile({ avatar_url: publicUrl });

      // 5. Update the edit form to show the new avatar immediately
      setEditForm((prev) => ({ ...prev, avatar_url: publicUrl }));

      toast.success(t("profile.photo_updated"), { id: toastId });
    } catch (err) {
      if (import.meta.env.DEV) console.error("Avatar upload error:", err);
      toast.error(t("profile.photo_error"), { id: toastId });
    } finally {
      setIsUploadingAvatar(false);
      // Reset file input safely so the same file can be selected again if needed
      if (target) {
        try {
          target.value = "";
        } catch (resetErr) {
          if (import.meta.env.DEV) console.warn("Could not reset input file value:", resetErr);
        }
      }
    }
  };

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8">
      <PageHeader title={t("profile.title")} />

      <div className="bg-gradient-card border border-border rounded-3xl p-6 md:p-8 shadow-card relative overflow-hidden">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-gradient-primary opacity-15 blur-3xl" />
        <div className="flex flex-wrap md:flex-nowrap items-start gap-6 relative">
          <div className="relative shrink-0">
            <img
              src={isEditing ? editForm.avatar_url : profile.avatar_url}
              alt={profile.name}
              className="h-28 w-28 rounded-2xl bg-muted ring-4 ring-primary/30 object-cover"
            />
            {isEditing && (
              <label
                className={`absolute inset-0 bg-black/60 rounded-2xl flex flex-col items-center justify-center text-[10px] text-white font-bold cursor-pointer hover:bg-black/80 transition-colors ${
                  isUploadingAvatar ? "pointer-events-none" : ""
                }`}
              >
                {isUploadingAvatar ? (
                  <div className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                ) : (
                  <>
                    <Camera className="h-5 w-5 mb-1" />
                    <span>{t("profile.change_photo")}</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={isUploadingAvatar}
                />
              </label>
            )}
            <div className="absolute -bottom-2 -right-2 px-2 py-1 rounded-full bg-gradient-neon text-neon-foreground text-xs font-bold">
              {profile.level}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="space-y-3 mt-1">
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 font-bold text-xl focus:border-primary focus:outline-none"
                  placeholder={t("profile.placeholder_name")}
                />
                <input
                  type="text"
                  value={editForm.city}
                  onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  placeholder={t("profile.placeholder_city")}
                />
                <textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  placeholder={t("profile.placeholder_bio")}
                  rows={2}
                />
                <input
                  type="text"
                  value={editForm.preferred_sports}
                  onChange={(e) => setEditForm({ ...editForm, preferred_sports: e.target.value })}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  placeholder={t("profile.placeholder_sports")}
                />
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-bold">{profile.name}</h2>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <MapPin className="h-3 w-3" />
                  {profile.city} · {t("profile.age_label", { age: profile.age })}
                </p>
                <p className="text-sm mt-2">{profile.bio}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {profile.preferred_sports.map((s) => (
                    <span
                      key={s}
                      className="px-3 py-1 rounded-full bg-violet/20 text-sm border border-violet/30"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
          <div className="shrink-0 flex gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl glass flex items-center gap-2 text-sm hover:bg-accent transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" /> {t("profile.cancel")}
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 rounded-xl bg-gradient-neon text-neon-foreground flex items-center gap-2 text-sm hover:shadow-neon transition-all font-semibold cursor-pointer"
                >
                  <Save className="h-4 w-4" /> {t("profile.save")}
                </button>
              </>
            ) : (
              <button
                onClick={handleStartEdit}
                className="px-4 py-2 rounded-xl glass flex items-center gap-2 text-sm hover:bg-accent transition-colors cursor-pointer"
              >
                <Edit3 className="h-4 w-4" /> {t("profile.edit")}
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mt-8">
          <Stat icon={<Trophy className="h-4 w-4 text-neon" />} label="FitCoins" value={balance} />
          <Stat
            icon={<TrendingUp className="h-4 w-4 text-electric" />}
            label={t("profile.matches")}
            value={attendanceStats.matchesPlayed}
          />
          <Stat
            icon={<Award className="h-4 w-4 text-warning" />}
            label={t("profile.achievements")}
            value={unlockedKeys.length}
          />
          <Stat
            icon={<Shield className="h-4 w-4 text-neon" />}
            label={t("profile.trust_score")}
            value={`${profile.trust_score}%`}
          />
          <Stat
            icon={<Users className="h-4 w-4 text-neon" />}
            label={t("profile.followers")}
            value={profile.followers_count ?? 0}
          />
          <Stat
            icon={<Users className="h-4 w-4 text-electric" />}
            label={t("profile.following")}
            value={profile.following_count ?? 0}
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
            <Metric
              label={t("profile.punctuality")}
              value={Math.max(70, 100 - attendanceStats.cancellations * 5)}
            />
            <Metric label={t("profile.attendance")} value={attendanceStats.attendanceRate} />
            <Metric
              label={t("profile.cancellations")}
              value={
                attendanceStats.matchesPlayed > 0
                  ? Math.round(
                      (attendanceStats.cancellations / attendanceStats.matchesPlayed) * 100,
                    )
                  : 0
              }
            />
            <Metric label={t("profile.behavior")} value={profile.trust_score} />
          </div>
        </div>

        <div className="bg-gradient-card border border-border rounded-2xl p-5">
          <h3 className="font-semibold mb-4">{t("profile.achievements")}</h3>
          <div className="grid grid-cols-2 gap-3">
            {BADGES.map((b) => {
              const isUnlocked = unlockedKeys.includes(b.key);
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
                        ? "Finalizado"
                        : m.status === "IN_PROGRESS"
                          ? "En Curso"
                          : "Abierto"}
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
