/**
 * Slice a GTFS shape LineString between board and alight using the route's
 * ordered stop list. Searches forward-only between consecutive stops so loop
 * routes don't wrap the long way and light up the entire line.
 */

export function rideStopSequence(
  routeStops: string[],
  fromStopId: string,
  toStopId: string
): string[] {
  if (routeStops.length === 0) return [fromStopId, toStopId];

  const start = routeStops.indexOf(fromStopId);
  const end = routeStops.indexOf(toStopId);
  if (start < 0 || end < 0) return [fromStopId, toStopId];

  const path: string[] = [routeStops[start]];
  let i = start;
  let guard = 0;
  while (i !== end && guard < routeStops.length + 1) {
    i = (i + 1) % routeStops.length;
    path.push(routeStops[i]);
    guard += 1;
  }
  return path;
}

function nearestCoordIndex(
  coords: [number, number][],
  point: [number, number]
): number {
  let bestIndex = 0;
  let bestDist = Number.POSITIVE_INFINITY;
  for (let i = 0; i < coords.length; i += 1) {
    const dx = coords[i][0] - point[0];
    const dy = coords[i][1] - point[1];
    const dist = dx * dx + dy * dy;
    if (dist < bestDist) {
      bestDist = dist;
      bestIndex = i;
    }
  }
  return bestIndex;
}

/** Nearest vertex to `point` in the forward window starting at `fromIndex`. */
export function nearestIndexForward(
  coords: [number, number][],
  point: [number, number],
  fromIndex: number,
  maxAhead: number
): number {
  const n = coords.length;
  if (n === 0) return 0;
  const limit = Math.max(0, Math.min(maxAhead, n - 1));
  let bestIndex = fromIndex % n;
  let bestDist = Number.POSITIVE_INFINITY;

  for (let k = 0; k <= limit; k += 1) {
    const i = (fromIndex + k) % n;
    const dx = coords[i][0] - point[0];
    const dy = coords[i][1] - point[1];
    const dist = dx * dx + dy * dy;
    if (dist < bestDist) {
      bestDist = dist;
      bestIndex = i;
    }
  }
  return bestIndex;
}

function appendForward(
  out: [number, number][],
  coords: [number, number][],
  fromIndex: number,
  toIndex: number
): void {
  const n = coords.length;
  if (n === 0 || fromIndex === toIndex) return;
  let i = fromIndex;
  let guard = 0;
  while (i !== toIndex && guard < n + 1) {
    i = (i + 1) % n;
    out.push(coords[i]);
    guard += 1;
  }
}

export function sliceRouteShapeBetweenStops(input: {
  shape: [number, number][];
  routeStops: string[];
  stopPoints: Map<string, [number, number]>;
  fromStopId: string;
  toStopId: string;
}): [number, number][] | null {
  const { shape, routeStops, stopPoints, fromStopId, toStopId } = input;
  if (shape.length < 2) return null;

  const stopIds = rideStopSequence(routeStops, fromStopId, toStopId);
  const firstPoint = stopPoints.get(stopIds[0]);
  if (!firstPoint) return null;

  // Cap how far we may travel along the shape between two consecutive stops.
  // Prevents picking the opposite pass of a figure-8 / loop.
  const maxAhead = Math.max(48, Math.floor(shape.length * 0.18));

  let currentIdx = nearestCoordIndex(shape, firstPoint);
  const path: [number, number][] = [shape[currentIdx]];

  for (let s = 1; s < stopIds.length; s += 1) {
    const point = stopPoints.get(stopIds[s]);
    if (!point) continue;
    const nextIdx = nearestIndexForward(shape, point, currentIdx, maxAhead);
    appendForward(path, shape, currentIdx, nextIdx);
    currentIdx = nextIdx;
  }

  return path.length >= 2 ? path : null;
}
