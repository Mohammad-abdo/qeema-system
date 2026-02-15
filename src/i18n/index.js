import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import ar from "./locales/ar.json";

const savedLang = typeof window !== "undefined" ? localStorage.getItem("lang") : null;
const defaultLng = savedLang || "ar";

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, ar: { translation: ar } },
  lng: defaultLng,
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

if (typeof document !== "undefined") {
  document.documentElement.dir = defaultLng === "ar" ? "rtl" : "ltr";
  document.documentElement.lang = defaultLng === "ar" ? "ar" : "en";
}

export default i18n;
