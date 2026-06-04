import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Camera, Award, Target } from "lucide-react";
import { supabase } from "@/shared/api/supabase";
import { toast } from "sonner";
import { compressToWebP } from "@/shared/lib/imageUtils";

interface IdentityStepProps {
  userId: string;
  isDemoMode: boolean;
  onBack: () => void;
  onComplete: (data: {
    avatar_url: string;
    bio: string;
    gender: "Masculino" | "Femenino" | "Mixto";
    weekly_hours: number;
    intent: "Recreativo" | "Competitivo";
    lat: number | null;
    lng: number | null;
  }) => void;
  isSaving: boolean;
}

export function IdentityStep({
  userId,
  isDemoMode,
  onBack,
  onComplete,
  isSaving,
}: IdentityStepProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [bio, setBio] = useState<string>("");
  const [gender, setGender] = useState<"Masculino" | "Femenino" | "Mixto">("Masculino");
  const [intentValue, setIntentValue] = useState<number>(50);
  const [weeklyHours, setWeeklyHours] = useState<number>(6);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);

  // Upload state
  const [isUploading, setIsUploading] = useState(false);

  // 1. Silent Geolocation Fetch on Mount
  useEffect(() => {
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLat(position.coords.latitude);
          setLng(position.coords.longitude);
        },
        (error) => {
          if (import.meta.env.DEV) {
            console.warn("Silent geolocation permission denied or failed:", error.message);
          }
        },
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 0 },
      );
    }
  }, []);

  // 2. Google OAuth Avatar Sync on Mount
  useEffect(() => {
    async function syncGoogleAvatar() {
      if (isDemoMode) return;
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const userMetadata = sessionData?.session?.user?.user_metadata;
        if (userMetadata?.avatar_url) {
          setAvatarUrl(userMetadata.avatar_url);
        }
      } catch (err) {
        if (import.meta.env.DEV) {
          console.warn("Failed to check Google OAuth metadata:", err);
        }
      }
    }
    syncGoogleAvatar();
  }, [isDemoMode]);

  // 3. Image Upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: 5MB
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t("profile.photo_error_size", "La imagen debe ser menor a 5MB"));
      return;
    }

    setIsUploading(true);
    const toastId = toast.loading(t("profile.uploading_photo", "Subiendo foto..."));

    try {
      if (isDemoMode) {
        // Ephemeral URL for demo mode
        const localUrl = URL.createObjectURL(file);
        setAvatarUrl(localUrl);
        toast.success(t("profile.photo_updated_demo", "Foto de perfil actualizada (Modo Demo)"), {
          id: toastId,
        });
        return;
      }

      // Compress to WebP
      const webpBlob = await compressToWebP(file, 400, 0.8);
      const filePath = `public/${userId}_profile_${Date.now()}.webp`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, webpBlob, {
          contentType: "image/webp",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get Public URL
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const publicUrl = `${urlData.publicUrl}?v=${Date.now()}`;

      setAvatarUrl(publicUrl);
      toast.success(t("profile.photo_updated", "Foto de perfil actualizada"), { id: toastId });
    } catch (err) {
      if (import.meta.env.DEV) console.error("Avatar upload error:", err);
      toast.error(t("profile.photo_error", "Error al subir la foto"), { id: toastId });
    } finally {
      setIsUploading(false);
      // Reset input value
      if (e.target) e.target.value = "";
    }
  };

  // 4. Bio Input XSS Sanitization & Validation
  const handleBioChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const rawValue = e.target.value;
    // Strip HTML tags for basic XSS prevention
    const sanitized = rawValue.replace(/<[^>]*>/g, "");
    setBio(sanitized);
  };

  const handleSave = () => {
    // Basic Bio Validation: 10 to 150 chars
    const trimmedBio = bio.trim();
    if (trimmedBio.length < 10) {
      toast.error(t("onboarding.bio_too_short", "La biografía debe tener al menos 10 caracteres"));
      return;
    }
    if (trimmedBio.length > 150) {
      toast.error(t("onboarding.bio_too_long", "La biografía no puede superar los 150 caracteres"));
      return;
    }

    const intent = intentValue >= 50 ? "Competitivo" : "Recreativo";

    onComplete({
      avatar_url: avatarUrl,
      bio: trimmedBio,
      gender,
      weekly_hours: weeklyHours,
      intent,
      lat,
      lng,
    });
  };

  // Gender visual styles
  const getGenderGlowClass = () => {
    if (gender === "Masculino") return "border-[#FF6B35] shadow-[0_0_15px_rgba(255,107,53,0.3)]";
    if (gender === "Femenino") return "border-[#D946EF] shadow-[0_0_15px_rgba(217,70,239,0.3)]";
    return "border-[#39FF14] shadow-[0_0_15px_rgba(57,255,20,0.3)]";
  };

  // Falling silhouettes based on gender fallback
  const renderFallbackAvatar = () => {
    if (gender === "Masculino") {
      return (
        <div className="absolute inset-0 bg-gradient-to-br from-[#FF6B35] to-[#FFA07A] flex items-center justify-center">
          <svg className="w-16 h-16 text-white/90" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
          </svg>
        </div>
      );
    }
    if (gender === "Femenino") {
      return (
        <div className="absolute inset-0 bg-gradient-to-br from-[#D946EF] to-[#8B5CF6] flex items-center justify-center">
          <svg className="w-16 h-16 text-white/90" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm9 7h-6v13h-2v-6h-2v6H9V9H3V7h18v2z" />
          </svg>
        </div>
      );
    }
    // Mixto (Abstract Trophy)
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-[#39FF14] to-[#1E3A1E] flex items-center justify-center">
        <svg
          className="w-14 h-14 text-white/90"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
          <path d="M4 22h16" />
          <path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34" />
          <path d="M12 2a6 6 0 0 1 6 6v5a6 6 0 0 1-6 6 6 6 0 0 1-6-6V8a6 6 0 0 1 6-6z" />
        </svg>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl text-white">
          {t("onboarding.step2_title", "Completa tu perfil")}
        </h1>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          {t(
            "onboarding.step2_subtitle",
            "Sube una foto y ajusta tus preferencias de emparejamiento.",
          )}
        </p>
      </div>

      {/* Circular Glassmorphism Avatar Uploader */}
      <div className="flex flex-col items-center gap-3">
        <div
          onClick={() => fileInputRef.current?.click()}
          className={`h-32 w-32 rounded-full border-4 cursor-pointer relative overflow-hidden bg-background/30 flex items-center justify-center transition-all duration-300 ${getGenderGlowClass()}`}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar Preview" className="h-full w-full object-cover" />
          ) : (
            renderFallbackAvatar()
          )}

          <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 flex flex-col items-center justify-center text-white text-[10px] font-bold transition-opacity">
            {isUploading ? (
              <div className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              <>
                <Camera className="h-5 w-5 mb-1" />
                <span>{t("profile.change_photo", "Subir Foto")}</span>
              </>
            )}
          </div>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
          disabled={isUploading}
        />
        <span className="text-[10px] text-muted-foreground">
          {avatarUrl
            ? t("onboarding.avatar_uploaded", "Foto sincronizada/subida")
            : t("onboarding.avatar_fallback", "Usando avatar dinámico por género")}
        </span>
      </div>

      {/* Segmented Gender Selector */}
      <div className="space-y-3">
        <label className="text-xs font-extrabold tracking-wider uppercase text-muted-foreground/80 block">
          {t("onboarding.gender_label", "Género")}
        </label>
        <div className="grid grid-cols-3 gap-2 bg-background/40 border border-border p-1.5 rounded-2xl">
          {[
            {
              value: "Masculino",
              label: "♂ Masculino",
              activeClass: "bg-[#FF6B35] text-white shadow-[0_0_10px_rgba(255,107,53,0.4)]",
            },
            {
              value: "Femenino",
              label: "♀ Femenino",
              activeClass: "bg-[#D946EF] text-white shadow-[0_0_10px_rgba(217,70,239,0.4)]",
            },
            {
              value: "Mixto",
              label: "⚡ Mixto",
              activeClass: "bg-[#39FF14] text-black shadow-[0_0_10px_rgba(57,255,20,0.4)]",
            },
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setGender(item.value as "Masculino" | "Femenino" | "Mixto")}
              className={`py-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                gender === item.value
                  ? item.activeClass
                  : "bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bio text area */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <label className="text-xs font-extrabold tracking-wider uppercase text-muted-foreground/80 block">
            {t("onboarding.bio_label", "Biografía")}
          </label>
          <span
            className={`text-[10px] font-semibold ${bio.trim().length < 10 || bio.trim().length > 150 ? "text-warning" : "text-muted-foreground"}`}
          >
            {bio.trim().length}/150
          </span>
        </div>
        <textarea
          value={bio}
          onChange={handleBioChange}
          placeholder={t(
            "onboarding.bio_placeholder",
            "Cuéntanos sobre ti, tus horarios de juego, clubs favoritos...",
          )}
          rows={3}
          maxLength={150}
          id="onboarding-bio-input"
          className="w-full bg-background/50 border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-none"
        />
        <p className="text-[10px] text-muted-foreground leading-normal">
          {t(
            "onboarding.bio_requirements",
            "Debe tener entre 10 y 150 caracteres. Se sanitiza automáticamente.",
          )}
        </p>
      </div>

      {/* Identity Matrix: Intent & Engagement Sliders */}
      <div className="bg-gradient-card border border-border rounded-2xl p-5 space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold uppercase tracking-wide flex items-center gap-1">
            <Target className="h-4 w-4 text-[#FF6B35]" />{" "}
            {t("onboarding.intent_label", "Intención de Juego")}
          </span>
          <span className="text-xs font-extrabold text-[#FF6B35]">
            {intentValue >= 50
              ? t("onboarding.competitivo", "Competitivo")
              : t("onboarding.recreativo", "Recreativo")}
          </span>
        </div>

        <div className="relative pt-2 pb-1">
          <input
            type="range"
            min="0"
            max="100"
            value={intentValue}
            onChange={(e) => setIntentValue(parseInt(e.target.value))}
            className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-muted outline-none accent-[#FF6B35]"
            style={{
              background: `linear-gradient(to right, #FF6B35 ${intentValue}%, #1e293b ${intentValue}%)`,
            }}
            id="intent-slider"
          />
        </div>

        <div className="flex justify-between text-[9px] text-muted-foreground font-semibold pt-1">
          <span className="text-left leading-normal">
            {t("onboarding.intent_recreativo_desc", "Recreativo / Tercer Tiempo")}
          </span>
          <span className="text-right leading-normal">
            {t("onboarding.intent_competitivo_desc", "Competitivo / Tabla de Clasificación")}
          </span>
        </div>
      </div>

      <div className="bg-gradient-card border border-border rounded-2xl p-5 space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold uppercase tracking-wide flex items-center gap-1">
            <Award className="h-4 w-4 text-neon" />{" "}
            {t("onboarding.weekly_dedication", "Dedicación Semanal")}
          </span>
          <span className="text-xs font-extrabold text-neon">
            {weeklyHours}{" "}
            {weeklyHours === 1
              ? t("onboarding.weekly_hour_sing", "hora")
              : t("onboarding.weekly_hour_plur", "horas")}
          </span>
        </div>

        <div className="relative pt-2 pb-1">
          <input
            type="range"
            min="1"
            max="20"
            value={weeklyHours}
            onChange={(e) => setWeeklyHours(parseInt(e.target.value))}
            className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-muted outline-none accent-[#39FF14]"
            style={{
              background: `linear-gradient(to right, #39FF14 ${((weeklyHours - 1) / 19) * 100}%, #1e293b ${((weeklyHours - 1) / 19) * 100}%)`,
            }}
            id="hours-slider"
          />
        </div>

        <div className="flex justify-between text-[9px] text-muted-foreground font-semibold pt-1">
          <span>{t("onboarding.weekly_min", "Mínimo (1h)")}</span>
          <span>{t("onboarding.weekly_default", "Predeterminado (6h)")}</span>
          <span>{t("onboarding.weekly_max", "Intenso (20h+)")}</span>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onBack}
          disabled={isSaving}
          className="flex-1 py-3.5 bg-accent hover:bg-accent/80 text-foreground font-bold rounded-xl border border-border transition-all cursor-pointer text-sm disabled:opacity-50"
        >
          {t("onboarding.btn_back", "Atrás")}
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving || isUploading}
          className="flex-1 py-3.5 bg-gradient-primary text-primary-foreground font-bold rounded-xl shadow-glow transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer text-sm"
          id="onboarding-finish-btn"
        >
          {isSaving
            ? t("common.saving", "Guardando...")
            : t("onboarding.btn_finish", "Finalizar y Registrarse")}
        </button>
      </div>
    </div>
  );
}
