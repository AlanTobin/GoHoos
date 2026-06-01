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
  }