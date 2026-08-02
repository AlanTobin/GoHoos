"use client";

import type { PickedLocation } from "@/types/planner";
import { formatWalkDistance, stopDisplayName } from "@/lib/geo";

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
        <p className="mb-2 text-sm font-medium text-uva-navy">
          Drag the pin to where you want to go
        </p>

        {draftDestination ? (
          <p className="mb-3 text-xs text-uva-navy/55">
            Nearest stop: {stopDisplayName(draftDestination.stopName)} (
            {formatWalkDistance(draftDestination.walkMeters)})
          </p>
        ) : (
          <p className="mb-3 text-sm text-uva-navy/50">
            No nearby bus stop — try moving the pin closer to campus
          </p>
        )}

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

interface ResultsBarProps {
  onChangeDestination: () => void;
}

export function TripResultsBar({ onChangeDestination }: ResultsBarProps) {
  return (
    <div className="absolute inset-x-0 bottom-0 z-30 p-3">
      <div className="mx-auto max-w-md rounded-2xl border border-uva-navy/10 bg-white/95 px-4 py-3 shadow-xl backdrop-blur-sm">
        <p className="text-sm font-medium text-uva-navy">Planning your route</p>
        <p className="mt-3 rounded-lg border border-dashed border-uva-navy/15 px-3 py-2 text-center text-xs text-uva-navy/45">
          Route recommendations coming soon
        </p>
        <button
          type="button"
          onClick={onChangeDestination}
          className="mt-3 w-full rounded-lg border border-uva-navy/15 px-4 py-2.5 text-sm font-medium text-uva-navy transition-colors hover:bg-uva-navy/5"
        >
          Change destination
        </button>
      </div>
    </div>
  );
}
