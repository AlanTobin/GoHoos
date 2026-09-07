"use client";

import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  MAP_THEME_STORAGE_KEY,
  mapStyleUrl,
  nextOverrideTheme,
  parseMapThemePreference,
  resolveMapTheme,
  type MapThemePreference,
  type ResolvedMapTheme,
} from "@/lib/mapTheme";

interface MapThemeValue {
  preference: MapThemePreference;
  resolvedTheme: ResolvedMapTheme;
  styleUrl: string;
  hydrated: boolean;
  setTheme: (next: MapThemePreference) => void;
  toggleTheme: () => void;
}

const MapThemeContext = createContext<MapThemeValue | null>(null);

function useMapThemeState(): MapThemeValue {
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

  return useMemo(
    () => ({
      preference,
      resolvedTheme,
      styleUrl,
      hydrated,
      setTheme,
      toggleTheme,
    }),
    [preference, resolvedTheme, styleUrl, hydrated]
  );
}

export function MapThemeProvider({ children }: { children: ReactNode }) {
  const value = useMapThemeState();
  return createElement(MapThemeContext.Provider, { value }, children);
}

export function useMapTheme() {
  const context = useContext(MapThemeContext);
  if (!context) {
    throw new Error("useMapTheme must be used within MapThemeProvider");
  }
  return context;
}
