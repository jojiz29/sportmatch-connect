import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Loader2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Camera,
  IdCard,
  UserCheck,
} from "lucide-react";
import { useDniVerification } from "../model/useDniVerification";
import type { SupportedLanguage } from "../model/types";

interface DniVerificationProps {
  language?: SupportedLanguage;
  className?: string;
  onSuccess?: () => void;
}

export function DniVerification({ language, className = "", onSuccess }: DniVerificationProps) {
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [dniPreview, setDniPreview] = useState<string | null>(null);
  const [selfieFile, setSelfieFile] = useState<Blob | null>(null);
  const [dniFile, setDniFile] = useState<Blob | null>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);
  const dniInputRef = useRef<HTMLInputElement>(null);

  const { verifying, result, error, verify, clear } = useDniVerification(language);

  useEffect(() => {
    if (result && result.match) {
      onSuccess?.();
    }
  }, [result, onSuccess]);

  const handleSelfie = useCallback(
    (file: Blob) => {
      setSelfieFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setSelfiePreview(reader.result as string);
      reader.readAsDataURL(file);
      clear();
    },
    [clear],
  );

  const handleDni = useCallback(
    (file: Blob) => {
      setDniFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setDniPreview(reader.result as string);
      reader.readAsDataURL(file);
      clear();
    },
    [clear],
  );

  const handleVerify = async () => {
    if (!selfieFile || !dniFile) return;
    await verify(selfieFile, dniFile);
  };

  const handleReset = () => {
    clear();
    setSelfiePreview(null);
    setDniPreview(null);
    setSelfieFile(null);
    setDniFile(null);
    if (selfieInputRef.current) selfieInputRef.current.value = "";
    if (dniInputRef.current) dniInputRef.current.value = "";
  };

  const canVerify = selfieFile && dniFile && !verifying;
  const isProbableMatch = result ? result.match && result.confidence < 0.7 : false;
  const isUnverified = result ? !result.match && result.confidence < 0.4 : false;

  return (
    <div className={`space-y-5 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/15 grid place-items-center">
          <IdCard className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-base font-bold text-foreground">Verificación de Identidad</h3>
          <p className="text-xs text-muted-foreground">Compara tu selfie con la foto de tu DNI</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Selfie */}
        <div>
          <p className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5">
            <Camera className="h-3.5 w-3.5" /> Selfie actual
          </p>
          {!selfiePreview ? (
            <div
              onClick={() => selfieInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-border/60 hover:border-primary/50 hover:bg-primary/5 rounded-xl cursor-pointer transition-all h-44"
            >
              <Camera className="h-6 w-6 text-primary" />
              <p className="text-xs text-muted-foreground text-center">Sube tu selfie</p>
              <input
                ref={selfieInputRef}
                type="file"
                accept="image/*"
                capture="user"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleSelfie(f);
                }}
              />
            </div>
          ) : (
            <div className="relative rounded-xl overflow-hidden border border-border/50 h-44">
              <img src={selfiePreview} alt="Selfie" className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        {/* DNI */}
        <div>
          <p className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5">
            <IdCard className="h-3.5 w-3.5" /> Foto del DNI
          </p>
          {!dniPreview ? (
            <div
              onClick={() => dniInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-border/60 hover:border-primary/50 hover:bg-primary/5 rounded-xl cursor-pointer transition-all h-44"
            >
              <IdCard className="h-6 w-6 text-primary" />
              <p className="text-xs text-muted-foreground text-center">Sube la foto de tu DNI</p>
              <input
                ref={dniInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleDni(f);
                }}
              />
            </div>
          ) : (
            <div className="relative rounded-xl overflow-hidden border border-border/50 h-44">
              <img src={dniPreview} alt="DNI" className="w-full h-full object-cover" />
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      {canVerify && !result && !error && (
        <button
          type="button"
          onClick={handleVerify}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm transition-all cursor-pointer"
        >
          <UserCheck className="h-4 w-4" />
          Verificar identidad
        </button>
      )}

      {/* Loading */}
      {verifying && (
        <div className="flex items-center justify-center gap-2 px-4 py-4 rounded-xl bg-primary/5 border border-primary/20 text-primary text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Comparando rostros...
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
          {/* Match result */}
          <div
            className={`flex items-center gap-4 p-4 rounded-xl border ${
              result.match
                ? "bg-success/10 border-success/30"
                : isUnverified
                  ? "bg-warning/10 border-warning/30"
                  : "bg-destructive/10 border-destructive/30"
            }`}
          >
            {result.match ? (
              <CheckCircle2 className="h-10 w-10 text-success shrink-0" />
            ) : isUnverified ? (
              <AlertTriangle className="h-10 w-10 text-warning shrink-0" />
            ) : (
              <XCircle className="h-10 w-10 text-destructive shrink-0" />
            )}
            <div>
              <p
                className={`text-base font-bold ${
                  result.match ? "text-success" : isUnverified ? "text-warning" : "text-destructive"
                }`}
              >
                {result.match
                  ? isProbableMatch
                    ? "Coincidencia probable"
                    : "Identidad verificada"
                  : isUnverified
                    ? "No verificable"
                    : "No coincide"}
              </p>
              <p className="text-sm text-foreground/80 mt-0.5">{result.message}</p>
            </div>
          </div>

          {/* Confidence bar */}
          <div className="p-4 rounded-xl bg-accent/30 border border-border/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">
                Nivel de coincidencia
              </span>
              <span className="text-sm font-bold text-foreground">
                {Math.round(result.confidence * 100)}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-accent overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${result.confidence * 100}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={`h-full rounded-full ${
                  result.confidence >= 0.7
                    ? "bg-success"
                    : result.confidence >= 0.4
                      ? "bg-warning"
                      : "bg-destructive"
                }`}
              />
            </div>
          </div>

          {/* Quality info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-accent/30 border border-border/50">
              <p className="text-[10px] text-muted-foreground font-medium uppercase">
                Calidad selfie
              </p>
              <p className="text-sm font-bold text-foreground capitalize mt-1">
                {result.selfieQuality}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-accent/30 border border-border/50">
              <p className="text-[10px] text-muted-foreground font-medium uppercase">Calidad DNI</p>
              <p className="text-sm font-bold text-foreground capitalize mt-1">
                {result.dniQuality}
              </p>
            </div>
          </div>

          {/* Suggestions */}
          {result.suggestions && result.suggestions.length > 0 && (
            <div className="p-4 rounded-xl bg-warning/10 border border-warning/30">
              <p className="text-xs font-bold text-warning mb-2">Sugerencias</p>
              <ul className="space-y-1">
                {result.suggestions.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                    <span className="h-1.5 w-1.5 rounded-full bg-warning/60 shrink-0 mt-2" />
                    {s}
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
            Nueva verificación
          </button>
        </motion.div>
      )}
    </div>
  );
}
