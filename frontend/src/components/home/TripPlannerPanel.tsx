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

interface PickBarProps {
  draftDestination: PickedLocation | null;
  onConfirm: () => void;
}

export function DestinationPickBar({ draftDestination, onConfirm }: PickBarProps) {
  return (
    <div className="absolute inset-x-0 bottom-0 z-30 p-3">
      <div className="mx-auto max-w-md rounded-2xl border border-uva-navy/10 bg-white/95 px-4 py-3 shadow-xl backdrop-blur-sm">
        <p className="mb-3 text-sm font-medium text-uva-navy">
          Drag the pin to where you want to go
        </p>

        {!draftDestination ? (
          <p className="mb-3 text-sm text-uva-navy/50">
            No nearby bus stop — try moving the pin closer to campus
          </p>
        ) : null}

        <button
          type="button"
          onClick={onConfirm}
          disabled={!draftDestination}
          className="w-full rounded-lg bg-uva-orange px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-uva-orange-hover disabled:opacity-50"
        >
          Confirm destination
        </button>
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
