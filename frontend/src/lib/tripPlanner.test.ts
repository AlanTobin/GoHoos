import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  BUS_SPEED_MPS,
  TRANSFER_WAIT_MINUTES,
  WALK_SPEED_MPS,
  planTripsWithData,
  selectTopTrips,
  type PlannerData,
  type PlannerStop,
} from "./tripPlanner.ts";
import type { PickedLocation, TripOption } from "../types/planner.ts";

function stop(
  id: string,
  name: string,
  lat: number,
  lon: number,
  routeIds: string[]
): PlannerStop {
  return { stopId: id, stopName: name, lat, lon, routeIds };
}

function picked(
  stopId: string,
  stopName: string,
  lat: number,
  lon: number
): PickedLocation {
  return { point: { lat, lon }, stopId, stopName, walkMeters: 0 };
}

function bestBus(trips: TripOption[]): TripOption | undefined {
  return trips.find((t) => t.steps.some((s) => s.kind === "ride"));
}

describe("planTripsWithData (minutes)", () => {
  it("ranks by estimated minutes and returns a direct bus trip", () => {
    const stops = [
      stop("A", "Stop A", 38.0, -78.5, ["R1"]),
      stop("B", "Stop B", 38.0015, -78.5, ["R1"]),
      stop("C", "Stop C", 38.005, -78.5, ["R1"]),
    ];
    const data: PlannerData = {
      stops,
      routeStops: { R1: ["A", "B", "C"] },
      routeNames: { R1: "Red Line" },
    };

    const trips = planTripsWithData(
      {
        origin: picked("A", "Stop A", 38.0, -78.5),
        destination: picked("C", "Stop C", 38.005, -78.5),
        activeRouteIds: new Set(["R1"]),
      },
      data
    );

    const bus = bestBus(trips);
    assert.ok(bus);
    assert.ok(bus.totalMinutes > 0);
    assert.ok(bus.totalMeters > 0);
    const ride = bus.steps.find((s) => s.kind === "ride");
    assert.ok(ride && ride.kind === "ride");
    assert.equal(ride.fromStopId, "A");
    assert.equal(ride.toStopId, "C");
  });

  it("uses walk and bus speeds to estimate minutes", () => {
    const meters = WALK_SPEED_MPS * 60; // 1 minute of walking
    const walkMin = meters / WALK_SPEED_MPS / 60;
    const busMin = meters / BUS_SPEED_MPS / 60;
    assert.ok(Math.abs(walkMin - 1) < 1e-9);
    assert.ok(busMin < walkMin);
    assert.ok(TRANSFER_WAIT_MINUTES > 0);
  });

  it("can alight early and walk straight to the pin", () => {
    const stops = [
      stop("A", "A", 38.0, -78.5, ["R1"]),
      stop("Near", "Near", 38.002, -78.5, ["R1"]),
      stop("Far", "Far", 38.008, -78.5, ["R1"]),
    ];
    const data: PlannerData = {
      stops,
      routeStops: { R1: ["A", "Near", "Far"] },
      routeNames: { R1: "Red" },
    };
    const pin = { lat: 38.0022, lon: -78.5 };

    const trips = planTripsWithData(
      {
        origin: picked("A", "A", 38.0, -78.5),
        destination: picked("Far", "Far", pin.lat, pin.lon),
        activeRouteIds: new Set(["R1"]),
      },
      data
    );

    const bus = bestBus(trips);
    assert.ok(bus);
    const ride = bus.steps.find((s) => s.kind === "ride");
    assert.ok(ride && ride.kind === "ride");
    assert.equal(ride.toStopId, "Near");
    assert.equal(bus.steps.at(-1)?.kind, "walk");
    assert.equal(
      bus.steps.some((s) => s.kind === "walk" && s.toStopId === "Far"),
      false
    );
  });

  it("does not walk the same-route corridor instead of staying aboard", () => {
    const stops = [
      stop("A", "A", 38.0, -78.5, ["R1"]),
      stop("Mid", "Mid", 38.002, -78.5, ["R1"]),
      stop("Dest", "Dest", 38.0035, -78.5, ["R1"]),
    ];
    const data: PlannerData = {
      stops,
      routeStops: { R1: ["A", "Mid", "Dest"] },
      routeNames: { R1: "Red" },
    };

    const trips = planTripsWithData(
      {
        origin: picked("A", "A", 38.0, -78.5),
        destination: picked("Dest", "Dest", 38.0035, -78.5),
        activeRouteIds: new Set(["R1"]),
      },
      data
    );

    const bus = bestBus(trips);
    assert.ok(bus);
    const midWalks = bus.steps.filter(
      (s) =>
        s.kind === "walk" &&
        s.toStopId !== null &&
        s.fromLabel !== "Your location"
    );
    assert.equal(midWalks.length, 0);
    const ride = bus.steps.find((s) => s.kind === "ride");
    assert.ok(ride && ride.kind === "ride");
    assert.equal(ride.toStopId, "Dest");
  });

  it("supports a 1-transfer trip via shared stop", () => {
    const stops = [
      stop("A", "A", 38.0, -78.5, ["R1"]),
      stop("H", "Hub", 38.004, -78.5, ["R1", "R2"]),
      stop("Z", "Z", 38.008, -78.5, ["R2"]),
    ];
    const data: PlannerData = {
      stops,
      routeStops: { R1: ["A", "H"], R2: ["H", "Z"] },
      routeNames: { R1: "Blue", R2: "Gold" },
    };

    const trips = planTripsWithData(
      {
        origin: picked("A", "A", 38.0, -78.5),
        destination: picked("Z", "Z", 38.008, -78.5),
        activeRouteIds: new Set(["R1", "R2"]),
      },
      data
    );

    const bus = bestBus(trips);
    assert.ok(bus);
    const rides = bus.steps.filter((s) => s.kind === "ride");
    assert.equal(rides.length, 2);
    assert.ok(bus.totalMinutes >= TRANSFER_WAIT_MINUTES);
  });

  it("returns at most 2 options", () => {
    const stops = [
      stop("A", "A", 38.0, -78.5, ["R1", "R2"]),
      stop("B", "B", 38.003, -78.5, ["R1", "R2"]),
      stop("C", "C", 38.006, -78.5, ["R1", "R2"]),
    ];
    const data: PlannerData = {
      stops,
      routeStops: { R1: ["A", "B", "C"], R2: ["A", "C"] },
      routeNames: { R1: "One", R2: "Two" },
    };

    const trips = planTripsWithData(
      {
        origin: picked("A", "A", 38.0, -78.5),
        destination: picked("C", "C", 38.006, -78.5),
        activeRouteIds: new Set(["R1", "R2"]),
      },
      data
    );

    assert.ok(trips.length <= 2);
  });

  it("omits a 0 m walk when already at the boarding stop", () => {
    const stops = [
      stop("A", "Stop A", 38.0, -78.5, ["R1"]),
      stop("B", "Stop B", 38.003, -78.5, ["R1"]),
    ];
    const data: PlannerData = {
      stops,
      routeStops: { R1: ["A", "B"] },
      routeNames: { R1: "Red" },
    };

    const trips = planTripsWithData(
      {
        origin: picked("A", "Stop A", 38.0, -78.5),
        destination: picked("B", "Stop B", 38.003, -78.5),
        activeRouteIds: new Set(["R1"]),
      },
      data
    );

    const bus = bestBus(trips);
    assert.ok(bus);
    assert.equal(
      bus.steps.some(
        (s) =>
          s.kind === "walk" &&
          s.fromLabel === "Your location" &&
          s.meters < 15
      ),
      false
    );
    assert.equal(bus.steps[0]?.kind, "ride");
  });

  it("includes a least-walking option among the top results", () => {
    const trips: TripOption[] = [
      {
        totalMinutes: 10,
        totalMeters: 2000,
        walkMeters: 400,
        steps: [
          {
            kind: "walk",
            fromLabel: "Your location",
            toStopId: "A",
            toStopName: "A",
            meters: 400,
            minutes: 5,
          },
          {
            kind: "ride",
            routeId: "R1",
            routeName: "One",
            fromStopId: "A",
            fromStopName: "A",
            toStopId: "C",
            toStopName: "C",
            meters: 1600,
            minutes: 5,
          },
        ],
      },
      {
        totalMinutes: 11,
        totalMeters: 1800,
        walkMeters: 350,
        steps: [
          {
            kind: "walk",
            fromLabel: "Your location",
            toStopId: "A",
            toStopName: "A",
            meters: 350,
            minutes: 4,
          },
          {
            kind: "ride",
            routeId: "R2",
            routeName: "Two",
            fromStopId: "A",
            fromStopName: "A",
            toStopId: "C",
            toStopName: "C",
            meters: 1450,
            minutes: 7,
          },
        ],
      },
      {
        totalMinutes: 12,
        totalMeters: 1700,
        walkMeters: 300,
        steps: [
          {
            kind: "walk",
            fromLabel: "Your location",
            toStopId: "B",
            toStopName: "B",
            meters: 300,
            minutes: 4,
          },
          {
            kind: "ride",
            routeId: "R3",
            routeName: "Three",
            fromStopId: "B",
            fromStopName: "B",
            toStopId: "C",
            toStopName: "C",
            meters: 1400,
            minutes: 8,
          },
        ],
      },
      {
        totalMinutes: 20,
        totalMeters: 900,
        walkMeters: 80,
        steps: [
          {
            kind: "walk",
            fromLabel: "Your location",
            toStopId: "D",
            toStopName: "D",
            meters: 40,
            minutes: 1,
          },
          {
            kind: "ride",
            routeId: "R4",
            routeName: "Four",
            fromStopId: "D",
            fromStopName: "D",
            toStopId: "E",
            toStopName: "E",
            meters: 820,
            minutes: 18,
          },
          {
            kind: "walk",
            fromLabel: "E",
            toStopId: null,
            toStopName: "Destination",
            meters: 40,
            minutes: 1,
          },
        ],
      },
    ];

    const selected = selectTopTrips(trips, 2);
    assert.equal(selected.length, 2);
    assert.equal(selected[0].totalMinutes, 10);
    assert.ok(selected.some((t) => t.walkMeters === 80));
  });
});
