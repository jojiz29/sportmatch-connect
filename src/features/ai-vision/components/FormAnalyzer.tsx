import React, { useState } from "react";
import { ImageUpload } from "./ImageUpload";
import { analyzeVisionImage } from "../api/aiVisionApi";
import { FormAnalysisResult } from "../types";
import { Activity, CheckCircle2, ChevronRight, Loader2, Trophy } from "lucide-react";
import { toast } from "sonner";

export function FormAnalyzer() {
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<FormAnalysisResult | null>(null);

  const handleUploadSuccess = (url: string) => {
    setUploadedUrl(url);
    setAnalysisResult(null);
  };

  const startAnalysis = async () => {
    if (!uploadedUrl) {
      toast.error("Por favor, sube una imagen primero.");
      return;
    }
    setIsAnalyzing(true);
    const toastId = toast.loading("Analizando postura deportiva con Vertex AI...");
    try {
      const response = await analyzeVisionImage<FormAnalysisResult>({
        imageUrl: uploadedUrl,
        analysisType: "form-analysis",
      });
      setAnalysisResult(response.result);
      toast.success("Análisis biomecánico completado.", { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Error al analizar la imagen.", {
        id: toastId,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
      {/* Upload card */}
      <div className="md:col-span-6 glass border border-border/40 rounded-3xl p-6 space-y-6 flex flex-col justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-foreground flex items-center gap-2 mb-2">
            <Activity className="h-5 w-5 text-primary" />
            Analizador de Postura Deportiva (MVP)
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Sube una fotografía realizando una acción deportiva (por ejemplo, el saque de tenis, el
            tiro de baloncesto, swing de golf, golpe de pádel o flexiones). Vertex AI evaluará la
            alineación corporal, estabilidad, equilibrio y posibles desviaciones.
          </p>
        </div>

        <ImageUpload onUploadSuccess={handleUploadSuccess} isProcessing={isAnalyzing} />

        {uploadedUrl && !analysisResult && (
          <button
            onClick={startAnalysis}
            disabled={isAnalyzing}
            className="w-full py-3 px-4 rounded-xl bg-gradient-primary hover:scale-[1.02] text-primary-foreground font-bold shadow-glow transition-transform active:scale-[0.98] cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 border-0"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analizando con Vertex AI...
              </>
            ) : (
              "Iniciar Análisis Postural"
            )}
          </button>
        )}
      </div>

      {/* Analysis card */}
      <div className="md:col-span-6 glass border border-border/40 rounded-3xl p-6 min-h-[300px] flex flex-col items-center justify-center text-center relative overflow-hidden">
        {isAnalyzing ? (
          <div className="space-y-4 animate-fade-in">
            <div className="relative h-16 w-16 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-pulse" />
              <div className="absolute inset-0 rounded-full border-4 border-t-primary animate-spin" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-foreground">
                Procesando geometría articular...
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                La IA está evaluando los ángulos de alineación de tus articulaciones.
              </p>
            </div>
          </div>
        ) : analysisResult ? (
          <div className="w-full space-y-6 text-left animate-fade-in">
            {/* Score & Badge */}
            <div className="flex items-center justify-between border-b border-border/10 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Score de Alineación
                </span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-4xl font-black text-foreground">
                    {analysisResult.score}
                  </span>
                  <span className="text-sm font-semibold text-muted-foreground">/100</span>
                </div>
              </div>
              <div
                className={`h-12 w-12 rounded-xl flex items-center justify-center shadow-glow ${
                  analysisResult.score >= 80
                    ? "bg-emerald-500/10 text-emerald-400"
                    : analysisResult.score >= 50
                      ? "bg-amber-500/10 text-amber-400"
                      : "bg-red-500/10 text-red-400"
                }`}
              >
                <Trophy className="h-6 w-6" />
              </div>
            </div>

            {/* Fortalezas */}
            <div className="space-y-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Fortalezas biomecánicas
              </span>
              <div className="grid grid-cols-1 gap-2">
                {analysisResult.strengths.map((str, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs text-foreground"
                  >
                    <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{str}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Puntos de mejora */}
            <div className="space-y-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Correcciones y mejoras
              </span>
              <div className="grid grid-cols-1 gap-2">
                {analysisResult.improvements.map((imp, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs text-foreground"
                  >
                    <ChevronRight className="h-4.5 w-4.5 text-amber-400 shrink-0 mt-0.5" />
                    <span>{imp}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3 text-muted-foreground py-12">
            <Activity className="h-12 w-12 mx-auto text-muted-foreground/30" />
            <div>
              <p className="text-sm font-bold">Esperando imagen</p>
              <p className="text-xs max-w-[250px] mx-auto mt-1 leading-relaxed">
                Sube una imagen deportiva en el panel izquierdo y haz click en "Iniciar Análisis
                Postural".
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
