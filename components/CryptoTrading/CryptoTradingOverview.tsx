/**
 * CryptoTradingOverview — Main page for the Crypto Trading view.
 * Mirrors MarketOverview (Stock Exchange) layout exactly.
 * Uses CoinGecko for live prices and OHLCV data.
 * All existing Terminal components are reused as-is.
 */

import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { Bitcoin } from 'lucide-react';
import { Candle } from '../../types';
import { getAnthropicAnalysis, AIAnalysisResult } from '../../services/anthropicService';

import TerminalLayout from '../Layout/TerminalLayout';
import TickerTape, { TickerItem } from '../Terminal/TickerTape';
import AssetList, { AssetItem } from '../Terminal/AssetList';
import LightweightChart from '../Terminal/LightweightChart';
import OrderBook, { OrderLevel } from '../Terminal/OrderBook';
import OrderPanel from '../Terminal/OrderPanel';
import AIPanel from '../Terminal/AIPanel';
import CryptoTradingLinearChart from './CryptoTradingLinearChart';

// ─── Crypto Coin Definitions ───────────────────────────────────────────────

interface CoinDef {
  id: string;         // CoinGecko ID
  symbol: string;     // e.g. BTC
  name: string;       // e.g. Bitcoin
  emoji: string;      // Fallback icon char (if no image)
}

const COINS: CoinDef[] = [
  { id: 'bitcoin',       symbol: 'BTC',  name: 'Bitcoin',   emoji: '₿' },
  { id: 'ethereum',      symbol: 'ETH',  name: 'Ethereum',  emoji: 'Ξ' },
  { id: 'solana',        symbol: 'SOL',  name: 'Solana',    emoji: '◎' },
  { id: 'binancecoin',   symbol: 'BNB',  name: 'BNB',       emoji: '🔶' },
  { id: 'ripple',        symbol: 'XRP',  name: 'XRP',       emoji: '✕' },
  { id: 'dogecoin',      symbol: 'DOGE', name: 'Dogecoin',  emoji: 'Ð' },
  { id: 'cardano',       symbol: 'ADA',  name: 'Cardano',   emoji: '₳' },
  { id: 'avalanche-2',   symbol: 'AVAX', name: 'Avalanche', emoji: '🔺' },
  { id: 'pol-ecosystem-token', symbol: 'POL', name: 'Polygon',   emoji: '⬟' },
  { id: 'arbitrum',      symbol: 'ARB',  name: 'Arbitrum',  emoji: '🔵' },
];

const COIN_IDS = COINS.map(c => c.id).join(',');

const TIMEFRAME_DAYS: Record<string, number> = {
  '1D': 1,
  '1W': 7,
  '1M': 30,
  '3M': 90,
};

// ─── Price State ────────────────────────────────────────────────────────────

interface PriceData {
  usd: number;
  usd_24h_change: number;
  usd_24h_vol: number;
}

type PriceMap = Record<string, PriceData>;

// ─── Fetch Helpers ───────────────────────────────────────────────────────────

const PROXY = 'https://corsproxy.io/?';

async function safeFetch(url: string): Promise<Response> {
  // Try direct first (avoids proxy overhead when not needed)
  try {
    const r = await fetch(url);
    if (r.ok) return r;
  } catch { /* fall through to proxy */ }
  // Fallback to CORS proxy
  const r2 = await fetch(PROXY + encodeURIComponent(url));
  if (!r2.ok) throw new Error(`HTTP ${r2.status}`);
  return r2;
}

async function fetchPrices(): Promise<PriceMap> {
  const url =
    `https://api.coingecko.com/api/v3/simple/price` +
    `?ids=${COIN_IDS}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true`;
  const res = await safeFetch(url);
  const raw = await res.json();
  // Normalize: CoinGecko returns usd_24h_vol — ensure that key exists for all coins
  const map: PriceMap = {};
  for (const [id, data] of Object.entries(raw as Record<string, any>)) {
    map[id] = {
      usd: data.usd ?? 0,
      usd_24h_change: data.usd_24h_change ?? 0,
      usd_24h_vol: data.usd_24h_vol ?? 0,
    };
  }
  return map;
}

/** Generate simulated OHLCV candles around a base price for a given number of bars */
function generateMockOHLC(basePrice: number, bars: number): Candle[] {
  const now = Date.now();
  const intervalMs = (bars <= 24 ? 3_600_000 : bars <= 168 ? 3_600_000 * 4 : 86_400_000);
  const candles: Candle[] = [];
  let price = basePrice * 0.97;
  for (let i = bars; i >= 0; i--) {
    const time = new Date(now - i * intervalMs).toISOString();
    const open = price;
    const change = (Math.random() - 0.48) * price * 0.015;
    price = Math.max(price + change, price * 0.5);
    const high = Math.max(open, price) * (1 + Math.random() * 0.005);
    const low = Math.min(open, price) * (1 - Math.random() * 0.005);
    candles.push({ time, open, high, low, close: price, volume: Math.random() * 1_000_000 });
  }
  return candles;
}

