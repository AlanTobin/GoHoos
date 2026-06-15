import mapboxgl from "mapbox-gl";
import stops from "@/data/json/stops.json";
import routeStops from "@/data/json/route-stops.json";
import routeStopOverrides from "@/data/json/route-stop-overrides.json";
import { stopsToGeoJSON } from "../geoJSON";
import { Stop } from "@/types/stop";

const allStops = stops as Stop[];
const routeStopIds = routeStops as Record<string, string[]>;
const overrideRouteStops = routeStopOverrides as Record<string, string[]>;

function stopIdsForRoute(routeId: string): string[] {
  return overrideRouteStops[routeId] ?? routeStopIds[routeId] ?? [];
}

function routeHasMappedStops(routeId: string): boolean {
  return stopIdsForRoute(routeId).length > 0;
}

export function getStopsForSelection(selectedRoutes: Set<string>): Stop[] {
  if (selectedRoutes.size === 0) {
    return [];
  }

  const mappedRoutes = [...selectedRoutes].filter(routeHasMappedStops);

  if (mappedRoutes.length === 0) {
    return allStops;
  }

  const stopIds = new Set(
    mappedRoutes.flatMap((routeId) => stopIdsForRoute(routeId))
  );

  return allStops.filter((stop) => stopIds.has(stop.stop_id));
}

export function addStopsLayer(map: mapboxgl.Map) {
  map.addSource("stops", {
    type: "geojson",
    data: stopsToGeoJSON([]),
  });

  map.addLayer({
    id: "stops",
    type: "circle",
    source: "stops",
    paint: {
      "circle-radius": 5,
      "circle-color": "#FFFFFF",
      "circle-stroke-width": 2.5,
      "circle-stroke-opacity": 1,
      "circle-stroke-color": "#000000",
    },
  });
}

export function updateStopsLayer(map: mapboxgl.Map, selectedRoutes: Set<string>) {
  const source = map.getSource("stops") as mapboxgl.GeoJSONSource | undefined;
  if (!source) return;

  source.setData(stopsToGeoJSON(getStopsForSelection(selectedRoutes)));
}

export function addStopClickHandler(map: mapboxgl.Map) {
  map.on("click", "stops", (event) => {
    const stopId = event.features?.[0]?.properties?.id;
    if (stopId) {
      console.log(stopId);
    }
  });

  map.on("mouseenter", "stops", () => {
    map.getCanvas().style.cursor = "pointer";
  });

  map.on("mouseleave", "stops", () => {
    map.getCanvas().style.cursor = "";
  });
}
