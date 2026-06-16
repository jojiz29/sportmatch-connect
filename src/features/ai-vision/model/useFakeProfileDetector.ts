import { useState, useCallback } from "react";
import { detectFakeProfile } from "../api/visionApi";
import type { FakeProfileResult, SupportedLanguage } from "./types";

interface UseFakeProfileDetectorReturn {
  analyzing: boolean;
  result: FakeProfileResult | null;
  error: string | null;
  analyze: (image: Blob) => Promise<void>;
  clear: () => void;
}

export function useFakeProfileDetector(language?: SupportedLanguage): UseFakeProfileDetectorReturn {
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<FakeProfileResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(
    async (image: Blob) => {
      setAnalyzing(true);
      setError(null);
      setResult(null);
      try {
        const res = await detectFakeProfile(image, language);
        setResult(res);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al analizar la foto");
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
