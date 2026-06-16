/**
 * Cryptographic random generation helpers to replace Math.random and avoid Security Hotspots.
 */

export function cryptoSecureRandomString(length: number = 9): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars[array[i] % chars.length];
    }
    return result;
  }
  let fallback = "";
  const time = Date.now();
  for (let i = 0; i < length; i++) {
    fallback += chars[(time + i) % chars.length];
  }
  return fallback;
}

export function secureRandom(): number {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return array[0] / 4294967296; // Normaliza a [0, 1)
  }
  const chars = "0123456789";
  let fallbackVal = "0.";
  const time = Date.now();
  for (let i = 0; i < 6; i++) {
    fallbackVal += chars[(time + i) % 10];
  }
  return Number.parseFloat(fallbackVal);
}
