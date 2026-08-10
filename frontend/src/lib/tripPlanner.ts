import type {
  PickedLocation,
  TripOption,
  TripRideStep,
  TripStep,
  TripWalkStep,
} from "../types/planner";

export const MAX_WALK_TRANSFER_METERS = 300;
export const MAX_BUS_LEGS = 2;
export const MAX_ACCESS_WALK_METERS = 350;
/** ~3 mph — matches geo.ts */
export const WALK_SPEED_MPS = 1.34;
/** ~13 mph average with stops — placeholder until live ETA */
export const BUS_SPEED_MPS = 6.0;
/** Flat wait when boarding a second bus — replace with predicted arrival later */
export const TRANSFER_WAIT_MINUTES = 4;
export const MAX_DIRECT_WALK_METERS = 2000;
/** Omit access/transfer/egress walk steps shorter than this (already at the stop). */
export const MIN_DISPLAY_WALK_METERS = 15;

const EARTH_RADIUS_M = 6_371_000;

export type PlannerStop = {
  stopId: string;
  stopName: string;
  lat: number;
  lon: number;
  routeIds: string[];
};

export type PlannerData = {
  stops: PlannerStop[];
  routeStops: Record<string, string[]>;
  routeNames: Record<string, string>;
};

type LatLng = { lat: number; lon: number };
type EdgeKind = "walk" | "board" | "ride" | "alight" | "egress";

type SearchNode = {
  stopId: string;
  routeId: string | null;
  busLegsUsed: number;
  lastRouteId: string | null;
  /** Ordering cost in minutes (includes transfer wait). */
  costMinutes: number;
  rawMeters: number;
  parent: SearchNode | null;
  edgeKind: EdgeKind | null;
  edgeMeters: number;
  edgeMinutes: number;
  edgeRouteId: string | null;
  isFinish: boolean;
};

function distanceMeters(a: LatLng, b: LatLng): number {
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

export function walkMinutesFromMeters(meters: number): number {
  return meters / WALK_SPEED_MPS / 60;
}

export function busMinutesFromMeters(meters: number): number {
  return meters / BUS_SPEED_MPS / 60;
}

function stateKey(node: SearchNode): string {
  if (node.routeId === null) {
    return `W|${node.stopId}|${node.busLegsUsed}|${node.lastRouteId ?? "-"}`;
  }
  const phase = node.edgeKind === "board" ? "B" : "R";
  return `R|${node.stopId}|${node.routeId}|${node.busLegsUsed}|${phase}`;
}

function routeIdsAtStop(
  stop: PlannerStop,
  activeRouteIds: Set<string>
): string[] {
  return stop.routeIds.filter((id) => activeRouteIds.has(id));
}

function canBoardRoute(
  routeId: string,
  lastRouteId: string | null,
  busLegsUsed: number
): boolean {
  if (busLegsUsed >= MAX_BUS_LEGS) return false;
  if (lastRouteId && routeId === lastRouteId) return false;
  return true;
}

function isTransferWalkTarget(
  neighbor: PlannerStop,
  activeRouteIds: Set<string>,
  lastRouteId: string | null,
  busLegsUsed: number
): boolean {
  return routeIdsAtStop(neighbor, activeRouteIds).some((routeId) =>
    canBoardRoute(routeId, lastRouteId, busLegsUsed)
  );
}

class MinHeap {
  private items: SearchNode[] = [];

  get size(): number {
    return this.items.length;
  }

  push(node: SearchNode): void {
    this.items.push(node);
    this.bubbleUp(this.items.length - 1);
  }

  pop(): SearchNode | undefined {
    if (this.items.length === 0) return undefined;
    const top = this.items[0];
    const last = this.items.pop();
    if (this.items.length > 0 && last) {
      this.items[0] = last;
      this.bubbleDown(0);
    }
    return top;
  }

  private bubbleUp(index: number): void {
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (this.items[parent].costMinutes <= this.items[index].costMinutes) break;
      [this.items[parent], this.items[index]] = [
        this.items[index],
        this.items[parent],
      ];
      index = parent;
    }
  }

  private bubbleDown(index: number): void {
    const n = this.items.length;
    while (true) {
      let smallest = index;
      const left = 2 * index + 1;
      const right = 2 * index + 2;
      if (
        left < n &&
        this.items[left].costMinutes < this.items[smallest].costMinutes
      ) {
        smallest = left;
      }
      if (
        right < n &&
        this.items[right].costMinutes < this.items[smallest].costMinutes
      ) {
        smallest = right;
      }
      if (smallest === index) break;
      [this.items[smallest], this.items[index]] = [
        this.items[index],
        this.items[smallest],
      ];
      index = smallest;
    }
  }
}

