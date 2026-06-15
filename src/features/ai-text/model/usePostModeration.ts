// ============================================================
// src/features/ai-text/model/usePostModeration.ts
// Feature #6 — Hook para moderar texto antes de enviar
// ============================================================

import { useState } from "react";
import { moderateContent } from "../api/textApi";
import type { ModerateRequest, ModerateResponse, ModerationContext } from "../api/types";

export function usePostModeration() {
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<ModerateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function moderate(
    text: string,
    context: ModerationContext = "comment",
  ): Promise<ModerateResponse> {
    setLoading(true);
    setError(null);
    try {
      const request: ModerateRequest = { text, context };
      const res = await moderateContent(request);
      setLastResult(res);
      return res;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  return { moderate, loading, lastResult, error };
}
