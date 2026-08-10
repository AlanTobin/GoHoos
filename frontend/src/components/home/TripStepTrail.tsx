"use client";

import { isGoldYellow } from "@/lib/routes";
import { getRouteColor } from "@/lib/planner/buildTripPathGeoJSON";
import { stopDisplayName } from "@/lib/geo";
import { stopIdsForTripStep } from "@/lib/planner/tripStepStops";
import type { TripOption, TripRideStep, TripStep, TripWalkStep } from "@/types/planner";

function formatMinutes(minutes: number): string {
  const mins = Math.max(1, Math.round(minutes));
  return mins === 1 ? "1 min" : `${mins} min`;
}

function textOn(color: string): string {
  return isGoldYellow(color) ? "#232D4B" : "#FFFFFF";
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

function DestIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden>
      <path
        fillRule="evenodd"
        d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function WalkRow({
  step,
  active,
  onSelect,
}: {
  step: TripWalkStep;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={active ? "step" : undefined}
      className={`flex w-full items-center gap-3 px-1 py-2 text-left transition-opacity ${
        active ? "opacity-100" : "opacity-65 hover:opacity-100"
      }`}
    >
      <div className="flex w-6 shrink-0 flex-col items-center self-stretch">
        <div className="w-px flex-1 border-l border-dashed border-uva-navy/25" />
      </div>
      <div
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${
          active ? "bg-uva-navy text-white" : "bg-uva-navy/8 text-uva-navy/70"
        }`}
      >
        <WalkIcon className="size-3.5" />
        <span>{formatMinutes(step.minutes)}</span>
      </div>
      <span className="truncate text-xs text-uva-navy/50">
        {step.toStopId
          ? `Walk to ${stopDisplayName(step.toStopName)}`
          : "Walk to destination"}
      </span>
    </button>
  );
}

function RideCard({
  step,
  index,
  trip,
  active,
  onSelect,
}: {
  step: TripRideStep;
  index: number;
  trip: TripOption;
  active: boolean;
  onSelect: () => void;
}) {
  const color = getRouteColor(step.routeId);
  const onColor = textOn(color);
  const stopIds = stopIdsForTripStep(trip, index);
  const intermediate = Math.max(0, stopIds.length - 2);

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={active ? "step" : undefined}
      className={`w-full rounded-2xl border bg-white px-3 py-3 text-left shadow-sm transition-all ${
        active
          ? "border-uva-navy/20 ring-2 ring-uva-navy/20"
          : "border-uva-navy/10 opacity-90 hover:opacity-100"
      }`}
    >
      <div className="mb-3 flex items-center gap-2">
        <BusIcon className="size-4 text-uva-navy/40" />
        <span
          className="inline-flex max-w-[14rem] items-center truncate rounded-full px-2.5 py-0.5 text-[11px] font-bold"
          style={{ backgroundColor: color, color: onColor }}
        >
          {step.routeName}
        </span>
        <span className="ml-auto text-[11px] font-medium text-uva-navy/45">
          {formatMinutes(step.minutes)}
        </span>
      </div>

      <div className="flex gap-3">
        <div className="flex w-3 shrink-0 flex-col items-center py-0.5">
          <span
            className="size-2.5 rounded-full border-2 bg-white"
            style={{ borderColor: color }}
          />
          <span
            className="my-1 w-0.5 flex-1 min-h-[2.5rem] rounded-full"
            style={{ backgroundColor: color }}
          />
          <span
            className="size-2.5 rounded-full border-2 bg-white"
            style={{ borderColor: color }}
          />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-uva-navy">
            {stopDisplayName(step.fromStopName)}
          </p>
          <p className="mt-0.5 truncate text-[11px] text-uva-navy/50">
            → {step.routeName}
          </p>

          <p className="my-2.5 text-[11px] text-uva-navy/40">
            {intermediate > 0
              ? `${intermediate} more stop${intermediate === 1 ? "" : "s"}`
              : "Direct"}
          </p>

          <p className="truncate text-sm font-semibold text-uva-navy">
            {stopDisplayName(step.toStopName)}
          </p>
        </div>
      </div>
    </button>
  );
}

function DestinationCard({
  label,
  active,
  onSelect,
}: {
  label: string;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={active ? "step" : undefined}
      className={`flex w-full items-center gap-3 rounded-2xl border bg-white px-3 py-3 text-left shadow-sm transition-all ${
        active
          ? "border-uva-orange/40 ring-2 ring-uva-orange/25"
          : "border-uva-navy/10 opacity-90 hover:opacity-100"
      }`}
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-uva-orange text-white">
        <DestIcon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-wide text-uva-navy/40">
          Destination
        </p>
        <p className="truncate text-sm font-semibold text-uva-navy">{label}</p>
      </div>
    </button>
  );
}

interface Props {
  trip: TripOption;
  activeStepIndex: number;
  onStepFocus: (index: number) => void;
  destinationLabel?: string;
  onBackToRoutes: () => void;
  onChangeDestination: () => void;
}

export default function TripStepTrail({
  trip,
  activeStepIndex,
  onStepFocus,
  destinationLabel = "Destination",
  onBackToRoutes,
  onChangeDestination,
}: Props) {
  if (trip.steps.length === 0) return null;

  const last = trip.steps[trip.steps.length - 1];
  const lastIsEgress = last.kind === "walk" && !last.toStopId;

  return (
    <div className="absolute inset-x-0 bottom-0 z-30 p-3">
      <div className="mx-auto max-w-md rounded-2xl border border-uva-navy/10 bg-white/95 px-3 py-3 shadow-xl backdrop-blur-sm">
        <div className="mb-3 flex items-center gap-2">
          <button
            type="button"
            onClick={onBackToRoutes}
            className="rounded-lg border border-uva-navy/15 bg-white px-3 py-2 text-xs font-medium text-uva-navy transition-colors hover:bg-uva-navy/5"
          >
            ← Routes
          </button>
          <p className="flex-1 text-center text-sm font-semibold text-uva-navy">
            ~{trip.totalMinutes} min
          </p>
          <button
            type="button"
            onClick={onChangeDestination}
            className="rounded-lg border border-uva-navy/15 bg-white px-3 py-2 text-xs font-medium text-uva-navy transition-colors hover:bg-uva-navy/5"
          >
            Change dest
          </button>
        </div>

        <ol className="max-h-[48vh] space-y-1 overflow-y-auto pr-0.5">
          {trip.steps.map((step: TripStep, index) => {
            const active = index === activeStepIndex;

            if (step.kind === "walk") {
              if (lastIsEgress && index === trip.steps.length - 1) {
                return (
                  <li key={`step-${index}`} className="space-y-1">
                    <WalkRow
                      step={step}
                      active={active}
                      onSelect={() => onStepFocus(index)}
                    />
                    <DestinationCard
                      label={destinationLabel}
                      active={active}
                      onSelect={() => onStepFocus(index)}
                    />
                  </li>
                );
              }

              return (
                <li key={`step-${index}`}>
                  <WalkRow
                    step={step}
                    active={active}
                    onSelect={() => onStepFocus(index)}
                  />
                </li>
              );
            }

            return (
              <li key={`step-${index}`}>
                <RideCard
                  step={step}
                  index={index}
                  trip={trip}
                  active={active}
                  onSelect={() => onStepFocus(index)}
                />
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
