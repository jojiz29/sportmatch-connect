export type PaymentMethod = "fitcoins" | "card" | "yape" | "plin";

export function sanitizeCardNumber(value: string): string {
  return value.replace(/\D/g, "");
}

export function formatCardNumber(value: string): string {
  const digits = sanitizeCardNumber(value).slice(0, 16);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

export function validateCardNumber(value: string): boolean {
  const sanitized = sanitizeCardNumber(value);
  if (sanitized.length !== 16) return false;
  return validateLuhn(sanitized);
}

export function detectCardBrand(value: string): "Visa" | "Mastercard" | "Unknown" {
  const sanitized = sanitizeCardNumber(value);
  if (sanitized.startsWith("4")) return "Visa";
  if (/^5[1-5]/.test(sanitized)) return "Mastercard";
  return "Unknown";
}

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

export function validatePhoneNumber(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return /^9\d{8}$/.test(digits);
}

export function formatExpiry(value: string): string {
  const sanitized = value.replace(/\D/g, "").slice(0, 4);
  if (sanitized.length <= 2) return sanitized;
  return `${sanitized.slice(0, 2)}/${sanitized.slice(2)}`;
}

export function formatPhone(value: string): string {
  return value.replace(/\D/g, "").slice(0, 9);
}

export function maskCvv(value: string): string {
  return "•".repeat(Math.min(value.length, 4));
}
