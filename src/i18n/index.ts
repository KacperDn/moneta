import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import pl from "./locales/pl.json";
import en from "./locales/en.json";

export const LANGUAGE_STORAGE_KEY = "moneta_lang";
export type Language = "pl" | "en";

const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
const initialLanguage: Language = stored === "en" ? "en" : "pl";

i18n
  .use(initReactI18next)
  .init({
    resources: {
      pl: { translation: pl },
      en: { translation: en },
    },
    lng: initialLanguage,
    fallbackLng: "pl",
    interpolation: { escapeValue: false },
  });

export default i18n;
