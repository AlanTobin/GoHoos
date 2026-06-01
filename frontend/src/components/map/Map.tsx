"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { addStopsLayer } from "@/lib/layers/stops";
import { addShapesLayer } from "@/lib/layers/shapes";
import { addVehiclesLayer, updateVehiclesLayer } from "@/lib/layers/vehicles";
import { getVehicles } from "@/services/vehicles";

mapboxgl.accessToken =
  process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!;

export default function Map() {
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [-78.508, 38.0385], // UVA
      zoom: 14,
    });

    map.on("load", async () => {
      addStopsLayer(map);
      addShapesLayer(map);
      
      
      const vehicles = await getVehicles();
      addVehiclesLayer(map, vehicles);

      setInterval(async () => {
        const vehicles = await getVehicles();
        updateVehiclesLayer(map, vehicles);
      }, 1000);
    });

    return () => map.remove();
  }, []);

  return (
    <div
      ref={mapContainerRef}
      className="h-screen w-full"
    />
  );
}