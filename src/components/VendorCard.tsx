"use client";

import type { Vendor } from "@/lib/types";
import { locationSummary } from "@/lib/filters";

interface VendorCardProps {
  vendor: Vendor;
  active: boolean;
  distanceMiles?: number | null;
  bookmarked: boolean;
  onSelect: () => void;
  onHover: (hovering: boolean) => void;
  onToggleBookmark: () => void;
}

export default function VendorCard({
  vendor,
  active,
  distanceMiles,
  bookmarked,
  onSelect,
  onHover,
  onToggleBookmark,
}: VendorCardProps) {
  return (
    <article
      onClick={onSelect}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      className={`group relative cursor-pointer rounded-xl border bg-white p-4 transition ${
        active
          ? "border-accent bg-accent-soft"
          : "border-ink-200 hover:border-ink-400"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-foreground">
            {vendor.name}
          </h3>
          <p className="mt-0.5 truncate text-sm text-ink-500">
            {vendor.categories.join(" · ")}
          </p>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleBookmark();
          }}
          aria-label={bookmarked ? "Remove bookmark" : "Bookmark vendor"}
          aria-pressed={bookmarked}
          className="shrink-0 rounded-full p-1.5 text-ink-300 transition hover:bg-ink-50 hover:text-accent"
        >
          <BookmarkIcon filled={bookmarked} />
        </button>
      </div>

      {vendor.subcategories.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {vendor.subcategories.map((s) => (
            <span
              key={s}
              className="rounded-md bg-chip-tint px-2 py-0.5 text-xs font-semibold text-chip-text"
            >
              {s}
            </span>
          ))}
        </div>
      )}

      {vendor.fundingAccepted.length > 0 && (
        <p className="mt-2 line-clamp-1 text-xs text-ink-500">
          {vendor.fundingAccepted.join(" · ")}
        </p>
      )}

      <div className="mt-3 flex items-center gap-1.5 text-sm text-ink-600">
        <PinIcon />
        <span className="truncate">{locationSummary(vendor)}</span>
        {distanceMiles != null && (
          <span className="ml-auto shrink-0 font-medium text-ink-500">
            {distanceMiles < 10
              ? `${distanceMiles.toFixed(1)} mi`
              : `${Math.round(distanceMiles)} mi`}
          </span>
        )}
      </div>
    </article>
  );
}

function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      className={filled ? "text-accent" : ""}
      aria-hidden
    >
      <path
        d="M6 4h12a1 1 0 0 1 1 1v15l-7-4-7 4V5a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      className="shrink-0 text-ink-400"
      aria-hidden
    >
      <path
        d="M12 21s7-5.686 7-11a7 7 0 1 0-14 0c0 5.314 7 11 7 11Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
