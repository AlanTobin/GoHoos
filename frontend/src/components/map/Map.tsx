"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { addStopsLayer, stopRouteFilter } from "@/lib/layers/stops";
import {
  addShapesLayer,
  setShapeRouteVisibility,
  shapesLayersReady,
} from "@/lib/layers/shapes";
import { addVehiclesLayer, updateVehiclesLayer } from "@/lib/layers/vehicles";
import { Vehicle } from "@/types/vehicle";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!;

function applyMapFilters(map: mapboxgl.Map, selectedRoutes: Set<string>) {
  setShapeRouteVisibility(map, selectedRoutes);
  map.setFilter("stops", stopRouteFilter(selectedRoutes));
}

interface Props {
  selectedRoutes: Set<string>;
  visibleVehicles: Vehicle[];
}

export default function Map({ selectedRoutes, visibleVehicles }: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const selectedRoutesRef = useRef<Set<string>>(selectedRoutes);
  const visibleVehiclesRef = useRef<Vehicle[]>(visibleVehicles);

  useEffect(() => {
    selectedRoutesRef.current = selectedRoutes;
  }, [selectedRoutes]);

  useEffect(() => {
    visibleVehiclesRef.current = visibleVehicles;
  }, [visibleVehicles]);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [-78.508, 38.0385],
      zoom: 13.5,
    });

    mapRef.current = map;

    map.on("load", () => {
      addShapesLayer(map);
      addStopsLayer(map);
      addVehiclesLayer(map, visibleVehiclesRef.current);
      applyMapFilters(map, selectedRoutesRef.current);
    });

    return () => map.remove();
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.getSource("vehicles")) return;
    updateVehiclesLayer(map, visibleVehicles);
  }, [visibleVehicles]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !shapesLayersReady(map)) return;
    applyMapFilters(map, selectedRoutes);
  }, [selectedRoutes]);

  return (
    <div className="absolute inset-0">
      <div ref={mapContainerRef} className="h-full w-full" />
    </div>
  );
}
