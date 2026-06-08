# Vendor Directory

A healthcare-directory-style finder that helps Regional Center / Self-Determination Program clients locate vendors who already accept payment from a Regional Center or a Financial Management System (FMS). Inspired by in-network provider finders like Collective Health.

Built with Next.js (App Router) + React + Tailwind CSS, with an interactive map powered by Leaflet + OpenStreetMap (no API keys required).

## Features

- Search vendors **by category/service** or **by name**
- Filter by funding accepted, category, service type, and city
- Split view: scrollable results list alongside an interactive map with pins
- Two-way highlighting between the list and map (hover a card to highlight its pins, and vice versa)
- Vendor detail drawer with contact info, all locations, a mini-map, and call/website actions
- Bookmark vendors (saved in the browser via `localStorage`)
- Vendors whose location is "San Francisco Bay Area" are treated as in-home, region-wide services (not pinned to a single address)

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Data pipeline

Vendor data lives in `src/data/vendors.json`, generated from `scripts/vendors.csv` by a build script that:

1. Parses the CSV and groups location rows by vendor.
2. Derives a city for each address (matched against known Bay Area cities).
3. Geocodes each address to latitude/longitude via OpenStreetMap Nominatim, caching results in `scripts/geocode-cache.json` so re-runs are fast and polite to the free endpoint.

To regenerate the data after editing `scripts/vendors.csv`:

```bash
npm run build-data
```

Geocoding is cached, so only new or changed addresses trigger network lookups.

## Project structure

- `src/app/page.tsx` — loads the dataset and renders the directory
- `src/components/DirectoryApp.tsx` — top-level state (filters, selection, bookmarks, layout)
- `src/components/SearchBar.tsx` — search input + category/name toggle + city selector
- `src/components/FilterPanel.tsx` — faceted filters with counts
- `src/components/VendorList.tsx` / `VendorCard.tsx` — results list
- `src/components/VendorMap.tsx` — Leaflet map with per-location pins (client-only)
- `src/components/VendorDetail.tsx` — vendor detail drawer
- `src/lib/` — types, filtering/search helpers, formatting, and the bookmarks hook

## Notes

Listings reflect vendors known to accept Regional Center or FMS payment. Availability and funding should be confirmed directly with each vendor before scheduling services.
