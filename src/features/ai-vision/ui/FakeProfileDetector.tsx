import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  Loader2,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  ScanFace,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { useFakeProfileDetector } from "../model/useFakeProfileDetector";
import type { SupportedLanguage } from "../model/types";

interface FakeProfileDetectorProps {
  language?: SupportedLanguage;
  className?: string;
}

export function FakeProfileDetector({ language, className = "" }: FakeProfileDetectorProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<Blob | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { analyzing, result, error, analyze, clear } = useFakeProfileDetector(language);

  const handleFile = useCallback(
    (selectedFile: Blob) => {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(selectedFile);
      clear();
    },
    [clear],
  );

  const handleAnalyze = async () => {
    if (!file) return;
    await analyze(file);
  };

  const handleReset = () => {
    clear();
    setPreview(null);
    setFile(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const scoreColor = result
    ? result.authenticityScore >= 70
      ? "text-success"
      : result.authenticityScore >= 40
        ? "text-warning"
        : "text-destructive"
    : "";

  const scoreBg = result
    ? result.authenticityScore >= 70
      ? "bg-success/10 border-success/30"
      : result.authenticityScore >= 40
        ? "bg-warning/10 border-warning/30"
        : "bg-destructive/10 border-destructive/30"
    : "";

  return (
    <div className={`space-y-5 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/15 grid place-items-center">
          <ScanFace className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-base font-bold text-foreground">Fake Profile Detector</h3>
          <p className="text-xs text-muted-foreground">Detecta fotos de perfil generadas por IA</p>
        </div>
      </div>

      {/* Upload */}
      {!preview && (
        <div
          onClick={() => inputRef.current?.click()}
          className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-border/60 hover:border-primary/50 hover:bg-primary/5 rounded-2xl cursor-pointer transition-all"
        >
          <div className="h-12 w-12 rounded-full bg-primary/10 grid place-items-center">
            <Upload className="h-6 w-6 text-primary" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-foreground">Sube una foto de perfil</p>
            <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WebP &middot; Máx 10MB</p>
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

      {/* Preview */}
      <AnimatePresence>
        {preview && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative rounded-2xl overflow-hidden border border-border/50"
          >
            <img src={preview} alt="Preview" className="w-full h-56 object-contain bg-black/5" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      {preview && !analyzing && !result && !error && (
        <button
          type="button"
          onClick={handleAnalyze}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm transition-all cursor-pointer"
        >
          <ScanFace className="h-4 w-4" />
          Detectar si es IA
        </button>
      )}

      {/* Loading */}
      {analyzing && (
        <div className="flex items-center justify-center gap-2 px-4 py-4 rounded-xl bg-primary/5 border border-primary/20 text-primary text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Analizando autenticidad...
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Score */}
          <div className={`flex items-center justify-between p-4 rounded-xl border ${scoreBg}`}>
            <div className="flex items-center gap-3">
              {result.authenticityScore >= 70 ? (
                <ShieldCheck className="h-8 w-8 text-success" />
              ) : (
                <ShieldAlert className="h-8 w-8 text-destructive" />
              )}
              <div>
                <p className="text-xs text-muted-foreground font-medium">Autenticidad</p>
                <p className={`text-2xl font-bold ${scoreColor}`}>{result.authenticityScore}/100</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Confianza</p>
              <p className="text-sm font-bold text-foreground">
                {Math.round(result.confidence * 100)}%
              </p>
            </div>
          </div>

          {/* Badge */}
          <div
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border ${
              result.authenticityScore >= 70
                ? "bg-success/10 border-success/30"
                : "bg-destructive/10 border-destructive/30"
            }`}
          >
            {result.authenticityScore >= 70 ? (
              <ShieldCheck className="h-5 w-5 text-success shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
            )}
            <p
              className={`text-sm font-semibold ${
                result.authenticityScore >= 70 ? "text-success" : "text-destructive"
              }`}
            >
              {result.authenticityScore >= 70
                ? "Foto auténtica — perfil verificado"
                : "Posible foto generada por IA"}
            </p>
          </div>

          {/* Explanation */}
          <div className="p-4 rounded-xl bg-accent/30 border border-border/50">
            <p className="text-sm text-foreground/90 leading-relaxed">{result.explanation}</p>
          </div>

          {/* Signals */}
          {result.signals.length > 0 && (
            <div className="p-4 rounded-xl bg-accent/30 border border-border/50">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-primary" />
                <p className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Señales detectadas
                </p>
              </div>
              <ul className="space-y-1.5">
                {result.signals.map((signal, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-foreground/80">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary/60 shrink-0" />
                    {signal}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            type="button"
            onClick={handleReset}
            className="w-full px-4 py-2 rounded-xl bg-accent/50 hover:bg-accent text-muted-foreground text-sm transition-all cursor-pointer"
          >
            Analizar otra foto
          </button>
        </motion.div>
      )}
    </div>
  );
}
