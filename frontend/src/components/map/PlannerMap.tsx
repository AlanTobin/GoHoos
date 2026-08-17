"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  addStopsLayer,
  updateStopHighlights,
  updateStopsLayer,
  updateStopsLayerByIds,
} from "@/lib/layers/stops";
import {
  addShapesLayer,
  setShapeRouteVisibility,
  shapesLayersReady,
} from "@/lib/layers/shapes";
import {
  addWalkRangeLayer,
  updateWalkRangeLayer,
} from "@/lib/layers/walkRange";
import {
  addPlannerMarkersLayer,
  updatePlannerMarkersLayer,
} from "@/lib/layers/plannerMarkers";
import {
  addTripPathLayer,
  setTripPathActiveStep,
  updateTripPathLayer,
} from "@/lib/layers/tripPath";
import { createDestinationPinElement } from "@/lib/planner/createDestinationPinElement";
import { createBoardAlightArrowElement } from "@/lib/planner/createBoardAlightArrowElement";
import type { BoardAlightMarkers } from "@/lib/planner/boardAlight";
import type { StepFocusTarget } from "@/lib/planner/stepFocusBounds";
import type { LatLng } from "@/lib/geo";
import type { FeatureCollection, LineString } from "geojson";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!;

interface Props {
  activeRoutes: Set<string>;
  /** When set, only these route shapes stay visible. */
  highlightedRouteIds: Set<string> | null;
  /** When set, only these stop dots are shown for the active step. */
  visibleStopIds: string[] | null;
  tripPath: FeatureCollection<LineString> | null;
  activeStepIndex: number | null;
  stepFocus: StepFocusTarget | null;
  boardAlight: BoardAlightMarkers | null;
  originStopId: string | null;
  destinationStopId: string | null;
  originPoint: LatLng | null;
  walkRangeCenter: LatLng | null;
  pickingDestination: boolean;
  destinationPinPoint: LatLng | null;
  onDestinationPinMove: (point: LatLng) => void;
}

