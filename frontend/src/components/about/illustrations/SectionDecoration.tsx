import type { ReactNode } from "react";

export type DecorationVariant =
  | "why"
  | "plan"
  | "routes"
  | "track"
  | "capacity"
  | "next";

function Blob({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`rounded-full blur-3xl ${className ?? ""}`}
    />
  );
}

export function SectionDecoration({ variant }: { variant: DecorationVariant }) {
  switch (variant) {
    case "why":
      return (
        <>
          <Blob className="absolute -left-24 top-8 size-56 bg-uva-orange-soft/80" />
          <Blob className="absolute -right-20 bottom-0 size-48 bg-uva-blue-soft/90" />
        </>
      );
    case "plan":
      return (
        <>
          <Blob className="absolute -right-16 top-10 size-52 bg-uva-orange-soft/70" />
        </>
      );
    case "routes":
      return (
        <>
          <Blob className="absolute -left-20 top-16 size-60 bg-uva-blue-soft/80" />
        </>
      );
    case "track":
      return (
        <>
          <Blob className="absolute -right-24 top-0 size-56 bg-uva-orange-soft/75" />
        </>
      );
    case "capacity":
      return (
        <>
          <Blob className="absolute -left-16 bottom-8 size-52 bg-uva-orange-soft/80" />
        </>
      );
    case "next":
      return (
        <>
          <Blob className="absolute -left-20 top-0 size-52 bg-uva-blue-soft/70" />
          <Blob className="absolute -right-16 bottom-6 size-44 bg-uva-orange-soft/65" />
        </>
      );
    default:
      return null;
  }
}

export function SectionTextPanel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl bg-[#fafafa]/92 px-5 py-6 ring-1 ring-uva-navy/5 backdrop-blur-sm sm:px-7 sm:py-7 ${className}`}
    >
      {children}
    </div>
  );
}

export function SectionShell({
  children,
  className = "",
  variant,
}: {
  variant: DecorationVariant;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative isolate overflow-visible ${className}`}>
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <SectionDecoration variant={variant} />
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}
