import type { LatLng } from "@/lib/geo";

export type PickedLocation = {
  point: LatLng;
  stopId: string;
  stopName: string;
  walkMeters: number;
};

export type PlannerPickMode = "idle" | "picking-destination";

export type TripWalkStep = {
  kind: "walk";
  fromLabel: string;
  toStopId: string | null;
  toStopName: string;
  meters: number;
  minutes: number;
};

export type TripRideStep = {
  kind: "ride";
  routeId: string;
  routeName: string;
  fromStopId: string;
  fromStopName: string;
  toStopId: string;
  toStopName: string;
  meters: number;
  minutes: number;
};

export type TripStep = TripWalkStep | TripRideStep;

export type TripOption = {
  totalMinutes: number;
  totalMeters: number;
  /** Sum of walk-step meters (access + transfer + egress). */
  walkMeters: number;
  steps: TripStep[];
};
