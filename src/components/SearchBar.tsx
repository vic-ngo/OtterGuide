"use client";

import LocationField from "./LocationField";

interface SearchBarProps {
  query: string;
  locationLabel: string;
  searchingLocation: boolean;
  locationError?: string | null;
  onQueryChange: (value: string) => void;
  onSubmitLocation: (text: string) => void;
}

export default function SearchBar({
  query,
  locationLabel,
  searchingLocation,
  locationError,
  onQueryChange,
  onSubmitLocation,
}: SearchBarProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
      <label className="flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-4 py-3 transition focus-within:border-accent">
        <SearchIcon />
        <input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search by vendor name, category, or service"
          className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-ink-400"
          aria-label="Search vendors by name, category, or service"
        />
      </label>

      <LocationField
        label={locationLabel}
        searching={searchingLocation}
        error={locationError}
        onSubmit={onSubmitLocation}
      />
    </div>
  );
}

function SearchIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      className="shrink-0 text-ink-400"
      aria-hidden
    >
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="m20 20-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
