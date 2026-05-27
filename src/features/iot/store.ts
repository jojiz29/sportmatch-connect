import { create } from "zustand";
import { TelemetryData } from "@/entities/types";

interface IoTState {
  currentData: TelemetryData | null;
  history: TelemetryData[];
  isConnected: boolean;
  setConnection: (status: boolean) => void;
  updateTelemetry: (data: Partial<TelemetryData>) => void;
}

export const useIoTStore = create<IoTState>((set) => ({
  currentData: {
    heartRate: 142,
    calories: 612,
    distanceKm: 7.4,
    pace: "5:32",
    steps: 9120,
    timestamp: new Date().toISOString(),
  },
  history: [],
  isConnected: true,
  setConnection: (status) => set({ isConnected: status }),
  updateTelemetry: (newData) =>
    set((state) => {
      const merged = { ...state.currentData, ...newData } as TelemetryData;
      // Guardamos el historial (máximo 100 puntos en memoria)
      const newHistory = [...state.history, merged].slice(-100);
      return {
        currentData: merged,
        history: newHistory,
      };
    }),
}));
