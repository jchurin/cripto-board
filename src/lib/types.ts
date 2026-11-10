export type MarketCoin = {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  high_24h: number | null;
  low_24h: number | null;
  circulating_supply: number | null;
  price_change_percentage_1h_in_currency?: number | null;
  price_change_percentage_24h_in_currency?: number | null;
  price_change_percentage_7d_in_currency?: number | null;
  sparkline_in_7d?: { price: number[] };
};

export type GlobalStats = {
  total_market_cap: number;
  total_volume: number;
  market_cap_change_percentage_24h_usd: number;
  btc_dominance: number;
  eth_dominance: number;
  active_cryptocurrencies: number;
};

export type CoinDetail = {
  id: string;
  symbol: string;
  name: string;
  image: string;
  rank: number | null;
  description: string;
  homepage: string | null;
  categories: string[];
  price: number;
  change24h: number | null;
  change7d: number | null;
  change30d: number | null;
  change1y: number | null;
  marketCap: number;
  fdv: number | null;
  volume: number;
  high24h: number | null;
  low24h: number | null;
  circulating: number | null;
  totalSupply: number | null;
  maxSupply: number | null;
  ath: number | null;
  athDate: string | null;
  atl: number | null;
  atlDate: string | null;
};

export const RANGES = ["1D", "7D", "1M", "6M", "1Y", "ALL"] as const;
export type Range = (typeof RANGES)[number];

export type HistoryPoint = { t: number; p: number };
export type HistoryResponse = {
  points: HistoryPoint[];
  source: "binance" | "coingecko";
  /** True when the requested range had to be truncated (CoinGecko free tier = 365d). */
  truncated: boolean;
};
