import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { safeLocalStorage } from "@/shared/lib/safeStorage";

export type Theme = "light" | "dark-footballer" | "world-cup";

// Orden de rotación para toggleTheme: cobre premium → neón urbano → claro deportivo
const ROTATION: Theme[] = ["world-cup", "dark-footballer", "light"];

function applyTheme(theme: Theme) {
  if (typeof document !== "undefined") {
    document.documentElement.dataset.theme = theme;
    // Asegura que .light y .world-cup se activen en cualquier ancla superior
    document.documentElement.classList.remove("light", "dark-footballer", "world-cup");
    document.documentElement.classList.add(theme);
  }
}

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: "world-cup",
      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },
      toggleTheme: () => {
        const current = get().theme;
        const idx = ROTATION.indexOf(current);
        const nextTheme = ROTATION[(idx + 1) % ROTATION.length] ?? "world-cup";
        applyTheme(nextTheme);
        set({ theme: nextTheme });
      },
    }),
    {
      name: "sportmatch-theme",
      storage: createJSONStorage(() => safeLocalStorage),
      onRehydrateStorage: () => (state) => {
        // Aplica el tema persistido al árbol DOM al cargar la app
        if (state?.theme) {
          applyTheme(state.theme);
        }
      },
      migrate: (persistedState: unknown) => {
        const state = persistedState as { theme?: string } | null;
        if (state && (state.theme === "dark" || !state.theme)) {
          state.theme = "world-cup";
        }
        return state;
      },
    },
  ),
);