function buildWalkGraph(
  stops: PlannerStop[]
): Map<string, { toStopId: string; meters: number }[]> {
  const graph = new Map<string, { toStopId: string; meters: number }[]>();
  for (const stop of stops) graph.set(stop.stopId, []);

  for (let i = 0; i < stops.length; i += 1) {
    for (let j = i + 1; j < stops.length; j += 1) {
      const a = stops[i];
      const b = stops[j];
      const meters = distanceMeters(
        { lat: a.lat, lon: a.lon },
        { lat: b.lat, lon: b.lon }
      );
      if (meters > MAX_WALK_TRANSFER_METERS) continue;
      graph.get(a.stopId)!.push({ toStopId: b.stopId, meters });
      graph.get(b.stopId)!.push({ toStopId: a.stopId, meters });
    }
  }
  return graph;
}

function buildBusNext(
  routeStops: Record<string, string[]>,
  stopById: Map<string, PlannerStop>,
  activeRouteIds: Set<string>
): Map<string, { toStopId: string; meters: number; routeId: string }[]> {
  const graph = new Map<
    string,
    { toStopId: string; meters: number; routeId: string }[]
  >();

  for (const routeId of activeRouteIds) {
    const sequence = routeStops[routeId];
    if (!sequence || sequence.length < 2) continue;

    for (let i = 0; i < sequence.length; i += 1) {
      const fromId = sequence[i];
      const toId = sequence[(i + 1) % sequence.length];
      const from = stopById.get(fromId);
      const to = stopById.get(toId);
      if (!from || !to) continue;
      const meters = distanceMeters(
        { lat: from.lat, lon: from.lon },
        { lat: to.lat, lon: to.lon }
      );
      const list = graph.get(fromId) ?? [];
      list.push({ toStopId: toId, meters, routeId });
      graph.set(fromId, list);
    }
  }
  return graph;
}

function tripSignature(steps: TripStep[]): string {
  const rides = steps
    .filter((s): s is TripRideStep => s.kind === "ride")
    .map((s) => `${s.routeId}:${s.fromStopId}->${s.toStopId}`)
    .join("|");
  if (rides) return rides;
  return steps.length === 1 && steps[0].kind === "walk" ? "walk-only" : "other";
}

function reconstructTrip(
  end: SearchNode,
  stopById: Map<string, PlannerStop>,
  routeNames: Record<string, string>,
  origin: PickedLocation
): TripOption | null {
  const chain: SearchNode[] = [];
  let cur: SearchNode | null = end;
  while (cur) {
    chain.push(cur);
    cur = cur.parent;
  }
  chain.reverse();
  if (chain.length === 0) return null;

  const steps: TripStep[] = [];
  const first = chain[0];
  if (first.edgeMeters >= MIN_DISPLAY_WALK_METERS) {
    steps.push({
      kind: "walk",
      fromLabel: "Your location",
      toStopId: first.stopId,
      toStopName: stopById.get(first.stopId)?.stopName ?? origin.stopName,
      meters: first.edgeMeters,
      minutes: first.edgeMinutes,
    } satisfies TripWalkStep);
  }

  let i = 1;
  while (i < chain.length) {
    const node = chain[i];
    if (node.edgeKind === "board" || node.edgeKind === "alight") {
      i += 1;
      continue;
    }
    if (node.edgeKind === "walk") {
      const prev = chain[i - 1];
      if (node.edgeMeters >= MIN_DISPLAY_WALK_METERS) {
        steps.push({
          kind: "walk",
          fromLabel: stopById.get(prev.stopId)?.stopName ?? prev.stopId,
          toStopId: node.stopId,
          toStopName: stopById.get(node.stopId)?.stopName ?? node.stopId,
          meters: node.edgeMeters,
          minutes: node.edgeMinutes,
        });
      }
      i += 1;
      continue;
    }
    if (node.edgeKind === "ride" && node.edgeRouteId) {
      const routeId = node.edgeRouteId;
      const fromStopId = chain[i - 1].stopId;
      let meters = node.edgeMeters;
      let minutes = node.edgeMinutes;
      let toStopId = node.stopId;
      i += 1;
      while (
        i < chain.length &&
        chain[i].edgeKind === "ride" &&
        chain[i].edgeRouteId === routeId
      ) {
        meters += chain[i].edgeMeters;
        minutes += chain[i].edgeMinutes;
        toStopId = chain[i].stopId;
        i += 1;
      }
      steps.push({
        kind: "ride",
        routeId,
        routeName: routeNames[routeId] ?? routeId,
        fromStopId,
        fromStopName: stopById.get(fromStopId)?.stopName ?? fromStopId,
        toStopId,
        toStopName: stopById.get(toStopId)?.stopName ?? toStopId,
        meters,
        minutes,
      });
      continue;
    }
    if (node.edgeKind === "egress") {
      if (node.edgeMeters >= MIN_DISPLAY_WALK_METERS) {
        steps.push({
          kind: "walk",
          fromLabel: stopById.get(node.stopId)?.stopName ?? "Stop",
          toStopId: null,
          toStopName: "Destination",
          meters: node.edgeMeters,
          minutes: node.edgeMinutes,
        });
      }
      i += 1;
      continue;
    }
    i += 1;
  }

  return {
    totalMinutes: Math.max(1, Math.round(end.costMinutes)),
    totalMeters: Math.round(end.rawMeters),
    walkMeters: Math.round(sumWalkMeters(steps)),
    steps,
  };
}

