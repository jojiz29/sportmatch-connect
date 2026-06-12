import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { safeLocalStorage } from "@/shared/lib/safeStorage";

export type Theme = "light" | "dark-footballer" | "world-cup";

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: "world-cup",
      setTheme: (theme) => {
        if (typeof document !== "undefined") {
          document.documentElement.setAttribute("data-theme", theme);
        }
        set({ theme });
      },
      toggleTheme: () =>
        set((state) => {
          const nextTheme: Theme = state.theme === "world-cup" ? "dark-footballer" : "world-cup";
          if (typeof document !== "undefined") {
            document.documentElement.setAttribute("data-theme", nextTheme);
          }
          return { theme: nextTheme };
        }),
    }),
    {
      name: "sportmatch-theme",
      storage: createJSONStorage(() => safeLocalStorage),
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
