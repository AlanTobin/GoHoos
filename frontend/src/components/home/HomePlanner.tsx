"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import PlannerMap from "@/components/map/PlannerMap";
import PageBackdrop from "@/components/layout/PageBackdrop";
import {
  DestinationPickBar,
  LocationRequiredOverlay,
  TripResultsBar,
} from "@/components/home/TripPlannerPanel";
import routeStops from "@/data/json/route-stops.json";
import { getVehicles } from "@/services/vehicles";
import { toRouteId } from "@/lib/routes";
import { snapToStop, type LatLng } from "@/lib/geo";
import type { PickedLocation, PlannerPickMode } from "@/types/planner";

const ALL_MAPPED_ROUTE_IDS = new Set(Object.keys(routeStops));
const CAMPUS_CENTER: LatLng = { lat: 38.0385, lon: -78.508 };

/** Set to false to use real browser geolocation again. */
const USE_MOCK_USER_LOCATION = true;
const MOCK_USER_LOCATION: LatLng = {
  lat: 38.04778,
  lon: -78.51361,
}; // Faulkner Residences, UVA

function toPickedLocation(
  point: LatLng,
  snap: NonNullable<ReturnType<typeof snapToStop>>
): PickedLocation {
  return {
    point,
    stopId: snap.stop.stop_id,
    stopName: snap.stop.stop_name,
    walkMeters: snap.walkMeters,
  };
}

function snapDestination(
  point: LatLng,
  activeRouteIds: Set<string>
): PickedLocation | null {
  const snap = snapToStop(point, activeRouteIds, Infinity);
  return snap ? toPickedLocation(point, snap) : null;
}

type GeoPermission = "unknown" | "granted" | "prompt" | "denied";

