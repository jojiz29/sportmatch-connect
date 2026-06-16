/**
 * ===================================================================
 * ARCHIVO: src/shared/hooks/useNSFWJS.ts
 * PROPÓSITO: Hook personalizado para moderación de imágenes con NSFWJS.
 *            Detecta contenido inapropiado (Porn, Hentai, Sexy) usando
 *            TensorFlow.js + NSFWJS antes de permitir la subida.
 * FLUJO: loadModel() -> analyzeImage(file) -> true si es segura, false si no
 * FALLBACK: Si el modelo no carga, permite la subida (graceful degradation).
 * ===================================================================
 */

import { useState, useCallback } from "react";

// Clasificaciones que devuelve NSFWJS
interface Prediction {
  className: "Porn" | "Hentai" | "Sexy" | "Neutral" | "Drawing";
  probability: number;
}

/** Carga una imagen desde URL y retorna elemento HTMLImageElement */
const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = url;
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
  });
};

/**
 * useNSFWJS(): Hook para moderación de imágenes con IA
 * ------------------------------------------------------------------
 * Uso: const { analyzeImage, loadingModel } = useNSFWJS()
 *       const isSafe = await analyzeImage(file)
 *
 * El modelo NSFWJS se carga bajo demanda (lazy load) solo cuando
 * se llama a analyzeImage(), para no impactar el tiempo de carga
 * inicial de la aplicación.
 */
export const useNSFWJS = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [model, setModel] = useState<any>(null);
  const [loadingModel, setLoadingModel] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * loadModel(): Carga el modelo NSFWJS (lazy, solo si se necesita)
   * Importa dinámicamente @tensorflow/tfjs y nsfwjs.
   */
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
      return null; // Falla gracefully: no bloquea la subida
    }
  }, [model]);

  /**
   * analyzeImage(): Analiza una imagen con NSFWJS
   * ------------------------------------------------------------------
   * Clasifica la imagen en 5 categorías. Si detecta Porn, Hentai o
   * Sexy con probabilidad > 60%, retorna false (insegura).
   *
   * @param file - Archivo de imagen a analizar
   * @returns true si la imagen es segura, false si es inapropiada
   */
  const analyzeImage = useCallback(
    async (file: File): Promise<boolean> => {
      let objectUrl = "";
      try {
        const activeModel = model || (await loadModel());
        if (!activeModel) {
          console.warn("NSFWJS model is not loaded. Skipping moderation check (fallback to safe).");
          return true; // Si el modelo falla, permite la subida
        }

        objectUrl = URL.createObjectURL(file);
        const img = await loadImage(objectUrl);
        const predictions = (await activeModel.classify(img)) as Prediction[];

        // Clases consideradas inseguras
        const unsafeClasses = new Set(["Porn", "Hentai", "Sexy"]);
        let isUnsafe = false;

        for (const pred of predictions) {
          if (unsafeClasses.has(pred.className) && pred.probability > 0.6) {
            isUnsafe = true;
            break;
          }
        }

        return !isUnsafe; // true = segura, false = inapropiada
      } catch (err) {
        console.error("Image analysis error:", err);
        return true; // Fallback: permite subida si hay error de clasificación
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
