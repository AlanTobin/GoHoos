import mapboxgl from "mapbox-gl";
import routes from "@/data/json/routes.json";
import { vehiclesToGeoJSON } from "../geoJSON";
import { toRouteId } from "@/lib/routes";
import { Vehicle } from "@/types/vehicle";

const ARROW_COLOR: mapboxgl.Expression = ["concat", "#", ["get", "arrowColor"]];
const MARKER_ICON: mapboxgl.Expression = [
  "concat",
  "vehicle-marker-",
  ["to-string", ["get", "id"]],
];

const routeColorById = new Map(
  routes.map((route) => [
    route.route_id,
    String(route.route_color).replace(/^#/, ""),
  ])
);

function vehicleCapacity(vehicle: Vehicle) {
  return Math.max(0, Math.min(100, vehicle.Capacity ?? 0));
}

function drawVehicleMarkerImage(routeColor: string, capacity: number) {
  const size = 48;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const center = size / 2;
  const bodyRadius = 12;
  const ringRadius = 15;
  const ringWidth = 3;

  ctx.clearRect(0, 0, size, size);

  ctx.beginPath();
  ctx.arc(center, center, bodyRadius, 0, Math.PI * 2);
  ctx.fillStyle = `#${routeColor.replace(/^#/, "")}`;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(center, center, ringRadius, 0, Math.PI * 2);
  ctx.strokeStyle = "#444444";
  ctx.lineWidth = ringWidth;
  ctx.stroke();

  if (capacity > 0) {
    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + (capacity / 100) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(center, center, ringRadius, startAngle, endAngle);
    ctx.strokeStyle = "#FF2222";
    ctx.lineWidth = ringWidth;
    ctx.lineCap = "round";
    ctx.stroke();
  }

  return ctx.getImageData(0, 0, size, size);
}

function syncVehicleMarkerImages(map: mapboxgl.Map, vehicles: Vehicle[]) {
  for (const vehicle of vehicles) {
    const routeColor =
      routeColorById.get(toRouteId(vehicle.RouteID)) ?? "888888";
    const imageData = drawVehicleMarkerImage(
      routeColor,
      vehicleCapacity(vehicle)
    );
    if (!imageData) continue;

    const imageId = `vehicle-marker-${vehicle.VehicleID}`;
    if (map.hasImage(imageId)) {
      map.updateImage(imageId, imageData);
    } else {
      map.addImage(imageId, imageData, { pixelRatio: 2 });
    }
  }
}

function addVehicleArrowIcon(map: mapboxgl.Map) {
  if (map.hasImage("vehicle-arrow")) return;

  const size = 32;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.moveTo(size / 2, 6);
  ctx.lineTo(size - 8, size - 9);
  ctx.lineTo(size / 2, size - 13);
  ctx.lineTo(8, size - 9);
  ctx.closePath();
  ctx.fill();

  map.addImage("vehicle-arrow", ctx.getImageData(0, 0, size, size), { sdf: true });
}

function addVehicleLayers(map: mapboxgl.Map) {
  map.addLayer({
    id: "vehicles-marker",
    type: "symbol",
    source: "vehicles",
    layout: {
      "icon-image": MARKER_ICON,
      "icon-size": 1.6,
      "icon-allow-overlap": true,
      "icon-ignore-placement": true,
    },
  });

  map.addLayer({
    id: "vehicles-arrow",
    type: "symbol",
    source: "vehicles",
    layout: {
      "icon-image": "vehicle-arrow",
      "icon-size": 0.48,
      "icon-rotate": ["get", "heading"],
      "icon-rotation-alignment": "map",
      "icon-allow-overlap": true,
      "icon-ignore-placement": true,
    },
    paint: {
      "icon-color": ARROW_COLOR,
      "icon-opacity": 1,
    },
  });
}

export function addVehiclesLayer(map: mapboxgl.Map, vehicles: Vehicle[]) {
  addVehicleArrowIcon(map);
  syncVehicleMarkerImages(map, vehicles);

  map.addSource("vehicles", {
    type: "geojson",
    data: vehiclesToGeoJSON(vehicles),
  });

  addVehicleLayers(map);
}

export function updateVehiclesLayer(map: mapboxgl.Map, vehicles: Vehicle[]) {
  syncVehicleMarkerImages(map, vehicles);

  const source = map.getSource("vehicles") as mapboxgl.GeoJSONSource | undefined;
  if (source) {
    source.setData(vehiclesToGeoJSON(vehicles));
  }
}

const VEHICLE_LAYERS = ["vehicles-marker", "vehicles-arrow"];

function formatSpeed(speed: number) {
  return speed < 1 ? "Stopped" : `${Math.round(speed)} mph`;
}

function formatLastUpdated(lastUpdated: unknown) {
  const ms = Number(lastUpdated);
  if (!ms) return "";

  return new Date(ms).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function lastUpdatedBadge(value: unknown, title: string) {
  const formatted = formatLastUpdated(value);
  if (!formatted) return "";

  return `<span title="${title}" style="display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:999px;background:#ecfdf5;color:#15803d;font-size:11px;line-height:1;white-space:nowrap;flex-shrink:0;">
    <span class="gohoos-fresh-dot" style="width:6px;height:6px;border-radius:50%;background:#22c55e;flex-shrink:0;"></span>
    ${formatted}
  </span>`;
}

function popupStyles() {
  return `<style>
    @keyframes gohoos-fresh-pulse {
      0%, 100% {
        background: #22c55e;
        box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
      }
      50% {
        background: #86efac;
        box-shadow: 0 0 0 4px rgba(34, 197, 94, 0);
      }
    }
    .gohoos-fresh-dot {
      animation: gohoos-fresh-pulse 1.2s ease-in-out infinite;
    }
  </style>`;
}

function popupRow(label: string, badge: string) {
  return `<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;color:#374151;">
    <span>${label}</span>
    ${badge}
  </div>`;
}

function vehiclePopupHtml(properties: GeoJSON.GeoJsonProperties) {
  const routeColor = `#${String(properties?.routeColor ?? "888888").replace(/^#/, "")}`;
  const routeName = String(properties?.routeName ?? "Unknown route");
  const routeDesc = properties?.routeDesc ? String(properties.routeDesc) : "";
  const occupancy = Number(properties?.occupancy ?? 0);
  const maxPassengers = Number(properties?.maxPassengers ?? 50);
  const speedLabel = formatSpeed(Number(properties?.speed ?? 0));

  const routeDescHtml = routeDesc
    ? `<span style="color:#6b7280;font-weight:400;"> ${routeDesc}</span>`
    : "";

  const occupancyBadge = lastUpdatedBadge(
    properties?.occupancyLastUpdated,
    "Occupancy last updated"
  );
  const positionBadge = lastUpdatedBadge(
    properties?.positionLastUpdated,
    "Position last updated"
  );

  return `
    ${popupStyles()}
    <div style="font-family:system-ui,sans-serif;font-size:14px;line-height:1.45;padding:2px 0;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
        <span style="width:12px;height:12px;border-radius:50%;background:${routeColor};flex-shrink:0;"></span>
        <span style="font-weight:600;color:#111827;">${routeName}</span>${routeDescHtml}
      </div>
      ${popupRow(`${occupancy} / ${maxPassengers} passengers`, occupancyBadge)}
      ${popupRow(speedLabel, positionBadge)}
    </div>
  `;
}

export function addVehicleClickHandler(map: mapboxgl.Map) {
  const popup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: true,
    offset: 14,
    maxWidth: "260px",
  });

  const showVehiclePopup = (
    event: mapboxgl.MapMouseEvent & { features?: mapboxgl.GeoJSONFeature[] }
  ) => {
    const feature = event.features?.[0];
    if (!feature?.geometry || feature.geometry.type !== "Point") return;

    popup
      .setLngLat(event.lngLat)
      .setHTML(vehiclePopupHtml(feature.properties))
      .addTo(map);
  };

  for (const layerId of VEHICLE_LAYERS) {
    map.on("click", layerId, showVehiclePopup);
    map.on("mouseenter", layerId, () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", layerId, () => {
      map.getCanvas().style.cursor = "";
    });
  }
}
