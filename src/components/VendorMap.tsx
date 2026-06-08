"use client";

import { useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import type { Vendor } from "@/lib/types";
import { pinnableLocations, type GeoPoint } from "@/lib/filters";

interface MapPoint {
  vendorId: string;
  vendorName: string;
  label?: string;
  lat: number;
  lng: number;
}

interface VendorMapProps {
  vendors: Vendor[];
  hoveredId: string | null;
  userPoint?: GeoPoint | null;
  onHover: (id: string | null) => void;
  onSelect: (vendor: Vendor) => void;
}

const userIcon = L.divIcon({
  className: "",
  html: `<span style="
    display:block;width:18px;height:18px;
    background:#2563eb;border:3px solid #fff;border-radius:50%;
    box-shadow:0 0 0 4px rgba(37,99,235,.25);
  "></span>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

function makeIcon(active: boolean): L.DivIcon {
  const size = active ? 30 : 22;
  const color = active ? "#7c3aed" : "#111111";
  return L.divIcon({
    className: "",
    html: `<span style="
      display:block;width:${size}px;height:${size}px;
      background:${color};border:3px solid #fff;border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,.35);
    "></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

function FitBounds({
  points,
  userPoint,
}: {
  points: MapPoint[];
  userPoint?: GeoPoint | null;
}) {
  const map = useMap();
  const all = useMemo(
    () =>
      userPoint ? [...points, { lat: userPoint.lat, lng: userPoint.lng }] : points,
    [points, userPoint]
  );
  const key = all.map((p) => `${p.lat},${p.lng}`).join("|");
  const prevKey = useRef<string>("");

  useEffect(() => {
    if (key === prevKey.current) return;
    prevKey.current = key;
    if (all.length === 0) return;
    const bounds = L.latLngBounds(all.map((p) => [p.lat, p.lng]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
  }, [key, all, map]);

  return null;
}

export default function VendorMap({
  vendors,
  hoveredId,
  userPoint,
  onHover,
  onSelect,
}: VendorMapProps) {
  const vendorById = useMemo(
    () => new Map(vendors.map((v) => [v.id, v])),
    [vendors]
  );

  const points = useMemo<MapPoint[]>(
    () =>
      vendors.flatMap((v) =>
        pinnableLocations(v).map((l) => ({
          vendorId: v.id,
          vendorName: v.name,
          label: l.label,
          lat: l.lat as number,
          lng: l.lng as number,
        }))
      ),
    [vendors]
  );

  return (
    <MapContainer
      center={[37.7749, -122.2]}
      zoom={9}
      scrollWheelZoom
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds points={points} userPoint={userPoint} />
      {userPoint && (
        <Marker position={[userPoint.lat, userPoint.lng]} icon={userIcon}>
          <Popup>Your search location</Popup>
        </Marker>
      )}
      {points.map((p, i) => {
        const active = p.vendorId === hoveredId;
        return (
          <Marker
            key={`${p.vendorId}-${i}`}
            position={[p.lat, p.lng]}
            icon={makeIcon(active)}
            zIndexOffset={active ? 1000 : 0}
            eventHandlers={{
              mouseover: () => onHover(p.vendorId),
              mouseout: () => onHover(null),
              click: () => {
                const v = vendorById.get(p.vendorId);
                if (v) onSelect(v);
              },
            }}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-semibold text-foreground">{p.vendorName}</p>
                {p.label && <p className="text-ink-500">{p.label}</p>}
                <button
                  type="button"
                  onClick={() => {
                    const v = vendorById.get(p.vendorId);
                    if (v) onSelect(v);
                  }}
                  className="mt-1 font-semibold text-accent underline"
                >
                  View details
                </button>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
