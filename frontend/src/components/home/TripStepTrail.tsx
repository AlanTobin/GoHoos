"use client";

import type { CSSProperties } from "react";
import PlannerSheet, {
  PlannerAccentBar,
  plannerActionLabelClassName,
} from "@/components/home/PlannerSheet";
import { stopDisplayName } from "@/lib/geo";
import { getRouteColor } from "@/lib/planner/buildTripPathGeoJSON";
import { stopIdsForTripStep } from "@/lib/planner/tripStepStops";
import { isGoldYellow, withAlpha } from "@/lib/routes";
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

function BusIcon({
  className,
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
      style={style}
      aria-hidden
    >
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
      className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors sm:gap-3 sm:px-3 sm:py-2.5 ${
        active
          ? "bg-white/[0.1] ring-1 ring-white/35"
          : "bg-white/[0.04] ring-1 ring-white/10 hover:bg-white/[0.07]"
      }`}
    >
      <div
        className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
          active
            ? "bg-white/20 text-white"
            : "bg-white/12 text-white/90"
        }`}
      >
        <WalkIcon className="size-3.5" />
        <span>{formatMinutes(step.minutes)}</span>
      </div>
      <span
        className={`min-w-0 truncate text-sm font-medium ${
          active ? "text-white" : "text-white/75"
        }`}
      >
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
  const routeColor = getRouteColor(step.routeId);
  const onGold = isGoldYellow(routeColor);
  const badgeTextClass = onGold ? "text-uva-navy" : "text-white";

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={active ? "step" : undefined}
      className={`w-full rounded-xl px-3 py-2.5 text-left transition-all sm:px-3.5 sm:py-3 ${
        active ? "" : "bg-white/[0.04] hover:bg-white/[0.07]"
      }`}
      style={{
        backgroundColor: active ? withAlpha(routeColor, 0.18) : undefined,
        boxShadow: active
          ? `inset 0 0 0 1.5px ${routeColor}`
          : "inset 0 0 0 1px rgba(255,255,255,0.12)",
      }}
    >
      <div className="mb-2 flex items-center gap-2">
        <BusIcon
          className="size-3.5 shrink-0 sm:size-4"
          style={{ color: routeColor }}
        />
        <span
          className={`inline-flex max-w-[min(100%,16rem)] items-center truncate rounded-full px-2.5 py-0.5 text-xs font-bold ${badgeTextClass}`}
          style={{ backgroundColor: routeColor }}
        >
          {step.routeName}
        </span>
        <span className="ml-auto text-xs font-semibold tabular-nums text-white/60">
          {formatMinutes(step.minutes)}
        </span>
      </div>

      <div className="flex gap-2.5 sm:gap-3">
        <div className="flex w-2.5 shrink-0 flex-col items-center py-0.5 sm:w-3">
          <span
            className="size-2 rounded-full border-2 bg-uva-navy"
            style={{ borderColor: routeColor }}
          />
          <span
            className="my-0.5 min-h-[1.5rem] w-0.5 flex-1 rounded-full"
            style={{ backgroundColor: routeColor }}
          />
          <span
            className="size-2 rounded-full border-2 bg-uva-navy"
            style={{ borderColor: routeColor }}
          />
        </div>

        <div className="min-w-0 flex-1 text-white">
          <p className="truncate text-sm font-semibold sm:text-[0.95rem]">
            {stopDisplayName(step.fromStopName)}
          </p>
          <p className="my-1 text-[0.7rem] text-white/45 sm:text-xs">
            {intermediate > 0
              ? `${intermediate} more stop${intermediate === 1 ? "" : "s"}`
              : "Direct"}
          </p>
          <p className="truncate text-sm font-semibold sm:text-[0.95rem]">
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
  onBack: () => void;
}

export default function TripStepTrail({
  trip,
  activeStepIndex,
  onStepFocus,
  onBack,
}: Props) {
  if (trip.steps.length === 0) return null;

  const accent = (
    <div className="w-full">
      <h2 className="text-center text-base font-bold tracking-tight text-white">
        Trip steps
      </h2>
    </div>
  );

  const footer = (
    <PlannerAccentBar as="button" size="action" onClick={onBack}>
      <span className={plannerActionLabelClassName()}>Back</span>
    </PlannerAccentBar>
  );

  return (
    <PlannerSheet
      ariaLabel="Trip steps"
      accent={accent}
      collapsedLabel="Trip steps"
      footer={footer}
    >
      <ol className="flex flex-col">
        {trip.steps.map((step: TripStep, index) => {
          const active = index === activeStepIndex;
          const isLast = index === trip.steps.length - 1;

          return (
            <li key={`step-${index}`} className="flex flex-col">
              {step.kind === "walk" ? (
                <WalkRow
                  step={step}
                  active={active}
                  onSelect={() => onStepFocus(index)}
                />
              ) : (
                <RideCard
                  step={step}
                  index={index}
                  trip={trip}
                  active={active}
                  onSelect={() => onStepFocus(index)}
                />
              )}
              {!isLast ? (
                <div className="flex justify-center py-1" aria-hidden>
                  <span className="h-3 w-px border-l-2 border-dashed border-white/30" />
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>
    </PlannerSheet>
  );
}
