"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { formatCompact, formatDate, formatNumber, formatPrice } from "@/lib/format";
import type { CoinDetail } from "@/lib/types";
import { useLiveTickers } from "@/lib/useLiveTickers";
import { PriceChart } from "./PriceChart";
import { Change, FlashPrice, LiveBadge } from "./ui";

export function CoinView({ coin }: { coin: CoinDetail }) {
  const reference = useMemo(() => ({ [coin.symbol]: coin.price }), [coin.symbol, coin.price]);
  const { ticks, state } = useLiveTickers(reference);
  const tick = ticks[coin.symbol];
  const price = tick?.price ?? coin.price;
  const change24h = tick?.change24h ?? coin.change24h;
  const ratio = price / coin.price;
  const supplyPct = coin.maxSupply && coin.circulating ? (coin.circulating / coin.maxSupply) * 100 : null;
  const dayRange =
    coin.high24h && coin.low24h && coin.high24h > coin.low24h
      ? Math.min(100, Math.max(0, ((price - coin.low24h) / (coin.high24h - coin.low24h)) * 100))
      : null;

  return (
    <div className="space-y-6">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink">
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6" /></svg>
        All coins
      </Link>

      <section className="rise flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-accent/40 blur-xl" aria-hidden />
            <Image src={coin.image} alt="" width={64} height={64} className="relative size-16 rounded-full" priority />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-semibold tracking-tight">{coin.name}</h1>
              <span className="rounded-md bg-white/5 px-2 py-0.5 text-sm uppercase text-muted">{coin.symbol}</span>
              {coin.rank && (
                <span className="rounded-md bg-accent/15 px-2 py-0.5 text-sm font-medium text-accent">Rank #{coin.rank}</span>
              )}
            </div>
            {coin.categories.length > 0 && (
              <p className="mt-1.5 text-sm text-faint">{coin.categories.join(" · ")}</p>
            )}
          </div>
        </div>

        <div className="lg:text-right">
          <div className="flex items-center gap-3 lg:justify-end">
            <LiveBadge state={tick ? "live" : state === "live" ? "connecting" : state} />
          </div>
          <div className="mt-2 flex flex-wrap items-baseline gap-3 lg:justify-end">
            <FlashPrice value={price} className="text-4xl font-semibold tracking-tight sm:text-5xl" />
            <Change value={change24h} pill />
          </div>
          {dayRange != null && (
            <div className="mt-3 lg:ml-auto lg:w-80">
              <div className="relative h-1.5 rounded-full bg-gradient-to-r from-down/60 via-white/15 to-up/60">
                <span
                  className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-bg bg-white shadow transition-[left] duration-500"
                  style={{ left: `${dayRange}%` }}
                />
              </div>
              <div className="mt-1.5 flex justify-between text-xs text-faint tabular">
                <span>L {formatPrice(coin.low24h)}</span>
                <span>24h range</span>
                <span>H {formatPrice(coin.high24h)}</span>
              </div>
            </div>
          )}
        </div>
      </section>

      <PriceChart id={coin.id} symbol={coin.symbol} refPrice={coin.price} live={tick ? { t: tick.ts, p: tick.price } : null} />

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="glass rise rounded-2xl p-5 lg:col-span-2">
          <h2 className="mb-4 font-semibold">Market stats</h2>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
            <Item label="Market cap" value={formatCompact(coin.marketCap * ratio)} />
            <Item label="Fully diluted val." value={formatCompact(coin.fdv)} />
            <Item label="Volume 24h" value={formatCompact(coin.volume)} />
            <Item label="All-time high" value={formatPrice(coin.ath)} sub={formatDate(coin.athDate)} />
            <Item label="All-time low" value={formatPrice(coin.atl)} sub={formatDate(coin.atlDate)} />
            <Item label="From ATH" value={coin.ath ? <Change value={(price / coin.ath - 1) * 100} /> : "—"} />
            <Item label="Circulating supply" value={`${formatNumber(coin.circulating)} ${coin.symbol.toUpperCase()}`} />
            <Item label="Max supply" value={coin.maxSupply ? formatNumber(coin.maxSupply) : "∞"} />
            <Item
              label="Supply issued"
              value={supplyPct != null ? `${supplyPct.toFixed(1)}%` : "—"}
              sub={
                supplyPct != null ? (
                  <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-white/5">
                    <span className="block h-full rounded-full bg-gradient-to-r from-accent to-accent-2" style={{ width: `${supplyPct}%` }} />
                  </span>
                ) : undefined
              }
            />
          </dl>
        </section>

        <section className="glass rise rounded-2xl p-5">
          <h2 className="mb-4 font-semibold">Performance</h2>
          <ul className="space-y-3 text-sm">
            {[
              ["24 hours", change24h],
              ["7 days", coin.change7d],
              ["30 days", coin.change30d],
              ["1 year", coin.change1y],
            ].map(([label, v]) => (
              <li key={label as string} className="flex items-center justify-between border-b border-line/60 pb-3 last:border-0 last:pb-0">
                <span className="text-muted">{label}</span>
                <Change value={v as number | null} pill />
              </li>
            ))}
          </ul>
        </section>
      </div>

      {coin.description && (
        <section className="glass rise rounded-2xl p-5">
          <h2 className="mb-2 font-semibold">About {coin.name}</h2>
          <p className="max-w-4xl text-sm leading-relaxed text-muted">{coin.description}</p>
          {coin.homepage && (
            <a href={coin.homepage} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm text-accent hover:underline">
              Official website ↗
            </a>
          )}
        </section>
      )}
    </div>
  );
}

function Item({ label, value, sub }: { label: string; value: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-1 font-medium tabular">{value}</dd>
      {sub && <dd className="text-xs text-faint">{sub}</dd>}
    </div>
  );
}
