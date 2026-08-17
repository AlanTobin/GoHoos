export function toRouteId(routeId: number): string {
  return `TL-${routeId}`;
}

export function normalizeRouteColor(color: string): string {
  return color.startsWith("#") ? color : `#${color}`;
}

export function isGoldYellow(color: string): boolean {
  return color.replace(/^#/, "").toLowerCase() === "ffdd00";
}

/** Hex (#rgb / #rrggbb) → rgba() for translucent UI fills. */
export function withAlpha(color: string, alpha: number): string {
  const hex = color.replace(/^#/, "");
  const full =
    hex.length === 3
      ? hex
          .split("")
          .map((ch) => `${ch}${ch}`)
          .join("")
      : hex;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) {
    return `rgba(255, 255, 255, ${alpha})`;
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Slightly darker arrow fill for Gold Line only; line color stays unchanged. */
export function mapYellowArrowColor(color: string): string {
  const hex = color.replace(/^#/, "");
  const [r, g, b] = [
    parseInt(hex.slice(0, 2), 16),
    parseInt(hex.slice(2, 4), 16),
    parseInt(hex.slice(4, 6), 16),
  ];
  const factor = 0.88;
  return [r, g, b]
    .map((channel) => Math.max(0, Math.min(255, Math.round(channel * factor))))
    .map((channel) => channel.toString(16).padStart(2, "0"))
    .join("");
}
