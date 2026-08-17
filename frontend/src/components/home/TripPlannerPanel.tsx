"use client";

import PlannerSheet, {
  PlannerAccentBar,
  PlannerActionRow,
  plannerActionLabelClassName,
} from "@/components/home/PlannerSheet";
import type { TripOption, TripStep } from "@/types/planner";
import { stopDisplayName } from "@/lib/geo";

function formatStepMeters(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1609.34).toFixed(1)} mi`;
}

function primaryRide(trip: TripOption): Extract<TripStep, { kind: "ride" }> | null {
  return (
    trip.steps.find((s): s is Extract<TripStep, { kind: "ride" }> => s.kind === "ride") ??
    null
  );
}

function tripHeadline(trip: TripOption): string {
  const rides = trip.steps.filter(
    (s): s is Extract<TripStep, { kind: "ride" }> => s.kind === "ride"
  );
  if (rides.length === 0) return "Walking trip";
  if (rides.length === 1) return rides[0].routeName;
  return `${rides[0].routeName} → ${rides[rides.length - 1].routeName}`;
}

function tripBoardLabel(trip: TripOption): string {
  const firstRide = primaryRide(trip);
  if (!firstRide) return "Your location";
  return stopDisplayName(firstRide.fromStopName);
}

interface LocationGateProps {
  geoLoading: boolean;
  geoError: string | null;
  onUseLocation: () => void;
}

function LocationGateArt() {
  return (
    <div className="relative mx-auto mb-7 size-32" aria-hidden>
      <div
        className="absolute bottom-0 left-1/2 size-[6.5rem] -translate-x-1/2 rounded-full shadow-[inset_-8px_-6px_20px_rgba(0,0,0,0.35)]"
        style={{
          background:
            "radial-gradient(circle at 35% 30%, #4a6a8a, transparent 42%), radial-gradient(circle at 70% 60%, #2a3d5c, #1a2740 72%, #141c30)",
        }}
      />
      <svg
        viewBox="0 0 36 48"
        className="absolute left-1/2 top-0 h-11 w-8 -translate-x-1/2"
        fill="none"
      >
        <path
          d="M18 46c0 0 14-14.2 14-28A14 14 0 1 0 4 18c0 13.8 14 28 14 28z"
          fill="#E57200"
        />
        <circle cx="18" cy="17" r="5.5" fill="#fff" />
      </svg>
    </div>
  );
}

export function LocationRequiredOverlay({
  geoLoading,
  geoError,
  onUseLocation,
}: LocationGateProps) {
  return (
    <div
      className="pointer-events-auto absolute inset-0 z-50 flex flex-col bg-uva-navy text-white"
      role="alertdialog"
      aria-labelledby="location-required-title"
      aria-describedby="location-required-desc"
    >
      <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
        <LocationGateArt />
        <h2
          id="location-required-title"
          className="text-2xl font-bold tracking-tight"
        >
          {geoLoading ? "Finding your location…" : "Allow location access"}
        </h2>
        <p
          id="location-required-desc"
          className="mt-2.5 max-w-[28ch] text-sm leading-snug text-white/60"
        >
          {geoLoading
            ? "Please ensure location is enabled in your browser."
            : "We use this to find nearby bus stops and plan your trip. You can change access in your browser settings."}
        </p>
      </div>

      <div className="flex flex-col gap-3.5 px-5 pb-6 pt-4 sm:px-8">
        <p className="text-center text-[0.7rem] leading-snug text-white/40">
          By allowing access, you consent to share your location with GoHoos to
          plan trips on Grounds.
        </p>
        <button
          type="button"
          onClick={onUseLocation}
          disabled={geoLoading}
          className="w-full rounded-[10px] bg-academical-orange px-4 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-95 disabled:cursor-wait disabled:opacity-70"
        >
          {geoLoading ? "Requesting…" : "Allow access"}
        </button>
        {geoError && !geoLoading ? (
          <p className="text-center text-xs text-red-300">{geoError}</p>
        ) : null}
      </div>
    </div>
  );
}

export type DestinationShortcut = {
  id: string;
  label: string;
  stopName: string | null;
  minutes: number | null;
  disabled: boolean;
};

interface PickBarProps {
  onConfirm: () => void;
  /** True after the user has dragged the destination pin. */
  pinTouched?: boolean;
  shortcuts: DestinationShortcut[];
  shortcutsLoading?: boolean;
  onSelectShortcut: (id: string) => void;
}

function shortcutMinutesDisplay(
  minutes: number | null,
  loading: boolean
): string {
  if (loading) return "…";
  if (minutes == null) return "—";
  return String(minutes);
}

export function DestinationPickBar({
  onConfirm,
  pinTouched = false,
  shortcuts,
  shortcutsLoading = false,
  onSelectShortcut,
}: PickBarProps) {
  const accent = (
    <div className="mx-auto w-full max-w-xl">
      <h2 className="text-center text-xl font-bold tracking-tight text-white sm:text-2xl">
        Where to?
      </h2>
      <p className="mt-1 text-center text-sm text-white/55">
        Drag the pin on the map, or pick a stop below
      </p>
      <div className="mt-3">
        <PlannerAccentBar
          as="button"
          onClick={onConfirm}
          disabled={!pinTouched}
          className={pinTouched ? "animate-go-cta-pop" : ""}
        >
          <p className="text-sm font-semibold sm:text-base">
            Confirm destination
          </p>
        </PlannerAccentBar>
      </div>
    </div>
  );

  return (
    <PlannerSheet ariaLabel="Choose a destination" accent={accent}>
      <ul className="flex h-full min-h-0 flex-col">
        {shortcuts.map((shortcut) => {
          const minutesLabel = shortcutMinutesDisplay(
            shortcut.minutes,
            shortcutsLoading
          );

          return (
            <li
              key={shortcut.id}
              className="flex min-h-0 flex-1 border-b border-white/10"
            >
              <button
                type="button"
                disabled={shortcut.disabled || shortcutsLoading}
                onClick={() => onSelectShortcut(shortcut.id)}
                className="flex h-full w-full min-w-0 items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-45 sm:px-6 sm:py-4 md:px-8"
              >
                <p className="min-w-0 truncate text-base font-semibold tracking-tight text-white sm:text-lg">
                  {shortcut.label}
                </p>
                <p className="shrink-0 text-right tabular-nums">
                  <span className="text-base font-bold text-white sm:text-lg">
                    {minutesLabel}
                  </span>
                  <span className="ml-1 text-xs font-medium text-white/55">
                    min
                  </span>
                </p>
              </button>
            </li>
          );
        })}
      </ul>
    </PlannerSheet>
  );
}

function cardRankLabel(
  trip: TripOption,
  rank: number,
  trips: TripOption[]
): string {
  if (rank === 0) return "Best";
  const minWalk = Math.min(...trips.map((t) => t.walkMeters));
  if (trips[0].walkMeters === minWalk) return `#${rank + 1}`;
  const leastIndex = trips.findIndex((t) => t.walkMeters === minWalk);
  if (rank === leastIndex && trip.walkMeters === minWalk) return "Least walk";
  return `#${rank + 1}`;
}

