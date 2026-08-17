import RouteMapClip from "@/components/about/illustrations/RouteMapClip";

type BackdropVariant = "home" | "routes" | "about";

export default function PageBackdrop({ variant }: { variant: BackdropVariant }) {
  if (variant === "home") {
    return (
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden bg-[#e8eef2]"
        aria-hidden
      />
    );
  }

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      <div className="absolute inset-0 bg-linear-to-br from-uva-orange-soft/35 via-[#fafafa] to-uva-blue-soft/40" />

      {variant === "routes" && (
        <>
          <div className="absolute -left-24 top-20 size-80 rounded-full bg-uva-blue-soft/40 blur-3xl" />
          <div className="absolute -right-16 bottom-16 size-64 rounded-full bg-uva-orange-soft/35 blur-3xl" />
          <RouteMapClip
            route="green"
            opacity={0.24}
            className="absolute -left-8 bottom-24 hidden lg:block -rotate-2"
          />
          <RouteMapClip
            route="orange"
            opacity={0.22}
            className="absolute -right-2 top-28 hidden xl:block rotate-1"
          />
        </>
      )}

      {variant === "about" && (
        <>
          <div className="absolute -left-32 top-0 size-96 rounded-full bg-uva-orange-soft/30 blur-3xl" />
          <div className="absolute -right-24 top-1/3 size-80 rounded-full bg-uva-blue-soft/35 blur-3xl" />
          <div className="absolute -left-20 bottom-0 size-72 rounded-full bg-uva-orange-soft/25 blur-3xl" />
        </>
      )}
    </div>
  );
}
