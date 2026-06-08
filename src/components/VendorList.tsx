"use client";

import type { Vendor } from "@/lib/types";
import { nearestDistanceMiles, type GeoPoint } from "@/lib/filters";
import VendorCard from "./VendorCard";

interface VendorListProps {
  vendors: Vendor[];
  activeId: string | null;
  userPoint: GeoPoint | null;
  isBookmarked: (id: string) => boolean;
  onSelect: (vendor: Vendor) => void;
  onHover: (id: string | null) => void;
  onToggleBookmark: (id: string) => void;
}

export default function VendorList({
  vendors,
  activeId,
  userPoint,
  isBookmarked,
  onSelect,
  onHover,
  onToggleBookmark,
}: VendorListProps) {
  if (vendors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-ink-300 bg-white/60 px-6 py-16 text-center">
        <p className="text-base font-semibold text-foreground">
          No vendors match your search
        </p>
        <p className="max-w-xs text-sm text-ink-500">
          Try removing a filter or searching by a different category, service,
          or city.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {vendors.map((vendor) => (
        <VendorCard
          key={vendor.id}
          vendor={vendor}
          active={activeId === vendor.id}
          distanceMiles={userPoint ? nearestDistanceMiles(vendor, userPoint) : null}
          bookmarked={isBookmarked(vendor.id)}
          onSelect={() => onSelect(vendor)}
          onHover={(hovering) => onHover(hovering ? vendor.id : null)}
          onToggleBookmark={() => onToggleBookmark(vendor.id)}
        />
      ))}
    </div>
  );
}
