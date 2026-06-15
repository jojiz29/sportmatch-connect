/**
 * ===================================================================
 * ARCHIVO: src/shared/i18n/index.ts
 * PROPÓSITO: Configuración de internacionalización (i18n) con i18next.
 *            Soporta español (es), inglés (en) y portugués (pt) con
 *            detección automática del idioma del navegador.
 *            SCRUM-341 Multi-language Sporty + SCRUM-30 i18n frontend.
 * FLUJO: LanguageDetector detecta idioma -> i18next carga recursos ->
 *        react-i18next provee hook useTranslation() a componentes.
 * ===================================================================
 */

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import esTranslations from "./locales/es.json";
import enTranslations from "./locales/en.json";
import ptTranslations from "./locales/pt.json";

// Mapeo de códigos regionales a códigos soportados
// pt-BR, pt-PT, etc. → "pt"
export function normalizeLanguage(lng?: string): string {
  if (!lng) return "es";
  const lower = lng.toLowerCase();
  if (lower.startsWith("es")) return "es";
  if (lower.startsWith("en")) return "en";
  if (lower.startsWith("pt")) return "pt";
  return "es";
}

i18n
  // Detector automático: localStorage -> navigator.language -> htmlTag lang
  .use(LanguageDetector)
  // Integración con React
  .use(initReactI18next)
  .init({
    fallbackLng: "es", // Idioma por defecto: español
    supportedLngs: ["es", "en", "pt"], // Idiomas soportados (SCRUM-341)
    load: "languageOnly", // Carga solo "es" no "es-ES"
    resources: {
      es: { translation: esTranslations },
      en: { translation: enTranslations },
      pt: { translation: ptTranslations },
    },
    interpolation: {
      escapeValue: false, // React ya escapa valores por defecto
    },
    react: {
      useSuspense: false, // Evita pantalla blanca si no hay Suspense wrapper
    },
    detection: {
      order: ["localStorage", "navigator", "htmlTag"], // Orden de detección
      caches: ["localStorage"], // Persiste preferencia en localStorage
    },
  });

// Normaliza el idioma detectado a los códigos soportados
const detectedLng = i18n.language;
const normalized = normalizeLanguage(detectedLng);
if (normalized !== detectedLng) {
  i18n.changeLanguage(normalized);
}

export default i18n;
