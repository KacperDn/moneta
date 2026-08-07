import { useEffect, useState } from "react";

export type Theme = "dark" | "light";

const STORAGE_KEY = "moneta_theme";

function applyTheme(theme: Theme) {
  if (theme === "light") document.documentElement.setAttribute("data-theme", "light");
  else document.documentElement.removeAttribute("data-theme");

  document.querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", theme === "light" ? "#ffffff" : "#09090b");
}

interface UseThemeReturn {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export function useTheme(): UseThemeReturn {
  const [theme, setThemeState] = useState<Theme>(() => (
    localStorage.getItem(STORAGE_KEY) === "light" ? "light" : "dark"
  ));

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = (value: Theme) => {
    setThemeState(value);
    localStorage.setItem(STORAGE_KEY, value);
  };

  return { theme, setTheme };
}
