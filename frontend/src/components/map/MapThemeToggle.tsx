"use client";

import type { ResolvedMapTheme } from "@/lib/mapTheme";

export default function MapThemeToggle({
  resolvedTheme,
  onToggle,
}: {
  resolvedTheme: ResolvedMapTheme;
  onToggle: () => void;
}) {
  const goingDark = resolvedTheme === "light";

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={goingDark ? "Use dark map" : "Use light map"}
      title={goingDark ? "Dark map" : "Light map"}
      className="absolute top-3 right-3 z-20 flex size-10 items-center justify-center rounded-lg bg-uva-navy/90 text-white shadow-md ring-1 ring-white/15 backdrop-blur-sm transition-colors hover:bg-uva-navy"
    >
      {goingDark ? <MoonIcon /> : <SunIcon />}
    </button>
  );
}

function MoonIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 14.5A8.5 8.5 0 0 1 9.5 3 7 7 0 1 0 21 14.5Z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}
