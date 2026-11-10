# CriptoBoard

Real-time crypto market dashboard built with Next.js 16 (App Router, Cache Components), Tailwind CSS v4 and Recharts.

## Run

```bash
npm install
npm run dev     # http://localhost:3000
```

## Features

- **Market list** (`/`): top 100 coins ranked by market cap, with live prices over a Binance WebSocket. Prices flash on each tick. Includes search, sortable columns, 7-day sparklines, global market stats, and top gainers/losers.
- **Coin details** (`/coin/[id]`): live price, 24h range, market stats, performance and description, plus an interactive price-history chart with **1D · 7D · 1M · 6M · 1Y · ALL** ranges (crosshair tooltip, period high/low).

## Data sources (no API keys needed)

| What | Source |
|---|---|
| Ranking, market caps, coin info | CoinGecko public API (server-side, cached ~1 min) |
| Live prices | Binance public market-data WebSocket (`data-stream.binance.vision`) |
| Price history | Binance klines (full history); falls back to CoinGecko for coins not on Binance (free tier: max 365 days) |

Live ticks and Binance history are checked against the CoinGecko price. A Binance pair that is more than 10% away is ignored, because it is probably a different token with the same ticker.

## Structure

```
src/lib/api.ts              server data access ("use cache")
src/lib/useLiveTickers.ts   WebSocket hook (auto-reconnect, batched updates)
src/app/api/history/[id]    price-history route handler
src/components/             MarketTable, CoinView, PriceChart, ui primitives
```
