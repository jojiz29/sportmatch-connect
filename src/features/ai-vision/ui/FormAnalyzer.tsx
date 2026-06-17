import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  Camera,
  Video,
  Loader2,
  AlertTriangle,
  Trophy,
  Target,
  Lightbulb,
  TrendingUp,
} from "lucide-react";
import { useFormAnalyzer } from "../model/useFormAnalyzer";
import type { SupportedLanguage } from "../model/types";

const SPORTS = ["fútbol", "pádel", "tenis", "vóley", "básquet", "running", "natación"];

interface FormAnalyzerProps {
  language?: SupportedLanguage;
  className?: string;
}

export function FormAnalyzer({ language, className = "" }: FormAnalyzerProps) {
  const [selectedSport, setSelectedSport] = useState("fútbol");
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { analyzing, result, error, captureFrame, clear, analyze, frameCount } = useFormAnalyzer({
    language,
    sport: selectedSport,
  });

  const handleVideoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 30 * 1024 * 1024) {
      alert("El video es demasiado grande (máx 30MB)");
      return;
    }
    setVideoPreview(URL.createObjectURL(file));
  }, []);

  const extractFrames = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const duration = video.duration;
    if (!duration || duration <= 0) return;

    const frameCount = Math.min(Math.floor(duration / 2), 15);
    const interval = duration / frameCount;

    const capture = (time: number) => {
      video.currentTime = time;
    };

    let captured = 0;
    video.onseeked = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      canvas.toBlob(
        (blob) => {
          if (blob) captureFrame(blob);
          captured++;
          if (captured < frameCount) {
            capture(captured * interval);
          }
        },
        "image/jpeg",
        0.8,
      );
    };

    capture(0);
  }, [captureFrame]);

  const handleAnalyze = async () => {
    await analyze(selectedSport);
  };

  const handleReset = () => {
    clear();
    setVideoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className={`space-y-5 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/15 grid place-items-center">
          <Video className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-base font-bold text-foreground">Form Analyzer</h3>
          <p className="text-xs text-muted-foreground">Analiza tu técnica deportiva con IA</p>
        </div>
      </div>

      {/* Sport selector */}
      <div className="flex flex-wrap gap-2">
        {SPORTS.map((sport) => (
          <button
            key={sport}
            type="button"
            onClick={() => setSelectedSport(sport)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              selectedSport === sport
                ? "bg-primary text-primary-foreground"
                : "bg-accent/50 text-muted-foreground hover:bg-accent"
            }`}
          >
            {sport.charAt(0).toUpperCase() + sport.slice(1)}
          </button>
        ))}
      </div>

      {/* Video upload */}
      {!videoPreview && (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-border/60 hover:border-primary/50 hover:bg-primary/5 rounded-2xl cursor-pointer transition-all"
        >
          <div className="h-12 w-12 rounded-full bg-primary/10 grid place-items-center">
            <Upload className="h-6 w-6 text-primary" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-foreground">Sube tu video deportivo</p>
            <p className="text-xs text-muted-foreground mt-1">
              MP4, WebM &middot; Máx 30 seg &middot; 30MB
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={handleVideoUpload}
          />
        </div>
      )}

      {/* Video preview + frame extraction */}
      <AnimatePresence>
        {videoPreview && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <video
              ref={videoRef}
              src={videoPreview}
              className="w-full rounded-xl border border-border/50 bg-black/5 max-h-64"
              controls
              preload="auto"
              onLoadedMetadata={extractFrames}
            />
            <canvas ref={canvasRef} className="hidden" />

            {frameCount > 0 && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Camera className="h-3.5 w-3.5" />
                <span>{frameCount} frames capturados</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      {videoPreview && !analyzing && !result && !error && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={frameCount === 0}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 disabled:bg-muted disabled:cursor-not-allowed text-primary-foreground font-semibold text-sm transition-all cursor-pointer"
          >
            <Video className="h-4 w-4" />
            Analizar técnica
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2.5 rounded-xl bg-accent/50 hover:bg-accent text-muted-foreground text-sm transition-all cursor-pointer"
          >
            Reset
          </button>
        </div>
      )}

      {/* Loading */}
      {analyzing && (
        <div className="flex items-center justify-center gap-2 px-4 py-4 rounded-xl bg-primary/5 border border-primary/20 text-primary text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Analizando técnica deportiva...
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
          <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
            <div className="flex items-center gap-3">
              <Trophy className="h-8 w-8 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground font-medium">Score técnico</p>
                <p className="text-2xl font-bold text-foreground">{result.score}/100</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Nivel</p>
              <p className="text-sm font-bold text-primary capitalize">{result.detectedLevel}</p>
            </div>
          </div>

          {/* Analysis */}
          <div className="p-4 rounded-xl bg-accent/30 border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <p className="text-xs font-bold text-foreground uppercase tracking-wider">Análisis</p>
            </div>
            <p className="text-sm text-foreground/90 leading-relaxed">{result.analysis}</p>
          </div>

          {/* Recommendations */}
          {result.recommendations.length > 0 && (
            <div className="p-4 rounded-xl bg-accent/30 border border-border/50">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="h-4 w-4 text-primary" />
                <p className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Recomendaciones
                </p>
              </div>
              <ul className="space-y-2">
                {result.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                    <span className="h-5 w-5 rounded-full bg-primary/10 grid place-items-center text-primary text-[10px] font-bold shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Key points */}
          {result.keyPoints.length > 0 && (
            <div className="p-4 rounded-xl bg-accent/30 border border-border/50">
              <div className="flex items-center gap-2 mb-3">
                <Target className="h-4 w-4 text-primary" />
                <p className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Puntos clave
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {result.keyPoints.map((point, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-medium"
                  >
                    {point}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Meta */}
          <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground">
            <span>Frames: {result.framesAnalyzed}</span>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="w-full px-4 py-2 rounded-xl bg-accent/50 hover:bg-accent text-muted-foreground text-sm transition-all cursor-pointer"
          >
            Nuevo análisis
          </button>
        </motion.div>
      )}
    </div>
  );
}
