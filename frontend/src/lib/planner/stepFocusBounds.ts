import stopsData from "@/data/json/stops.json";
import type { LatLng } from "@/lib/geo";
import type { PickedLocation, TripOption } from "@/types/planner";
import type { Stop } from "@/types/stop";
import type { FeatureCollection, LineString } from "geojson";

const stopById = new Map(
  (stopsData as Stop[]).map((s) => [
    s.stop_id,
    { lat: s.stop_lat, lon: s.stop_lon },
  ])
);

export type StepFocusTarget =
  | { mode: "bounds"; points: LatLng[] }
  | { mode: "center"; point: LatLng; zoom: number };

/** Points to fit/center when focusing a trip step. */
export function stepFocusTarget(
  trip: TripOption,
  stepIndex: number,
  origin: PickedLocation,
  destination: PickedLocation,
  tripPath: FeatureCollection<LineString> | null
): StepFocusTarget | null {
  const step = trip.steps[stepIndex];
  if (!step) return null;

  if (step.kind === "ride") {
    const board = stopById.get(step.fromStopId);
    const alight = stopById.get(step.toStopId);
    const points: LatLng[] = [];
    if (board) points.push({ lat: board.lat, lon: board.lon });
    if (alight) points.push({ lat: alight.lat, lon: alight.lon });
    return points.length > 0 ? { mode: "bounds", points } : null;
  }

  // Prefer the walk polyline from trip path when present.
  const pathFeature = tripPath?.features.find(
    (f) => f.properties?.stepIndex === stepIndex && f.properties?.kind === "walk"
  );
  if (pathFeature && pathFeature.geometry.coordinates.length >= 2) {
    return {
      mode: "bounds",
      points: pathFeature.geometry.coordinates.map(([lon, lat]) => ({
        lat,
        lon,
      })),
    };
  }

  if (step.toStopId) {
    const stop = stopById.get(step.toStopId);
    if (stop) {
      return {
        mode: "bounds",
        points: [origin.point, { lat: stop.lat, lon: stop.lon }],
      };
    }
  }

  // Egress walk to destination pin.
  const fromStop = trip.steps
    .slice(0, stepIndex)
    .reverse()
    .find((s) => s.kind === "ride");
  if (fromStop && fromStop.kind === "ride") {
    const alight = stopById.get(fromStop.toStopId);
    if (alight) {
      return {
        mode: "bounds",
        points: [
          { lat: alight.lat, lon: alight.lon },
          destination.point,
        ],
      };
    }
  }

  return { mode: "center", point: destination.point, zoom: 16 };
}
