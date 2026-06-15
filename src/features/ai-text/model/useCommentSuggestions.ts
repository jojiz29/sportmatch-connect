// ============================================================
// src/features/ai-text/model/useCommentSuggestions.ts
// Feature #2 — Hook con debounce para sugerencias de comentarios
// ============================================================

import { useEffect, useRef, useState } from "react";
import { getCommentSuggestions } from "../api/textApi";
import type { SupportedLanguage } from "../api/types";

export function useCommentSuggestions(
  postContext: string,
  partialText: string,
  options?: { language?: SupportedLanguage; debounceMs?: number; minLength?: number },
) {
  const debounceMs = options?.debounceMs ?? 800;
  const minLength = options?.minLength ?? 3;
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastReqId = useRef(0);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    if (partialText.trim().length < minLength) {
      setSuggestions([]);
      setError(null);
      return;
    }
    const reqId = ++lastReqId.current;
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getCommentSuggestions({
          postContext,
          partialText,
          language: options?.language,
        });
        if (reqId === lastReqId.current) {
          setSuggestions(res.suggestions);
        }
      } catch (err) {
        if (reqId === lastReqId.current) {
          setError(err instanceof Error ? err.message : "Error desconocido");
          setSuggestions([]);
        }
      } finally {
        if (reqId === lastReqId.current) {
          setLoading(false);
        }
      }
    }, debounceMs);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [postContext, partialText, options?.language, debounceMs, minLength]);

  return { suggestions, loading, error };
}
