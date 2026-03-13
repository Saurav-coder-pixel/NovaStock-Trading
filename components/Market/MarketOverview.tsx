import React, { useEffect, useState, useMemo, useRef } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { WATCHLIST, fetchStockHistory } from '../../services/stockService';
import { getAnthropicAnalysis, AIAnalysisResult } from '../../services/anthropicService';
import { Stock, Candle } from '../../types';

import TerminalLayout from '../Layout/TerminalLayout';
import TickerTape, { TickerItem } from '../Terminal/TickerTape';
import AssetList, { AssetItem } from '../Terminal/AssetList';
import LightweightChart from '../Terminal/LightweightChart';
import PerformanceChart from '../Terminal/PerformanceChart';
import OrderBook, { OrderLevel } from '../Terminal/OrderBook';
import OrderPanel from '../Terminal/OrderPanel';
import AIPanel from '../Terminal/AIPanel';

interface MarketOverviewProps {
  currentStock: Stock;
  isChatOpen: boolean; 
  onToggleChat: () => void; 
  isDarkMode?: boolean;
  onSelectStock?: (stock: Stock) => void;
}

const MarketOverview: React.FC<MarketOverviewProps> = ({ currentStock, isDarkMode = true, onSelectStock }) => {
  const [history, setHistory] = useState<Candle[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [timeframe, setTimeframe] = useState<string>('1D');
  
  // AI State
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Initialize Data when stock or timeframe changes
  useEffect(() => {
    fetchStockHistory(currentStock.symbol, timeframe).then(data => {
      setHistory(data);
      if (timeframe === '1D') {
         setAiAnalysis(null); // only reset AI organically if viewing 1D
      }
    });
  }, [currentStock.symbol, timeframe]);

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
      
      return [...realHistory.slice(0, -1), newCandle];
    });
  }, [currentStock.price]);

  // Derived Props for Terminal
  const tickerItems: TickerItem[] = WATCHLIST.map(s => ({
     symbol: s.symbol,
     price: s.price,
     change: s.change
  }));

  const assetItems: AssetItem[] = WATCHLIST.map(s => {
     // Generate synthetic sparkline
     const syntheticSparkline = Array.from({length: 20}, (_, i) => 
        s.price * (1 + (Math.sin(i) * 0.02) + (Math.random() * 0.01 - 0.005))
     );
     
     return {
       id: s.symbol,
       symbol: s.symbol,
       name: s.name,
       price: s.price,
       changePercent: s.change,
       volume: (s.volume / 1000000).toFixed(1) + 'M',
       sparkline: syntheticSparkline
     };
  });

  const [performanceData, setPerformanceData] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    const loadSession = async () => {
       try {
         const [aapl, nvda, tsla] = await Promise.all([
           fetchStockHistory('AAPL', '1H'),
           fetchStockHistory('NVDA', '1H'),
           fetchStockHistory('TSLA', '1H')
         ]);
         if (!mounted) return;
         
         const merged: any[] = [];
         const limit = 24;
         const aSlice = aapl.slice(-limit);
         const nSlice = nvda.slice(-limit);
         const tSlice = tsla.slice(-limit);

         if (aSlice.length > 0) {
            const baseA = aSlice[0].close;
            const baseN = nSlice[0]?.close || baseA;
            const baseT = tSlice[0]?.close || baseA;

            for (let i = 0; i < aSlice.length; i++) {
               merged.push({
                 time: aSlice[i].time,
                 'AAPL': ((aSlice[i].close - baseA) / baseA) * 100,
                 'NVDA': nSlice[i] ? ((nSlice[i].close - baseN) / baseN) * 100 : 0,
                 'TSLA': tSlice[i] ? ((tSlice[i].close - baseT) / baseT) * 100 : 0,
                 _baseA: baseA,
                 _baseN: baseN,
                 _baseT: baseT
               });
            }
         }
         setPerformanceData(merged);
       } catch (error) {
          console.error("Failed to load perf history");
       }
    };
    loadSession();

    const interval = setInterval(() => {
       setPerformanceData(prev => {
          if (prev.length === 0) return prev;
          
          const currentA = WATCHLIST.find(c => c.symbol === 'AAPL')?.price;
          const currentN = WATCHLIST.find(c => c.symbol === 'NVDA')?.price;
          const currentT = WATCHLIST.find(c => c.symbol === 'TSLA')?.price;
          
          if (!currentA || !currentN || !currentT) return prev;
          
          const lastPoint = prev[prev.length - 1];
          
          const newPoint = {
             time: new Date().toISOString(),
             'AAPL': ((currentA - lastPoint._baseA) / lastPoint._baseA) * 100,
             'NVDA': ((currentN - lastPoint._baseN) / lastPoint._baseN) * 100,
             'TSLA': ((currentT - lastPoint._baseT) / lastPoint._baseT) * 100,
             _baseA: lastPoint._baseA,
             _baseN: lastPoint._baseN,
             _baseT: lastPoint._baseT
          };
          
          return [...prev, newPoint];
       });
    }, 15000);

    return () => {
       mounted = false;
       clearInterval(interval);
    };
  }, []);

  const handleGenerateAI = async () => {
     if (history.length === 0) return;
     setIsAiLoading(true);

     const closes = history.map(h => h.close);
     const volumes = history.map(h => h.volume);
     
     const ma7 = closes.slice(-7).reduce((a,b)=>a+b,0)/7 || currentStock.price;
     const ma30 = closes.reduce((a,b)=>a+b,0)/closes.length || currentStock.price;
     const momentum = closes[closes.length-1] > closes[closes.length-2] ? 5.5 : -2.2; 

     const result = await getAnthropicAnalysis(
        currentStock.name,
        currentStock.symbol,
        currentStock.price,
        currentStock.change,
        ma7,
        ma30,
        momentum,
        closes,
        volumes
     );
     
     setAiAnalysis(result);
     setIsAiLoading(false);
  };

  // Generate mock order book based on current price
  const mockOrderBook = useMemo(() => {
      const price = currentStock.price;
      const spread = price * 0.0005;
      
      const asks: OrderLevel[] = Array.from({length: 15}).map((_, i) => [
          (price + spread + (i * price * 0.001)).toFixed(2),
          ((Math.random() * 50) + 10).toFixed(2)
      ]);
      const bids: OrderLevel[] = Array.from({length: 15}).map((_, i) => [
          (price - spread - (i * price * 0.001)).toFixed(2),
          ((Math.random() * 50) + 10).toFixed(2)
      ]);

      return { asks, bids };
  }, [currentStock.price]);

  return (
    <div className="h-[calc(100vh-2rem)] -m-4 md:-m-6 lg:-m-10">
      <TerminalLayout 
        tickerText={<TickerTape items={tickerItems} />}
        headerControls={
          <div className="flex items-center gap-3 w-full pl-4">
             <ArrowUpRight className="text-primary w-5 h-5" />
             <span className="font-bold text-slate-100 uppercase tracking-widest text-sm">Alta MI</span>
             <span className="text-slate-500 mx-2">|</span>
             <span className="font-mono text-xs text-slate-400">Equities & Options Desk</span>
          </div>
        }
        leftPanel={
          <AssetList 
            assets={assetItems} 
            selectedId={currentStock.symbol} 
            onSelect={(id) => {
               const stock = WATCHLIST.find(s => s.symbol === id);
               if (stock && onSelectStock) onSelectStock(stock);
            }}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        }
        mainChart={
          <>
            <div className="h-[200px] shrink-0">
               <PerformanceChart 
                 data={performanceData} 
                 assets={[currentStock.symbol, 'SPY', 'QQQ']} 
                 colors={['#0ea5e9', '#ec4899', '#f59e0b']} 
               />
            </div>
            <div className="flex-1 min-h-0 bg-[#0A0B0E] flex flex-col border-t border-[#1E293B]">
               <div className="flex bg-[#0A0B0E] p-2 gap-2 border-b border-[#1E293B] items-center">
                  <span className="text-slate-400 text-xs font-bold px-2">{currentStock.symbol}</span>
                  <div className="flex gap-1">
                     {['1m', '5m', '15m', '1H', '4H', '1D', '1W'].map(tf => (
                       <button 
                          key={tf}
                          onClick={() => setTimeframe(tf)}
                          className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${timeframe === tf ? 'bg-success/20 text-success border border-success/50' : 'text-slate-500 hover:text-slate-300 border border-transparent'}`}
                       >
                          {tf}
                       </button>
                     ))}
                  </div>
               </div>
               <div className="flex-1 min-h-0 relative">
                 {history.length > 0 && (
                    <LightweightChart data={history} symbol={currentStock.symbol} />
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
                 currentPrice={currentStock.price} 
               />
             </div>
             <div className="flex-[0.4] shrink-0">
               <OrderPanel symbol={currentStock.symbol} currentPrice={currentStock.price} />
             </div>
          </div>
        }
      />
    </div>
  );
};

export default MarketOverview;