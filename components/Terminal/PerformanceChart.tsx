/**
 * PerformanceChart — self-contained real-time multi-asset % performance chart.
 *
 * Props:
 *   mode: 'crypto' | 'stocks'
 *   assets: string[]          coin IDs for crypto ('bitcoin') or ticker for stocks ('AAPL')
 *   symbols: string[]         display labels ('BTC', 'AAPL')
 *   colors: string[]          per-asset line color
 *
 * Handles its own data-fetching, polling, timeframe switching, zoom, and volume overlay.
 */

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
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
import { fetchStockHistory } from '../../services/stockService';

// ─── Types ─────────────────────────────────────────────────────────────────────
type Mode = 'crypto' | 'stocks';
type CryptoTf = '1H' | '6H' | '24H' | '7D' | '30D';
type StocksTf = '1H' | '6H' | '24H' | '7D' | '30D';
export type PerfTimeframe = CryptoTf;

interface PricePoint { time: number; price: number; volume?: number }
interface ChartRow {
  time: number;
  [key: string]: number | undefined;
  __vol?: number;
}

interface PerformanceChartProps {
  mode: Mode;
  assets: string[];    // CoinGecko IDs or Yahoo ticker
  symbols: string[];   // display labels
  colors: string[];
  onTimeframeChange?: (tf: PerfTimeframe) => void;
}

// ─── Config ────────────────────────────────────────────────────────────────────
const CRYPTO_TF_PARAMS: Record<CryptoTf, string> = {
  '1H':  'days=0.04&interval=minutely',
  '6H':  'days=0.25&interval=minutely',
  '24H': 'days=1&interval=hourly',
  '7D':  'days=7&interval=daily',
  '30D': 'days=30&interval=daily',
};

// Map performance chart timeframes to stockService timeframe strings
const STOCK_TF_MAP: Record<PerfTimeframe, string> = {
  '1H':  '1H',
  '6H':  '4H',
  '24H': '1D',
  '7D':  '1W',
  '30D': '1D', // stockService doesn't have 30D; 1D gives max range
};

const STOCK_POLL_MS  = 30_000;
const CRYPTO_POLL_MS = 15_000;
const MAX_CHART_POINTS = 60;

// CoinGecko IDs -> display colors for crypto mode
const CRYPTO_COLORS: Record<string, string> = {
  bitcoin: '#F7931A',
  ethereum: '#627EEA',
  solana: '#9945FF',
  binancecoin: '#F3BA2F',
  ripple: '#00AAE4',
};

const TIMEFRAMES: PerfTimeframe[] = ['1H', '6H', '24H', '7D', '30D'];

const SENTIMENT_THRESHOLD = 0.5; // >50% positive = Bullish

