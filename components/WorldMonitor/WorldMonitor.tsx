import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Globe, TrendingUp, TrendingDown, Clock, AlertCircle, BarChart2, X, Layers } from 'lucide-react';
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';
import Globe3D, { GlobeMarker } from './Globe3D';
import { LANDMASSES, landmassSVGPath } from './landmasses';

// ─── Types ────────────────────────────────────────────────
interface TickerItem { name: string; symbol: string; value: number; change: number; changePercent: number; isReal?: boolean; }
interface MarketHub { id: string; exchange: string; city: string; index: string; indexValue: number; lat: number; lon: number; x: number; y: number; utcOpenH: number; utcOpenM: number; utcCloseH: number; utcCloseM: number; }
interface Mover { symbol: string; name: string; region: string; price: number; change: number; changePercent: number; volume: string; spark: number[]; }
interface EconEvent { id: number; flag: string; country: string; event: string; offsetHours: number; impact: 'High' | 'Medium' | 'Low'; actual: string; forecast: string; detail: string; }
interface Props { isDarkMode: boolean; }

// ─── Constants ────────────────────────────────────────────
const HUBS: MarketHub[] = [
  { id:'nyse',  exchange:'NYSE/NASDAQ', city:'New York',  index:'S&P 500',    indexValue:5234, lat:40.7,  lon:-74.0, x:22,y:38, utcOpenH:14,utcOpenM:30,utcCloseH:21,utcCloseM:0 },
  { id:'lse',   exchange:'LSE',         city:'London',    index:'FTSE 100',   indexValue:8347, lat:51.5,  lon:-0.1,  x:47,y:28, utcOpenH:8, utcOpenM:0, utcCloseH:16,utcCloseM:30},
  { id:'xetra', exchange:'XETRA',       city:'Frankfurt', index:'DAX',        indexValue:18450,lat:50.1,  lon:8.7,   x:50,y:26, utcOpenH:7, utcOpenM:0, utcCloseH:15,utcCloseM:30},
  { id:'tse',   exchange:'TSE',         city:'Tokyo',     index:'Nikkei 225', indexValue:38920,lat:35.7,  lon:139.7, x:79,y:33, utcOpenH:0, utcOpenM:0, utcCloseH:6, utcCloseM:0 },
  { id:'hkex',  exchange:'HKEX',        city:'Hong Kong', index:'Hang Seng',  indexValue:17820,lat:22.3,  lon:114.2, x:77,y:38, utcOpenH:1, utcOpenM:30,utcCloseH:8, utcCloseM:0 },
  { id:'sse',   exchange:'SSE',         city:'Shanghai',  index:'SSE Comp.',  indexValue:3421, lat:31.2,  lon:121.5, x:76,y:35, utcOpenH:1, utcOpenM:30,utcCloseH:7, utcCloseM:0 },
  { id:'nse',   exchange:'NSE India',   city:'Mumbai',    index:'NIFTY 50',   indexValue:22450,lat:19.1,  lon:72.9,  x:66,y:40, utcOpenH:3, utcOpenM:45,utcCloseH:10,utcCloseM:0 },
  { id:'asx',   exchange:'ASX',         city:'Sydney',    index:'ASX 200',    indexValue:7812, lat:-33.9, lon:151.2, x:84,y:60, utcOpenH:0, utcOpenM:0, utcCloseH:6, utcCloseM:0 },
  { id:'dfm',   exchange:'DFM',         city:'Dubai',     index:'DFM Index',  indexValue:4523, lat:25.2,  lon:55.3,  x:60,y:38, utcOpenH:5, utcOpenM:30,utcCloseH:11,utcCloseM:30},
  { id:'tsx',   exchange:'TSX',         city:'Toronto',   index:'S&P/TSX',    indexValue:22400,lat:43.7,  lon:-79.4, x:20,y:32, utcOpenH:14,utcOpenM:30,utcCloseH:21,utcCloseM:0 },
];

