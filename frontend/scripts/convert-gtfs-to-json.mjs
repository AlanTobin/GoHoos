import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readFile } from "node:fs/promises";

import { convertGtfsFile, writeJsonFile } from "./gtfs-json.mjs";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(scriptDir, "..");
const rawDataDir = join(projectRoot, "src/data/raw");
const jsonDataDir = join(projectRoot, "src/data/json");

const files = ["routes", "shapes", "stops", "trips", "stop_times"];

async function loadExistingRouteDescriptions() {
  try {
    const existing = JSON.parse(
      await readFile(join(jsonDataDir, "routes.json"), "utf8")
    );
    return new Map(
      existing
        .filter((route) => route.route_desc)
        .map((route) => [route.route_id, route.route_desc])
    );
  } catch {
    return new Map();
  }
}

async function preserveRouteDescriptions(descriptions) {
  if (descriptions.size === 0) return;

  const routes = JSON.parse(
    await readFile(join(jsonDataDir, "routes.json"), "utf8")
  );

  for (const route of routes) {
    const description = descriptions.get(route.route_id);
    if (description) {
      route.route_desc = description;
    }
  }

  await writeJsonFile(join(jsonDataDir, "routes.json"), routes);
  console.log(`Preserved route_desc for ${descriptions.size} routes`);
}

const routeDescriptions = await loadExistingRouteDescriptions();

const normalizeEmptyStrings = (row) =>
  Object.fromEntries(
    Object.entries(row).map(([key, value]) => [
      key,
      value === "" ? null : value,
    ])
  );
  
for (const name of files) {

  let transformRow = (row) => row;
  if (name === "shapes") {
    transformRow = (row) => ({
      ...normalizeEmptyStrings(row),
      shape_pt_lat: row.shape_pt_lat ? Number(row.shape_pt_lat) : null,
      shape_pt_lon: row.shape_pt_lon ? Number(row.shape_pt_lon) : null,
      shape_pt_sequence: row.shape_pt_sequence ? Number(row.shape_pt_sequence) : null,
      shape_dist_traveled: row.shape_dist_traveled ? Number(row.shape_dist_traveled) : null,
    });
  }
  else if (name === "stops") {
    transformRow = (row) => ({
      ...normalizeEmptyStrings(row),
      stop_lat: row.stop_lat ? Number(row.stop_lat) : null,
      stop_lon: row.stop_lon ? Number(row.stop_lon) : null,
      location_type: row.location_type ? Number(row.location_type) : null,
    });
  }
  else if (name === "routes") {
    transformRow = (row) => ({
      ...normalizeEmptyStrings(row),
      route_type: row.route_type ? Number(row.route_type) : null,
      route_sort_order: row.route_sort_order ? Number(row.route_sort_order) : null,
    });
  }
  else if (name === "trips") {
    transformRow = (row) => ({
      ...normalizeEmptyStrings(row),
      direction_id: row.direction_id ? Number(row.direction_id) : null,
    });
  }
  else if (name === "stop_times") {
    transformRow = (row) => ({
      ...normalizeEmptyStrings(row),
      stop_sequence: row.stop_sequence ? Number(row.stop_sequence) : null,
      pickup_type: row.pickup_type ? Number(row.pickup_type) : null,
      drop_off_type: row.drop_off_type ? Number(row.drop_off_type) : null,
      timepoint: row.timepoint ? Number(row.timepoint) : null,
    });
  }
  const inputPath = join(rawDataDir, `${name}.txt`);
  const outputPath = join(jsonDataDir, `${name}.json`);
  const rowCount = await convertGtfsFile(inputPath, outputPath, transformRow);

  console.log(`Converted ${name}.txt -> ${name}.json (${rowCount} rows)`);
}

await preserveRouteDescriptions(routeDescriptions);

