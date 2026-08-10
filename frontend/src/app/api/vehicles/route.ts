import type { Vehicle } from "@/types/vehicle";
import type { VehicleCapacityRecord } from "@/types/vehicleCapacity";

const TRANSLOC_BASE =
  "https://uva.transloc.com/Services/JSONPRelay.svc";

let lastCapacityRecords: VehicleCapacityRecord[] = [];
let lastCapacityFetchedAt: number | null = null;

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

async function fetchTranslocJson<T>(path: string): Promise<T> {
  const response = await fetch(`${TRANSLOC_BASE}/${path}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`TransLoc ${path} failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function GET() {
  try {
    const vehicles = await fetchTranslocJson<Vehicle[]>("GetMapVehiclePoints");
    const vehiclesFetchedAt = Date.now();

    let capacityRecords = lastCapacityRecords;
    let capacityFetchedAt = lastCapacityFetchedAt;

    try {
      capacityRecords = await fetchTranslocJson<VehicleCapacityRecord[]>(
        "GetVehicleCapacities"
      );
      capacityFetchedAt = Date.now();
      lastCapacityRecords = capacityRecords;
      lastCapacityFetchedAt = capacityFetchedAt;
    } catch {
      // Keep last successful capacity so popups still show last-updated time.
    }

    const merged = mergeCapacity(
      vehicles.map((vehicle) => ({
        ...vehicle,
        PositionLastUpdated: vehiclesFetchedAt,
      })),
      capacityRecords,
      capacityFetchedAt
    );

    return Response.json(merged);
  } catch (error) {
    console.error("Failed to fetch vehicles from TransLoc", error);
    return Response.json(
      { error: "Failed to fetch vehicles" },
      { status: 502 }
    );
  }
}
