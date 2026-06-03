import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/entities/user/useAuth";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { MapPin, User as UserIcon, Mail, Lock, Check } from "lucide-react";
import { Sport } from "@/entities/types";
import { apiClient } from "@/shared/api/apiClient";
import { signInWithGoogle } from "@/services/authService";

export const Route = createFileRoute("/app/register")({
  component: RegisterPage,
});

const STATIC_SPORTS: Sport[] = ["Pádel", "Fútbol", "Tenis", "Running"];

const ALLOWED_DOMAINS = [
  "gmail.com",
  "outlook.com",
  "yahoo.com",
  "hotmail.com",
  "icloud.com",
  "protonmail.com",
  "sportmatch.app",
  "puka.com",
];

const ALLOWED_TLDS = [".com", ".pe", ".edu", ".org", ".net", ".app"];

function getEmailValidationError(email: string, t: (key: string) => string): string | null {
  if (!email) return null;

  // RFC Standard Regex for basic structure
  const rfcRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  if (!rfcRegex.test(email)) {
    return t("auth.email_invalid_format");
  }

  const parts = email.split("@");
  if (parts.length !== 2) {
    return t("auth.email_invalid_format");
  }

  const domain = parts[1].toLowerCase();

  // TLD check: the domain must end with one of the allowed TLDs
  const hasAllowedTld = ALLOWED_TLDS.some((tld) => domain.endsWith(tld));
  if (!hasAllowedTld) {
    return t("auth.email_invalid_tld");
  }

  // Whitelist check
  const isWhitelisted = ALLOWED_DOMAINS.some((allowed) => {
    return domain === allowed || domain.endsWith("." + allowed);
  });

  if (!isWhitelisted) {
    return t("auth.email_invalid_domain");
  }

  return null;
}

