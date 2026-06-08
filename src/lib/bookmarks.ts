"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

const STORAGE_KEY = "vendor-directory:bookmarks";

const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  window.addEventListener("storage", callback);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", callback);
  };
}

function getSnapshot(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? "[]";
  } catch {
    return "[]";
  }
}

// Stable snapshot for SSR (no bookmarks until the client hydrates).
function getServerSnapshot(): string {
  return "[]";
}

function parseIds(raw: string): Set<string> {
  try {
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? (parsed as string[]) : []);
  } catch {
    return new Set();
  }
}

function writeIds(ids: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    /* storage may be unavailable */
  }
  emit();
}

/** Read/write vendor bookmarks in localStorage, synced across tabs. */
export function useBookmarks() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const ids = useMemo(() => parseIds(raw), [raw]);

  const toggle = useCallback(
    (id: string) => {
      const next = parseIds(getSnapshot());
      if (next.has(id)) next.delete(id);
      else next.add(id);
      writeIds(next);
    },
    []
  );

  const isBookmarked = useCallback((id: string) => ids.has(id), [ids]);

  return { ids, isBookmarked, toggle, count: ids.size };
}
