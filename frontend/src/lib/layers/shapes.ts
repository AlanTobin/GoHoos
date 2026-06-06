import mapboxgl from "mapbox-gl";
import shapes from "@/data/json/shapes.json";
import { shapesToGeoJSON } from "../geoJSON";
import { ShapePoint } from "@/types/shapes";
import routes from "@/data/json/routes.json";

export function addShapesLayer(map: mapboxgl.Map) {
  const routesMap = new Map<string, string>(routes.map(route => [route.route_id, route.route_color]));
  const geojson = shapesToGeoJSON(shapes as ShapePoint[], routesMap);
  console.log(geojson.features[0].properties);
  map.addSource("shapes", {
    type: "geojson",
    data: geojson,
  });

  map.addLayer({
    id: "shapes",
    type: "line",
    source: "shapes",
    paint: {
        "line-width": 4,
        "line-opacity": 1,
        "line-color": ["get", "routeColor"]
      }
  });
}