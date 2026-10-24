import { useEffect, useState } from "react";

export const THEMES = ["dark", "light", "ocean"] as const;
export type Theme = typeof THEMES[number];

const STORAGE_KEY = "moneta_theme";

/** Browser UI color (mobile address bar / PWA status bar) per theme — keep in sync with --bg in _tokens.scss. */
const THEME_COLOR: Record<Theme, string> = {
  dark: "#09090b",
  light: "#ecebe6",
  ocean: "#0a1118",
};

function isTheme(value: string | null): value is Theme {
  return THEMES.includes(value as Theme);
}

function applyTheme(theme: Theme) {
  if (theme === "dark") document.documentElement.removeAttribute("data-theme");
  else document.documentElement.setAttribute("data-theme", theme);

  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLOR[theme]);
}

interface UseThemeReturn {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export function useTheme(): UseThemeReturn {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return isTheme(stored) ? stored : "dark";
  });

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = (value: Theme) => {
    setThemeState(value);
    localStorage.setItem(STORAGE_KEY, value);
  };

  return { theme, setTheme };
}
