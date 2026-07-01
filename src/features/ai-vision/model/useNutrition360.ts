import { useState, useCallback } from "react";
import { analyzeNutrition360 } from "../api/visionApi";
import type { Nutrition360Result, SupportedLanguage } from "./types";

interface UseNutrition360Return {
  analyzing: boolean;
  result: Nutrition360Result | null;
  error: string | null;
  analyze: (image: Blob) => Promise<void>;
  clear: () => void;
}

export function useNutrition360(language?: SupportedLanguage): UseNutrition360Return {
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<Nutrition360Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(
    async (image: Blob) => {
      setAnalyzing(true);
      setError(null);
      setResult(null);
      try {
        const res = await analyzeNutrition360(image, language);
        setResult(res);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al analizar la comida");
      } finally {
        setAnalyzing(false);
      }
    },
    [language],
  );

  const clear = useCallback(() => {
    setResult(null);
    setError(null);
    setAnalyzing(false);
  }, []);

  return { analyzing, result, error, analyze, clear };
}
