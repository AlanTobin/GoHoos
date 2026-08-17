"use client";

import PlannerSheet, {
  PlannerAccentBar,
  PlannerActionRow,
  plannerActionLabelClassName,
} from "@/components/home/PlannerSheet";
import { stopDisplayName } from "@/lib/geo";
import { stopIdsForTripStep } from "@/lib/planner/tripStepStops";
import type { TripOption, TripRideStep, TripStep, TripWalkStep } from "@/types/planner";

function formatMinutes(minutes: number): string {
  const mins = Math.max(1, Math.round(minutes));
  return mins === 1 ? "1 min" : `${mins} min`;
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
      className={`flex w-full items-center gap-3 px-1 py-3.5 text-left transition-opacity sm:gap-4 sm:py-4 ${
        active ? "opacity-100" : "opacity-70 hover:opacity-100"
      }`}
    >
      <div className="flex w-6 shrink-0 flex-col items-center self-stretch sm:w-8">
        <div className="w-px flex-1 border-l border-dashed border-white/25" />
      </div>
      <div
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium sm:text-sm ${
          active
            ? "bg-academical-orange text-white"
            : "bg-white/10 text-white/85"
        }`}
      >
        <WalkIcon className="size-3.5 sm:size-4" />
        <span>{formatMinutes(step.minutes)}</span>
      </div>
      <span className="truncate text-sm text-white/65 sm:text-base">
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
  const stopIds = stopIdsForTripStep(trip, index);
  const intermediate = Math.max(0, stopIds.length - 2);

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={active ? "step" : undefined}
      className={`w-full rounded-2xl border px-4 py-4 text-left transition-all sm:px-5 sm:py-5 ${
        active
          ? "border-academical-orange/60 bg-academical-orange/15 ring-2 ring-academical-orange/25"
          : "border-white/15 bg-white/5 opacity-95 hover:bg-white/10"
      }`}
    >
      <div className="mb-4 flex items-center gap-2 sm:mb-5">
        <BusIcon
          className={`size-4 sm:size-5 ${active ? "text-academical-orange" : "text-white/70"}`}
        />
        <span
          className={`inline-flex max-w-[min(100%,20rem)] items-center truncate rounded-full px-3 py-1 text-xs font-bold sm:text-sm ${
            active
              ? "bg-academical-orange text-white"
              : "bg-white/15 text-white"
          }`}
        >
          {step.routeName}
        </span>
        <span className="ml-auto text-xs font-medium text-white/55 sm:text-sm">
          {formatMinutes(step.minutes)}
        </span>
      </div>

      <div className="flex gap-3 sm:gap-4">
        <div className="flex w-3 shrink-0 flex-col items-center py-0.5 sm:w-4">
          <span
            className={`size-2.5 rounded-full border-2 bg-uva-navy sm:size-3 ${
              active ? "border-academical-orange" : "border-white/45"
            }`}
          />
          <span
            className={`my-1 min-h-[2.75rem] w-0.5 flex-1 rounded-full sm:min-h-[3.25rem] ${
              active ? "bg-academical-orange" : "bg-white/35"
            }`}
          />
          <span
            className={`size-2.5 rounded-full border-2 bg-uva-navy sm:size-3 ${
              active ? "border-academical-orange" : "border-white/45"
            }`}
          />
        </div>

        <div className="min-w-0 flex-1 text-white">
          <p className="truncate text-base font-semibold sm:text-lg">
            {stopDisplayName(step.fromStopName)}
          </p>
          <p className="mt-0.5 truncate text-xs text-white/55 sm:text-sm">
            → {step.routeName}
          </p>

          <p className="my-2.5 text-xs text-white/45 sm:my-3 sm:text-sm">
            {intermediate > 0
              ? `${intermediate} more stop${intermediate === 1 ? "" : "s"}`
              : "Direct"}
          </p>

          <p className="truncate text-base font-semibold sm:text-lg">
            {stopDisplayName(step.toStopName)}
          </p>
        </div>
      </div>
    </button>
  );
}

interface Props {
  trip: TripOption;
  activeStepIndex: number;
  onStepFocus: (index: number) => void;
  onBackToRoutes: () => void;
  onChangeDestination: () => void;
}

export default function TripStepTrail({
  trip,
  activeStepIndex,
  onStepFocus,
  onBackToRoutes,
  onChangeDestination,
}: Props) {
  if (trip.steps.length === 0) return null;

  const accent = (
    <PlannerActionRow>
      <PlannerAccentBar
        as="button"
        size="action"
        onClick={onBackToRoutes}
        className="min-w-0 flex-1"
      >
        <span className={plannerActionLabelClassName()}>Routes</span>
      </PlannerAccentBar>
      <PlannerAccentBar
        size="action"
        tone="muted"
        className="min-w-[5.5rem] shrink-0 sm:min-w-[6.5rem]"
      >
        <span className={plannerActionLabelClassName("tabular-nums")}>
          {trip.totalMinutes} min
        </span>
      </PlannerAccentBar>
      <PlannerAccentBar
        as="button"
        size="action"
        onClick={onChangeDestination}
        className="min-w-0 flex-1"
      >
        <span className={plannerActionLabelClassName()}>Change dest</span>
      </PlannerAccentBar>
    </PlannerActionRow>
  );

  return (
    <PlannerSheet ariaLabel="Trip steps" accent={accent}>
      <ol className="space-y-4 px-4 py-4 sm:space-y-5 sm:px-6 sm:py-5 md:px-8 md:py-6">
        {trip.steps.map((step: TripStep, index) => {
          const active = index === activeStepIndex;

          if (step.kind === "walk") {
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
    </PlannerSheet>
  );
}
