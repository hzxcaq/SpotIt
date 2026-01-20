"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import type { ThemeId } from "./types";
import { themes, defaultTheme } from "./config";

interface ThemeContextType {
  currentTheme: ThemeId;
  setTheme: (themeId: ThemeId) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within <ThemeProvider>");
  return ctx;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<ThemeId>(defaultTheme.id);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("spotit_theme") as ThemeId;
    if (saved && themes[saved]) {
      setCurrentTheme(saved);
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const theme = themes[currentTheme];
    const root = document.documentElement;

    Object.entries(theme.colors).forEach(([key, value]) => {
      const cssVar = `--${key.replace(/([A-Z])/g, "-$1").toLowerCase()}`;
      root.style.setProperty(cssVar, value);
    });

    localStorage.setItem("spotit_theme", currentTheme);
  }, [currentTheme, mounted]);

  const setTheme = (themeId: ThemeId) => {
    setCurrentTheme(themeId);
  };

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
