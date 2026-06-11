"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";

export type Theme = "dark" | "light" | "system";
export type Accent = "emerald" | "violet" | "amber" | "rose" | "orange";

export const DEFAULT_ACCENT: Accent = "emerald";

export const ACCENTS: Record<Accent, { label: string; color: string; foreground: string }> = {
  emerald: { label: "Emerald", color: "#10B981", foreground: "#06281d" },
  violet: { label: "Violet", color: "#8B5CF6", foreground: "#ffffff" },
  amber: { label: "Amber", color: "#F59E0B", foreground: "#231a05" },
  rose: { label: "Rose", color: "#F43F5E", foreground: "#ffffff" },
  orange: { label: "Orange", color: "#F97316", foreground: "#2b1503" },
};

interface ThemeContextValue {
  theme: Theme;
  resolved: "dark" | "light";
  accent: Accent;
  setTheme: (t: Theme) => void;
  setAccent: (a: Accent) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function isAccent(value: string | null): value is Accent {
  return value !== null && value in ACCENTS;
}

const ACCENT_VARS = ["--primary", "--ring", "--sidebar-primary", "--sidebar-ring"] as const;

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

  if (accent === DEFAULT_ACCENT) {
    for (const v of ACCENT_VARS) root.style.removeProperty(v);
    root.style.removeProperty("--primary-foreground");
    root.style.removeProperty("--sidebar-primary-foreground");
  } else {
    const { color, foreground } = ACCENTS[accent];
    for (const v of ACCENT_VARS) root.style.setProperty(v, color);
    root.style.setProperty("--primary-foreground", foreground);
    root.style.setProperty("--sidebar-primary-foreground", foreground);
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [accent, setAccentState] = useState<Accent>(DEFAULT_ACCENT);

  useEffect(() => {
    const t = (localStorage.getItem("stocksense:theme") as Theme) || "dark";
    const storedAccent = localStorage.getItem("stocksense:accent");
    const a = isAccent(storedAccent) ? storedAccent : DEFAULT_ACCENT;
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
