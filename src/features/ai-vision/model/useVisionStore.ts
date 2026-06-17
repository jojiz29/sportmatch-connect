import { create } from "zustand";
import { analyzeImage } from "../api/visionApi";
import type { AnalyzeImageResponse, SupportedLanguage } from "./types";

interface VisionState {
  analyzing: boolean;
  result: AnalyzeImageResponse | null;
  error: string | null;
  lastImagePreview: string | null;

  analyze: (image: Blob, prompt?: string, language?: SupportedLanguage) => Promise<void>;
  clearResult: () => void;
  setImagePreview: (preview: string | null) => void;
}

export const useVisionStore = create<VisionState>((set) => ({
  analyzing: false,
  result: null,
  error: null,
  lastImagePreview: null,

  analyze: async (image: Blob, prompt?: string, language?: SupportedLanguage) => {
    set({ analyzing: true, error: null, result: null });
    try {
      const result = await analyzeImage({ image, prompt, language });
      set({ result, analyzing: false });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error desconocido al analizar la imagen";
      set({ error: message, analyzing: false });
    }
  },

  clearResult: () => set({ result: null, error: null, analyzing: false }),
  setImagePreview: (preview) => set({ lastImagePreview: preview }),
}));
