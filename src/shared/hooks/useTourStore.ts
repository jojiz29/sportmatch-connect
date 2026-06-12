import { create } from "zustand";

interface TourState {
  run: boolean;
  stepIndex: number;
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
