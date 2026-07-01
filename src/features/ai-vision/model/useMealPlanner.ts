import { useState, useCallback } from "react";
import { generateMealPlan } from "../api/visionApi";
import type { MealPlanRequest, MealPlanResult } from "./types";

interface UseMealPlannerReturn {
  generating: boolean;
  result: MealPlanResult | null;
  error: string | null;
  generate: (request: MealPlanRequest) => Promise<void>;
  clear: () => void;
}

export function useMealPlanner(): UseMealPlannerReturn {
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<MealPlanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (request: MealPlanRequest) => {
    setGenerating(true);
    setError(null);
    setResult(null);
    try {
      const res = await generateMealPlan(request);
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al generar el plan alimenticio");
    } finally {
      setGenerating(false);
    }
  }, []);

  const clear = useCallback(() => {
    setResult(null);
    setError(null);
    setGenerating(false);
  }, []);

  return { generating, result, error, generate, clear };
}
