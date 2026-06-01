import mapboxgl from "mapbox-gl";
import shapes from "@/data/json/shapes.json";
import { shapesToGeoJSON } from "../geoJSON";
import { ShapePoint } from "@/types/shapes";

export function addShapesLayer(map: mapboxgl.Map) {
  const geojson = shapesToGeoJSON(shapes as ShapePoint[]);

  map.addSource("shapes", {
    type: "geojson",
    data: geojson,
  });

  map.addLayer({
    id: "shapes",
    type: "line",
    source: "shapes",
    paint: {
        "line-width": 2,
        "line-color": "#374151"
      }
  });
}