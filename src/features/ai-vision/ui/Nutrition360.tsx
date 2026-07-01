import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  AlertTriangle,
  Apple,
  Flame,
  Beef,
  Wheat,
  Droplets,
  Salad,
  Heart,
  CheckCircle2,
  Lightbulb,
} from "lucide-react";
import { useNutrition360 } from "../model/useNutrition360";
import type { SupportedLanguage } from "../model/types";

interface Nutrition360Props {
  language?: SupportedLanguage;
  className?: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

const macroConfig = {
  protein: {
    label: "Proteínas",
    unit: "g",
    color: "text-red-400",
    bg: "bg-red-500/20",
    bar: "bg-red-500",
    icon: Beef,
  },
  carbs: {
    label: "Carbohidratos",
    unit: "g",
    color: "text-amber-400",
    bg: "bg-amber-500/20",
    bar: "bg-amber-500",
    icon: Wheat,
  },
  fat: {
    label: "Grasas",
    unit: "g",
    color: "text-yellow-400",
    bg: "bg-yellow-500/20",
    bar: "bg-yellow-500",
    icon: Droplets,
  },
  fiber: {
    label: "Fibra",
    unit: "g",
    color: "text-emerald-400",
    bg: "bg-emerald-500/20",
    bar: "bg-emerald-500",
    icon: Salad,
  },
};

function getCalorieRange(calories: number): { label: string; color: string; bg: string } {
  if (calories < 300)
    return { label: "Baja en calorías", color: "text-emerald-400", bg: "bg-emerald-500/10" };
  if (calories < 600)
    return { label: "Calorías moderadas", color: "text-amber-400", bg: "bg-amber-500/10" };
  return { label: "Alta en calorías", color: "text-red-400", bg: "bg-red-500/10" };
}

function getHealthScoreColor(score: number): string {
  if (score >= 70) return "text-emerald-400";
  if (score >= 40) return "text-amber-400";
  return "text-red-400";
}

function getHealthScoreBg(score: number): string {
  if (score >= 70) return "border-emerald-500/30 bg-emerald-500/10";
  if (score >= 40) return "border-amber-500/30 bg-amber-500/10";
  return "border-red-500/30 bg-red-500/10";
}

function getHealthScoreLabel(score: number): string {
  if (score >= 70) return "Saludable";
  if (score >= 40) return "Moderado";
  return "Poco saludable";
}

export function Nutrition360({ language, className = "" }: Nutrition360Props) {
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<Blob | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { analyzing, result, error, analyze, clear } = useNutrition360(language);

  const handleFile = useCallback(
    (selectedFile: Blob) => {
      setValidationError(null);
      clear();

      if (selectedFile instanceof File) {
        if (selectedFile.size > MAX_FILE_SIZE) {
          setValidationError(
            `La imagen es demasiado grande. El límite es de 10MB. (${(selectedFile.size / 1024 / 1024).toFixed(1)}MB)`,
          );
          return;
        }
        if (!ALLOWED_TYPES.includes(selectedFile.type)) {
          setValidationError(
            `Formato no soportado: ${selectedFile.type}. Usa JPG, PNG, WebP o AVIF.`,
          );
          return;
        }
      }

      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(selectedFile);
    },
    [clear],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const droppedFile = e.dataTransfer.files?.[0];
      if (droppedFile) handleFile(droppedFile);
    },
    [handleFile],
  );

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleRemove = () => {
    setPreview(null);
    setFile(null);
    setValidationError(null);
    clear();
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleAnalyze = async () => {
    if (!file) return;
    await analyze(file);
  };

  return (
    <div className={`space-y-5 ${className}`}>
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 grid place-items-center">
          <Apple className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="text-base font-bold text-foreground">Nutrición 360</h3>
          <p className="text-xs text-muted-foreground">
            Toma una foto a tu comida y descubre su valor nutricional
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-primary">Cómo funciona</p>
        <p className="mt-2 text-sm leading-relaxed text-foreground/85">
          Sube una foto clara de tu plato de comida. La IA analizará los alimentos visibles y te
          dará una estimación de calorías, macronutrientes, puntuación de salud y recomendaciones
          personalizadas para mejorar tu alimentación.
        </p>
      </div>

      {!preview && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          role="button"
          tabIndex={0}
          className="relative flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-border/60 hover:border-emerald-500/50 hover:bg-emerald-500/5 rounded-2xl cursor-pointer transition-all duration-200 group"
        >
          <div className="h-14 w-14 rounded-full bg-emerald-500/10 grid place-items-center group-hover:bg-emerald-500/20 transition-colors">
            <Apple className="h-7 w-7 text-emerald-400" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-foreground">Sube una foto de tu comida</p>
            <p className="text-xs text-muted-foreground mt-1">
              Arrastra y suelta o haz clic para seleccionar
            </p>
            <p className="text-[10px] text-muted-foreground/60 mt-2">
              JPG, PNG, WebP, AVIF &middot; Máx 10MB
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
        </div>
      )}

      <AnimatePresence>
        {preview && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative rounded-2xl overflow-hidden border border-border/50 bg-accent/20"
          >
            <img src={preview} alt="Comida" className="w-full h-56 object-contain bg-black/5" />
            <div className="absolute top-2 right-2 flex gap-2">
              <button
                type="button"
                onClick={handleRemove}
                disabled={analyzing}
                className="p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition-all cursor-pointer disabled:opacity-50"
                title="Eliminar imagen"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {validationError && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {validationError}
        </div>
      )}

      {preview && !analyzing && !result && !error && (
        <button
          type="button"
          onClick={handleAnalyze}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold text-sm transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
        >
          <Apple className="h-4 w-4" />
          Analizar valor nutricional
        </button>
      )}

      {analyzing && (
        <div className="flex items-center justify-center gap-2 px-4 py-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-emerald-400 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Analizando tu comida con IA...
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2 text-emerald-400">
            <CheckCircle2 className="h-5 w-5" />
            <span className="text-sm font-bold">Análisis completado</span>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-gradient-to-r from-emerald-500/5 to-green-500/5">
            <div className="flex items-center gap-3">
              <Apple className="h-8 w-8 text-emerald-400" />
              <div>
                <p className="text-xs text-muted-foreground font-medium">Plato detectado</p>
                <p className="text-lg font-bold text-foreground">{result.mealName}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Porción</p>
              <p className="text-sm font-semibold text-foreground">{result.portionSize}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div
              className={`flex flex-col items-center justify-center p-4 rounded-xl border ${getHealthScoreBg(result.healthScore)}`}
            >
              <Heart className={`h-6 w-6 ${getHealthScoreColor(result.healthScore)}`} />
              <p className={`text-2xl font-bold mt-1 ${getHealthScoreColor(result.healthScore)}`}>
                {result.healthScore}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
                Health Score
              </p>
              <p
                className={`text-xs font-semibold mt-0.5 ${getHealthScoreColor(result.healthScore)}`}
              >
                {getHealthScoreLabel(result.healthScore)}
              </p>
            </div>

            <div className="flex flex-col items-center justify-center p-4 rounded-xl border border-amber-500/30 bg-amber-500/5">
              <Flame className="h-6 w-6 text-amber-400" />
              <p className="text-2xl font-bold mt-1 text-amber-400">{result.calories}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
                Calorías
              </p>
              <p
                className={`text-xs font-semibold mt-0.5 ${getCalorieRange(result.calories).color}`}
              >
                {getCalorieRange(result.calories).label}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-border/50 bg-accent/20 space-y-3">
            <p className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
              <Beef className="h-4 w-4 text-primary" />
              Macros
            </p>
            {(["protein", "carbs", "fat", "fiber"] as const).map((key) => {
              const cfg = macroConfig[key];
              const value = result.macros[key];
              const maxVal =
                key === "protein" ? 50 : key === "carbs" ? 80 : key === "fat" ? 40 : 30;
              const pct = Math.min((value / maxVal) * 100, 100);
              const Icon = cfg.icon;
              return (
                <div key={key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <Icon className={`h-3.5 w-3.5 ${cfg.color}`} />
                      <span className="text-muted-foreground">{cfg.label}</span>
                    </div>
                    <span className={`font-bold ${cfg.color}`}>
                      {value.toFixed(1)}
                      {cfg.unit}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-accent/50 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${cfg.bar}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {result.micronutrients && result.micronutrients.length > 0 && (
            <div className="p-4 rounded-xl border border-border/50 bg-accent/20">
              <p className="text-xs font-bold text-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <Heart className="h-4 w-4 text-primary" />
                Micros
              </p>
              <div className="flex flex-wrap gap-2">
                {result.micronutrients.map((m, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 text-xs text-foreground/80"
                  >
                    {m.name}: <span className="font-bold text-primary">{m.amount}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="p-4 rounded-xl border border-border/50 bg-accent/20">
            <p className="text-sm text-foreground/90 leading-relaxed">{result.analysis}</p>
          </div>

          {result.recommendations.length > 0 && (
            <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="h-4 w-4 text-emerald-400" />
                <p className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Consejos Nutricionales 360
                </p>
              </div>
              <ul className="space-y-2">
                {result.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                    <span className="h-5 w-5 rounded-full bg-emerald-500/15 text-emerald-400 grid place-items-center text-[10px] font-bold shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground pt-2 border-t border-border/30">
            <span>Modelo: {result.model}</span>
            <span>Latencia: {result.latencyMs}ms</span>
            <span>Tokens: {result.tokens}</span>
          </div>

          <button
            type="button"
            onClick={handleRemove}
            className="w-full px-4 py-2 rounded-xl bg-accent/50 hover:bg-accent text-muted-foreground text-sm transition-all cursor-pointer"
          >
            Analizar otra comida
          </button>
        </motion.div>
      )}
    </div>
  );
}
