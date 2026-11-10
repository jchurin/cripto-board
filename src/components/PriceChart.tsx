"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCompact, formatDate, formatPrice } from "@/lib/format";
import { RANGES, type HistoryResponse, type Range } from "@/lib/types";
import { Change } from "./ui";

const LABELS: Record<Range, string> = {
  "1D": "24 hours",
  "7D": "7 days",
  "1M": "1 month",
  "6M": "6 months",
  "1Y": "1 year",
  ALL: "All time",
};

type Props = { id: string; symbol: string; refPrice: number; live: { t: number; p: number } | null };

export function PriceChart({ id, symbol, refPrice, live }: Props) {
  const [range, setRange] = useState<Range>("1Y");
  const [result, setResult] = useState<{ key: string; data?: HistoryResponse; error?: string } | null>(null);
  const key = `${id}:${range}`;

  useEffect(() => {
    const ctrl = new AbortController();
    fetch(`/api/history/${id}?range=${range}&symbol=${symbol}&ref=${refPrice}`, { signal: ctrl.signal })
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok) throw new Error(body.error ?? "Request failed");
        setResult({ key, data: body as HistoryResponse });
      })
      .catch((e: Error) => {
        if (e.name !== "AbortError") setResult({ key, error: e.message });
      });
    return () => ctrl.abort();
  }, [id, symbol, refPrice, range, key]);

  const loading = result?.key !== key;
  const data = !loading ? result?.data : undefined;

  // Append the live tick so the line's right edge moves in real time.
  const points = useMemo(() => {
    const pts = data?.points ?? [];
    if (!pts.length || !live || live.t <= pts.at(-1)!.t) return pts;
    return [...pts, live];
  }, [data, live]);

  const stats = useMemo(() => {
    if (points.length < 2) return null;
    let hi = points[0], lo = points[0];
    for (const pt of points) {
      if (pt.p > hi.p) hi = pt;
      if (pt.p < lo.p) lo = pt;
    }
    const first = points[0].p;
    const last = points.at(-1)!.p;
    return { hi, lo, first, last, change: (last / first - 1) * 100 };
  }, [points]);

  const up = (stats?.change ?? 0) >= 0;
  const color = up ? "var(--up)" : "var(--down)";
  const intraday = range === "1D" || range === "7D";

  return (
    <section className="glass rise rounded-2xl p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted">Price · {LABELS[range]}</p>
          <div className="mt-1 flex h-7 items-center gap-3 text-sm">
            {stats ? (
              <>
                <Change value={stats.change} pill />
                <span className="text-muted tabular">
                  {formatPrice(stats.first)} → {formatPrice(stats.last)}
                </span>
              </>
            ) : (
              <span className="skeleton h-5 w-48" />
            )}
          </div>
        </div>
        <div role="tablist" aria-label="Time range" className="flex rounded-xl border border-line bg-black/30 p-1">
          {RANGES.map((r) => (
            <button
              key={r}
              role="tab"
              aria-selected={r === range}
              onClick={() => setRange(r)}
              className={`relative rounded-lg px-3 py-1.5 text-xs font-semibold transition-all sm:px-4 ${
                r === range
                  ? "bg-gradient-to-br from-accent/90 to-accent-2/80 text-white shadow-[0_0_20px_-6px_var(--accent)]"
                  : "text-muted hover:bg-white/5 hover:text-ink"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="relative mt-6 h-[360px] sm:h-[420px]">
        {loading && (
          <div className="absolute inset-0 z-10 grid place-items-center">
            <div className="size-8 animate-spin rounded-full border-2 border-white/10 border-t-accent" />
          </div>
        )}
        {result?.error && !loading && (
          <div className="absolute inset-0 grid place-items-center text-center text-sm text-muted">
            <div>
              <p className="text-ink">Couldn&apos;t load price history</p>
              <p className="mt-1 text-faint">{result.error}</p>
            </div>
          </div>
        )}
        {points.length > 1 && (
          <div key={key} className="rise h-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={points} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
              <defs>
                <linearGradient id="area-fill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.32} />
                  <stop offset="70%" stopColor={color} stopOpacity={0.04} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
                <filter id="glow" x="-10%" y="-10%" width="120%" height="120%">
                  <feGaussianBlur stdDeviation="4" result="b" />
                  <feMerge>
                    <feMergeNode in="b" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="t"
                type="number"
                scale="time"
                domain={["dataMin", "dataMax"]}
                tickFormatter={(t: number) =>
                  new Intl.DateTimeFormat("en-US",
                    range === "1D" ? { hour: "2-digit", minute: "2-digit" }
                    : range === "ALL" ? { year: "numeric" }
                    : range === "1Y" || range === "6M" ? { month: "short", year: "2-digit" }
                    : { month: "short", day: "numeric" },
                  ).format(t)
                }
                tick={{ fill: "var(--faint)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                minTickGap={48}
              />
              <YAxis
                dataKey="p"
                orientation="right"
                domain={["auto", "auto"]}
                tickFormatter={(v: number) => (v >= 1000 ? formatCompact(v) : formatPrice(v))}
                tick={{ fill: "var(--faint)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={72}
              />
              {stats && (
                <ReferenceLine y={stats.first} stroke="rgba(255,255,255,0.18)" strokeDasharray="3 4" />
              )}
              <Tooltip
                cursor={{ stroke: "rgba(255,255,255,0.35)", strokeWidth: 1, strokeDasharray: "4 4" }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const pt = payload[0].payload as { t: number; p: number };
                  const diff = stats ? (pt.p / stats.first - 1) * 100 : null;
                  return (
                    <div className="glass rounded-xl px-3 py-2 text-sm shadow-2xl">
                      <p className="text-xs text-muted">{formatDate(pt.t, intraday)}</p>
                      <p className="mt-0.5 font-semibold tabular">{formatPrice(pt.p)}</p>
                      {diff != null && (
                        <p className="mt-0.5 text-xs"><Change value={diff} /> <span className="text-faint">vs start</span></p>
                      )}
                    </div>
                  );
                }}
              />
              <Area
                type="monotone"
                dataKey="p"
                stroke={color}
                strokeWidth={2}
                fill="url(#area-fill)"
                filter="url(#glow)"
                isAnimationActive={false}
                activeDot={{ r: 5, fill: color, stroke: "var(--bg)", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-4 text-sm sm:grid-cols-4">
        <Stat label="Period high" value={stats ? formatPrice(stats.hi.p) : "—"} sub={stats ? formatDate(stats.hi.t, intraday) : ""} />
        <Stat label="Period low" value={stats ? formatPrice(stats.lo.p) : "—"} sub={stats ? formatDate(stats.lo.t, intraday) : ""} />
        <Stat label="Data points" value={points.length ? points.length.toLocaleString("en-US") : "—"} sub={data ? `via ${data.source === "binance" ? "Binance" : "CoinGecko"}` : ""} />
        <Stat
          label="Range"
          value={LABELS[range]}
          sub={data?.truncated ? "Limited to 365d (CoinGecko free tier)" : points.length ? `since ${formatDate(points[0].t)}` : ""}
        />
      </div>
    </section>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-0.5 font-medium tabular">{value}</p>
      <p className="truncate text-xs text-faint">{sub}</p>
    </div>
  );
}
