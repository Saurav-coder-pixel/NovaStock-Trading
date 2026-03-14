/**
 * CryptoTradingLinearChart — Linear price chart for the Crypto Trading page.
 * Fetches 24h hourly data from CoinGecko via corsproxy.io (avoids 401/CORS issue).
 * Falls back to simulated data if the API is unavailable.
 * Polls every 15s and appends live price points.
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';

interface ChartRow {
  time: number;
  price: number;
}

interface CryptoTradingLinearChartProps {
  coinId: string;       // CoinGecko id  e.g. "bitcoin"
  symbol: string;       // e.g. "BTC"
  name: string;         // e.g. "Bitcoin"
  livePrice: number;    // appended every tick
}

const MAX_POINTS = 100;
const POLL_MS = 15_000;
const LINE_COLOR = '#0ea5e9';

const PROXY = 'https://corsproxy.io/?';

const formatTs = (ts: number) =>
  new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const formatTsLong = (ts: number) =>
  new Date(ts).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

/** Try direct, then corsproxy, then throw */
async function safeFetch(url: string): Promise<Response> {
  // Try direct first
  try {
    const r = await fetch(url);
    if (r.ok) return r;
  } catch { /* fall through */ }
  // Try via proxy
  const r2 = await fetch(PROXY + encodeURIComponent(url));
  if (r2.ok) return r2;
  throw new Error(`HTTP ${r2.status}`);
}

/** Generate synthetic 24h hourly data around a base price */
function generateSimulatedHistory(basePrice: number): ChartRow[] {
  if (basePrice <= 0) return [];
  const now = Date.now();
  const rows: ChartRow[] = [];
  let price = basePrice * (1 - 0.02 + Math.random() * 0.02); // start slightly lower
  for (let i = 23; i >= 0; i--) {
    const time = now - i * 3_600_000;
    price = price * (1 + (Math.random() - 0.49) * 0.006);
    rows.push({ time, price });
  }
  // Make the last point match the live price
  rows.push({ time: now, price: basePrice });
  return rows;
}

async function fetchMarketChart(coinId: string): Promise<ChartRow[]> {
  const url = `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=1&interval=hourly`;
  const res = await safeFetch(url);
  const data = await res.json();
  const prices: [number, number][] = data.prices || [];
  if (prices.length === 0) throw new Error('No price data');
  return prices.map(([time, price]) => ({ time, price }));
}

