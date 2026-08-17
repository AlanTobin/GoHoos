"use client";

import type { ReactNode } from "react";

interface PlannerSheetProps {
  ariaLabel: string;
  /** Primary action / toolbar row above the scrollable body. */
  accent: ReactNode;
  children: ReactNode;
  className?: string;
}

function SheetChevron() {
  return (
    <div className="flex justify-center pb-3 pt-1" aria-hidden>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-4 text-white/45"
      >
        <path d="M6 9l6 6 6-6" />
      </svg>
    </div>
  );
}

/**
 * Full-width bottom sheet (~1/3 of the viewport). Map above stays pannable.
 * Palette: UVA navy, white text, orange actions via PlannerAccentBar.
 */
export default function PlannerSheet({
  ariaLabel,
  accent,
  children,
  className = "",
}: PlannerSheetProps) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 h-[36vh] min-h-[16rem] sm:min-h-[18rem] md:min-h-[20rem]">
      <section
        role="dialog"
        aria-label={ariaLabel}
        className={`pointer-events-auto flex h-full w-full flex-col overflow-hidden rounded-t-2xl bg-uva-navy text-white shadow-[0_-10px_32px_rgba(0,0,0,0.28)] ${className}`}
      >
        <div className="w-full shrink-0 px-4 pt-2 sm:px-5 md:px-6">
          <SheetChevron />
          {accent}
        </div>
        <div className="flex min-h-0 w-full flex-1 flex-col overflow-y-auto overscroll-contain pt-1 sm:pt-2">
          {children}
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
  primary: "bg-academical-orange text-white",
  muted: "bg-white/10 text-white ring-1 ring-white/15",
} as const;

const accentSizeClass = {
  action: "px-3 py-3 sm:px-4 sm:py-3.5 md:px-5 md:py-4",
  hero: "px-4 py-3.5 sm:px-5 sm:py-4 md:px-6 md:py-4.5",
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
  const styles = `flex w-full items-center justify-center rounded-xl text-center sm:rounded-2xl ${accentToneClass[tone]} ${accentSizeClass[size]} ${className}`;

  if (as === "button") {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`${styles} disabled:cursor-not-allowed disabled:opacity-50`}
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
  return `block w-full text-center text-xs font-semibold leading-tight text-white sm:text-sm md:text-base ${extra}`;
}
