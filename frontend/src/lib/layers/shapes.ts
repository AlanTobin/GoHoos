import mapboxgl from "mapbox-gl";
import type { FeatureCollection, LineString } from "geojson";
import shapesGeoJSON from "@/data/json/shapes-lines.json";
import { isGoldYellow, mapYellowArrowColor } from "@/lib/routes";

const ROUTE_COLOR: mapboxgl.Expression = ["concat", "#", ["get", "routeColor"]];

const ARROW_LAYOUT: mapboxgl.SymbolLayerSpecification["layout"] = {
  "symbol-placement": "line",
  "symbol-spacing": [
    "interpolate",
    ["linear"],
    ["zoom"],
    11,
    140,
    13.5,
    70,
    16,
    45,
  ],
  "icon-image": "shape-arrow",
  "icon-size": [
    "interpolate",
    ["linear"],
    ["zoom"],
    11,
    0.45,
    13.5,
    0.52,
    16,
    0.6,
  ],
  "icon-allow-overlap": true,
  "icon-ignore-placement": true,
};

const ARROW_PAINT: mapboxgl.SymbolLayerSpecification["paint"] = {
  "icon-color": ["concat", "#", ["get", "arrowColor"]],
  "icon-halo-color": ["concat", "#", ["get", "arrowOutlineColor"]],
  "icon-halo-width": 1.25,
  "icon-opacity": 1,
};

const routeIds = (shapesGeoJSON as FeatureCollection<LineString>).features.map(
  (feature) => String(feature.properties?.id)
);

function withYellowArrowFix(
  geojson: FeatureCollection<LineString>
): FeatureCollection<LineString> {
  return {
    ...geojson,
    features: geojson.features.map((feature) => {
      const routeColor = String(feature.properties?.routeColor ?? "");
      if (!isGoldYellow(routeColor)) {
        return feature;
      }

      return {
        ...feature,
        properties: {
          ...(feature.properties ?? {}),
          arrowColor: mapYellowArrowColor(routeColor),
        },
      };
    }),
  };
}

function addShapeArrowIcon(map: mapboxgl.Map) {
  if (map.hasImage("shape-arrow")) return;

  const size = 32;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.moveTo(size - 4, size / 2);
  ctx.lineTo(4, 6);
  ctx.lineTo(4, size - 6);
  ctx.closePath();
  ctx.fill();

  map.addImage("shape-arrow", ctx.getImageData(0, 0, size, size), { sdf: true });
}

function lineLayerId(routeId: string) {
  return `shapes-${routeId}`;
}

function arrowLayerId(routeId: string) {
  return `shape-arrows-${routeId}`;
}

export function addShapesLayer(map: mapboxgl.Map) {
  addShapeArrowIcon(map);

  map.addSource("shapes", {
    type: "geojson",
    data: withYellowArrowFix(shapesGeoJSON as FeatureCollection<LineString>),
  });

  for (const routeId of routeIds) {
    map.addLayer({
      id: lineLayerId(routeId),
      type: "line",
      source: "shapes",
      filter: ["==", ["get", "id"], routeId],
      layout: {
        "line-join": "round",
        "line-cap": "round",
      },
      paint: {
        "line-width": 6,
        "line-opacity": 1,
        "line-color": ROUTE_COLOR,
      },
    });

    map.addLayer({
      id: arrowLayerId(routeId),
      type: "symbol",
      source: "shapes",
      filter: ["==", ["get", "id"], routeId],
      layout: ARROW_LAYOUT,
      paint: ARROW_PAINT,
    });
  }
}

export function setShapeRouteVisibility(
  map: mapboxgl.Map,
  selectedRoutes: Set<string>
) {
  for (const routeId of routeIds) {
    const visibility = selectedRoutes.has(routeId) ? "visible" : "none";
    map.setLayoutProperty(lineLayerId(routeId), "visibility", visibility);
    map.setLayoutProperty(arrowLayerId(routeId), "visibility", visibility);
  }
}

export function shapesLayersReady(map: mapboxgl.Map) {
  return routeIds.length > 0 && Boolean(map.getLayer(lineLayerId(routeIds[0])));
}
