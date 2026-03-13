import React from 'react';
import { TrendingUp, TrendingDown, Search, Star } from 'lucide-react';
import { CryptoCoin } from '../../types';

interface CryptoListProps {
  cryptos: CryptoCoin[];
  selectedCoin: CryptoCoin | null;
  onSelectCoin: (coin: CryptoCoin) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  watchlistIds: string[];
  onToggleWatchlist: (id: string, e: React.MouseEvent) => void;
}

const CryptoList: React.FC<CryptoListProps> = ({ 
  cryptos, 
  selectedCoin, 
  onSelectCoin, 
  searchQuery, 
  onSearchChange,
  watchlistIds,
  onToggleWatchlist
}) => {
  const filteredCryptos = cryptos.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-white dark:bg-surface border border-slate-200 dark:border-border rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
      {/* Search Header */}
      <div className="p-4 border-b border-slate-200 dark:border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Search crypto. . ." 
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {filteredCryptos.length === 0 ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
            No cryptocurrencies found matching "{searchQuery}"
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
            {filteredCryptos.map(coin => {
              const isSelected = selectedCoin?.id === coin.id;
              const isWatchlisted = watchlistIds.includes(coin.id);
              
              return (
                <button
                  key={coin.id}
                  onClick={() => onSelectCoin(coin)}
                  className={`w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors flex items-center justify-between group ${
                    isSelected ? 'bg-indigo-50/50 dark:bg-indigo-500/10' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                      onClick={(e) => onToggleWatchlist(coin.id, e)}
                    >
                      <Star 
                        className={`w-4 h-4 ${isWatchlisted ? 'text-amber-500 fill-amber-500' : 'text-slate-300 dark:text-slate-600'}`} 
                      />
                    </div>
                    <img src={coin.image} alt={coin.name} className="w-8 h-8 rounded-full" />
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white text-sm">{coin.name}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">{coin.symbol}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    {/* Sparkline approximation using standard HTML limits given the data size */}
                    <div className="hidden md:block w-24 h-8 relative">
                       {coin.sparkline && coin.sparkline.length > 0 && (
                          <svg viewBox="0 0 100 30" className="w-full h-full preserve-3d" preserveAspectRatio="none">
                            <polyline 
                              points={coin.sparkline.map((price, i) => {
                                const min = Math.min(...coin.sparkline);
                                const max = Math.max(...coin.sparkline) || 1;
                                const x = (i / (coin.sparkline.length - 1)) * 100;
                                const y = 30 - ((price - min) / (max - min)) * 30;
                                return `${x},${y}`;
                              }).join(' ')}
                              fill="none"
                              stroke={coin.change24h >= 0 ? '#10b981' : '#f43f5e'}
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              vectorEffect="non-scaling-stroke"
                            />
                          </svg>
                       )}
                    </div>

                    <div className="text-right">
                      <div className="font-mono font-semibold text-slate-900 dark:text-white text-sm">
                        ${coin.price.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                      </div>
                      <div className={`text-xs font-bold flex items-center justify-end gap-1 ${coin.change24h >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                         {coin.change24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                         {Math.abs(coin.change24h).toFixed(2)}%
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CryptoList;
