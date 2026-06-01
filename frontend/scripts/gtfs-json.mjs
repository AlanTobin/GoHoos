import { createReadStream } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { pipeline } from "node:stream/promises";

import csv from "csv-parser";

export async function readGtfsCsv(filePath) {
  const rows = [];

  await pipeline(
    createReadStream(filePath),
    csv({
      mapHeaders: ({ header }) => header.trim(),
    }),
    async function* collect(source) {
      for await (const row of source) {
        rows.push(row);
      }
    },
  );

  return rows;
}

export async function writeJsonFile(filePath, data) {
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

export async function convertGtfsFile(inputPath, outputPath, transformRow = (row) => row) {
  const rows = await readGtfsCsv(inputPath);
  const transformedRows = rows.map(transformRow);
  await writeJsonFile(outputPath, transformedRows);
  return transformedRows.length;
}
