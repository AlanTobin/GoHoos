export interface Vehicle {
    VehicleID: number;
    RouteID: number;
    Latitude: number;
    Longitude: number;
    GroundSpeed: number;
    Heading: number;
    IsDelayed: boolean;
    IsOnRoute: boolean;
    Name: string;
    Seconds: number;
    TimeStamp: string;
    /** Bus capacity fill, 0–100. */
    Capacity?: number;
    /** Current passenger count. */
    Occupancy?: number;
    /** Maximum passenger capacity. */
    MaxPassengers?: number;
    /** When this bus position was last seen in the vehicles API response. */
    PositionLastUpdated?: number;
    /** When occupancy data was last received for this bus. */
    OccupancyLastUpdated?: number;
  }