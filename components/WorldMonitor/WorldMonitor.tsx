import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Globe, TrendingUp, TrendingDown, Clock, AlertCircle, BarChart2,
  X, Layers, Zap, Flame, Anchor, Plane, Shield, Atom, Activity
} from 'lucide-react';
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';
import Globe3D from './Globe3D';
import type { GlobeMarker } from './Globe3D';
import { LANDMASSES, landmassSVGPath } from './landmasses';
import {
  fetchEarthquakes, getConflictMarkers, getMilitaryMarkers,
  getNuclearMarkers, getShipMarkers, getAircraftMarkers, getBreakingAlerts,
  CATEGORY_COLORS, type MarkerCategory, type GeoMarker,
} from '../../services/geopoliticalService';

// ─── Types ──────────────────────────────────────────────────
interface TickerItem { name: string; symbol: string; value: number; change: number; changePercent: number; isReal?: boolean; }
interface MarketHub { id: string; exchange: string; city: string; index: string; indexValue: number; lat: number; lon: number; x: number; y: number; utcOpenH: number; utcOpenM: number; utcCloseH: number; utcCloseM: number; }
interface Mover { symbol: string; name: string; region: string; price: number; change: number; changePercent: number; volume: string; spark: number[]; }
interface EconEvent { id: number; flag: string; country: string; event: string; offsetHours: number; impact: 'High' | 'Medium' | 'Low'; actual: string; forecast: string; detail: string; }
interface Props { isDarkMode: boolean; }

// ─── Constants ───────────────────────────────────────────────
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
];
const INIT_LOSERS: Mover[] = [
  { symbol:'INTC',name:'Intel',    region:'US',  price:42.18,  change:-3.22, changePercent:-7.09,volume:'52.4M',spark:[48,47,46,45,44,43,42,42]},
  { symbol:'BA',  name:'Boeing',   region:'US',  price:182.55, change:-10.44,changePercent:-5.41,volume:'14.8M',spark:[196,194,191,188,186,185,184,182]},
  { symbol:'WBA', name:'Walgreens',region:'US',  price:18.72,  change:-0.98, changePercent:-4.98,volume:'10.2M',spark:[21,20,20,19,19,19,18,18]},
  { symbol:'LI',  name:'Li Auto',  region:'Asia',price:28.14,  change:-1.32, changePercent:-4.48,volume:'18.6M',spark:[32,31,30,30,29,29,28,28]},
  { symbol:'PARA',name:'Paramount',region:'US',  price:11.88,  change:-0.52, changePercent:-4.19,volume:'9.1M', spark:[14,13,13,12,12,12,11,11]},
  { symbol:'XOM', name:'ExxonMobil',region:'US', price:109.42, change:-4.10, changePercent:-3.61,volume:'17.3M',spark:[116,115,114,113,112,111,110,109]},
];

const ECON_EVENTS: EconEvent[] = [
  { id:1, flag:'🇺🇸',country:'US',    event:'CPI Data (YoY)',       offsetHours:-2, impact:'High',  actual:'3.2%', forecast:'3.1%', detail:'US Consumer Price Index rose 3.2% YoY, slightly above the 3.1% forecast.' },
  { id:2, flag:'🇪🇺',country:'EU',    event:'ECB Interest Rate',    offsetHours:1,  impact:'High',  actual:'—',    forecast:'4.25%',detail:'ECB rate decision. Markets expect a hold at 4.25%.' },
  { id:3, flag:'🇯🇵',country:'Japan', event:'BOJ Policy Rate',      offsetHours:-8, impact:'High',  actual:'0.1%', forecast:'0.1%', detail:'BOJ maintained its policy at 0.1%, citing fragile recovery.' },
  { id:4, flag:'🇬🇧',country:'UK',    event:'GDP (QoQ)',            offsetHours:-5, impact:'Medium',actual:'0.4%', forecast:'0.3%', detail:'UK economy grew 0.4% in Q4, beating forecasts.' },
  { id:5, flag:'🇨🇳',country:'China', event:'Manufacturing PMI',   offsetHours:3,  impact:'Medium',actual:'—',    forecast:'50.2', detail:'Official manufacturing PMI for China. Above 50 = expansion.' },
  { id:6, flag:'🇺🇸',country:'US',    event:'Non-Farm Payrolls',   offsetHours:24, impact:'High',  actual:'—',    forecast:'218K', detail:'Monthly US jobs report. Strong numbers could keep Fed hawkish.' },
  { id:7, flag:'🇩🇪',country:'Germany',event:'IFO Business Climate',offsetHours:-1,impact:'Medium',actual:'89.4', forecast:'89.0', detail:'German business sentiment exceeded expectations.' },
  { id:8, flag:'🇧🇷',country:'Brazil',event:'SELIC Rate Decision',  offsetHours:6,  impact:'Medium',actual:'—',    forecast:'10.5%',detail:'Brazil\'s central bank expected to cut rates by 25bps.' },
];

