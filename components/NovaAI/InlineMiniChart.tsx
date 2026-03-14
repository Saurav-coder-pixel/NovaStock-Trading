import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';
import { TrendingUp, TrendingDown, Loader, BarChart2, X, Maximize2 } from 'lucide-react';
import { Candle } from '../../types';
import { fetchStockHistory } from '../../services/stockService';
import { fetchCryptoHistory } from '../../services/cryptoService';
import { WATCHLIST } from '../../services/stockService';
import { TOP_CRYPTO_SYMBOLS } from '../../services/cryptoService';

export type ChartAsset = {
  symbol: string;
  name: string;
  type: 'stock' | 'crypto';
  cryptoId?: string; // needed for CoinGecko API
};

interface InlineMiniChartProps {
  asset: ChartAsset;
  currentPrice?: number;
  change24h?: number;
}

const TIMEFRAMES = ['1D', '1W', '1M'] as const;
type TF = typeof TIMEFRAMES[number];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload?.length) {
    const val: number = payload[0]?.value;
    return (
      <div className="bg-[#1a2035]/95 border border-slate-700/60 px-2.5 py-1.5 rounded-lg shadow-xl backdrop-blur text-xs">
        <span className="text-indigo-300 font-mono font-semibold">${val?.toFixed(2)}</span>
      </div>
    );
  }
  return null;
};

const InlineMiniChart: React.FC<InlineMiniChartProps> = ({ asset, currentPrice, change24h }) => {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [tf, setTf] = useState<TF>('1W');
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);

    const load = async () => {
      try {
        let data: Candle[] = [];
        if (asset.type === 'stock') {
          data = await fetchStockHistory(asset.symbol, tf);
        } else {
          const id = asset.cryptoId || asset.symbol.toLowerCase();
          data = await fetchCryptoHistory(id, tf);
        }
        if (!cancelled) {
          setCandles(data.filter(c => !c.isPrediction));
          setLoading(false);
        }
      } catch {
        if (!cancelled) { setError(true); setLoading(false); }
      }
    };

    load();
    return () => { cancelled = true; };
  }, [asset.symbol, asset.type, asset.cryptoId, tf]);

  if (error) return null;

  const first = candles[0]?.close ?? 0;
  const last = candles[candles.length - 1]?.close ?? currentPrice ?? 0;
  const priceDiff = last - first;
  const pctChange = first > 0 ? (priceDiff / first) * 100 : (change24h ?? 0);
  const isUp = pctChange >= 0;
  const strokeColor = isUp ? '#10b981' : '#ef4444';
  const fillGrad = isUp ? 'url(#miniUp)' : 'url(#miniDown)';

  const chartHeight = expanded ? 240 : 120;

  return (
    <div className={`mt-3 rounded-xl border border-slate-700/40 bg-[#0d1117]/80 overflow-hidden transition-all duration-300 ${expanded ? 'w-full' : 'w-full max-w-xs'}`}>
      {/* Chart header */}
      <div className="flex items-center justify-between px-3 pt-2.5 pb-1">
        <div className="flex items-center gap-2">
          <BarChart2 size={12} className="text-indigo-400 flex-shrink-0" />
          <span className="text-[11px] font-bold text-slate-300 font-mono">{asset.symbol}</span>
          <span className="text-[10px] text-slate-500 truncate max-w-[100px]">{asset.name}</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Price */}
          <span className="text-[11px] font-bold font-mono text-white">
            ${last > 1000 ? (last / 1000).toFixed(2) + 'k' : last.toFixed(2)}
          </span>
          <span className={`text-[10px] font-semibold flex items-center gap-0.5 ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {isUp ? '+' : ''}{pctChange.toFixed(2)}%
          </span>
          {/* Expand toggle */}
          <button
            onClick={() => setExpanded(v => !v)}
            className="p-0.5 text-slate-600 hover:text-slate-300 transition-colors"
            title={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? <X size={12} /> : <Maximize2 size={12} />}
          </button>
        </div>
      </div>

      {/* Timeframe tabs */}
      <div className="flex gap-1 px-3 mb-1">
        {TIMEFRAMES.map(t => (
          <button
            key={t}
            onClick={() => setTf(t)}
            className={`text-[9px] font-bold px-2 py-0.5 rounded transition-colors ${
              tf === t
                ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/30'
                : 'text-slate-600 hover:text-slate-400'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Chart body */}
      <div style={{ height: chartHeight }} className="relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader size={16} className="text-indigo-400 animate-spin" />
          </div>
        ) : candles.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-[10px] text-slate-600">No data</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={candles} margin={{ top: 6, right: 4, left: 0, bottom: 2 }}>
              <defs>
                <linearGradient id="miniUp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="miniDown" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              {expanded && (
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} opacity={0.5} />
              )}
              <XAxis dataKey="time" hide={!expanded} tick={{ fontSize: 9, fill: '#475569' }} tickLine={false} axisLine={false} minTickGap={50}
                tickFormatter={(v) => new Date(v).toLocaleDateString([], { month: 'short', day: 'numeric' })}
              />
              <YAxis domain={['auto', 'auto']} hide={!expanded} orientation="right"
                tick={{ fontSize: 9, fill: '#475569', fontFamily: 'monospace' }}
                tickLine={false} axisLine={false} tickFormatter={(v) => `$${v >= 1000 ? (v/1000).toFixed(1)+'k' : v.toFixed(0)}`}
                width={42}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#4f46e5', strokeWidth: 1, strokeDasharray: '3 3' }} />
              <Area
                type="monotone"
                dataKey="close"
                stroke={strokeColor}
                strokeWidth={1.5}
                fill={fillGrad}
                isAnimationActive={true}
                animationDuration={800}
                dot={false}
                activeDot={{ r: 3, fill: strokeColor, stroke: '#0d1117', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Expanded stats row */}
      {expanded && candles.length > 0 && (() => {
        const highs = candles.map(c => c.high);
        const lows = candles.map(c => c.low);
        const maxH = Math.max(...highs);
        const minL = Math.min(...lows);
        const avgVol = candles.reduce((a, c) => a + c.volume, 0) / candles.length;
        return (
          <div className="grid grid-cols-3 gap-px bg-slate-800/30 border-t border-slate-700/30 text-center text-[10px]">
            {[
              { label: 'High', val: `$${maxH.toFixed(2)}`, color: 'text-emerald-400' },
              { label: 'Low', val: `$${minL.toFixed(2)}`, color: 'text-rose-400' },
              { label: 'Avg Vol', val: `${(avgVol/1000).toFixed(0)}K`, color: 'text-indigo-300' },
            ].map(({ label, val, color }) => (
              <div key={label} className="py-2 bg-[#0d1117]/60">
                <div className="text-slate-600 text-[9px] uppercase tracking-wider mb-0.5">{label}</div>
                <div className={`font-mono font-semibold ${color}`}>{val}</div>
              </div>
            ))}
          </div>
        );
      })()}
    </div>
  );
};

