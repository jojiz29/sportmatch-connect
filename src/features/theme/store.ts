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
      theme: "dark-footballer",
      setTheme: (theme) => set({ theme }),
      toggleTheme: () =>
        set((state) => {
          let nextTheme: Theme = "light";
          if (state.theme === "light") {
            nextTheme = "dark-footballer";
          } else if (state.theme === "dark-footballer" || (state.theme as string) === "dark") {
            nextTheme = "world-cup";
          } else {
            nextTheme = "light";
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
          state.theme = "dark-footballer";
        }
        return state;
      },
    },
  ),
);
