"use client";

import { useEffect, useRef, useState } from "react";

export default function DestinationPinCoach({ active }: { active: boolean }) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [anchor, setAnchor] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!active) {
      setAnchor(null);
      return;
    }

    const update = () => {
      const overlay = overlayRef.current;
      const el = document.querySelector("[data-planner-dest-pin]");
      if (!overlay || !(el instanceof Element)) {
        setAnchor(null);
        return;
      }
      const pin = el.getBoundingClientRect();
      const box = overlay.getBoundingClientRect();
      if (pin.width === 0 || pin.height === 0) {
        setAnchor(null);
        return;
      }
      setAnchor({
        x: pin.left + pin.width / 2 - box.left,
        y: pin.top - box.top,
      });
    };

    update();
    const interval = window.setInterval(update, 80);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [active]);

  if (!active) return null;

  const tooltipLeft = anchor
    ? Math.min(Math.max(anchor.x, 116), (overlayRef.current?.clientWidth ?? 320) - 116)
    : 0;

  return (
    <div
      ref={overlayRef}
      className="pointer-events-none absolute inset-0 z-45 overflow-visible"
      aria-hidden
    >
      {anchor ? (
        <>
          <div
            className="absolute size-14 -translate-x-1/2 -translate-y-1/2"
            style={{ left: anchor.x, top: anchor.y + 18 }}
          >
            <div className="size-full rounded-full border-2 border-uva-orange/90 animate-pin-coach-pulse" />
          </div>
          <div
            className="absolute w-54 -translate-x-1/2 -translate-y-full rounded-xl bg-planner-sheet px-3 py-2.5 text-center text-sm font-semibold leading-snug text-planner-ink shadow-[0_8px_24px_rgba(0,0,0,0.35)] ring-1 ring-planner-ink/15"
            style={{
              left: tooltipLeft,
              top: Math.max(anchor.y - 10, 8),
            }}
          >
            Drag this pin to wherever you want to go
            <span className="absolute left-1/2 top-full -translate-x-1/2 border-x-8 border-x-transparent border-t-8 border-t-planner-sheet" />
          </div>
        </>
      ) : null}
    </div>
  );
}
