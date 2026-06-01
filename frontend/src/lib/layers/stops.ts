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
        "circle-radius": 6,
        "circle-color": "#DC2626",
        "circle-stroke-width": 1,
        "circle-stroke-color": "#FFFFFF",
      }
  });
}