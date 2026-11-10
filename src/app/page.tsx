import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { MarketTable } from "@/components/MarketTable";
import { Change } from "@/components/ui";
import { getGlobal, getMarkets } from "@/lib/api";
import { formatCompact, formatPrice } from "@/lib/format";

export default function Home() {
  return (
    <div className="space-y-8">
      <section className="rise">
        <p className="mb-2 text-sm font-medium text-accent">Crypto market, live</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">
          Today&apos;s <span className="gradient-text">cryptocurrency</span> prices
        </h1>
        <p className="mt-3 max-w-2xl text-muted">
          The top coins ranked by market capitalization, with prices streaming in real time.
          Pick any coin to explore its full price history.
        </p>
      </section>

      <Suspense fallback={<StatsSkeleton />}>
        <Overview />
      </Suspense>

      <Suspense fallback={<TableSkeleton />}>
        <Markets />
      </Suspense>
    </div>
  );
}

async function Markets() {
  const coins = await getMarkets().catch(() => null);
  if (!coins) return <ErrorCard />;
  return <MarketTable coins={coins} />;
}

async function Overview() {
  const [global, coins] = await Promise.all([
    getGlobal().catch(() => null),
    getMarkets().catch(() => null),
  ]);
  if (!global || !coins) return null;

  const ranked = coins.filter((c) => c.price_change_percentage_24h_in_currency != null);
  const by24h = [...ranked].sort(
    (a, b) => b.price_change_percentage_24h_in_currency! - a.price_change_percentage_24h_in_currency!,
  );
  const gainers = by24h.slice(0, 3);
  const losers = by24h.slice(-3).reverse();

  return (
    <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard label="Total market cap" value={formatCompact(global.total_market_cap)}>
        <Change value={global.market_cap_change_percentage_24h_usd} pill />
        <span className="text-faint">24h</span>
      </StatCard>
      <StatCard label="24h volume" value={formatCompact(global.total_volume)}>
        <span className="text-muted">{global.active_cryptocurrencies.toLocaleString("en-US")} active coins</span>
      </StatCard>
      <div className="glass rise rounded-2xl p-5">
        <p className="text-xs uppercase tracking-wider text-muted">Dominance</p>
        <Dominance label="BTC" value={global.btc_dominance} />
        <Dominance label="ETH" value={global.eth_dominance} />
      </div>
      <div className="glass rise grid grid-cols-2 gap-4 rounded-2xl p-5">
        <Movers title="Top gainers" coins={gainers} />
        <Movers title="Top losers" coins={losers} />
      </div>
    </section>
  );
}

function StatCard({ label, value, children }: { label: string; value: string; children: React.ReactNode }) {
  return (
    <div className="glass rise rounded-2xl p-5">
      <p className="text-xs uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight tabular">{value}</p>
      <div className="mt-2 flex items-center gap-2 text-sm">{children}</div>
    </div>
  );
}

function Dominance({ label, value }: { label: string; value: number }) {
  return (
    <div className="mt-3">
      <div className="mb-1.5 flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="tabular text-muted">{value.toFixed(1)}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
        <div className="h-full rounded-full bg-gradient-to-r from-accent to-accent-2" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function Movers({ title, coins }: { title: string; coins: Awaited<ReturnType<typeof getMarkets>> }) {
  return (
    <div className="min-w-0">
      <p className="text-xs uppercase tracking-wider text-muted">{title}</p>
      <ul className="mt-2 space-y-2">
        {coins.map((c) => (
          <li key={c.id}>
            <Link href={`/coin/${c.id}`} className="flex items-center gap-2 text-sm hover:text-white" title={`${c.name} · ${formatPrice(c.current_price)}`}>
              <Image src={c.image} alt="" width={18} height={18} className="size-4.5 shrink-0 rounded-full" />
              <span className="truncate uppercase text-muted">{c.symbol}</span>
              <span className="ml-auto text-xs">
                <Change value={c.price_change_percentage_24h_in_currency} />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ErrorCard() {
  return (
    <div className="glass rounded-2xl p-10 text-center">
      <p className="text-lg font-medium">Couldn&apos;t load market data</p>
      <p className="mt-1 text-sm text-muted">The CoinGecko free API may be rate-limiting. Try again in a minute.</p>
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="glass h-[132px] rounded-2xl p-5">
          <div className="skeleton h-3 w-24" />
          <div className="skeleton mt-4 h-8 w-36" />
          <div className="skeleton mt-3 h-4 w-20" />
        </div>
      ))}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="glass overflow-hidden rounded-2xl">
      <div className="border-b border-line p-4"><div className="skeleton h-6 w-56" /></div>
      {Array.from({ length: 10 }, (_, i) => (
        <div key={i} className="flex items-center gap-4 border-b border-line/60 px-5 py-4">
          <div className="skeleton size-7 rounded-full" />
          <div className="skeleton h-4 w-40" />
          <div className="skeleton ml-auto h-4 w-24" />
          <div className="skeleton h-4 w-16" />
          <div className="skeleton h-8 w-28" />
        </div>
      ))}
    </div>
  );
}