const INIT_TICKERS: TickerItem[] = [
  { name:'S&P 500',    symbol:'SPX',    value:5234.18, change:18.42,  changePercent:0.35 },
  { name:'NASDAQ',     symbol:'IXIC',   value:16412.51,change:92.14,  changePercent:0.56 },
  { name:'DOW JONES',  symbol:'DJI',    value:39127.80,change:-45.66, changePercent:-0.12},
  { name:'FTSE 100',   symbol:'UKX',    value:8347.22, change:12.88,  changePercent:0.15 },
  { name:'DAX',        symbol:'DAX',    value:18450.14,change:125.30, changePercent:0.68 },
  { name:'CAC 40',     symbol:'PX1',    value:8145.61, change:-23.10, changePercent:-0.28},
  { name:'Nikkei 225', symbol:'NKY',    value:38920.44,change:340.8,  changePercent:0.88 },
  { name:'BTC',        symbol:'BTC',    value:68420.00,change:1240,   changePercent:1.82, isReal:true },
  { name:'ETH',        symbol:'ETH',    value:3812.50, change:-45.20, changePercent:-1.17,isReal:true },
  { name:'BNB',        symbol:'BNB',    value:592.30,  change:8.10,   changePercent:1.38, isReal:true },
];

const INIT_GAINERS: Mover[] = [
  { symbol:'NVDA',name:'NVIDIA',        region:'US',    price:875.42, change:42.18, changePercent:5.06, volume:'48.2M',spark:[820,835,840,852,858,862,870,875]},
  { symbol:'TSM', name:'TSMC',          region:'Asia',  price:152.31, change:6.80,  changePercent:4.67, volume:'12.1M',spark:[140,143,145,146,148,150,151,152]},
  { symbol:'ARM', name:'ARM Holdings',  region:'UK',    price:122.55, change:5.21,  changePercent:4.44, volume:'8.4M', spark:[112,114,116,118,119,120,121,122]},
  { symbol:'SMCI',name:'Super Micro',   region:'US',    price:834.10, change:32.40, changePercent:4.04, volume:'6.2M', spark:[790,800,808,815,820,825,830,834]},
  { symbol:'AVGO',name:'Broadcom',      region:'US',    price:1412.88,change:52.10, changePercent:3.83, volume:'3.1M', spark:[1340,1355,1365,1375,1385,1395,1405,1412]},
  { symbol:'SOL', name:'Solana',        region:'Crypto',price:182.45, change:6.60,  changePercent:3.75, volume:'$1.2B',spark:[168,170,172,175,177,179,181,182]},
  { symbol:'AMD', name:'AMD',           region:'US',    price:178.92, change:6.10,  changePercent:3.53, volume:'22.8M',spark:[165,168,170,173,175,176,178,178]},
  { symbol:'META',name:'Meta Platforms',region:'US',    price:512.40, change:14.80, changePercent:2.98, volume:'11.3M',spark:[492,495,500,505,508,510,511,512]},
];

const INIT_LOSERS: Mover[] = [
  { symbol:'INTC',name:'Intel',    region:'US',  price:42.18,  change:-3.22, changePercent:-7.09,volume:'52.4M',spark:[48,47,46,45,44,43,42,42]},
  { symbol:'BA',  name:'Boeing',   region:'US',  price:182.55, change:-10.44,changePercent:-5.41,volume:'14.8M',spark:[196,194,191,188,186,185,184,182]},
  { symbol:'WBA', name:'Walgreens',region:'US',  price:18.72,  change:-0.98, changePercent:-4.98,volume:'10.2M',spark:[21,20,20,19,19,19,18,18]},
  { symbol:'LI',  name:'Li Auto',  region:'Asia',price:28.14,  change:-1.32, changePercent:-4.48,volume:'18.6M',spark:[32,31,30,30,29,29,28,28]},
  { symbol:'PARA',name:'Paramount',region:'US',  price:11.88,  change:-0.52, changePercent:-4.19,volume:'9.1M', spark:[14,13,13,12,12,12,11,11]},
  { symbol:'XOM', name:'ExxonMobil',region:'US', price:109.42, change:-4.10, changePercent:-3.61,volume:'17.3M',spark:[116,115,114,113,112,111,110,109]},
  { symbol:'NIO', name:'NIO Inc.', region:'Asia',price:5.82,   change:-0.20, changePercent:-3.32,volume:'31.4M',spark:[7,6,6,6,6,6,5,5]},
  { symbol:'PFE', name:'Pfizer',   region:'US',  price:27.15,  change:-0.88, changePercent:-3.14,volume:'28.7M',spark:[30,29,29,28,28,28,27,27]},
];

