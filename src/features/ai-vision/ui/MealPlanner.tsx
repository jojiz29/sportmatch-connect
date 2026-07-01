import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  AlertTriangle,
  ChefHat,
  Utensils,
  Sun,
  Moon,
  Sunrise,
  Cookie,
  Dumbbell,
  Target,
  Salad,
  Heart,
  Lightbulb,
  CalendarDays,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { useMealPlanner } from "../model/useMealPlanner";
import type { MealGoal, DayPlan, MealItem, SupportedLanguage } from "../model/types";

interface MealPlannerProps {
  language?: SupportedLanguage;
  className?: string;
}

type Step = "preferences" | "generating" | "results";

const goals: { value: MealGoal; label: string; desc: string; icon: typeof Target }[] = [
  { value: "perder_peso", label: "Perder peso", desc: "Déficit calórico controlado", icon: Target },
  { value: "ganar_musculo", label: "Ganar músculo", desc: "Superávit proteico", icon: Dumbbell },
  { value: "mantener", label: "Mantener", desc: "Balance calórico estable", icon: Heart },
  { value: "salud_general", label: "Salud general", desc: "Nutrición integral", icon: Salad },
];

const durationOptions = [
  { value: 7, label: "7 días" },
  { value: 14, label: "14 días" },
  { value: 30, label: "30 días" },
];

const mealTypeConfig: Record<string, { label: string; icon: typeof Sun; color: string }> = {
  desayuno: { label: "Desayuno", icon: Sunrise, color: "text-amber-400" },
  almuerzo: { label: "Almuerzo", icon: Sun, color: "text-orange-400" },
  cena: { label: "Cena", icon: Moon, color: "text-indigo-400" },
  snack: { label: "Snack", icon: Cookie, color: "text-pink-400" },
  "post-entreno": { label: "Post-entreno", icon: Dumbbell, color: "text-cyan-400" },
};

function MealCard({ meal }: { meal: MealItem }) {
  const cfg = mealTypeConfig[meal.type] || {
    label: meal.type,
    icon: Utensils,
    color: "text-muted-foreground",
  };
  const Icon = cfg.icon;

  return (
    <div className="rounded-xl border border-border/50 bg-accent/20 p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className={`h-8 w-8 rounded-lg bg-accent/50 grid place-items-center ${cfg.color}`}>
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">{meal.name}</p>
            <span className={`text-[10px] font-semibold uppercase tracking-wider ${cfg.color}`}>
              {cfg.label}
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-amber-400">{meal.calories} kcal</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-[11px]">
        <span className="px-2 py-0.5 rounded-md bg-red-500/10 text-red-400 font-medium">
          P: {meal.protein.toFixed(1)}g
        </span>
        <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 font-medium">
          C: {meal.carbs.toFixed(1)}g
        </span>
        <span className="px-2 py-0.5 rounded-md bg-yellow-500/10 text-yellow-400 font-medium">
          G: {meal.fat.toFixed(1)}g
        </span>
      </div>

      <div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-1">
          Ingredientes
        </p>
        <p className="text-xs text-foreground/75">{meal.ingredients.join(", ")}</p>
      </div>

      <div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-1">
          Preparación
        </p>
        <p className="text-xs text-foreground/75 leading-relaxed">{meal.preparation}</p>
      </div>
    </div>
  );
}

function DayView({ day }: { day: DayPlan }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/20">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-primary" />
          <p className="text-sm font-bold text-foreground">Día {day.day}</p>
        </div>
        <div className="flex gap-3 text-[11px] text-muted-foreground">
          <span className="text-amber-400 font-semibold">{day.totalCalories} kcal</span>
          <span className="text-red-400 font-semibold">P: {day.totalProtein.toFixed(1)}g</span>
          <span className="text-amber-400 font-semibold">C: {day.totalCarbs.toFixed(1)}g</span>
          <span className="text-yellow-400 font-semibold">G: {day.totalFat.toFixed(1)}g</span>
        </div>
      </div>
      {day.meals.map((meal, i) => (
        <MealCard key={i} meal={meal} />
      ))}
    </div>
  );
}

