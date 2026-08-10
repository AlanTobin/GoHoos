import stopsData from "@/data/json/stops.json";
import routeStopsData from "@/data/json/route-stops.json";
import routesData from "@/data/json/routes.json";
import type { Stop } from "@/types/stop";
import type { PickedLocation, TripOption } from "@/types/planner";
import {
  planTripsWithData,
  type PlannerData,
  type PlannerStop,
} from "@/lib/tripPlanner";

type RouteRow = {
  route_id: string;
  route_long_name: string | null;
  route_short_name: string | null;
};

const stops = stopsData as Stop[];
const routeStops = routeStopsData as Record<string, string[]>;
const routes = routesData as RouteRow[];

const plannerStops: PlannerStop[] = stops.map((s) => ({
  stopId: s.stop_id,
  stopName: s.stop_name,
  lat: s.stop_lat,
  lon: s.stop_lon,
  routeIds: s.routeIds,
}));

const routeNames: Record<string, string> = Object.fromEntries(
  routes.map((r) => [
    r.route_id,
    r.route_long_name || r.route_short_name || r.route_id,
  ])
);

const plannerData: PlannerData = {
  stops: plannerStops,
  routeStops,
  routeNames,
};

export function planTrips(input: {
  origin: PickedLocation;
  destination: PickedLocation;
  activeRouteIds: Set<string>;
}): TripOption[] {
  return planTripsWithData(input, plannerData);
}
