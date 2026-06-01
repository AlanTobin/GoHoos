import mapboxgl from "mapbox-gl";
import { vehiclesToGeoJSON } from "../geoJSON";
import { Vehicle } from "@/types/vehicle";

export function addVehiclesLayer(map: mapboxgl.Map, vehicles: Vehicle[]) {
  const geojson = vehiclesToGeoJSON(vehicles);

  map.addSource("vehicles", {
    type: "geojson",
    data: geojson,
  });

  map.addLayer({
    id: "vehicles",
    type: "circle",
    source: "vehicles",
    paint: {
        "circle-radius": 10,
        "circle-color": "#000000",
        "circle-stroke-width": 2,
        "circle-stroke-color": "#FFFFFF",
      }
  });
}

export function updateVehiclesLayer(map: mapboxgl.Map, vehicles: Vehicle[]) {
  const geojson = vehiclesToGeoJSON(vehicles);

  const source = map.getSource("vehicles") as mapboxgl.GeoJSONSource;
  if (source) {
    source.setData(geojson)
  };
}