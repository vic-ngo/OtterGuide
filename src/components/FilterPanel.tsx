"use client";

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
    <div className="space-y-5">
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
        scroll
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
  if (options.length === 0) return null;
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold text-foreground">
        {title}
      </legend>
      <div
        className={`space-y-1.5 ${
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
    </fieldset>
  );
}
