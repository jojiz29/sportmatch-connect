/**
 * ===================================================================
 * ARCHIVO: src/shared/i18n/index.ts
 * PROPÓSITO: Configuración de internacionalización (i18n) con i18next.
 *            Soporta español (es) e inglés (en) con detección
 *            automática del idioma del navegador.
 * FLUJO: LanguageDetector detecta idioma -> i18next carga recursos ->
 *        react-i18next provee hook useTranslation() a componentes.
 * ===================================================================
 */

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import esTranslations from "./locales/es.json";
import enTranslations from "./locales/en.json";

i18n
  // Detector automático: localStorage -> navigator.language -> htmlTag lang
  .use(LanguageDetector)
  // Integración con React
  .use(initReactI18next)
  .init({
    fallbackLng: "es", // Idioma por defecto: español
    supportedLngs: ["es", "en"], // Idiomas soportados
    load: "languageOnly", // Carga solo "es" no "es-ES"
    resources: {
      es: { translation: esTranslations },
      en: { translation: enTranslations },
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

export default i18n;
