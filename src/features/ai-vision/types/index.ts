export type VisionAnalysisType = "fake-profile" | "form-analysis";

export interface AnalyzeVisionPayload {
  imageUrl: string;
  analysisType: VisionAnalysisType;
}

export interface FakeProfileResult {
  isLikelyAIGenerated: boolean;
  confidence: number;
  reasons: string[];
}

export interface FormAnalysisResult {
  score: number;
  strengths: string[];
  improvements: string[];
  confidence?: number;
}

export interface VisionAnalysisResponse<T = FakeProfileResult | FormAnalysisResult> {
  result: T;
  confidence: number;
}
