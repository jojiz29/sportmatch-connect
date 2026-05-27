import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/entities/user/useAuth";
import { useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { MapPin, User as UserIcon, Mail, Lock, Check } from "lucide-react";
import { Sport } from "@/entities/types";

export const Route = createFileRoute("/app/register")({
  component: RegisterPage,
});

const SPORTS: Sport[] = ["Pádel", "Fútbol", "Tenis", "Running"];

function RegisterPage() {
  const { t } = useTranslation();
  const { register } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedSports, setSelectedSports] = useState<Sport[]>([]);

  const toggleSport = (sport: Sport) => {
    if (selectedSports.includes(sport)) {
      setSelectedSports(selectedSports.filter((s) => s !== sport));
    } else {
      setSelectedSports([...selectedSports, sport]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedSports.length === 0) {
      toast.error(t("register.select_sports_error"));
      return;
    }

    try {
      await register({
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        name: fullName,
        age: 25,
        city: "Lima",
        avatar_url: "https://i.pravatar.cc/150",
        bio: t("profile.placeholder_bio") || "¡Listo para jugar!",
        trust_score: 100,
        fitcoins_balance: 500,
        level: "Intermedio",
        preferred_sports: selectedSports,
        matches_played: 0,
        last_location_lat: -12.1189,
        last_location_lng: -76.995,
      });

      toast.success(t("register.success_toast"));
      navigate({ to: "/app" });
    } catch {
      toast.error(t("register.error_toast"));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg bg-gradient-card border border-border rounded-3xl p-8 shadow-card backdrop-blur-md">
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-primary shadow-glow mb-4">
            <MapPin className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-neon bg-clip-text text-transparent">
            {t("register.title")}
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">{t("register.subtitle")}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
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
              />
            </div>
          </div>

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
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold mb-3 block">{t("register.sports")}</label>
            <div className="flex flex-wrap gap-2">
              {SPORTS.map((sport) => {
                const isSelected = selectedSports.includes(sport);
                return (
                  <button
                    key={sport}
                    type="button"
                    onClick={() => toggleSport(sport)}
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

          <button
            type="submit"
            className="w-full py-4 mt-4 bg-gradient-primary hover:scale-[1.02] active:scale-[0.98] text-primary-foreground font-bold rounded-xl shadow-glow transition-all"
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
