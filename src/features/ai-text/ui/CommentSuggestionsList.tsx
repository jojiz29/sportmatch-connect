// ============================================================
// src/features/ai-text/ui/CommentSuggestionsList.tsx
// Feature #2 — Lista de sugerencias clicables para comentarios
// ============================================================

import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, AlertTriangle } from "lucide-react";
import { useCommentSuggestions } from "../model/useCommentSuggestions";
import type { SupportedLanguage } from "../api/types";

interface CommentSuggestionsListProps {
  postContext: string;
  partialText: string;
  onSelect: (suggestion: string) => void;
  language?: SupportedLanguage;
  minLength?: number;
}

export function CommentSuggestionsList({
  postContext,
  partialText,
  onSelect,
  language,
  minLength,
}: CommentSuggestionsListProps) {
  const { suggestions, loading, error } = useCommentSuggestions(postContext, partialText, {
    language,
    minLength,
  });

  if (error) {
    return (
      <div className="flex items-center gap-1.5 text-[10px] text-destructive/80 mt-1">
        <AlertTriangle className="h-3 w-3" />
        {error}
      </div>
    );
  }

  if (suggestions.length === 0 && !loading) return null;

  return (
    <AnimatePresence>
      {(loading || suggestions.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.15 }}
          className="flex flex-wrap gap-1.5 mt-1.5"
        >
          {loading && suggestions.length === 0 && (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" /> Generando sugerencias...
            </span>
          )}
          {suggestions.map((s, i) => (
            <motion.button
              key={`${s}-${i}`}
              type="button"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => onSelect(s)}
              className="flex items-center gap-1 px-2 py-1 text-[10px] rounded-md bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-colors cursor-pointer"
            >
              <Sparkles className="h-3 w-3" />
              {s}
            </motion.button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
