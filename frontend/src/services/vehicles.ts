import { fetchJson } from "@/lib/api";
import type { Vehicle } from "@/types/vehicle";

export async function getVehicles() {
  return fetchJson<Vehicle[]>("http://localhost:3001/api/v1/vehicles");
}