function lightenColor(hex, amount = 0.45) {
  const normalized = hex.replace(/^#/, "");
  return [0, 2, 4]
    .map((index) => parseInt(normalized.slice(index, index + 2), 16))
    .map((channel) => Math.min(255, Math.round(channel + (255 - channel) * amount)))
    .map((channel) => channel.toString(16).padStart(2, "0"))
    .join("");
}

function darkenColor(hex, amount = 0.35) {
  const normalized = hex.replace(/^#/, "");
  return [0, 2, 4]
    .map((index) => parseInt(normalized.slice(index, index + 2), 16))
    .map((channel) => Math.max(0, Math.round(channel * (1 - amount))))
    .map((channel) => channel.toString(16).padStart(2, "0"))
    .join("");
}

function groupShapesById(shapes) {
  const buckets = new Map();
  for (const shape of shapes) {
    if (!buckets.has(shape.shape_id)) {
      buckets.set(shape.shape_id, []);
    }
    buckets.get(shape.shape_id).push(shape);
  }
  return buckets;
}

async function buildShapesLinesGeoJSON() {
  const shapes = JSON.parse(await readFile(join(jsonDataDir, "shapes.json"), "utf8"));
  const routes = JSON.parse(await readFile(join(jsonDataDir, "routes.json"), "utf8"));
  const routesMap = new Map(routes.map((route) => [route.route_id, route.route_color]));
  const buckets = groupShapesById(shapes);

  const features = [];
  for (const [shapeId, group] of buckets) {
    group.sort((a, b) => a.shape_pt_sequence - b.shape_pt_sequence);
    const routeColor = routesMap.get(shapeId) ?? "888888";
    features.push({
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: group.map((point) => [point.shape_pt_lon, point.shape_pt_lat]),
      },
      properties: {
        id: shapeId,
        routeColor,
        arrowColor: lightenColor(routeColor),
        arrowOutlineColor: darkenColor(routeColor),
      },
    });
  }

  const outputPath = join(jsonDataDir, "shapes-lines.json");
  await writeJsonFile(outputPath, { type: "FeatureCollection", features });
  console.log(`Built shapes-lines.json (${features.length} features)`);
}

const ROUTE_STOP_OVERRIDES = {
  "TL-59": [
    "TL-733", "TL-734", "TL-994", "TL-736", "TL-737", "TL-738", "TL-739", "TL-740",
    "TL-984", "TL-742", "TL-743", "TL-1010", "TL-1011", "TL-1012",
  ],
  "TL-67": [
    "TL-843", "TL-844", "TL-814", "TL-815", "TL-816", "TL-817", "TL-841", "TL-840",
    "TL-818", "TL-822", "TL-898", "TL-880", "TL-897", "TL-881",
    "TL-836", "TL-823", "TL-835", "TL-824", "TL-834", "TL-833", "TL-825", "TL-826",
    "TL-832", "TL-831", "TL-827", "TL-830", "TL-828", "TL-829",
  ],
};

async function enrichStopsWithRouteIds() {
  const stops = JSON.parse(await readFile(join(jsonDataDir, "stops.json"), "utf8"));
  const trips = JSON.parse(await readFile(join(jsonDataDir, "trips.json"), "utf8"));
  const stopTimes = JSON.parse(await readFile(join(jsonDataDir, "stop_times.json"), "utf8"));

  const tripToRoute = new Map(trips.map((trip) => [trip.trip_id, trip.route_id]));
  const stopToRoutes = new Map();

  for (const stopTime of stopTimes) {
    const routeId = tripToRoute.get(stopTime.trip_id);
    if (!routeId) continue;

    if (!stopToRoutes.has(stopTime.stop_id)) {
      stopToRoutes.set(stopTime.stop_id, new Set());
    }
    stopToRoutes.get(stopTime.stop_id).add(routeId);
  }

  const stopsById = new Map(stops.map((stop) => [stop.stop_id, stop]));

  for (const stop of stops) {
    stop.routeIds = [...(stopToRoutes.get(stop.stop_id) ?? [])];
  }

  for (const [routeId, stopIds] of Object.entries(ROUTE_STOP_OVERRIDES)) {
    for (const stop of stops) {
      stop.routeIds = stop.routeIds.filter((id) => id !== routeId);
    }

    for (const stopId of stopIds) {
      const stop = stopsById.get(stopId);
      if (stop && !stop.routeIds.includes(routeId)) {
        stop.routeIds.push(routeId);
      }
    }
  }

  for (const stop of stops) {
    stop.routeIds.sort();
  }

  const outputPath = join(jsonDataDir, "stops.json");
  await writeJsonFile(outputPath, stops);

  const tripByRoute = new Map();
  for (const trip of trips) {
    if (!tripByRoute.has(trip.route_id)) {
      tripByRoute.set(trip.route_id, trip.trip_id);
    }
  }

  const routeStops = {};

  for (const [routeId, stopIds] of Object.entries(ROUTE_STOP_OVERRIDES)) {
    routeStops[routeId] = [...stopIds];
  }

  for (const [routeId, tripId] of tripByRoute) {
    if (routeId in ROUTE_STOP_OVERRIDES) continue;

    const orderedStopIds = stopTimes
      .filter((stopTime) => stopTime.trip_id === tripId)
      .sort((a, b) => a.stop_sequence - b.stop_sequence)
      .map((stopTime) => stopTime.stop_id);

    routeStops[routeId] = [...new Set(orderedStopIds)];
  }

  await writeJsonFile(join(jsonDataDir, "route-stops.json"), routeStops);
  await writeJsonFile(join(jsonDataDir, "route-stop-overrides.json"), ROUTE_STOP_OVERRIDES);

  const withRoutes = stops.filter((stop) => stop.routeIds.length > 0).length;
  console.log(
    `Enriched stops.json with routeIds (${withRoutes}/${stops.length} stops, stop_times + route overrides)`
  );
}

await buildShapesLinesGeoJSON();
await enrichStopsWithRouteIds();
