export const MAP_THEME_STORAGE_KEY = "gohoos-map-theme";

export type MapThemePreference = "system" | "light" | "dark";
export type ResolvedMapTheme = "light" | "dark";

export const MAP_STYLE_URLS = {
  light: "mapbox://styles/mapbox/streets-v12",
  dark: "mapbox://styles/mapbox/dark-v11",
} as const;

export function parseMapThemePreference(
  raw: string | null | undefined
): MapThemePreference {
  if (raw === "light" || raw === "dark" || raw === "system") return raw;
  return "system";
}

export function resolveMapTheme(
  preference: MapThemePreference,
  systemDark: boolean
): ResolvedMapTheme {
  if (preference === "light" || preference === "dark") return preference;
  return systemDark ? "dark" : "light";
}

export function mapStyleUrl(theme: ResolvedMapTheme): string {
  return MAP_STYLE_URLS[theme];
}

/** Explicit override when the user toggles (leaves `system` behind). */
export function nextOverrideTheme(resolved: ResolvedMapTheme): ResolvedMapTheme {
  return resolved === "light" ? "dark" : "light";
}
