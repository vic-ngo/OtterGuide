/** Normalize a website value (bare domain or full URL) into an href. */
export function websiteHref(website?: string): string | undefined {
  if (!website) return undefined;
  const trimmed = website.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

/** Human-friendly label for a website (strip protocol + trailing slash). */
export function websiteLabel(website?: string): string {
  if (!website) return "";
  return website.replace(/^https?:\/\//i, "").replace(/\/$/, "");
}

/** Strip non-dialable characters for a tel: href. */
export function telHref(phone?: string): string | undefined {
  if (!phone) return undefined;
  const digits = phone.replace(/[^\d+]/g, "");
  return digits ? `tel:${digits}` : undefined;
}
