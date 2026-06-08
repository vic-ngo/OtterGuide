import type { GeoPoint } from "./filters";

/**
 * Geocode a free-text location (city or ZIP) to coordinates using the free
 * OpenStreetMap Nominatim service. Biased to the US. Returns null if nothing
 * sensible is found.
 */
export async function geocodeLocation(query: string): Promise<GeoPoint | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;

  // A bare 5-digit ZIP geocodes more reliably as a postal code.
  const isZip = /^\d{5}$/.test(trimmed);
  const params = new URLSearchParams({
    q: isZip ? `${trimmed}, USA` : trimmed,
    format: "json",
    limit: "1",
    countrycodes: "us",
  });

  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Geocoding failed (${res.status})`);
  const json = await res.json();
  if (Array.isArray(json) && json.length > 0) {
    return { lat: Number(json[0].lat), lng: Number(json[0].lon) };
  }
  return null;
}
