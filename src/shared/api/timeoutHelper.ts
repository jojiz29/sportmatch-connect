/**
 * ===================================================================
 * ARCHIVO: src/shared/api/timeoutHelper.ts
 * PROPÓSITO: Envolver promesas con un timeout de seguridad para
 *            evitar que operaciones a la base de datos se cuelguen
 *            indefinidamente.
 * USO: const result = await withTimeout(supabase.from(...).select())
 * ===================================================================
 */

/**
 * withTimeout(): Ejecuta una promesa con límite de tiempo
 * ------------------------------------------------------------------
 * Si la promesa original no se resuelve dentro de timeoutMs
 * (10 segundos por defecto), la rechaza con un error descriptivo.
 * Usa Promise.race() para competir entre la promesa real y un timeout.
 * Útil para operaciones Supabase que podrían colgarse si la red falla.
 *
 * @param promise  - Promesa original a ejecutar
 * @param timeoutMs - Milisegundos máximos de espera (default: 10000)
 * @returns Resultado tipado de la promesa original
 */
export function withTimeout<T>(promise: PromiseLike<T>, timeoutMs = 10000): Promise<T> {
  let timeoutId: NodeJS.Timeout | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error("La solicitud a la base de datos excedió el límite de 10 segundos."));
    }, timeoutMs);
  });

  return Promise.race([Promise.resolve(promise), timeoutPromise]).finally(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  });
}
