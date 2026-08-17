import { snapToStop, type LatLng } from "@/lib/geo";
import { planTrips } from "@/lib/planTrips";
import type { PickedLocation } from "@/types/planner";

export type PopularDestination = {
  id: string;
  label: string;
  point: LatLng;
};

export type PopularDestinationOption = {
  id: string;
  label: string;
  /** Best trip minutes, or null if unknown / unreachable. */
  minutes: number | null;
  picked: PickedLocation | null;
};

/** Hardcoded campus shortcuts for the destination pick sheet. */
export const POPULAR_DESTINATIONS: PopularDestination[] = [
  {
    id: "shannon-library",
    label: "Shannon Library",
    point: { lat: 38.03645, lon: -78.50575 },
  },
  {
    id: "o-hill",
    label: "O-Hill",
    point: { lat: 38.0342, lon: -78.5145 },
  },
  {
    id: "gooch-dillard",
    label: "Gooch/Dillard",
    point: { lat: 38.0291, lon: -78.5164 },
  },
];

function toPickedLocation(
  point: LatLng,
  snap: NonNullable<ReturnType<typeof snapToStop>>
): PickedLocation {
  return {
    point,
    stopId: snap.stop.stop_id,
    stopName: snap.stop.stop_name,
    walkMeters: snap.walkMeters,
  };
}

export function buildPopularDestinationOptions(
  origin: PickedLocation | null,
  activeRouteIds: Set<string>,
  routeIdsForSnap: Set<string>
): PopularDestinationOption[] {
  return POPULAR_DESTINATIONS.map((dest) => {
    const snap = snapToStop(dest.point, routeIdsForSnap, Infinity);
    if (!snap) {
      return {
        id: dest.id,
        label: dest.label,
        minutes: null,
        picked: null,
      };
    }

    const picked = toPickedLocation(dest.point, snap);
    if (!origin) {
      return {
        id: dest.id,
        label: dest.label,
        minutes: null,
        picked,
      };
    }

    const trips = planTrips({
      origin,
      destination: picked,
      activeRouteIds,
    });
    const best = trips[0];

    return {
      id: dest.id,
      label: dest.label,
      minutes: best ? Math.round(best.totalMinutes) : null,
      picked,
    };
  });
}
