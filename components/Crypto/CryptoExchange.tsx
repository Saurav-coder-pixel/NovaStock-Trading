import React, { useState, useEffect, useRef } from 'react';
import { Bot, PanelRightClose, PanelRightOpen, ArrowUpRight } from 'lucide-react';
import { CryptoCoin, Candle, TimeFrame } from '../../types';
import { subscribeToCryptoUpdates, fetchCryptoHistory, subscribeToOrderBook } from '../../services/cryptoService';
import { getAnthropicAnalysis, AIAnalysisResult } from '../../services/anthropicService';

import TerminalLayout from '../Layout/TerminalLayout';
import TickerTape, { TickerItem } from '../Terminal/TickerTape';
import AssetList, { AssetItem } from '../Terminal/AssetList';
import LightweightChart from '../Terminal/LightweightChart';
import PerformanceChart from '../Terminal/PerformanceChart';
import OrderBook, { OrderLevel } from '../Terminal/OrderBook';
import OrderPanel from '../Terminal/OrderPanel';
import AIPanel from '../Terminal/AIPanel';

interface CryptoExchangeProps {
  isDarkMode: boolean; // Retained to avoid prop breaking from App.tsx but unused since terminal is strictly dark
}

const CryptoExchange: React.FC<CryptoExchangeProps> = () => {
  const [cryptos, setCryptos] = useState<CryptoCoin[]>([]);
  const [selectedCoin, setSelectedCoin] = useState<CryptoCoin | null>(null);
  const [history, setHistory] = useState<Candle[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [timeframe, setTimeframe] = useState<string>('1D');
  
  const cryptosRef = useRef<CryptoCoin[]>([]);
  useEffect(() => { cryptosRef.current = cryptos; }, [cryptos]);
  
  // Order Book State
  const [orderBook, setOrderBook] = useState<{bids: OrderLevel[], asks: OrderLevel[]}>({ bids: [], asks: [] });
  
  // AI State
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // 1. Live Prices Subscription
  useEffect(() => {
    const unsubscribe = subscribeToCryptoUpdates((data) => {
      setCryptos(data);
      if (!selectedCoin && data.length > 0) {
        setSelectedCoin(data.find(d => d.symbol === 'BTC') || data[0]);
      } else if (selectedCoin) {
        const updated = data.find(c => c.id === selectedCoin.id);
        if (updated) setSelectedCoin(updated);
      }
    });
    return () => unsubscribe();
  }, [selectedCoin]);

  // 2. Main Selected Coin Side Effects (History + OrderBook Reset)
  useEffect(() => {
    if (!selectedCoin) return;
    
    // Fetch history based on selected timeframe
    fetchCryptoHistory(selectedCoin.id, timeframe).then(data => {
      setHistory(data);
    });

    // Subscribe to Order Book
    const unsusbscribeDepth = subscribeToOrderBook(selectedCoin.symbol, (depth) => {
       setOrderBook(depth);
    });

    return () => {
       unsusbscribeDepth();
    };
  }, [selectedCoin?.id, timeframe]);

  // Generators for Props
  const tickerItems: TickerItem[] = cryptos.map(c => ({
     symbol: c.symbol,
     price: c.price,
     change: c.change24h
  }));

  const assetItems: AssetItem[] = cryptos.map(c => ({
     id: c.id,
     symbol: c.symbol,
     name: c.name,
     price: c.price,
     changePercent: c.change24h,
     volume: (c.volume24h / 1000000).toFixed(1) + 'M',
     sparkline: c.sparkline || []
  }));

  const [performanceData, setPerformanceData] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    const loadSession = async () => {
       try {
         const [btc, eth, sol] = await Promise.all([
           fetchCryptoHistory('bitcoin', '1H'),
           fetchCryptoHistory('ethereum', '1H'),
           fetchCryptoHistory('solana', '1H')
         ]);
         if (!mounted) return;
         
         const merged: any[] = [];
         const limit = 24;
         const btcSlice = btc.slice(-limit);
         const ethSlice = eth.slice(-limit);
         const solSlice = sol.slice(-limit);

         if (btcSlice.length > 0) {
            const baseBtc = btcSlice[0].close;
            const baseEth = ethSlice[0]?.close || baseBtc; 
            const baseSol = solSlice[0]?.close || baseBtc;

            for (let i = 0; i < btcSlice.length; i++) {
               merged.push({
                 time: btcSlice[i].time,
                 'BTC': ((btcSlice[i].close - baseBtc) / baseBtc) * 100,
                 'ETH': ethSlice[i] ? ((ethSlice[i].close - baseEth) / baseEth) * 100 : 0,
                 'SOL': solSlice[i] ? ((solSlice[i].close - baseSol) / baseSol) * 100 : 0,
                 _baseBtc: baseBtc,
                 _baseEth: baseEth,
                 _baseSol: baseSol
               });
            }
            setPerformanceData(merged);
         }
       } catch (error) {
          console.error("Failed to load perf history");
       }
    };
    loadSession();

    const interval = setInterval(() => {
       setPerformanceData(prev => {
          if (prev.length === 0) return prev;
          
          const currentBtc = cryptosRef.current.find(c => c.symbol === 'BTC')?.price;
          const currentEth = cryptosRef.current.find(c => c.symbol === 'ETH')?.price;
          const currentSol = cryptosRef.current.find(c => c.symbol === 'SOL')?.price;
          
          if (!currentBtc || !currentEth || !currentSol) return prev;
          
          const lastPoint = prev[prev.length - 1];
          
          const newPoint = {
             time: new Date().toISOString(),
             'BTC': ((currentBtc - lastPoint._baseBtc) / lastPoint._baseBtc) * 100,
             'ETH': ((currentEth - lastPoint._baseEth) / lastPoint._baseEth) * 100,
             'SOL': ((currentSol - lastPoint._baseSol) / lastPoint._baseSol) * 100,
             _baseBtc: lastPoint._baseBtc,
             _baseEth: lastPoint._baseEth,
             _baseSol: lastPoint._baseSol
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
     if (!selectedCoin || history.length === 0) return;
     setIsAiLoading(true);

     const closes = history.map(h => h.close);
     const volumes = history.map(h => h.volume);
     
     // Approx MAs
     const ma7 = closes.slice(-7).reduce((a,b)=>a+b,0)/7 || selectedCoin.price;
     const ma30 = closes.reduce((a,b)=>a+b,0)/closes.length || selectedCoin.price;
     const momentum = closes[closes.length-1] > closes[closes.length-2] ? 12.5 : -4.2; // mock

     const result = await getAnthropicAnalysis(
        selectedCoin.name,
        selectedCoin.symbol,
        selectedCoin.price,
        selectedCoin.change24h,
        ma7,
        ma30,
        momentum,
        closes,
        volumes
     );
     
     setAiAnalysis(result);
     setIsAiLoading(false);
  };

  return (
    <TerminalLayout 
      tickerText={<TickerTape items={tickerItems} />}
      headerControls={
        <div className="flex items-center gap-3 w-full">
           <ArrowUpRight className="text-primary w-5 h-5" />
           <span className="font-bold text-slate-100 uppercase tracking-widest text-sm">Alta MI</span>
           <span className="text-slate-500 mx-2">|</span>
           <span className="font-mono text-xs text-slate-400">DeepSeek still leading! AI x Crypto</span>
        </div>
      }
      leftPanel={
        <AssetList 
          assets={assetItems} 
          selectedId={selectedCoin?.id || null} 
          onSelect={(id) => {
             const coin = cryptos.find(c => c.id === id);
             if (coin) setSelectedCoin(coin);
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
               assets={['BTC', 'ETH', 'SOL']} 
               colors={['#0ea5e9', '#ec4899', '#f59e0b']} 
             />
          </div>
          <div className="flex-1 min-h-0 bg-[#0A0B0E] flex flex-col border-t border-[#1E293B]">
             <div className="flex bg-[#0A0B0E] p-2 gap-2 border-b border-[#1E293B] items-center">
                <span className="text-slate-400 text-xs font-bold px-2">{selectedCoin?.symbol || '...'}</span>
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
               {selectedCoin && history.length > 0 && (
                  <LightweightChart data={history} symbol={selectedCoin.symbol} />
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
               bids={orderBook.bids || []} 
               asks={orderBook.asks || []} 
               currentPrice={selectedCoin?.price || 0} 
             />
           </div>
           <div className="flex-[0.4] shrink-0">
             <OrderPanel symbol={selectedCoin?.symbol || ''} currentPrice={selectedCoin?.price || 0} />
           </div>
        </div>
      }
    />
  );
};

export default CryptoExchange;
