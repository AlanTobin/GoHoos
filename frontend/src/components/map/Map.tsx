"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { addStopsLayer, addStopClickHandler, updateStopsLayer } from "@/lib/layers/stops";
import {
  addShapesLayer,
  setShapeRouteVisibility,
  shapesLayersReady,
} from "@/lib/layers/shapes";
import { addVehiclesLayer, addVehicleClickHandler, updateVehiclesLayer } from "@/lib/layers/vehicles";
import { Vehicle } from "@/types/vehicle";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!;

function applyMapFilters(map: mapboxgl.Map, selectedRoutes: Set<string>) {
  if (map.getSource("stops")) {
    updateStopsLayer(map, selectedRoutes);
  }
  if (shapesLayersReady(map)) {
    setShapeRouteVisibility(map, selectedRoutes);
  }
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
  const [mapReady, setMapReady] = useState(false);

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
      addStopClickHandler(map);
      addVehiclesLayer(map, visibleVehiclesRef.current);
      addVehicleClickHandler(map);
      applyMapFilters(map, selectedRoutesRef.current);
      setMapReady(true);
    });

    return () => {
      setMapReady(false);
      map.remove();
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.getSource("vehicles")) return;
    updateVehiclesLayer(map, visibleVehicles);
  }, [visibleVehicles]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;
    applyMapFilters(map, selectedRoutes);
  }, [selectedRoutes, mapReady]);

  return (
    <div className="absolute inset-0 min-h-0">
      <div ref={mapContainerRef} className="h-full w-full" />
    </div>
  );
}
