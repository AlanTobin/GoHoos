import mockCapacity from "@/data/json/mock-capacity.json";
import mockVehicles from "@/data/json/mock-vehicles.json";
import type { Vehicle } from "@/types/vehicle";
import type { VehicleCapacityRecord } from "@/types/vehicleCapacity";

function mergeCapacity(
  vehicles: Vehicle[],
  capacityRecords: VehicleCapacityRecord[],
  fetchedAt: number
) {
  const capacityByVehicleId = new Map(
    capacityRecords.map((record) => [record.VehicleID, record])
  );

  return vehicles.map((vehicle) => {
    const record = capacityByVehicleId.get(vehicle.VehicleID);
    if (!record) return { ...vehicle, PositionLastUpdated: fetchedAt };

    return {
      ...vehicle,
      PositionLastUpdated: fetchedAt,
      Capacity: Math.round(record.Percentage * 100),
      Occupancy: record.CurrentOccupation,
      MaxPassengers: record.Capacity,
      OccupancyLastUpdated: fetchedAt,
    };
  });
}

/** Static sample data for screenshots — use /routes?mockup=1 */
export function getMockVehicles(): Vehicle[] {
  const fetchedAt = Date.now();
  return mergeCapacity(
    mockVehicles as Vehicle[],
    mockCapacity as VehicleCapacityRecord[],
    fetchedAt
  );
}
