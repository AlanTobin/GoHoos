"use client";

import { useLayoutEffect, useState } from "react";
import RouteMapClip from "./RouteMapClip";
import {
  SECTION_ROUTE_ACCENTS,
  SECTION_ROUTE_COLORS,
} from "./FlowingRoutePath";

const BUS_WIDTH = 132;
const BUS_HEIGHT = 58;
const BUS_VERTICAL_OFFSETS = [0.3, 0.42, 0.34, 0.48, 0.36, 0.44] as const;

interface BusPlacement {
  id: string;
  x: number;
  y: number;
  primaryColor: string;
  accentColor: string;
  isActive: boolean;
  rotation: number;
}

interface SectionBusLayerProps {
  container: HTMLElement | null;
  sectionRefs: React.RefObject<Map<string, HTMLElement>>;
  stepIds: readonly string[];
  activeStepId: string;
}

function getRelativeTop(el: HTMLElement, container: HTMLElement): number {
  const containerRect = container.getBoundingClientRect();
  const elRect = el.getBoundingClientRect();
  return elRect.top - containerRect.top + container.scrollTop;
}

function getRelativeLeft(el: HTMLElement, container: HTMLElement): number {
  const containerRect = container.getBoundingClientRect();
  const elRect = el.getBoundingClientRect();
  return elRect.left - containerRect.left + container.scrollLeft;
}

export default function SectionBusLayer({
  container,
  sectionRefs,
  stepIds,
  activeStepId,
}: SectionBusLayerProps) {
  const [buses, setBuses] = useState<BusPlacement[]>([]);

  useLayoutEffect(() => {
    if (!container) return;

    const measure = () => {
      const containerWidth = container.clientWidth;
      const padding = 8;

      const nextBuses: BusPlacement[] = [];

      for (let i = 0; i < stepIds.length; i += 1) {
        const id = stepIds[i];
        const section = sectionRefs.current?.get(id);
        if (!section) continue;

        const sectionTop = getRelativeTop(section, container);
        const sectionLeft = getRelativeLeft(section, container);
        const sectionWidth = section.offsetWidth;
        const sectionHeight = section.offsetHeight;
        const y =
          sectionTop +
          sectionHeight * BUS_VERTICAL_OFFSETS[i % BUS_VERTICAL_OFFSETS.length] -
          BUS_HEIGHT / 2;

        const onLeft = i % 2 === 0;
        const primaryColor = SECTION_ROUTE_COLORS[i % SECTION_ROUTE_COLORS.length];
        const accentColor = SECTION_ROUTE_ACCENTS[i % SECTION_ROUTE_ACCENTS.length];

        let x: number;
        if (onLeft) {
          x = sectionLeft - BUS_WIDTH - 16;
          x = Math.max(padding, x);
        } else {
          x = sectionLeft + sectionWidth + 16;
          x = Math.min(containerWidth - BUS_WIDTH - padding, x);
        }

        nextBuses.push({
          id,
          x,
          y,
          primaryColor,
          accentColor,
          isActive: activeStepId === id,
          rotation: onLeft ? -3 : 3,
        });
      }

      setBuses(nextBuses);
    };

    measure();
    const raf = requestAnimationFrame(measure);
    const timer = window.setTimeout(measure, 150);

    const observer = new ResizeObserver(measure);
    observer.observe(container);

    for (const id of stepIds) {
      const section = sectionRefs.current?.get(id);
      if (section) observer.observe(section);
    }

    window.addEventListener("resize", measure);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [container, sectionRefs, stepIds, activeStepId]);

  if (buses.length === 0) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[1] hidden overflow-visible lg:block"
    >
      {buses.map((bus) => (
        <div
          key={bus.id}
          className="absolute transition-opacity duration-300"
          style={{
            left: bus.x,
            top: bus.y,
            transform: `rotate(${bus.rotation}deg)`,
          }}
        >
          <RouteMapClip
            primaryColor={bus.primaryColor}
            accentColor={bus.accentColor}
            size="sm"
            opacity={bus.isActive ? 0.58 : 0.24}
          />
        </div>
      ))}
    </div>
  );
}
