"use client";

import { useState } from "react";
import { formatPct, formatPrice } from "@/lib/format";
import type { ConnectionState } from "@/lib/useLiveTickers";

/** Price that flashes green/red whenever it ticks up/down. */
export function FlashPrice({ value, className = "" }: { value: number; className?: string }) {
  const [prev, setPrev] = useState(value);
  const [dir, setDir] = useState<"up" | "down" | null>(null);
  const [n, setN] = useState(0);
  if (value !== prev) {
    setPrev(value);
    setDir(value > prev ? "up" : "down");
    setN(n + 1);
  }
  return (
    <span
      key={n}
      className={`tabular rounded px-1 -mx-1 ${dir ? `flash-${dir}` : ""} ${className}`}
    >
      {formatPrice(value)}
    </span>
  );
}

/** Percent change with sign + arrow so polarity never relies on color alone. */
export function Change({ value, pill = false }: { value: number | null | undefined; pill?: boolean }) {
  if (value == null || !Number.isFinite(value)) return <span className="text-faint">—</span>;
  const up = value >= 0;
  const color = up ? "text-up" : "text-down";
  const bg = pill ? (up ? "bg-up/10 ring-1 ring-up/20" : "bg-down/10 ring-1 ring-down/20") : "";
  return (
    <span className={`tabular inline-flex items-center gap-0.5 font-medium ${color} ${bg} ${pill ? "rounded-md px-2 py-0.5" : ""}`}>
      <svg viewBox="0 0 10 10" className={`size-2.5 ${up ? "" : "rotate-180"}`} aria-hidden>
        <path d="M5 1.5 9 8H1z" fill="currentColor" />
      </svg>
      {formatPct(Math.abs(value)).replace("+", "")}
      <span className="sr-only">{up ? "up" : "down"}</span>
    </span>
  );
}

export function LiveBadge({ state }: { state: ConnectionState }) {
  const map = {
    live: { label: "Live", dot: "bg-up live-dot", text: "text-up" },
    connecting: { label: "Connecting", dot: "bg-amber-400 animate-pulse", text: "text-amber-300" },
    offline: { label: "Reconnecting", dot: "bg-down", text: "text-down" },
  }[state];
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium ${map.text}`}>
      <span className={`size-2 rounded-full ${map.dot}`} />
      {map.label}
    </span>
  );
}

/** Tiny 7-day trend line for table rows. */
export function Sparkline({ data, up }: { data: number[]; up: boolean }) {
  if (data.length < 2) return null;
  const w = 120;
  const h = 36;
  const step = Math.max(1, Math.floor(data.length / 60));
  const pts = data.filter((_, i) => i % step === 0);
  const min = Math.min(...pts);
  const max = Math.max(...pts);
  const span = max - min || 1;
  const d = pts
    .map((v, i) => `${i ? "L" : "M"}${((i / (pts.length - 1)) * w).toFixed(1)},${(h - 2 - ((v - min) / span) * (h - 4)).toFixed(1)}`)
    .join("");
  const color = up ? "var(--up)" : "var(--down)";
  const gid = `sg-${up ? "u" : "d"}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-9 w-[120px]" aria-hidden preserveAspectRatio="none">
      <defs>
        <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.25" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${d}L${w},${h}L0,${h}Z`} fill={`url(#${gid})`} />
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
