import stopsData from "@/data/json/stops.json";
import routesData from "@/data/json/routes.json";
import { normalizeRouteColor } from "@/lib/routes";
import type { Feature, FeatureCollection, LineString } from "geojson";
import type { PickedLocation, TripOption, TripStep } from "@/types/planner";
import type { Route } from "@/types/route";
import type { Stop } from "@/types/stop";

const WALK_PATH_COLOR = "#232D4B";

const stopById = new Map(
  (stopsData as Stop[]).map((s) => [
    s.stop_id,
    { lat: s.stop_lat, lon: s.stop_lon },
  ])
);

const routeColorById = new Map(
  (routesData as Route[]).map((r) => [
    r.route_id,
    normalizeRouteColor(r.route_color),
  ])
);

function lngLat(stopId: string): [number, number] | null {
  const stop = stopById.get(stopId);
  if (!stop) return null;
  return [stop.lon, stop.lat];
}

function lineFeature(
  coordinates: [number, number][],
  properties: Record<string, string | number>
): Feature<LineString> | null {
  if (coordinates.length < 2) return null;
  return {
    type: "Feature",
    properties,
    geometry: {
      type: "LineString",
      coordinates,
    },
  };
}

export function getRouteColor(routeId: string): string {
  return routeColorById.get(routeId) ?? "#232D4B";
}

export function tripRouteIds(trip: TripOption): Set<string> {
  return new Set(
    trip.steps
      .filter((s): s is Extract<TripStep, { kind: "ride" }> => s.kind === "ride")
      .map((s) => s.routeId)
  );
}

/**
 * Walk legs only — ride geometry uses the full GTFS shape layer, with
 * Get on / Get off markers at board and alight.
 */
export function buildTripPathGeoJSON(
  trip: TripOption,
  origin: PickedLocation,
  destination: PickedLocation
): FeatureCollection<LineString> {
  const features: Feature<LineString>[] = [];
  let cursor: [number, number] = [origin.point.lon, origin.point.lat];

  for (let index = 0; index < trip.steps.length; index += 1) {
    const step = trip.steps[index];

    if (step.kind === "walk") {
      const end: [number, number] = step.toStopId
        ? (lngLat(step.toStopId) ?? cursor)
        : [destination.point.lon, destination.point.lat];
      const feature = lineFeature([cursor, end], {
        kind: "walk",
        stepIndex: index,
        color: WALK_PATH_COLOR,
      });
      if (feature) features.push(feature);
      cursor = end;
      continue;
    }

    const end = lngLat(step.toStopId);
    if (end) cursor = end;
  }

  return { type: "FeatureCollection", features };
}
