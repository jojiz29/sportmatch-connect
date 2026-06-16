import { useState, useCallback, useRef } from "react";
import { analyzeForm } from "../api/visionApi";
import type { FormAnalysisResult, SupportedLanguage } from "./types";

interface UseFormAnalyzerOptions {
  language?: SupportedLanguage;
  sport?: string;
}

interface UseFormAnalyzerReturn {
  analyzing: boolean;
  result: FormAnalysisResult | null;
  error: string | null;
  frames: Blob[];
  captureFrame: (frame: Blob) => void;
  clear: () => void;
  analyze: (sport?: string) => Promise<void>;
  frameCount: number;
}

export function useFormAnalyzer(options: UseFormAnalyzerOptions = {}): UseFormAnalyzerReturn {
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<FormAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [frames, setFrames] = useState<Blob[]>([]);
  const lastRequestId = useRef(0);

  const captureFrame = useCallback((frame: Blob) => {
    setFrames((prev) => {
      if (prev.length >= 15) return prev;
      return [...prev, frame];
    });
  }, []);

  const clear = useCallback(() => {
    setFrames([]);
    setResult(null);
    setError(null);
    setAnalyzing(false);
  }, []);

  const analyze = useCallback(
    async (sport?: string) => {
      const currentSport = sport || options.sport || "deporte";
      if (frames.length === 0) {
        setError("Debes capturar al menos 1 frame de video.");
        return;
      }

      const reqId = ++lastRequestId.current;
      setAnalyzing(true);
      setError(null);
      setResult(null);

      try {
        const res = await analyzeForm(frames, currentSport, undefined, options.language);
        if (reqId === lastRequestId.current) {
          setResult(res);
        }
      } catch (err) {
        if (reqId === lastRequestId.current) {
          setError(err instanceof Error ? err.message : "Error al analizar");
        }
      } finally {
        if (reqId === lastRequestId.current) {
          setAnalyzing(false);
        }
      }
    },
    [frames, options.sport, options.language],
  );

  return {
    analyzing,
    result,
    error,
    frames,
    captureFrame,
    clear,
    analyze,
    frameCount: frames.length,
  };
}
