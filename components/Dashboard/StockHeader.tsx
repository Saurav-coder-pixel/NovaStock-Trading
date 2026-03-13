import React from 'react';
import { Stock, TimeFrame } from '../../types';
import { ArrowUp, ArrowDown, Clock, Activity, Zap, Sparkles } from 'lucide-react';

interface StockHeaderProps {
  stock: Stock;
  timeframe: TimeFrame;
  setTimeframe: (tf: TimeFrame) => void;
  onRunPrediction: () => void;
  isPredicting: boolean;
  onToggleChat: () => void;
  isChatOpen: boolean;
}

const StockHeader: React.FC<StockHeaderProps> = ({ 
  stock, 
  timeframe, 
  setTimeframe, 
  onRunPrediction, 
  isPredicting,
  onToggleChat,
  isChatOpen
}) => {
  const isPositive = stock.change >= 0;

  return (
    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 lg:mb-8 gap-6">
      {/* Left: Stock Info */}
      <div className="w-full lg:w-auto">
        <div className="flex items-baseline gap-2 sm:gap-3 flex-wrap">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">{stock.symbol}</h1>
          <span className="text-base sm:text-lg text-slate-500 dark:text-slate-400 font-medium truncate max-w-[150px] sm:max-w-xs">{stock.name}</span>
          <span className="text-[10px] sm:text-xs font-mono text-slate-500 px-2 py-0.5 border border-slate-200 dark:border-slate-800 rounded bg-slate-100 dark:bg-slate-900/50">NYSE</span>
        </div>
        <div className="flex items-center gap-4 mt-2">
          <span className="text-4xl sm:text-5xl font-mono font-medium text-slate-900 dark:text-white tracking-tighter">${stock.price.toFixed(2)}</span>
          <div className={`flex flex-col ${isPositive ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
            <div className="flex items-center text-lg font-bold">
               {isPositive ? <ArrowUp size={20} strokeWidth={3} /> : <ArrowDown size={20} strokeWidth={3} />}
               {Math.abs(stock.change).toFixed(2)}
            </div>
            <div className="text-xs font-medium opacity-80">
              {isPositive ? '+' : ''}{Math.abs(stock.changePercent).toFixed(2)}% Today
            </div>
          </div>
        </div>
      </div>

      {/* Right: Controls */}
      <div className="w-full lg:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        {/* Timeframe Selector */}
        <div className="bg-surface p-1 rounded-xl border border-border shadow-sm flex overflow-x-auto justify-between sm:justify-start">
          {Object.values(TimeFrame).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                timeframe === tf 
                  ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
            <button 
                onClick={onToggleChat}
                className={`flex-1 sm:flex-none group relative flex items-center justify-center gap-2 px-5 py-2.5 text-white text-sm font-semibold rounded-xl shadow-lg transition-all overflow-hidden whitespace-nowrap ${
                    isChatOpen 
                    ? 'bg-slate-700' 
                    : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20'
                }`}
            >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                <Sparkles size={16} className={isChatOpen ? 'text-slate-300' : 'fill-current'} />
                <span className="relative">{isChatOpen ? 'Close Analyst' : 'Nova Analyst'}</span>
            </button>
        </div>
      </div>
    </div>
  );
};

export default StockHeader;