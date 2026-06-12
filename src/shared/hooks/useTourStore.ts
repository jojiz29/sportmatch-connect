/**
 * ===================================================================
 * ARCHIVO: src/shared/hooks/useTourStore.ts
 * PROPÓSITO: Store de estado global para el tour guiado de la app
 *            (Coachmark Tutorial / Joyride).
 * FLUJO: startTour() -> run:true, stepIndex:0 ->
 *        usuario navega -> setStepIndex(n) ->
 *        stopTour() -> run:false, stepIndex:0
 * ===================================================================
 */

import { create } from "zustand";

interface TourState {
  run: boolean; // Indica si el tour está activo
  stepIndex: number; // Paso actual del tour (0 = inicio)
  setRun: (run: boolean) => void;
  setStepIndex: (index: number) => void;
  startTour: () => void;
  stopTour: () => void;
}

export const useTourStore = create<TourState>((set) => ({
  run: false,
  stepIndex: 0,
  setRun: (run) => set({ run }),
  setStepIndex: (stepIndex) => set({ stepIndex }),
  startTour: () => set({ run: true, stepIndex: 0 }),
  stopTour: () => set({ run: false, stepIndex: 0 }),
}));
