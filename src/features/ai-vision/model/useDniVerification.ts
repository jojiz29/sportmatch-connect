import { useState, useCallback } from "react";
import { verifyDniWithSelfie } from "../api/visionApi";
import type { DniVerificationResult, SupportedLanguage } from "./types";

interface UseDniVerificationReturn {
  verifying: boolean;
  result: DniVerificationResult | null;
  error: string | null;
  verify: (selfie: Blob, dniImage: Blob) => Promise<void>;
  clear: () => void;
}

export function useDniVerification(language?: SupportedLanguage): UseDniVerificationReturn {
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<DniVerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const verify = useCallback(
    async (selfie: Blob, dniImage: Blob) => {
      setVerifying(true);
      setError(null);
      setResult(null);
      try {
        const res = await verifyDniWithSelfie(selfie, dniImage, language);
        setResult(res);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al verificar identidad");
      } finally {
        setVerifying(false);
      }
    },
    [language],
  );

  const clear = useCallback(() => {
    setResult(null);
    setError(null);
    setVerifying(false);
  }, []);

  return { verifying, result, error, verify, clear };
}
