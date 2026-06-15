import type { Stop } from "@/types/stop";
import type { ShapePoint } from "@/types/shapes";
import type { Vehicle } from "@/types/vehicle";
import { toRouteId, isGoldYellow } from "@/lib/routes";
import routes from "@/data/json/routes.json";
import { FeatureCollection, Point, LineString } from "geojson";

const routeColorById = new Map(
  routes.map((route) => [
    route.route_id,
    String(route.route_color).replace(/^#/, ""),
  ])
);

const routeById = new Map(routes.map((route) => [route.route_id, route]));

function vehicleArrowColor(routeColor: string) {
  return isGoldYellow(routeColor) ? "333333" : "ffffff";
}

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
        features: vehicles.map(vehicle => {
            const route = toRouteId(vehicle.RouteID);
            const routeColor = routeColorById.get(route) ?? "888888";
            const routeMeta = routeById.get(route);

            return {
            type: "Feature",
            geometry: { type: "Point", coordinates: [vehicle.Longitude, vehicle.Latitude] },
            properties: {
                id: vehicle.VehicleID,
                name: vehicle.Name,
                route,
                routeName: routeMeta?.route_long_name ?? route,
                routeDesc: routeMeta?.route_desc ?? "",
                routeColor,
                arrowColor: vehicleArrowColor(routeColor),
                speed: vehicle.GroundSpeed,
                heading: vehicle.Heading,
                capacity: Math.max(0, Math.min(100, vehicle.Capacity ?? 0)),
                occupancy: vehicle.Occupancy ?? 0,
                maxPassengers: vehicle.MaxPassengers ?? 50,
                delayed: vehicle.IsDelayed,
                on_route: vehicle.IsOnRoute,
                seconds: vehicle.Seconds,
                timestamp: vehicle.TimeStamp,
                positionLastUpdated: vehicle.PositionLastUpdated ?? null,
                occupancyLastUpdated: vehicle.OccupancyLastUpdated ?? null,
            }
        };
        })
    }
  }