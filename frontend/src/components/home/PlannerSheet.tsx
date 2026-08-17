"use client";

import { useState, type ReactNode } from "react";

/** Shared expanded sheet height so every planner stage matches. */
export const PLANNER_SHEET_HEIGHT_CLASS = "h-[42dvh] max-h-[42dvh]";

interface PlannerSheetProps {
  ariaLabel: string;
  /** Header block above the list (title, CTA, toolbar). */
  accent: ReactNode;
  children: ReactNode;
  className?: string;
  /** Optional label shown on the collapsed peek bar. */
  collapsedLabel?: string;
  /** Max sheet height when expanded. */
  maxHeightClassName?: string;
  /** Min sheet height when expanded. */
  minHeightClassName?: string;
  /** Sticky actions below the scrollable body (e.g. Back). */
  footer?: ReactNode;
}

function ChevronIcon({ up }: { up?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`size-4 text-white/70 transition-transform ${up ? "rotate-180" : ""}`}
      aria-hidden
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

/**
 * Full-bleed bottom sheet when expanded.
 * Collapsed peek floats above the map chrome so it stays tappable.
 */
export default function PlannerSheet({
  ariaLabel,
  accent,
  children,
  className = "",
  collapsedLabel = "Show panel",
  maxHeightClassName = PLANNER_SHEET_HEIGHT_CLASS,
  minHeightClassName = "",
  footer,
}: PlannerSheetProps) {
  const [collapsed, setCollapsed] = useState(false);
  const expandedHeightClass = [maxHeightClassName, minHeightClassName]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-40">
      <section
        role="dialog"
        aria-label={ariaLabel}
        aria-expanded={!collapsed}
        className={`pointer-events-auto w-full overflow-hidden bg-uva-navy text-white shadow-[0_-10px_32px_rgba(0,0,0,0.35)] ${
          collapsed ? "" : `animate-planner-sheet-in ${expandedHeightClass}`
        } ${className}`}
      >
        {collapsed ? (
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            className="flex w-full items-center justify-center gap-2 px-4 pt-2.5 pb-4 transition-colors hover:bg-white/5 sm:pt-3 sm:pb-5"
            aria-label="Expand panel"
          >
            <ChevronIcon up />
            <span className="text-sm font-semibold text-white">
              {collapsedLabel}
            </span>
          </button>
        ) : (
          <div className={`overflow-y-auto overscroll-contain ${expandedHeightClass}`}>
            <div className="sticky top-0 z-10 bg-uva-navy/95 backdrop-blur-sm">
              <button
                type="button"
                onClick={() => setCollapsed(true)}
                className="flex w-full items-center justify-center gap-2 px-4 pt-2 pb-1 transition-colors hover:bg-white/5"
                aria-label="Collapse panel"
              >
                <ChevronIcon />
              </button>
              <div className="px-3 pb-2 sm:px-5 lg:px-6">{accent}</div>
            </div>

            <div className="px-3 pb-2 sm:px-5 lg:px-6">{children}</div>

            {footer ? (
              <div className="sticky bottom-0 z-10 border-t border-white/10 bg-uva-navy/95 px-3 pt-2.5 pb-3 backdrop-blur-sm sm:px-5 lg:px-6">
                {footer}
              </div>
            ) : (
              <div className="h-1.5" />
            )}
          </div>
        )}
      </section>
    </div>
  );
}

interface PlannerAccentBarProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  as?: "div" | "button";
  /** `action` = toolbar button; `hero` = larger pick CTA. */
  size?: "action" | "hero";
  /** Orange for primary actions; muted for secondary readouts. */
  tone?: "primary" | "muted" | "ghost";
}

const accentToneClass = {
  primary: "bg-uva-orange text-white",
  muted: "bg-white/10 text-white ring-1 ring-white/15",
  ghost: "bg-transparent text-white ring-1 ring-white/35",
} as const;

const accentSizeClass = {
  action: "px-3 py-2.5 sm:px-3.5 sm:py-2.5",
  hero: "px-3 py-2.5 sm:px-4 sm:py-3",
} as const;

export function PlannerAccentBar({
  children,
  onClick,
  disabled,
  className = "",
  as = "div",
  size = "hero",
  tone = "primary",
}: PlannerAccentBarProps) {
  const styles = `flex w-full items-center justify-center rounded-[10px] text-center ${accentToneClass[tone]} ${accentSizeClass[size]} ${className}`;

  if (as === "button") {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`${styles} disabled:cursor-not-allowed disabled:bg-uva-orange disabled:text-white disabled:opacity-55 disabled:ring-0`}
      >
        {children}
      </button>
    );
  }

  return <div className={styles}>{children}</div>;
}

/** Responsive action toolbar — keeps labels readable and inside the sheet. */
export function PlannerActionRow({ children }: { children: ReactNode }) {
  return (
    <div className="flex w-full min-w-0 items-stretch gap-2 sm:gap-3">
      {children}
    </div>
  );
}

export function plannerActionLabelClassName(extra = "") {
  return `block w-full text-center text-sm font-semibold leading-tight text-white ${extra}`;
}