// ─── Layer config ────────────────────────────────────────────
type LayerKey = 'marketHubs' | 'earthquakes' | 'conflicts' | 'military' | 'ships' | 'aircraft' | 'nuclear';
interface LayerCfg { key: LayerKey; label: string; icon: React.ReactNode; color: string; }
const LAYERS: LayerCfg[] = [
  { key:'marketHubs',  label:'Markets',   icon:<BarChart2 size={11}/>,  color:'#10b981' },
  { key:'earthquakes', label:'Quakes',    icon:<Zap size={11}/>,        color:'#f97316' },
  { key:'conflicts',   label:'Conflicts', icon:<Flame size={11}/>,      color:'#ef4444' },
  { key:'military',    label:'Military',  icon:<Shield size={11}/>,     color:'#6366f1' },
  { key:'ships',       label:'Ships',     icon:<Anchor size={11}/>,     color:'#06b6d4' },
  { key:'aircraft',    label:'Aircraft',  icon:<Plane size={11}/>,      color:'#e2e8f0' },
  { key:'nuclear',     label:'Nuclear',   icon:<Atom size={11}/>,       color:'#22c55e' },
];

// ─── Geo Risk regions ─────────────────────────────────────────
const GEO_RISK_BASE = [
  { region: 'Middle East',   base: 82 },
  { region: 'Eastern Europe',base: 78 },
  { region: 'East Africa',   base: 71 },
  { region: 'South China Sea',base: 65 },
  { region: 'Sahel',         base: 68 },
  { region: 'Americas',      base: 28 },
  { region: 'Western Europe',base: 22 },
];

// ─── Helpers ─────────────────────────────────────────────────
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

const riskColor = (s: number) =>
  s >= 75 ? '#ef4444' : s >= 55 ? '#f97316' : s >= 40 ? '#f59e0b' : '#10b981';

const riskLabel = (s: number) =>
  s >= 75 ? 'CRITICAL' : s >= 55 ? 'HIGH' : s >= 40 ? 'MEDIUM' : 'LOW';

const fmtRel = (h: number) => { const a = Math.abs(h); const v = a < 1 ? `${Math.round(a * 60)}m` : `${Math.round(a)}h`; return h >= 0 ? `in ${v}` : `${v} ago`; };

const catIcon = (cat: MarkerCategory) => {
  const cls = 'w-3 h-3 flex-shrink-0';
  if (cat === 'earthquake') return <Zap className={cls} style={{ color: CATEGORY_COLORS.earthquake }}/>;
  if (cat === 'conflict')   return <Flame className={cls} style={{ color: CATEGORY_COLORS.conflict }}/>;
  if (cat === 'nuclear')    return <Atom className={cls} style={{ color: CATEGORY_COLORS.nuclear }}/>;
  if (cat === 'military')   return <Shield className={cls} style={{ color: CATEGORY_COLORS.military }}/>;
  if (cat === 'ship')       return <Anchor className={cls} style={{ color: CATEGORY_COLORS.ship }}/>;
  if (cat === 'aircraft')   return <Plane className={cls} style={{ color: CATEGORY_COLORS.aircraft }}/>;
  return <Activity className={cls} style={{ color: CATEGORY_COLORS.market }}/>;
};

