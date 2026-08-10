import stopsData from "@/data/json/stops.json";
import type { LatLng } from "@/lib/geo";
import type { TripOption, TripRideStep } from "@/types/planner";
import type { Stop } from "@/types/stop";

const stopById = new Map(
  (stopsData as Stop[]).map((s) => [
    s.stop_id,
    { lat: s.stop_lat, lon: s.stop_lon },
  ])
);

export type BoardAlightMarkers = {
  board: LatLng;
  alight: LatLng;
  boardStopId: string;
  alightStopId: string;
  routeId: string;
};

/** Get on / Get off markers only while focusing a ride step. */
export function boardAlightForTripStep(
  trip: TripOption,
  stepIndex: number
): BoardAlightMarkers | null {
  const step = trip.steps[stepIndex];
  if (step?.kind !== "ride") return null;
  const ride: TripRideStep = step;

  const board = stopById.get(ride.fromStopId);
  const alight = stopById.get(ride.toStopId);
  if (!board || !alight) return null;

  return {
    board: { lat: board.lat, lon: board.lon },
    alight: { lat: alight.lat, lon: alight.lon },
    boardStopId: ride.fromStopId,
    alightStopId: ride.toStopId,
    routeId: ride.routeId,
  };
}
