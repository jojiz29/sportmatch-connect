import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Bot, MapPin, Target, Sparkles, Loader2 } from "lucide-react";
import {
  fetchCoachRecommendations,
  type CoachPreferences,
  type AiChatResponse,
} from "../api/sportyAiAPI";
import { useAuthStore } from "@/entities/user/useAuth";
import { cn } from "@/lib/utils";

export function SportyRecommendations() {
  const { t, i18n } = useTranslation();
  const language = i18n.language?.startsWith("es")
    ? "es"
    : i18n.language?.startsWith("pt")
      ? "pt"
      : "en";
  const user = useAuthStore((s) => s.user);

  const [sport, setSport] = useState(user?.preferred_sports?.[0] || "");
  const [location, setLocation] = useState("");
  const [level, setLevel] = useState("");
  const [preferences, setPreferences] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiChatResponse | null>(null);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!sport.trim() && !location.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const prefs: CoachPreferences = { language };
      if (sport.trim()) prefs.sport = sport.trim();
      if (location.trim()) prefs.location = location.trim();
      if (level.trim()) prefs.level = level.trim();
      if (preferences.trim()) prefs.preferences = preferences.trim();
      const res = await fetchCoachRecommendations(prefs);
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-card border border-border rounded-2xl p-5">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <Bot className="h-4 w-4 text-neon" />
        {t("wallet.sporty_coach")}
      </h3>
      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            value={sport}
            onChange={(e) => setSport(e.target.value)}
            placeholder={t("wallet.coach_sport_placeholder")}
            className="flex-1 px-3 py-2 rounded-lg bg-background border border-border text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder={t("wallet.coach_location_placeholder")}
            className="flex-1 px-3 py-2 rounded-lg bg-background border border-border text-sm"
          />
        </div>
        <select
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm"
        >
          <option value="">{t("wallet.coach_level_placeholder")}</option>
          <option value="principiante">{t("wallet.coach_level_beginner")}</option>
          <option value="intermedio">{t("wallet.coach_level_intermediate")}</option>
          <option value="avanzado">{t("wallet.coach_level_advanced")}</option>
        </select>
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            value={preferences}
            onChange={(e) => setPreferences(e.target.value)}
            placeholder={t("wallet.coach_prefs_placeholder")}
            className="flex-1 px-3 py-2 rounded-lg bg-background border border-border text-sm"
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={loading || (!sport.trim() && !location.trim())}
          className="w-full py-2 rounded-lg bg-gradient-primary text-primary-foreground text-sm font-semibold hover:scale-[1.02] transition-transform disabled:opacity-50 cursor-pointer"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> {t("wallet.coach_loading")}
            </span>
          ) : (
            t("wallet.coach_ask")
          )}
        </button>
      </div>
      {error && (
        <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive">
          {error}
        </div>
      )}
      {result && (
        <div className="p-4 rounded-xl bg-muted/50 border border-border space-y-3 animate-fade-in">
          <div className="flex items-start gap-2">
            <Bot className="h-4 w-4 text-neon mt-0.5 shrink-0" />
            <p className="text-sm leading-relaxed">{result.reply}</p>
          </div>
          {result.suggestions.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
              {result.suggestions.map((s, i) => (
                <span
                  key={i}
                  className={cn(
                    "px-2 py-1 rounded-full text-xs border cursor-default",
                    "bg-primary/5 border-primary/20 text-primary",
                  )}
                >
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
