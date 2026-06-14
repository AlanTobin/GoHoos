import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readFile } from "node:fs/promises";

import { convertGtfsFile, writeJsonFile } from "./gtfs-json.mjs";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(scriptDir, "..");
const rawDataDir = join(projectRoot, "src/data/raw");
const jsonDataDir = join(projectRoot, "src/data/json");

const files = ["routes", "shapes", "stops", "trips", "stop_times"];

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

const STOP_SHAPE_DISTANCE_METERS = 10;

function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

function haversineMeters(lat1, lon1, lat2, lon2) {
  const earthRadius = 6371000;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) ** 2;
  return 2 * earthRadius * Math.asin(Math.sqrt(a));
}

function closestPointOnSegment(lon, lat, lon1, lat1, lon2, lat2) {
  const cosLat = Math.cos(toRadians((lat1 + lat2 + lat) / 3));
  const dx = (lon2 - lon1) * cosLat;
  const dy = lat2 - lat1;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared < 1e-12) {
    return [lon1, lat1];
  }

  const t = Math.max(
    0,
    Math.min(
      1,
      ((lon - lon1) * cosLat * dx + (lat - lat1) * dy) / lengthSquared
    )
  );
  return [lon1 + (lon2 - lon1) * t, lat1 + (lat2 - lat1) * t];
}

function pointToSegmentMeters(lon, lat, lon1, lat1, lon2, lat2) {
  const [closestLon, closestLat] = closestPointOnSegment(
    lon,
    lat,
    lon1,
    lat1,
    lon2,
    lat2
  );
  return haversineMeters(lat, lon, closestLat, closestLon);
}

function minDistanceToShapeMeters(stop, shapePoints) {
  let minDistance = Infinity;

  for (let i = 0; i < shapePoints.length - 1; i++) {
    const start = shapePoints[i];
    const end = shapePoints[i + 1];
    const distance = pointToSegmentMeters(
      stop.stop_lon,
      stop.stop_lat,
      start.shape_pt_lon,
      start.shape_pt_lat,
      end.shape_pt_lon,
      end.shape_pt_lat
    );
    minDistance = Math.min(minDistance, distance);
  }

  return minDistance;
}

async function enrichStopsWithRouteIds() {
  const stops = JSON.parse(await readFile(join(jsonDataDir, "stops.json"), "utf8"));
  const shapes = JSON.parse(await readFile(join(jsonDataDir, "shapes.json"), "utf8"));
  const trips = JSON.parse(await readFile(join(jsonDataDir, "trips.json"), "utf8"));
  const stopTimes = JSON.parse(await readFile(join(jsonDataDir, "stop_times.json"), "utf8"));
  const shapeBuckets = groupShapesById(shapes);

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

  for (const stop of stops) {
    const routeIds = new Set(stopToRoutes.get(stop.stop_id) ?? []);

    for (const [shapeId, group] of shapeBuckets) {
      group.sort((a, b) => a.shape_pt_sequence - b.shape_pt_sequence);
      if (minDistanceToShapeMeters(stop, group) <= STOP_SHAPE_DISTANCE_METERS) {
        routeIds.add(shapeId);
      }
    }

    stop.routeIds = [...routeIds].sort();
  }

  const nightPilotStops = stops
  .filter(s => s.routeIds.includes('TL-59'))
  .map(s => ({ id: s.stop_id, name: s.stop_name }));

  console.log('Night Pilot stops:', JSON.stringify(nightPilotStops, null, 2));

  const outputPath = join(jsonDataDir, "stops.json");
  await writeJsonFile(outputPath, stops);
  const withRoutes = stops.filter((stop) => stop.routeIds.length > 0).length;
  console.log(
    `Enriched stops.json with routeIds (${withRoutes}/${stops.length} stops, stop_times + shape proximity)`
  );
}

await buildShapesLinesGeoJSON();
await enrichStopsWithRouteIds();
