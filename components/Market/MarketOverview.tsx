import React, { useEffect, useState, useMemo } from 'react';
import { Activity, BarChart3, TrendingUp, AlertCircle, Layers, Check, SlidersHorizontal } from 'lucide-react';
import StockHeader from '../Dashboard/StockHeader';
import MarketChart from '../Charts/MarketChart';
import IntegratedAI from './IntegratedAI';
import { generateHistory, WATCHLIST } from '../../services/stockService';
import { Stock, Candle, TimeFrame, PredictionResult } from '../../types';

interface MarketOverviewProps {
  currentStock: Stock;
  isChatOpen: boolean;
  onToggleChat: () => void;
  isDarkMode?: boolean;
}

const MarketOverview: React.FC<MarketOverviewProps> = ({ currentStock, isChatOpen, onToggleChat, isDarkMode = true }) => {
  const [timeframe, setTimeframe] = useState<TimeFrame>(TimeFrame.D1);
  const [history, setHistory] = useState<Candle[]>([]);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  
  // Comparison State
  const [selectedComparisons, setSelectedComparisons] = useState<string[]>([]);
  const [comparisonData, setComparisonData] = useState<Record<string, Candle[]>>({});
  const [isCompareMenuOpen, setIsCompareMenuOpen] = useState(false);

  // Indicator State
  const [indicators, setIndicators] = useState({
    ma: true,
    rsi: false,
    macd: false
  });

  // Initialize Data when stock or timeframe changes
  useEffect(() => {
    const data = generateHistory(currentStock.symbol, timeframe);
    setHistory(data);
    setPrediction(null);
    setSelectedComparisons([]); 
    setComparisonData({});
  }, [currentStock.symbol, timeframe]);

  // Fetch data for selected comparisons
  useEffect(() => {
    const newComparisonData: Record<string, Candle[]> = {};
    selectedComparisons.forEach(symbol => {
      newComparisonData[symbol] = generateHistory(symbol, timeframe);
    });
    setComparisonData(newComparisonData);
  }, [selectedComparisons, timeframe]);

  // Update history when currentStock price changes (live update simulation)
  useEffect(() => {
    setHistory(prev => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      
      const realHistory = prev.filter(c => !c.isPrediction);
      const lastReal = realHistory[realHistory.length - 1];
      
      if (!lastReal) return prev;

      const newCandle = { 
        ...lastReal, 
        close: currentStock.price, 
        high: Math.max(lastReal.high, currentStock.price), 
        low: Math.min(lastReal.low, currentStock.price) 
      };
      
      const predictions = prev.filter(c => c.isPrediction);
      return [...realHistory.slice(0, -1), newCandle, ...predictions];
    });
  }, [currentStock.price]);

  const handlePredictionUpdate = (result: PredictionResult | null) => {
    if (result) {
        setPrediction(result);
        if (result.predictedPath && result.predictedPath.length > 0) {
            const cleanHistory = history.filter(c => !c.isPrediction);
            const lastCandle = cleanHistory[cleanHistory.length - 1];
            const lastTime = new Date(lastCandle.time);
            
            // Determine time interval
            const prevCandle = cleanHistory[cleanHistory.length - 2];
            const intervalMs = prevCandle ? lastTime.getTime() - new Date(prevCandle.time).getTime() : 24 * 60 * 60 * 1000;

            const predictedCandles: Candle[] = result.predictedPath.map((price: number, index: number) => {
                const newTime = new Date(lastTime.getTime() + (intervalMs * (index + 1)));
                return {
                    time: newTime.toISOString(),
                    open: price, 
                    close: price,
                    high: price, 
                    low: price, 
                    volume: 0,
                    isPrediction: true
                };
            });
            
            setHistory(prev => [...prev.filter(c => !c.isPrediction), ...predictedCandles]);
        }
    } else {
        setPrediction(null);
    }
  };

  const toggleComparison = (symbol: string) => {
    setSelectedComparisons(prev => 
      prev.includes(symbol) 
        ? prev.filter(s => s !== symbol)
        : [...prev, symbol]
    );
  };

  const toggleIndicator = (key: keyof typeof indicators) => {
    setIndicators(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Merge Data for Chart
  const mergedChartData = useMemo(() => {
    return history.map((candle, index) => {
      const mergedPoint: any = { ...candle };
      selectedComparisons.forEach(symbol => {
        const compCandles = comparisonData[symbol];
        if (compCandles && compCandles[index]) {
          mergedPoint[symbol] = compCandles[index].close;
        }
      });
      return mergedPoint;
    });
  }, [history, comparisonData, selectedComparisons]);

  return (
    <div className="animate-fade-in pb-10">
      <StockHeader 
        stock={currentStock} 
        timeframe={timeframe} 
        setTimeframe={setTimeframe} 
        onRunPrediction={onToggleChat}
        isPredicting={false}
        onToggleChat={onToggleChat}
        isChatOpen={isChatOpen}
      />

      {/* Main Chart Card */}
      <div className="glass-panel rounded-2xl p-1 shadow-xl mb-6 lg:mb-8 relative group bg-surface">
          
          {/* Chart Controls Overlay */}
          <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
             {/* Indicator Toggles */}
             {!isChatOpen && (
                 <div className="flex bg-white/80 dark:bg-[#0B0E14]/80 backdrop-blur border border-border rounded-lg p-0.5 animate-in fade-in">
                    <button 
                      onClick={() => toggleIndicator('ma')}
                      className={`px-2 py-1 text-[10px] font-bold rounded transition-colors ${indicators.ma ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'}`}
                    >
                      MA
                    </button>
                    <button 
                      onClick={() => toggleIndicator('rsi')}
                      className={`px-2 py-1 text-[10px] font-bold rounded transition-colors ${indicators.rsi ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'}`}
                    >
                      RSI
                    </button>
                    <button 
                      onClick={() => toggleIndicator('macd')}
                      className={`px-2 py-1 text-[10px] font-bold rounded transition-colors ${indicators.macd ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'}`}
                    >
                      MACD
                    </button>
                 </div>
             )}

             {/* Compare Menu */}
             {!isChatOpen && (
                 <div className="relative animate-in fade-in">
                    <button 
                      onClick={() => setIsCompareMenuOpen(!isCompareMenuOpen)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                        selectedComparisons.length > 0
                          ? 'bg-indigo-600 text-white border-indigo-500' 
                          : 'bg-white/80 dark:bg-[#0B0E14]/80 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Layers size={14} />
                      <span>Compare {selectedComparisons.length > 0 && `(${selectedComparisons.length})`}</span>
                    </button>

                    {isCompareMenuOpen && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setIsCompareMenuOpen(false)}></div>
                        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#1a1f2e] border border-border rounded-xl shadow-xl z-20 py-1 animate-in fade-in zoom-in-95 duration-100">
                           <div className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-border">
                             Overlay Stock
                           </div>
                           {WATCHLIST.filter(s => s.symbol !== currentStock.symbol).map(stock => (
                             <button
                               key={stock.symbol}
                               onClick={() => toggleComparison(stock.symbol)}
                               className="w-full flex items-center justify-between px-3 py-2 text-sm text-left hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                             >
                               <span className="text-slate-700 dark:text-slate-200">{stock.symbol}</span>
                               {selectedComparisons.includes(stock.symbol) && (
                                 <Check size={14} className="text-indigo-500" />
                               )}
                             </button>
                           ))}
                        </div>
                      </>
                    )}
                 </div>
             )}
          </div>

          {/* Integrated AI Chat Panel */}
          <IntegratedAI 
            stock={currentStock}
            history={history}
            isOpen={isChatOpen}
            onClose={onToggleChat}
            onPredictionUpdate={handlePredictionUpdate}
            currentPrediction={prediction}
          />

          {/* Responsive Height Container */}
          <div className="h-[500px] w-full rounded-xl overflow-hidden bg-white/50 dark:bg-[#11141d]/50 flex flex-col">
            <MarketChart 
              data={mergedChartData} 
              symbol={currentStock.symbol} 
              isDarkMode={isDarkMode} 
              comparisons={selectedComparisons}
              indicators={indicators}
              predictionConfidence={prediction?.confidence}
              predictionRisk={prediction?.riskLevel}
            />
          </div>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          <StatCard label="Market Cap" value="2.42T" icon={<Activity size={18} className="text-indigo-500 dark:text-indigo-400" />} />
          <StatCard label="Volume (24h)" value="45.2M" icon={<BarChart3 size={18} className="text-emerald-500 dark:text-emerald-400" />} />
          <StatCard label="P/E Ratio" value="28.5" icon={<TrendingUp size={18} className="text-sky-500 dark:text-sky-400" />} />
          <StatCard label="Beta (5Y)" value="1.24" icon={<AlertCircle size={18} className="text-amber-500 dark:text-amber-400" />} />
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon }: { label: string, value: string, icon: React.ReactNode }) => (
    <div className="bg-surface p-4 lg:p-5 rounded-xl border border-border hover:border-slate-300 dark:hover:border-slate-700 transition-colors group shadow-sm">
        <div className="flex items-center justify-between mb-2">
            <span className="text-slate-500 text-[10px] lg:text-xs font-bold uppercase tracking-wider">{label}</span>
            <div className="opacity-50 group-hover:opacity-100 transition-opacity p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg">{icon}</div>
        </div>
        <div className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-white font-mono tracking-tight">{value}</div>
    </div>
);

export default MarketOverview;