function sumWalkMeters(steps: TripStep[]): number {
  return steps.reduce(
    (sum, step) => sum + (step.kind === "walk" ? step.meters : 0),
    0
  );
}

function directWalkTrip(
  origin: PickedLocation,
  destination: PickedLocation
): TripOption | null {
  const meters = distanceMeters(origin.point, destination.point);
  if (meters > MAX_DIRECT_WALK_METERS) return null;
  const minutes = walkMinutesFromMeters(meters);
  return {
    totalMinutes: Math.max(1, Math.round(minutes)),
    totalMeters: Math.round(meters),
    walkMeters: Math.round(meters),
    steps: [
      {
        kind: "walk",
        fromLabel: "Your location",
        toStopId: null,
        toStopName: "Destination",
        meters,
        minutes,
      },
    ],
  };
}

function rankTripsByTime(trips: TripOption[]): TripOption[] {
  return [...trips].sort((a, b) => {
    if (a.totalMinutes !== b.totalMinutes) {
      return a.totalMinutes - b.totalMinutes;
    }
    if (a.walkMeters !== b.walkMeters) {
      return a.walkMeters - b.walkMeters;
    }
    return a.steps.length - b.steps.length;
  });
}

/** Fastest options first, always reserving a slot for least walking when needed. */
export function selectTopTrips(
  trips: TripOption[],
  maxResults = 2
): TripOption[] {
  if (trips.length <= maxResults) return rankTripsByTime(trips);

  const byTime = rankTripsByTime(trips);
  const leastWalk = [...trips].sort((a, b) => {
    if (a.walkMeters !== b.walkMeters) return a.walkMeters - b.walkMeters;
    return a.totalMinutes - b.totalMinutes;
  })[0];

  const picked: TripOption[] = [];
  const seen = new Set<string>();

  const push = (trip: TripOption) => {
    const sig = tripSignature(trip.steps);
    if (seen.has(sig)) return;
    seen.add(sig);
    picked.push(trip);
  };

  const timeSlots = Math.max(1, maxResults - 1);
  for (const trip of byTime) {
    if (picked.length >= timeSlots) break;
    push(trip);
  }

  push(leastWalk);

  for (const trip of byTime) {
    if (picked.length >= maxResults) break;
    push(trip);
  }

  return rankTripsByTime(picked).slice(0, maxResults);
}

