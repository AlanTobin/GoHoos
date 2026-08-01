"use client";

import { useLayoutEffect, useState } from "react";

/** Route colors in scroll order — one per about-page section. */
export const SECTION_ROUTE_COLORS = [
  "#ff7300", // Orange Line — Why GoHoos
  "#ffdd00", // Gold Line — Plan a trip
  "#0c8103", // Green Line — Routes Explorer
  "#662c90", // Purple Line — Live tracking
  "#5f6367", // Silver Line — Bus capacity
  "#e57200", // UVA Orange — In progress
] as const;

export const SECTION_ROUTE_ACCENTS = [
  "#5f6367",
  "#7eb8da",
  "#ffdd00",
  "#0c8103",
  "#ffdd00",
  "#232d4b",
] as const;

export function routeBadgeTextColor(routeColor: string): string {
  return routeColor === "#ffdd00" ? "#232d4b" : "#ffffff";
}

interface PathSegment {
  id: string;
  yStart: number;
  yEnd: number;
}

interface FlowingRoutePathProps {
  container: HTMLElement | null;
  headingRefs: React.RefObject<Map<string, HTMLElement>>;
  stepIds: readonly string[];
  activeStepId: string;
}

function getRelativeTop(el: HTMLElement, container: HTMLElement): number {
  const containerRect = container.getBoundingClientRect();
  const elRect = el.getBoundingClientRect();
  return elRect.top - containerRect.top + container.scrollTop;
}

/** Wide, smooth curves that sweep behind content. */
function buildFlowingPath(width: number, height: number): string {
  if (height <= 0 || width <= 0) return "";

  const left = width * 0.12;
  const right = width * 0.88;
  const h = height;

  return [
    `M ${right} 0`,
    `C ${right} ${h * 0.06}, ${left} ${h * 0.1}, ${left} ${h * 0.2}`,
    `S ${right} ${h * 0.32}, ${right} ${h * 0.42}`,
    `S ${left} ${h * 0.54}, ${left} ${h * 0.64}`,
    `S ${right} ${h * 0.76}, ${right} ${h * 0.86}`,
    `S ${left} ${h * 0.94}, ${left} ${h}`,
  ].join(" ");
}

function segmentOpacity(index: number, activeIndex: number): number {
  if (index === activeIndex) return 0.38;
  if (index < activeIndex) return 0.18;
  return 0.08;
}

export default function FlowingRoutePath({
  container,
  headingRefs,
  stepIds,
  activeStepId,
}: FlowingRoutePathProps) {
  const [path, setPath] = useState("");
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [segments, setSegments] = useState<PathSegment[]>([]);

  const activeIndex = Math.max(0, stepIds.indexOf(activeStepId));
  const strokeWidth = Math.max(48, width * 0.09);

  useLayoutEffect(() => {
    if (!container) return;

    const measure = () => {
      const totalHeight = container.scrollHeight;
      const totalWidth = container.clientWidth;
      if (totalHeight <= 0 || totalWidth <= 0) return;

      const headingPositions = stepIds
        .map((id) => {
          const heading = headingRefs.current?.get(id);
          if (!heading) return null;
          return { id, y: getRelativeTop(heading, container) };
        })
        .filter((entry): entry is { id: string; y: number } => Boolean(entry));

      if (headingPositions.length === 0) return;

      const pathSegments: PathSegment[] = headingPositions.map((heading, index) => ({
        id: heading.id,
        yStart: heading.y,
        yEnd:
          index < headingPositions.length - 1
            ? headingPositions[index + 1].y
            : totalHeight,
      }));

      setWidth(totalWidth);
      setHeight(totalHeight);
      setPath(buildFlowingPath(totalWidth, totalHeight));
      setSegments(pathSegments);
    };

    measure();
    const raf = requestAnimationFrame(measure);
    const timer = window.setTimeout(measure, 150);

    const observer = new ResizeObserver(measure);
    observer.observe(container);

    for (const id of stepIds) {
      const heading = headingRefs.current?.get(id);
      if (heading) observer.observe(heading);
    }

    window.addEventListener("resize", measure);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [container, headingRefs, stepIds]);

  if (!path || width === 0 || height === 0 || segments.length === 0) {
    return null;
  }

  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 overflow-visible"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
    >
      <defs>
        {segments.map((segment) => (
          <clipPath
            key={`clip-${segment.id}`}
            id={`about-route-clip-${segment.id}`}
          >
            <rect
              x="0"
              y={segment.yStart}
              width={width}
              height={Math.max(1, segment.yEnd - segment.yStart)}
            />
          </clipPath>
        ))}
      </defs>

      {segments.map((segment, index) => {
        const isActive = index === activeIndex;
        const opacity = segmentOpacity(index, activeIndex);
        const color = SECTION_ROUTE_COLORS[index % SECTION_ROUTE_COLORS.length];

        return (
          <path
            key={segment.id}
            d={path}
            clipPath={`url(#about-route-clip-${segment.id})`}
            stroke={color}
            strokeWidth={isActive ? strokeWidth * 1.06 : strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={opacity}
            style={{
              transition: "opacity 0.45s ease, stroke-width 0.45s ease",
            }}
          />
        );
      })}
    </svg>
  );
}
