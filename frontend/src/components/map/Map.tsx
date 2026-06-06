"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { addStopsLayer } from "@/lib/layers/stops";
import { addShapesLayer } from "@/lib/layers/shapes";
import { addVehiclesLayer, updateVehiclesLayer } from "@/lib/layers/vehicles";
import { getVehicles } from "@/services/vehicles";

mapboxgl.accessToken =
  process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!;

export default function Map() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [selectedShapeID, setSelectedShapeID] = useState<string | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [-78.508, 38.0385], // UVA
      zoom: 13.5,
    });
  
    map.on("load", async () => {
      addStopsLayer(map);
      addShapesLayer(map);

    map.on("click", "shapes", (e) => {
        const selection = e.features?.[0]?.properties?.id;
        setSelectedShapeID(current => {
          if (current === selection) {
            map.setFilter("shapes", null);
            return null;
          }
          map.setFilter("shapes", [
            "==",
            ["get", "id"],
            selection,
          ]);
          return selection;
        });
      });
      
    map.on("click", (e) => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: ["shapes"],
        });
      
        if (features.length === 0) {
          setSelectedShapeID(null);
          map.setFilter("shapes", null);
        }
      });
      
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