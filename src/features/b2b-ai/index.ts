// ============================================================
// src/features/b2b-ai/index.ts
// Public API del feature b2b-ai.
// FSD rule: solo lo que se exporta aquí puede ser consumido por otros layers.
// ============================================================

// API client + types
export { recommendPricing, optimizeAds, predictChurn } from "./api/b2bAiApi";

export type {
  PricingRequest,
  PricingResponse,
  AdsOptimizeRequest,
  AdsOptimizeResponse,
  ChurnPredictRequest,
  ChurnPredictResponse,
} from "./api/types";

// Store
export { useB2bAiStore, selectIsAnyLoading } from "./model/useB2bAiStore";
export type { B2bAiState } from "./model/useB2bAiStore";

// Helpers
export {
  formatPEN,
  formatPercent,
  isValidDate,
  isValidHour,
  getTomorrowDate,
  getTodayDate,
  describeShapFeature,
  partitionShapDrivers,
  riskLevelColor,
  riskLevelLabel,
  deltaColor,
} from "./model/pricingHelpers";

// UI components
export { IntelligenceDashboard } from "./ui/IntelligenceDashboard";
export { PricingRecommendationPanel } from "./ui/PricingRecommendationPanel";
export { AdsOptimizerPanel } from "./ui/AdsOptimizerPanel";
export { ChurnPredictorPanel } from "./ui/ChurnPredictorPanel";
export { ShapExplanation } from "./ui/ShapExplanation";
export { InsightBanner } from "./ui/InsightBanner";
