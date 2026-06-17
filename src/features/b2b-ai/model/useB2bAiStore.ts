// ============================================================
// src/features/b2b-ai/model/useB2bAiStore.ts
// Store Zustand para los 3 endpoints B2B-AI.
// Maneja estado de carga, errores, caché de respuestas, y fallback
// a fixtures demo cuando useAuthStore.isDemoMode === true
// (mismo patrón que useAdsStore.ts y useBusinessStore.ts).
// ============================================================

import { create } from "zustand";
import { useAuthStore } from "@/entities/user/useAuth";
import { toast } from "sonner";
import {
  recommendPricing as apiPricing,
  optimizeAds as apiAds,
  predictChurn as apiChurn,
} from "../api/b2bAiApi";
import type {
  PricingRequest,
  PricingResponse,
  AdsOptimizeRequest,
  AdsOptimizeResponse,
  ChurnPredictRequest,
  ChurnPredictResponse,
} from "../api/types";
import { DEMO_PRICING, DEMO_ADS_OPTIMIZATION, DEMO_CHURN_PREDICTION } from "./demoFixtures";

interface B2bAiState {
  // Pricing
  pricingRecommendation: PricingResponse | null;
  pricingLoading: boolean;
  pricingError: string | null;
  // Ads Optimizer
  adsOptimization: AdsOptimizeResponse | null;
  adsLoading: boolean;
  adsError: string | null;
  // Churn Predictor
  churnPrediction: ChurnPredictResponse | null;
  churnLoading: boolean;
  churnError: string | null;

  // Actions
  fetchPricing: (req: PricingRequest) => Promise<PricingResponse | null>;
  fetchAdsOptimization: (req: AdsOptimizeRequest) => Promise<AdsOptimizeResponse | null>;
  fetchChurnPrediction: (req: ChurnPredictRequest) => Promise<ChurnPredictResponse | null>;
  clearErrors: () => void;
  reset: () => void;
}

export const useB2bAiStore = create<B2bAiState>((set) => ({
  pricingRecommendation: null,
  pricingLoading: false,
  pricingError: null,
  adsOptimization: null,
  adsLoading: false,
  adsError: null,
  churnPrediction: null,
  churnLoading: false,
  churnError: null,

  // ============================================================
  // PRICING
  // ============================================================
  async fetchPricing(req) {
    // Demo mode: devolver fixture sin llamar al backend
    if (useAuthStore.getState().isDemoMode) {
      set({ pricingLoading: true, pricingError: null });
      await new Promise((r) => setTimeout(r, 400)); // simular latencia
      set({ pricingRecommendation: DEMO_PRICING, pricingLoading: false });
      return DEMO_PRICING;
    }

    set({ pricingLoading: true, pricingError: null });
    try {
      const result = await apiPricing(req);
      set({ pricingRecommendation: result, pricingLoading: false });
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al obtener recomendación de precio";
      set({ pricingError: msg, pricingLoading: false });
      toast.error(msg);
      return null;
    }
  },

  // ============================================================
  // ADS OPTIMIZER
  // ============================================================
  async fetchAdsOptimization(req) {
    if (useAuthStore.getState().isDemoMode) {
      set({ adsLoading: true, adsError: null });
      await new Promise((r) => setTimeout(r, 600));
      set({ adsOptimization: DEMO_ADS_OPTIMIZATION, adsLoading: false });
      return DEMO_ADS_OPTIMIZATION;
    }

    set({ adsLoading: true, adsError: null });
    try {
      const result = await apiAds(req);
      set({ adsOptimization: result, adsLoading: false });
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al optimizar anuncio";
      set({ adsError: msg, adsLoading: false });
      toast.error(msg);
      return null;
    }
  },

  // ============================================================
  // CHURN PREDICTOR
  // ============================================================
  async fetchChurnPrediction(req) {
    if (useAuthStore.getState().isDemoMode) {
      set({ churnLoading: true, churnError: null });
      await new Promise((r) => setTimeout(r, 500));
      set({ churnPrediction: DEMO_CHURN_PREDICTION, churnLoading: false });
      return DEMO_CHURN_PREDICTION;
    }

    set({ churnLoading: true, churnError: null });
    try {
      const result = await apiChurn(req);
      set({ churnPrediction: result, churnLoading: false });
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al predecir churn";
      set({ churnError: msg, churnLoading: false });
      toast.error(msg);
      return null;
    }
  },

  clearErrors: () => set({ pricingError: null, adsError: null, churnError: null }),

  reset: () =>
    set({
      pricingRecommendation: null,
      pricingLoading: false,
      pricingError: null,
      adsOptimization: null,
      adsLoading: false,
      adsError: null,
      churnPrediction: null,
      churnLoading: false,
      churnError: null,
    }),
}));

// Helper de solo-lectura para que componentes no se re-rendericen si nada cambió
export const selectIsAnyLoading = (s: B2bAiState): boolean =>
  s.pricingLoading || s.adsLoading || s.churnLoading;

// Type export para usar en componentes
export type { B2bAiState };
