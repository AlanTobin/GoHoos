import routeStopsData from "@/data/json/route-stops.json";
import routeStopOverrides from "@/data/json/route-stop-overrides.json";
import { rideStopSequence } from "@/lib/planner/sliceRouteShape";
import type { TripOption } from "@/types/planner";

const routeStopsRaw = routeStopsData as Record<string, string[]>;
const overrideRouteStops = routeStopOverrides as Record<string, string[]>;

function stopsForRoute(routeId: string): string[] {
  return overrideRouteStops[routeId] ?? routeStopsRaw[routeId] ?? [];
}

/** Stop ids visible for the focused trip step only. */
export function stopIdsForTripStep(
  trip: TripOption,
  stepIndex: number
): string[] {
  const step = trip.steps[stepIndex];
  if (!step) return [];

  if (step.kind === "ride") {
    return rideStopSequence(
      stopsForRoute(step.routeId),
      step.fromStopId,
      step.toStopId
    );
  }

  const ids: string[] = [];
  if (step.toStopId) ids.push(step.toStopId);

  const prev = trip.steps[stepIndex - 1];
  if (prev?.kind === "ride") ids.push(prev.toStopId);

  const next = trip.steps[stepIndex + 1];
  if (next?.kind === "ride") ids.push(next.fromStopId);

  return [...new Set(ids)];
}
