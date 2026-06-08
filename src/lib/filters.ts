import type { Vendor, VendorLocation } from "./types";

export interface Filters {
  query: string;
  categories: string[];
  subcategories: string[];
  cities: string[];
  funding: string[];
  /** When true, only show vendors that offer an online/remote option. */
  online: boolean;
}

export const emptyFilters: Filters = {
  query: "",
  categories: [],
  subcategories: [],
  cities: [],
  funding: [],
  online: false,
};

/**
 * Subcategories that roll up under the "Sports" group filter. Selecting
 * "Sports" matches a vendor with ANY of these, while each vendor still keeps
 * (and displays) its own specific subcategory chips like "Open play".
 */
// Stored lowercase so membership checks are case-insensitive (the source data
// mixes casing, e.g. "Ninja warrior" vs "Ninja Warrior").
export const SPORTS_GROUP = new Set([
  "sports",
  "youth sports",
  "climbing",
  "dance",
  "yoga",
  "ninja warrior",
  "parkour",
  "open play",
  "karate",
  "jiu jitsu",
  "martial arts",
  "gymnastics",
  "aerial",
]);

/** Does this vendor belong to the broad "Sports" group? */
export function inSportsGroup(vendor: Vendor): boolean {
  return vendor.subcategories.some((s) => SPORTS_GROUP.has(s.toLowerCase()));
}

// Therapy-type services. The "Therapy" group filter matches any vendor in a
// therapy category or with a therapy-style service (Speech, OT, ABA, etc.) —
// this replaces the former standalone "Speech" and "Social skills" tiles.
const THERAPY_CATEGORIES = new Set(["therapy"]);
const THERAPY_GROUP = new Set([
  "speech",
  "occupational",
  "physical",
  "feeding",
  "aba",
  "early intervention",
  "social skills group",
  "aac",
  "dir floortime",
  "behavior",
]);

export function inTherapyGroup(vendor: Vendor): boolean {
  return (
    vendor.categories.some((c) => THERAPY_CATEGORIES.has(c.toLowerCase())) ||
    vendor.subcategories.some((s) => THERAPY_GROUP.has(s.toLowerCase()))
  );
}

// Coaching / employment support.
export function inCoachingGroup(vendor: Vendor): boolean {
  return (
    vendor.categories.some((c) => c.toLowerCase() === "coaching") ||
    vendor.subcategories.some((s) => s.toLowerCase() === "employment")
  );
}

/**
 * Popular-tile values that filter by a broad group (matched via a predicate)
 * rather than an exact subcategory string.
 */
export const GROUP_PREDICATES: Record<string, (vendor: Vendor) => boolean> = {
  Sports: inSportsGroup,
  Therapy: inTherapyGroup,
  Coaching: inCoachingGroup,
};

export interface FacetCount {
  value: string;
  count: number;
}

export interface Facets {
  categories: FacetCount[];
  subcategories: FacetCount[];
  cities: FacetCount[];
  funding: FacetCount[];
}

function tally(values: string[]): FacetCount[] {
  const map = new Map<string, number>();
  for (const v of values) map.set(v, (map.get(v) ?? 0) + 1);
  return [...map.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => a.value.localeCompare(b.value));
}

/** Build the set of available filter options (with vendor counts) from the data. */
export function buildFacets(vendors: Vendor[]): Facets {
  return {
    categories: tally(vendors.flatMap((v) => v.categories)),
    subcategories: tally(vendors.flatMap((v) => v.subcategories)),
    cities: tally(
      // Count each vendor once per city it has a location in.
      vendors.flatMap((v) => [...new Set(v.locations.map((l) => l.city).filter(Boolean))])
    ),
    funding: tally(vendors.flatMap((v) => v.fundingAccepted)),
  };
}

function matchesQuery(vendor: Vendor, filters: Filters): boolean {
  const q = filters.query.trim().toLowerCase();
  if (!q) return true;
  // Match the query against vendor name, any category, or any subcategory.
  return (
    vendor.name.toLowerCase().includes(q) ||
    vendor.categories.some((c) => c.toLowerCase().includes(q)) ||
    vendor.subcategories.some((s) => s.toLowerCase().includes(q))
  );
}

