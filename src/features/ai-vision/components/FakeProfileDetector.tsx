import React, { useState } from "react";
import { ImageUpload } from "./ImageUpload";
import { analyzeVisionImage } from "../api/aiVisionApi";
import { FakeProfileResult } from "../types";
import { ShieldAlert, ShieldCheck, AlertCircle, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function FakeProfileDetector() {
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<FakeProfileResult | null>(null);

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
    const toastId = toast.loading("Analizando imagen con Vertex AI...");
    try {
      const response = await analyzeVisionImage<FakeProfileResult>({
        imageUrl: uploadedUrl,
        analysisType: "fake-profile",
      });
      setAnalysisResult(response.result);
      toast.success("Análisis completado.", { id: toastId });
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
            <Sparkles className="h-5 w-5 text-primary" />
            Detector de Perfil Artificial
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Sube la foto de perfil que deseas auditar. El sistema evaluará patrones en ojos,
            iluminación, dientes, consistencia facial y textura de piel para determinar si fue
            generada artificialmente por una IA (StyleGAN, Midjourney, etc.).
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
              "Iniciar Análisis Biométrico"
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
              <p className="text-sm font-extrabold text-foreground">Escaneando píxeles...</p>
              <p className="text-xs text-muted-foreground mt-1">
                Vertex AI está buscando artefactos visuales de generación sintética.
              </p>
            </div>
          </div>
        ) : analysisResult ? (
          <div className="w-full space-y-6 text-left animate-fade-in">
            {/* Veredicto */}
            <div
              className={`flex items-start gap-4 p-4 rounded-2xl border ${
                analysisResult.isLikelyAIGenerated
                  ? "bg-red-500/10 border-red-500/30 text-red-400"
                  : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              }`}
            >
              {analysisResult.isLikelyAIGenerated ? (
                <ShieldAlert className="h-10 w-10 shrink-0" />
              ) : (
                <ShieldCheck className="h-10 w-10 shrink-0" />
              )}
              <div>
                <h3 className="font-extrabold text-sm uppercase tracking-wide">
                  {analysisResult.isLikelyAIGenerated
                    ? "Generada por IA Detectada"
                    : "Imagen Real Validada"}
                </h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {analysisResult.isLikelyAIGenerated
                    ? "El análisis indica que esta foto presenta inconsistencias típicas de modelos de difusión de IA."
                    : "No se encontraron patrones sintéticos. La imagen parece ser una fotografía real."}
                </p>
              </div>
            </div>

            {/* Score */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-muted-foreground">Confianza del análisis</span>
                <span className="text-foreground">
                  {(analysisResult.confidence * 100).toFixed(0)}%
                </span>
              </div>
              <div className="h-2.5 w-full bg-border/20 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    analysisResult.isLikelyAIGenerated ? "bg-red-500" : "bg-emerald-500"
                  }`}
                  style={{ width: `${analysisResult.confidence * 100}%` }}
                />
              </div>
            </div>

            {/* Razones */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide block">
                Factores clave de evaluación
              </span>
              <ul className="space-y-2.5">
                {analysisResult.reasons.map((reason, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs text-foreground">
                    <AlertCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span className="leading-snug">{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-3 text-muted-foreground py-12">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground/30" />
            <div>
              <p className="text-sm font-bold">Esperando imagen</p>
              <p className="text-xs max-w-[250px] mx-auto mt-1 leading-relaxed">
                Sube una imagen de perfil en el panel izquierdo y haz click en "Iniciar Análisis".
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