function TripOptionCard({
  trip,
  rank,
  trips,
  selected,
  onSelect,
}: {
  trip: TripOption;
  rank: number;
  trips: TripOption[];
  selected: boolean;
  onSelect: () => void;
}) {
  const rideCount = trip.steps.filter((s) => s.kind === "ride").length;
  const rankLabel = cardRankLabel(trip, rank, trips);

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`flex h-full w-full min-w-0 items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-white/5 sm:px-6 sm:py-4 md:px-8 ${
        selected ? "bg-academical-orange/15" : ""
      }`}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-semibold tracking-tight text-white sm:text-lg">
          {rankLabel}
          <span className="font-medium text-white/70">
            {" "}
            · {tripHeadline(trip)}
          </span>
        </p>
        <p className="mt-1 truncate text-xs text-white/55 sm:text-sm">
          {rideCount <= 1 ? "Direct" : "1 transfer"} · {tripBoardLabel(trip)} ·{" "}
          {formatStepMeters(trip.totalMeters)}
        </p>
      </div>

      <p className="shrink-0 text-right tabular-nums">
        <span className="text-base font-bold text-white sm:text-lg">
          {Math.round(trip.totalMinutes)}
        </span>
        <span className="ml-1 text-xs font-medium text-white/55">min</span>
      </p>
    </button>
  );
}

interface ResultsBarProps {
  trips: TripOption[];
  selectedTripIndex: number | null;
  isLoadingRoutes: boolean;
  onSelectTrip: (index: number) => void;
  onChangeDestination: () => void;
}

export function TripResultsBar({
  trips,
  selectedTripIndex,
  isLoadingRoutes,
  onSelectTrip,
  onChangeDestination,
}: ResultsBarProps) {
  const accent = (
    <div className="mx-auto w-full max-w-xl">
      <h2 className="text-center text-xl font-bold tracking-tight text-white sm:text-2xl">
        Best routes
      </h2>
      <p className="mt-1 text-center text-sm text-white/55">
        Pick a route to see steps on the map
      </p>
      <div className="mt-3">
        <PlannerActionRow>
          <PlannerAccentBar
            as="button"
            size="action"
            onClick={onChangeDestination}
            className="min-w-0 flex-1"
          >
            <span className={plannerActionLabelClassName()}>
              Change destination
            </span>
          </PlannerAccentBar>
        </PlannerActionRow>
      </div>
    </div>
  );

  return (
    <PlannerSheet ariaLabel="Route options" accent={accent}>
      {isLoadingRoutes && trips.length === 0 ? (
        <p className="flex flex-1 items-center justify-center px-4 text-center text-sm text-white/55 sm:text-base">
          Loading active routes…
        </p>
      ) : trips.length === 0 ? (
        <p className="flex flex-1 items-center justify-center px-4 text-center text-sm text-white/55 sm:text-base">
          No route found with at most one transfer
        </p>
      ) : (
        <ul className="flex h-full min-h-0 flex-col">
          {trips.map((trip, index) => (
            <li
              key={`trip-${index}`}
              className="flex min-h-0 flex-1 border-b border-white/10"
            >
              <TripOptionCard
                trip={trip}
                rank={index}
                trips={trips}
                selected={selectedTripIndex === index}
                onSelect={() => onSelectTrip(index)}
              />
            </li>
          ))}
        </ul>
      )}
    </PlannerSheet>
  );
}
