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
// STATE TYPES
// ==============================================================
export interface VisionAnalysisState {
  analyzing: boolean;
  result: AnalyzeImageResponse | null;
  error: string | null;
}