const ECON_EVENTS: EconEvent[] = [
  { id:1, flag:'🇺🇸',country:'US',    event:'CPI Data (YoY)',       offsetHours:-2, impact:'High',  actual:'3.2%', forecast:'3.1%', detail:'US Consumer Price Index rose 3.2% YoY, slightly above the 3.1% forecast.' },
  { id:2, flag:'🇪🇺',country:'EU',    event:'ECB Interest Rate',    offsetHours:1,  impact:'High',  actual:'—',    forecast:'4.25%',detail:'ECB rate decision. Markets expect a hold at 4.25%. Watch the press conference.' },
  { id:3, flag:'🇯🇵',country:'Japan', event:'BOJ Policy Rate',      offsetHours:-8, impact:'High',  actual:'0.1%', forecast:'0.1%', detail:'BOJ maintained its policy at 0.1%, citing fragile recovery.' },
  { id:4, flag:'🇬🇧',country:'UK',    event:'GDP (QoQ)',            offsetHours:-5, impact:'Medium',actual:'0.4%', forecast:'0.3%', detail:'UK economy grew 0.4% in Q4, beating forecasts. Services sector led.' },
  { id:5, flag:'🇨🇳',country:'China', event:'Manufacturing PMI',   offsetHours:3,  impact:'Medium',actual:'—',    forecast:'50.2', detail:'Official manufacturing PMI for China. Above 50 indicates expansion.' },
  { id:6, flag:'🇺🇸',country:'US',    event:'Non-Farm Payrolls',   offsetHours:24, impact:'High',  actual:'—',    forecast:'218K', detail:'Monthly US jobs report. Strong numbers could keep Fed hawkish.' },
  { id:7, flag:'🇩🇪',country:'Germany',event:'IFO Business Climate',offsetHours:-1,impact:'Medium',actual:'89.4', forecast:'89.0', detail:'German business sentiment exceeded expectations.' },
  { id:8, flag:'🇦🇺',country:'AU',    event:'RBA Meeting Minutes',  offsetHours:-12,impact:'Low',   actual:'N/A',  forecast:'N/A',  detail:'RBA releases minutes detailing rate deliberations.' },
  { id:9, flag:'🇧🇷',country:'Brazil',event:'SELIC Rate Decision',  offsetHours:6,  impact:'Medium',actual:'—',    forecast:'10.5%',detail:'Brazil\'s central bank expected to cut rates by 25bps.' },
  { id:10,flag:'🇨🇦',country:'Canada',event:'Trade Balance',        offsetHours:-3, impact:'Low',   actual:'-$1.2B',forecast:'-$0.8B',detail:'Canada posted a larger-than-expected trade deficit.' },
];

// ─── Helpers ──────────────────────────────────────────────
const rw = (v: number, pct = 0.002) => v * (1 + (Math.random() - 0.5) * pct);

function getStatus(h: MarketHub): 'open' | 'closed' | 'pre' | 'post' {
  const now = new Date();
  const day = now.getUTCDay();
  if (day === 0 || day === 6) return 'closed';
  const mins = now.getUTCHours() * 60 + now.getUTCMinutes();
  const open = h.utcOpenH * 60 + h.utcOpenM;
  const close = h.utcCloseH * 60 + h.utcCloseM;
  if (mins >= open && mins < close) return 'open';
  if (mins >= open - 60 && mins < open) return 'pre';
  if (mins >= close && mins < close + 60) return 'post';
  return 'closed';
}

const statusColor = (s: ReturnType<typeof getStatus>) =>
  s === 'open' ? '#10b981' : s === 'pre' || s === 'post' ? '#f59e0b' : '#ef4444';

const sentColor = (s: number) =>
  s <= 25 ? '#ef4444' : s <= 45 ? '#f97316' : s <= 55 ? '#f59e0b' : s <= 75 ? '#84cc16' : '#10b981';

const sentLabel = (s: number) =>
  s <= 25 ? 'Extreme Fear' : s <= 45 ? 'Fear' : s <= 55 ? 'Neutral' : s <= 75 ? 'Greed' : 'Extreme Greed';

