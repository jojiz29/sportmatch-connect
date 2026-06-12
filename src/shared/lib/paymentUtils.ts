/**
 * ===================================================================
 * ARCHIVO: src/shared/lib/paymentUtils.ts
 * PROPÓSITO: Utilidades de pago para formularios de tarjeta,
 *            Yape, Plin y teléfono.
 * INCLUYE: Validación Luhn de tarjetas, detección de marca
 *          (Visa/Mastercard), formato de números, validación
 *          de fecha de expiración y teléfono peruano.
 * ===================================================================
 */

/** Métodos de pago disponibles en la plataforma */
export type PaymentMethod = "fitcoins" | "card" | "yape" | "plin";

/**
 * sanitizeCardNumber(): Elimina todos los caracteres no dígitos
 */
export function sanitizeCardNumber(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * formatCardNumber(): Formatea número de tarjeta en grupos de 4
 * Ejemplo: "1234567890123456" -> "1234 5678 9012 3456"
 */
export function formatCardNumber(value: string): string {
  const digits = sanitizeCardNumber(value).slice(0, 16);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

/**
 * validateCardNumber(): Valida tarjeta con algoritmo de Luhn
 */
export function validateCardNumber(value: string): boolean {
  const sanitized = sanitizeCardNumber(value);
  if (sanitized.length !== 16) return false;
  return validateLuhn(sanitized);
}

/**
 * detectCardBrand(): Detecta si es Visa, Mastercard o desconocida
 * Visa empieza con 4, Mastercard con 51-55.
 */
export function detectCardBrand(value: string): "Visa" | "Mastercard" | "Unknown" {
  const sanitized = sanitizeCardNumber(value);
  if (sanitized.startsWith("4")) return "Visa";
  if (/^5[1-5]/.test(sanitized)) return "Mastercard";
  return "Unknown";
}

/**
 * validateLuhn(): Algoritmo de Luhn (algoritmo de módulo 10)
 * usado para validar números de tarjetas de crédito/débito.
 * Duplica cada segundo dígito desde la derecha, suma todo,
 * verifica que sea divisible por 10.
 */
export function validateLuhn(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  if (!/^[0-9]+$/.test(digits)) return false;
  let sum = 0;
  let shouldDouble = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let digit = parseInt(digits[i], 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

/**
 * validateExpiry(): Valida fecha de expiración MM/AA
 * Verifica que el mes sea 1-12 y que la fecha no haya expirado.
 */
export function validateExpiry(value: string): boolean {
  const sanitized = value.replace(/\s/g, "");
  const parts = sanitized.split("/");
  if (parts.length !== 2) return false;
  const month = parseInt(parts[0], 10);
  const year = parseInt(parts[1], 10);
  if (!month || !year || month < 1 || month > 12) return false;
  const now = new Date();
  const expiryYear = year < 100 ? 2000 + year : year;
  const expiryDate = new Date(expiryYear, month - 1, 1);
  expiryDate.setMonth(expiryDate.getMonth() + 1);
  return expiryDate > now;
}

/**
 * validatePhoneNumber(): Valida teléfono móvil peruano (9 dígitos, empieza con 9)
 */
export function validatePhoneNumber(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return /^9\d{8}$/.test(digits);
}

/**
 * formatExpiry(): Formatea entrada MM/AA automáticamente
 * "1225" -> "12/25"
 */
export function formatExpiry(value: string): string {
  const sanitized = value.replace(/\D/g, "").slice(0, 4);
  if (sanitized.length <= 2) return sanitized;
  return `${sanitized.slice(0, 2)}/${sanitized.slice(2)}`;
}

/**
 * formatPhone(): Limpia y limita teléfono a 9 dígitos
 */
export function formatPhone(value: string): string {
  return value.replace(/\D/g, "").slice(0, 9);
}

/**
 * maskCvv(): Enmascara CVV con puntos (solo para display)
 */
export function maskCvv(value: string): string {
  return "•".repeat(Math.min(value.length, 4));
}
