"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";

export type Theme = "dark" | "light" | "system";
export type Accent = "#6366F1" | "#10B981" | "#F59E0B" | "#F43F5E" | "#3B82F6" | "#8B5CF6";

interface ThemeContextValue {
  theme: Theme;
  resolved: "dark" | "light";
  accent: Accent;
  setTheme: (t: Theme) => void;
  setAccent: (a: Accent) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const ACCENT_HOVER: Record<Accent, string> = {
  "#6366F1": "#818CF8",
  "#10B981": "#34D399",
  "#F59E0B": "#FBBF24",
  "#F43F5E": "#FB7185",
  "#3B82F6": "#60A5FA",
  "#8B5CF6": "#A78BFA",
};

function applyTheme(theme: Theme, accent: Accent) {
  if (typeof document === "undefined") return;
  const resolved =
    theme === "system"
      ? window.matchMedia("(prefers-color-scheme: light)").matches
        ? "light"
        : "dark"
      : theme;
  const root = document.documentElement;
  root.dataset.theme = resolved;
  root.style.colorScheme = resolved;
  root.style.setProperty("--color-primary", accent);
  root.style.setProperty("--color-primary-hover", ACCENT_HOVER[accent]);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [accent, setAccentState] = useState<Accent>("#6366F1");

  useEffect(() => {
    const t = (localStorage.getItem("stocksense:theme") as Theme) || "dark";
    const a = (localStorage.getItem("stocksense:accent") as Accent) || "#6366F1";
    setThemeState(t);
    setAccentState(a);
    applyTheme(t, a);
  }, []);

  useEffect(() => {
    if (theme !== "system") return;
    const mql = window.matchMedia("(prefers-color-scheme: light)");
    const handler = () => applyTheme(theme, accent);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [theme, accent]);

  const setTheme = useCallback(
    (t: Theme) => {
      setThemeState(t);
      localStorage.setItem("stocksense:theme", t);
      applyTheme(t, accent);
    },
    [accent]
  );

  const setAccent = useCallback(
    (a: Accent) => {
      setAccentState(a);
      localStorage.setItem("stocksense:accent", a);
      applyTheme(theme, a);
    },
    [theme]
  );

  const resolved: "dark" | "light" =
    theme === "system"
      ? typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: light)").matches
        ? "light"
        : "dark"
      : theme;

  return (
    <ThemeContext.Provider value={{ theme, resolved, accent, setTheme, setAccent }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
