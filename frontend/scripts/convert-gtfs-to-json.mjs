import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { convertGtfsFile } from "./gtfs-json.mjs";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(scriptDir, "..");
const rawDataDir = join(projectRoot, "src/data/raw");
const jsonDataDir = join(projectRoot, "src/data/json");

const files = ["routes", "shapes", "stops"];

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
  const inputPath = join(rawDataDir, `${name}.txt`);
  const outputPath = join(jsonDataDir, `${name}.json`);
  const rowCount = await convertGtfsFile(inputPath, outputPath, transformRow);

  console.log(`Converted ${name}.txt -> ${name}.json (${rowCount} rows)`);
}
