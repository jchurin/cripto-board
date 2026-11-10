"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { formatCompact } from "@/lib/format";
import type { MarketCoin } from "@/lib/types";
import { useLiveTickers } from "@/lib/useLiveTickers";
import { Change, FlashPrice, LiveBadge, Sparkline } from "./ui";

type SortKey = "rank" | "price" | "h1" | "h24" | "d7" | "mcap" | "volume";

export function MarketTable({ coins }: { coins: MarketCoin[] }) {
  // First (highest-ranked) coin wins a symbol, so lookalike tickers don't collide.
  const reference = useMemo(() => {
    const r: Record<string, number> = {};
    for (const c of coins) if (!(c.symbol in r)) r[c.symbol] = c.current_price;
    return r;
  }, [coins]);
  const { ticks, state } = useLiveTickers(reference);

  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "rank", dir: 1 });

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const live = coins.map((c) => {
      const t = reference[c.symbol] === c.current_price ? ticks[c.symbol] : undefined;
      const price = t?.price ?? c.current_price;
      const ratio = price / c.current_price;
      return {
        coin: c,
        live: !!t,
        price,
        h1: c.price_change_percentage_1h_in_currency,
        h24: t?.change24h ?? c.price_change_percentage_24h_in_currency,
        d7: c.price_change_percentage_7d_in_currency,
        mcap: c.market_cap * ratio,
        volume: c.total_volume,
      };
    });
    const filtered = q
      ? live.filter((r) => r.coin.name.toLowerCase().includes(q) || r.coin.symbol.includes(q))
      : live;
    const val = (r: (typeof live)[number]) =>
      sort.key === "rank" ? r.coin.market_cap_rank : sort.key === "price" ? r.price : (r[sort.key] ?? -Infinity);
    return [...filtered].sort((a, b) => (val(a) - val(b)) * sort.dir);
  }, [coins, ticks, reference, query, sort]);

  const liveCount = Object.keys(ticks).length;

  const toggle = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: (s.dir * -1) as 1 | -1 } : { key, dir: key === "rank" ? 1 : -1 }));

  const th = (k: SortKey, children: React.ReactNode, className = "") => (
    <th key={k} className={`px-3 py-3 font-medium ${className}`} aria-sort={sort.key === k ? (sort.dir === 1 ? "ascending" : "descending") : "none"}>
      <button
        onClick={() => toggle(k)}
        className={`inline-flex items-center gap-1 transition-colors hover:text-ink ${sort.key === k ? "text-ink" : ""}`}
      >
        {children}
        <span className={`text-[10px] ${sort.key === k ? "opacity-100" : "opacity-0"}`}>{sort.dir === 1 ? "▲" : "▼"}</span>
      </button>
    </th>
  );

  return (
    <section className="glass rise overflow-hidden rounded-2xl">
      <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold">Top 100 by market cap</h2>
          <LiveBadge state={state} />
          {liveCount > 0 && <span className="hidden text-xs text-faint md:inline">{liveCount} streaming</span>}
        </div>
        <label className="relative block w-full sm:w-72">
          <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search coin or symbol…"
            className="w-full rounded-xl border border-line bg-surface py-2 pl-9 pr-3 text-sm outline-none placeholder:text-faint focus:border-accent/60 focus:ring-2 focus:ring-accent/20"
          />
        </label>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[880px] text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-muted">
            <tr className="border-b border-line">
              {th("rank", "#", "w-14 pl-5")}
              <th className="px-3 py-3 font-medium">Coin</th>
              {th("price", "Price", "text-right [&>button]:flex-row-reverse")}
              {th("h1", "1h", "text-right [&>button]:flex-row-reverse")}
              {th("h24", "24h", "text-right [&>button]:flex-row-reverse")}
              {th("d7", "7d", "text-right [&>button]:flex-row-reverse")}
              {th("mcap", "Market cap", "text-right [&>button]:flex-row-reverse")}
              {th("volume", "Volume 24h", "text-right [&>button]:flex-row-reverse")}
              <th className="px-3 py-3 pr-5 text-right font-medium">Last 7 days</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const c = r.coin;
              const spark = c.sparkline_in_7d?.price ?? [];
              return (
                <tr key={c.id} className="group relative border-b border-line/60 transition-colors last:border-0 hover:bg-white/[0.035]">
                  <td className="px-3 py-3 pl-5 text-muted tabular">{c.market_cap_rank}</td>
                  <td className="px-3 py-3">
                    <Link href={`/coin/${c.id}`} className="flex items-center gap-3 after:absolute after:inset-0">
                      <Image src={c.image} alt="" width={28} height={28} className="size-7 shrink-0 rounded-full" />
                      <span className="font-medium text-ink group-hover:text-white">{c.name}</span>
                      <span className="text-xs uppercase text-faint">{c.symbol}</span>
                      {r.live && <span className="size-1.5 rounded-full bg-up" title="Live price" />}
                    </Link>
                  </td>
                  <td className="px-3 py-3 text-right font-medium">
                    <FlashPrice value={r.price} />
                  </td>
                  <td className="px-3 py-3 text-right"><Change value={r.h1} /></td>
                  <td className="px-3 py-3 text-right"><Change value={r.h24} /></td>
                  <td className="px-3 py-3 text-right"><Change value={r.d7} /></td>
                  <td className="px-3 py-3 text-right tabular">{formatCompact(r.mcap)}</td>
                  <td className="px-3 py-3 text-right tabular text-muted">{formatCompact(r.volume)}</td>
                  <td className="px-3 py-2 pr-5">
                    <div className="flex justify-end">
                      <Sparkline data={spark} up={spark.length > 1 ? spark.at(-1)! >= spark[0] : true} />
                    </div>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={9} className="py-16 text-center text-muted">No coins match “{query}”.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
