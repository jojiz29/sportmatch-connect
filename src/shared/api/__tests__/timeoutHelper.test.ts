import { describe, it, expect, vi } from "vitest";
import { withTimeout } from "../timeoutHelper";

describe("withTimeout", () => {
  it("debe resolver con el valor de la promesa original si termina a tiempo", async () => {
    const promise = Promise.resolve("success");
    const result = await withTimeout(promise, 1000);
    expect(result).toBe("success");
  });

  it("debe rechazar con el error de la promesa original si falla a tiempo", async () => {
    const promise = Promise.reject(new Error("original error"));
    await expect(withTimeout(promise, 1000)).rejects.toThrow("original error");
  });

  it("debe rechazar con timeout si la promesa tarda más del límite", async () => {
    vi.useFakeTimers();
    const slowPromise = new Promise((resolve) => {
      setTimeout(() => resolve("too late"), 5000);
    });

    const timeoutPromise = withTimeout(slowPromise, 1000);

    // Avanzar el tiempo para disparar el timeout
    vi.advanceTimersByTime(1000);

    await expect(timeoutPromise).rejects.toThrow(
      "La solicitud a la base de datos excedió el límite de 10 segundos.",
    );
    vi.useRealTimers();
  });
});
