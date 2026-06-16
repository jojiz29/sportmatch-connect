/**
 * ===================================================================
 * ARCHIVO: src/shared/lib/safeStorage.ts
 * PROPÓSITO: Wrapper seguro de localStorage para Zustand.
 *            Protege contra corrupción de JSON, errores de cuota
 *            y localStorage deshabilitado, con fallback a memoria.
 * ===================================================================
 */

import { StateStorage } from "zustand/middleware";

/**
 * createSafeStorage(): Crea un adaptador StateStorage para Zustand
 * ------------------------------------------------------------------
 * Características:
 *   - getItem: Valida que el JSON sea sintácticamente correcto antes
 *     de devolverlo. Si está corrupto, lo limpia y cae en default.
 *   - setItem: Si localStorage falla (cuota excedida, privacidad),
 *     usa un Map en memoria como fallback.
 *   - removeItem: Similar con fallback a memoria.
 *
 * Esto evita que datos corruptos en localStorage (ej: schema antiguo)
 * rompan la hidratación de Zustand al cargar la app.
 */
export const createSafeStorage = (): StateStorage => {
  const memoryStore = new Map<string, string>();

  return {
    getItem: (name: string): string | null => {
      try {
        const value = globalThis.window === undefined ? null : localStorage.getItem(name);
        if (value) {
          // Valida que el JSON sea parseable (stress test de hidratación)
          JSON.parse(value);
        }
        return value;
      } catch (error) {
        console.warn(
          `SafeStorage: Failed to getItem/parse "${name}". LocalStorage may be corrupted or disabled. Falling back to default state.`,
          error,
        );
        // Limpia la key corrupta si es posible
        try {
          if (globalThis.window !== undefined) {
            localStorage.removeItem(name);
          }
        } catch (removeError) {
          console.error("Storage hydration fallback triggered:", removeError);
        }
        return memoryStore.get(name) || null;
      }
    },
    setItem: (name: string, value: string): void => {
      try {
        if (globalThis.window !== undefined) {
          localStorage.setItem(name, value);
        }
      } catch (error) {
        console.error(`SafeStorage: Failed to setItem "${name}". Falling back to memory.`, error);
        memoryStore.set(name, value);
      }
    },
    removeItem: (name: string): void => {
      try {
        if (globalThis.window !== undefined) {
          localStorage.removeItem(name);
        }
      } catch (error) {
        console.error(`SafeStorage: Failed to removeItem "${name}".`, error);
        memoryStore.delete(name);
      }
    },
  };
};

/** Instancia por defecto del safe storage */
export const safeLocalStorage = createSafeStorage();
