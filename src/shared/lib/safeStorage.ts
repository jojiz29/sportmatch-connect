import { StateStorage } from "zustand/middleware";

/**
 * A safe wrapper around localStorage that catches syntax errors (corrupted JSON),
 * security/quota errors, and falls back to in-memory storage if needed.
 */
export const createSafeStorage = (): StateStorage => {
  const memoryStore = new Map<string, string>();

  return {
    getItem: (name: string): string | null => {
      try {
        const value = typeof window !== "undefined" ? localStorage.getItem(name) : null;
        if (value) {
          // Stress test hydration: validate that the value is syntactically valid JSON.
          // If it isn't, JSON.parse will throw, and we fall back to default state.
          JSON.parse(value);
        }
        return value;
      } catch (error) {
        console.warn(
          `SafeStorage: Failed to getItem/parse "${name}". LocalStorage may be corrupted or disabled. Falling back to default state.`,
          error
        );
        // Clear corrupted key if possible to restore healthy state
        try {
          if (typeof window !== "undefined") {
            localStorage.removeItem(name);
          }
        } catch (_) {}
        return memoryStore.get(name) || null;
      }
    },
    setItem: (name: string, value: string): void => {
      try {
        if (typeof window !== "undefined") {
          localStorage.setItem(name, value);
        }
      } catch (error) {
        console.error(`SafeStorage: Failed to setItem "${name}". Falling back to memory.`, error);
        memoryStore.set(name, value);
      }
    },
    removeItem: (name: string): void => {
      try {
        if (typeof window !== "undefined") {
          localStorage.removeItem(name);
        }
      } catch (error) {
        console.error(`SafeStorage: Failed to removeItem "${name}".`, error);
        memoryStore.delete(name);
      }
    },
  };
};

export const safeLocalStorage = createSafeStorage();
