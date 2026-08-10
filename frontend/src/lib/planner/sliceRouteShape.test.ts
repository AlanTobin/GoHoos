import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  nearestIndexForward,
  rideStopSequence,
  sliceRouteShapeBetweenStops,
} from "./sliceRouteShape.ts";

describe("sliceRouteShapeBetweenStops", () => {
  it("does not wrap the long way around a loop between nearby stops", () => {
    // 20-point loop. Stops near indices 2 and 6 → short arc, not 2→…→19→0→6.
    const shape: [number, number][] = Array.from({ length: 20 }, (_, i) => [
      i,
      0,
    ]);
    const stopPoints = new Map<string, [number, number]>([
      ["A", [2, 0]],
      ["B", [4, 0]],
      ["C", [6, 0]],
    ]);

    const coords = sliceRouteShapeBetweenStops({
      shape,
      routeStops: ["A", "B", "C"],
      stopPoints,
      fromStopId: "A",
      toStopId: "C",
    });

    assert.ok(coords);
    assert.ok(coords.length < 12, `expected short slice, got ${coords.length}`);
    assert.equal(coords[0][0], 2);
    assert.equal(coords[coords.length - 1][0], 6);
  });

  it("prefers a forward index inside the look-ahead window", () => {
    const shape: [number, number][] = Array.from({ length: 100 }, (_, i) => [
      i,
      0,
    ]);
    // Point is equidistant-ish to index 10 (behind) and 40 (ahead) from 15 —
    // forward window should pick ~40, not wrap to 10.
    const idx = nearestIndexForward(shape, [40, 0], 15, 30);
    assert.equal(idx, 40);
  });

  it("builds a cyclic stop sequence", () => {
    assert.deepEqual(rideStopSequence(["A", "B", "C", "D"], "C", "A"), [
      "C",
      "D",
      "A",
    ]);
  });
});
