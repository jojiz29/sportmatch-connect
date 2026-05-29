import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/entities/user/useAuth";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { MapPin, User as UserIcon, Mail, Lock, Check } from "lucide-react";
import { Sport } from "@/entities/types";
import { apiClient } from "@/shared/api/apiClient";

export const Route = createFileRoute("/app/register")({
  component: RegisterPage,
});

const STATIC_SPORTS: Sport[] = ["Pádel", "Fútbol", "Tenis", "Running"];

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
      .catch((err) => console.error("Error loading sports:", err));
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
          console.warn("Geolocation failed. Using defaults.", err.message);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (role === "PLAYER" && selectedSports.length === 0) {
      toast.error(t("register.select_sports_error") || "Debes seleccionar al menos un deporte");
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
            ? `Perfil oficial de ${companyName}. ¡Bienvenido a nuestro catálogo!`
            : t("profile.placeholder_bio") || "¡Listo para jugar!",
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

      toast.success(t("register.success_toast") || "¡Registro completado!");
      navigate({ to: "/app" });
    } catch (err: unknown) {
      console.error("Error en registro:", err);
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
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
              role === "PLAYER"
                ? "bg-gradient-primary text-primary-foreground shadow-glow"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Deportista
          </button>
          <button
            type="button"
            onClick={() => setRole("BUSINESS")}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
              role === "BUSINESS"
                ? "bg-gradient-primary text-primary-foreground shadow-glow"
                : "text-muted-foreground hover:text-foreground"
            }`}
            id="register-role-business"
          >
            Empresa
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
                <label className="text-sm font-semibold mb-2 block">Razón Social</label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-background/50 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    placeholder="Ej. Deportes Flores S.A.C."
                    id="register-company-name"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold mb-2 block">Categoría de Negocio</label>
                <select
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value as "Canchas" | "Gym" | "Tienda" | "Bebidas")
                  }
                  className="w-full px-4 py-3 bg-background/50 border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-sm"
                  id="register-business-category"
                >
                  <option value="Tienda">Tienda de Deportes</option>
                  <option value="Canchas">Alquiler de Canchas</option>
                  <option value="Gym">Gimnasio</option>
                  <option value="Bebidas">Bebidas y Nutrición</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold mb-2 block">
                  Ubicación GPS (Coordenadas)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] text-muted-foreground block mb-1">Latitud</span>
                    <input
                      type="number"
                      step="any"
                      required
                      value={lat || ""}
                      onChange={(e) => setLat(parseFloat(e.target.value))}
                      className="w-full px-4 py-2 bg-background/50 border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-sm"
                      placeholder="Latitud"
                      id="register-business-lat"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block mb-1">Longitud</span>
                    <input
                      type="number"
                      step="any"
                      required
                      value={lng || ""}
                      onChange={(e) => setLng(parseFloat(e.target.value))}
                      className="w-full px-4 py-2 bg-background/50 border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-sm"
                      placeholder="Longitud"
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
                className="w-full pl-12 pr-4 py-3 bg-background/50 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                placeholder="tu@email.com"
                id="register-email-input"
              />
            </div>
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
                className="w-full pl-12 pr-4 py-3 bg-background/50 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
                id="register-password-input"
              />
            </div>
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
            className="w-full py-4 mt-4 bg-gradient-primary hover:scale-[1.02] active:scale-[0.98] text-primary-foreground font-bold rounded-xl shadow-glow transition-all cursor-pointer"
          >
            {t("register.btn_register")}
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
