import type { Stop } from "@/types/stop";
import type { ShapePoint } from "@/types/shapes";
import type { Vehicle } from "@/types/vehicle";
import { toRouteId } from "@/lib/routes";
import { FeatureCollection, Point, LineString } from "geojson";

export function stopsToGeoJSON(stops: Stop[]): FeatureCollection<Point> {
    return {
        type: "FeatureCollection",
        features: stops.map(stop => ({
            type: "Feature",
            geometry: { type: "Point", coordinates: [stop.stop_lon, stop.stop_lat] },
            properties: {
                id: stop.stop_id,
                name: stop.stop_name,
                code: stop.stop_code,
                description: stop.stop_desc,
                location_type: stop.location_type,
                parent_station: stop.parent_station,
                routeIds: stop.routeIds,
            }
        }))
    }
  }
  
  export function shapesToGeoJSON(shapes: ShapePoint[], routesMap: Map<string, string>): FeatureCollection<LineString> {
    const buckets = new Map<string, ShapePoint[]>();
    for (const shape of shapes) {
        if (!buckets.has(shape.shape_id)) {
            buckets.set(shape.shape_id, []);
        }
        buckets.get(shape.shape_id)?.push(shape);
    }

    const features: FeatureCollection<LineString> = {
        type: "FeatureCollection",
        features: []
    };
    for (const [shape_id, group] of buckets.entries()) {
        const sortedGroup = group.toSorted((a, b) => a.shape_pt_sequence - b.shape_pt_sequence);
        features.features.push({
            type: "Feature",
            geometry: { type: "LineString", coordinates: sortedGroup.map(point => [point.shape_pt_lon, point.shape_pt_lat]) },
            properties: { id: shape_id, routeColor: routesMap.get(shape_id) ?? "#888888" }
        });
    }
    return features;
  }
  
  export function vehiclesToGeoJSON(vehicles: Vehicle[]): FeatureCollection<Point> {
    return {
        type: "FeatureCollection",
        features: vehicles.map(vehicle => ({
            type: "Feature",
            geometry: { type: "Point", coordinates: [vehicle.Longitude, vehicle.Latitude] },
            properties: {
                id: vehicle.VehicleID,
                name: vehicle.Name,
                route: toRouteId(vehicle.RouteID),
                speed: vehicle.GroundSpeed,
                heading: vehicle.Heading,
                delayed: vehicle.IsDelayed,
                on_route: vehicle.IsOnRoute,
                seconds: vehicle.Seconds,
                timestamp: vehicle.TimeStamp
            }
        }))
    }
  }