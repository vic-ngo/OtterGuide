// Builds src/data/vendors.json from scripts/vendors.csv.
//
// Steps:
//   1. Parse the CSV (RFC-4180-ish: handles quoted fields with commas).
//   2. Group location rows by vendor (name + contact + category).
//   3. Derive the city from each address.
//   4. Geocode each unique address via OpenStreetMap Nominatim, caching
//      results to scripts/geocode-cache.json so re-runs are instant and we
//      stay polite to the free endpoint.
//   5. Emit src/data/vendors.json with coordinates baked in.
//
// Run with: npm run build-data

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const CSV_PATH = join(__dirname, "vendors.csv");
const CACHE_PATH = join(__dirname, "geocode-cache.json");
const OUT_PATH = join(ROOT, "src", "data", "vendors.json");

const NOMINATIM = "https://nominatim.openstreetmap.org/search";
const USER_AGENT =
  "vendor-directory/0.1 (Regional Center vendor directory; build script)";

/** Minimal CSV parser supporting quoted fields and escaped quotes. */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

function splitList(value) {
  return (value || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

// Keep each vendor's real subcategories (e.g. "Open play", "Climbing", "Yoga").
// Grouping sports-type activities under a single "Sports" filter is handled in
// the app (see SPORTS_GROUP in src/lib/filters.ts) so the original chips stay
// visible. Here we only fix up obvious spelling/casing variants.
const sentenceCase = (s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

// Built from the data: maps a lowercased subcategory to its canonical casing so
// values that differ only by capitalization (e.g. "Ninja warrior" vs "Ninja
// Warrior") collapse into one service type. Acronyms like "STEM" or "AAC" only
// ever appear in a single casing, so their canonical form is themselves.
let SUBCATEGORY_CANONICAL = new Map();

/**
 * Choose one canonical casing per distinct (case-insensitive) subcategory.
 * Preference: most frequent variant, then a sentence-cased variant if present,
 * then first-seen — never invents a new casing (so acronyms stay intact).
 */
function buildSubcategoryCanonical(rows, scIdx) {
  const groups = new Map();
  for (const r of rows) {
    for (const raw of splitList(r[scIdx])) {
      const value = raw.toLowerCase() === "arts" ? "Art" : raw;
      const key = value.toLowerCase();
      if (!groups.has(key)) groups.set(key, []);
      const arr = groups.get(key);
      const found = arr.find((e) => e.value === value);
      if (found) found.count++;
      else arr.push({ value, count: 1, order: arr.length });
    }
  }
  const canonical = new Map();
  for (const [key, arr] of groups) {
    arr.sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      const aPref = a.value === sentenceCase(a.value) ? 0 : 1;
      const bPref = b.value === sentenceCase(b.value) ? 0 : 1;
      if (aPref !== bPref) return aPref - bPref;
      return a.order - b.order;
    });
    canonical.set(key, arr[0].value);
  }
  return canonical;
}

function normalizeSubcategory(value) {
  const lower = value.toLowerCase();
  if (lower === "arts") return "Art";
  return SUBCATEGORY_CANONICAL.get(lower) ?? value;
}

// Known Bay Area cities present in (or relevant to) the dataset. Order longer
// multi-word names first so "South San Francisco" wins over "San Francisco".
const KNOWN_CITIES = [
  // Multi-word names first so the longest match wins (handled below too).
  "South San Francisco",
  "San Francisco",
  "San Mateo",
  "San Bruno",
  "San Jose",
  "San Leandro",
  "San Lorenzo",
  "San Pablo",
  "San Rafael",
  "San Ramon",
  "San Carlos",
  "San Anselmo",
  "Santa Clara",
  "Santa Rosa",
  "Redwood City",
  "Daly City",
  "Foster City",
  "Half Moon Bay",
  "Mountain View",
  "Walnut Creek",
  "Rohnert Park",
  "Palo Alto",
  "Los Altos",
  "Menlo Park",
  "Corte Madera",
  "El Cerrito",
  // Single-word names.
  "Hillsborough",
  "Hayward",
  "Concord",
  "Sunnyvale",
  "Antioch",
  "Millbrae",
  "Burlingame",
  "Richmond",
  "Berkeley",
  "Oakland",
  "Belmont",
  "Emeryville",
  "Pinole",
  "Fremont",
  "Vallejo",
  "Alameda",
  "Alamo",
  "Cupertino",
  "Dublin",
  "Lafayette",
  "Livermore",
  "Moraga",
  "Napa",
  "Novato",
  "Orinda",
  "Pacifica",
  "Pleasanton",
  "Saratoga",
  "Sausalito",
  "Stanford",
  "Fairfield",
  "Marin",
];

/**
 * Derive a "City" label by matching known Bay Area cities. A street can share a
 * city's name (e.g. "434 San Mateo Ave, San Bruno"), so we collect every match,
 * drop matches contained within a longer one ("San Francisco" inside "South San
 * Francisco"), and keep the match closest to the end (nearest the state/zip).
 */
function deriveCity(text) {
  if (!text) return "";
  const haystack = text.replace(/\s+/g, " ");
  const matches = [];
  for (const city of KNOWN_CITIES) {
    const re = new RegExp(`\\b${city.replace(/ /g, "\\s+")}\\b`, "gi");
    let m;
    while ((m = re.exec(haystack)) !== null) {
      matches.push({ city, start: m.index, end: m.index + m[0].length });
    }
  }
  if (matches.length === 0) return "";

  const kept = matches.filter(
    (a) =>
      !matches.some((b) => b !== a && b.start <= a.start && b.end >= a.end && b.end - b.start > a.end - a.start)
  );
  kept.sort((a, b) => a.start - b.start);
  return kept[kept.length - 1].city;
}

/** Strip suite/unit/range fragments that confuse the geocoder. */
function cleanAddressForGeocode(address) {
  return address
    .replace(/\s*#\s*\d+\w*/gi, " ")
    .replace(/\b(?:suite|ste|unit|apt)\s*#?\s*\w+/gi, " ")
    .replace(/\s*-\s*\d+\b/g, " ")
    .replace(/\b\d{1,4}\s*,/g, ",") // stray "600," style fragments
    .replace(/\s{2,}/g, " ")
    .replace(/\s+,/g, ",")
    .trim();
}

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function loadCache() {
  if (existsSync(CACHE_PATH)) {
    try {
      const raw = JSON.parse(readFileSync(CACHE_PATH, "utf8"));
      // Drop previous misses so improved queries get another chance.
      for (const k of Object.keys(raw)) if (raw[k] == null) delete raw[k];
      return raw;
    } catch {
      return {};
    }
  }
  return {};
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function queryNominatim(q) {
  const params = new URLSearchParams({
    q,
    format: "json",
    limit: "1",
    countrycodes: "us",
  });
  const res = await fetch(`${NOMINATIM}?${params}`, {
    headers: { "User-Agent": USER_AGENT },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  await sleep(1100); // Nominatim asks for <=1 request/second.
  if (Array.isArray(json) && json.length > 0) {
    return { lat: Number(json[0].lat), lng: Number(json[0].lon) };
  }
  return null;
}

async function geocode(address, cache, city) {
  if (cache[address]) return cache[address];

  // Try, in order: raw address, suite-stripped address, "city, CA".
  const attempts = [address];
  const cleaned = cleanAddressForGeocode(address);
  if (cleaned && cleaned !== address) attempts.push(cleaned);
  if (city) attempts.push(`${city}, CA`);

  let coords = null;
  for (const q of attempts) {
    try {
      coords = await queryNominatim(q);
    } catch (err) {
      console.warn(`  ! geocode error for "${q}": ${err.message}`);
    }
    if (coords) break;
  }

  cache[address] = coords;
  // Persist after each lookup so an interruption keeps progress.
  writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
  return coords;
}

async function main() {
  const csv = readFileSync(CSV_PATH, "utf8");
  const rows = parseCsv(csv);
  const header = rows.shift();
  const idx = Object.fromEntries(header.map((h, i) => [h.trim(), i]));

  // Resolve canonical subcategory casing up front so the vendor loop can
  // consolidate values that differ only by capitalization.
  SUBCATEGORY_CANONICAL = buildSubcategoryCanonical(rows, idx["Subcategories"]);

  const cache = loadCache();
  const vendors = new Map();

  for (const r of rows) {
    const name = (r[idx["Vendor name"]] || "").trim();
    if (!name) continue;
    const contactName = (r[idx["Contact name"]] || "").trim();
    // Group by vendor (name + contact) so the same vendor appearing under
    // several categories/locations collapses into one tile.
    const key = `${name}|${contactName}`;

    if (!vendors.has(key)) {
      vendors.set(key, {
        name,
        categories: [],
        subcategories: [],
        fundingAccepted: splitList(r[idx["Funding accepted"]]),
        contactName: contactName || undefined,
        email: (r[idx["Email"]] || "").trim() || undefined,
        phone: (r[idx["Phone"]] || "").trim() || undefined,
        website: (r[idx["Website"]] || "").trim() || undefined,
        locations: [],
        _locKeys: new Set(),
      });
    }

    const vendor = vendors.get(key);

    // Merge categories (a cell may list several comma-separated categories).
    for (const cat of splitList(r[idx["Category"]])) {
      if (!vendor.categories.includes(cat)) vendor.categories.push(cat);
    }
    // Merge any additional subcategories seen on later rows, rolling all
    // sport-type activities (yoga, climbing, dance, etc.) up into "Sports".
    for (const raw of splitList(r[idx["Subcategories"]])) {
      const sc = normalizeSubcategory(raw);
      if (!vendor.subcategories.includes(sc)) vendor.subcategories.push(sc);
    }

    const address = (r[idx["Address"]] || "").trim();
    const label = (r[idx["Location"]] || "").trim();
    // "San Francisco Bay Area" / "Bay Area" -> in-home, region-wide service.
    const regionWide = /\bbay area\b/i.test(label) || /\bbay area\b/i.test(address);
    // "Online" location with no physical address -> remote/online service.
    const online = /\bonline\b/i.test(label) && !address;

    // Dedupe locations (e.g. an "Online" row repeated per category row).
    const locKey = `${label}|${address}`;
    if (vendor._locKeys.has(locKey)) continue;
    vendor._locKeys.add(locKey);

    vendor.locations.push({
      label: label || undefined,
      address,
      city: regionWide
        ? "San Francisco Bay Area"
        : online
          ? ""
          : deriveCity(address) || deriveCity(label),
      regionWide: regionWide || undefined,
      online: online || undefined,
    });
  }

  const list = [...vendors.values()];
  // Assign stable, unique ids from the vendor name.
  const usedIds = new Set();
  for (const vendor of list) {
    delete vendor._locKeys;
    const base = slugify(vendor.name) || "vendor";
    let id = base;
    let n = 2;
    while (usedIds.has(id)) id = `${base}-${n++}`;
    usedIds.add(id);
    vendor.id = id;
  }
  const totalLocations = list.reduce((n, v) => n + v.locations.length, 0);
  console.log(
    `Parsed ${list.length} vendors / ${totalLocations} locations. Geocoding...`
  );

  let done = 0;
  for (const vendor of list) {
    for (const loc of vendor.locations) {
      if (!loc.address || loc.regionWide) {
        done++;
        continue;
      }
      const coords = await geocode(loc.address, cache, loc.city);
      if (coords) {
        loc.lat = coords.lat;
        loc.lng = coords.lng;
      }
      done++;
      if (done % 10 === 0) console.log(`  geocoded ${done}/${totalLocations}`);
    }
  }

  // Stable ordering by vendor name.
  list.sort((a, b) => a.name.localeCompare(b.name));

  const missing = list
    .flatMap((v) => v.locations)
    .filter((l) => l.address && (l.lat == null || l.lng == null)).length;

  writeFileSync(OUT_PATH, JSON.stringify(list, null, 2));
  console.log(
    `Wrote ${OUT_PATH}\n  ${list.length} vendors, ${totalLocations} locations, ${missing} without coordinates.`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
