/* eslint-disable @typescript-eslint/no-explicit-any */
// ============================================================
// src/features/b2b-ai/__tests__/useB2bAiStore.test.ts
// Tests del store Zustand: transiciones de estado (loading/success/error)
// y fallback a fixtures en demo mode.
// ============================================================

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { useB2bAiStore, selectIsAnyLoading } from "../model/useB2bAiStore";
import { useAuthStore } from "@/entities/user/useAuth";

// Mock del cliente API para no hacer fetch real
vi.mock("../api/b2bAiApi", () => ({
  recommendPricing: vi.fn(),
  optimizeAds: vi.fn(),
  predictChurn: vi.fn(),
}));

// Mock del módulo supabase (necesario para el import chain)
vi.mock("@/shared/api/supabase", () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { access_token: "fake-jwt" } },
      }),
    },
  },
}));

import * as b2bApi from "../api/b2bAiApi";
import { DEMO_PRICING, DEMO_ADS_OPTIMIZATION, DEMO_CHURN_PREDICTION } from "../model/demoFixtures";

describe("useB2bAiStore", () => {
  beforeEach(() => {
    // Reset store
    useB2bAiStore.getState().reset();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================================
  // DEMO MODE
  // ============================================================
  describe("Demo mode (useAuthStore.isDemoMode === true)", () => {
    beforeEach(() => {
      // Forzar demo mode
      useAuthStore.setState({ isDemoMode: true, user: { id: "demo-biz" } as any });
    });

    it("fetchPricing devuelve fixture sin llamar al backend", async () => {
      const result = await useB2bAiStore.getState().fetchPricing({
        courtId: "court-1",
        date: "2026-06-20",
        hour: 19,
      });
      expect(b2bApi.recommendPricing).not.toHaveBeenCalled();
      expect(result).toEqual(DEMO_PRICING);
      expect(useB2bAiStore.getState().pricingRecommendation).toEqual(DEMO_PRICING);
    });

    it("fetchAdsOptimization devuelve fixture", async () => {
      const result = await useB2bAiStore.getState().fetchAdsOptimization({
        adId: "ad-1",
        goal: "ctr",
      });
      expect(b2bApi.optimizeAds).not.toHaveBeenCalled();
      expect(result).toEqual(DEMO_ADS_OPTIMIZATION);
      expect(useB2bAiStore.getState().adsOptimization).toEqual(DEMO_ADS_OPTIMIZATION);
    });

    it("fetchChurnPrediction devuelve fixture", async () => {
      const result = await useB2bAiStore.getState().fetchChurnPrediction({
        businessId: "biz-1",
        lookbackDays: 30,
      });
      expect(b2bApi.predictChurn).not.toHaveBeenCalled();
      expect(result).toEqual(DEMO_CHURN_PREDICTION);
    });
  });

  // ============================================================
  // MODO REAL
  // ============================================================
  describe("Modo real (useAuthStore.isDemoMode === false)", () => {
    beforeEach(() => {
      useAuthStore.setState({ isDemoMode: false, user: { id: "real-biz" } as any });
    });

    it("fetchPricing llama al backend y guarda el resultado", async () => {
      const mockResponse = {
        ...DEMO_PRICING,
        recommendedPrice: 70,
        baseline: 60,
        deltaPct: 0.166,
      };
      vi.mocked(b2bApi.recommendPricing).mockResolvedValueOnce(mockResponse as any);

      const result = await useB2bAiStore.getState().fetchPricing({
        courtId: "court-1",
        date: "2026-06-20",
      });

      expect(b2bApi.recommendPricing).toHaveBeenCalledWith({
        courtId: "court-1",
        date: "2026-06-20",
      });
      expect(result).toEqual(mockResponse);
      expect(useB2bAiStore.getState().pricingRecommendation).toEqual(mockResponse);
      expect(useB2bAiStore.getState().pricingLoading).toBe(false);
      expect(useB2bAiStore.getState().pricingError).toBe(null);
    });

    it("fetchPricing guarda el error y devuelve null si el backend falla", async () => {
      vi.mocked(b2bApi.recommendPricing).mockRejectedValueOnce(new Error("429 rate limit"));

      const result = await useB2bAiStore.getState().fetchPricing({
        courtId: "court-1",
        date: "2026-06-20",
      });

      expect(result).toBe(null);
      expect(useB2bAiStore.getState().pricingError).toContain("429");
      expect(useB2bAiStore.getState().pricingLoading).toBe(false);
    });

    it("fetchAdsOptimization llama al backend", async () => {
      vi.mocked(b2bApi.optimizeAds).mockResolvedValueOnce(DEMO_ADS_OPTIMIZATION as any);
      const result = await useB2bAiStore.getState().fetchAdsOptimization({
        adId: "ad-1",
        goal: "conversions",
      });
      expect(b2bApi.optimizeAds).toHaveBeenCalledWith({ adId: "ad-1", goal: "conversions" });
      expect(result).toEqual(DEMO_ADS_OPTIMIZATION);
    });

    it("fetchChurnPrediction llama al backend", async () => {
      vi.mocked(b2bApi.predictChurn).mockResolvedValueOnce(DEMO_CHURN_PREDICTION as any);
      const result = await useB2bAiStore.getState().fetchChurnPrediction({
        businessId: "biz-1",
        lookbackDays: 7,
      });
      expect(b2bApi.predictChurn).toHaveBeenCalledWith({ businessId: "biz-1", lookbackDays: 7 });
      expect(result).toEqual(DEMO_CHURN_PREDICTION);
    });
  });

  // ============================================================
  // UTILIDADES
  // ============================================================
  describe("Utilidades del store", () => {
    it("reset() limpia todo el estado", () => {
      useB2bAiStore.setState({
        pricingRecommendation: DEMO_PRICING,
        pricingLoading: true,
        adsOptimization: DEMO_ADS_OPTIMIZATION,
        churnPrediction: DEMO_CHURN_PREDICTION,
        pricingError: "Some error",
        adsError: "Other error",
        churnError: "Third error",
      });

      useB2bAiStore.getState().reset();

      const s = useB2bAiStore.getState();
      expect(s.pricingRecommendation).toBe(null);
      expect(s.adsOptimization).toBe(null);
      expect(s.churnPrediction).toBe(null);
      expect(s.pricingLoading).toBe(false);
      expect(s.adsLoading).toBe(false);
      expect(s.churnLoading).toBe(false);
      expect(s.pricingError).toBe(null);
      expect(s.adsError).toBe(null);
      expect(s.churnError).toBe(null);
    });

    it("clearErrors() limpia solo los errores", () => {
      useB2bAiStore.setState({
        pricingRecommendation: DEMO_PRICING,
        pricingError: "Error 1",
        adsError: "Error 2",
        churnError: "Error 3",
      });

      useB2bAiStore.getState().clearErrors();

      const s = useB2bAiStore.getState();
      expect(s.pricingError).toBe(null);
      expect(s.adsError).toBe(null);
      expect(s.churnError).toBe(null);
      // Los resultados se mantienen
      expect(s.pricingRecommendation).toEqual(DEMO_PRICING);
    });
  });

  // ============================================================
  // SELECTOR
  // ============================================================
  describe("selectIsAnyLoading", () => {
    it("devuelve true si algún endpoint está cargando", () => {
      useB2bAiStore.setState({ pricingLoading: true, adsLoading: false, churnLoading: false });
      expect(selectIsAnyLoading(useB2bAiStore.getState())).toBe(true);
    });

    it("devuelve false si ninguno está cargando", () => {
      useB2bAiStore.setState({ pricingLoading: false, adsLoading: false, churnLoading: false });
      expect(selectIsAnyLoading(useB2bAiStore.getState())).toBe(false);
    });
  });
});
