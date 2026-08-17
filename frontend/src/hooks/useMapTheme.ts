"use client";

import { useEffect, useState } from "react";
import {
  MAP_THEME_STORAGE_KEY,
  mapStyleUrl,
  nextOverrideTheme,
  parseMapThemePreference,
  resolveMapTheme,
  type MapThemePreference,
  type ResolvedMapTheme,
} from "@/lib/mapTheme";

export function useMapTheme() {
  const [preference, setPreference] = useState<MapThemePreference>("system");
  const [systemDark, setSystemDark] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setPreference(
      parseMapThemePreference(localStorage.getItem(MAP_THEME_STORAGE_KEY))
    );

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemDark(media.matches);
    setHydrated(true);

    const onChange = (event: MediaQueryListEvent) => {
      setSystemDark(event.matches);
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const resolvedTheme: ResolvedMapTheme = resolveMapTheme(
    preference,
    systemDark
  );
  const styleUrl = mapStyleUrl(resolvedTheme);

  function setTheme(next: MapThemePreference) {
    setPreference(next);
    localStorage.setItem(MAP_THEME_STORAGE_KEY, next);
  }

  function toggleTheme() {
    setTheme(nextOverrideTheme(resolvedTheme));
  }

  return {
    preference,
    resolvedTheme,
    styleUrl,
    hydrated,
    setTheme,
    toggleTheme,
  };
}
