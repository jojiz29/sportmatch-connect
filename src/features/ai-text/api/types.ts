// ============================================================
// src/features/ai-text/api/types.ts — Tipos para endpoints AI Text
// ============================================================

export type SupportedLanguage = "es" | "en" | "pt";

export type ModerationContext = "post" | "comment" | "bio" | "ad";

export interface CommentSuggestionRequest {
  postContext: string;
  partialText: string;
  language?: SupportedLanguage;
}

export interface CommentSuggestionResponse {
  suggestions: string[];
  metadata: {
    tokens: number;
    model: string;
    latencyMs: number;
  };
}

export interface HashtagsRequest {
  content: string;
  minTags?: number;
  maxTags?: number;
  language?: SupportedLanguage;
}

export interface HashtagsResponse {
  tags: string[];
  metadata: {
    tokens: number;
    model: string;
    latencyMs: number;
  };
}

export interface ModerateRequest {
  text: string;
  context?: ModerationContext;
}

export interface ModerateResponse {
  safe: boolean;
  flagged: boolean;
  categorias: {
    toxicity: number;
    harassment: number;
    sexual: number;
    violence: number;
  };
  confidencia: number;
  preview: string;
}
