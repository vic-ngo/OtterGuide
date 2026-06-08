"use client";

import { useState } from "react";
import type { Facets, FacetCount, Filters } from "@/lib/filters";

interface FilterPanelProps {
  facets: Facets;
  filters: Filters;
  onToggle: (group: FilterGroup, value: string) => void;
  onReset: () => void;
}

type FilterGroup = "categories" | "subcategories" | "cities" | "funding";

export default function FilterPanel({
  facets,
  filters,
  onToggle,
  onReset,
}: FilterPanelProps) {
  const hasActive =
    filters.categories.length +
      filters.subcategories.length +
      filters.cities.length +
      filters.funding.length >
    0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wide text-ink-500">
          Filters
        </h2>
        {hasActive && (
          <button
            type="button"
            onClick={onReset}
            className="text-xs font-semibold text-accent hover:text-accent-dark"
          >
            Reset
          </button>
        )}
      </div>

      <FacetSection
        title="Funding accepted"
        group="funding"
        options={facets.funding}
        selected={filters.funding}
        onToggle={onToggle}
      />
      <FacetSection
        title="Category"
        group="categories"
        options={facets.categories}
        selected={filters.categories}
        onToggle={onToggle}
      />
      <FacetSection
        title="Service type"
        group="subcategories"
        options={facets.subcategories}
        selected={filters.subcategories}
        onToggle={onToggle}
      />
      <FacetSection
        title="City"
        group="cities"
        options={facets.cities}
        selected={filters.cities}
        onToggle={onToggle}
      />
    </div>
  );
}

function FacetSection({
  title,
  group,
  options,
  selected,
  onToggle,
  scroll,
}: {
  title: string;
  group: FilterGroup;
  options: FacetCount[];
  selected: string[];
  onToggle: (group: FilterGroup, value: string) => void;
  scroll?: boolean;
}) {
  // Collapsed by default so the panel stays compact; any group with active
  // selections opens automatically.
  const [open, setOpen] = useState(selected.length > 0);
  if (options.length === 0) return null;
  return (
    <fieldset className="border-b border-ink-100 pb-3 last:border-0 last:pb-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 text-left text-sm font-semibold text-foreground"
      >
        <span className="flex items-center gap-2">
          {title}
          {selected.length > 0 && (
            <span className="rounded-full bg-accent-soft px-1.5 text-xs font-semibold text-accent">
              {selected.length}
            </span>
          )}
        </span>
        <Chevron open={open} />
      </button>
      {open && (
        <div
          className={`mt-2 space-y-1.5 ${
            scroll ? "max-h-52 overflow-y-auto pr-1 scroll-thin" : ""
          }`}
        >
          {options.map((opt) => {
            const checked = selected.includes(opt.value);
            return (
              <label
                key={opt.value}
                className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm hover:bg-ink-50"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle(group, opt.value)}
                  className="size-4 shrink-0 accent-accent"
                />
                <span className="flex-1 text-ink-700">{opt.value}</span>
                <span className="text-xs tabular-nums text-ink-400">
                  {opt.count}
                </span>
              </label>
            );
          })}
        </div>
      )}
    </fieldset>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={`shrink-0 text-ink-400 transition-transform ${open ? "rotate-180" : ""}`}
    >
      <path
        d="m6 9 6 6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
