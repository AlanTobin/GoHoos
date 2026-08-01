"use client";

import { useId } from "react";

export type RouteClipId = "gold" | "green" | "orange" | "silver" | "purple";

const ROUTES: Record<
  RouteClipId,
  { label: string; primary: string; accent: string }
> = {
  gold: { label: "Gold Line", primary: "#ffdd00", accent: "#7eb8da" },
  green: { label: "Green Line", primary: "#0c8103", accent: "#ffdd00" },
  orange: { label: "Orange Line", primary: "#ff7300", accent: "#5f6367" },
  silver: { label: "Silver Line", primary: "#5f6367", accent: "#ffdd00" },
  purple: { label: "Purple Line", primary: "#662c90", accent: "#0c8103" },
};

const SIZES = {
  sm: { width: 132, height: 58 },
  md: { width: 220, height: 96 },
} as const;

const UVA_ORANGE = "#e57200";

interface Props {
  route?: RouteClipId;
  primaryColor?: string;
  accentColor?: string;
  className?: string;
  opacity?: number;
  size?: keyof typeof SIZES;
}

function lightenHex(hex: string, amount: number): string {
  const normalized = hex.replace("#", "");
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  const mix = (channel: number) =>
    Math.min(255, Math.round(channel + (255 - channel) * amount));
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

/** UVA-style side-profile transit bus tinted to a route or section color. */
export default function RouteMapClip({
  route,
  primaryColor,
  accentColor,
  className = "",
  opacity = 1,
  size = "md",
}: Props) {
  const fromRoute = route ? ROUTES[route] : null;
  const primary = primaryColor ?? fromRoute?.primary ?? "#232d80";
  const accent = accentColor ?? fromRoute?.accent ?? "#5f6367";
  const stripe = lightenHex(primary, 0.42);
  const dimensions = SIZES[size];
  const upperClipId = useId();

  return (
    <div
      aria-hidden
      className={className}
      style={{ width: dimensions.width, height: dimensions.height, opacity }}
    >
      <svg
        viewBox="0 0 220 88"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-full drop-shadow-sm"
      >
        <ellipse cx="108" cy="84" rx="86" ry="4" fill="#232d4b" opacity="0.12" />

        {/* Lower white skirt */}
        <path
          d="M12 48 H208 V74 H12 Z"
          fill="#ffffff"
          stroke="#d1d5db"
          strokeWidth="0.6"
        />

        {/* Upper colored body */}
        <path
          d="M12 48 V22 H34 L42 48 H208 V22 H12 Z"
          fill={primary}
        />

        {/* Diagonal route stripes (UVA chevrons) */}
        <g clipPath={`url(#${upperClipId})`}>
          <path d="M18 22 L52 22 L22 48 L-12 48 Z" fill={stripe} opacity="0.88" />
          <path d="M46 22 L80 22 L50 48 L16 48 Z" fill={stripe} opacity="0.78" />
          <path d="M74 22 L108 22 L78 48 L44 48 Z" fill={stripe} opacity="0.68" />
          <path d="M102 22 L136 22 L106 48 L72 48 Z" fill={stripe} opacity="0.58" />
        </g>

        {/* Orange marker dots along stripes */}
        <rect x="34" y="30" width="3" height="3" fill={UVA_ORANGE} />
        <rect x="44" y="36" width="3" height="3" fill={UVA_ORANGE} />
        <rect x="62" y="30" width="3" height="3" fill={UVA_ORANGE} />
        <rect x="72" y="36" width="3" height="3" fill={UVA_ORANGE} />
        <rect x="90" y="30" width="3" height="3" fill={UVA_ORANGE} />
        <rect x="100" y="36" width="3" height="3" fill={UVA_ORANGE} />

        {/* Side windows */}
        <rect x="88" y="26" width="26" height="18" rx="1.5" fill="#111827" />
        <rect x="90" y="28" width="22" height="14" rx="1" fill="#dbeafe" opacity="0.85" />
        <rect x="118" y="26" width="26" height="18" rx="1.5" fill="#111827" />
        <rect x="120" y="28" width="22" height="14" rx="1" fill="#dbeafe" opacity="0.85" />
        <rect x="148" y="26" width="24" height="18" rx="1.5" fill="#111827" />
        <rect x="150" y="28" width="20" height="14" rx="1" fill="#dbeafe" opacity="0.85" />

        {/* Front entry doors */}
        <rect x="176" y="26" width="28" height="48" rx="1" fill="#ffffff" stroke="#111827" strokeWidth="1.2" />
        <line x1="190" y1="26" x2="190" y2="74" stroke="#111827" strokeWidth="1.2" />
        <rect x="178" y="30" width="10" height="18" rx="0.5" fill="#dbeafe" opacity="0.7" />
        <rect x="192" y="30" width="10" height="18" rx="0.5" fill="#dbeafe" opacity="0.7" />

        {/* Bus ID */}
        <text
          x="182"
          y="20"
          fill={UVA_ORANGE}
          fontSize="7"
          fontWeight="700"
          fontFamily="Arial, Helvetica, sans-serif"
        >
          UTS
        </text>

        {/* Handicap symbol */}
        <circle cx="168" cy="58" r="5.5" fill="#ffffff" stroke={accent} strokeWidth="1" />
        <circle cx="168" cy="56.5" r="1.6" fill={accent} />
        <path
          d="M166.2 59.2 H169.8 V61 H166.2 Z M167.2 57.4 H168.8 V59.2 H167.2 Z"
          fill={accent}
        />

        {/* Marker lights */}
        <circle cx="204" cy="54" r="2.2" fill={UVA_ORANGE} />
        <circle cx="204" cy="62" r="2" fill={UVA_ORANGE} opacity="0.85" />

        {/* Wheel well + tire */}
        <path
          d="M154 74 C154 66 196 66 196 74"
          stroke="#111827"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle cx="176" cy="74" r="11.5" fill="#1f2937" />
        <circle cx="176" cy="74" r="7.5" fill="#d1d5db" />
        <circle cx="176" cy="74" r="2.2" fill="#ef4444" opacity="0.85" />
        {[0, 60, 120, 180, 240, 300].map((angle) => (
          <circle
            key={angle}
            cx={176 + 5.2 * Math.cos((angle * Math.PI) / 180)}
            cy={74 + 5.2 * Math.sin((angle * Math.PI) / 180)}
            r="0.9"
            fill="#9ca3af"
          />
        ))}

        {/* Front bumper + headlight */}
        <rect x="206" y="58" width="4" height="14" rx="1" fill="#374151" />
        <circle cx="208" cy="56" r="2.5" fill="#fef9c3" />

        {/* Rear cap */}
        <rect x="8" y="30" width="6" height="44" rx="1" fill={primary} />

        <defs>
          <clipPath id={upperClipId}>
            <rect x="12" y="22" width="196" height="26" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}
