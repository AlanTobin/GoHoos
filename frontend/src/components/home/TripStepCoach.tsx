"use client";

import { useEffect, useRef, useState } from "react";

export default function TripStepCoach({ active }: { active: boolean }) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [anchor, setAnchor] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!active) {
      setAnchor(null);
      return;
    }

    const update = () => {
      const overlay = overlayRef.current;
      const el =
        document.querySelector("[data-planner-trip-step-active]") ??
        document.querySelector("[data-planner-trip-step]");
      if (!overlay || !(el instanceof Element)) {
        setAnchor(null);
        return;
      }
      const step = el.getBoundingClientRect();
      const box = overlay.getBoundingClientRect();
      if (step.width === 0 || step.height === 0) {
        setAnchor(null);
        return;
      }
      setAnchor({
        x: step.left - box.left + step.width / 4,
        y: step.top - box.top + 10,
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

  return (
    <div
      ref={overlayRef}
      className="pointer-events-none absolute inset-0 z-45 overflow-visible"
      aria-hidden
    >
      {anchor ? (
        <div
          className="absolute"
          style={{
            left: anchor.x - 55,
            top: anchor.y - 114,
            width: 120,
            height: 128,
          }}
        >
          <svg
            width="120"
            height="128"
            viewBox="0 0 120 128"
            fill="none"
            className="block overflow-visible"
          >
            <path
              d="M55 112 C55 78, 55 52, 28 28"
              stroke="#FFFFFF"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeDasharray="8 7"
              filter="drop-shadow(0 1px 2px rgba(0,0,0,0.55))"
            />
            <path
              d="M48 100 L55 114 L62 100"
              stroke="#FFFFFF"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              filter="drop-shadow(0 1px 2px rgba(0,0,0,0.55))"
            />
          </svg>
          <span className="absolute top-1 left-0.5 whitespace-nowrap rounded-full bg-uva-navy/94 px-2.5 py-1 text-[11px] font-bold tracking-wide text-white shadow-[0_2px_6px_rgba(0,0,0,0.4)]">
            Tap each step as you go
          </span>
        </div>
      ) : null}
    </div>
  );
}
