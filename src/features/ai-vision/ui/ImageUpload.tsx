import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, Loader2, ImageIcon, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useVisionStore } from "../model/useVisionStore";
import type { SupportedLanguage } from "../model/types";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];

interface ImageUploadProps {
  onAnalysisComplete?: (analysis: string) => void;
  language?: SupportedLanguage;
  prompt?: string;
  className?: string;
}

export function ImageUpload({
  onAnalysisComplete,
  language,
  prompt,
  className = "",
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<Blob | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const analyzing = useVisionStore((s) => s.analyzing);
  const result = useVisionStore((s) => s.result);
  const error = useVisionStore((s) => s.error);
  const analyze = useVisionStore((s) => s.analyze);
  const clearResult = useVisionStore((s) => s.clearResult);

  const handleFile = useCallback(
    (selectedFile: File | Blob) => {
      setValidationError(null);
      clearResult();

      if (selectedFile instanceof File) {
        if (selectedFile.size > MAX_FILE_SIZE) {
          setValidationError(
            `La imagen es demasiado grande. El límite es de 10MB. (${(selectedFile.size / 1024 / 1024).toFixed(1)}MB)`,
          );
          return;
        }
        if (!ALLOWED_TYPES.includes(selectedFile.type)) {
          setValidationError(
            `Formato no soportado: ${selectedFile.type}. Usa JPG, PNG, WebP, GIF o AVIF.`,
          );
          return;
        }
      }

      setFile(selectedFile);

      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(selectedFile);
    },
    [clearResult],
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
    clearResult();
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleAnalyze = async () => {
    if (!file) return;
    await analyze(file, prompt, language);
    const state = useVisionStore.getState();
    if (state.result && onAnalysisComplete) {
      onAnalysisComplete(state.result.analysis);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Drop zone */}
      {!preview && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => inputRef.current?.click()}
          className="relative flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-border/60 hover:border-primary/50 hover:bg-primary/5 rounded-2xl cursor-pointer transition-all duration-200 group"
        >
          <div className="h-12 w-12 rounded-full bg-primary/10 grid place-items-center group-hover:bg-primary/20 transition-colors">
            <ImageIcon className="h-6 w-6 text-primary" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-foreground">Sube una imagen para analizar</p>
            <p className="text-xs text-muted-foreground mt-1">
              Arrastra y suelta o haz clic para seleccionar
            </p>
            <p className="text-[10px] text-muted-foreground/60 mt-2">
              JPG, PNG, WebP, GIF, AVIF &middot; Máx 10MB
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const selectedFile = e.target.files?.[0];
              if (selectedFile) handleFile(selectedFile);
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
            className="relative rounded-2xl overflow-hidden border border-border/50 bg-accent/20"
          >
            <img src={preview} alt="Preview" className="w-full h-64 object-contain bg-black/5" />
            <div className="absolute top-2 right-2 flex gap-2">
              <button
                type="button"
                onClick={handleRemove}
                disabled={analyzing}
                className="p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition-all cursor-pointer disabled:opacity-50"
                title="Eliminar imagen"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Validation error */}
      {validationError && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {validationError}
        </div>
      )}

      {/* Actions */}
      {preview && !analyzing && !result && !error && (
        <button
          type="button"
          onClick={handleAnalyze}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm transition-all cursor-pointer"
        >
          <Upload className="h-4 w-4" />
          Analizar imagen
        </button>
      )}

      {/* Loading */}
      {analyzing && (
        <div className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary/5 border border-primary/20 text-primary text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Analizando imagen con IA...
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
          className="rounded-xl border border-success/30 bg-success/5 p-4 space-y-3"
        >
          <div className="flex items-center gap-2 text-success">
            <CheckCircle2 className="h-5 w-5" />
            <span className="text-sm font-bold">Análisis completado</span>
          </div>
          <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
            {result.analysis}
          </p>
          <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground pt-1 border-t border-border/30">
            <span>Modelo: {result.model}</span>
            <span>Latencia: {result.latencyMs}ms</span>
            <span>Tokens: {result.tokens}</span>
          </div>
        </motion.div>
      )}
    </div>
  );
}