const fmtRel = (h: number) => { const a = Math.abs(h); const v = a < 1 ? `${Math.round(a * 60)}m` : `${Math.round(a)}h`; return h >= 0 ? `in ${v}` : `${v} ago`; };

function Sparkline({ data, pos }: { data: number[]; pos: boolean }) {
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * 60},${24 - ((v - min) / range) * 24}`).join(' ');
  return <svg width={60} height={24} viewBox="0 0 60 24"><polyline points={pts} fill="none" stroke={pos ? '#10b981' : '#ef4444'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

// ─── Main Component ───────────────────────────────────────
const WorldMonitor: React.FC<Props> = ({ isDarkMode }) => {
  const [view, setView] = useState<'2D' | '3D'>('2D');
  const [tickers, setTickers] = useState<TickerItem[]>(INIT_TICKERS);
  const [hubVals, setHubVals] = useState<Record<string, number>>(Object.fromEntries(HUBS.map(h => [h.id, h.indexValue])));
  const [sentiment, setSentiment] = useState(62);
  const [gainers, setGainers] = useState<Mover[]>(INIT_GAINERS);
  const [losers, setLosers] = useState<Mover[]>(INIT_LOSERS);
  const [activeTab, setActiveTab] = useState<'gainers' | 'losers'>('gainers');
  const [tooltip, setTooltip] = useState<{ hub: MarketHub; x: number; y: number } | null>(null);
  const [globe3dTooltip, setGlobe3dTooltip] = useState<{ marker: GlobeMarker; x: number; y: number } | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EconEvent | null>(null);
  const [now, setNow] = useState(new Date());
  const [layers, setLayers] = useState({ marketHubs: true, econEvents: false });
  const tickerRef = useRef<HTMLDivElement>(null);
  const regionalScores = [
    { region:'Americas',     score:68 },
    { region:'Europe',       score:55 },
    { region:'Asia-Pacific', score:58 },
    { region:'Middle East',  score:44 },
    { region:'Crypto Market',score:74 },
  ];

  // Clock
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(id); }, []);

  // Ticker auto-scroll
  useEffect(() => {
    const el = tickerRef.current;
    if (!el) return;
    let pos = 0;
    const id = setInterval(() => { pos += 0.5; if (pos >= el.scrollWidth / 2) pos = 0; el.scrollLeft = pos; }, 30);
    return () => clearInterval(id);
  }, []);

  // Simulate ticker updates every 5s
  useEffect(() => {
    const id = setInterval(() => {
      setTickers(prev => prev.map(t => {
        if (t.isReal) return t; // real ones updated by API
        const nv = rw(t.value); const d = nv - t.value;
        return { ...t, value: nv, change: d, changePercent: (d / t.value) * 100 };
      }));
    }, 5000);
    return () => clearInterval(id);
  }, []);

  // Fetch real crypto prices from CoinGecko (free, no key)
  const fetchCrypto = useCallback(async () => {
    try {
      const res = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,binancecoin&vs_currencies=usd&include_24hr_change=true',
        { headers: { Accept: 'application/json' } }
      );
      if (!res.ok) return;
      const data = await res.json();
      setTickers(prev => prev.map(t => {
        if (t.symbol === 'BTC' && data.bitcoin) return { ...t, value: data.bitcoin.usd, changePercent: data.bitcoin.usd_24h_change, change: data.bitcoin.usd * data.bitcoin.usd_24h_change / 100 };
        if (t.symbol === 'ETH' && data.ethereum) return { ...t, value: data.ethereum.usd, changePercent: data.ethereum.usd_24h_change, change: data.ethereum.usd * data.ethereum.usd_24h_change / 100 };
        if (t.symbol === 'BNB' && data.binancecoin) return { ...t, value: data.binancecoin.usd, changePercent: data.binancecoin.usd_24h_change, change: data.binancecoin.usd * data.binancecoin.usd_24h_change / 100 };
        return t;
      }));
    } catch { /* silently fail, keep simulated */ }
  }, []);

  useEffect(() => { fetchCrypto(); const id = setInterval(fetchCrypto, 30000); return () => clearInterval(id); }, [fetchCrypto]);

  // Hub value random walk
  useEffect(() => {
    const id = setInterval(() => setHubVals(prev => { const n = { ...prev }; for (const k in n) n[k] = rw(n[k], 0.0015); return n; }), 8000);
    return () => clearInterval(id);
  }, []);

  // Sentiment drift
  useEffect(() => {
    const id = setInterval(() => setSentiment(p => Math.min(100, Math.max(0, p + (Math.random() - 0.5) * 3))), 15000);
    return () => clearInterval(id);
  }, []);

  // Movers update
  useEffect(() => {
    const upd = (ms: Mover[]) => ms.map(m => { const np = rw(m.price); const d = np - m.price; return { ...m, price: np, change: d, changePercent: (d / m.price) * 100, spark: [...m.spark.slice(1), np] }; });
    const id = setInterval(() => { setGainers(p => upd(p)); setLosers(p => upd(p)); }, 10000);
    return () => clearInterval(id);
  }, []);

  // Build 3D globe markers
  const globeMarkers: GlobeMarker[] = [
    ...(layers.marketHubs ? HUBS.map(h => { const s = getStatus(h); return { id: h.id, lat: h.lat, lon: h.lon, color: statusColor(s), label: h.city, pulse: s === 'open' }; }) : []),
    ...(layers.econEvents ? ECON_EVENTS.filter(e => Math.abs(e.offsetHours) < 12).map(e => ({ id: `ev-${e.id}`, lat: 40 + (e.id * 5) % 30, lon: -60 + (e.id * 25) % 200, color: e.impact === 'High' ? '#ef4444' : e.impact === 'Medium' ? '#f59e0b' : '#6b7280', label: e.event.slice(0, 12), pulse: false })) : []),
  ];

  const handle3DHover = useCallback((marker: GlobeMarker | null, x: number, y: number) => {
    if (!marker) { setGlobe3dTooltip(null); return; }
    const hub = HUBS.find(h => h.id === marker.id);
    if (hub) setGlobe3dTooltip({ marker, x, y });
    else setGlobe3dTooltip({ marker, x, y });
  }, []);

  const utcStr = now.toUTCString().slice(5, 25);

  return (
    <div className="min-h-screen w-full text-slate-900 dark:text-slate-100 font-sans">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 flex-shrink-0">
          <Globe className="text-white w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">World Monitor</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Global markets, sentiment & economic events</p>
        </div>

        {/* UTC Clock */}
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 ml-auto">
          <Clock size={13} />
          <span className="font-mono">{utcStr} UTC</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-emerald-500 font-bold text-[11px]">LIVE</span>
        </div>

        {/* 2D / 3D toggle */}
        <div className="flex rounded-lg overflow-hidden border border-border text-xs font-bold">
          {(['2D','3D'] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-1.5 transition-colors ${view === v ? 'bg-indigo-600 text-white' : 'bg-surface text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
            >{v}</button>
          ))}
        </div>
      </div>

      {/* Ticker Strip */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden mb-5 shadow-sm">
        <div ref={tickerRef} className="flex overflow-x-hidden whitespace-nowrap select-none" style={{ scrollBehavior:'auto' }}>
          {[...tickers, ...tickers].map((t, i) => (
            <div key={i} className="inline-flex items-center gap-2 px-5 py-3 border-r border-border/50 flex-shrink-0">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{t.name}</span>
              {t.isReal && <span className="text-[9px] px-1 py-0.5 rounded bg-emerald-500/20 text-emerald-500 font-bold">LIVE</span>}
              <span className="text-sm font-mono font-semibold text-slate-900 dark:text-white">
                {t.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </span>
              <span className={`text-xs font-medium flex items-center gap-0.5 ${t.changePercent >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {t.changePercent >= 0 ? <TrendingUp size={11}/> : <TrendingDown size={11}/>}
                {t.changePercent >= 0 ? '+' : ''}{t.changePercent.toFixed(2)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_220px_260px] gap-5 mb-5">

        {/* Map / Globe */}
        <div className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border flex items-center gap-2 flex-wrap">
            <Globe size={15} className="text-indigo-500" />
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              {view === '2D' ? 'Global Market Status' : '3D Globe — Drag to Rotate'}
            </span>
            {view === '3D' && (
              <div className="ml-auto flex items-center gap-3">
                <button
                  onClick={() => setLayers(l => ({ ...l, marketHubs: !l.marketHubs }))}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-medium border transition-colors ${layers.marketHubs ? 'bg-indigo-600/10 border-indigo-500/30 text-indigo-500' : 'border-border text-slate-500 dark:text-slate-400'}`}
                >
                  <Layers size={11}/> Markets
                </button>
                <button
                  onClick={() => setLayers(l => ({ ...l, econEvents: !l.econEvents }))}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-medium border transition-colors ${layers.econEvents ? 'bg-rose-500/10 border-rose-500/30 text-rose-500' : 'border-border text-slate-500 dark:text-slate-400'}`}
                >
                  <AlertCircle size={11}/> Events
                </button>
              </div>
            )}
            {view === '2D' && (
              <div className="ml-auto flex items-center gap-4 text-[11px]">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"/>Open</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"/>Pre/Post</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"/>Closed</span>
              </div>
            )}
          </div>

          {/* 2D Map */}
          {view === '2D' && (
            <div className="relative w-full" style={{ paddingBottom:'55%' }}>
              <svg viewBox="0 0 1000 500" className="absolute inset-0 w-full h-full" onMouseLeave={() => setTooltip(null)}>
                <defs>
                  <linearGradient id="oceanGrad2D" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#0d2f5e"/>
                    <stop offset="50%" stopColor="#0a2448"/>
                    <stop offset="100%" stopColor="#061526"/>
                  </linearGradient>
                  <filter id="landShadow">
                    <feDropShadow dx="0" dy="1" stdDeviation="1" floodOpacity="0.3"/>
                  </filter>
                </defs>
                <rect width="1000" height="500" fill="url(#oceanGrad2D)"/>
                {/* Lat/lon grid lines */}
                {[-60,-30,30,60].map(lat => {
                  const y = Math.round((90-lat)/180*500);
                  return <line key={lat} x1="0" y1={y} x2="1000" y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="0.5"/>;
                })}
                {[-150,-120,-90,-60,-30,0,30,60,90,120,150].map(lon => {
                  const x = Math.round((lon+180)/360*1000);
                  return <line key={lon} x1={x} y1="0" x2={x} y2="500" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5"/>;
                })}
                {/* Continents from shared landmass data */}
                <g fill={isDarkMode ? '#2d5a27' : '#4a7c59'} stroke={isDarkMode ? '#3a7032' : '#5d9e6e'} strokeWidth="0.7" filter="url(#landShadow)">
                  {LANDMASSES.map(lm => (
                    <path key={lm.name} d={landmassSVGPath(lm.coords, 1000, 500)}/>
                  ))}
                </g>
                {/* Exchange dots */}
                {HUBS.map(h => {
                  const s = getStatus(h); const col = statusColor(s);
                  const cx = Math.round((h.lon + 180) / 360 * 1000);
                  const cy = Math.round((90 - h.lat) / 180 * 500);
                  return (
                    <g key={h.id}
                      onMouseEnter={e => { const r = (e.currentTarget.closest('svg') as SVGSVGElement).getBoundingClientRect(); setTooltip({ hub: h, x: cx * (r.width / 1000) + r.left, y: cy * (r.height / 500) + r.top }); }}
                      onMouseLeave={() => setTooltip(null)} style={{ cursor:'pointer' }}>
                      {s === 'open' && <circle cx={cx} cy={cy} r="10" fill={col} opacity="0.15"><animate attributeName="r" from="6" to="14" dur="2s" repeatCount="indefinite"/><animate attributeName="opacity" from="0.25" to="0" dur="2s" repeatCount="indefinite"/></circle>}
                      <circle cx={cx} cy={cy} r="5" fill={col} stroke="white" strokeWidth="1.5"/>
                      <text x={cx+7} y={cy+4} fontSize="8" fill={isDarkMode ? '#94a3b8' : '#475569'} fontFamily="monospace">{h.city}</text>
                    </g>
                  );
                })}
              </svg>
              {/* 2D Tooltip */}
              {tooltip && (
                <div className="fixed z-50 bg-slate-900 text-white text-xs rounded-xl shadow-2xl p-3 w-52 pointer-events-none"
                  style={{ left: tooltip.x + 12, top: tooltip.y - 60 }}>
                  <div className="font-bold text-sm mb-1">{tooltip.hub.exchange}</div>
                  <div className="text-slate-400 mb-2">{tooltip.hub.city}</div>
                  <div className="flex justify-between mb-1"><span className="text-slate-400">Status</span><span style={{ color: statusColor(getStatus(tooltip.hub)) }} className="font-semibold capitalize">{getStatus(tooltip.hub)}</span></div>
                  <div className="flex justify-between mb-1"><span className="text-slate-400">{tooltip.hub.index}</span><span className="font-mono">{hubVals[tooltip.hub.id]?.toLocaleString(undefined,{maximumFractionDigits:0})}</span></div>
                  <div className="flex justify-between text-slate-400"><span>UTC</span><span>{String(tooltip.hub.utcOpenH).padStart(2,'0')}:{String(tooltip.hub.utcOpenM).padStart(2,'0')}–{String(tooltip.hub.utcCloseH).padStart(2,'0')}:{String(tooltip.hub.utcCloseM).padStart(2,'0')}</span></div>
                </div>
              )}
            </div>
          )}

          {/* 3D Globe */}
          {view === '3D' && (
            <div className="relative" style={{ height: 420 }}>
              <Globe3D markers={globeMarkers} onMarkerHover={handle3DHover} isDarkMode={isDarkMode} />
              <div className="absolute bottom-3 right-3 text-[10px] text-slate-500 dark:text-slate-600">
                Drag to rotate · Double-click to pause spin
              </div>
              {/* 3D Tooltip */}
              {globe3dTooltip && (
                <div className="fixed z-50 bg-slate-900 text-white text-xs rounded-xl shadow-2xl p-3 w-48 pointer-events-none"
                  style={{ left: globe3dTooltip.x + 12, top: globe3dTooltip.y - 60 }}>
                  {(() => {
                    const hub = HUBS.find(h => h.id === globe3dTooltip.marker.id);
                    if (hub) return (<>
                      <div className="font-bold mb-1">{hub.exchange}</div>
                      <div className="text-slate-400 mb-1">{hub.city}</div>
                      <div className="flex justify-between"><span className="text-slate-400">{hub.index}</span><span className="font-mono">{hubVals[hub.id]?.toLocaleString(undefined,{maximumFractionDigits:0})}</span></div>
                      <div className="flex justify-between mt-1"><span className="text-slate-400">Status</span><span style={{ color: globe3dTooltip.marker.color }} className="font-semibold capitalize">{getStatus(hub)}</span></div>
                    </>);
                    return <div className="font-bold">{globe3dTooltip.marker.label}</div>;
                  })()}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Fear & Greed */}
        <div className="rounded-xl border border-border bg-surface shadow-sm p-4 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 size={15} className="text-amber-500"/>
            <span className="text-sm font-bold text-slate-900 dark:text-white">Fear & Greed</span>
          </div>
          <div style={{ height: 120 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart cx="50%" cy="80%" innerRadius="60%" outerRadius="100%" startAngle={180} endAngle={0} data={[{ value: sentiment, fill: sentColor(sentiment) }]}>
                <RadialBar dataKey="value" cornerRadius={6} background={{ fill: isDarkMode ? '#1e293b' : '#e2e8f0' }}/>
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center -mt-8 mb-4">
            <div className="text-3xl font-bold" style={{ color: sentColor(sentiment) }}>{Math.round(sentiment)}</div>
            <div className="text-xs font-semibold mt-0.5" style={{ color: sentColor(sentiment) }}>{sentLabel(sentiment)}</div>
          </div>
          <div className="space-y-2.5">
            {regionalScores.map(r => (
              <div key={r.region}>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-500 dark:text-slate-400">{r.region}</span>
                  <span className="font-semibold" style={{ color: sentColor(r.score) }}>{r.score}</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width:`${r.score}%`, backgroundColor: sentColor(r.score) }}/>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Movers */}
        <div className="rounded-xl border border-border bg-surface shadow-sm flex flex-col overflow-hidden">
          <div className="flex border-b border-border">
            {(['gainers','losers'] as const).map(t => (
              <button key={t} onClick={() => setActiveTab(t)}
                className={`flex-1 py-3 text-xs font-bold capitalize transition-colors ${activeTab === t ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 bg-indigo-50 dark:bg-indigo-500/10' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white'}`}>
                <span className="flex items-center justify-center gap-1">
                  {t === 'gainers' ? <><TrendingUp size={12}/>Top Gainers</> : <><TrendingDown size={12}/>Top Losers</>}
                </span>
              </button>
            ))}
          </div>
          <div className="overflow-auto flex-1">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-3 py-2 text-slate-500 dark:text-slate-400 font-medium">Symbol</th>
                  <th className="text-right px-3 py-2 text-slate-500 dark:text-slate-400 font-medium">Price</th>
                  <th className="text-right px-3 py-2 text-slate-500 dark:text-slate-400 font-medium">Chg%</th>
                  <th className="text-right px-3 py-2 text-slate-500 dark:text-slate-400 font-medium">Trend</th>
                </tr>
              </thead>
              <tbody>
                {(activeTab === 'gainers' ? gainers : losers).map(m => (
                  <tr key={m.symbol} className="border-b border-border/50 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-3 py-2">
                      <div className="font-bold font-mono text-slate-900 dark:text-white">{m.symbol}</div>
                      <div className="text-slate-500 dark:text-slate-400 text-[10px]">{m.region}</div>
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-slate-800 dark:text-slate-200">{m.price.toLocaleString(undefined,{maximumFractionDigits:2})}</td>
                    <td className={`px-3 py-2 text-right font-bold ${m.changePercent >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{m.changePercent >= 0 ? '+' : ''}{m.changePercent.toFixed(2)}%</td>
                    <td className="px-3 py-2 text-right"><Sparkline data={m.spark} pos={m.changePercent >= 0}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Economic Calendar */}
      <div className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <AlertCircle size={15} className="text-rose-500"/>
          <span className="text-sm font-bold text-slate-900 dark:text-white">Economic Calendar</span>
          <span className="ml-auto text-[11px] text-slate-500 dark:text-slate-400">Click for details</span>
        </div>
        <div className="overflow-x-auto">
          <div className="flex gap-3 p-4" style={{ minWidth:'max-content' }}>
            {ECON_EVENTS.map(ev => {
              const past = ev.offsetHours < 0;
              const ic: Record<string,string> = { High:'bg-rose-500/20 text-rose-500', Medium:'bg-amber-500/20 text-amber-500', Low:'bg-slate-500/20 text-slate-500 dark:text-slate-400' };
              return (
                <button key={ev.id} onClick={() => setSelectedEvent(ev)}
                  className={`flex flex-col gap-2 p-3 rounded-xl border text-left min-w-[180px] hover:shadow-md transition-all ${past ? 'border-border/50 bg-slate-50 dark:bg-slate-800/50 opacity-75' : 'border-indigo-500/20 bg-indigo-50 dark:bg-indigo-500/5 hover:border-indigo-500/40'}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-lg">{ev.flag}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ic[ev.impact]}`}>{ev.impact}</span>
                  </div>
                  <div className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">{ev.event}</div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                    <span>{fmtRel(ev.offsetHours)}</span><span>{ev.actual !== '—' ? ev.actual : ev.forecast}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Event Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setSelectedEvent(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 border border-border relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedEvent(null)} className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"><X size={18}/></button>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">{selectedEvent.flag}</span>
              <div>
                <div className="font-bold text-slate-900 dark:text-white">{selectedEvent.event}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{selectedEvent.country} · {fmtRel(selectedEvent.offsetHours)}</div>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">{selectedEvent.detail}</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-border p-3 bg-slate-50 dark:bg-slate-800">
                <div className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">Actual</div>
                <div className="font-bold text-slate-900 dark:text-white">{selectedEvent.actual}</div>
              </div>
              <div className="rounded-lg border border-border p-3 bg-slate-50 dark:bg-slate-800">
                <div className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">Forecast</div>
                <div className="font-bold text-slate-900 dark:text-white">{selectedEvent.forecast}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorldMonitor;
