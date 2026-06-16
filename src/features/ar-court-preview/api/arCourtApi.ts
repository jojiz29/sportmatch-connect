import type { ArCourtModelData } from "../model/types";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:3000") + "/api/v1";

export async function fetchCourtModelData(courtId: string): Promise<ArCourtModelData> {
  const response = await fetch(`${API_URL}/ar/court/${courtId}/model-data`);
  if (!response.ok) {
    throw new Error(`Error fetching AR model data: ${response.statusText}`);
  }
  return response.json();
}
