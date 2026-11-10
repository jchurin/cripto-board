"use client";

import { useEffect, useRef, useState } from "react";

export type LiveTick = { price: number; open24h: number; change24h: number; ts: number };
export type ConnectionState = "connecting" | "live" | "offline";

const STREAM = "wss://data-stream.binance.vision/stream?streams=";

/**
 * Subscribes to Binance mini-ticker streams (≈1 update/sec per symbol) for the
 * given base symbols quoted in USDT. `reference` maps symbol → known USD price
 * and is used to drop ticks from Binance pairs that share a symbol with a
 * different asset (>10% off the reference price).
 */
export function useLiveTickers(reference: Record<string, number>) {
  const [ticks, setTicks] = useState<Record<string, LiveTick>>({});
  const [state, setState] = useState<ConnectionState>("connecting");
  const refRef = useRef(reference);
  useEffect(() => {
    refRef.current = reference;
  }, [reference]);

  const key = Object.keys(reference)
    .filter((s) => s !== "usdt" && /^[a-z0-9]+$/.test(s))
    .sort()
    .join(",");

  useEffect(() => {
    if (!key) return;
    let ws: WebSocket | null = null;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let attempts = 0;
    let closed = false;
    const pending: Record<string, LiveTick> = {};

    const connect = () => {
      setState("connecting");
      const streams = key.split(",").map((s) => `${s}usdt@miniTicker`).join("/");
      ws = new WebSocket(STREAM + streams);
      ws.onopen = () => {
        attempts = 0;
        setState("live");
      };
      ws.onmessage = (ev) => {
        const msg = JSON.parse(ev.data as string) as {
          data: { s: string; c: string; o: string; E: number };
        };
        const sym = msg.data.s.replace(/USDT$/, "").toLowerCase();
        const price = Number(msg.data.c);
        const open = Number(msg.data.o);
        const ref = refRef.current[sym];
        if (!ref || Math.abs(price / ref - 1) > 0.1) return;
        pending[sym] = {
          price,
          open24h: open,
          change24h: open ? (price / open - 1) * 100 : 0,
          ts: msg.data.E,
        };
      };
      ws.onclose = () => {
        if (closed) return;
        setState("offline");
        retry = setTimeout(connect, Math.min(30_000, 1000 * 2 ** attempts++));
      };
      ws.onerror = () => ws?.close();
    };

    connect();
    // Batch renders: flush buffered ticks a few times per second.
    const flush = setInterval(() => {
      const keys = Object.keys(pending);
      if (!keys.length) return;
      const batch = { ...pending };
      for (const k of keys) delete pending[k];
      setTicks((prev) => ({ ...prev, ...batch }));
    }, 500);

    return () => {
      closed = true;
      clearTimeout(retry);
      clearInterval(flush);
      ws?.close();
    };
  }, [key]);

  return { ticks, state };
}