export default function PlannerMap({
  activeRoutes,
  highlightedRouteIds,
  visibleStopIds,
  tripPath,
  activeStepIndex,
  stepFocus,
  boardAlight,
  originStopId,
  destinationStopId,
  originPoint,
  walkRangeCenter,
  pickingDestination,
  destinationPinPoint,
  onDestinationPinMove,
}: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const destMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const boardMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const alightMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const activeRoutesRef = useRef(activeRoutes);
  const onDestinationPinMoveRef = useRef(onDestinationPinMove);
  const pickingRef = useRef(pickingDestination);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    activeRoutesRef.current = activeRoutes;
  }, [activeRoutes]);

  useEffect(() => {
    onDestinationPinMoveRef.current = onDestinationPinMove;
  }, [onDestinationPinMove]);

  useEffect(() => {
    pickingRef.current = pickingDestination;
  }, [pickingDestination]);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [-78.508, 38.0385],
      zoom: 15,
    });

    mapRef.current = map;

    map.on("load", () => {
      addShapesLayer(map);
      addStopsLayer(map);
      addWalkRangeLayer(map);
      addPlannerMarkersLayer(map);
      addTripPathLayer(map);
      updateStopsLayer(map, activeRoutesRef.current);
      setShapeRouteVisibility(map, activeRoutesRef.current);
      setMapReady(true);
    });

    return () => {
      destMarkerRef.current?.remove();
      destMarkerRef.current = null;
      boardMarkerRef.current?.remove();
      boardMarkerRef.current = null;
      alightMarkerRef.current?.remove();
      alightMarkerRef.current = null;
      setMapReady(false);
      map.remove();
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;
    const visibleRoutes = highlightedRouteIds ?? activeRoutes;
    if (visibleStopIds) {
      updateStopsLayerByIds(map, visibleStopIds);
    } else {
      updateStopsLayer(map, visibleRoutes);
    }
    if (shapesLayersReady(map)) {
      setShapeRouteVisibility(map, visibleRoutes);
    }
  }, [activeRoutes, highlightedRouteIds, visibleStopIds, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;
    updateTripPathLayer(map, tripPath);
    setTripPathActiveStep(map, tripPath ? activeStepIndex : null);
  }, [tripPath, activeStepIndex, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;

    const clearBoardAlight = () => {
      boardMarkerRef.current?.remove();
      boardMarkerRef.current = null;
      alightMarkerRef.current?.remove();
      alightMarkerRef.current = null;
    };

    if (!boardAlight) {
      clearBoardAlight();
      return;
    }

    const boardLngLat: [number, number] = [
      boardAlight.board.lon,
      boardAlight.board.lat,
    ];
    const alightLngLat: [number, number] = [
      boardAlight.alight.lon,
      boardAlight.alight.lat,
    ];

    // Recreate so arrow artwork stays in sync (tip on stop, label outward).
    boardMarkerRef.current?.remove();
    alightMarkerRef.current?.remove();

    boardMarkerRef.current = new mapboxgl.Marker({
      element: createBoardAlightArrowElement("get-on"),
      anchor: "bottom",
      offset: [0, 0],
    })
      .setLngLat(boardLngLat)
      .addTo(map);

    alightMarkerRef.current = new mapboxgl.Marker({
      element: createBoardAlightArrowElement("get-off"),
      anchor: "bottom",
      offset: [0, 0],
    })
      .setLngLat(alightLngLat)
      .addTo(map);
  }, [boardAlight, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map || !stepFocus) return;

    const padding = pickSheetCameraPadding();
    const duration = 900;
    const easing = cameraEaseOut;

    if (stepFocus.mode === "center") {
      map.easeTo({
        center: [stepFocus.point.lon, stepFocus.point.lat],
        zoom: Math.min(stepFocus.zoom, 15),
        essential: true,
        duration,
        easing,
        padding,
      });
      return;
    }

    const bounds = new mapboxgl.LngLatBounds();
    for (const point of stepFocus.points) {
      bounds.extend([point.lon, point.lat]);
    }
    if (bounds.isEmpty()) return;

    map.fitBounds(bounds, {
      padding,
      maxZoom: 15,
      duration,
      essential: true,
      easing,
    });
  }, [stepFocus, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;
    updateStopHighlights(map, originStopId, destinationStopId);
  }, [originStopId, destinationStopId, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;
    updatePlannerMarkersLayer(map, originPoint);
  }, [originPoint, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;
    updateWalkRangeLayer(map, walkRangeCenter);
  }, [walkRangeCenter, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;

    if (!destinationPinPoint) {
      destMarkerRef.current?.remove();
      destMarkerRef.current = null;
      return;
    }

    const reportPinPosition = () => {
      const lngLat = destMarkerRef.current?.getLngLat();
      if (!lngLat) return;
      onDestinationPinMoveRef.current({ lat: lngLat.lat, lon: lngLat.lng });
    };

    if (!destMarkerRef.current) {
      const marker = new mapboxgl.Marker({
        element: createDestinationPinElement(),
        draggable: pickingDestination,
        anchor: "bottom",
      })
        .setLngLat([destinationPinPoint.lon, destinationPinPoint.lat])
        .addTo(map);

      if (pickingDestination) {
        marker.on("drag", reportPinPosition);
        marker.on("dragend", reportPinPosition);
      }

      destMarkerRef.current = marker;
      return;
    }

    destMarkerRef.current
      .setLngLat([destinationPinPoint.lon, destinationPinPoint.lat])
      .setDraggable(pickingDestination);
  }, [destinationPinPoint, pickingDestination, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map || !originPoint) return;
    if (stepFocus || boardAlight || (tripPath && tripPath.features.length > 0)) {
      return;
    }
    if (pickingDestination) {
      // Keep the user centered in the map strip above the pick sheet.
      flyToPoint(map, originPoint, 15, pickSheetCameraPadding());
      return;
    }
    flyToPoint(map, originPoint);
  }, [
    originPoint,
    mapReady,
    tripPath,
    boardAlight,
    stepFocus,
    pickingDestination,
  ]);

  return (
    <div className="absolute inset-0 min-h-0">
      <div ref={mapContainerRef} className="h-full w-full" />
    </div>
  );
}

/** Matches PlannerSheet (~42dvh) so the camera centers in the visible map. */
export function pickSheetCameraPadding(): mapboxgl.PaddingOptions {
  if (typeof window === "undefined") {
    return { top: 64, bottom: 220, left: 36, right: 36 };
  }
  const bottom = Math.max(Math.round(window.innerHeight * 0.3), 210);
  return { top: 64, bottom, left: 36, right: 36 };
}

/** Soft ease-out — avoids Mapbox flyTo’s zoom-out-then-in arc. */
function cameraEaseOut(t: number): number {
  return 1 - Math.pow(1 - t, 2.6);
}

export function flyToPoint(
  map: mapboxgl.Map,
  point: LatLng,
  zoom = 16,
  padding?: mapboxgl.PaddingOptions
) {
  map.easeTo({
    center: [point.lon, point.lat],
    zoom,
    essential: true,
    duration: 850,
    easing: cameraEaseOut,
    ...(padding ? { padding } : {}),
  });
}
