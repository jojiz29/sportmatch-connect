// ============================================================
// src/features/ai-text/model/useHashtagGenerator.ts
// Feature #3 — Hook para generar hashtags al crear un post
// ============================================================

import { useState } from "react";
import { generateHashtags } from "../api/textApi";
import type { HashtagsRequest, HashtagsResponse, SupportedLanguage } from "../api/types";

export function useHashtagGenerator() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate(
    content: string,
    options?: { language?: SupportedLanguage; minTags?: number; maxTags?: number },
  ): Promise<string[]> {
    setLoading(true);
    setError(null);
    try {
      const request: HashtagsRequest = {
        content,
        minTags: options?.minTags ?? 3,
        maxTags: options?.maxTags ?? 5,
        language: options?.language,
      };
      const res: HashtagsResponse = await generateHashtags(request);
      return res.tags;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      setError(msg);
      return [];
    } finally {
      setLoading(false);
    }
  }

  return { generate, loading, error };
}