const CryptoTradingLinearChart: React.FC<CryptoTradingLinearChartProps> = ({
  coinId,
  symbol,
  name,
  livePrice,
}) => {
  const [chartData, setChartData] = useState<ChartRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [usingSimulated, setUsingSimulated] = useState(false);
  const lastLivePriceRef = useRef<number>(0);
  const coinIdRef = useRef(coinId);
  coinIdRef.current = coinId;

  const load = useCallback(async (currentCoinId: string) => {
    try {
      const rows = await fetchMarketChart(currentCoinId);
      if (coinIdRef.current === currentCoinId) {
        setChartData(rows.slice(-MAX_POINTS));
        setUsingSimulated(false);
      }
    } catch {
      // API failed — use simulated data from live price
      if (coinIdRef.current === currentCoinId && livePrice > 0) {
        setChartData(generateSimulatedHistory(livePrice));
        setUsingSimulated(true);
      }
    } finally {
      if (coinIdRef.current === currentCoinId) {
        setIsLoading(false);
      }
    }
  }, [livePrice]);

  // Load when coin changes
  useEffect(() => {
    setIsLoading(true);
    setChartData([]);
    setUsingSimulated(false);
    lastLivePriceRef.current = 0;

    load(coinId);

    const intervalId = setInterval(() => load(coinId), POLL_MS * 4);
    return () => clearInterval(intervalId);
  }, [coinId]);

  // When still loading and live price arrives — generate simulated data immediately
  useEffect(() => {
    if (isLoading && livePrice > 0 && chartData.length === 0) {
      setChartData(generateSimulatedHistory(livePrice));
      setUsingSimulated(true);
      setIsLoading(false);
    }
  }, [isLoading, livePrice, chartData.length]);

  // Append live price point every tick
  useEffect(() => {
    if (livePrice <= 0 || livePrice === lastLivePriceRef.current) return;
    lastLivePriceRef.current = livePrice;
    const now = Date.now();
    setChartData(prev => {
      if (prev.length === 0) {
        // First live point — seed history
        return generateSimulatedHistory(livePrice);
      }
      const merged = [...prev, { time: now, price: livePrice }];
      return merged.slice(-MAX_POINTS);
    });
  }, [livePrice]);

  const [yMin, yMax] = useMemo(() => {
    if (chartData.length === 0) return [0, 1];
    let mn = Infinity, mx = -Infinity;
    chartData.forEach(r => {
      mn = Math.min(mn, r.price);
      mx = Math.max(mx, r.price);
    });
    const pad = Math.max(1, (mx - mn) * 0.08);
    return [mn - pad, mx + pad];
  }, [chartData]);

  const baselinePrice = chartData[0]?.price;

  if (isLoading) {
    return (
      <div className="w-full h-full bg-[#111318] flex items-center justify-center text-slate-500 font-mono text-sm">
        Fetching price history…
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const val: number = payload[0]?.value;
    const fromBase = baselinePrice ? ((val - baselinePrice) / baselinePrice) * 100 : 0;
    return (
      <div className="rounded-xl p-3 shadow-2xl font-mono min-w-[180px]" style={{ background: '#1A1D24', border: '1px solid #1E293B', fontSize: '13px' }}>
        <div className="text-slate-400 border-b border-[#1E293B] pb-1.5 mb-2" style={{ fontSize: '11px' }}>
          {label ? formatTsLong(label) : ''}
        </div>
        <div className="flex justify-between gap-4 py-0.5">
          <span className="text-slate-300 font-bold">{symbol}</span>
          <span style={{ color: LINE_COLOR }}>
            ${val?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: val < 1 ? 6 : 2 })}
          </span>
        </div>
        <div className="flex justify-between gap-4 py-0.5">
          <span className="text-slate-500">vs open</span>
          <span style={{ color: fromBase >= 0 ? '#00D084' : '#FF3B5C' }}>
            {fromBase >= 0 ? '+' : ''}{fromBase.toFixed(2)}%
          </span>
        </div>
      </div>
    );
  };

  const lastVal = chartData[chartData.length - 1]?.price;
  const openVal = chartData[0]?.price;
  const pctChange = openVal ? ((lastVal - openVal) / openVal) * 100 : 0;

  return (
    <div className="w-full h-full bg-[#111318] flex flex-col select-none">
      <div className="flex items-center justify-between px-4 pt-2 shrink-0 gap-2">
        <span className="font-mono font-bold text-slate-200" style={{ fontSize: '13px' }}>
          {name} ({symbol}) — 24H
          {usingSimulated && <span className="ml-2 text-slate-600 text-[10px]">[simulated]</span>}
        </span>
        <div className="flex items-center gap-3">
          {lastVal != null && (
            <span className="font-mono font-bold text-sky-400" style={{ fontSize: '13px' }}>
              ${lastVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: lastVal < 1 ? 6 : 2 })}
            </span>
          )}
          <span style={{ color: pctChange >= 0 ? '#00D084' : '#FF3B5C', fontSize: '11px' }} className="font-mono font-bold">
            {pctChange >= 0 ? '+' : ''}{pctChange.toFixed(2)}%
          </span>
        </div>
      </div>

      <div className="flex-1 min-h-0 pr-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 4, right: 64, left: -24, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E2130" opacity={0.6} />
            <XAxis
              dataKey="time"
              tickFormatter={formatTs}
              stroke="#1E2130"
              tick={{ fontSize: 9, fill: '#475569', fontFamily: 'JetBrains Mono, monospace' }}
              axisLine={false}
              tickLine={false}
              minTickGap={50}
            />
            <YAxis
              orientation="right"
              domain={[yMin, yMax]}
              tickFormatter={v => {
                const n = Number(v);
                if (n >= 1000) return `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
                if (n >= 1) return `$${n.toFixed(2)}`;
                return `$${n.toFixed(6)}`;
              }}
              stroke="#1E2130"
              tick={{ fontSize: 9, fill: '#475569', fontFamily: 'JetBrains Mono, monospace' }}
              axisLine={false}
              tickLine={false}
              width={70}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#475569', strokeWidth: 1, strokeDasharray: '3 3' }} />
            {baselinePrice != null && (
              <ReferenceLine y={baselinePrice} stroke="#334155" strokeDasharray="4 3" strokeWidth={1} />
            )}
            <Line
              type="monotone"
              dataKey="price"
              stroke={pctChange >= 0 ? '#00D084' : '#FF3B5C'}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: pctChange >= 0 ? '#00D084' : '#FF3B5C', stroke: '#111318', strokeWidth: 2 }}
              isAnimationActive={false}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CryptoTradingLinearChart;
