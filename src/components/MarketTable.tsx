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
    <th key={k} className={`px-2 py-3 font-medium sm:px-3 ${className}`} aria-sort={sort.key === k ? (sort.dir === 1 ? "ascending" : "descending") : "none"}>
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
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
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
        <table className="w-full text-sm lg:min-w-[880px]">
          <thead className="text-left text-xs uppercase tracking-wider text-muted">
            <tr className="border-b border-line">
              {th("rank", "#", "hidden w-14 pl-5 sm:table-cell")}
              <th className="w-full py-3 pl-4 pr-2 font-medium sm:px-3">Coin</th>
              {th("price", "Price", "pr-4 text-right sm:pr-3 [&>button]:flex-row-reverse")}
              {th("h1", "1h", "hidden text-right sm:table-cell [&>button]:flex-row-reverse")}
              {th("h24", "24h", "hidden text-right sm:table-cell [&>button]:flex-row-reverse")}
              {th("d7", "7d", "hidden text-right sm:table-cell [&>button]:flex-row-reverse")}
              {th("mcap", "Market cap", "hidden text-right md:table-cell [&>button]:flex-row-reverse")}
              {th("volume", "Volume 24h", "hidden text-right lg:table-cell [&>button]:flex-row-reverse")}
              <th className="hidden px-3 py-3 pr-5 text-right font-medium lg:table-cell">Last 7 days</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const c = r.coin;
              const spark = c.sparkline_in_7d?.price ?? [];
              return (
                <tr key={c.id} className="group relative border-b border-line/60 transition-colors last:border-0 hover:bg-white/[0.035]">
                  <td className="hidden px-3 py-3 pl-5 text-muted tabular sm:table-cell">{c.market_cap_rank}</td>
                  <td className="w-full max-w-0 py-3 pl-4 pr-2 sm:px-3">
                    <Link href={`/coin/${c.id}`} title={c.name} className="flex min-w-0 items-center gap-2.5 after:absolute after:inset-0 sm:gap-3">
                      <Image src={c.image} alt="" width={28} height={28} className="size-7 shrink-0 rounded-full" />
                      <span className="flex min-w-0 flex-col sm:flex-row sm:items-center sm:gap-3">
                        <span className="truncate font-medium text-ink group-hover:text-white">{c.name}</span>
                        <span className="flex min-w-0 shrink-[4] items-center gap-1.5 text-xs uppercase text-faint">
                          <span className="tabular sm:hidden">{c.market_cap_rank}</span>
                          <span className="min-w-0 max-w-[6rem] truncate">{c.symbol}</span>
                          {r.live && <span className="size-1.5 shrink-0 rounded-full bg-up" title="Live price" />}
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td className="whitespace-nowrap py-3 pl-2 pr-4 text-right font-medium sm:px-3">
                    <FlashPrice value={r.price} />
                    <span className="block text-xs sm:hidden"><Change value={r.h24} /></span>
                  </td>
                  <td className="hidden px-3 py-3 text-right sm:table-cell"><Change value={r.h1} /></td>
                  <td className="hidden px-3 py-3 text-right sm:table-cell"><Change value={r.h24} /></td>
                  <td className="hidden px-3 py-3 text-right sm:table-cell"><Change value={r.d7} /></td>
                  <td className="hidden px-3 py-3 text-right tabular md:table-cell">{formatCompact(r.mcap)}</td>
                  <td className="hidden px-3 py-3 text-right tabular text-muted lg:table-cell">{formatCompact(r.volume)}</td>
                  <td className="hidden px-3 py-2 pr-5 lg:table-cell">
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
