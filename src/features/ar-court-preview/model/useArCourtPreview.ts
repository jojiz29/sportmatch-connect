import { create } from "zustand";
import type { ArCourtPreviewState } from "./types";

export const useArCourtPreviewStore = create<
  ArCourtPreviewState & {
    setLoading: (v: boolean) => void;
    setData: (data: ArCourtPreviewState["data"]) => void;
    setError: (err: string | null) => void;
    toggleFullscreen: () => void;
    toggleLabels: () => void;
    toggleAutoRotate: () => void;
    reset: () => void;
  }
>((set) => ({
  loading: false,
  data: null,
  error: null,
  isFullscreen: false,
  showLabels: true,
  autoRotate: true,
  setLoading: (v) => set({ loading: v }),
  setData: (data) => set({ data, loading: false, error: null }),
  setError: (err) => set({ error: err, loading: false }),
  toggleFullscreen: () => set((s) => ({ isFullscreen: !s.isFullscreen })),
  toggleLabels: () => set((s) => ({ showLabels: !s.showLabels })),
  toggleAutoRotate: () => set((s) => ({ autoRotate: !s.autoRotate })),
  reset: () =>
    set({
      loading: false,
      data: null,
      error: null,
      isFullscreen: false,
      showLabels: true,
      autoRotate: true,
    }),
}));