// ─── Helpers ────────────────────────────────────────────────────────────────────
const formatTs = (ts: number, tf: PerfTimeframe) => {
  const d = new Date(ts);
  if (tf === '1H' || tf === '6H') {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (tf === '24H') {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const formatTsLong = (ts: number) =>
  new Date(ts).toLocaleString([], {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

const pct = (current: number, base: number) =>
  base === 0 ? 0 : ((current - base) / base) * 100;

// ─── Custom Tooltip ─────────────────────────────────────────────────────────────
const CustomTooltip = ({
  active, payload, label, symbols, colors, assets, priceHistoryRef,
}: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{ background: '#1A1D24', border: '1px solid #1E293B' }}
      className="rounded-xl p-3 shadow-2xl font-mono text-[11px] min-w-[180px]"
    >
      <div className="text-slate-400 border-b border-[#1E293B] pb-1.5 mb-2 text-[10px]">
        {label ? formatTsLong(label) : ''}
      </div>
      {symbols.map((sym: string, i: number) => {
        const entry = payload.find((p: any) => p.dataKey === sym);
        const val = entry ? Number(entry.value) : null;
        // Try to get raw price
        const history: PricePoint[] = priceHistoryRef?.current?.[assets[i]] || [];
        const point = history.find(h => Math.abs(h.time - label) < 120_000);
        const rawPrice = point?.price;
        const color = colors[i % colors.length];
        return (
          <div key={sym} className="flex items-start justify-between gap-6 py-0.5">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
              <span className="text-slate-300 font-bold">{sym}</span>
            </div>
            <div className="text-right">
              {val !== null ? (
                <div className="font-bold" style={{ color: val >= 0 ? '#00D084' : '#FF3B5C' }}>
                  {val > 0 ? '+' : ''}{val.toFixed(3)}%
                </div>
              ) : <div className="text-slate-600">—</div>}
              {rawPrice !== undefined && (
                <div className="text-slate-500 text-[9px]">
                  ${rawPrice < 1 ? rawPrice.toFixed(6) : rawPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── Main Component ─────────────────────────────────────────────────────────────
const PerformanceChart: React.FC<PerformanceChartProps> = ({
  mode, assets, symbols, colors, onTimeframeChange,
}) => {
  const [chartData, setChartData] = useState<ChartRow[]>([]);
  const [timeframe, setTimeframe] = useState<PerfTimeframe>('24H');
  const [visibleAssets, setVisibleAssets] = useState<Set<string>>(new Set(symbols));
  const [showVolume, setShowVolume] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1); // 1 = full, 0.5 = last 50%, etc.
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());
  const [secondsAgo, setSecondsAgo] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [liveFlash, setLiveFlash] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Store baseline (first) price per asset for % change
  const baselineRef = useRef<Record<string, number>>({});
  // Store raw price history per asset keyed by asset ID
  const priceHistoryRef = useRef<Record<string, PricePoint[]>>({});

  // AbortController ref
  const abortRef = useRef<AbortController | null>(null);

  // "X seconds ago" ticker
  useEffect(() => {
    const t = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastUpdated) / 1000));
    }, 1000);
    return () => clearInterval(t);
  }, [lastUpdated]);

  // ── Rebuild chartData from priceHistoryRef (uses baseline or first price) ─────
  const rebuildChart = useCallback(() => {
    const histories = assets.map(a => priceHistoryRef.current[a] || []);
    if (histories.every(h => h.length === 0)) return;

    const allTimes = new Set<number>();
    histories.forEach(h => h.forEach(p => allTimes.add(p.time)));
    const sortedTimes = Array.from(allTimes).sort((a, b) => a - b);

    const bases = assets.map(a => {
      const b = baselineRef.current[a];
      if (b !== undefined && b > 0) return b;
      const h = priceHistoryRef.current[a] || [];
      return h.length > 0 ? h[0].price : 0;
    });

    const rows: ChartRow[] = sortedTimes.map(t => {
      const row: ChartRow = { time: t };
      assets.forEach((a, i) => {
        const h = priceHistoryRef.current[a] || [];
        const point = h.reduce<PricePoint | null>((best, p) => {
          const diff = Math.abs(p.time - t);
          if (diff < 120_000 && (!best || diff < Math.abs(best.time - t))) return p;
          return best;
        }, null);
        if (point && bases[i] > 0) {
          row[symbols[i]] = pct(point.price, bases[i]);
        }
      });
      return row;
    });

    const trimmed = rows.length > MAX_CHART_POINTS ? rows.slice(-MAX_CHART_POINTS) : rows;
    setChartData(trimmed);
    setLastUpdated(Date.now());
    setLiveFlash(true);
    setTimeout(() => setLiveFlash(false), 800);
  }, [assets, symbols]);

  // ── Crypto Fetch: 24h hourly on mount, baseline + % conversion ───────────────
  const fetchCrypto = useCallback(async (signal: AbortSignal) => {
    setError(null);
    const params = 'days=1&interval=hourly';
    try {
      const results = await Promise.allSettled(
        assets.map(id => {
          const url = `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&${params}`;
          return fetch(url, { signal }).then(r => {
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            return r.json();
          });
        })
      );

      let hasData = false;
      results.forEach((res, i) => {
        if (res.status === 'fulfilled') {
          const data = res.value;
          const prices: PricePoint[] = (data.prices || []).map(([t, p]: [number, number]) => ({
            time: t,
            price: p as number,
          }));
          if (prices.length > 0) {
            baselineRef.current[assets[i]] = prices[0].price;
            priceHistoryRef.current[assets[i]] = prices;
            hasData = true;
          }
        }
      });

      if (!hasData) {
        setError('No data received from CoinGecko');
        setIsLoading(false);
        return;
      }

      const histories = assets.map(a => priceHistoryRef.current[a] || []);
      const allTimes = new Set<number>();
      histories.forEach(h => h.forEach(p => allTimes.add(p.time)));
      const sortedTimes = Array.from(allTimes).sort((a, b) => a - b);
      const bases = assets.map(a => baselineRef.current[a] ?? (priceHistoryRef.current[a]?.[0]?.price ?? 0));

      const rows: ChartRow[] = sortedTimes.map(t => {
        const row: ChartRow = { time: t };
        assets.forEach((a, i) => {
          const h = priceHistoryRef.current[a] || [];
          const point = h.reduce<PricePoint | null>((best, p) => {
            const diff = Math.abs(p.time - t);
            if (diff < 120_000 && (!best || diff < Math.abs(best.time - t))) return p;
            return best;
          }, null);
          if (point && bases[i] > 0) {
            row[symbols[i]] = pct(point.price, bases[i]);
          }
        });
        return row;
      });

      setChartData(rows);
      setLastUpdated(Date.now());
      setIsLoading(false);
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
      setError((e as Error).message || 'Failed to fetch data');
      setIsLoading(false);
    }
  }, [assets, symbols]);

  // ── Stock Fetch (uses fetchStockHistory — has CORS proxy + simulated fallback) ──
  const fetchStocks = useCallback(async (_signal: AbortSignal) => {
    const svcTf = STOCK_TF_MAP[timeframe];
    const results = await Promise.allSettled(
      assets.map(sym => fetchStockHistory(sym, svcTf))
    );

    results.forEach((res, i) => {
      if (res.status === 'fulfilled') {
        const candles = res.value;
        const prices: PricePoint[] = candles.map(c => ({
          time: new Date(c.time).getTime(),
          price: c.close,
          volume: c.volume ?? 0,
        })).filter(pt => pt.price > 0);
        priceHistoryRef.current[assets[i]] = prices;
      }
    });

    rebuildChart();
    setIsLoading(false);
  }, [assets, timeframe, rebuildChart]);


  // ── Poll for live crypto price (every 15s), append % point, keep last 60 ─────
  const pollCryptoPrice = useCallback(async (signal: AbortSignal) => {
    if (Object.keys(baselineRef.current).length === 0) return;
    const ids = assets.join(',');
    try {
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`;
      const res = await fetch(url, { signal });
      if (!res.ok) return;
      const data = await res.json();
      const now = Date.now();
      const row: ChartRow = { time: now };
      let hasAny = false;
      assets.forEach((a, i) => {
        if (data[a]?.usd) {
          const base = baselineRef.current[a] ?? 0;
          if (base > 0) {
            row[symbols[i]] = pct(data[a].usd, base);
            hasAny = true;
          }
          const newPt: PricePoint = { time: now, price: data[a].usd };
          const hist = priceHistoryRef.current[a] || [];
          priceHistoryRef.current[a] = [...hist, newPt];
        }
      });
      if (hasAny) {
        setChartData(prev => {
          const next = [...prev, row];
          return next.length > MAX_CHART_POINTS ? next.slice(-MAX_CHART_POINTS) : next;
        });
        setLastUpdated(Date.now());
        setLiveFlash(true);
        setTimeout(() => setLiveFlash(false), 800);
      }
    } catch (_) { /* AbortError or network */ }
  }, [assets, symbols]);

  // ── Stocks re-fetch ─────────────────────────────────────────────────────────
  const pollStocks = useCallback(async (signal: AbortSignal) => {
    await fetchStocks(signal);
  }, [fetchStocks]);

  // ── Main data effect ────────────────────────────────────────────────────────
  useEffect(() => {
    setError(null);
    priceHistoryRef.current = {};
    baselineRef.current = {};
    setChartData([]);
    setIsLoading(true);

    const ac = new AbortController();
    abortRef.current = ac;

    const load = mode === 'crypto' ? fetchCrypto : fetchStocks;
    const poll = mode === 'crypto' ? pollCryptoPrice : pollStocks;
    const pollMs = mode === 'crypto' ? CRYPTO_POLL_MS : STOCK_POLL_MS;

    load(ac.signal).catch(() => {});

    const intervalId = setInterval(() => {
      poll(ac.signal).catch(() => {});
    }, pollMs);

    return () => {
      ac.abort();
      clearInterval(intervalId);
    };
  }, [mode, timeframe, fetchCrypto, fetchStocks, pollCryptoPrice, pollStocks]);

  const handleTimeframe = (tf: PerfTimeframe) => {
    setTimeframe(tf);
    onTimeframeChange?.(tf);
  };

  const toggleAsset = useCallback((sym: string) => {
    setVisibleAssets(prev => {
      const next = new Set(prev);
      if (next.has(sym) && next.size > 1) next.delete(sym);
      else next.add(sym);
      return next;
    });
  }, []);

  // ── Zoom slice ──────────────────────────────────────────────────────────────
  const displayData = useMemo(() => {
    if (chartData.length === 0) return [];
    const count = Math.max(10, Math.floor(chartData.length * zoomLevel));
    return chartData.slice(chartData.length - count);
  }, [chartData, zoomLevel]);

  // ── Header stats ────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    if (displayData.length === 0 || symbols.length === 0) return null;
    const last = displayData[displayData.length - 1];
    const perfList = symbols.map((sym, i) => ({
      sym,
      color: colors[i % colors.length],
      pct: typeof last[sym] === 'number' ? (last[sym] as number) : 0,
    }));
    const positives = perfList.filter(p => p.pct >= 0);
    const best = [...perfList].sort((a, b) => b.pct - a.pct)[0];
    const worst = [...perfList].sort((a, b) => a.pct - b.pct)[0];
    const sentiment =
      positives.length > perfList.length * SENTIMENT_THRESHOLD
        ? 'Bullish'
        : positives.length < perfList.length * (1 - SENTIMENT_THRESHOLD)
        ? 'Bearish'
        : 'Mixed';
    return { best, worst, sentiment };
  }, [displayData, symbols, colors]);

  // ── Y-axis domain ───────────────────────────────────────────────────────────
  const [yMin, yMax] = useMemo(() => {
    let mn = Infinity, mx = -Infinity;
    displayData.forEach(row => {
      symbols.forEach(sym => {
        const v = row[sym];
        if (typeof v === 'number') {
          if (v < mn) mn = v;
          if (v > mx) mx = v;
        }
      });
    });
    if (!isFinite(mn)) return [-1, 1];
    const pad = Math.max(0.5, (mx - mn) * 0.12);
    return [mn - pad, mx + pad];
  }, [displayData, symbols]);

  const sentimentColor =
    stats?.sentiment === 'Bullish' ? '#00D084' :
    stats?.sentiment === 'Bearish' ? '#FF3B5C' : '#f59e0b';

  // Use spec colors for crypto when asset ID known, else props
  const lineColors = useMemo(() => {
    if (mode === 'crypto') {
      return assets.map((a, i) => CRYPTO_COLORS[a] ?? colors[i % colors.length]);
    }
    return colors;
  }, [mode, assets, colors]);

  // ── Error + retry ───────────────────────────────────────────────────────────
  const handleRetry = useCallback(() => {
    setError(null);
    setChartData([]);
    setIsLoading(true);
    baselineRef.current = {};
    priceHistoryRef.current = {};
    const load = mode === 'crypto' ? fetchCrypto : fetchStocks;
    const ac = new AbortController();
    load(ac.signal).catch(() => {});
  }, [mode, fetchCrypto, fetchStocks]);

  if (error) {
    return (
      <div className="w-full h-full bg-[#111318] flex flex-col items-center justify-center gap-3 text-slate-400 font-mono text-xs">
        <span>{error}</span>
        <button
          onClick={handleRetry}
          className="px-3 py-1.5 rounded-md bg-primary/20 text-primary border border-primary/40 font-bold hover:bg-primary/30 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  // ── Loading (text only, no spinner) ─────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="w-full h-full bg-[#111318] flex items-center justify-center text-slate-500 font-mono text-xs">
        Fetching live performance data…
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-[#111318] flex flex-col select-none">

      {/* ── Header Stats Bar ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 pt-2 shrink-0 gap-4 flex-wrap">
        <div className="flex items-center gap-4 text-[11px] font-mono">
          {stats?.best && (
            <span className="flex items-center gap-1">
              <span className="text-base">🟢</span>
              <span className="text-slate-400">{stats.best.sym}</span>
              <span style={{ color: '#00D084' }} className="font-bold">
                {stats.best.pct >= 0 ? '+' : ''}{stats.best.pct.toFixed(2)}%
              </span>
            </span>
          )}
          {stats?.worst && stats.worst.sym !== stats?.best?.sym && (
            <span className="flex items-center gap-1">
              <span className="text-base">🔴</span>
              <span className="text-slate-400">{stats.worst.sym}</span>
              <span style={{ color: '#FF3B5C' }} className="font-bold">
                {stats.worst.pct >= 0 ? '+' : ''}{stats.worst.pct.toFixed(2)}%
              </span>
            </span>
          )}
          {stats && (
            <span className="flex items-center gap-1">
              <span style={{ color: sentimentColor }} className="font-bold">{stats.sentiment}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Live badge */}
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span
                className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"
                style={{ animation: 'ping 1s cubic-bezier(0,0,0.2,1) infinite' }}
              />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            <span
              className="text-[9px] font-bold tracking-widest uppercase"
              style={{ color: liveFlash ? '#00D084' : '#475569' }}
            >
              {liveFlash ? 'UPDATED' : `${secondsAgo}s ago`}
            </span>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-0.5 bg-[#0A0B0E] rounded-lg p-0.5 border border-[#1E293B]">
            <button
              onClick={() => setZoomLevel(z => Math.max(0.1, z - 0.25))}
              className="px-1.5 py-0.5 text-[10px] font-bold text-slate-500 hover:text-slate-200 transition-colors"
              title="Zoom in"
            >−</button>
            <button
              onClick={() => setZoomLevel(1)}
              className="px-1.5 py-0.5 text-[9px] font-bold text-slate-600 hover:text-slate-300 border-x border-[#1E293B] transition-colors"
              title="Reset zoom"
            >⊙</button>
            <button
              onClick={() => setZoomLevel(z => Math.min(1, z + 0.25))}
              className="px-1.5 py-0.5 text-[10px] font-bold text-slate-500 hover:text-slate-200 transition-colors"
              title="Zoom out"
            >+</button>
          </div>

          {/* Volume toggle */}
          <button
            onClick={() => setShowVolume(v => !v)}
            className={`px-2 py-0.5 rounded-md text-[9px] font-bold border transition-all ${
              showVolume
                ? 'bg-indigo-600/20 text-indigo-400 border-indigo-500/30'
                : 'text-slate-600 border-[#1E293B] hover:text-slate-300'
            }`}
          >
            Vol
          </button>

          {/* Timeframes */}
          <div className="flex gap-0.5 bg-[#0A0B0E] rounded-lg p-0.5 border border-[#1E293B]">
            {TIMEFRAMES.map(tf => (
              <button
                key={tf}
                onClick={() => handleTimeframe(tf)}
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${
                  timeframe === tf
                    ? 'bg-[#00D084]/20 text-[#00D084] border border-[#00D084]/30'
                    : 'text-slate-600 hover:text-slate-300'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Chart ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 pr-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={displayData} margin={{ top: 8, right: 64, left: -24, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E2130" opacity={0.6} />

            <XAxis
              dataKey="time"
              tickFormatter={(t) => formatTs(t, timeframe)}
              stroke="#1E2130"
              tick={{ fontSize: 9, fill: '#475569', fontFamily: 'JetBrains Mono, monospace' }}
              axisLine={false}
              tickLine={false}
              minTickGap={50}
            />

            <YAxis
              yAxisId="pct"
              orientation="right"
              domain={[yMin, yMax]}
              tickFormatter={(v) => `${v >= 0 ? '+' : ''}${Number(v).toFixed(1)}%`}
              stroke="#1E2130"
              tick={{ fontSize: 9, fill: '#475569', fontFamily: 'JetBrains Mono, monospace' }}
              axisLine={false}
              tickLine={false}
              width={56}
            />

            <Tooltip
              content={
                <CustomTooltip
                  symbols={symbols}
                  colors={lineColors}
                  assets={assets}
                  priceHistoryRef={priceHistoryRef}
                />
              }
              cursor={{ stroke: '#475569', strokeWidth: 1, strokeDasharray: '3 3' }}
            />

            <ReferenceLine yAxisId="pct" y={0} stroke="#334155" strokeDasharray="6 3" strokeWidth={1} />

            {symbols.map((sym, index) => {
              if (!visibleAssets.has(sym)) return null;
              const color = lineColors[index % lineColors.length];
              return (
                <Line
                  key={sym}
                  yAxisId="pct"
                  type="monotone"
                  dataKey={sym}
                  stroke={color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: color, stroke: '#111318', strokeWidth: 2 }}
                  isAnimationActive={false}
                  connectNulls
                  label={({ index: idx, x, y, value }) => {
                    if (idx !== displayData.length - 1) return null;
                    if (value === undefined || value === null) return null;
                    return (
                      <text
                        x={x + 4} y={y + 4}
                        fontSize={9}
                        fontFamily="JetBrains Mono, monospace"
                        fontWeight="bold"
                        fill={color}
                      >
                        {sym} {Number(value) >= 0 ? '+' : ''}{Number(value).toFixed(2)}%
                      </text>
                    );
                  }}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* ── Asset Toggle Pills ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-4 pb-2 flex-wrap shrink-0">
        {symbols.map((sym, i) => {
          const color = lineColors[i % lineColors.length];
          const active = visibleAssets.has(sym);
          // Get last % value
          const last = displayData[displayData.length - 1];
          const val = last ? (last[sym] as number | undefined) : undefined;
          return (
            <button
              key={sym}
              onClick={() => toggleAsset(sym)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold transition-all"
              style={{
                borderColor: active ? color : '#1E293B',
                backgroundColor: active ? `${color}18` : 'transparent',
                opacity: active ? 1 : 0.4,
              }}
            >
              <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
              <span style={{ color: active ? color : '#64748b' }}>
                {sym}
              </span>
              {val !== undefined && (
                <span style={{ color: val >= 0 ? '#00D084' : '#FF3B5C' }}>
                  {val >= 0 ? '+' : ''}{val.toFixed(2)}%
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default PerformanceChart;