function Sparkline({ data, pos }: { data: number[]; pos: boolean }) {
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * 60},${24 - ((v - min) / range) * 24}`).join(' ');
  return <svg width={60} height={24} viewBox="0 0 60 24"><polyline points={pts} fill="none" stroke={pos ? '#10b981' : '#ef4444'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

// ─── Main Component ───────────────────────────────────────────
const WorldMonitor: React.FC<Props> = ({ isDarkMode }) => {
  const [tickers, setTickers] = useState<TickerItem[]>(INIT_TICKERS);
  const [hubVals, setHubVals] = useState<Record<string, number>>(Object.fromEntries(HUBS.map(h => [h.id, h.indexValue])));
  const [sentiment, setSentiment] = useState(62);
  const [gainers, setGainers] = useState<Mover[]>(INIT_GAINERS);
  const [losers, setLosers] = useState<Mover[]>(INIT_LOSERS);
  const [activeTab, setActiveTab] = useState<'gainers' | 'losers'>('gainers');
  const [selectedEvent, setSelectedEvent] = useState<EconEvent | null>(null);
  const [now, setNow] = useState(new Date());
  const [layers, setLayers] = useState<Record<LayerKey, boolean>>({ marketHubs:true, earthquakes:true, conflicts:true, military:false, ships:false, aircraft:false, nuclear:false });
  const [globeTooltip, setGlobeTooltip] = useState<{ marker: GlobeMarker; x: number; y: number } | null>(null);

  // Geo data states
  const [earthquakeMarkers, setEarthquakeMarkers] = useState<GeoMarker[]>([]);
  const [conflictMarkers] = useState<GeoMarker[]>(getConflictMarkers());
  const [militaryMarkers] = useState<GeoMarker[]>(getMilitaryMarkers());
  const [nuclearMarkers] = useState<GeoMarker[]>(getNuclearMarkers());
  const [shipMarkers, setShipMarkers] = useState<GeoMarker[]>(getShipMarkers());
  const [aircraftMarkers, setAircraftMarkers] = useState<GeoMarker[]>(getAircraftMarkers());
  const [geoRisk, setGeoRisk] = useState(GEO_RISK_BASE.map(r => ({ ...r, score: r.base + Math.round((Math.random() - 0.5) * 6) })));

  const tickerRef = useRef<HTMLDivElement>(null);

  // ── Clock
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(id); }, []);

  // ── Ticker auto-scroll
  useEffect(() => {
    const el = tickerRef.current; if (!el) return;
    let pos = 0;
    const id = setInterval(() => { pos += 0.5; if (pos >= el.scrollWidth / 2) pos = 0; el.scrollLeft = pos; }, 30);
    return () => clearInterval(id);
  }, []);

  // ── Ticker simulation
  useEffect(() => {
    const id = setInterval(() => {
      setTickers(prev => prev.map(t => {
        if (t.isReal) return t;
        const nv = rw(t.value); const d = nv - t.value;
        return { ...t, value: nv, change: d, changePercent: (d / t.value) * 100 };
      }));
    }, 5000);
    return () => clearInterval(id);
  }, []);

  // ── Real crypto prices
  const fetchCrypto = useCallback(async () => {
    try {
      const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,binancecoin&vs_currencies=usd&include_24hr_change=true', { headers: { Accept: 'application/json' } });
      if (!res.ok) return;
      const data = await res.json();
      setTickers(prev => prev.map(t => {
        if (t.symbol === 'BTC' && data.bitcoin) return { ...t, value: data.bitcoin.usd, changePercent: data.bitcoin.usd_24h_change, change: data.bitcoin.usd * data.bitcoin.usd_24h_change / 100 };
        if (t.symbol === 'ETH' && data.ethereum) return { ...t, value: data.ethereum.usd, changePercent: data.ethereum.usd_24h_change, change: data.ethereum.usd * data.ethereum.usd_24h_change / 100 };
        if (t.symbol === 'BNB' && data.binancecoin) return { ...t, value: data.binancecoin.usd, changePercent: data.binancecoin.usd_24h_change, change: data.binancecoin.usd * data.binancecoin.usd_24h_change / 100 };
        return t;
      }));
    } catch { /* silent */ }
  }, []);
  useEffect(() => { fetchCrypto(); const id = setInterval(fetchCrypto, 30000); return () => clearInterval(id); }, [fetchCrypto]);

  // ── Earthquake fetch (real-time USGS)
  const loadQuakes = useCallback(async () => {
    const eq = await fetchEarthquakes();
    setEarthquakeMarkers(eq);
  }, []);
  useEffect(() => { loadQuakes(); const id = setInterval(loadQuakes, 5 * 60 * 1000); return () => clearInterval(id); }, [loadQuakes]);

  // ── Drift ships & aircraft every minute
  useEffect(() => {
    const id = setInterval(() => { setShipMarkers(getShipMarkers()); setAircraftMarkers(getAircraftMarkers()); }, 60000);
    return () => clearInterval(id);
  }, []);

  // ── Hub / sentiment / movers drift
  useEffect(() => { const id = setInterval(() => setHubVals(prev => { const n = { ...prev }; for (const k in n) n[k] = rw(n[k], 0.0015); return n; }), 8000); return () => clearInterval(id); }, []);
  useEffect(() => { const id = setInterval(() => setSentiment(p => Math.min(100, Math.max(0, p + (Math.random() - 0.5) * 3))), 15000); return () => clearInterval(id); }, []);
  useEffect(() => {
    const upd = (ms: Mover[]) => ms.map(m => { const np = rw(m.price); const d = np - m.price; return { ...m, price: np, change: d, changePercent: (d / m.price) * 100, spark: [...m.spark.slice(1), np] }; });
    const id = setInterval(() => { setGainers(p => upd(p)); setLosers(p => upd(p)); }, 10000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    const id = setInterval(() => setGeoRisk(prev => prev.map(r => ({ ...r, score: Math.min(99, Math.max(5, r.score + Math.round((Math.random() - 0.5) * 4))) }))), 20000);
    return () => clearInterval(id);
  }, []);

  // ── Build globe markers
  const globeMarkers: GlobeMarker[] = [
    ...(layers.marketHubs ? HUBS.map(h => { const s = getStatus(h); return { id: h.id, lat: h.lat, lon: h.lon, category: 'market' as const, color: statusColor(s), label: h.city.split(' ')[0], detail: `${h.exchange} — ${h.index}: ${hubVals[h.id]?.toLocaleString(undefined, {maximumFractionDigits:0})} | ${s.toUpperCase()}`, intensity: s === 'open' ? 0.7 : 0.3, pulse: s === 'open' }; }) : []),
    ...(layers.earthquakes ? earthquakeMarkers.map(e => ({ ...e, label: e.label })) : []),
    ...(layers.conflicts   ? conflictMarkers   : []),
    ...(layers.military    ? militaryMarkers   : []),
    ...(layers.ships       ? shipMarkers       : []),
    ...(layers.aircraft    ? aircraftMarkers   : []),
    ...(layers.nuclear     ? nuclearMarkers    : []),
  ];

  // ── Breaking alerts derived from live data
  const breakingAlerts = getBreakingAlerts(earthquakeMarkers, conflictMarkers, nuclearMarkers);

  const handleGlobeHover = useCallback((marker: GlobeMarker | null, x: number, y: number) => {
    if (!marker) { setGlobeTooltip(null); return; }
    setGlobeTooltip({ marker, x, y });
  }, []);

  const toggleLayer = (key: LayerKey) => setLayers(l => ({ ...l, [key]: !l[key] }));

  const utcStr = now.toUTCString().slice(5, 25);

  return (
    <div className="min-h-screen w-full text-slate-900 dark:text-slate-100 font-sans">

      {/* ── Header */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center shadow-lg shadow-indigo-500/30 flex-shrink-0">
          <Globe className="text-white w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Global Intelligence Monitor</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Real-time geopolitical events, markets & threat assessment</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 ml-auto">
          <Clock size={13} />
          <span className="font-mono">{utcStr} UTC</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-emerald-500 font-bold text-[11px]">LIVE</span>
        </div>
      </div>

      {/* ── Ticker Strip */}
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

      {/* ── Main layout: Globe + Right Panel */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_290px] gap-5 mb-5">

        {/* Globe Card */}
        <div className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-border flex items-center gap-2 flex-wrap">
            <Globe size={15} className="text-indigo-500" />
            <span className="text-sm font-bold text-slate-900 dark:text-white">3D Geopolitical Globe</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 ml-1">— drag to rotate · dbl-click pause</span>

            {/* Layer toggles */}
            <div className="ml-auto flex flex-wrap gap-1.5">
              {LAYERS.map(l => (
                <button
                  key={l.key}
                  onClick={() => toggleLayer(l.key)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold border transition-all ${layers[l.key] ? 'border-current opacity-100' : 'border-border opacity-40 hover:opacity-70'}`}
                  style={layers[l.key] ? { color: l.color, borderColor: l.color + '55', background: l.color + '15' } : {}}
                >
                  {l.icon}{l.label}
                </button>
              ))}
            </div>
          </div>

          <div className="relative flex-1" style={{ minHeight: 480 }}>
            <Globe3D markers={globeMarkers} onMarkerHover={handleGlobeHover} isDarkMode={isDarkMode} />

            {/* Earthquake count badge */}
            {layers.earthquakes && earthquakeMarkers.length > 0 && (
              <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-orange-400 border border-orange-500/20">
                <Zap size={11}/>{earthquakeMarkers.length} quakes today
              </div>
            )}

            {/* Tooltip */}
            {globeTooltip && (
              <div className="fixed z-50 pointer-events-none"
                style={{ left: globeTooltip.x + 14, top: globeTooltip.y - 70 }}>
                <div className="bg-slate-950/95 backdrop-blur-md border border-white/10 text-white text-xs rounded-xl shadow-2xl p-3 w-52">
                  <div className="flex items-center gap-2 mb-1.5">
                    {catIcon(globeTooltip.marker.category)}
                    <span className="font-bold text-[13px] leading-tight">{globeTooltip.marker.label}</span>
                  </div>
                  {globeTooltip.marker.detail && (
                    <p className="text-slate-300 leading-snug text-[11px]">{globeTooltip.marker.detail}</p>
                  )}
                  {(globeTooltip.marker.intensity ?? 0) > 0 && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-slate-500 text-[10px]">Intensity</span>
                      <div className="flex-1 h-1.5 rounded-full bg-slate-700 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width:`${(globeTooltip.marker.intensity ?? 0.5)*100}%`, backgroundColor: globeTooltip.marker.color }}/>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel */}
        <div className="flex flex-col gap-4">

          {/* Breaking Alerts */}
          <div className="rounded-xl border border-border bg-surface shadow-sm flex flex-col overflow-hidden flex-1">
            <div className="p-3 border-b border-border flex items-center gap-2">
              <AlertCircle size={14} className="text-rose-500"/>
              <span className="text-sm font-bold text-slate-900 dark:text-white">Breaking Alerts</span>
              {breakingAlerts.filter(a => a.severity === 'HIGH').length > 0 && (
                <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 font-bold animate-pulse">
                  {breakingAlerts.filter(a => a.severity === 'HIGH').length} CRITICAL
                </span>
              )}
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: 280 }}>
              {breakingAlerts.length === 0 ? (
                <div className="p-4 text-xs text-slate-500 dark:text-slate-400 text-center">Loading alerts…</div>
              ) : breakingAlerts.map(a => (
                <div key={a.id} className="flex gap-2.5 p-3 border-b border-border/50 hover:bg-white/5 transition-colors">
                  <div className="mt-0.5 flex-shrink-0">{catIcon(a.category)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1 mb-0.5">
                      <span className="text-[11px] font-bold text-slate-900 dark:text-white leading-tight truncate">{a.title}</span>
                      <span className={`flex-shrink-0 text-[9px] px-1.5 py-0.5 rounded-full font-bold ${a.severity === 'HIGH' ? 'bg-rose-500/25 text-rose-400' : a.severity === 'MEDIUM' ? 'bg-amber-500/25 text-amber-400' : 'bg-slate-500/25 text-slate-400'}`}>
                        {a.severity}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug line-clamp-2">{a.detail}</p>
                    <span className="text-[9px] text-slate-600 dark:text-slate-500 mt-0.5 block">
                      {Math.round((Date.now() - a.timestamp) / 60000)}m ago
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Geo Risk Index */}
          <div className="rounded-xl border border-border bg-surface shadow-sm p-3">
            <div className="flex items-center gap-2 mb-3">
              <Activity size={14} className="text-amber-500"/>
              <span className="text-sm font-bold text-slate-900 dark:text-white">Geopolitical Risk Index</span>
            </div>
            <div className="space-y-2.5">
              {geoRisk.sort((a,b)=>b.score-a.score).map(r => (
                <div key={r.region}>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-500 dark:text-slate-400">{r.region}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold" style={{ color: riskColor(r.score) }}>{r.score}</span>
                      <span className="text-[9px] px-1 rounded font-bold" style={{ color: riskColor(r.score), background: riskColor(r.score)+'22' }}>{riskLabel(r.score)}</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width:`${r.score}%`, backgroundColor: riskColor(r.score) }}/>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Fear & Greed */}
          <div className="rounded-xl border border-border bg-surface shadow-sm p-3">
            <div className="flex items-center gap-2 mb-2">
              <BarChart2 size={14} className="text-amber-500"/>
              <span className="text-sm font-bold text-slate-900 dark:text-white">Market Fear & Greed</span>
            </div>
            <div style={{ height: 100 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart cx="50%" cy="80%" innerRadius="60%" outerRadius="100%" startAngle={180} endAngle={0} data={[{ value: sentiment, fill: sentColor(sentiment) }]}>
                  <RadialBar dataKey="value" cornerRadius={6} background={{ fill: isDarkMode ? '#1e293b' : '#e2e8f0' }}/>
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center -mt-4">
              <div className="text-3xl font-bold" style={{ color: sentColor(sentiment) }}>{Math.round(sentiment)}</div>
              <div className="text-xs font-semibold mt-0.5" style={{ color: sentColor(sentiment) }}>{sentLabel(sentiment)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Top Movers */}
        <div className="rounded-xl border border-border bg-surface shadow-sm flex flex-col overflow-hidden">
          <div className="flex border-b border-border">
            {(['gainers','losers'] as const).map(t => (
              <button key={t} onClick={() => setActiveTab(t)}
                className={`flex-1 py-3 text-xs font-bold capitalize transition-colors ${activeTab === t ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 bg-indigo-50 dark:bg-indigo-500/10' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white'}`}>
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

        {/* Economic Calendar */}
        <div className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
          <div className="p-3 border-b border-border flex items-center gap-2">
            <AlertCircle size={14} className="text-rose-500"/>
            <span className="text-sm font-bold text-slate-900 dark:text-white">Economic Calendar</span>
            <span className="ml-auto text-[10px] text-slate-500 dark:text-slate-400">click for detail</span>
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: 300 }}>
            {ECON_EVENTS.map(ev => {
              const past = ev.offsetHours < 0;
              const ic: Record<string,string> = { High:'bg-rose-500/20 text-rose-500', Medium:'bg-amber-500/20 text-amber-500', Low:'bg-slate-500/20 text-slate-400' };
              return (
                <button key={ev.id} onClick={() => setSelectedEvent(ev)}
                  className={`flex items-center gap-3 w-full px-3 py-2.5 border-b border-border/50 text-left hover:bg-white/5 transition-colors ${past ? 'opacity-60' : ''}`}>
                  <span className="text-base flex-shrink-0">{ev.flag}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-semibold text-slate-900 dark:text-white truncate">{ev.event}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">{ev.country} · {fmtRel(ev.offsetHours)}</div>
                  </div>
                  <span className={`flex-shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${ic[ev.impact]}`}>{ev.impact}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Military Activity */}
        <div className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
          <div className="p-3 border-b border-border flex items-center gap-2">
            <Shield size={14} className="text-indigo-500"/>
            <span className="text-sm font-bold text-slate-900 dark:text-white">Military Activity</span>
            <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 font-bold">{militaryMarkers.length} TRACKED</span>
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: 300 }}>
            {militaryMarkers.map((m, i) => (
              <div key={m.id} className="flex gap-3 px-3 py-2.5 border-b border-border/50 hover:bg-white/5 transition-colors">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: '#6366f1' + '25' }}>
                  <Shield size={11} style={{ color: '#6366f1' }}/>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-bold text-slate-900 dark:text-white truncate">{m.label}</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug line-clamp-2">{m.detail}</div>
                </div>
                <div className="flex-shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5" style={{ backgroundColor: m.intensity > 0.65 ? '#ef4444' : m.intensity > 0.45 ? '#f59e0b' : '#10b981' }}/>
                </div>
              </div>
            ))}
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
