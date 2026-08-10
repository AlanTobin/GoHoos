# Dijkstra Trip Planner — Design

**Date:** 2026-08-10  
**Status:** Approved for implementation planning  
**Depends on:** Homepage picker UI (Phase 1, shipped)  
**Prior plan:** Cursor plan `homepage_trip_planner_5f6c9ced` (Approach B), clarified to use Dijkstra rather than enumerated scoring

## Goal

Given a geolocation origin and a map-picked destination on the homepage planner, compute the best UTS trip(s) client-side: walk + bus (+ optional one transfer), ranked by total distance in meters. Show reconstructed step-by-step itineraries in the results panel.

## Non-goals (this pass)

- Real-time ETA / wait time / schedule adherence (backend later)
- More than one transfer (max 2 bus legs)
- Turn-by-turn walking directions off the stop graph
- `stop-groups.json` / top-3 group snap (keep current nearest-stop snap; add groups in a follow-up)

## Confirmed decisions

| Decision | Choice |
|----------|--------|
| Where it runs | Client-side only (`frontend/src/lib/tripPlanner.ts`) |
| Algorithm | Dijkstra with min-heap |
| Cost | Total meters (walk + bus); lower is better |
| Routes in graph | Active routes only (live vehicle `RouteID`s), same as planner map |
| Transfers | Max 1 (at most 2 bus legs) |
| Bus loops | Cyclic forward distance (wrap when board index > alight index / next-stop wraps) |
| Transfer geometry | Walk edges between stops ≤ 300m; shared stops are 0m (get off + board) |
| Access walk | Haversine from origin/destination GPS to board/alight stops; existing `MAX_WALK_TO_STOP_METERS` for seeding candidates |
| Snap (v1) | Current nearest single stop (already in `HomePlanner`) |
| Alternatives | Return best path; optionally a few distinct finished trips after the first |

## Graph model

### Nodes

Logical search nodes are **states**, not bare stops:

```ts
type SearchState = {
  stopId: string;
  routeId: string | null; // null = walking; set = riding that route
  busLegsUsed: number;    // 0..2
};
```

State key for visited / best-cost:

```text
`${stopId}|${routeId ?? "-"}|${busLegsUsed}`
```

Bare `(stopId, busLegsUsed)` is insufficient: walking vs riding the same stop with the same leg count are different futures (continue on route vs board anew and increment legs).

### Edges (precomputed + on expand)

| Edge | From | To | Weight |
|------|------|-----|--------|
| Access walk (seed/goal) | Origin/dest GPS | Nearby stop | Haversine meters |
| Walk transfer | Walking @ A | Walking @ B | Haversine if ≤ 300m |
| Board | Walking @ S | Riding route R @ S | 0m; `busLegsUsed += 1` (reject if would exceed 2) |
| Ride next | Riding R @ S | Riding R @ next(S) | Segment meters (cyclic next on route stop list) |
| Alight | Riding R @ S | Walking @ S | 0m; legs unchanged |

Walk graph (~230 stops, edges ≤ 300m) is built once at module load. Bus next-stop edges are filtered to `activeRouteIds` at plan time (or rebuilt when the active set changes).

### Cyclic next stop

For route stop list of length `n`, index `i` → `(i + 1) % n` with segment distance haversine(stop[i], stop[next]). Riding around a loop is modeled by successive next-stop edges; short wrap-around trips beat long arcs via total meters.

## Dijkstra search

### Heap

Min-heap of `{ cost, state, parent }`. Always pop the cheapest unfinished partial trip.

### Seed

For each candidate board stop near origin (within walk radius / current snap set):

- Push `walking @ stop`, `busLegsUsed = 0`, `cost = walk(origin → stop)`.

### Expand

On pop, if state already settled with ≤ cost → skip. Else mark settled and push neighbors per edge rules above.

### Goal

A path is finished only from a **walking** state with `busLegsUsed >= 1` (must have ridden at least once — pure walk-only trips are not recommendations), when final walk from that stop to the destination pin is within the access walk budget (or unbounded for the snapped dest stop used in v1). Add that final walk to `cost`, then treat the entry as a completed trip. First settled finished destination arrival is optimal by meters.

### Path reconstruction

Each heap entry stores `parent` (previous entry + edge label: walk | board R | ride R | alight). Walk parent chain from the winning end state and reverse to produce user-facing steps:

1. Walk X m to board stop  
2. Take route R to stop Y  
3. Walk / transfer (0–300m) if needed  
4. Take route S …  
5. Walk Z m to destination  

### Alternatives (optional in same pass)

After the first finished destination, continue popping to collect additional finished trips that differ in route sequence / transfer stop, up to a small K (e.g. 3–5). Do not reopen settled states.

## Public API

```ts
planTrips(input: {
  origin: PickedLocation;      // GPS point + snapped stop metadata
  destination: PickedLocation;
  activeRouteIds: Set<string>;
}): TripOption[];

type TripOption = {
  totalMeters: number;
  steps: TripStep[]; // walk | ride segments with stops, route ids, meters
};
```

Pure functions; no React. Unit-testable without the map.

## UI wiring

| Piece | Behavior |
|-------|----------|
| `HomePlanner` | When `origin` and `destination` are set, call `planTrips`; hold `TripOption[]` in state; recompute when destination or active routes change |
| `TripResultsBar` | Replace “coming soon” with ranked options / step list; keep “Change destination” |
| `PlannerMap` | Later: highlight chosen itinerary stops/routes (not required to ship the engine) |

Mock geolocation (`USE_MOCK_USER_LOCATION`) remains a local testing switch and is unrelated to the algorithm.

## Error / empty states

- No active routes → empty list + clear copy  
- No path within transfer cap → empty list + “No route found with at most one transfer”  
- Origin/destination missing → do not run search  

## Testing

Unit tests in `frontend/src/lib/tripPlanner.test.ts` (or project’s existing test runner layout):

1. Cyclic short wrap beats long arc on a loop route  
2. Shared-stop transfer (0m) between two routes  
3. Walk transfer ≤300m enables a 1-transfer path  
4. State key: cheaper walking arrival must not erase a needed riding continuation  
5. Max 2 bus legs enforced  
6. Parent reconstruction matches expected step sequence on a fixture graph  

## File changes

| File | Change |
|------|--------|
| `frontend/src/lib/tripPlanner.ts` | **New** — graph build, Dijkstra, reconstruct, `planTrips` |
| `frontend/src/lib/tripPlanner.test.ts` | **New** — unit tests |
| `frontend/src/types/planner.ts` | Add `TripOption` / `TripStep` types |
| `frontend/src/lib/geo.ts` | Reuse haversine / walk helpers; add cyclic segment helper if not present |
| `frontend/src/components/home/HomePlanner.tsx` | Call planner when origin+dest set |
| `frontend/src/components/home/TripPlannerPanel.tsx` | Render results |

## Out of scope follow-ups

1. `stop-groups.json` from GTFS convert script; top-3 group expansion for seed/goal  
2. Map polyline / step highlighting for selected trip  
3. ETA / live vehicle timing once backend exists
