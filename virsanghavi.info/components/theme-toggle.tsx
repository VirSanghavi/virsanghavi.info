"use client";

import { useCallback, useEffect, useState } from "react";
import { MoonIcon, SunIcon } from "./icons";
import { THEME_STORAGE_KEY, THEME_TIMESTAMP_KEY, THEME_TTL_HOURS } from "@/lib/theme-script";

type Theme = "light" | "dark";

function readTheme(): Theme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

function hasManualChoice(): boolean {
  try {
    const stamp = localStorage.getItem(THEME_TIMESTAMP_KEY);
    if (!stamp) return false;
    return (Date.now() - parseInt(stamp, 10)) / 36e5 < THEME_TTL_HOURS;
  } catch {
    return false;
  }
}

function apply(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.style.colorScheme = theme;
  if (document.body) document.body.style.colorScheme = theme;
}

export function ThemeToggle() {
  // The inline head script has already picked a theme; mirror it on mount
  // rather than guessing during SSR.
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    setTheme(readTheme());
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystemChange = (event: MediaQueryListEvent) => {
      if (hasManualChoice()) return;
      const next: Theme = event.matches ? "dark" : "light";
      apply(next);
      setTheme(next);
    };
    media.addEventListener("change", onSystemChange);
    return () => media.removeEventListener("change", onSystemChange);
  }, []);

  const toggle = useCallback(() => {
    setTheme((current) => {
      const next: Theme = current === "light" ? "dark" : "light";
      apply(next);
      try {
        localStorage.setItem(THEME_STORAGE_KEY, next);
        localStorage.setItem(THEME_TIMESTAMP_KEY, Date.now().toString());
      } catch {
        /* private mode: the toggle still works for this page view */
      }
      return next;
    });
  }, []);

  return (
    <button
      id="theme-toggle"
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {theme === "dark" ? <SunIcon className="nav-icon" /> : <MoonIcon className="nav-icon" />}
    </button>
  );
}
