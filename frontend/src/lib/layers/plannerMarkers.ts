import mapboxgl from "mapbox-gl";
import type { FeatureCollection, Point } from "geojson";
import type { LatLng } from "@/lib/geo";

const EMPTY: FeatureCollection<Point> = {
  type: "FeatureCollection",
  features: [],
};

export function addPlannerMarkersLayer(map: mapboxgl.Map) {
  map.addSource("planner-markers", {
    type: "geojson",
    data: EMPTY,
  });

  map.addLayer({
    id: "planner-markers-glow",
    type: "circle",
    source: "planner-markers",
    paint: {
      "circle-radius": 12,
      "circle-color": "#3B82F6",
      "circle-opacity": 0.2,
    },
  });

  map.addLayer({
    id: "planner-markers",
    type: "circle",
    source: "planner-markers",
    paint: {
      "circle-radius": 7,
      "circle-color": "#3B82F6",
      "circle-stroke-width": 2.5,
      "circle-stroke-color": "#ffffff",
    },
  });
}

export function updatePlannerMarkersLayer(map: mapboxgl.Map, origin: LatLng | null) {
  const source = map.getSource("planner-markers") as mapboxgl.GeoJSONSource | undefined;
  if (!source) return;

  if (!origin) {
    source.setData(EMPTY);
    return;
  }

  source.setData({
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [origin.lon, origin.lat],
        },
        properties: {},
      },
    ],
  });
}
