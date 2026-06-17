// ============================================================
// src/features/b2b-ai/api/types.ts
// Tipos espejo del backend para los endpoints B2B-AI.
// Mantener sincronizados con server/src/ai/b2b/dto/*
// ============================================================

import type { PricingRecommendation, AdsOptimization, ChurnPrediction } from "@/entities/types";

// ============================================================
// FEATURE #9 — DYNAMIC PRICING
// ============================================================

export interface PricingRequest {
  courtId: string;
  /** Fecha objetivo YYYY-MM-DD */
  date: string;
  /** Hora específica 0-23 (opcional). Si se omite, devuelve la mejor hora del día. */
  hour?: number;
}

export type PricingResponse = PricingRecommendation;

// ============================================================
// FEATURE #21 — ADS OPTIMIZER
// ============================================================

export interface AdsOptimizeRequest {
  adId: string;
  goal: "ctr" | "conversions";
  /** Número de variantes a generar (1-3). Default: 3 */
  variantCount?: number;
}

export type AdsOptimizeResponse = AdsOptimization;

// ============================================================
// FEATURE #23 — CHURN PREDICTOR
// ============================================================

export interface ChurnPredictRequest {
  businessId: string;
  /** Ventana de análisis en días (7-90). Default: 30 */
  lookbackDays?: number;
}

export type ChurnPredictResponse = ChurnPrediction;
