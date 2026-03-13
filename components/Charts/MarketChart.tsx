import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
  Line,
  Bar,
  Cell
} from 'recharts';
import { Candle } from '../../types';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

interface MarketChartProps {
  data: Candle[];
  symbol: string;
  isDarkMode?: boolean;
  comparisons?: string[];
  indicators?: {
    ma: boolean;
    rsi: boolean;
    macd: boolean;
  };
  predictionConfidence?: number;
  predictionRisk?: string;
}

const COMPARISON_COLORS = ['#f59e0b', '#0ea5e9', '#ec4899', '#8b5cf6'];
const PREDICTION_COLOR = '#8b5cf6'; // Violet for AI
const PREDICTION_STROKE_WIDTH = 3;

const MarketChart: React.FC<MarketChartProps> = ({ 
  data, 
  symbol, 
  isDarkMode = true, 
  comparisons = [],
  indicators = { ma: false, rsi: false, macd: false },
  predictionConfidence,
  predictionRisk
}) => {
  // Split data
  const historicalData = data.filter(d => !d.isPrediction);
  const predictionData = data.filter(d => d.isPrediction);
  const lastHistorical = historicalData[historicalData.length - 1];
  
  // Current Price Calculation for Quick Trade Panel
  const currentPrice = lastHistorical?.close || 0;
  const previousPrice = historicalData[historicalData.length - 2]?.close || currentPrice;
  const priceChange = currentPrice - previousPrice;
  const isPriceUp = priceChange >= 0;
  
  const isTrendPositive = lastHistorical && historicalData[0] 
    ? lastHistorical.close >= historicalData[0].close 
    : true;

  const strokeColor = isTrendPositive ? '#10b981' : '#ef4444'; 
  const fillColor = isTrendPositive ? 'url(#colorUp)' : 'url(#colorDown)';

  // Prepare prediction data - seamlessly connect to history
  const predictionDisplayData = [...predictionData];
  if (lastHistorical && predictionData.length > 0) {
    predictionDisplayData.unshift(lastHistorical);
  }

  // Define prediction range for background highlighting
  const predictionStartTime = lastHistorical?.time;
  const predictionEndTime = predictionData.length > 0 ? predictionData[predictionData.length - 1].time : null;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' });
  };

  const ZapIcon = () => (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="animate-pulse">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      // Find the main payload for the current stock
      const d = payload.find((p: any) => p.dataKey === 'close')?.payload as Candle;
      
      if (!d) return null;

      return (
        <div className="bg-white/95 dark:bg-[#0B0E14]/95 border border-slate-200 dark:border-slate-700 p-3 rounded-lg shadow-2xl backdrop-blur-md min-w-[180px] z-50">
          <p className="text-slate-500 text-[10px] font-semibold mb-2 uppercase tracking-wide font-mono border-b border-slate-200 dark:border-slate-800 pb-1">
            {new Date(label).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
          
          <div className="flex justify-between items-center mb-1">
             <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${d.isPrediction ? 'bg-violet-500 animate-pulse' : (isTrendPositive ? 'bg-emerald-500' : 'bg-rose-500')}`}></span>
                <span className="text-slate-500 dark:text-slate-400 text-xs font-bold">{symbol}</span>
             </div>
             <span className={`font-mono text-sm font-bold ${d.isPrediction ? 'text-violet-500 dark:text-violet-400' : 'text-slate-900 dark:text-white'}`}>
                ${d.close.toFixed(2)}
             </span>
          </div>

          {/* Comparisons */}
          {comparisons.map((compSymbol, idx) => {
            const compValue = d[compSymbol as keyof Candle] as number;
            if (compValue === undefined) return null;
            return (
              <div key={compSymbol} className="flex justify-between items-center mb-1">
                 <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COMPARISON_COLORS[idx % COMPARISON_COLORS.length] }}></span>
                    <span className="text-slate-500 dark:text-slate-400 text-xs font-bold">{compSymbol}</span>
                 </div>
                 <span className="font-mono text-sm font-medium text-slate-700 dark:text-slate-300">
                    ${compValue.toFixed(2)}
                 </span>
              </div>
            );
          })}

          {/* Indicators Info */}
          <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1">
             {indicators.ma && d.ma7 && (
                <div className="flex justify-between items-center text-[10px]">
                   <span className="text-orange-500 font-bold">MA7</span>
                   <span className="font-mono text-slate-700 dark:text-slate-300">{d.ma7.toFixed(2)}</span>
                </div>
             )}
             {indicators.ma && d.ma25 && (
                <div className="flex justify-between items-center text-[10px]">
                   <span className="text-blue-500 font-bold">MA25</span>
                   <span className="font-mono text-slate-700 dark:text-slate-300">{d.ma25.toFixed(2)}</span>
                </div>
             )}
             {indicators.rsi && d.rsi && (
                <div className="flex justify-between items-center text-[10px]">
                   <span className="text-purple-500 font-bold">RSI</span>
                   <span className="font-mono text-slate-700 dark:text-slate-300">{d.rsi.toFixed(2)}</span>
                </div>
             )}
          </div>

          {!d.isPrediction && (
            <div className="space-y-0.5 mt-2 pt-2 border-t border-slate-200 dark:border-slate-800 opacity-80">
               <div className="flex justify-between text-[10px]">
                 <span className="text-slate-500">Vol</span>
                 <span className="text-slate-700 dark:text-slate-300 font-mono">{(d.volume / 1000).toFixed(1)}K</span>
               </div>
            </div>
          )}
          
          {d.isPrediction && (
             <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800 bg-violet-50/50 dark:bg-violet-500/10 -mx-3 -mb-3 px-3 py-2">
                <div className="flex justify-between items-center mb-1.5">
                  <p className="text-[10px] text-violet-600 dark:text-violet-400 font-bold flex items-center gap-1.5 uppercase tracking-wider">
                     <ZapIcon />
                     AI Forecast
                  </p>
                </div>
                <div className="flex items-center gap-3">
                   {predictionConfidence && (
                     <div className="flex items-center gap-1.5 bg-white/40 dark:bg-black/20 px-1.5 py-0.5 rounded border border-violet-500/10">
                        <span className="text-[9px] text-slate-500 dark:text-slate-400 font-semibold uppercase">Conf</span>
                        <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400">{predictionConfidence}%</span>
                     </div>
                   )}
                   {predictionRisk && (
                     <div className="flex items-center gap-1.5 bg-white/40 dark:bg-black/20 px-1.5 py-0.5 rounded border border-violet-500/10">
                        <span className="text-[9px] text-slate-500 dark:text-slate-400 font-semibold uppercase">Risk</span>
                        <span className={`text-[10px] font-mono font-bold ${
                            predictionRisk === 'HIGH' ? 'text-rose-500' : 
                            predictionRisk === 'MEDIUM' ? 'text-amber-500' : 'text-emerald-500'
                        }`}>{predictionRisk}</span>
                     </div>
                   )}
                </div>
             </div>
          )}
        </div>
      );
    }
    return null;
  };
  
  // Theme Variables
  const gridColor = isDarkMode ? "#1e293b" : "#e2e8f0";
  const axisColor = isDarkMode ? "#475569" : "#94a3b8";
  const axisTextColor = isDarkMode ? "#64748b" : "#64748b";

  return (
    <div className="w-full h-full flex flex-col relative">
      <style>{`
        @keyframes dash-flow {
          from { stroke-dashoffset: 0; }
          to { stroke-dashoffset: 32; }
        }
        .prediction-line path {
           stroke-dasharray: 8 8;
           animation: dash-flow 1s linear infinite;
        }
      `}</style>
      <defs>
        <linearGradient id="colorUp" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
        </linearGradient>
        <linearGradient id="colorDown" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
          <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
        </linearGradient>
        
        {/* Prediction Gradient - Enhanced for subtle distinction */}
        <linearGradient id="prediction-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor={PREDICTION_COLOR} stopOpacity={0.35} />
          <stop offset="95%" stopColor={PREDICTION_COLOR} stopOpacity={0.05} />
        </linearGradient>
        
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur">
             <animate attributeName="stdDeviation" values="2;5;2" dur="3s" repeatCount="indefinite" />
          </feGaussianBlur>
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Quick Trade Panel Overlay */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-4 bg-white/90 dark:bg-[#1a1f2e]/90 backdrop-blur-md p-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl transition-opacity animate-in fade-in slide-in-from-top-4 duration-500">
         <div className="hidden sm:flex items-center gap-3 px-3 border-r border-slate-200 dark:border-slate-700 pr-4">
             <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{symbol}</span>
                <div className="flex items-center gap-1.5">
                   {isPriceUp ? <TrendingUp size={14} className="text-emerald-500" /> : <TrendingDown size={14} className="text-rose-500" />}
                   <span className={`font-mono text-sm font-bold ${isPriceUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                      ${currentPrice.toFixed(2)}
                   </span>
                </div>
             </div>
         </div>
         <div className="flex gap-2">
            <button 
              onClick={(e) => { e.stopPropagation(); console.log('Buy Action', symbol, currentPrice); }}
              className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-all shadow-lg shadow-emerald-500/20 active:scale-95 transform hover:-translate-y-0.5 flex items-center gap-1"
            >
               <DollarSign size={12} strokeWidth={3} /> Buy
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); console.log('Sell Action', symbol, currentPrice); }}
              className="px-5 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-lg transition-all shadow-lg shadow-rose-500/20 active:scale-95 transform hover:-translate-y-0.5"
            >
               Sell
            </button>
         </div>
      </div>

      {/* Main Chart */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart 
            data={data} 
            margin={{ top: 20, right: 0, left: 0, bottom: 0 }}
            syncId="market-sync"
          >
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} opacity={0.4} />
            
            {/* Highlight Prediction Zone */}
            {predictionStartTime && predictionEndTime && (
               <ReferenceArea 
                 x1={predictionStartTime} 
                 x2={predictionEndTime} 
                 {...({
                   fill: PREDICTION_COLOR,
                   fillOpacity: 0.08,
                   strokeOpacity: 0,
                 } as any)}
               />
            )}

            <XAxis 
              dataKey="time" 
              tickFormatter={formatDate} 
              stroke={axisColor} 
              tick={{ fontSize: 11, fill: axisTextColor }} 
              axisLine={false}
              tickLine={false}
              minTickGap={60}
              dy={10}
              hide={indicators.rsi || indicators.macd}
            />
            <YAxis 
              domain={['auto', 'auto']} 
              orientation="right" 
              stroke={axisColor} 
              tick={{ fontSize: 11, fill: axisTextColor, fontFamily: 'JetBrains Mono' }} 
              tickFormatter={(val) => val.toFixed(2)}
              axisLine={false}
              tickLine={false}
              dx={5}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: axisColor, strokeWidth: 1, strokeDasharray: '4 4' }} />
            
            {/* Historical Data Area */}
            <Area 
              type="monotone" 
              dataKey="close" 
              data={historicalData}
              stroke={strokeColor} 
              fill={fillColor} 
              strokeWidth={2}
              isAnimationActive={false}
              connectNulls
            />

            {/* Comparisons */}
            {comparisons.map((compSymbol, idx) => (
              <Line
                key={compSymbol}
                type="monotone"
                dataKey={compSymbol}
                stroke={COMPARISON_COLORS[idx % COMPARISON_COLORS.length]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
                isAnimationActive={true}
                connectNulls
              />
            ))}

            {/* Moving Averages */}
            {indicators.ma && (
              <>
                <Line type="monotone" dataKey="ma7" stroke="#f97316" strokeWidth={1} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="ma25" stroke="#3b82f6" strokeWidth={1} dot={false} isAnimationActive={false} />
              </>
            )}

            {/* Prediction Overlay Line */}
            <Line 
              type="monotone"
              dataKey="close"
              data={predictionDisplayData}
              stroke={PREDICTION_COLOR}
              strokeWidth={PREDICTION_STROKE_WIDTH}
              strokeDasharray="8 8"
              className="prediction-line"
              dot={(props: any) => {
                 const { cx, cy, index } = props;
                 // Only render dot for the last point of prediction (target)
                 if (index === predictionDisplayData.length - 1) {
                   return (
                     <g key={`dot-${index}`}>
                       <circle cx={cx} cy={cy} r={5} fill={PREDICTION_COLOR} stroke="#fff" strokeWidth={2} />
                       <circle cx={cx} cy={cy} r={12} fill={PREDICTION_COLOR} opacity={0.3}>
                         <animate attributeName="r" from="5" to="14" dur="1s" begin="0s" repeatCount="indefinite" />
                         <animate attributeName="opacity" from="0.6" to="0" dur="1s" begin="0s" repeatCount="indefinite" />
                       </circle>
                       <text x={cx} y={cy - 18} textAnchor="middle" fill={PREDICTION_COLOR} fontSize={10} fontWeight="bold" fontFamily="JetBrains Mono" style={{textShadow: '0 2px 4px rgba(0,0,0,0.5)'}}>
                         TARGET {predictionConfidence ? `${predictionConfidence}%` : ''}
                       </text>
                     </g>
                   );
                 }
                 return <circle key={`dot-${index}`} cx={cx} cy={cy} r={0} />;
              }}
              activeDot={{ r: 6, fill: PREDICTION_COLOR, stroke: "#fff", strokeWidth: 2 }}
              isAnimationActive={true}
              animationDuration={1500}
              filter="url(#glow)"
            />
            
            {/* Prediction Overlay Area */}
            {predictionData.length > 0 && (
               <Area
                  type="monotone"
                  dataKey="close"
                  data={predictionDisplayData}
                  stroke="none"
                  fill="url(#prediction-gradient)"
                  isAnimationActive={true}
                  animationDuration={1500}
               />
            )}

            {/* Visual Divider between History and Prediction */}
            {predictionData.length > 0 && lastHistorical && (
               <ReferenceLine 
                 x={lastHistorical.time} 
                 stroke={PREDICTION_COLOR} 
                 strokeDasharray="3 3" 
                 strokeOpacity={0.6} 
                 label={{ 
                    value: "AI FORECAST", 
                    fill: PREDICTION_COLOR, 
                    fontSize: 10, 
                    fontWeight: 'bold',
                    position: 'insideTopLeft' 
                 }} 
               />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* RSI Indicator Chart */}
      {indicators.rsi && (
        <div className="h-[100px] border-t border-border">
          <ResponsiveContainer width="100%" height="100%">
             <ComposedChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 0 }} syncId="market-sync">
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} opacity={0.3} />
                <XAxis dataKey="time" hide />
                <YAxis 
                   domain={[0, 100]} 
                   orientation="right" 
                   stroke={axisColor} 
                   tick={{ fontSize: 9, fill: axisTextColor }} 
                   axisLine={false}
                   tickLine={false}
                   ticks={[30, 70]}
                   width={40}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: axisColor, strokeWidth: 1, strokeDasharray: '4 4' }} />
                <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" opacity={0.5} />
                <ReferenceLine y={30} stroke="#10b981" strokeDasharray="3 3" opacity={0.5} />
                <Line type="monotone" dataKey="rsi" stroke="#a855f7" strokeWidth={1.5} dot={false} isAnimationActive={false} />
             </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* MACD Indicator Chart */}
      {indicators.macd && (
        <div className="h-[100px] border-t border-border">
          <ResponsiveContainer width="100%" height="100%">
             <ComposedChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 0 }} syncId="market-sync">
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} opacity={0.3} />
                {!indicators.rsi && (
                   <XAxis 
                     dataKey="time" 
                     tickFormatter={formatDate} 
                     stroke={axisColor} 
                     tick={{ fontSize: 11, fill: axisTextColor }} 
                     axisLine={false}
                     tickLine={false}
                     minTickGap={60}
                     dy={5}
                     height={20}
                   />
                )}
                {indicators.rsi && <XAxis dataKey="time" hide />}
                <YAxis 
                   orientation="right" 
                   stroke={axisColor} 
                   tick={{ fontSize: 9, fill: axisTextColor }} 
                   axisLine={false}
                   tickLine={false}
                   width={40}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: axisColor, strokeWidth: 1, strokeDasharray: '4 4' }} />
                <ReferenceLine y={0} stroke={axisColor} strokeOpacity={0.2} />
                <Bar dataKey="macdHist" fill="#94a3b8">
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={(entry.macdHist || 0) > 0 ? '#10b981' : '#ef4444'} opacity={0.5} />
                  ))}
                </Bar>
                <Line type="monotone" dataKey="macd" stroke={isDarkMode ? "#fff" : "#334155"} strokeWidth={1} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="macdSignal" stroke="#f97316" strokeWidth={1} dot={false} isAnimationActive={false} />
             </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default MarketChart;