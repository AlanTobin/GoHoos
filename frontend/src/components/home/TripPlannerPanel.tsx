"use client";

import type { PickedLocation, TripOption, TripStep } from "@/types/planner";
import { stopDisplayName } from "@/lib/geo";
import { isGoldYellow } from "@/lib/routes";
import { getRouteColor } from "@/lib/planner/buildTripPathGeoJSON";

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

function tripDestinationLabel(trip: TripOption): string {
  const lastRide = [...trip.steps]
    .reverse()
    .find((s): s is Extract<TripStep, { kind: "ride" }> => s.kind === "ride");
  if (lastRide) return stopDisplayName(lastRide.toStopName);
  const last = trip.steps[trip.steps.length - 1];
  return stopDisplayName(last.toStopName);
}

function tripBoardLabel(trip: TripOption): string {
  const firstRide = primaryRide(trip);
  if (!firstRide) return "Your location";
  return stopDisplayName(firstRide.fromStopName);
}

function cardColor(trip: TripOption): string {
  const ride = primaryRide(trip);
  return ride ? getRouteColor(ride.routeId) : "#232D4B";
}

function textOn(color: string): string {
  return isGoldYellow(color) ? "#232D4B" : "#FFFFFF";
}

interface LocationGateProps {
  geoLoading: boolean;
  geoError: string | null;
  onUseLocation: () => void;
}

function LocationIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function LocationRequiredOverlay({
  geoLoading,
  geoError,
  onUseLocation,
}: LocationGateProps) {
  return (
    <div className="pointer-events-auto absolute inset-0 z-50 flex items-end justify-center bg-red-950/35 p-3 backdrop-blur-[2px] sm:items-center sm:p-4">
      <div
        role="alertdialog"
        aria-labelledby="location-required-title"
        className="relative z-10 w-full max-w-md rounded-2xl border border-red-300/60 bg-red-50 px-4 py-5 shadow-2xl shadow-red-950/20"
      >
        <LocationIcon className="mx-auto size-8 text-red-500/80" />
        <div className="mt-3 text-center">
          <h2
            id="location-required-title"
            className="text-sm font-semibold text-red-950"
          >
            {geoLoading ? "Finding your location…" : "Location required"}
          </h2>
          <p className="mt-1 text-xs text-red-900/70">
            {geoLoading
              ? "Please ensure location is enabled in your browser."
              : "Allow location access to use the trip planner."}
          </p>
        </div>

        <button
          type="button"
          onClick={onUseLocation}
          disabled={geoLoading}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-red-700 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-800 disabled:cursor-wait disabled:opacity-70"
        >
          <LocationIcon className="size-4" />
          {geoLoading ? "Requesting location…" : "Enable location"}
        </button>

        {geoError && !geoLoading ? (
          <p className="mt-3 text-center text-xs text-red-700">{geoError}</p>
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
  draftDestination: PickedLocation | null;
  onConfirm: () => void;
  /** True after the user has dragged the destination pin. */
  pinTouched?: boolean;
  shortcuts: DestinationShortcut[];
  shortcutsLoading?: boolean;
  onSelectShortcut: (id: string) => void;
}

function LiveSignalIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      className={className}
      aria-hidden
    >
      <path d="M8.5 15.5a5 5 0 0 1 7 0" />
      <path d="M5.5 12.5a9 9 0 0 1 13 0" />
      <path d="M12 18.5h.01" />
    </svg>
  );
}

function DestinationArrowIcon({ className }: { className?: string }) {
  return (
    <span
      className={`inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-white ${className ?? ""}`}
      aria-hidden
    >
      <svg
        viewBox="0 0 12 12"
        className="size-2.5 fill-current text-uva-navy"
      >
        <path d="M4.2 2.2 8.3 6 4.2 9.8V2.2Z" />
      </svg>
    </span>
  );
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
  draftDestination,
  onConfirm,
  pinTouched = false,
  shortcuts,
  shortcutsLoading = false,
  onSelectShortcut,
}: PickBarProps) {
  return (
    <div className="absolute inset-x-0 bottom-0 z-30 flex max-h-[min(58vh,32rem)] flex-col">
      {/* Instruction → Go CTA after pin drag; 75% width, scales up on larger screens */}
      <div className="relative z-10 mx-auto -mb-3 w-[75%] max-w-3xl">
        {!pinTouched ? (
          <div className="flex items-center gap-2.5 rounded-xl bg-uva-orange px-3.5 py-3.5 shadow-lg shadow-uva-navy/25 sm:gap-3 sm:rounded-2xl sm:px-5 sm:py-4 md:px-6 md:py-5">
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              className="size-5 shrink-0 text-white sm:size-6 md:size-7"
              aria-hidden
            >
              <path
                fillRule="evenodd"
                d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                clipRule="evenodd"
              />
            </svg>
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-snug text-white sm:text-base md:text-lg">
                <span className="sm:hidden">
                  Drag the pin to
                  <br />
                  where you want to go
                </span>
                <span className="hidden sm:inline">
                  Drag the pin to where you want to go
                </span>
              </p>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={onConfirm}
            disabled={!draftDestination}
            className="animate-go-cta-pop flex w-full items-center justify-center rounded-xl bg-uva-orange px-3.5 py-3.5 text-center text-white shadow-lg shadow-uva-navy/25 disabled:cursor-not-allowed disabled:opacity-50 sm:rounded-2xl sm:px-5 sm:py-4 md:px-6 md:py-5"
          >
            <p className="text-sm font-semibold leading-snug sm:text-base md:text-lg">
              {draftDestination ? "Let's Go" : "Move closer to a campus stop"}
            </p>
          </button>
        )}
      </div>

      {/* Navy arrivals-style destination list */}
      <div className="flex min-h-0 flex-1 flex-col bg-uva-navy pt-5 text-white shadow-[0_-8px_24px_rgba(35,45,75,0.35)]">
        <div className="min-h-0 flex-1 overflow-y-auto">
          <ul>
            {shortcuts.map((shortcut) => {
              const minutesLabel = shortcutMinutesDisplay(
                shortcut.minutes,
                shortcutsLoading
              );
              const stopLabel = shortcut.stopName
                ? stopDisplayName(shortcut.stopName)
                : "Campus destination";

              return (
                <li key={shortcut.id} className="border-b border-uva-navy-light">
                  <button
                    type="button"
                    disabled={shortcut.disabled || shortcutsLoading}
                    onClick={() => onSelectShortcut(shortcut.id)}
                    className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[1.65rem] font-bold leading-none tracking-tight">
                        {shortcut.label}
                      </p>
                      <p className="mt-1.5 flex items-center gap-1.5 text-sm font-semibold leading-tight">
                        <DestinationArrowIcon />
                        <span className="truncate">Nearest stop</span>
                      </p>
                      <p className="mt-1 truncate text-sm font-normal text-white/90">
                        {stopLabel}
                      </p>
                    </div>

                    <div className="relative shrink-0 pr-1 text-right">
                      {!shortcutsLoading && shortcut.minutes != null ? (
                        <LiveSignalIcon className="absolute -right-0.5 -top-0.5 size-3.5 text-white/90" />
                      ) : null}
                      <p className="text-[2.35rem] font-bold leading-none tabular-nums">
                        {minutesLabel}
                      </p>
                      <p className="mt-0.5 text-xs font-medium text-white/90">
                        minutes
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
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
  const color = cardColor(trip);
  const onColor = textOn(color);
  const rideCount = trip.steps.filter((s) => s.kind === "ride").length;
  const rankLabel = cardRankLabel(trip, rank, trips);

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`flex w-full items-stretch overflow-hidden rounded-xl text-left shadow-md transition-transform ${
        selected
          ? "scale-[1.01] ring-2 ring-white ring-offset-2 ring-offset-uva-navy/20"
          : "hover:brightness-105"
      }`}
      style={{ backgroundColor: color, color: onColor }}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3 px-3 py-3">
        <div className="shrink-0">
          <p className="text-sm font-bold leading-none tracking-tight">
            {rankLabel}
          </p>
          <p className="mt-1 text-[10px] font-medium uppercase tracking-wide opacity-80">
            {rideCount <= 1 ? "Direct" : "1 transfer"}
          </p>
        </div>

        <div className="min-w-0 flex-1 border-l border-white/25 pl-3">
          <p className="flex items-center gap-1.5 text-sm font-semibold leading-snug">
            <span aria-hidden className="opacity-80">
              →
            </span>
            <span className="truncate">{tripDestinationLabel(trip)}</span>
          </p>
          <p className="mt-0.5 truncate text-xs opacity-80">
            {tripHeadline(trip)} · board at {tripBoardLabel(trip)}
          </p>
        </div>
      </div>

      <div className="flex w-[5.25rem] shrink-0 flex-col items-center justify-center border-l border-white/25 px-2 py-3 text-center">
        <p className="text-lg font-bold leading-none tabular-nums">
          ~{trip.totalMinutes}
        </p>
        <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wide opacity-80">
          min
        </p>
        <p className="mt-1 text-[10px] opacity-70">
          {formatStepMeters(trip.totalMeters)}
        </p>
      </div>
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
  return (
    <div className="absolute inset-x-0 bottom-0 z-30 p-3">
      <div className="mx-auto max-w-md rounded-2xl border border-uva-navy/10 bg-white/95 px-3 py-3 shadow-xl backdrop-blur-sm">
        <div className="mb-2 flex items-center justify-between gap-2 px-1">
          <p className="text-sm font-medium text-uva-navy">Route options</p>
          <button
            type="button"
            onClick={onChangeDestination}
            className="text-xs font-medium text-uva-orange hover:text-uva-orange-hover"
          >
            Change destination
          </button>
        </div>

        {isLoadingRoutes && trips.length === 0 ? (
          <p className="px-1 py-4 text-center text-xs text-uva-navy/45">
            Loading active routes…
          </p>
        ) : trips.length === 0 ? (
          <p className="rounded-lg border border-dashed border-uva-navy/15 px-3 py-3 text-center text-xs text-uva-navy/45">
            No route found with at most one transfer
          </p>
        ) : (
          <ul className="max-h-[40vh] space-y-2 overflow-y-auto">
            {trips.map((trip, index) => (
              <li key={`trip-${index}`}>
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
      </div>
    </div>
  );
}