function getPasswordCriteria(password: string) {
  return {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
}

function getPasswordStrength(criteria: {
  length: boolean;
  upper: boolean;
  lower: boolean;
  number: boolean;
  special: boolean;
}) {
  const count = Object.values(criteria).filter(Boolean).length;
  if (count <= 2) return "weak";
  if (count <= 4) return "medium";
  return "strong";
}

function RegisterPage() {
  const { t } = useTranslation();
  const { register } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState<"PLAYER" | "BUSINESS">("PLAYER");
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [category, setCategory] = useState<"Canchas" | "Gym" | "Tienda" | "Bebidas">("Tienda");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedSports, setSelectedSports] = useState<Sport[]>([]);
  const [sportsList, setSportsList] = useState<string[]>(STATIC_SPORTS);

  useEffect(() => {
    apiClient.sports
      .getAll()
      .then((data) => {
        if (data && data.length > 0) {
          setSportsList(data.map((s) => s.name));
        }
      })
      .catch((err) => {
        if (import.meta.env.DEV) console.error("Error loading sports:", err);
      });
  }, []);

  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(pos.coords.latitude);
          setLng(pos.coords.longitude);
        },
        (err) => {
          if (import.meta.env.DEV) console.warn("Geolocation failed. Using defaults.", err.message);
          setLat(-12.14);
          setLng(-76.995);
        },
      );
    } else {
      setLat(-12.14);
      setLng(-76.995);
    }
  }, []);

  const toggleSport = (sport: Sport) => {
    if (selectedSports.includes(sport)) {
      setSelectedSports(selectedSports.filter((s) => s !== sport));
    } else {
      setSelectedSports([...selectedSports, sport]);
    }
  };

  const emailError = email ? getEmailValidationError(email, t) : null;
  const criteria = getPasswordCriteria(password);
  const isPasswordValid = Object.values(criteria).every(Boolean);
  const strength = getPasswordStrength(criteria);
  const strengthPercent = (Object.values(criteria).filter(Boolean).length / 5) * 100;

  const isFormValid =
    (role === "PLAYER"
      ? fullName.trim().length > 0 && selectedSports.length > 0
      : companyName.trim().length > 0) &&
    email.length > 0 &&
    emailError === null &&
    isPasswordValid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid) {
      toast.error(t("register.error_toast"));
      return;
    }

    try {
      const newUser = {
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        name: role === "BUSINESS" ? companyName : fullName,
        age: role === "BUSINESS" ? 0 : 25,
        city: "Lima",
        avatar_url:
          role === "BUSINESS"
            ? `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(companyName)}`
            : `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fullName)}`,
        bio:
          role === "BUSINESS"
            ? t("register.business_bio_template", { companyName })
            : t("profile.placeholder_bio") || t("register.default_player_bio"),
        trust_score: 50,
        fitcoins_balance: 0,
        level: "Intermedio" as const,
        preferred_sports: role === "BUSINESS" ? [] : selectedSports,
        matches_played: 0,
        last_location_lat: lat || -12.14,
        last_location_lng: lng || -76.995,
        user_role: role,
        company_name: role === "BUSINESS" ? companyName : undefined,
        business_category: role === "BUSINESS" ? category : undefined,
        is_sponsored: false,
        email,
        password,
      };

      await register(newUser);

      toast.success(t("register.success_toast"));
      if (role === "BUSINESS") {
        navigate({ to: "/app/business" });
      } else {
        navigate({ to: "/app" });
      }
    } catch (err: unknown) {
      if (import.meta.env.DEV) console.error("Error en registro:", err);
      const errorMessage = err instanceof Error ? err.message : t("register.error_toast");
      toast.error(`Error: ${errorMessage}`);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      if (import.meta.env.DEV) console.error("Error en Google register:", err);
      const errorMessage = err instanceof Error ? err.message : t("register.error_toast");
      toast.error(`Error: ${errorMessage}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg bg-gradient-card border border-border rounded-3xl p-8 shadow-card backdrop-blur-md">
        <div className="text-center mb-6">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-primary shadow-glow mb-4">
            <MapPin className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-neon bg-clip-text text-transparent">
            {t("register.title")}
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">{t("register.subtitle")}</p>
        </div>

        {/* Role Switcher */}
        <div className="flex bg-background/50 border border-border rounded-xl p-1 mb-6">
          <button
            type="button"
            onClick={() => setRole("PLAYER")}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
              role === "PLAYER"
                ? "bg-gradient-primary text-primary-foreground shadow-glow"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("register.role_player")}
          </button>
          <button
            type="button"
            onClick={() => setRole("BUSINESS")}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
              role === "BUSINESS"
                ? "bg-gradient-primary text-primary-foreground shadow-glow"
                : "text-muted-foreground hover:text-foreground"
            }`}
            id="register-role-business"
          >
            {t("register.role_business")}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {role === "PLAYER" ? (
            <div>
              <label className="text-sm font-semibold mb-2 block">{t("register.fullName")}</label>
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-background/50 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  placeholder={t("profile.placeholder_name") || "Tu nombre completo"}
                  id="register-fullname-input"
                />
              </div>
            </div>
          ) : (
            <>
              <div>
                <label className="text-sm font-semibold mb-2 block">
                  {t("register.companyName")}
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-background/50 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    placeholder={t("register.placeholder_company") || "Ej. Deportes Flores S.A.C."}
                    id="register-company-name"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold mb-2 block">
                  {t("register.businessCategory")}
                </label>
                <select
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value as "Canchas" | "Gym" | "Tienda" | "Bebidas")
                  }
                  className="w-full px-4 py-3 bg-background/50 border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-sm"
                  id="register-business-category"
                >
                  <option value="Tienda">{t("register.cat_shop")}</option>
                  <option value="Canchas">{t("register.cat_courts")}</option>
                  <option value="Gym">{t("register.cat_gym")}</option>
                  <option value="Bebidas">{t("register.cat_beverages")}</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold mb-2 block">
                  {t("register.gps_location")}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] text-muted-foreground block mb-1">
                      {t("register.latitude")}
                    </span>
                    <input
                      type="number"
                      step="any"
                      required
                      value={lat || ""}
                      onChange={(e) => setLat(parseFloat(e.target.value))}
                      className="w-full px-4 py-2 bg-background/50 border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-sm"
                      placeholder={t("register.latitude") || "Latitud"}
                      id="register-business-lat"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block mb-1">
                      {t("register.longitude")}
                    </span>
                    <input
                      type="number"
                      step="any"
                      required
                      value={lng || ""}
                      onChange={(e) => setLng(parseFloat(e.target.value))}
                      className="w-full px-4 py-2 bg-background/50 border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-sm"
                      placeholder={t("register.longitude") || "Longitud"}
                      id="register-business-lng"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="text-sm font-semibold mb-2 block">{t("register.email")}</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full pl-12 pr-4 py-3 bg-background/50 border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all ${
                  emailError ? "border-red-500/50" : "border-border"
                }`}
                placeholder={t("login.email_placeholder", { defaultValue: "tu@email.com" })}
                id="register-email-input"
              />
            </div>
            {emailError && (
              <p className="text-[11px] text-red-500 mt-1.5 ml-1 animate-fade-in">{emailError}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-semibold mb-2 block">{t("register.password")}</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full pl-12 pr-4 py-3 bg-background/50 border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all ${
                  password && !isPasswordValid ? "border-red-500/50" : "border-border"
                }`}
                placeholder="••••••••"
                id="register-password-input"
              />
            </div>

            {password && (
              <div className="mt-3 space-y-2 animate-fade-in">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">{t("auth.password_strength_title")}</span>
                  <span
                    className={`font-semibold ${
                      strength === "weak"
                        ? "text-red-500"
                        : strength === "medium"
                          ? "text-yellow-500"
                          : "text-green-500"
                    }`}
                  >
                    {t(`auth.password_strength_${strength}`)}
                  </span>
                </div>

                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      strength === "weak"
                        ? "bg-red-500"
                        : strength === "medium"
                          ? "bg-yellow-500"
                          : "bg-green-500"
                    }`}
                    style={{ width: `${strengthPercent}%` }}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] mt-2">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`h-4 w-4 rounded-full flex items-center justify-center text-[10px] font-bold ${criteria.length ? "bg-green-500/20 text-green-500" : "bg-muted text-muted-foreground"}`}
                    >
                      {criteria.length ? "✓" : "○"}
                    </span>
                    <span className={criteria.length ? "text-foreground" : "text-muted-foreground"}>
                      {t("auth.password_crit_len")}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`h-4 w-4 rounded-full flex items-center justify-center text-[10px] font-bold ${criteria.upper ? "bg-green-500/20 text-green-500" : "bg-muted text-muted-foreground"}`}
                    >
                      {criteria.upper ? "✓" : "○"}
                    </span>
                    <span className={criteria.upper ? "text-foreground" : "text-muted-foreground"}>
                      {t("auth.password_crit_upper")}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`h-4 w-4 rounded-full flex items-center justify-center text-[10px] font-bold ${criteria.lower ? "bg-green-500/20 text-green-500" : "bg-muted text-muted-foreground"}`}
                    >
                      {criteria.lower ? "✓" : "○"}
                    </span>
                    <span className={criteria.lower ? "text-foreground" : "text-muted-foreground"}>
                      {t("auth.password_crit_lower")}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`h-4 w-4 rounded-full flex items-center justify-center text-[10px] font-bold ${criteria.number ? "bg-green-500/20 text-green-500" : "bg-muted text-muted-foreground"}`}
                    >
                      {criteria.number ? "✓" : "○"}
                    </span>
                    <span className={criteria.number ? "text-foreground" : "text-muted-foreground"}>
                      {t("auth.password_crit_number")}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`h-4 w-4 rounded-full flex items-center justify-center text-[10px] font-bold ${criteria.special ? "bg-green-500/20 text-green-500" : "bg-muted text-muted-foreground"}`}
                    >
                      {criteria.special ? "✓" : "○"}
                    </span>
                    <span
                      className={criteria.special ? "text-foreground" : "text-muted-foreground"}
                    >
                      {t("auth.password_crit_special")}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {role === "PLAYER" && (
            <div>
              <label className="text-sm font-semibold mb-3 block">{t("register.sports")}</label>
              <div className="flex flex-wrap gap-2">
                {sportsList.map((sport) => {
                  const isSelected = selectedSports.includes(sport as Sport);
                  return (
                    <button
                      key={sport}
                      type="button"
                      onClick={() => toggleSport(sport as Sport)}
                      className={`px-4 py-2.5 rounded-xl border text-sm font-medium transition-all flex items-center gap-2 cursor-pointer ${
                        isSelected
                          ? "bg-gradient-primary border-primary text-primary-foreground shadow-glow"
                          : "bg-background/30 border-border text-muted-foreground hover:bg-accent"
                      }`}
                    >
                      {isSelected && <Check className="h-4 w-4" />}
                      {sport}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={!isFormValid}
            className="w-full py-4 mt-4 bg-gradient-primary hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:scale-100 text-primary-foreground font-bold rounded-xl shadow-glow transition-all cursor-pointer"
          >
            {t("register.btn_register")}
          </button>

          <div className="relative my-4 flex items-center justify-center">
            <div className="absolute inset-x-0 h-px bg-border/60" />
            <span className="relative bg-background px-3 text-xs text-muted-foreground uppercase font-semibold">
              {t("auth.or_continue_with", "O continúa con")}
            </span>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full py-3 bg-white text-black border-2 border-[#39FF14]/50 font-bold rounded-xl flex items-center justify-center gap-3 cursor-pointer hover:border-[#FF6B35] transition-all duration-300 shadow-sm hover:scale-[1.01]"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.9-4.53z"
                fill="#EA4335"
              />
            </svg>
            <span>{t("auth.continue_with_google", "Continuar con Google")}</span>
          </button>
        </form>

        <div className="mt-6 text-center">
          <a href="/login" className="text-sm text-primary hover:underline transition-all">
            {t("login.toggle_signin")}
          </a>
        </div>
      </div>
    </div>
  );
}
