"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import type { Vendor } from "@/lib/types";
import { physicalLocations, pinnableLocations } from "@/lib/filters";
import { telHref, websiteHref, websiteLabel } from "@/lib/format";

const VendorMap = dynamic(() => import("./VendorMap"), { ssr: false });

interface VendorDetailProps {
  vendor: Vendor | null;
  bookmarked: boolean;
  onToggleBookmark: () => void;
  onClose: () => void;
}

export default function VendorDetail({
  vendor,
  bookmarked,
  onToggleBookmark,
  onClose,
}: VendorDetailProps) {
  useEffect(() => {
    if (!vendor) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [vendor, onClose]);

  if (!vendor) return null;

  const pinned = pinnableLocations(vendor);
  const hasPhysical = physicalLocations(vendor).length > 0;
  const href = websiteHref(vendor.website);
  const tel = telHref(vendor.phone);

  return (
    <div className="fixed inset-0 z-[1100]">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${vendor.name} details`}
        className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-background shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-ink-200 bg-white px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-foreground">{vendor.name}</h2>
            <p className="mt-0.5 text-sm text-ink-500">
              {vendor.categories.join(" · ")}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={onToggleBookmark}
              aria-pressed={bookmarked}
              aria-label={bookmarked ? "Remove bookmark" : "Bookmark vendor"}
              className={`rounded-full p-2 transition hover:bg-ink-100 ${
                bookmarked ? "text-accent" : "text-ink-400"
              }`}
            >
              <BookmarkIcon filled={bookmarked} />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="rounded-full p-2 text-ink-500 transition hover:bg-ink-100"
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scroll-thin">
          {/* Subcategories (chips) and funding (plain text), matching the card */}
          <div className="space-y-2 px-5 py-4">
            {vendor.subcategories.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {vendor.subcategories.map((s) => (
                  <span
                    key={s}
                    className="rounded-md bg-chip-tint px-2.5 py-1 text-xs font-semibold text-chip-text"
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}
            {vendor.fundingAccepted.length > 0 && (
              <p className="text-xs text-ink-500">
                Accepts {vendor.fundingAccepted.join(" · ")}
              </p>
            )}
          </div>

          {/* Contact */}
          <Section title="Contact">
            <dl className="space-y-2.5 text-sm">
              {vendor.contactName && (
                <Row label="Contact">{vendor.contactName}</Row>
              )}
              {tel && (
                <Row label="Phone">
                  <a className="text-accent hover:underline" href={tel}>
                    {vendor.phone}
                  </a>
                </Row>
              )}
              {vendor.email && (
                <Row label="Email">
                  <a
                    className="break-all text-accent hover:underline"
                    href={`mailto:${vendor.email}`}
                  >
                    {vendor.email}
                  </a>
                </Row>
              )}
              {href && (
                <Row label="Website">
                  <a
                    className="break-all text-accent hover:underline"
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {websiteLabel(vendor.website)}
                  </a>
                </Row>
              )}
            </dl>
          </Section>

          {/* Map */}
          {pinned.length > 0 && (
            <Section title="Map">
              <div className="h-52 overflow-hidden rounded-xl border border-ink-200">
                <VendorMap
                  vendors={[vendor]}
                  hoveredId={vendor.id}
                  onHover={() => {}}
                  onSelect={() => {}}
                />
              </div>
            </Section>
          )}

          {/* Locations & availability */}
          <Section
            title={hasPhysical ? `Locations (${vendor.locations.length})` : "Location"}
          >
            <ul className="space-y-2.5">
              {vendor.locations.map((loc, i) => (
                <li
                  key={i}
                  className="rounded-lg border border-ink-200 bg-white p-3 text-sm"
                >
                  {loc.online ? (
                    <p className="font-semibold text-foreground">Online (remote)</p>
                  ) : loc.regionWide ? (
                    <>
                      {loc.label && (
                        <p className="font-semibold text-foreground">{loc.label}</p>
                      )}
                      <p className="text-ink-600">
                        In-home, San Francisco Bay Area
                      </p>
                    </>
                  ) : loc.address ? (
                    <>
                      {loc.label && (
                        <p className="font-semibold text-foreground">{loc.label}</p>
                      )}
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          loc.address
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-ink-600 hover:text-accent hover:underline"
                      >
                        {loc.address}
                      </a>
                    </>
                  ) : (
                    <p className="font-semibold text-foreground">
                      {loc.label || loc.city || "Location varies"}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </Section>

          <p className="px-5 pb-6 pt-2 text-xs text-ink-400">
            Listings reflect vendors known to accept Regional Center or FMS
            payment. Confirm current availability and funding directly with the
            vendor before scheduling services.
          </p>
        </div>

      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-ink-200 px-5 py-4">
      <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink-500">
        {title}
      </h3>
      {children}
    </section>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <dt className="w-20 shrink-0 text-ink-500">{label}</dt>
      <dd className="min-w-0 flex-1 text-foreground">{children}</dd>
    </div>
  );
}

function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} aria-hidden>
      <path
        d="M6 4h12a1 1 0 0 1 1 1v15l-7-4-7 4V5a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
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

