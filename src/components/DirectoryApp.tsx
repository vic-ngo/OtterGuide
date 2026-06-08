"use client";

import { useCallback, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import type { Vendor } from "@/lib/types";
import {
  buildFacets,
  emptyFilters,
  filterVendors,
  activeFilterCount,
  sortByDistance,
  type Filters,
  type GeoPoint,
} from "@/lib/filters";
import { geocodeLocation } from "@/lib/geocode";
import { useBookmarks } from "@/lib/bookmarks";
import SearchBar from "./SearchBar";
import FilterPanel from "./FilterPanel";
import PopularCategories from "./PopularCategories";
import VendorList from "./VendorList";
import VendorDetail from "./VendorDetail";

// Leaflet touches `window`, so the map is client-only.
const VendorMap = dynamic(() => import("./VendorMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-ink-100 text-sm text-ink-400">
      Loading map…
    </div>
  ),
});

type FilterGroup = "categories" | "subcategories" | "cities" | "funding";
type MobileView = "list" | "map";

export default function DirectoryApp({ vendors }: { vendors: Vendor[] }) {
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [activeVendor, setActiveVendor] = useState<Vendor | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [showBookmarked, setShowBookmarked] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [mobileView, setMobileView] = useState<MobileView>("list");

  // Location-based proximity search (user enters a city or ZIP).
  const [userPoint, setUserPoint] = useState<GeoPoint | null>(null);
  const [locationLabel, setLocationLabel] = useState("Search location");
  const [searchingLocation, setSearchingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const bookmarks = useBookmarks();
  const facets = useMemo(() => buildFacets(vendors), [vendors]);

  const submitLocation = useCallback(async (text: string) => {
    setSearchingLocation(true);
    setLocationError(null);
    try {
      const point = await geocodeLocation(text);
      if (point) {
        setUserPoint(point);
        setLocationLabel(text);
      } else {
        setLocationError(`Couldn't find "${text}".`);
      }
    } catch {
      setLocationError("Location lookup failed. Try again.");
    } finally {
      setSearchingLocation(false);
    }
  }, []);

  const results = useMemo(() => {
    let list = filterVendors(vendors, filters);
    if (showBookmarked) list = list.filter((v) => bookmarks.ids.has(v.id));
    if (userPoint) list = sortByDistance(list, userPoint);
    return list;
  }, [vendors, filters, showBookmarked, bookmarks.ids, userPoint]);

  const activeCount = activeFilterCount(filters);

  function toggleFacet(group: FilterGroup, value: string) {
    setFilters((prev) => {
      const current = prev[group];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [group]: next };
    });
  }

  function resetFilters() {
    setFilters((prev) => ({
      ...emptyFilters,
      query: prev.query,
    }));
    setShowBookmarked(false);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-ink-200 bg-background">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                OtterGuide
              </h1>
              <p className="mt-1 max-w-xl text-sm text-ink-500">
                Find vendors who already accept payments through Regional Center
                or an FMS
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowBookmarked((v) => !v)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                showBookmarked
                  ? "bg-accent text-white"
                  : "border border-ink-200 bg-white text-foreground hover:border-ink-300"
              }`}
            >
              <BookmarkIcon filled={showBookmarked} />
              <span className="hidden sm:inline">Saved</span>
              {bookmarks.count > 0 && (
                <span
                  className={`rounded-full px-1.5 text-xs ${
                    showBookmarked ? "bg-white/25 text-white" : "bg-ink-100 text-ink-600"
                  }`}
                >
                  {bookmarks.count}
                </span>
              )}
            </button>
          </div>

          <div className="mt-5">
            <SearchBar
              query={filters.query}
              locationLabel={locationLabel}
              searchingLocation={searchingLocation}
              locationError={locationError}
              onQueryChange={(query) => setFilters((p) => ({ ...p, query }))}
              onSubmitLocation={submitLocation}
            />
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-5 sm:px-6">
        <div className="mb-5">
          <PopularCategories
            selected={filters.subcategories}
            online={filters.online}
            onSelect={(value) => toggleFacet("subcategories", value)}
            onToggleOnline={() =>
              setFilters((p) => ({ ...p, online: !p.online }))
            }
          />
        </div>

        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-sm text-ink-600">
            <span className="font-semibold text-foreground">
              {results.length}
            </span>{" "}
            {results.length === 1 ? "vendor" : "vendors"}
            {showBookmarked && " saved"}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-ink-300 bg-white px-3 py-1.5 text-sm font-semibold text-ink-700 lg:hidden"
            >
              <SlidersIcon />
              Filters
              {activeCount > 0 && (
                <span className="rounded-full bg-accent px-1.5 text-xs font-semibold text-white">
                  {activeCount}
                </span>
              )}
            </button>

            <div className="inline-flex rounded-lg border border-ink-300 bg-white p-0.5 lg:hidden">
              <SegButton
                active={mobileView === "list"}
                onClick={() => setMobileView("list")}
              >
                List
              </SegButton>
              <SegButton
                active={mobileView === "map"}
                onClick={() => setMobileView("map")}
              >
                Map
              </SegButton>
            </div>
          </div>
        </div>

        <div className="grid flex-1 gap-5 lg:grid-cols-[240px_minmax(0,1fr)_minmax(0,44%)]">
          {/* Filters sidebar (desktop) */}
          <aside className="hidden lg:block">
            <div className="sticky top-5 rounded-xl border border-ink-200 bg-white p-4">
              <FilterPanel
                facets={facets}
                filters={filters}
                onToggle={toggleFacet}
                onReset={resetFilters}
              />
            </div>
          </aside>

          {/* Results list */}
          <section
            className={`${mobileView === "map" ? "hidden" : "block"} lg:block`}
          >
            <div className="lg:max-h-[calc(100vh-13rem)] lg:overflow-y-auto lg:pr-1 lg:scroll-thin">
              <VendorList
                vendors={results}
                activeId={hoveredId}
                userPoint={userPoint}
                isBookmarked={bookmarks.isBookmarked}
                onSelect={setActiveVendor}
                onHover={setHoveredId}
                onToggleBookmark={bookmarks.toggle}
              />
            </div>
          </section>

          {/* Map */}
          <section
            className={`${mobileView === "list" ? "hidden" : "block"} lg:block`}
          >
            <div className="sticky top-5 h-[60vh] overflow-hidden rounded-xl border border-ink-200 lg:h-[calc(100vh-13rem)]">
              <VendorMap
                vendors={results}
                hoveredId={hoveredId}
                userPoint={userPoint}
                onHover={setHoveredId}
                onSelect={setActiveVendor}
              />
            </div>
          </section>
        </div>
      </main>

      {/* Mobile filters drawer */}
      {filtersOpen && (
        <div className="fixed inset-0 z-[1000] lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setFiltersOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-80 max-w-[85%] overflow-y-auto bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Filters</h2>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                aria-label="Close filters"
                className="rounded-full p-1 text-ink-500 hover:bg-ink-100"
              >
                <CloseIcon />
              </button>
            </div>
            <FilterPanel
              facets={facets}
              filters={filters}
              onToggle={toggleFacet}
              onReset={resetFilters}
            />
            <button
              type="button"
              onClick={() => setFiltersOpen(false)}
              className="mt-6 w-full rounded-full bg-brand py-3 font-semibold text-white"
            >
              Show {results.length} {results.length === 1 ? "result" : "results"}
            </button>
          </div>
        </div>
      )}

      <VendorDetail
        vendor={activeVendor}
        bookmarked={activeVendor ? bookmarks.isBookmarked(activeVendor.id) : false}
        onToggleBookmark={() => activeVendor && bookmarks.toggle(activeVendor.id)}
        onClose={() => setActiveVendor(null)}
      />
    </div>
  );
}

function SegButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-4 py-1 text-sm font-semibold transition ${
        active ? "bg-brand text-white" : "text-ink-600"
      }`}
    >
      {children}
    </button>
  );
}

function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} aria-hidden>
      <path
        d="M6 4h12a1 1 0 0 1 1 1v15l-7-4-7 4V5a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SlidersIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="9" cy="6" r="2" fill="currentColor" />
      <circle cx="15" cy="12" r="2" fill="currentColor" />
      <circle cx="8" cy="18" r="2" fill="currentColor" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