// ── Asset Detection Utilities ─────────────────────────────────────────────────

// Build a lookup set for fast detection
const STOCK_LOOKUP: Map<string, { symbol: string; name: string }> = new Map(
  WATCHLIST.map(s => [s.symbol.toUpperCase(), { symbol: s.symbol, name: s.name }])
);

const CRYPTO_LOOKUP: Map<string, { symbol: string; name: string; id: string }> = new Map(
  TOP_CRYPTO_SYMBOLS.map(c => [
    c.symbol.replace('USDT', '').toUpperCase(),
    { symbol: c.symbol.replace('USDT', ''), name: c.name, id: c.id }
  ])
);

// Common aliases
const CRYPTO_ALIASES: Record<string, string> = {
  BITCOIN: 'BTC', BTC: 'BTC',
  ETHEREUM: 'ETH', ETH: 'ETH',
  SOLANA: 'SOL', SOL: 'SOL',
  BINANCE: 'BNB', BNB: 'BNB',
  RIPPLE: 'XRP', XRP: 'XRP',
  DOGECOIN: 'DOGE', DOGE: 'DOGE',
  CARDANO: 'ADA', ADA: 'ADA',
  AVALANCHE: 'AVAX', AVAX: 'AVAX',
  POLYGON: 'MATIC', MATIC: 'MATIC',
  POLKADOT: 'DOT', DOT: 'DOT',
  ARBITRUM: 'ARB', ARB: 'ARB',
  CHAINLINK: 'LINK', LINK: 'LINK',
};

const STOCK_ALIASES: Record<string, string> = {
  APPLE: 'AAPL', NVIDIA: 'NVDA', TESLA: 'TSLA',
  AMAZON: 'AMZN', MICROSOFT: 'MSFT', GOOGLE: 'GOOGL',
  ALPHABET: 'GOOGL',
};

export const detectAssets = (text: string): ChartAsset[] => {
  const found: ChartAsset[] = [];
  const seen = new Set<string>();
  const words = text.toUpperCase().replace(/[^A-Z0-9\s]/g, ' ').split(/\s+/);

  for (const word of words) {
    if (seen.has(word)) continue;

    // Check crypto aliases first
    const cryptoSymbol = CRYPTO_ALIASES[word];
    if (cryptoSymbol && !seen.has(cryptoSymbol)) {
      const info = CRYPTO_LOOKUP.get(cryptoSymbol);
      if (info) {
        found.push({ symbol: info.symbol, name: info.name, type: 'crypto', cryptoId: info.id });
        seen.add(cryptoSymbol);
        seen.add(word);
        continue;
      }
    }

    // Direct crypto lookup
    const cryptoDirect = CRYPTO_LOOKUP.get(word);
    if (cryptoDirect) {
      found.push({ symbol: cryptoDirect.symbol, name: cryptoDirect.name, type: 'crypto', cryptoId: cryptoDirect.id });
      seen.add(word);
      continue;
    }

    // Check stock aliases
    const stockSymbol = STOCK_ALIASES[word];
    if (stockSymbol && !seen.has(stockSymbol)) {
      const info = STOCK_LOOKUP.get(stockSymbol);
      if (info) {
        found.push({ symbol: info.symbol, name: info.name, type: 'stock' });
        seen.add(stockSymbol);
        seen.add(word);
        continue;
      }
    }

    // Direct stock lookup
    const stockDirect = STOCK_LOOKUP.get(word);
    if (stockDirect) {
      found.push({ symbol: stockDirect.symbol, name: stockDirect.name, type: 'stock' });
      seen.add(word);
      continue;
    }
  }

  // Cap at 3 charts per message to avoid clutter
  return found.slice(0, 3);
};

export default InlineMiniChart;
