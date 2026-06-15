// === BLOQUE: IMPORTS — Dependencias del perfil propio ===
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
import { VerifiedBadge } from "@/shared/ui/VerifiedBadge";
import { useProfileStore } from "@/features/profile/useProfileStore";
import { useWalletStore } from "@/features/wallet/useWalletStore";
import { apiClient } from "@/shared/api/apiClient";
import { backendApi } from "@/shared/api/backendApi";
import { supabase } from "@/shared/api/supabase";
import { useAuthStore } from "@/entities/user/useAuth";
import { compressToWebP } from "@/shared/lib/imageUtils";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Match, Sport, User } from "@/entities/types";
import { useNSFWJS } from "@/shared/hooks/useNSFWJS";
import { useStrictForm } from "@/shared/hooks/useStrictForm";
import { BadgeEngine } from "@/components/BadgeEngine";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import { SportSelectionGrid } from "@/components/sports/SportSelectionGrid";
import { DniVerificationDialog } from "@/features/dni-verification/ui/DniVerificationDialog";

export const Route = createFileRoute("/app/profile/")({
  head: () => ({ meta: [{ title: "Perfil — SportMatch" }] }),
  component: Profile,
});

// === BLOQUE: BADGES — Definición de logros deportivos ===
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

// === BLOQUE: Profile — Componente principal del perfil personal ===
// Permite editar nombre, ciudad, bio, avatar (con moderación NSFW + compresión WebP),
// matriz deportiva, ver logros, estadísticas y verificar identidad (DNI).
function Profile() {
  const { t } = useTranslation();
  const { profile, updateProfile, initProfile } = useProfileStore();
  const { balance } = useWalletStore();
  const [isEditing, setIsEditing] = useState(false);
  const [userMatches, setUserMatches] = useState<Match[]>([]);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [unlockedKeys, setUnlockedKeys] = useState<string[]>([]);
  const [barWidth, setBarWidth] = useState(0);

  useEffect(() => {
    if (profile) {
      const timer = setTimeout(() => {
        setBarWidth(profile.trust_score || 0);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [profile]);

  const { analyzeImage } = useNSFWJS();
  const [isAnalyzingAvatar, setIsAnalyzingAvatar] = useState(false);

  // === BLOQUE: useStrictForm — Formulario de edición de perfil ===
  const {
    values: editForm,
    setValues: setEditForm,
    handleChange,
    handleBlur,
    handleSubmit: handleFormSubmit,
  } = useStrictForm({
    initialValues: { name: "", city: "", bio: "", preferred_sports: "", avatar_url: "" },
    validate: (vals) => {
      const errors: Record<string, string> = {};
      if (!vals.name.trim()) errors.name = "El nombre es requerido";
      return errors;
    },
    onSubmit: async (vals) => {
      if (!profile) return;
      const sportsKeys = Object.keys(editSportsMatrix);
      const userSports = sportsKeys.map((key) => ({
        sport_id: key,
        level: editSportsMatrix[key] as 1 | 2 | 3,
      }));
      const legacyMatrix: Record<
        string,
        { level: "Amateur" | "Intermediate" | "Advanced" | "Pro"; weight: number }
      > = {};
      sportsKeys.forEach((key) => {
        const lvl = editSportsMatrix[key];
        const stringLevel = lvl === 1 ? "Amateur" : lvl === 2 ? "Intermediate" : "Advanced";
        legacyMatrix[key] = { level: stringLevel, weight: lvl === 1 ? 1.0 : lvl === 2 ? 2.0 : 3.5 };
      });
      const firstSportKey = sportsKeys[0];
      const primaryLevelVal = firstSportKey ? editSportsMatrix[firstSportKey] : 2;
      const translatedLevel =
        primaryLevelVal === 1 ? "Principiante" : primaryLevelVal === 2 ? "Intermedio" : "Avanzado";

      updateProfile({
        name: vals.name,
        city: vals.city,
        bio: vals.bio,
        avatar_url: vals.avatar_url,
        preferred_sports: sportsKeys as Sport[],
        level: translatedLevel as User["level"],
        user_sports: userSports,
        sport_preferences: {
          sports_matrix: legacyMatrix,
          behavioral_intent: {
            weekly_hours: profile.sport_preferences?.behavioral_intent?.weekly_hours || 6,
            intent: profile.sport_preferences?.behavioral_intent?.intent || "Competitivo",
          },
        },
      });
      setIsEditing(false);
    },
    successMessage: t("profile.updated"),
  });

  const [editSportsMatrix, setEditSportsMatrix] = useState<Record<string, 1 | 2 | 3>>({});
  const [isSportsDialogOpen, setIsSportsDialogOpen] = useState(false);
  const [tempSportsMatrix, setTempSportsMatrix] = useState<Record<string, 1 | 2 | 3>>({});
  const [shouldRenderGrid, setShouldRenderGrid] = useState(false);

  // Retrasa el renderizado del SportSelectionGrid para evitar parpadeos del Dialog.
  useEffect(() => {
    if (isSportsDialogOpen) {
      const timer = setTimeout(() => setShouldRenderGrid(true), 100);
      return () => clearTimeout(timer);
    } else {
      setShouldRenderGrid(false);
    }
  }, [isSportsDialogOpen]);

  const handleTempSportChange = (sportId: string, level: 1 | 2 | 3 | undefined) => {
    setTempSportsMatrix((prev) => {
      const next = { ...prev };
      if (level === undefined) delete next[sportId];
      else next[sportId] = level;
      return next;
    });
  };

  const handleAcceptSports = () => {
    setEditSportsMatrix(tempSportsMatrix);
    const sportsKeys = Object.keys(tempSportsMatrix);
    setEditForm((prev) => ({ ...prev, preferred_sports: sportsKeys.join(", ") }));
    setIsSportsDialogOpen(false);
  };

  useEffect(() => {
    initProfile();
  }, [initProfile]);

  // === BLOQUE: Carga y sincronización de logros ===
  useEffect(() => {
    let active = true;
    if (!profile) return;
    const currentProfile = profile;
    const isDemoMode = useAuthStore.getState().isDemoMode;

    async function loadAndSyncAchievements() {
      if (isDemoMode) {
        const unlocked = BADGES.filter((b) => b.checkUnlock(currentProfile)).map((b) => b.key);
        if (active) setUnlockedKeys(unlocked);
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
          if (!insertError && active)
            setUnlockedKeys([...dbKeys, ...newlyUnlocked.map((b) => b.key)]);
          else if (active) setUnlockedKeys(dbKeys);
        } else {
          if (active) setUnlockedKeys(dbKeys);
        }
      } catch (err) {
        if (import.meta.env.DEV) console.error("Error loading/syncing achievements:", err);
        const unlocked = BADGES.filter((b) => b.checkUnlock(currentProfile)).map((b) => b.key);
        if (active) setUnlockedKeys(unlocked);
      }
    }
    loadAndSyncAchievements();
    return () => {
      active = false;
    };
  }, [profile]);

  // === BLOQUE: SEC-04 Prevención de memory leaks (revocar object URLs) ===
  useEffect(() => {
    return () => {
      if (editForm.avatar_url && editForm.avatar_url.startsWith("blob:")) {
        URL.revokeObjectURL(editForm.avatar_url);
      }
    };
  }, [editForm.avatar_url]);

  // === BLOQUE: Carga inicial del perfil y partidos del usuario ===
  useEffect(() => {
    if (profile) {
      setEditForm({
        name: profile.name,
        city: profile.city,
        bio: profile.bio || "",
        preferred_sports: profile.preferred_sports.join(", "),
        avatar_url: profile.avatar_url || "",
      });
      backendApi.matches
        .getAll()
        .then((res) => {
          if (res && Array.isArray(res.data)) {
            const userMatches = res.data.filter((m) => m.creator_id === profile.id);
            setUserMatches(userMatches);
          } else {
            apiClient.matches
              .getUserMatches(profile.id)
              .then(setUserMatches)
              .catch(() => setUserMatches([]));
          }
        })
        .catch(() => {
          apiClient.matches
            .getUserMatches(profile.id)
            .then(setUserMatches)
            .catch(() => setUserMatches([]));
        });
    }
  }, [profile, setEditForm]);

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
    const initial: Record<string, 1 | 2 | 3> = {};
    if (profile.user_sports && profile.user_sports.length > 0) {
      profile.user_sports.forEach((us) => {
        initial[us.sport_id] = us.level;
      });
    } else if (profile.preferred_sports) {
      profile.preferred_sports.forEach((sport) => {
        initial[sport] = 1;
      });
    }
    setEditSportsMatrix(initial);
    setEditForm({
      name: profile.name,
      city: profile.city,
      bio: profile.bio || "",
      preferred_sports: profile.preferred_sports.join(", "),
      avatar_url: profile.avatar_url || "",
    });
    setIsEditing(true);
  };

  const handleSave = () => handleFormSubmit();

  const handleDniVerificationSuccess = (updatedProfile: User) => {
    useAuthStore.setState({ user: updatedProfile });
    useProfileStore.setState({ profile: updatedProfile });
  };

  const handleDniVerificationFailure = (partial: Partial<User>) => {
    if (!profile) return;
    const updatedUser = { ...profile, ...partial };
    useAuthStore.setState({ user: updatedUser });
    useProfileStore.setState({ profile: updatedUser });
  };

  // === BLOQUE: handleFileChange — Subida de avatar con moderación NSFW ===
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = e.target;
    const file = target?.files?.[0];
    if (!file || !profile) return;
    if (isAnalyzingAvatar || isUploadingAvatar) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t("profile.photo_error_size", "La imagen debe ser menor a 5MB"));
      return;
    }

    setIsAnalyzingAvatar(true);
    const scanToastId = toast.loading("🛡️ Analizando imagen con IA...");
    try {
      const isSafe = await analyzeImage(file);
      toast.dismiss(scanToastId);
      if (!isSafe) {
        toast.error(
          "Contenido Bloqueado: Esta imagen no cumple con nuestras políticas de seguridad.",
          { className: "bg-red-500 text-white border-red-600" },
        );
        if (target) {
          try {
            target.value = "";
          } catch (resetErr) {
            if (import.meta.env.DEV) console.warn("Could not reset input file value:", resetErr);
          }
        }
        setIsAnalyzingAvatar(false);
        return;
      }
    } catch (err) {
      console.error("AI Moderation error:", err);
      toast.dismiss(scanToastId);
    } finally {
      setIsAnalyzingAvatar(false);
    }

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
      const webpBlob = await compressToWebP(file, 400, 0.8);
      const filePath = `public/${profile.id}.webp`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, webpBlob, { contentType: "image/webp", upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const publicUrl = `${urlData.publicUrl}?v=${Date.now()}`;
      await updateProfile({ avatar_url: publicUrl });
      setEditForm((prev) => ({ ...prev, avatar_url: publicUrl }));
      toast.success(t("profile.photo_updated"), { id: toastId });
    } catch (err) {
      if (import.meta.env.DEV) console.error("Avatar upload error:", err);
      toast.error(t("profile.photo_error"), { id: toastId });
    } finally {
      setIsUploadingAvatar(false);
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

      {/* === Tarjeta principal del perfil === */}
      <div className="bg-gradient-card border border-border rounded-3xl p-6 md:p-8 shadow-card relative overflow-hidden">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-gradient-primary opacity-15 blur-3xl" />
        <div className="flex flex-wrap md:flex-nowrap items-start gap-6 relative">
          {/* Avatar con overlay de carga / edición */}
          <div className="relative shrink-0">
            <img
              src={isEditing ? editForm.avatar_url : profile.avatar_url}
              alt={profile.name}
              className="h-28 w-28 rounded-2xl bg-muted ring-4 ring-primary/30 object-cover"
            />
            {isEditing && (
              <label
                className={`absolute inset-0 bg-black/60 rounded-2xl flex flex-col items-center justify-center text-[10px] text-white font-bold cursor-pointer hover:bg-black/80 transition-colors ${isUploadingAvatar || isAnalyzingAvatar ? "pointer-events-none" : ""}`}
              >
                {isAnalyzingAvatar ? (
                  <div
                    className="absolute inset-0 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center gap-1.5 p-2 text-center border-2 rounded-2xl animate-[scale-in_0.2s_ease-out]"
                    style={{ animation: "pulseBorder 2s infinite ease-in-out" }}
                  >
                    <style>{`@keyframes pulseBorder { 0% { border-color: rgba(255, 255, 255, 0.8); box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4); } 50% { border-color: rgba(239, 68, 68, 0.9); box-shadow: 0 0 15px 4px rgba(239, 68, 68, 0.5); } 100% { border-color: rgba(255, 255, 255, 0.8); box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4); } }`}</style>
                    <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    <span className="text-[9px] font-black text-white tracking-wide uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                      🛡️ Escaneando...
                    </span>
                  </div>
                ) : isUploadingAvatar ? (
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
                  disabled={isUploadingAvatar || isAnalyzingAvatar}
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
                  name="name"
                  value={editForm.name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 font-bold text-xl focus:border-primary focus:outline-none"
                  placeholder={t("profile.placeholder_name")}
                />
                <input
                  type="text"
                  name="city"
                  value={editForm.city}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  placeholder={t("profile.placeholder_city")}
                />
                <textarea
                  name="bio"
                  value={editForm.bio}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  placeholder={t("profile.placeholder_bio")}
                  rows={2}
                />
                {/* Diálogo de selección de deportes */}
                <Dialog open={isSportsDialogOpen} onOpenChange={setIsSportsDialogOpen}>
                  <DialogTrigger asChild>
                    <button
                      type="button"
                      onClick={() => {
                        setTempSportsMatrix({ ...editSportsMatrix });
                        setIsSportsDialogOpen(true);
                      }}
                      className="w-full text-left bg-background border border-border hover:border-primary/50 rounded-xl px-3 py-2.5 text-sm cursor-pointer flex justify-between items-center text-muted-foreground"
                    >
                      <span className="truncate">
                        {editForm.preferred_sports ||
                          t("profile.placeholder_sports", "Selecciona tus deportes...")}
                      </span>
                      <span className="text-xs font-bold text-neon shrink-0 ml-2 hover:underline">
                        {t("profile.change_sports", "Cambiar")}
                      </span>
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto bg-background/95 border-border shadow-2xl rounded-3xl p-6">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-black text-foreground">
                        {t("onboarding.step1_title", "Elige tus disciplinas")}
                      </DialogTitle>
                      <DialogDescription className="text-xs text-muted-foreground">
                        {t(
                          "onboarding.step1_subtitle",
                          "Selecciona los deportes que juegas y tu nivel.",
                        )}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 text-left min-h-[300px] flex items-center justify-center">
                      {shouldRenderGrid ? (
                        <SportSelectionGrid
                          sportsMatrix={tempSportsMatrix}
                          onSportChange={handleTempSportChange}
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-3">
                          <div className="h-8 w-8 rounded-full border-2 border-neon border-t-transparent animate-spin" />
                          <span className="text-xs text-muted-foreground font-semibold">
                            {t("common.loading", "Cargando...")}
                          </span>
                        </div>
                      )}
                    </div>
                    <DialogFooter className="flex justify-end gap-2 pt-4 border-t border-border">
                      <button
                        type="button"
                        onClick={() => setIsSportsDialogOpen(false)}
                        className="px-4 py-2 rounded-xl glass text-sm cursor-pointer"
                      >
                        {t("profile.cancel")}
                      </button>
                      <button
                        type="button"
                        onClick={handleAcceptSports}
                        className="px-4 py-2 rounded-xl bg-gradient-neon text-neon-foreground text-sm font-bold cursor-pointer"
                      >
                        {t("profile.save", "Guardar")}
                      </button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-bold flex items-center">
                  {profile.name}
                  {profile.dni_verificado && <VerifiedBadge />}
                </h2>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <MapPin className="h-3 w-3" />
                  {profile.city} · {t("profile.age_label", { age: profile.age })}
                </p>
                <p className="text-sm mt-2">{profile.bio}</p>
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
              </>
            )}
          </div>
          <div className="shrink-0 flex gap-2">
            {isEditing ? (
              <>
                <button
                  disabled={isUploadingAvatar || isAnalyzingAvatar}
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl glass flex items-center gap-2 text-sm hover:bg-accent transition-colors cursor-pointer disabled:opacity-50"
                >
                  <X className="h-4 w-4" /> {t("profile.cancel")}
                </button>
                <button
                  disabled={isUploadingAvatar || isAnalyzingAvatar}
                  onClick={handleSave}
                  className="px-4 py-2 rounded-xl bg-gradient-neon text-neon-foreground flex items-center gap-2 text-sm hover:shadow-neon transition-all font-semibold cursor-pointer disabled:opacity-50"
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

        {/* === Grid de estadísticas === */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mt-8">
          <Stat icon={<Trophy className="h-4 w-4 text-neon" />} label="FitCoins" value={balance} />
          <Stat
            icon={<TrendingUp className="h-4 w-4 text-electric" />}
            label={t("profile.matches")}
            value={profile.matches_played}
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
        {/* === Columna: Trust Score y verificación DNI === */}
        <div className="bg-gradient-card border border-border rounded-2xl p-5">
          <h3 className="font-semibold flex items-center gap-2">
            <Shield className="h-4 w-4 text-neon" /> {t("profile.trust_score")}
          </h3>
          <div className="mt-4 text-center">
            <div className="text-5xl font-bold text-gradient">{profile.trust_score}</div>
            <div className={`text-sm font-semibold mt-1 ${trustColor}`}>{trustLevel}</div>
          </div>
          <div
            className={`mt-4 h-3 rounded-full bg-muted overflow-hidden ${profile.trust_score >= 80 ? "animate-pulse shadow-glow" : ""}`}
          >
            <div
              className="h-full bg-gradient-neon transition-all duration-1000 ease-out"
              style={{ width: `${barWidth}%` }}
            />
          </div>
          <div className="mt-4 space-y-2 text-sm">
            <Metric label={t("profile.punctuality")} value={98} />
            <Metric label={t("profile.attendance")} value={94} />
            <Metric label={t("profile.cancellations")} value={88} />
            <Metric label={t("profile.behavior")} value={92} />
          </div>

          {/* === Bloque de verificación de identidad (DNI) === */}
          <div className="mt-6 pt-4 border-t border-border/60">
            {profile.dni_verificado ? (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center">
                <span className="text-xs font-bold text-emerald-400 flex items-center justify-center gap-1.5">
                  🛡️ {t("dni_verification.verified_badge")}
                </span>
                <span className="text-[10px] text-muted-foreground mt-1 block">
                  {t("dni_verification.verified_on")}{" "}
                  {profile.fecha_verificacion
                    ? new Date(profile.fecha_verificacion).toLocaleDateString()
                    : ""}
                  {profile.dni_verification_version === "v2" && (
                    <span className="block text-emerald-400/80">
                      {t("dni_verification.v2_label")}
                    </span>
                  )}
                </span>
              </div>
            ) : (profile.dni_intentos || 0) >= 3 ? (
              <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3 text-center">
                <span className="text-xs font-bold text-destructive block">
                  🚫 {t("dni_verification.blocked_title")}
                </span>
                <span className="text-[10px] text-muted-foreground mt-1.5 block leading-normal">
                  {t("dni_verification.blocked_desc")}
                </span>
              </div>
            ) : (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-center">
                <span className="text-xs font-bold text-blue-400 block">
                  {t("dni_verification.not_verified_title")}
                </span>
                <span className="text-[10px] text-muted-foreground mt-1 block">
                  {t("dni_verification.not_verified_desc")}
                </span>
                <DniVerificationDialog
                  profile={profile}
                  attemptsLeft={3 - (profile.dni_intentos || 0)}
                  onSuccess={handleDniVerificationSuccess}
                  onFailure={handleDniVerificationFailure}
                />
              </div>
            )}
          </div>
        </div>

        {/* === Columna: Logros / Insignias === */}
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
                  className={`text-center p-3 rounded-xl cursor-default flex flex-col justify-between items-center ${
                    isUnlocked
                      ? "glass border-primary/30 hover:ring-glow hover:border-primary/50 transition-all"
                      : "bg-muted/15 border border-border/40 opacity-40 grayscale transition-all duration-300 hover:grayscale-0 hover:opacity-100"
                  }`}
                  title={!isUnlocked ? "Juega más para desbloquear" : undefined}
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

        {/* === Columna: Historial reciente de partidos === */}
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
                      className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${m.status === "Finished" ? "bg-muted text-muted-foreground" : m.status === "IN_PROGRESS" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-primary/20 text-primary-foreground border border-primary/30"}`}
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
