export function formatPrice(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  const digits = n >= 1000 ? 2 : n >= 1 ? 2 : n >= 0.01 ? 4 : n >= 0.0001 ? 6 : 8;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(n);
}

const UNITS: [number, string][] = [
  [1e12, "T"],
  [1e9, "B"],
  [1e6, "M"],
  [1e3, "K"],
];

/**
 * Compact formatting ($1.5T, $615.1M) done by hand on purpose: Intl's
 * `notation: "compact"` rounds differently in Node and in browsers, which
 * causes SSR hydration mismatches.
 */
export function formatCompact(n: number | null | undefined, currency = true): string {
  if (n == null || !Number.isFinite(n)) return "—";
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  const prefix = currency ? "$" : "";
  for (const [size, suffix] of UNITS) {
    if (abs >= size) return `${sign}${prefix}${Number((abs / size).toFixed(2))}${suffix}`;
  }
  return `${sign}${prefix}${Number(abs.toFixed(2))}`;
}

export function formatNumber(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);
}

export function formatPct(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}

export function formatDate(d: string | number | null | undefined, withTime = false): string {
  if (d == null) return "—";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    // Date-only values are UTC days; pinning the zone keeps SSR and client identical.
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : { timeZone: "UTC" }),
  }).format(new Date(d));
}
