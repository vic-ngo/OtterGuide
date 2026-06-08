"use client";

import { useState } from "react";

interface LocationFieldProps {
  /** Committed location label shown when the field isn't being edited. */
  label: string;
  searching: boolean;
  error?: string | null;
  onSubmit: (text: string) => void;
}

export default function LocationField({
  label,
  searching,
  error,
  onSubmit,
}: LocationFieldProps) {
  const [text, setText] = useState("");
  const [editing, setEditing] = useState(false);

  function commit() {
    const value = text.trim();
    if (value) onSubmit(value);
    setEditing(false);
  }

  return (
    <div className="sm:w-64">
      <div className="flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-4 py-3 transition focus-within:border-accent">
        <PinIcon />
        <input
          type="search"
          value={editing ? text : searching ? "Searching…" : label}
          onFocus={() => {
            setEditing(true);
            setText("");
          }}
          onChange={(e) => setText(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            }
          }}
          placeholder="Enter a city or ZIP"
          aria-label="Search by city or ZIP code"
          className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-ink-400"
        />
      </div>
      {error && <p className="mt-1 px-1 text-xs text-accent-dark">{error}</p>}
    </div>
  );
}

function PinIcon() {
  return (
    <svg
      width="18"
      height="18"
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
