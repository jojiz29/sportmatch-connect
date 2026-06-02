import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import HttpBackend from "i18next-http-backend";

// Ensure absolute-base path is resolved for production environments
const getBaseUrl = () => {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "";
};

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: "es",
    supportedLngs: ["es", "en"],
    load: "languageOnly",
    backend: {
      loadPath: `${getBaseUrl()}/locales/{{lng}}.json`,
    },
    interpolation: {
      escapeValue: false, // React ya se encarga de esto
    },
    react: {
      useSuspense: false, // Evita pantallas en blanco si no se usa Suspense
    },
    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      caches: ["localStorage"],
    },
  });

export default i18n;
