"use client";

import type { ReactNode } from "react";

interface PlannerSheetProps {
  ariaLabel: string;
  /** Header block above the list (title, CTA, toolbar). */
  accent: ReactNode;
  children: ReactNode;
  className?: string;
}

function SheetChevron() {
  return (
    <div className="flex justify-center pb-2 pt-1" aria-hidden>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-[18px] text-white/45"
      >
        <path d="M6 9l6 6 6-6" />
      </svg>
    </div>
  );
}

/**
 * Full-bleed bottom sheet. Grows with content up to max height, then scrolls
 * as one unit — matches the compact mock without a fixed short viewport strip.
 */
export default function PlannerSheet({
  ariaLabel,
  accent,
  children,
  className = "",
}: PlannerSheetProps) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30">
      <section
        role="dialog"
        aria-label={ariaLabel}
        className={`pointer-events-auto max-h-[min(70vh,40rem)] w-full overflow-y-auto overscroll-contain rounded-t-2xl bg-uva-navy text-white shadow-[0_-10px_32px_rgba(0,0,0,0.28)] ${className}`}
      >
        <div className="mx-auto w-full max-w-3xl px-4 pb-5 pt-2 sm:px-6 md:px-8">
          <SheetChevron />
          {accent}
          <div className="mt-1">{children}</div>
        </div>
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
  tone?: "primary" | "muted";
}

const accentToneClass = {
  primary: "bg-uva-orange text-white",
  muted: "bg-white/10 text-white ring-1 ring-white/15",
} as const;

const accentSizeClass = {
  action: "px-3 py-3 sm:px-4 sm:py-3.5",
  hero: "px-4 py-3.5 sm:px-5 sm:py-3.5",
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
        className={`${styles} disabled:cursor-not-allowed disabled:bg-uva-orange disabled:text-white disabled:opacity-55`}
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
