"use client";

import PlannerSheet, {
  PlannerAccentBar,
  plannerActionLabelClassName,
} from "@/components/home/PlannerSheet";
import { stopDisplayName } from "@/lib/geo";
import { getRouteColor } from "@/lib/planner/buildTripPathGeoJSON";
import { isGoldYellow } from "@/lib/routes";
import type { TripOption, TripStep } from "@/types/planner";

function tripBoardLabel(trip: TripOption): string {
  const firstRide = trip.steps.find(
    (s): s is Extract<TripStep, { kind: "ride" }> => s.kind === "ride"
  );
  if (!firstRide) return "Walking trip";
  return `Board at ${stopDisplayName(firstRide.fromStopName)}`;
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
          className="w-full rounded-[10px] bg-uva-orange px-4 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-95 disabled:cursor-wait disabled:opacity-70"
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
  walkMeters: number | null;
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
  return `${minutes} min`;
}

function formatWalkDistance(meters: number | null, loading: boolean): string {
  if (loading) return "…";
  if (meters == null) return "—";
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1609.34).toFixed(1)} mi`;
}

function PopularDestinationCard({
  shortcut,
  index,
  loading,
  onSelect,
}: {
  shortcut: DestinationShortcut;
  index: number;
  loading: boolean;
  onSelect: () => void;
}) {
  const subtitle = shortcut.stopName
    ? `Nearest stop · ${shortcut.stopName}`
    : "Campus destination";

  return (
    <button
      type="button"
      disabled={shortcut.disabled || loading}
      onClick={onSelect}
      className="w-full rounded-xl bg-uva-navy-light/80 p-1.5 text-left ring-1 ring-white/12 transition-opacity disabled:cursor-not-allowed disabled:opacity-45"
    >
      <div className="flex items-center gap-2.5 rounded-[14px] bg-uva-blue-soft px-2.5 py-2">
        <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-uva-orange text-xs font-bold text-white">
          {index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold tracking-tight text-uva-navy">
            {shortcut.label}
          </p>
          <p className="mt-0.5 truncate text-[0.7rem] text-uva-navy/60">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 px-2 pb-1.5 pt-2 sm:gap-3 sm:px-2.5">
        <div className="min-w-0 flex-1">
          <p className="text-[0.6rem] font-medium uppercase tracking-wide text-white/50">
            Time
          </p>
          <p className="mt-0.5 text-sm font-bold tabular-nums text-white">
            {shortcutMinutesDisplay(shortcut.minutes, loading)}
          </p>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[0.6rem] font-medium uppercase tracking-wide text-white/50">
            Distance
          </p>
          <p className="mt-0.5 text-sm font-bold tabular-nums text-white">
            {formatWalkDistance(shortcut.walkMeters, loading)}
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center justify-center rounded-full bg-uva-orange px-3.5 py-2 text-xs font-bold text-white shadow-[0_4px_14px_rgba(229,114,0,0.45)] sm:px-4">
          Go now
        </span>
      </div>
    </button>
  );
}

export function DestinationPickBar({
  onConfirm,
  pinTouched = false,
  shortcuts,
  shortcutsLoading = false,
  onSelectShortcut,
}: PickBarProps) {
  const accent = (
    <div className="w-full">
      <h2 className="text-center text-base font-bold tracking-tight text-white">
        Where to?
      </h2>
      <p className="mt-0.5 text-center text-xs leading-snug text-white/55">
        Drag the pin on the map, or pick a stop below
      </p>
      <div className="mt-2">
        <PlannerAccentBar
          as="button"
          onClick={onConfirm}
          disabled={!pinTouched}
          className={
            pinTouched
              ? "animate-go-cta-glow shadow-[0_4px_14px_rgba(229,114,0,0.45)]"
              : ""
          }
        >
          <p className="text-sm font-semibold">Confirm destination</p>
        </PlannerAccentBar>
      </div>
    </div>
  );

  return (
    <PlannerSheet
      ariaLabel="Choose a destination"
      accent={accent}
      collapsedLabel="Where to?"
    >
      <ul className="flex flex-col gap-2">
        {shortcuts.map((shortcut, index) => (
          <li key={shortcut.id}>
            <PopularDestinationCard
              shortcut={shortcut}
              index={index}
              loading={shortcutsLoading}
              onSelect={() => onSelectShortcut(shortcut.id)}
            />
          </li>
        ))}
      </ul>
    </PlannerSheet>
  );
}

function WalkIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden>
      <path d="M10 2.5a1.75 1.75 0 110 3.5 1.75 1.75 0 010-3.5zM8.2 7.1c.4-.25.88-.35 1.35-.28l1.7.28 1.55 2.4c.2.3.14.7-.14.92l-.9.66-.95-1.47-.55.85 1.55 2.05v3.74a.75.75 0 01-1.5 0v-3.2L7.9 10.4l-.85 2.55-1.95.65a.75.75 0 01-.47-1.42l2.25-.75 1.05-3.15-.68-.1V7.1z" />
    </svg>
  );
}

function BusIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden>
      <path d="M4 4.5A2.5 2.5 0 016.5 2h7A2.5 2.5 0 0116 4.5V14a1 1 0 01-1 1h-.5a1.5 1.5 0 11-3 0H8.5a1.5 1.5 0 11-3 0H5a1 1 0 01-1-1V4.5zM6 6v3h8V6H6zm0 4.5v2h1.5v-2H6zm6.5 0v2H14v-2h-1.5z" />
    </svg>
  );
}

function TripStepsPreview({ steps }: { steps: TripStep[] }) {
  return (
    <div
      className="flex items-center"
      aria-label={`${steps.length} step${steps.length === 1 ? "" : "s"}`}
    >
      {steps.map((step, i) => {
        const routeColor =
          step.kind === "ride" ? getRouteColor(step.routeId) : null;
        const iconTone =
          routeColor && isGoldYellow(routeColor)
            ? "text-uva-navy"
            : "text-white";

        return (
          <div key={`preview-step-${i}`} className="flex items-center">
            {i > 0 ? (
              <span
                className="mx-0.5 h-px w-2 shrink-0 bg-white/35 sm:w-2.5"
                aria-hidden
              />
            ) : null}
            <span
              className={`inline-flex size-6 shrink-0 items-center justify-center rounded-full sm:size-7 ${
                step.kind === "ride"
                  ? iconTone
                  : "bg-white/15 text-white/90"
              }`}
              style={
                routeColor ? { backgroundColor: routeColor } : undefined
              }
              title={step.kind === "ride" ? step.routeName : "Walk"}
            >
              {step.kind === "ride" ? (
                <BusIcon className="size-3 sm:size-3.5" />
              ) : (
                <WalkIcon className="size-3 sm:size-3.5" />
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function TripOptionCard({
  trip,
  index,
  selected,
  onSelect,
}: {
  trip: TripOption;
  index: number;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`w-full rounded-xl p-1.5 text-left ring-1 transition-colors ${
        selected
          ? "bg-uva-orange/15 ring-uva-orange/50"
          : "bg-uva-navy-light/80 ring-white/12 hover:bg-uva-navy-light"
      }`}
    >
      <div className="flex items-center gap-2.5 rounded-[14px] bg-uva-blue-soft px-2.5 py-2">
        <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-uva-orange text-xs font-bold text-white">
          {index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold tracking-tight text-uva-navy">
            {tripBoardLabel(trip)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 px-2 pb-1.5 pt-2 sm:gap-3 sm:px-2.5">
        <div className="min-w-0 shrink-0">
          <p className="text-[0.6rem] font-medium uppercase tracking-wide text-white/50">
            Time
          </p>
          <p className="mt-0.5 text-sm font-bold tabular-nums text-white">
            {Math.round(trip.totalMinutes)} min
          </p>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[0.6rem] font-medium uppercase tracking-wide text-white/50">
            Steps
          </p>
          <div className="mt-0.5">
            <TripStepsPreview steps={trip.steps} />
          </div>
        </div>
        <span className="inline-flex shrink-0 items-center justify-center rounded-full bg-uva-orange px-3.5 py-2 text-xs font-bold text-white shadow-[0_4px_14px_rgba(229,114,0,0.45)] sm:px-4">
          View
        </span>
      </div>
    </button>
  );
}

interface ResultsBarProps {
  trips: TripOption[];
  selectedTripIndex: number | null;
  isLoadingRoutes: boolean;
  destinationLabel?: string | null;
  onSelectTrip: (index: number) => void;
  onBack: () => void;
}

export function TripResultsBar({
  trips,
  selectedTripIndex,
  isLoadingRoutes,
  destinationLabel,
  onSelectTrip,
  onBack,
}: ResultsBarProps) {
  const hint = destinationLabel
    ? `To ${destinationLabel} · Ranked by time`
    : "Ranked by time";

  const accent = (
    <div className="w-full">
      <h2 className="text-center text-base font-bold tracking-tight text-white">
        Possible routes
      </h2>
      <p className="mt-0.5 text-center text-xs leading-snug text-white/55">
        {hint}
      </p>
    </div>
  );

  const footer = (
    <PlannerAccentBar as="button" size="action" onClick={onBack}>
      <span className={plannerActionLabelClassName()}>Back</span>
    </PlannerAccentBar>
  );

  return (
    <PlannerSheet
      ariaLabel="Possible routes"
      accent={accent}
      collapsedLabel="Possible routes"
      footer={footer}
    >
      {isLoadingRoutes && trips.length === 0 ? (
        <p className="py-6 text-center text-sm text-white/55">
          Loading active routes…
        </p>
      ) : trips.length === 0 ? (
        <p className="py-6 text-center text-sm text-white/55">
          No route found with at most one transfer
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {trips.map((trip, index) => (
            <li key={`trip-${index}`}>
              <TripOptionCard
                trip={trip}
                index={index}
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
