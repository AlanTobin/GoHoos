import mapboxgl from "mapbox-gl";
import type { Feature, FeatureCollection, LineString } from "geojson";

const SOURCE_ID = "trip-path";
const RIDE_LAYER_ID = "trip-path-ride";
const RIDE_ARROW_LAYER_ID = "trip-path-ride-arrows";
const WALK_LAYER_ID = "trip-path-walk";

/** Match planner map route line styling from shapes.ts */
const ROUTE_COLOR: mapboxgl.ExpressionSpecification = [
  "concat",
  "#",
  ["get", "routeColor"],
];

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

const EMPTY: FeatureCollection<LineString> = {
  type: "FeatureCollection",
  features: [],
};

export function addTripPathLayer(map: mapboxgl.Map) {
  if (map.getSource(SOURCE_ID)) return;

  map.addSource(SOURCE_ID, {
    type: "geojson",
    data: EMPTY,
  });

  map.addLayer(
    {
      id: WALK_LAYER_ID,
      type: "line",
      source: SOURCE_ID,
      filter: ["==", ["get", "kind"], "walk"],
      layout: {
        "line-join": "round",
        "line-cap": "round",
      },
      paint: {
        "line-color": ["get", "color"],
        "line-width": 4,
        "line-dasharray": [1.5, 1.5],
        "line-opacity": 0.85,
      },
    },
    "stops"
  );

  // Same paint as shapes-${routeId}: official route look, clipped geometry.
  map.addLayer(
    {
      id: RIDE_LAYER_ID,
      type: "line",
      source: SOURCE_ID,
      filter: ["==", ["get", "kind"], "ride"],
      layout: {
        "line-join": "round",
        "line-cap": "round",
      },
      paint: {
        "line-width": 6,
        "line-opacity": 1,
        "line-color": ROUTE_COLOR,
      },
    },
    "stops"
  );

  map.addLayer(
    {
      id: RIDE_ARROW_LAYER_ID,
      type: "symbol",
      source: SOURCE_ID,
      filter: ["==", ["get", "kind"], "ride"],
      layout: ARROW_LAYOUT,
      paint: ARROW_PAINT,
    },
    "stops"
  );
}

export function updateTripPathLayer(
  map: mapboxgl.Map,
  data: FeatureCollection<LineString> | null
) {
  const source = map.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
  if (!source) return;
  source.setData(data ?? EMPTY);
}

/** Show only the active step (rides are clipped board→alight segments). */
export function setTripPathActiveStep(
  map: mapboxgl.Map,
  activeStepIndex: number | null
) {
  const step = activeStepIndex ?? -1;

  if (map.getLayer(WALK_LAYER_ID)) {
    map.setFilter(WALK_LAYER_ID, [
      "all",
      ["==", ["get", "kind"], "walk"],
      ["==", ["get", "stepIndex"], step],
    ]);
    map.setPaintProperty(WALK_LAYER_ID, "line-opacity", 0.95);
    map.setPaintProperty(WALK_LAYER_ID, "line-width", 5);
  }
  if (map.getLayer(RIDE_LAYER_ID)) {
    map.setFilter(RIDE_LAYER_ID, [
      "all",
      ["==", ["get", "kind"], "ride"],
      ["==", ["get", "stepIndex"], step],
    ]);
    map.setPaintProperty(RIDE_LAYER_ID, "line-opacity", 1);
    map.setPaintProperty(RIDE_LAYER_ID, "line-width", 6);
  }
  if (map.getLayer(RIDE_ARROW_LAYER_ID)) {
    map.setFilter(RIDE_ARROW_LAYER_ID, [
      "all",
      ["==", ["get", "kind"], "ride"],
      ["==", ["get", "stepIndex"], step],
    ]);
  }
}

function extendBounds(
  bounds: mapboxgl.LngLatBounds,
  feature: Feature<LineString>
) {
  for (const coord of feature.geometry.coordinates) {
    bounds.extend(coord as [number, number]);
  }
}

export function fitMapToTripPath(
  map: mapboxgl.Map,
  data: FeatureCollection<LineString>,
  activeStepIndex?: number | null
) {
  if (data.features.length === 0) return;

  const bounds = new mapboxgl.LngLatBounds();
  const active =
    activeStepIndex != null
      ? data.features.filter(
          (f) => f.properties?.stepIndex === activeStepIndex
        )
      : [];

  const features = active.length > 0 ? active : data.features;
  for (const feature of features) {
    extendBounds(bounds, feature);
  }
  if (bounds.isEmpty()) return;

  map.fitBounds(bounds, {
    padding: { top: 200, bottom: 280, left: 48, right: 48 },
    maxZoom: 16.5,
    duration: 500,
  });
}
