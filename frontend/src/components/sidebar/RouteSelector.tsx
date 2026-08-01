"use client";

import { useMemo, useState } from "react";
import { Route } from "@/types/route";
import { normalizeRouteColor } from "@/lib/routes";

interface Props {
  routes: Route[];
  routesWithVehicles: Set<string>;
  selectedRoutes: Set<string>;
  onToggle: (routeId: string) => void;
  onSetSelectedRoutes: React.Dispatch<React.SetStateAction<Set<string>>>;
  isLoading?: boolean;
}

function CheckIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden
    >
      <path d="M3.5 8.5L6.5 11.5L12.5 4.5" />
    </svg>
  );
}

function PanelChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-3.5"
      aria-hidden
    >
      {direction === "left" ? (
        <path d="M10 4L6 8l4 4" />
      ) : (
        <path d="M6 4l4 4-4 4" />
      )}
    </svg>
  );
}

export default function RouteSelector({
  routes,
  routesWithVehicles,
  selectedRoutes,
  onToggle,
  onSetSelectedRoutes,
  isLoading = false,
}: Props) {
  const [tab, setTab] = useState<"active" | "inactive">("active");
  const [isOpen, setIsOpen] = useState(true);
  const [search, setSearch] = useState("");

  const sortedRoutes = useMemo(
    () => [...routes].sort((a, b) => a.route_sort_order - b.route_sort_order),
    [routes]
  );

  const activeRoutes = useMemo(
    () => sortedRoutes.filter(r => routesWithVehicles.has(r.route_id)),
    [sortedRoutes, routesWithVehicles]
  );

  const inactiveRoutes = useMemo(
    () => sortedRoutes.filter(r => !routesWithVehicles.has(r.route_id)),
    [sortedRoutes, routesWithVehicles]
  );

  const displayedRoutes = tab === "active" ? activeRoutes : inactiveRoutes;

  const filteredRoutes = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return displayedRoutes;

    return displayedRoutes.filter(
      route =>
        route.route_long_name.toLowerCase().includes(query) ||
        route.route_desc?.toLowerCase().includes(query)
    );
  }, [displayedRoutes, search]);

  const allDisplayedSelected =
    filteredRoutes.length > 0 &&
    filteredRoutes.every(r => selectedRoutes.has(r.route_id));

  function toggleHighlightAll() {
    const displayedIds = filteredRoutes.map(route => route.route_id);

    onSetSelectedRoutes(prev => {
      const next = new Set(prev);
      if (allDisplayedSelected) {
        displayedIds.forEach(id => next.delete(id));
      } else {
        displayedIds.forEach(id => next.add(id));
      }
      return next;
    });
  }

  return (
    <>
      <aside
        className={`absolute inset-y-0 left-0 z-20 flex w-88 flex-col overflow-hidden border-r border-uva-navy/10 bg-white shadow-lg transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full w-88 flex-col">
          <div className="border-b border-uva-navy/10 px-4 pb-0 pt-4">
            <input
              type="search"
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Search routes and descriptions..."
              className="mb-4 w-full rounded-lg border border-uva-navy/15 bg-white px-3 py-2 text-sm text-uva-navy placeholder:text-uva-navy/40 outline-none focus:border-uva-orange"
            />

            <button
              type="button"
              onClick={toggleHighlightAll}
              aria-pressed={allDisplayedSelected}
              className={`mb-4 w-full rounded-lg border px-3 py-2 text-left text-sm font-medium transition-all ${
                allDisplayedSelected
                  ? "border-uva-orange bg-uva-orange-soft text-uva-navy"
                  : "border-uva-navy/15 bg-white text-uva-navy/80 hover:border-uva-orange/50"
              }`}
            >
              Highlight All Routes
            </button>

            <div className="flex gap-6">
              <button
                type="button"
                onClick={() => setTab("active")}
                className={`pb-3 text-sm font-medium transition-colors ${
                  tab === "active"
                    ? "border-b-2 border-uva-orange text-uva-navy"
                    : "border-b-2 border-transparent text-uva-navy/40 hover:text-uva-navy/70"
                }`}
              >
                Active ({activeRoutes.length})
              </button>
              <button
                type="button"
                onClick={() => setTab("inactive")}
                className={`pb-3 text-sm font-medium transition-colors ${
                  tab === "inactive"
                    ? "border-b-2 border-uva-orange text-uva-navy"
                    : "border-b-2 border-transparent text-uva-navy/40 hover:text-uva-navy/70"
                }`}
              >
                Inactive ({inactiveRoutes.length})
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3">
            {isLoading && tab === "active" ? (
              <p className="py-3 text-sm text-uva-navy/40">Loading active routes...</p>
            ) : filteredRoutes.length === 0 ? (
              <p className="py-3 text-sm text-uva-navy/40">
                {search.trim()
                  ? "No matching routes."
                  : tab === "active"
                    ? "No active routes."
                    : "No inactive routes."}
              </p>
            ) : (
              <ul className="space-y-2">
                {filteredRoutes.map(route => {
                  const isSelected = selectedRoutes.has(route.route_id);
                  const color = normalizeRouteColor(route.route_color);

                  return (
                    <li key={route.route_id}>
                      <button
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => onToggle(route.route_id)}
                        className={`relative flex w-full items-center gap-3 overflow-hidden rounded-lg border border-uva-navy/10 py-3 pl-4 pr-3 text-left transition-all duration-200 ${
                          isSelected
                            ? "bg-uva-orange-soft shadow-sm"
                            : "bg-white hover:bg-uva-blue-soft/50"
                        }`}
                      >
                        <span
                          aria-hidden
                          className={`absolute bottom-0 left-0 top-0 rounded-l-lg ${
                            isSelected ? "w-1.5" : "w-0.5"
                          }`}
                          style={{ backgroundColor: color }}
                        />
                        <span className="min-w-0 flex-1 pl-2">
                          <span
                            className={`block truncate text-[15px] leading-tight text-uva-navy ${
                              isSelected ? "font-bold" : "font-normal"
                            }`}
                          >
                            {route.route_long_name}
                          </span>
                          {route.route_desc ? (
                            <span className="mt-0.5 block truncate text-sm text-uva-navy/55">
                              {route.route_desc}
                            </span>
                          ) : null}
                        </span>
                        {isSelected ? (
                          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-uva-navy">
                            <CheckIcon className="size-3 text-white" />
                          </span>
                        ) : (
                          <span
                            aria-hidden
                            className="size-5 shrink-0 rounded-full border border-uva-navy/20"
                          />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </aside>

      <button
        type="button"
        onClick={() => setIsOpen(open => !open)}
        aria-expanded={isOpen}
        aria-label={isOpen ? "Hide routes panel" : "Show routes panel"}
        className={`absolute top-1/2 z-30 flex h-12 w-7 -translate-y-1/2 items-center justify-center rounded-r-md border border-uva-navy/10 bg-white text-uva-navy/50 shadow-sm transition-[left] duration-300 ease-in-out hover:bg-uva-orange-soft hover:text-uva-navy ${
          isOpen ? "left-88" : "left-0"
        }`}
      >
        <PanelChevronIcon direction={isOpen ? "left" : "right"} />
      </button>
    </>
  );
}
