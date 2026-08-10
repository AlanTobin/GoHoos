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

/** Show only the given stop ids (e.g. board→alight for the active trip step). */
export function updateStopsLayerByIds(
  map: mapboxgl.Map,
  stopIds: ReadonlySet<string> | string[]
) {
  const source = map.getSource("stops") as mapboxgl.GeoJSONSource | undefined;
  if (!source) return;

  const allowed = stopIds instanceof Set ? stopIds : new Set(stopIds);
  const filtered = allStops.filter((stop) => allowed.has(stop.stop_id));
  source.setData(stopsToGeoJSON(filtered));
}

export function addStopClickHandler(
  map: mapboxgl.Map,
  onStopClick?: (stopId: string) => void
) {
  map.on("click", "stops", (event) => {
    const stopId = event.features?.[0]?.properties?.id;
    if (stopId && onStopClick) {
      onStopClick(String(stopId));
    }
  });

  map.on("mouseenter", "stops", () => {
    map.getCanvas().style.cursor = "pointer";
  });

  map.on("mouseleave", "stops", () => {
    map.getCanvas().style.cursor = "";
  });
}

export function updateStopHighlights(
  map: mapboxgl.Map,
  originStopId: string | null,
  destinationStopId: string | null
) {
  if (!map.getLayer("stops")) return;

  const origin = originStopId ?? "";
  const destination = destinationStopId ?? "";

  map.setPaintProperty("stops", "circle-color", [
    "case",
    ["==", ["get", "id"], origin],
    "#3B82F6",
    ["==", ["get", "id"], destination],
    "#E57200",
    "#FFFFFF",
  ]);

  map.setPaintProperty("stops", "circle-stroke-color", [
    "case",
    ["==", ["get", "id"], origin],
    "#1D4ED8",
    ["==", ["get", "id"], destination],
    "#C45A00",
    "#000000",
  ]);

  map.setPaintProperty("stops", "circle-radius", [
    "case",
    ["any", ["==", ["get", "id"], origin], ["==", ["get", "id"], destination]],
    7,
    5,
  ]);
}
