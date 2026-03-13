import React, { useState, useEffect } from 'react';
import { Bot, RefreshCw, AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { CryptoCoin, Candle } from '../../types';
import { getCryptoGeminiAnalysis } from '../../services/cryptoAiService';

interface CryptoAIProps {
  currentCoin: CryptoCoin;
  history: Candle[];
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
}

const CryptoAI: React.FC<CryptoAIProps> = ({ currentCoin, history, isOpen, onClose, isDarkMode }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    // Reset analysis when coin changes, requiring user to trigger it
    setAnalysis(null);
  }, [currentCoin.symbol]);

  const fetchAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const response = await getCryptoGeminiAnalysis(currentCoin, history);
      setAnalysis(response);
    } catch (error) {
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`w-80 lg:w-96 flex-shrink-0 border-l border-border bg-surface flex flex-col h-[calc(100vh-theme(spacing.24))] lg:h-[calc(100vh-theme(spacing.20))] transition-all duration-300 absolute right-0 top-0 bottom-0 z-20 lg:relative ${isDarkMode ? 'dark' : ''}`}>
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between bg-surface sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Bot className="text-white w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Nova Crypto AI
              <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 text-[10px] uppercase tracking-wider font-bold border border-indigo-200 dark:border-indigo-500/30">Beta</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Analysis for {currentCoin.symbol}</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="lg:hidden p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50/50 dark:bg-[#0B1120]">
        <div className="space-y-4">
          
          <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
               <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                 <TrendingUp className="w-4 h-4 text-indigo-500" />
                 Market context
               </h3>
               <button 
                 onClick={fetchAnalysis}
                 disabled={isAnalyzing || history.length === 0}
                 className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 <RefreshCw className={`w-3 h-3 ${isAnalyzing ? 'animate-spin' : ''}`} />
                 {isAnalyzing ? 'Analyzing...' : 'Refresh'}
               </button>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mb-1">Current Price</p>
                <p className="font-mono font-bold text-slate-900 dark:text-white">${currentCoin.price.toLocaleString(undefined, { maximumFractionDigits: 6 })}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mb-1">24h Change</p>
                <div className={`flex items-center gap-1 font-mono font-bold ${currentCoin.change24h >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                   {currentCoin.change24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                   {Math.abs(currentCoin.change24h).toFixed(2)}%
                </div>
              </div>
            </div>

            {!analysis && !isAnalyzing && (
              <div className="flex flex-col items-center justify-center py-6 px-4 text-center border-t border-dashed border-slate-200 dark:border-slate-700 mt-2">
                <Bot className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-sm text-slate-500 dark:text-slate-400">Click refresh to generate AI analysis for {currentCoin.name}.</p>
              </div>
            )}

            {isAnalyzing && (
              <div className="py-6 flex flex-col items-center justify-center gap-3 border-t border-dashed border-slate-200 dark:border-slate-700 mt-2">
                <div className="relative w-10 h-10">
                  <div className="absolute inset-0 rounded-full border-2 border-indigo-100 dark:border-indigo-900"></div>
                  <div className="absolute inset-0 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
                  <Bot className="absolute inset-0 m-auto w-4 h-4 text-indigo-500 animate-pulse" />
                </div>
                <div className="text-xs text-slate-500 font-medium animate-pulse">Analyzing 30-day patterns...</div>
              </div>
            )}

            {analysis && !isAnalyzing && (
               <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/50 prose prose-sm dark:prose-invert prose-p:text-slate-600 dark:prose-p:text-slate-300 prose-headings:text-slate-800 dark:prose-headings:text-slate-200 prose-li:text-slate-600 dark:prose-li:text-slate-300 max-w-none text-sm leading-relaxed">
                 <div dangerouslySetInnerHTML={{ __html: analysis.replace(/\n/g, '<br/>') }} />
               </div>
            )}
            
          </div>

          <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200/50 dark:border-amber-500/20 rounded-xl p-3 flex gap-3 shadow-sm">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 dark:text-amber-200/70 leading-relaxed font-medium">
              This is AI-generated analysis, not financial advice. Crypto markets are highly volatile.
            </p>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default CryptoAI;
