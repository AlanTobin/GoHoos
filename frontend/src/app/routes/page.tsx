"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Map from "@/components/map/Map";
import RouteSelector from "@/components/sidebar/RouteSelector";
import PageBackdrop from "@/components/layout/PageBackdrop";
import routesData from "@/data/json/routes.json";
import { getVehicles } from "@/services/vehicles";
import { getMockVehicles } from "@/services/mockVehicles";
import { toRouteId } from "@/lib/routes";
import { Vehicle } from "@/types/vehicle";
import { Route } from "@/types/route";

function RoutesPageContent() {
  const searchParams = useSearchParams();
  const isMockup = searchParams.get("mockup") === "1";

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedRoutes, setSelectedRoutes] = useState<Set<string>>(new Set());
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(true);

  useEffect(() => {
    if (isMockup) {
      const data = getMockVehicles();
      setVehicles(data);
      setSelectedRoutes(new Set(data.map((v) => toRouteId(v.RouteID))));
      setIsLoadingVehicles(false);
      return;
    }

    let isMounted = true;
    let initialized = false;

    const fetchVehicles = async () => {
      try {
        const data = await getVehicles();
        if (!isMounted) return;

        setVehicles(data);
        setIsLoadingVehicles(false);

        if (!initialized) {
          setSelectedRoutes(new Set(data.map((v) => toRouteId(v.RouteID))));
          initialized = true;
        }
      } catch (err) {
        console.error("Failed to fetch vehicles", err);
        if (isMounted) {
          setVehicles([]);
          setIsLoadingVehicles(false);
        }
      }
    };

    fetchVehicles();
    const interval = setInterval(fetchVehicles, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isMockup]);

  const routesWithVehicles = new Set(
    vehicles.map((v) => toRouteId(v.RouteID))
  );

  function toggleRoute(routeId: string) {
    setSelectedRoutes((prev) => {
      const next = new Set(prev);
      if (next.has(routeId)) next.delete(routeId);
      else next.add(routeId);
      return next;
    });
  }

  const visibleVehicles = useMemo(
    () => vehicles.filter((v) => selectedRoutes.has(toRouteId(v.RouteID))),
    [vehicles, selectedRoutes]
  );

  return (
    <div className="relative h-full min-h-0 w-full overflow-hidden">
      {!isMockup ? <PageBackdrop variant="routes" /> : null}
      {isMockup ? (
        <div className="absolute left-1/2 top-3 z-30 -translate-x-1/2 rounded-full bg-uva-navy/90 px-4 py-1.5 text-xs font-medium text-white shadow-md">
          Screenshot mode — sample data only
        </div>
      ) : null}
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

export default function RoutesPage() {
  return (
    <Suspense>
      <RoutesPageContent />
    </Suspense>
  );
}