async function fetchOHLC(coinId: string, days: number, fallbackPrice: number): Promise<Candle[]> {
  const url = `https://api.coingecko.com/api/v3/coins/${coinId}/ohlc?vs_currency=usd&days=${days}`;
  try {
    const res = await safeFetch(url);
    const raw: [number, number, number, number, number][] = await res.json();
    if (raw.length > 0) {
      return raw.map(([ts, o, h, l, c]) => ({
        time: new Date(ts).toISOString(),
        open: o, high: h, low: l, close: c,
        volume: 0,
      }));
    }
  } catch (err) {
    console.warn('[CryptoTrading] OHLC fetch failed, using mock data:', err);
  }
  // Fallback: generate mock candles from live price
  const bars = days === 1 ? 24 : days === 7 ? 42 : days === 30 ? 30 : 90;
  return generateMockOHLC(fallbackPrice || 100, bars);
}

// ─── Component ───────────────────────────────────────────────────────────────

interface CryptoTradingOverviewProps {
  isDarkMode?: boolean;
}

const CryptoTradingOverview: React.FC<CryptoTradingOverviewProps> = ({ isDarkMode = true }) => {
  const [selectedCoinId, setSelectedCoinId] = useState<string>('bitcoin');
  const [prices, setPrices] = useState<PriceMap>({});
  const [ohlcHistory, setOhlcHistory] = useState<Candle[]>([]);
  const [timeframe, setTimeframe] = useState<string>('1D');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPriceLoading, setIsPriceLoading] = useState(true);

  // AI
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const priceIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Keep a stable ref to the latest selected price so the OHLC useEffect can
  // use it as a fallback without adding it as a reactive dependency.
  const latestPriceRef = useRef<number>(0);

  // ── Price polling every 15 s ──────────────────────────────────────────────
  const loadPrices = useCallback(async () => {
    try {
      const data = await fetchPrices();
      setPrices(data);
    } catch (err) {
      console.warn('[CryptoTrading] price fetch failed:', err);
    } finally {
      setIsPriceLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPrices();
    priceIntervalRef.current = setInterval(loadPrices, 15_000);
    return () => {
      if (priceIntervalRef.current) clearInterval(priceIntervalRef.current);
    };
  }, [loadPrices]);

  // ── OHLC data on coin or timeframe change ─────────────────────────────────
  useEffect(() => {
    setOhlcHistory([]);
    const days = TIMEFRAME_DAYS[timeframe] ?? 1;
    const fallbackPrice = latestPriceRef.current;
    fetchOHLC(selectedCoinId, days, fallbackPrice)
      .then(candles => setOhlcHistory(candles))
      .catch(err => {
        console.warn('[CryptoTrading] OHLC fetch failed:', err);
        const bars = days === 1 ? 24 : days === 7 ? 42 : days === 30 ? 30 : 90;
        setOhlcHistory(generateMockOHLC(fallbackPrice || 100, bars));
      });
  }, [selectedCoinId, timeframe]);

  // ── Derived data ─────────────────────────────────────────────────────────

  const selectedCoin = COINS.find(c => c.id === selectedCoinId) ?? COINS[0];
  const selectedPrice = prices[selectedCoinId]?.usd ?? 0;
  const selectedChange = prices[selectedCoinId]?.usd_24h_change ?? 0;
  // Keep the ref in sync with the latest price for use in effects
  latestPriceRef.current = selectedPrice;

  // TickerTape items
  const tickerItems: TickerItem[] = COINS.map(c => ({
    symbol: c.symbol,
    price: prices[c.id]?.usd ?? 0,
    change: prices[c.id]?.usd_24h_change ?? 0,
  }));

  // AssetList items — one per coin
  const assetItems: AssetItem[] = COINS.map(c => {
    const p = prices[c.id];
    const price = p?.usd ?? 0;
    const sparkline = Array.from({ length: 20 }, (_, i) =>
      price * (1 + Math.sin(i * 0.7 + c.symbol.charCodeAt(0)) * 0.015)
    );
    const vol = p?.usd_24h_vol ?? 0;
    const volFormatted = vol >= 1e9
      ? `$${(vol / 1e9).toFixed(2)}B`
      : vol >= 1e6
      ? `$${(vol / 1e6).toFixed(1)}M`
      : `$${vol.toFixed(0)}`;
    return {
      id: c.id,
      symbol: `${c.name} (${c.symbol})`,
      name: c.symbol,
      price,
      changePercent: p?.usd_24h_change ?? 0,
      volume: volFormatted,
      sparkline,
    };
  });

  // Order book simulation around live price
  const mockOrderBook = useMemo(() => {
    const price = selectedPrice || 100;
    const spread = price * 0.0005;
    const asks: OrderLevel[] = Array.from({ length: 15 }).map((_, i) => [
      (price + spread + i * price * 0.001).toFixed(price < 1 ? 6 : 2),
      ((Math.random() * 5) + 0.1).toFixed(4),
    ]);
    const bids: OrderLevel[] = Array.from({ length: 15 }).map((_, i) => [
      (price - spread - i * price * 0.001).toFixed(price < 1 ? 6 : 2),
      ((Math.random() * 5) + 0.1).toFixed(4),
    ]);
    return { asks, bids };
  }, [selectedPrice]);

  // ── AI Generation ─────────────────────────────────────────────────────────
  const handleGenerateAI = async () => {
    if (ohlcHistory.length === 0) return;
    setIsAiLoading(true);
    const closes = ohlcHistory.map(h => h.close);
    const volumes = ohlcHistory.map(h => h.volume);
    const ma7 = closes.slice(-7).reduce((a, b) => a + b, 0) / Math.min(7, closes.length) || selectedPrice;
    const ma30 = closes.reduce((a, b) => a + b, 0) / closes.length || selectedPrice;
    const momentum = closes[closes.length - 1] > closes[closes.length - 2] ? 5.5 : -2.2;
    const result = await getAnthropicAnalysis(
      selectedCoin.name,
      selectedCoin.symbol,
      selectedPrice,
      selectedChange,
      ma7,
      ma30,
      momentum,
      closes,
      volumes
    );
    setAiAnalysis(result);
    setIsAiLoading(false);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="h-[calc(100vh-2rem)] -m-4 md:-m-6 lg:-m-10">
      <TerminalLayout
        tickerText={<TickerTape items={tickerItems} />}
        headerControls={
          <div className="flex items-center gap-3 w-full pl-4">
            <Bitcoin className="text-amber-400 w-5 h-5" />
            <span className="font-bold text-slate-100 uppercase tracking-widest text-sm">Nova CT</span>
            <span className="text-slate-500 mx-2">|</span>
            <span className="font-mono text-slate-400" style={{ fontSize: '16px' }}>Crypto Trading Desk</span>
          </div>
        }
        leftPanel={
          <AssetList
            assets={assetItems}
            selectedId={selectedCoinId}
            onSelect={(id) => {
              setSelectedCoinId(id);
              setAiAnalysis(null);
            }}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        }
        mainChart={
          <>
            {/* Linear Chart — 24h price history */}
            <div className="h-[200px] w-full overflow-hidden shrink-0">
              <CryptoTradingLinearChart
                coinId={selectedCoinId}
                symbol={selectedCoin.symbol}
                name={selectedCoin.name}
                livePrice={selectedPrice}
              />
            </div>

            {/* Candlestick Chart with timeframe buttons */}
            <div className="flex-1 min-h-0 bg-[#0A0B0E] flex flex-col border-t border-[#1E293B]">
              <div className="flex bg-[#0A0B0E] p-2 gap-2 border-b border-[#1E293B] items-center">
                <span className="text-slate-400 text-xs font-bold px-2">
                  {selectedCoin.name} ({selectedCoin.symbol})
                </span>
                <div className="flex gap-1">
                  {Object.keys(TIMEFRAME_DAYS).map(tf => (
                    <button
                      key={tf}
                      onClick={() => setTimeframe(tf)}
                      className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${
                        timeframe === tf
                          ? 'bg-success/20 text-success border border-success/50'
                          : 'text-slate-500 hover:text-slate-300 border border-transparent'
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex-1 min-h-0 relative">
                {ohlcHistory.length > 0 && (
                  <LightweightChart
                    data={ohlcHistory}
                    symbol={`${selectedCoin.name} (${selectedCoin.symbol})`}
                  />
                )}
                {ohlcHistory.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center text-slate-600 text-xs font-mono">
                    Loading candlestick data…
                  </div>
                )}
              </div>
            </div>
          </>
        }
        bottomPanel={
          <AIPanel
            analysis={aiAnalysis}
            isLoading={isAiLoading}
            onRefresh={handleGenerateAI}
          />
        }
        rightPanel={
          <div className="flex flex-col h-full">
            <div className="flex-[0.6] overflow-hidden">
              <OrderBook
                bids={mockOrderBook.bids}
                asks={mockOrderBook.asks}
                currentPrice={selectedPrice}
              />
            </div>
            <div className="flex-[0.4] shrink-0">
              <OrderPanel
                symbol={selectedCoin.symbol}
                currentPrice={selectedPrice}
              />
            </div>
          </div>
        }
      />
    </div>
  );
};

export default CryptoTradingOverview;
