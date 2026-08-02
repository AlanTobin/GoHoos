"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  addStopsLayer,
  updateStopHighlights,
  updateStopsLayer,
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
import { createDestinationPinElement } from "@/lib/planner/createDestinationPinElement";
import type { LatLng } from "@/lib/geo";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!;

interface Props {
  activeRoutes: Set<string>;
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
      updateStopsLayer(map, activeRoutesRef.current);
      setShapeRouteVisibility(map, activeRoutesRef.current);
      setMapReady(true);
    });

    return () => {
      destMarkerRef.current?.remove();
      destMarkerRef.current = null;
      setMapReady(false);
      map.remove();
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;
    updateStopsLayer(map, activeRoutes);
    if (shapesLayersReady(map)) {
      setShapeRouteVisibility(map, activeRoutes);
    }
  }, [activeRoutes, mapReady]);

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

    destMarkerRef.current.setDraggable(pickingDestination);
  }, [destinationPinPoint, pickingDestination, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map || !originPoint) return;
    flyToPoint(map, originPoint);
  }, [originPoint, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map || !pickingDestination || !destinationPinPoint) return;
    flyToPoint(map, destinationPinPoint, 15);
  }, [pickingDestination, mapReady]);

  return (
    <div className="absolute inset-0 min-h-0">
      <div ref={mapContainerRef} className="h-full w-full" />
    </div>
  );
}

export function flyToPoint(map: mapboxgl.Map, point: LatLng, zoom = 16) {
  map.flyTo({ center: [point.lon, point.lat], zoom, essential: true });
}