/** Apply all active filters and return the matching vendors. */
export function filterVendors(vendors: Vendor[], filters: Filters): Vendor[] {
  return vendors.filter((vendor) => {
    if (!matchesQuery(vendor, filters)) return false;

    if (
      filters.categories.length &&
      !filters.categories.some((c) => vendor.categories.includes(c))
    ) {
      return false;
    }
    if (
      filters.subcategories.length &&
      !filters.subcategories.some((s) => {
        const predicate = GROUP_PREDICATES[s];
        return predicate ? predicate(vendor) : vendor.subcategories.includes(s);
      })
    ) {
      return false;
    }
    if (filters.funding.length && !filters.funding.some((f) => vendor.fundingAccepted.includes(f))) {
      return false;
    }
    if (filters.cities.length) {
      const vendorCities = new Set(vendor.locations.map((l) => l.city));
      if (!filters.cities.some((c) => vendorCities.has(c))) return false;
    }
    if (filters.online && !vendor.locations.some((l) => l.online)) return false;
    return true;
  });
}

export function activeFilterCount(filters: Filters): number {
  return (
    filters.categories.length +
    filters.subcategories.length +
    filters.cities.length +
    filters.funding.length +
    (filters.online ? 1 : 0)
  );
}

/** Haversine distance in miles between two coordinates. */
export function distanceMiles(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 3958.8;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Locations that can be shown on a map (have coordinates, not region-wide). */
export function pinnableLocations(vendor: Vendor): VendorLocation[] {
  return vendor.locations.filter((l) => l.lat != null && l.lng != null && !l.regionWide);
}

export interface GeoPoint {
  lat: number;
  lng: number;
}

/** Distance (miles) from a point to the vendor's nearest pinnable location. */
export function nearestDistanceMiles(vendor: Vendor, point: GeoPoint): number | null {
  const pins = pinnableLocations(vendor);
  if (pins.length === 0) return null;
  let best = Infinity;
  for (const l of pins) {
    const d = distanceMiles(point, { lat: l.lat as number, lng: l.lng as number });
    if (d < best) best = d;
  }
  return best;
}

/** Sort vendors by proximity to a point; vendors without coordinates sort last. */
export function sortByDistance(vendors: Vendor[], point: GeoPoint): Vendor[] {
  return [...vendors].sort((a, b) => {
    const da = nearestDistanceMiles(a, point);
    const db = nearestDistanceMiles(b, point);
    if (da == null && db == null) return a.name.localeCompare(b.name);
    if (da == null) return 1;
    if (db == null) return -1;
    return da - db;
  });
}

/**
 * Short, human-friendly summary of where a vendor can be reached. Combines
 * physical locations with "Online" and region-wide (in-home) availability so a
 * vendor offering both a physical site and online shows both.
 */
/** Physical (non-online, non-region-wide) locations, whether or not geocoded. */
export function physicalLocations(vendor: Vendor): VendorLocation[] {
  return vendor.locations.filter((l) => !l.online && !l.regionWide);
}

export function locationSummary(vendor: Vendor): string {
  const physical = physicalLocations(vendor);
  const cities = [...new Set(physical.map((l) => l.city).filter(Boolean))];
  const parts: string[] = [];

  if (physical.length === 1) {
    parts.push(cities[0] || physical[0].address || physical[0].label || "");
  } else if (physical.length > 1) {
    parts.push(
      `${physical.length} locations` +
        (cities.length ? ` · ${cities.slice(0, 2).join(", ")}` : "") +
        (cities.length > 2 ? "…" : "")
    );
  }

  if (vendor.locations.some((l) => l.regionWide)) parts.push("Bay Area (in-home)");
  if (vendor.locations.some((l) => l.online)) parts.push("Online");

  return parts.filter(Boolean).join(" · ") || "Location varies";
}
