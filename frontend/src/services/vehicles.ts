import { fetchJson } from "@/lib/api";
import type { Vehicle } from "@/types/vehicle";
import type { VehicleCapacityRecord } from "@/types/vehicleCapacity";

const API_BASE = "http://localhost:3001/api/v1";

function mergeCapacity(
  vehicles: Vehicle[],
  capacityRecords: VehicleCapacityRecord[],
  capacityFetchedAt: number | null
) {
  const capacityByVehicleId = new Map(
    capacityRecords.map((record) => [record.VehicleID, record])
  );

  return vehicles.map((vehicle) => {
    const record = capacityByVehicleId.get(vehicle.VehicleID);
    if (!record) return vehicle;

    return {
      ...vehicle,
      Capacity: Math.round(record.Percentage * 100),
      Occupancy: record.CurrentOccupation,
      MaxPassengers: record.Capacity,
      OccupancyLastUpdated: capacityFetchedAt ?? undefined,
    };
  });
}

export async function getVehicles() {
  const vehicles = await fetchJson<Vehicle[]>(`${API_BASE}/vehicles`);
  const vehiclesFetchedAt = Date.now();

  let capacityRecords: VehicleCapacityRecord[] = [];
  let capacityFetchedAt: number | null = null;
  try {
    capacityRecords = await fetchJson<VehicleCapacityRecord[]>(
      `${API_BASE}/capacity`
    );
    capacityFetchedAt = Date.now();
  } catch {
    // Capacity is optional; vehicles still render without occupancy data.
  }

  return mergeCapacity(
    vehicles.map((vehicle) => ({
      ...vehicle,
      PositionLastUpdated: vehiclesFetchedAt,
    })),
    capacityRecords,
    capacityFetchedAt
  );
}
