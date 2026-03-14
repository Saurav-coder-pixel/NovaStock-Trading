/**
 * StockLinearChart — Linear performance chart for Stock Exchange page.
 * Single asset: real price. Compare mode: up to 3 stocks, % change from session start.
 * Fetches from Yahoo Finance, polls every 15s, keeps last 60 points.
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { GitCompare } from 'lucide-react';
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
import { Stock } from '../../types';

interface ChartRow {
  time: number;
  [key: string]: number | undefined;
}

interface StockLinearChartProps {
  selectedStock: Stock;
  availableStocks: Stock[];
}

const MAX_POINTS = 60;
const POLL_MS = 15_000;
const STOCK_COLORS = ['#0ea5e9', '#ec4899', '#f59e0b'];

const formatTs = (ts: number) =>
  new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const formatTsLong = (ts: number) =>
  new Date(ts).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

async function fetchYahooChart(symbol: string): Promise<{ time: number; close: number }[]> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=5m&range=1d`;
  const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
  const res = await fetch(proxyUrl);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  const result = data?.chart?.result?.[0];
  if (!result) throw new Error('Invalid response');
  const timestamps = result.timestamp || [];
  const quote = result.indicators?.quote?.[0];
  if (!quote?.close) throw new Error('No quote data');
  const points: { time: number; close: number }[] = [];
  for (let i = 0; i < timestamps.length; i++) {
    const c = quote.close[i];
    if (c != null && c > 0) {
      points.push({ time: timestamps[i] * 1000, close: c });
    }
  }
  return points;
}

const StockLinearChart: React.FC<StockLinearChartProps> = ({ selectedStock, availableStocks }) => {
  const [chartData, setChartData] = useState<ChartRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [compareSelected, setCompareSelected] = useState<string[]>([]);
  const baselineRef = useRef<Record<string, number>>({});
  const abortRef = useRef<AbortController | null>(null);

  const symbols = compareMode
    ? [selectedStock.symbol, ...compareSelected.filter(s => s !== selectedStock.symbol)].slice(0, 3)
    : [selectedStock.symbol];
  const showPct = compareMode && symbols.length > 1;

  const pct = (current: number, base: number) =>
    base === 0 ? 0 : ((current - base) / base) * 100;

  const fetchAndSet = useCallback(async (signal: AbortSignal) => {
    try {
      const toFetch = symbols;
      const results = await Promise.allSettled(
        toFetch.map(sym => fetchYahooChart(sym))
      );

      const histories: Record<string, { time: number; close: number }[]> = {};
      toFetch.forEach((sym, i) => {
        const r = results[i];
        if (r.status === 'fulfilled' && r.value.length > 0) {
          histories[sym] = r.value;
          if (!baselineRef.current[sym]) {
            baselineRef.current[sym] = r.value[0].close;
          }
        }
      });

      if (Object.keys(histories).length === 0) {
        setError('No data received');
        setIsLoading(false);
        return;
      }

      const allTimes = new Set<number>();
      Object.values(histories).forEach(h => h.forEach(p => allTimes.add(p.time)));
      const sortedTimes = Array.from(allTimes).sort((a, b) => a - b);

      const rows: ChartRow[] = sortedTimes.map(t => {
        const row: ChartRow = { time: t };
        toFetch.forEach(sym => {
          const h = histories[sym] || [];
          const point = h.find(p => Math.abs(p.time - t) < 120_000) ?? h.reduce<{ time: number; close: number } | null>(
            (best, p) => {
              const d = Math.abs(p.time - t);
              return d < 120_000 && (!best || d < Math.abs(best.time - t)) ? p : best;
            },
            null
          );
          if (point) {
            const base = baselineRef.current[sym] ?? point.close;
            row[sym] = showPct ? pct(point.close, base) : point.close;
          }
        });
        return row;
      });

      const trimmed = rows.length > MAX_POINTS ? rows.slice(-MAX_POINTS) : rows;
      setChartData(trimmed);
      setError(null);
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        setError((e as Error).message || 'Failed to fetch');
      }
    } finally {
      setIsLoading(false);
    }
  }, [symbols.join(','), showPct]);

  useEffect(() => {
    setError(null);
    setChartData([]);
    setIsLoading(true);
    baselineRef.current = {};

    const ac = new AbortController();
    abortRef.current = ac;
    fetchAndSet(ac.signal).catch(() => {});

    const id = setInterval(() => {
      fetchAndSet(ac.signal).catch(() => {});
    }, POLL_MS);

    return () => {
      ac.abort();
      clearInterval(id);
    };
  }, [fetchAndSet]);

  const toggleCompare = (sym: string) => {
    setCompareSelected(prev => {
      const next = prev.includes(sym) ? prev.filter(s => s !== sym) : [...prev, sym];
      return next.slice(0, 3);
    });
  };

  const applyCompare = () => {
    setCompareMode(compareSelected.length > 0);
    setCompareOpen(false);
  };

  const displayData = useMemo(() => chartData, [chartData]);

  const [yMin, yMax] = useMemo(() => {
    let mn = Infinity, mx = -Infinity;
    displayData.forEach(row => {
      symbols.forEach(sym => {
        const v = row[sym];
        if (typeof v === 'number') {
          mn = Math.min(mn, v);
          mx = Math.max(mx, v);
        }
      });
    });
    if (!isFinite(mn)) return [0, 100];
    const pad = Math.max(0.5, (mx - mn) * 0.12);
    return [mn - pad, mx + pad];
  }, [displayData, symbols.join(',')]);

  if (error) {
    return (
      <div className="w-full h-full bg-[#111318] flex flex-col items-center justify-center gap-3 text-slate-400 font-mono text-sm">
        <span>{error}</span>
        <button
          onClick={() => {
            setError(null);
            setIsLoading(true);
            fetchAndSet(abortRef.current?.signal!).catch(() => {});
          }}
          className="px-3 py-1.5 rounded-md bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 font-bold hover:bg-indigo-500/30"
        >
          Retry
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full h-full bg-[#111318] flex items-center justify-center text-slate-500 font-mono text-sm" style={{ fontSize: '14px' }}>
        Fetching live performance data…
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-xl p-3 shadow-2xl font-mono min-w-[180px]" style={{ background: '#1A1D24', border: '1px solid #1E293B', fontSize: '14px' }}>
        <div className="text-slate-400 border-b border-[#1E293B] pb-1.5 mb-2" style={{ fontSize: '12px' }}>
          {label ? formatTsLong(label) : ''}
        </div>
        {payload.map((p: any, i: number) => (
          <div key={p.dataKey} className="flex justify-between gap-4 py-0.5">
            <span className="text-slate-300 font-bold">{p.dataKey}</span>
            <span style={{ color: p.payload[p.dataKey] >= 0 ? '#00D084' : '#FF3B5C' }}>
              {showPct
                ? `${(p.payload[p.dataKey] as number) >= 0 ? '+' : ''}${(p.payload[p.dataKey] as number).toFixed(2)}%`
                : `$${(p.payload[p.dataKey] as number).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full h-full bg-[#111318] flex flex-col select-none">
      <div className="flex items-center justify-between px-4 pt-2 shrink-0 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-slate-200" style={{ fontSize: '14px' }}>
            {selectedStock.symbol} Performance
          </span>
          <div className="relative">
            <button
              onClick={() => setCompareOpen(v => !v)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-bold border transition-colors ${
                compareMode ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40' : 'text-slate-500 border-[#1E293B] hover:text-slate-300'
              }`}
            >
              <GitCompare size={12} /> Compare
            </button>
            {compareOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setCompareOpen(false)} />
                <div
                  className="absolute left-0 top-full mt-1 z-20 bg-[#1A1D24] border border-[#1E293B] rounded-lg shadow-xl p-3 min-w-[200px]"
                  style={{ fontSize: '14px' }}
                >
                  <div className="text-slate-400 font-bold mb-2 text-xs uppercase">Select up to 3 stocks</div>
                  <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                    {availableStocks.map(s => (
                      <label key={s.symbol} className="flex items-center gap-2 cursor-pointer hover:bg-white/5 rounded px-2 py-1">
                        <input
                          type="checkbox"
                          checked={compareSelected.includes(s.symbol)}
                          onChange={() => toggleCompare(s.symbol)}
                          disabled={!compareSelected.includes(s.symbol) && compareSelected.length >= 3}
                        />
                        <span className="text-slate-200">{s.symbol}</span>
                        <span className="text-slate-500 text-xs">{s.name}</span>
                      </label>
                    ))}
                  </div>
                  <button
                    onClick={applyCompare}
                    className="mt-2 w-full py-1.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 text-xs font-bold hover:bg-indigo-500/30"
                  >
                    Apply
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 pr-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={displayData} margin={{ top: 8, right: 64, left: -24, bottom: 0 }}>
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
              tickFormatter={v =>
                showPct ? `${v >= 0 ? '+' : ''}${Number(v).toFixed(1)}%` : `$${Number(v).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
              }
              stroke="#1E2130"
              tick={{ fontSize: 9, fill: '#475569', fontFamily: 'JetBrains Mono, monospace' }}
              axisLine={false}
              tickLine={false}
              width={56}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#475569', strokeWidth: 1, strokeDasharray: '3 3' }} />
            {showPct && <ReferenceLine y={0} stroke="#334155" strokeDasharray="6 3" strokeWidth={1} />}
            {symbols.map((sym, i) => (
              <Line
                key={sym}
                type="monotone"
                dataKey={sym}
                stroke={STOCK_COLORS[i % STOCK_COLORS.length]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: STOCK_COLORS[i % STOCK_COLORS.length], stroke: '#111318', strokeWidth: 2 }}
                isAnimationActive={false}
                connectNulls
                label={({ index: idx, x, y, value }) => {
                  if (idx !== displayData.length - 1 || value == null) return null;
                  const color = STOCK_COLORS[i % STOCK_COLORS.length];
                  const stock = availableStocks.find(s => s.symbol === sym);
                  const name = stock?.name?.split(' ')[0] || sym;
                  return (
                    <text x={x + 4} y={y + 4} fontSize={9} fontFamily="JetBrains Mono" fontWeight="bold" fill={color}>
                      {name} {showPct ? `${Number(value) >= 0 ? '+' : ''}${Number(value).toFixed(2)}%` : `$${Number(value).toFixed(2)}`}
                    </text>
                  );
                }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center gap-3 px-4 pb-2 shrink-0 flex-wrap" style={{ fontSize: '14px' }}>
        {symbols.map((sym, i) => {
          const last = displayData[displayData.length - 1];
          const val = last?.[sym];
          const color = STOCK_COLORS[i % STOCK_COLORS.length];
          const stock = availableStocks.find(s => s.symbol === sym);
          return (
            <div key={sym} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-slate-300 font-medium">{stock?.name || sym}</span>
              {val != null && (
                <span style={{ color: val >= 0 ? '#00D084' : '#FF3B5C' }} className="font-mono font-bold">
                  {showPct ? `${val >= 0 ? '+' : ''}${val.toFixed(2)}%` : `$${val.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StockLinearChart;
