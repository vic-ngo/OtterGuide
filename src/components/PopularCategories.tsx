"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

interface Tile {
  label: string;
  /** The subcategory value to filter on, or "online" for the remote filter. */
  value: string;
  icon: ReactNode;
}

const TILES: Tile[] = [
  { label: "Camp", value: "Camp", icon: <CampIcon /> },
  { label: "Swim", value: "Swim", icon: <SwimIcon /> },
  { label: "Sports", value: "Sports", icon: <SportsIcon /> },
  { label: "Therapy", value: "Therapy", icon: <TherapyIcon /> },
  { label: "Coaching", value: "Coaching", icon: <CoachingIcon /> },
  { label: "Music", value: "Music", icon: <MusicIcon /> },
  { label: "Art", value: "Art", icon: <ArtIcon /> },
];

interface PopularCategoriesProps {
  selected: string[];
  onSelect: (value: string) => void;
}

export default function PopularCategories({
  selected,
  onSelect,
}: PopularCategoriesProps) {
  const scroller = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateOverflow = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    // 1px tolerance avoids sub-pixel rounding leaving an arrow on.
    setCanScrollLeft(el.scrollLeft > 1);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    updateOverflow();
    const el = scroller.current;
    if (!el) return;
    const observer = new ResizeObserver(updateOverflow);
    observer.observe(el);
    window.addEventListener("resize", updateOverflow);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateOverflow);
    };
  }, [updateOverflow]);

  function scrollBy(direction: 1 | -1) {
    scroller.current?.scrollBy({ left: direction * 240, behavior: "smooth" });
  }

  return (
    <section aria-label="Popular categories">
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink-500">
        Popular
      </h2>
      <div className="relative">
        {canScrollLeft && <ArrowButton side="left" onClick={() => scrollBy(-1)} />}
        <div
          ref={scroller}
          onScroll={updateOverflow}
          className="flex gap-3 overflow-x-auto scroll-smooth snap-x scroll-thin pb-1 sm:px-1"
        >
          {TILES.map((tile) => {
            const active = selected.includes(tile.value);
            return (
              <button
                key={tile.value}
                type="button"
                onClick={() => onSelect(tile.value)}
                aria-pressed={active}
                className={`flex min-w-[112px] shrink-0 snap-start flex-col items-center justify-center gap-2 rounded-xl border px-4 py-4 transition ${
                  active
                    ? "border-accent bg-accent-soft text-accent"
                    : "border-ink-200 bg-white text-foreground hover:border-ink-400"
                }`}
              >
                <span className="flex size-9 items-center justify-center rounded-full bg-[#e4ff97] text-[#16235a]">
                  {tile.icon}
                </span>
                <span className="text-sm font-semibold">{tile.label}</span>
              </button>
            );
          })}
        </div>
        {canScrollRight && <ArrowButton side="right" onClick={() => scrollBy(1)} />}
      </div>
    </section>
  );
}

function ArrowButton({
  side,
  onClick,
}: {
  side: "left" | "right";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "left" ? "Scroll left" : "Scroll right"}
      className={`absolute top-1/2 z-10 hidden size-8 -translate-y-1/2 items-center justify-center rounded-full border border-ink-200 bg-white text-foreground shadow-sm transition hover:border-ink-400 sm:flex ${
        side === "left" ? "-left-3" : "-right-3"
      }`}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d={side === "left" ? "m14 6-6 6 6 6" : "m10 6 6 6-6 6"}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

function CampIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 4 3 20h18L12 4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M12 4v16" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function SwimIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 16c1.5 0 1.5 1.5 3 1.5S10.5 16 12 16s1.5 1.5 3 1.5S16.5 16 18 16s1.5 1.5 3 1.5M3 20c1.5 0 1.5 1.5 3 1.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M7 12 14 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="16" cy="7" r="2" fill="currentColor" />
    </svg>
  );
}

function SportsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M3 12h18M12 3v18" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function TherapyIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 21S4 13.5 4 8.5A4.5 4.5 0 0 1 12 6a4.5 4.5 0 0 1 8 2.5C20 13.5 12 21 12 21Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M12 9.5v4M10 11.5h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function CoachingIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="7" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="2" />
      <path
        d="M8 7V5.5A1.5 1.5 0 0 1 9.5 4h5A1.5 1.5 0 0 1 16 5.5V7M3 12h18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MusicIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M9 18V6l10-2v12" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="6" cy="18" r="2.5" stroke="currentColor" strokeWidth="2" />
      <circle cx="16" cy="16" r="2.5" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function ArtIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3a9 9 0 0 0 0 18c1.7 0 2-1.3 1-2.3-.9-1 .1-2.7 1.5-2.7H17a4 4 0 0 0 4-4c0-4.4-4-7-9-7Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="11" r="1.2" fill="currentColor" />
      <circle cx="12" cy="8" r="1.2" fill="currentColor" />
      <circle cx="16" cy="11" r="1.2" fill="currentColor" />
    </svg>
  );
}

