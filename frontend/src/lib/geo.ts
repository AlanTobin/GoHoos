import stopsData from "@/data/json/stops.json";
import type { Stop } from "@/types/stop";
import type { Feature, Polygon } from "geojson";

export type LatLng = { lat: number; lon: number };

export const MAX_WALK_TO_STOP_METERS = 350;
export const WALK_SPEED_MPS = 1.34; // ~3 mph

const allStops = stopsData as Stop[];
const EARTH_RADIUS_M = 6_371_000;

export function distanceMeters(a: LatLng, b: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function stopDisplayName(name: string): string {
  return name.replace(/\s*\((North|South|East|West)bound\)\s*/i, "").trim();
}

export function walkMinutes(meters: number): number {
  return Math.max(1, Math.round(meters / WALK_SPEED_MPS / 60));
}

export function formatWalkDistance(meters: number): string {
  const mins = walkMinutes(meters);
  if (meters < 1000) {
    return `${Math.round(meters)} m (~${mins} min walk)`;
  }
  return `${(meters / 1609.34).toFixed(1)} mi (~${mins} min walk)`;
}

export function formatWalkRangeLabel(): string {
  const mins = walkMinutes(MAX_WALK_TO_STOP_METERS);
  return `~${mins} min walk`;
}

export function getRoutableStops(activeRouteIds: Set<string>): Stop[] {
  const withRoutes = allStops.filter((stop) => stop.routeIds.length > 0);

  if (activeRouteIds.size === 0) {
    return withRoutes;
  }

  return withRoutes.filter((stop) =>
    stop.routeIds.some((routeId) => activeRouteIds.has(routeId))
  );
}

export type NearestStopResult = {
  stop: Stop;
  walkMeters: number;
};

export function findNearestStop(
  point: LatLng,
  candidates: Stop[],
  maxWalkMeters = MAX_WALK_TO_STOP_METERS
): NearestStopResult | null {
  let best: NearestStopResult | null = null;

  for (const stop of candidates) {
    const walkMeters = distanceMeters(point, {
      lat: stop.stop_lat,
      lon: stop.stop_lon,
    });
    if (walkMeters > maxWalkMeters) continue;
    if (!best || walkMeters < best.walkMeters) {
      best = { stop, walkMeters };
    }
  }

  return best;
}

export function circlePolygon(
  center: LatLng,
  radiusMeters: number,
  steps = 64
): Feature<Polygon> {
  const coordinates: [number, number][] = [];

  for (let i = 0; i <= steps; i += 1) {
    const bearing = (i / steps) * 360;
    coordinates.push(destinationPoint(center, radiusMeters, bearing));
  }

  return {
    type: "Feature",
    geometry: {
      type: "Polygon",
      coordinates: [coordinates],
    },
    properties: {},
  };
}

function destinationPoint(
  origin: LatLng,
  distanceM: number,
  bearingDeg: number
): [number, number] {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;

  const lat1 = toRad(origin.lat);
  const lon1 = toRad(origin.lon);
  const bearing = toRad(bearingDeg);
  const angularDistance = distanceM / EARTH_RADIUS_M;

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(angularDistance) +
      Math.cos(lat1) * Math.sin(angularDistance) * Math.cos(bearing)
  );
  const lon2 =
    lon1 +
    Math.atan2(
      Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(lat1),
      Math.cos(angularDistance) - Math.sin(lat1) * Math.sin(lat2)
    );

  return [toDeg(lon2), toDeg(lat2)];
}

export function snapToStop(
  point: LatLng,
  activeRouteIds: Set<string>,
  maxWalkMeters = MAX_WALK_TO_STOP_METERS
): NearestStopResult | null {
  const candidates = getRoutableStops(activeRouteIds);
  return findNearestStop(point, candidates, maxWalkMeters);
}
