import "server-only";
import { cacheLife } from "next/cache";
import type {
  CoinDetail,
  GlobalStats,
  HistoryPoint,
  HistoryResponse,
  MarketCoin,
  Range,
} from "./types";

const CG = "https://api.coingecko.com/api/v3";
const BINANCE = "https://data-api.binance.vision/api/v3";

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res.json() as Promise<T>;
}

/** Top coins ordered by market cap (the usual "popularity" ranking). */
export async function getMarkets(): Promise<MarketCoin[]> {
  "use cache";
  cacheLife("minutes");
  return getJson<MarketCoin[]>(
    `${CG}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1` +
      `&sparkline=true&price_change_percentage=1h,24h,7d`,
  );
}

export async function getGlobal(): Promise<GlobalStats> {
  "use cache";
  cacheLife("minutes");
  const { data } = await getJson<{
    data: {
      total_market_cap: Record<string, number>;
      total_volume: Record<string, number>;
      market_cap_change_percentage_24h_usd: number;
      market_cap_percentage: Record<string, number>;
      active_cryptocurrencies: number;
    };
  }>(`${CG}/global`);
  return {
    total_market_cap: data.total_market_cap.usd,
    total_volume: data.total_volume.usd,
    market_cap_change_percentage_24h_usd: data.market_cap_change_percentage_24h_usd,
    btc_dominance: data.market_cap_percentage.btc ?? 0,
    eth_dominance: data.market_cap_percentage.eth ?? 0,
    active_cryptocurrencies: data.active_cryptocurrencies,
  };
}

type CgCoin = {
  id: string;
  symbol: string;
  name: string;
  image: { large: string };
  market_cap_rank: number | null;
  description: { en: string };
  links: { homepage: string[] };
  categories: (string | null)[];
  market_data: {
    current_price: { usd: number };
    price_change_percentage_24h: number | null;
    price_change_percentage_7d: number | null;
    price_change_percentage_30d: number | null;
    price_change_percentage_1y: number | null;
    market_cap: { usd: number };
    fully_diluted_valuation: { usd?: number };
    total_volume: { usd: number };
    high_24h: { usd?: number };
    low_24h: { usd?: number };
    circulating_supply: number | null;
    total_supply: number | null;
    max_supply: number | null;
    ath: { usd?: number };
    ath_date: { usd?: string };
    atl: { usd?: number };
    atl_date: { usd?: string };
  };
};

/** Returns null when the coin id doesn't exist. */
export async function getCoin(id: string): Promise<CoinDetail | null> {
  "use cache";
  cacheLife("minutes");
  const res = await fetch(
    `${CG}/coins/${encodeURIComponent(id)}?localization=false&tickers=false` +
      `&community_data=false&developer_data=false&sparkline=false`,
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`CoinGecko ${res.status} for coin ${id}`);
  const c = (await res.json()) as CgCoin;
  const m = c.market_data;
  return {
    id: c.id,
    symbol: c.symbol,
    name: c.name,
    image: c.image.large,
    rank: c.market_cap_rank,
    description: stripHtml(c.description.en ?? "").split(/\r?\n\r?\n/)[0] ?? "",
    homepage: c.links.homepage.find(Boolean) ?? null,
    categories: c.categories.filter((x): x is string => !!x).slice(0, 4),
    price: m.current_price.usd,
    change24h: m.price_change_percentage_24h,
    change7d: m.price_change_percentage_7d,
    change30d: m.price_change_percentage_30d,
    change1y: m.price_change_percentage_1y,
    marketCap: m.market_cap.usd,
    fdv: m.fully_diluted_valuation.usd ?? null,
    volume: m.total_volume.usd,
    high24h: m.high_24h.usd ?? null,
    low24h: m.low_24h.usd ?? null,
    circulating: m.circulating_supply,
    totalSupply: m.total_supply,
    maxSupply: m.max_supply,
    ath: m.ath.usd ?? null,
    athDate: m.ath_date.usd ?? null,
    atl: m.atl.usd ?? null,
    atlDate: m.atl_date.usd ?? null,
  };
}

function stripHtml(s: string) {
  return s.replace(/<[^>]*>/g, "").trim();
}

/* ------------------------------ History ------------------------------ */

const BINANCE_RANGES: Record<Range, { interval: string; limit: number }> = {
  "1D": { interval: "5m", limit: 288 },
  "7D": { interval: "1h", limit: 168 },
  "1M": { interval: "4h", limit: 180 },
  "6M": { interval: "1d", limit: 183 },
  "1Y": { interval: "1d", limit: 365 },
  ALL: { interval: "1w", limit: 1000 },
};

const CG_DAYS: Record<Range, number> = {
  "1D": 1,
  "7D": 7,
  "1M": 30,
  "6M": 180,
  "1Y": 365,
  ALL: 365, // free tier hard limit
};

async function binanceHistory(symbol: string, range: Range): Promise<HistoryPoint[] | null> {
  const { interval, limit } = BINANCE_RANGES[range];
  const res = await fetch(
    `${BINANCE}/klines?symbol=${symbol.toUpperCase()}USDT&interval=${interval}&limit=${limit}`,
  );
  if (!res.ok) return null; // pair doesn't exist on Binance
  const rows = (await res.json()) as [number, string, string, string, string][];
  if (!rows.length) return null;
  return rows.map((r) => ({ t: r[0], p: Number(r[4]) }));
}

async function coingeckoHistory(id: string, range: Range): Promise<HistoryPoint[]> {
  const data = await getJson<{ prices: [number, number][] }>(
    `${CG}/coins/${encodeURIComponent(id)}/market_chart?vs_currency=usd&days=${CG_DAYS[range]}`,
  );
  return data.prices.map(([t, p]) => ({ t, p }));
}

/**
 * Price history. Prefers Binance (full history, no key, generous limits) and
 * falls back to CoinGecko when the coin isn't listed against USDT or when the
 * Binance ticker clearly belongs to a different asset with the same symbol.
 */
export async function getHistory(
  id: string,
  symbol: string,
  range: Range,
  referencePrice: number,
): Promise<HistoryResponse> {
  "use cache";
  if (range === "1D") cacheLife("seconds");
  else cacheLife("minutes");

  if (symbol.toLowerCase() !== "usdt") {
    const pts = await binanceHistory(symbol, range).catch(() => null);
    const last = pts?.at(-1)?.p;
    if (pts && last && Math.abs(last / referencePrice - 1) < 0.1) {
      return { points: pts, source: "binance", truncated: false };
    }
  }
  const points = await coingeckoHistory(id, range);
  return { points, source: "coingecko", truncated: range === "ALL" };
}