export function MealPlanner({ language, className = "" }: MealPlannerProps) {
  const [step, setStep] = useState<Step>("preferences");
  const [preferences, setPreferences] = useState<string>("");
  const [prefTags, setPrefTags] = useState<string[]>([]);
  const [restrictions, setRestrictions] = useState("");
  const [goal, setGoal] = useState<MealGoal>("salud_general");
  const [mealsPerDay, setMealsPerDay] = useState(4);
  const [durationDays, setDurationDays] = useState(7);
  const [activeDay, setActiveDay] = useState(0);

  const { generating, result, error, generate, clear } = useMealPlanner();

  const addPreferenceTag = useCallback(() => {
    const trimmed = preferences.trim().toLowerCase();
    if (trimmed && !prefTags.includes(trimmed)) {
      setPrefTags((prev) => [...prev, trimmed]);
      setPreferences("");
    }
  }, [preferences, prefTags]);

  const removeTag = useCallback((tag: string) => {
    setPrefTags((prev) => prev.filter((t) => t !== tag));
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        addPreferenceTag();
      }
    },
    [addPreferenceTag],
  );

  const handleGenerate = async () => {
    if (prefTags.length === 0) return;
    setStep("generating");

    await generate({
      preferences: prefTags,
      restrictions: restrictions.trim()
        ? restrictions
            .trim()
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined,
      goal,
      mealsPerDay,
      durationDays,
      language,
    });
  };

  const handleBack = () => {
    clear();
    setStep("preferences");
    setActiveDay(0);
  };

  const handleNewPlan = () => {
    clear();
    setStep("preferences");
    setActiveDay(0);
    setPrefTags([]);
    setPreferences("");
    setRestrictions("");
    setGoal("salud_general");
    setMealsPerDay(4);
    setDurationDays(7);
  };

  return (
    <div className={`space-y-5 ${className}`}>
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500 to-rose-600 grid place-items-center">
          <ChefHat className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="text-base font-bold text-foreground">Plan Alimenticio Personalizado</h3>
          <p className="text-xs text-muted-foreground">
            Recibe un plan de comidas diseñado por IA según tus preferencias y objetivos
          </p>
        </div>
      </div>

      {step === "preferences" && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5"
        >
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-primary">
              Paso 1 de 1: Cuéntanos sobre ti
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Completa tus preferencias para que la IA diseñe un plan perfecto para ti
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Utensils className="h-3.5 w-3.5 text-primary" />
              ¿Qué comidas te gustan?
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {prefTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 text-xs text-foreground"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M18 6 6 18" />
                      <path d="m6 6 12 12" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={preferences}
                onChange={(e) => setPreferences(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ej: pollo, arroz, ensalada, pasta..."
                className="flex-1 px-3 py-2 rounded-xl bg-accent/30 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
              />
              <button
                type="button"
                onClick={addPreferenceTag}
                disabled={!preferences.trim()}
                className="px-3 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
              >
                Agregar
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5 text-primary" />
              Objetivo
            </label>
            <div className="grid grid-cols-2 gap-2">
              {goals.map((g) => {
                const selected = goal === g.value;
                const Icon = g.icon;
                return (
                  <button
                    key={g.value}
                    type="button"
                    onClick={() => setGoal(g.value)}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      selected
                        ? "border-primary/50 bg-primary/10 shadow-sm"
                        : "border-border/50 bg-accent/20 hover:bg-accent/40"
                    }`}
                  >
                    <div
                      className={`h-8 w-8 rounded-lg grid place-items-center shrink-0 ${
                        selected
                          ? "bg-primary/20 text-primary"
                          : "bg-accent/50 text-muted-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p
                        className={`text-xs font-bold ${selected ? "text-primary" : "text-foreground"}`}
                      >
                        {g.label}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{g.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Utensils className="h-3.5 w-3.5 text-primary" />
              Comidas por día: {mealsPerDay}
            </label>
            <input
              type="range"
              min={3}
              max={6}
              value={mealsPerDay}
              onChange={(e) => setMealsPerDay(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>3 comidas</span>
              <span>6 comidas</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5 text-primary" />
              Duración del plan
            </label>
            <div className="flex gap-2">
              {durationOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setDurationDays(opt.value)}
                  className={`flex-1 p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    durationDays === opt.value
                      ? "border-primary/50 bg-primary/10 text-primary font-bold"
                      : "border-border/50 bg-accent/20 text-muted-foreground hover:bg-accent/40"
                  }`}
                >
                  <span className="text-sm font-semibold">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
              Restricciones alimentarias (opcional)
            </label>
            <input
              type="text"
              value={restrictions}
              onChange={(e) => setRestrictions(e.target.value)}
              placeholder="Ej: sin gluten, sin lactosa, vegetariano, vegano..."
              className="w-full px-3 py-2 rounded-xl bg-accent/30 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
            />
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={prefTags.length === 0}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-rose-600 hover:from-orange-600 hover:to-rose-700 text-white font-bold text-sm transition-all cursor-pointer shadow-lg shadow-orange-500/20 disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" />
            Generar mi plan alimenticio
          </button>
        </motion.div>
      )}

      {step === "generating" && generating && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-12 gap-4"
        >
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-orange-500 to-rose-600 grid place-items-center animate-pulse">
            <ChefHat className="h-8 w-8 text-white" />
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-foreground">
              Diseñando tu plan nutricional personalizado...
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              La IA está analizando tus preferencias y creando un plan sostenible para ti
            </p>
          </div>
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </motion.div>
      )}

      {step === "generating" && error && !generating && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </div>
          <button
            type="button"
            onClick={handleBack}
            className="w-full px-4 py-2 rounded-xl bg-accent/50 hover:bg-accent text-muted-foreground text-sm transition-all cursor-pointer"
          >
            Volver a preferencias
          </button>
        </motion.div>
      )}

      {step === "generating" && result && !generating && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5"
        >
          <div className="flex items-center gap-2 text-emerald-400">
            <CheckCircle2 className="h-5 w-5" />
            <span className="text-sm font-bold">Plan generado exitosamente</span>
          </div>

          <div className="p-4 rounded-xl border border-border/50 bg-accent/20">
            <p className="text-sm text-foreground/90 leading-relaxed">{result.summary}</p>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {result.mealPlan.map((day, i) => (
              <button
                key={day.day}
                type="button"
                onClick={() => setActiveDay(i)}
                className={`shrink-0 px-3 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  activeDay === i
                    ? "border-primary/50 bg-primary/10 text-primary"
                    : "border-border/50 bg-accent/20 text-muted-foreground hover:bg-accent/40"
                }`}
              >
                Día {day.day}
              </button>
            ))}
          </div>

          {result.mealPlan[activeDay] && (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeDay}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <DayView day={result.mealPlan[activeDay]} />
              </motion.div>
            </AnimatePresence>
          )}

          {result.tips.length > 0 && (
            <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="h-4 w-4 text-emerald-400" />
                <p className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Consejos para mantener el hábito
                </p>
              </div>
              <ul className="space-y-2">
                {result.tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                    <span className="h-5 w-5 rounded-full bg-emerald-500/15 text-emerald-400 grid place-items-center text-[10px] font-bold shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="p-4 rounded-xl border border-primary/20 bg-primary/5">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="h-4 w-4 text-primary" />
              <p className="text-xs font-bold text-foreground uppercase tracking-wider">
                Notas de sostenibilidad
              </p>
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed">
              {result.sustainabilityNotes}
            </p>
          </div>

          <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground pt-2 border-t border-border/30">
            <span>Modelo: {result.model}</span>
            <span>Latencia: {result.latencyMs}ms</span>
            <span>Tokens: {result.tokens}</span>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleBack}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-accent/50 hover:bg-accent text-muted-foreground text-sm transition-all cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              Ajustar preferencias
            </button>
            <button
              type="button"
              onClick={handleNewPlan}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm transition-all cursor-pointer"
            >
              <Sparkles className="h-4 w-4" />
              Nuevo plan
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
