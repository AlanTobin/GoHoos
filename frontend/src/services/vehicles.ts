import { fetchJson } from "@/lib/api";
import type { Vehicle } from "@/types/vehicle";

export async function getVehicles() {
  return fetchJson<Vehicle[]>("/api/vehicles");
}
