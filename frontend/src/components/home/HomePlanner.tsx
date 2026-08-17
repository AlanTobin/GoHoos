"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import PlannerMap from "@/components/map/PlannerMap";
import PageBackdrop from "@/components/layout/PageBackdrop";
import {
  DestinationPickBar,
  LocationRequiredOverlay,
  TripResultsBar,
} from "@/components/home/TripPlannerPanel";
import TripStepTrail from "@/components/home/TripStepTrail";
import routeStops from "@/data/json/route-stops.json";
import { getVehicles } from "@/services/vehicles";
import { toRouteId } from "@/lib/routes";
import { snapToStop, type LatLng } from "@/lib/geo";
import { planTrips } from "@/lib/planTrips";
import { buildTripPathGeoJSON } from "@/lib/planner/buildTripPathGeoJSON";
import { boardAlightForTripStep } from "@/lib/planner/boardAlight";
import { buildPopularDestinationOptions } from "@/lib/planner/popularDestinations";
import { stepFocusTarget } from "@/lib/planner/stepFocusBounds";
import { stopIdsForTripStep } from "@/lib/planner/tripStepStops";
import type { PickedLocation, PlannerPickMode } from "@/types/planner";

const ALL_MAPPED_ROUTE_IDS = new Set(Object.keys(routeStops));
const CAMPUS_CENTER: LatLng = { lat: 38.0385, lon: -78.508 };

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