export default function HomePlanner() {
  const [activeRoutes, setActiveRoutes] = useState<Set<string>>(new Set());
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(true);
  const [origin, setOrigin] = useState<PickedLocation | null>(null);
  const [destination, setDestination] = useState<PickedLocation | null>(null);
  const [draftDestination, setDraftDestination] = useState<PickedLocation | null>(
    null
  );
  const [draftPinPoint, setDraftPinPoint] = useState<LatLng | null>(null);
  const [pickMode, setPickMode] = useState<PlannerPickMode>("idle");
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [geoPermission, setGeoPermission] = useState<GeoPermission>("unknown");

  useEffect(() => {
    let isMounted = true;

    const fetchVehicles = async () => {
      try {
        const data = await getVehicles();
        if (!isMounted) return;
        setActiveRoutes(new Set(data.map((v) => toRouteId(v.RouteID))));
      } catch {
        if (isMounted) setActiveRoutes(new Set());
      } finally {
        if (isMounted) setIsLoadingRoutes(false);
      }
    };

    fetchVehicles();
    const interval = setInterval(fetchVehicles, 15000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const mapRouteIds = useMemo(
    () => (activeRoutes.size > 0 ? activeRoutes : ALL_MAPPED_ROUTE_IDS),
    [activeRoutes]
  );

  const walkRangeCenter = userLocation ?? origin?.point ?? null;
  const mapOriginPoint = userLocation ?? origin?.point ?? null;

  const applyUserPoint = useCallback(
    (point: LatLng) => {
      setUserLocation(point);
      setGeoError(null);

      const snap = snapToStop(point, mapRouteIds);
      if (snap) {
        setOrigin(toPickedLocation(point, snap));
      } else {
        setOrigin(null);
        setGeoError("No bus stops within walking distance from your location.");
      }
      setGeoLoading(false);
    },
    [mapRouteIds]
  );

  const handleUseLocation = useCallback(() => {
    setGeoLoading(true);
    setGeoError(null);

    if (USE_MOCK_USER_LOCATION) {
      setGeoPermission("granted");
      applyUserPoint(MOCK_USER_LOCATION);
      return;
    }

    if (!navigator.geolocation) {
      setGeoPermission("denied");
      setGeoError("Geolocation is not supported in this browser.");
      setGeoLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGeoPermission("granted");
        applyUserPoint({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
      },
      (error) => {
        setGeoLoading(false);
        setUserLocation(null);
        setOrigin(null);
        if (error.code === error.PERMISSION_DENIED) {
          setGeoPermission("denied");
          setGeoError(
            "Location access was blocked. Enable it in your browser’s site settings, then try again."
          );
        } else {
          setGeoError("Could not get your location. Please try again.");
        }
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }, [applyUserPoint]);

  useEffect(() => {
    let cancelled = false;

    async function initGeolocation() {
      if (USE_MOCK_USER_LOCATION) {
        handleUseLocation();
        return;
      }

      if (!navigator.geolocation) {
        setGeoPermission("denied");
        setGeoError("Geolocation is not supported in this browser.");
        return;
      }

      try {
        const result = await navigator.permissions.query({ name: "geolocation" });
        if (cancelled) return;

        const state = result.state as GeoPermission;
        setGeoPermission(state);

        if (state === "granted" || state === "prompt") {
          handleUseLocation();
        }

        result.onchange = () => {
          if (cancelled) return;
          const next = result.state as GeoPermission;
          setGeoPermission(next);
          if (next === "granted") {
            handleUseLocation();
          }
        };
      } catch {
        handleUseLocation();
      }
    }

    initGeolocation();

    return () => {
      cancelled = true;
    };
  }, [handleUseLocation]);

  const beginDestinationPick = useCallback(
    (existing: PickedLocation | null) => {
      const initialPoint =
        existing?.point ?? userLocation ?? origin?.point ?? CAMPUS_CENTER;
      setDraftPinPoint(initialPoint);
      setDraftDestination(snapDestination(initialPoint, mapRouteIds));
      setPickMode("picking-destination");
    },
    [userLocation, origin, mapRouteIds]
  );

  const handleDestinationPinMove = useCallback(
    (point: LatLng) => {
      setDraftPinPoint(point);
      setDraftDestination(snapDestination(point, mapRouteIds));
    },
    [mapRouteIds]
  );

  const locationBlocked =
    geoPermission === "denied" || Boolean(geoError && !userLocation && !geoLoading);

  useEffect(() => {
    if (locationBlocked || !userLocation || pickMode !== "idle" || destination) {
      return;
    }
    beginDestinationPick(null);
  }, [locationBlocked, userLocation, pickMode, destination, beginDestinationPick]);

  const handleConfirmDestination = useCallback(() => {
    if (!draftPinPoint || !draftDestination) return;
    setDestination({
      ...draftDestination,
      point: draftPinPoint,
    });
    setPickMode("idle");
    setDraftPinPoint(null);
    setDraftDestination(null);
  }, [draftDestination, draftPinPoint]);

  const handleChangeDestination = useCallback(() => {
    setDestination(null);
    beginDestinationPick(null);
  }, [beginDestinationPick]);

  return (
    <div className="relative h-full min-h-0 w-full overflow-hidden">
      <PageBackdrop variant="home" />
      <PlannerMap
        activeRoutes={mapRouteIds}
        originStopId={null}
        destinationStopId={null}
        originPoint={mapOriginPoint}
        walkRangeCenter={walkRangeCenter}
        pickingDestination={pickMode === "picking-destination"}
        destinationPinPoint={
          pickMode === "picking-destination"
            ? draftPinPoint
            : destination?.point ?? null
        }
        onDestinationPinMove={handleDestinationPinMove}
      />

      {locationBlocked ? (
        <LocationRequiredOverlay
          geoLoading={geoLoading}
          geoError={geoError}
          onUseLocation={handleUseLocation}
        />
      ) : pickMode === "picking-destination" ? (
        <DestinationPickBar
          draftDestination={draftDestination}
          onConfirm={handleConfirmDestination}
        />
      ) : destination ? (
        <TripResultsBar onChangeDestination={handleChangeDestination} />
      ) : null}
    </div>
  );
}
