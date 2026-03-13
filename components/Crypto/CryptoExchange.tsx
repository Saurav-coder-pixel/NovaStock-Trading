import React, { useState, useEffect } from 'react';
import { Bot, PanelRightClose, PanelRightOpen, ArrowUpRight } from 'lucide-react';
import { CryptoCoin, Candle, TimeFrame } from '../../types';
import { subscribeToCryptoUpdates, fetchCryptoHistory } from '../../services/cryptoService';
import CryptoList from './CryptoList';
import CryptoChart from './CryptoChart';
import CryptoAI from './CryptoAI';

interface CryptoExchangeProps {
  isDarkMode: boolean;
}

const CryptoExchange: React.FC<CryptoExchangeProps> = ({ isDarkMode }) => {
  const [cryptos, setCryptos] = useState<CryptoCoin[]>([]);
  const [selectedCoin, setSelectedCoin] = useState<CryptoCoin | null>(null);
  const [history, setHistory] = useState<Candle[]>([]);
  const [timeframe, setTimeframe] = useState<TimeFrame>(TimeFrame.M1);
  const [isChartLoading, setIsChartLoading] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [watchlistIds, setWatchlistIds] = useState<string[]>(['bitcoin', 'ethereum', 'solana']);
  
  const [isAiOpen, setIsAiOpen] = useState(false);

  // Subscribe to live data
  useEffect(() => {
    const unsubscribe = subscribeToCryptoUpdates((data) => {
      setCryptos(data);
      // Initialize selected coin if none selected
      if (!selectedCoin && data.length > 0) {
        setSelectedCoin(data[0]);
      } else if (selectedCoin) {
        // Update selected coin with fresh data
        const updated = data.find(c => c.id === selectedCoin.id);
        if (updated) setSelectedCoin(updated);
      }
    });
    
    return () => unsubscribe();
  }, [selectedCoin]);

  // Fetch chart history when coin or timeframe changes
  useEffect(() => {
    if (!selectedCoin) return;
    
    let days = 30;
    if (timeframe === TimeFrame.D1) days = 1;
    else if (timeframe === TimeFrame.W1) days = 7;
    else if (timeframe === TimeFrame.M1) days = 30;
    else if (timeframe === TimeFrame.M3) days = 90;
    else if (timeframe === TimeFrame.Y1) days = 365;

    setIsChartLoading(true);
    fetchCryptoHistory(selectedCoin.id, days).then(data => {
      setHistory(data);
      setIsChartLoading(false);
    });
  }, [selectedCoin?.id, timeframe]);

  const toggleWatchlist = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setWatchlistIds(prev => 
      prev.includes(id) ? prev.filter(wid => wid !== id) : [...prev, id]
    );
  };

  return (
    <div className="h-full flex flex-col pt-2 max-w-[1600px] mx-auto overflow-hidden">
      
      {/* Header Area */}
      <div className="flex flex-col md:flex-row items-baseline md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
             <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
               <ArrowUpRight className="text-white w-5 h-5" />
             </div>
             Nova Crypto Exchange
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 ml-13">
            Real-time cryptocurrency markets and AI-powered analysis
          </p>
        </div>

        {selectedCoin && (
          <button
            onClick={() => setIsAiOpen(!isAiOpen)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm border ${
              isAiOpen 
                ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30' 
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:shadow-md'
            }`}
          >
            <div className={`w-6 h-6 rounded-md flex items-center justify-center ${isAiOpen ? 'bg-indigo-600 text-white' : 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400'}`}>
               <Bot className="w-3.5 h-3.5" />
            </div>
            <span>Crypto Auto-Pilot AI</span>
            {isAiOpen ? <PanelRightOpen className="w-4 h-4 ml-1 opacity-70" /> : <PanelRightClose className="w-4 h-4 ml-1 opacity-70" />}
          </button>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="flex-1 flex gap-6 overflow-hidden relative">
        <div className={`flex-1 flex flex-col gap-6 overflow-hidden transition-all duration-300`}>
           
           {/* Top Row: Chart */}
           {selectedCoin && (
             <div className="flex-[0.45] min-h-[350px]">
               {isChartLoading && history.length === 0 ? (
                 <div className="w-full h-full bg-white dark:bg-surface border border-slate-200 dark:border-border rounded-xl shadow-sm flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                 </div>
               ) : (
                 <CryptoChart 
                   data={history} 
                   timeframe={timeframe} 
                   onTimeframeChange={setTimeframe}
                   isDarkMode={isDarkMode}
                 />
               )}
             </div>
           )}

           {/* Bottom Row: List */}
           <div className="flex-[0.55] overflow-hidden min-h-[300px]">
              <CryptoList 
                cryptos={cryptos}
                selectedCoin={selectedCoin}
                onSelectCoin={setSelectedCoin}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                watchlistIds={watchlistIds}
                onToggleWatchlist={toggleWatchlist}
              />
           </div>
        </div>

        {/* AI Sidebar */}
        {selectedCoin && (
          <CryptoAI 
            currentCoin={selectedCoin}
            history={history}
            isOpen={isAiOpen}
            onClose={() => setIsAiOpen(false)}
            isDarkMode={isDarkMode}
          />
        )}
      </div>
    </div>
  );
};

export default CryptoExchange;
