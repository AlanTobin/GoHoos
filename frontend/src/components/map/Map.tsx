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
import { useMapTheme } from "@/hooks/useMapTheme";
import MapThemeToggle from "@/components/map/MapThemeToggle";

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
  const styleUrlRef = useRef<string | null>(null);
  const handlersAttachedRef = useRef(false);
  const [mapReady, setMapReady] = useState(false);
  const { resolvedTheme, styleUrl, hydrated, toggleTheme } = useMapTheme();

  useEffect(() => {
    selectedRoutesRef.current = selectedRoutes;
  }, [selectedRoutes]);

  useEffect(() => {
    visibleVehiclesRef.current = visibleVehicles;
  }, [visibleVehicles]);

  useEffect(() => {
    if (!hydrated || !mapContainerRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: styleUrl,
      center: [-78.508, 38.0385],
      zoom: 13.5,
    });

    mapRef.current = map;
    styleUrlRef.current = styleUrl;
    handlersAttachedRef.current = false;

    const onStyleLoad = () => {
      addShapesLayer(map);
      addStopsLayer(map);
      addVehiclesLayer(map, visibleVehiclesRef.current);

      if (!handlersAttachedRef.current) {
        addStopClickHandler(map);
        addVehicleClickHandler(map);
        handlersAttachedRef.current = true;
      }

      applyMapFilters(map, selectedRoutesRef.current);
      setMapReady(true);
    };

    map.on("style.load", onStyleLoad);

    return () => {
      setMapReady(false);
      map.off("style.load", onStyleLoad);
      map.remove();
      mapRef.current = null;
    };
    // styleUrl at first hydrate only; later changes use setStyle below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  useEffect(() => {
    const map = mapRef.current;
    if (!hydrated || !map || styleUrlRef.current === styleUrl) return;
    styleUrlRef.current = styleUrl;
    setMapReady(false);
    map.setStyle(styleUrl);
  }, [styleUrl, hydrated]);

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
      {hydrated ? (
        <MapThemeToggle resolvedTheme={resolvedTheme} onToggle={toggleTheme} />
      ) : null}
    </div>
  );
}
