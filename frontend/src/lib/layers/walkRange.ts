import mapboxgl from "mapbox-gl";
import type { FeatureCollection, Polygon } from "geojson";
import {
  circlePolygon,
  MAX_WALK_TO_STOP_METERS,
  type LatLng,
} from "@/lib/geo";

const EMPTY: FeatureCollection<Polygon> = {
  type: "FeatureCollection",
  features: [],
};

export function addWalkRangeLayer(map: mapboxgl.Map) {
  map.addSource("walk-range", {
    type: "geojson",
    data: EMPTY,
  });

  map.addLayer(
    {
      id: "walk-range-fill",
      type: "fill",
      source: "walk-range",
      paint: {
        "fill-color": "#3B82F6",
        "fill-opacity": 0.12,
      },
    },
    "stops"
  );

  map.addLayer(
    {
      id: "walk-range-outline",
      type: "line",
      source: "walk-range",
      paint: {
        "line-color": "#3B82F6",
        "line-opacity": 0.35,
        "line-width": 2,
      },
    },
    "stops"
  );
}

export function updateWalkRangeLayer(map: mapboxgl.Map, center: LatLng | null) {
  const source = map.getSource("walk-range") as mapboxgl.GeoJSONSource | undefined;
  if (!source) return;

  if (!center) {
    source.setData(EMPTY);
    return;
  }

  source.setData({
    type: "FeatureCollection",
    features: [circlePolygon(center, MAX_WALK_TO_STOP_METERS)],
  });
}
