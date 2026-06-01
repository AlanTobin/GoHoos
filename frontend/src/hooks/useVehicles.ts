import type { Vehicle } from "@/types/vehicle";

export function useVehicles() {
  const vehicles: Vehicle[] = [];

  return { vehicles };
}
