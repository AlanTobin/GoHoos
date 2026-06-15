"use client";

import { useState, useEffect, useMemo } from "react";
import Map from "@/components/map/Map";
import RouteSelector from "@/components/sidebar/RouteSelector";
import routesData from "@/data/json/routes.json";
import { getVehicles } from "@/services/vehicles";
import { toRouteId } from "@/lib/routes";
import { Vehicle } from "@/types/vehicle";
import { Route } from "@/types/route";

export default function RoutesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedRoutes, setSelectedRoutes] = useState<Set<string>>(new Set());
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let initialized = false;
  
    const fetchVehicles = async () => {
      try {
        const data = await getVehicles();
        if (!isMounted) return;

        setVehicles(data);
        setIsLoadingVehicles(false);

        // only set selected routes on very first fetch
        if (!initialized) {
          setSelectedRoutes(new Set(data.map(v => toRouteId(v.RouteID))));
          initialized = true;
        }
      } catch (err) {
        console.error("Failed to fetch vehicles", err);
        if (isMounted) setIsLoadingVehicles(false);
      }
    };
  
    fetchVehicles();
    const interval = setInterval(fetchVehicles, 15000);
  
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const routesWithVehicles = new Set(
    vehicles.map(v => toRouteId(v.RouteID))
  );
  function toggleRoute(routeId: string) {
    console.log("toggleRoute", routeId);
    setSelectedRoutes(prev => {
      const next = new Set(prev);
      if (next.has(routeId)) next.delete(routeId);
      else next.add(routeId);
      return next;
    });
  }

  const visibleVehicles = useMemo(
    () => vehicles.filter(v => selectedRoutes.has(toRouteId(v.RouteID))),
    [vehicles, selectedRoutes]
  );

  return (
    <div className="relative h-screen w-full overflow-hidden">
      <Map
        selectedRoutes={selectedRoutes}
        visibleVehicles={visibleVehicles}
      />
      <RouteSelector
        routes={routesData as Route[]}
        routesWithVehicles={routesWithVehicles}
        selectedRoutes={selectedRoutes}
        onToggle={toggleRoute}
        onSetSelectedRoutes={setSelectedRoutes}
        isLoading={isLoadingVehicles}
      />
    </div>
  );
}