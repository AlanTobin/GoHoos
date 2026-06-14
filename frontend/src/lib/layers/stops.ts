import mapboxgl from "mapbox-gl";
import stops from "@/data/json/stops.json";
import { stopsToGeoJSON } from "../geoJSON";
import { Stop } from "@/types/stop";

export function addStopsLayer(map: mapboxgl.Map) {
  const geojson = stopsToGeoJSON(stops as Stop[]);

  map.addSource("stops", {
    type: "geojson",
    data: geojson,
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

export function stopRouteFilter(
  selectedRoutes: Set<string>
): mapboxgl.FilterSpecification {
  if (selectedRoutes.size === 0) {
    return ["==", ["get", "id"], ""];
  }

  return [
    "any",
    ...[...selectedRoutes].map(
      (routeId): mapboxgl.Expression => ["in", routeId, ["get", "routeIds"]]
    ),
  ];
}
