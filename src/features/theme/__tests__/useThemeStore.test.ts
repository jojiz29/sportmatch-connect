/* eslint-disable @typescript-eslint/no-explicit-any */
// ============================================================
// useThemeStore.test.ts — Tests para useThemeStore (Zustand)
// ============================================================

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { useThemeStore } from "../store";

describe("useThemeStore", () => {
  beforeEach(() => {
    // Limpiar clases y atributos del document Element antes de cada test
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.classList.remove("light", "dark-footballer", "world-cup");
    // Restablecer el estado del store al valor por defecto
    useThemeStore.setState({ theme: "world-cup" });
  });

  afterEach(() => {
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.classList.remove("light", "dark-footballer", "world-cup");
  });

  it("debe iniciar con el tema por defecto 'world-cup'", () => {
    const state = useThemeStore.getState();
    expect(state.theme).toBe("world-cup");
  });

  it("debe permitir cambiar de tema usando setTheme", () => {
    useThemeStore.getState().setTheme("light");
    expect(useThemeStore.getState().theme).toBe("light");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect(document.documentElement.classList.contains("light")).toBe(true);
    expect(document.documentElement.classList.contains("world-cup")).toBe(false);
  });

  it("debe rotar temas correctamente usando toggleTheme", () => {
    const store = useThemeStore.getState();

    // Estado inicial: "world-cup"
    expect(useThemeStore.getState().theme).toBe("world-cup");

    // Rotar 1: "world-cup" -> "dark-footballer"
    store.toggleTheme();
    expect(useThemeStore.getState().theme).toBe("dark-footballer");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark-footballer");
    expect(document.documentElement.classList.contains("dark-footballer")).toBe(true);

    // Rotar 2: "dark-footballer" -> "light"
    store.toggleTheme();
    expect(useThemeStore.getState().theme).toBe("light");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect(document.documentElement.classList.contains("light")).toBe(true);

    // Rotar 3: "light" -> "world-cup"
    store.toggleTheme();
    expect(useThemeStore.getState().theme).toBe("world-cup");
    expect(document.documentElement.getAttribute("data-theme")).toBe("world-cup");
    expect(document.documentElement.classList.contains("world-cup")).toBe(true);
  });

  it("debe ejecutar la migración de estados obsoletos correctamente", () => {
    const storeOptions = (useThemeStore as any).persist?.getOptions();
    if (storeOptions && typeof storeOptions.migrate === "function") {
      const migrated1 = storeOptions.migrate({ theme: "dark" }, 1);
      expect(migrated1?.theme).toBe("world-cup");

      const migrated2 = storeOptions.migrate({ theme: undefined }, 1);
      expect(migrated2?.theme).toBe("world-cup");

      const migrated3 = storeOptions.migrate({ theme: "light" }, 1);
      expect(migrated3?.theme).toBe("light");
    }
  });
});
