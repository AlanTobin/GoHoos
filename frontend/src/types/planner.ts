import type { LatLng } from "@/lib/geo";

export type PickedLocation = {
  point: LatLng;
  stopId: string;
  stopName: string;
  walkMeters: number;
};

export type PlannerPickMode = "idle" | "picking-destination";
