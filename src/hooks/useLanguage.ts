import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { LANGUAGE_STORAGE_KEY, Language } from "../i18n";

interface UseLanguageReturn {
  language: Language;
  setLanguage: (language: Language) => void;
}

export function useLanguage(): UseLanguageReturn {
  const { i18n } = useTranslation();
  const [language, setLanguageState] = useState<Language>(() => (
    localStorage.getItem(LANGUAGE_STORAGE_KEY) === "en" ? "en" : "pl"
  ));

  useEffect(() => {
    i18n.changeLanguage(language);
  }, [language, i18n]);

  const setLanguage = (value: Language) => {
    setLanguageState(value);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, value);
  };

  return { language, setLanguage };
}
