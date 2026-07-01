export type SupportedLanguage = "es" | "en" | "pt";

// ==============================================================
// IMAGE ANALYSIS
// ==============================================================
export interface AnalyzeImageRequest {
  image: Blob;
  prompt?: string;
  language?: SupportedLanguage;
}

export interface AnalyzeImageResponse {
  analysis: string;
  latencyMs: number;
  model: string;
  tokens: number;
}

// ==============================================================
// VIDEO ANALYSIS
// ==============================================================
export interface AnalyzeVideoRequest {
  video: Blob;
  prompt?: string;
  language?: SupportedLanguage;
  frameCount?: number;
}

export interface AnalyzeVideoResponse {
  analysis: string;
  score?: number;
  recommendations?: string[];
  latencyMs: number;
  framesAnalyzed: number;
  model: string;
  tokens: number;
}

// ==============================================================
// #8 — FORM ANALYZER
// ==============================================================
export interface FormAnalysisResult {
  score: number;
  analysis: string;
  recommendations: string[];
  keyPoints: string[];
  detectedLevel: string;
  latencyMs: number;
  framesAnalyzed: number;
  model: string;
  tokens: number;
}

// ==============================================================
// #26 — FAKE PROFILE DETECTOR
// ==============================================================
export interface FakeProfileResult {
  isFake: boolean;
  authenticityScore: number;
  explanation: string;
  confidence: number;
  signals: string[];
  latencyMs: number;
  model: string;
  tokens: number;
}

// ==============================================================
// #32 — DNI VERIFICATION 2.0
// ==============================================================
export interface DniVerificationResult {
  match: boolean;
  confidence: number;
  message: string;
  selfieQuality: string;
  dniQuality: string;
  suggestions: string[];
  latencyMs: number;
  model: string;
  tokens: number;
}

// ==============================================================
// NUTRICIÓN 360 — Análisis nutricional de comidas por foto
// ==============================================================
export interface Nutrition360Request {
  image: Blob;
  language?: SupportedLanguage;
}

export interface Macros {
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface Micronutrient {
  name: string;
  amount: string;
}

export interface Nutrition360Result {
  mealName: string;
  calories: number;
  macros: Macros;
  portionSize: string;
  healthScore: number;
  micronutrients?: Micronutrient[];
  analysis: string;
  recommendations: string[];
  latencyMs: number;
  model: string;
  tokens: number;
}

// ==============================================================
// PLAN ALIMENTICIO — Meal Planner personalizado por IA
// ==============================================================
export type MealGoal = "perder_peso" | "ganar_musculo" | "mantener" | "salud_general";

export interface MealPlanRequest {
  preferences: string[];
  restrictions?: string[];
  goal: MealGoal;
  mealsPerDay: number;
  durationDays: number;
  language?: SupportedLanguage;
}

export interface MealItem {
  name: string;
  type: "desayuno" | "almuerzo" | "cena" | "snack" | "post-entreno";
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: string[];
  preparation: string;
}

export interface DayPlan {
  day: number;
  meals: MealItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

export interface MealPlanResult {
  mealPlan: DayPlan[];
  summary: string;
  tips: string[];
  sustainabilityNotes: string;
  latencyMs: number;
  model: string;
  tokens: number;
}

// ==============================================================
// STATE TYPES
// ==============================================================
export interface VisionAnalysisState {
  analyzing: boolean;
  result: AnalyzeImageResponse | null;
  error: string | null;
}