/** Destination is always the selected lat/lng; nearest stop is routing metadata only. */
function destinationFromPoint(
  point: LatLng,
  activeRouteIds: Set<string>
): PickedLocation {
  const snap = snapToStop(point, activeRouteIds, Infinity);
  if (snap) return toPickedLocation(point, snap);
  return {
    point,
    stopId: "",
    stopName: "Destination",
    walkMeters: 0,
  };
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
  const [pinTouched, setPinTouched] = useState(false);
  const [pickMode, setPickMode] = useState<PlannerPickMode>("idle");
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [geoPermission, setGeoPermission] = useState<GeoPermission>("unknown");
  const [selectedTripIndex, setSelectedTripIndex] = useState(0);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [tripsKey, setTripsKey] = useState("");
  const [itineraryOpen, setItineraryOpen] = useState(false);

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
    const interval = setInterval(fetchVehicles, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const mapRouteIds = useMemo(
    () => (activeRoutes.size > 0 ? activeRoutes : ALL_MAPPED_ROUTE_IDS),
    [activeRoutes]
  );

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
      setDraftDestination(destinationFromPoint(initialPoint, mapRouteIds));
      setPinTouched(false);
      setPickMode("picking-destination");
    },
    [userLocation, origin, mapRouteIds]
  );

  const handleDestinationPinMove = useCallback(
    (point: LatLng) => {
      setPinTouched(true);
      setDraftPinPoint(point);
      setDraftDestination(destinationFromPoint(point, mapRouteIds));
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
    if (!draftPinPoint) return;
    const picked =
      draftDestination ?? destinationFromPoint(draftPinPoint, mapRouteIds);
    setDestination({
      ...picked,
      point: draftPinPoint,
    });
    setPickMode("idle");
    setDraftPinPoint(null);
    setDraftDestination(null);
  }, [draftDestination, draftPinPoint, mapRouteIds]);

  const plannerRouteIds = useMemo(
    () => (activeRoutes.size > 0 ? activeRoutes : mapRouteIds),
    [activeRoutes, mapRouteIds]
  );

  const popularOptions = useMemo(
    () =>
      buildPopularDestinationOptions(origin, plannerRouteIds, mapRouteIds),
    [origin, plannerRouteIds, mapRouteIds]
  );

  const destinationShortcuts = useMemo(
    () =>
      popularOptions.map((option) => ({
        id: option.id,
        label: option.label,
        stopName: option.picked?.stopName ?? null,
        minutes: option.minutes,
        disabled: !option.picked,
      })),
    [popularOptions]
  );

  const handleSelectShortcut = useCallback(
    (id: string) => {
      const option = popularOptions.find((item) => item.id === id);
      if (!option?.picked) return;
      // Keep the popular place lat/lng as the destination endpoint.
      setDestination(option.picked);
      setDraftPinPoint(null);
      setDraftDestination(null);
      setPickMode("idle");
      setSelectedTripIndex(0);
      setActiveStepIndex(0);
      setItineraryOpen(false);
      setTripsKey("");
    },
    [popularOptions]
  );

  const handleChangeDestination = useCallback(() => {
    setDestination(null);
    setSelectedTripIndex(0);
    setActiveStepIndex(0);
    setItineraryOpen(false);
    setTripsKey("");
    beginDestinationPick(null);
  }, [beginDestinationPick]);

  const trips = useMemo(() => {
    if (!origin || !destination || isLoadingRoutes) return [];
    return planTrips({
      origin,
      destination,
      activeRouteIds: plannerRouteIds,
    });
  }, [origin, destination, plannerRouteIds, isLoadingRoutes]);

  const nextTripsKey = useMemo(
    () =>
      trips
        .map((trip) =>
          trip.steps
            .map((step) =>
              step.kind === "ride"
                ? `r:${step.routeId}:${step.fromStopId}:${step.toStopId}`
                : `w:${step.toStopId ?? "dest"}:${Math.round(step.meters)}`
            )
            .join(">")
        )
        .join("|"),
    [trips]
  );

  if (nextTripsKey !== tripsKey) {
    setTripsKey(nextTripsKey);
    setSelectedTripIndex(0);
    setActiveStepIndex(0);
    setItineraryOpen(false);
  }

  const safeSelectedTripIndex =
    trips.length === 0
      ? null
      : Math.min(selectedTripIndex, trips.length - 1);

  const selectedTrip =
    safeSelectedTripIndex !== null ? trips[safeSelectedTripIndex] ?? null : null;

  const detailTrip = itineraryOpen ? selectedTrip : null;

  const tripPath = useMemo(() => {
    if (!origin || !destination || !detailTrip) return null;
    return buildTripPathGeoJSON(detailTrip, origin, destination);
  }, [origin, destination, detailTrip]);

  const boardAlight = useMemo(() => {
    if (!detailTrip) return null;
    return boardAlightForTripStep(detailTrip, activeStepIndex);
  }, [detailTrip, activeStepIndex]);

  const visibleStopIds = useMemo(() => {
    if (!detailTrip) return null;
    return stopIdsForTripStep(detailTrip, activeStepIndex);
  }, [detailTrip, activeStepIndex]);

  const highlightedRouteIds = useMemo(() => {
    if (!detailTrip) return null;
    // Full shape only while on a ride step; walks keep the route hidden.
    if (boardAlight) return new Set([boardAlight.routeId]);
    return new Set<string>();
  }, [detailTrip, boardAlight]);

  const stepFocus = useMemo(() => {
    if (!detailTrip || !origin || !destination) return null;
    return stepFocusTarget(
      detailTrip,
      activeStepIndex,
      origin,
      destination,
      tripPath
    );
  }, [detailTrip, activeStepIndex, origin, destination, tripPath]);

  const handleSelectTrip = useCallback((index: number) => {
    setSelectedTripIndex(index);
    setActiveStepIndex(0);
    setItineraryOpen(true);
  }, []);

  const handleBackToRoutes = useCallback(() => {
    setItineraryOpen(false);
    setActiveStepIndex(0);
  }, []);

  return (
    <div className="relative h-full min-h-0 w-full overflow-hidden">
      <PageBackdrop variant="home" />
      <PlannerMap
        activeRoutes={mapRouteIds}
        highlightedRouteIds={
          pickMode === "idle" && destination ? highlightedRouteIds : null
        }
        visibleStopIds={
          pickMode === "idle" && destination ? visibleStopIds : null
        }
        tripPath={pickMode === "idle" && destination ? tripPath : null}
        activeStepIndex={
          pickMode === "idle" && destination ? activeStepIndex : null
        }
        stepFocus={pickMode === "idle" && destination ? stepFocus : null}
        boardAlight={pickMode === "idle" && destination ? boardAlight : null}
        originStopId={
          pickMode === "idle" && destination
            ? boardAlight?.boardStopId ?? null
            : null
        }
        destinationStopId={
          pickMode === "idle" && destination
            ? boardAlight?.alightStopId ?? null
            : null
        }
        originPoint={mapOriginPoint}
        walkRangeCenter={null}
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
          onConfirm={handleConfirmDestination}
          pinTouched={pinTouched}
          shortcuts={destinationShortcuts}
          shortcutsLoading={!origin || isLoadingRoutes}
          onSelectShortcut={handleSelectShortcut}
        />
      ) : destination ? (
        itineraryOpen && detailTrip ? (
          <TripStepTrail
            trip={detailTrip}
            activeStepIndex={activeStepIndex}
            onStepFocus={setActiveStepIndex}
            destinationLabel="Your destination"
            onBackToRoutes={handleBackToRoutes}
            onChangeDestination={handleChangeDestination}
          />
        ) : (
          <TripResultsBar
            trips={trips}
            selectedTripIndex={null}
            isLoadingRoutes={isLoadingRoutes}
            onSelectTrip={handleSelectTrip}
            onChangeDestination={handleChangeDestination}
          />
        )
      ) : null}
    </div>
  );
}