export function planTripsWithData(
  input: {
    origin: PickedLocation;
    destination: PickedLocation;
    activeRouteIds: Set<string>;
  },
  data: PlannerData,
  options?: { maxResults?: number }
): TripOption[] {
  const { origin, destination, activeRouteIds } = input;
  const maxResults = options?.maxResults ?? 2;
  const collectLimit = Math.max(maxResults * 4, 12);

  const results: TripOption[] = [];
  const seenSignatures = new Set<string>();

  const walkOnly = directWalkTrip(origin, destination);
  if (walkOnly) {
    seenSignatures.add(tripSignature(walkOnly.steps));
    results.push(walkOnly);
  }

  if (activeRouteIds.size === 0) {
    return selectTopTrips(results, maxResults);
  }

  const stopById = new Map(data.stops.map((s) => [s.stopId, s]));
  const walkGraph = buildWalkGraph(data.stops);
  const busNext = buildBusNext(data.routeStops, stopById, activeRouteIds);
  const heap = new MinHeap();
  const settled = new Set<string>();

  for (const stop of data.stops) {
    if (routeIdsAtStop(stop, activeRouteIds).length === 0) continue;
    const meters = distanceMeters(origin.point, {
      lat: stop.lat,
      lon: stop.lon,
    });
    if (meters <= MAX_ACCESS_WALK_METERS || stop.stopId === origin.stopId) {
      const minutes = walkMinutesFromMeters(meters);
      const seedTieBreak = stop.stopId === origin.stopId ? 0 : 0.01;
      heap.push({
        stopId: stop.stopId,
        routeId: null,
        busLegsUsed: 0,
        lastRouteId: null,
        costMinutes: minutes + seedTieBreak,
        rawMeters: meters,
        parent: null,
        edgeKind: null,
        edgeMeters: meters,
        edgeMinutes: minutes,
        edgeRouteId: null,
        isFinish: false,
      });
    }
  }

  while (heap.size > 0 && results.length < collectLimit) {
    const node = heap.pop();
    if (!node) break;

    if (node.isFinish) {
      const trip = reconstructTrip(node, stopById, data.routeNames, origin);
      if (trip && trip.steps.some((s) => s.kind === "ride")) {
        const sig = tripSignature(trip.steps);
        if (!seenSignatures.has(sig)) {
          seenSignatures.add(sig);
          results.push(trip);
        }
      }
      continue;
    }

    const key = stateKey(node);
    if (settled.has(key)) continue;
    settled.add(key);

    const stop = stopById.get(node.stopId);
    if (!stop) continue;

    if (node.routeId === null && node.busLegsUsed >= 1) {
      const egress = distanceMeters(destination.point, {
        lat: stop.lat,
        lon: stop.lon,
      });
      if (
        egress <= MAX_ACCESS_WALK_METERS ||
        node.stopId === destination.stopId
      ) {
        const egressMinutes = walkMinutesFromMeters(egress);
        const egressTieBreak =
          node.stopId === destination.stopId ? 0 : 0.01;
        heap.push({
          stopId: node.stopId,
          routeId: null,
          busLegsUsed: node.busLegsUsed,
          lastRouteId: node.lastRouteId,
          costMinutes: node.costMinutes + egressMinutes + egressTieBreak,
          rawMeters: node.rawMeters + egress,
          parent: node,
          edgeKind: "egress",
          edgeMeters: egress,
          edgeMinutes: egressMinutes,
          edgeRouteId: null,
          isFinish: true,
        });
      }
    }

    if (node.routeId === null) {
      if (node.busLegsUsed >= 1 && node.busLegsUsed < MAX_BUS_LEGS) {
        for (const edge of walkGraph.get(node.stopId) ?? []) {
          const neighbor = stopById.get(edge.toStopId);
          if (!neighbor) continue;
          if (
            !isTransferWalkTarget(
              neighbor,
              activeRouteIds,
              node.lastRouteId,
              node.busLegsUsed
            )
          ) {
            continue;
          }
          const minutes = walkMinutesFromMeters(edge.meters);
          heap.push({
            stopId: edge.toStopId,
            routeId: null,
            busLegsUsed: node.busLegsUsed,
            lastRouteId: node.lastRouteId,
            costMinutes: node.costMinutes + minutes,
            rawMeters: node.rawMeters + edge.meters,
            parent: node,
            edgeKind: "walk",
            edgeMeters: edge.meters,
            edgeMinutes: minutes,
            edgeRouteId: null,
            isFinish: false,
          });
        }
      }

      for (const routeId of routeIdsAtStop(stop, activeRouteIds)) {
        if (!canBoardRoute(routeId, node.lastRouteId, node.busLegsUsed)) {
          continue;
        }
        const wait =
          node.busLegsUsed >= 1 ? TRANSFER_WAIT_MINUTES : 0;
        heap.push({
          stopId: node.stopId,
          routeId,
          busLegsUsed: node.busLegsUsed + 1,
          lastRouteId: node.lastRouteId,
          costMinutes: node.costMinutes + wait,
          rawMeters: node.rawMeters,
          parent: node,
          edgeKind: "board",
          edgeMeters: 0,
          edgeMinutes: wait,
          edgeRouteId: routeId,
          isFinish: false,
        });
      }
    } else {
      for (const edge of busNext.get(node.stopId) ?? []) {
        if (edge.routeId !== node.routeId) continue;
        const minutes = busMinutesFromMeters(edge.meters);
        heap.push({
          stopId: edge.toStopId,
          routeId: node.routeId,
          busLegsUsed: node.busLegsUsed,
          lastRouteId: node.lastRouteId,
          costMinutes: node.costMinutes + minutes,
          rawMeters: node.rawMeters + edge.meters,
          parent: node,
          edgeKind: "ride",
          edgeMeters: edge.meters,
          edgeMinutes: minutes,
          edgeRouteId: node.routeId,
          isFinish: false,
        });
      }

      if (node.edgeKind === "ride") {
        heap.push({
          stopId: node.stopId,
          routeId: null,
          busLegsUsed: node.busLegsUsed,
          lastRouteId: node.routeId,
          costMinutes: node.costMinutes,
          rawMeters: node.rawMeters,
          parent: node,
          edgeKind: "alight",
          edgeMeters: 0,
          edgeMinutes: 0,
          edgeRouteId: null,
          isFinish: false,
        });
      }
    }
  }

  return selectTopTrips(results, maxResults);
}
