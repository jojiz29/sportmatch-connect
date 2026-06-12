import { useState, useCallback } from "react";

interface Prediction {
  className: "Porn" | "Hentai" | "Sexy" | "Neutral" | "Drawing";
  probability: number;
}

const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = url;
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
  });
};

export const useNSFWJS = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [model, setModel] = useState<any>(null);
  const [loadingModel, setLoadingModel] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadModel = useCallback(async () => {
    if (model) return model;
    setLoadingModel(true);
    setError(null);
    try {
      const tf = await import("@tensorflow/tfjs");
      await tf.ready();
      const nsfwjs = await import("nsfwjs");
      const loadedModel = await nsfwjs.load();
      setModel(loadedModel);
      setLoadingModel(false);
      return loadedModel;
    } catch (err) {
      console.error("Failed to load NSFWJS model:", err);
      setError("Failed to load AI moderation model");
      setLoadingModel(false);
      // Fail gracefully: do not throw to allow fallback behavior
      return null;
    }
  }, [model]);

  const analyzeImage = useCallback(
    async (file: File): Promise<boolean> => {
      let objectUrl = "";
      try {
        const activeModel = model || (await loadModel());
        if (!activeModel) {
          console.warn("NSFWJS model is not loaded. Skipping moderation check (fallback to safe).");
          return true; // Fallback gracefully: allow upload if model failed to load
        }

        objectUrl = URL.createObjectURL(file);
        const img = await loadImage(objectUrl);
        const predictions = (await activeModel.classify(img)) as Prediction[];

        const unsafeClasses = ["Porn", "Hentai", "Sexy"];
        let isUnsafe = false;

        for (const pred of predictions) {
          if (unsafeClasses.includes(pred.className) && pred.probability > 0.6) {
            isUnsafe = true;
            break;
          }
        }

        return !isUnsafe; // Return true if safe, false if unsafe
      } catch (err) {
        console.error("Image analysis error:", err);
        // Fallback gracefully on classification error
        return true;
      } finally {
        if (objectUrl) {
          URL.revokeObjectURL(objectUrl);
        }
      }
    },
    [model, loadModel],
  );

  return { loadModel, analyzeImage, loadingModel, modelLoaded: !!model, error };
};
