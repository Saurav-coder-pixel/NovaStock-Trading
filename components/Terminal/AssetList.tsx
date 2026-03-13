import React from 'react';
import { Search } from 'lucide-react';

export interface AssetItem {
  id: string;
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  volume: string; // pre-formatted (e.g., "1.2M")
  sparkline: number[];
}

interface AssetListProps {
  assets: AssetItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const AssetList: React.FC<AssetListProps> = ({
  assets,
  selectedId,
  onSelect,
  searchQuery,
  onSearchChange
}) => {
  const filteredAssets = assets.filter(a => 
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    a.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-[#111318]">
      {/* Search Bar */}
      <div className="p-3 border-b border-[#1E293B]">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 w-3.5 h-3.5" />
          <input 
            type="text" 
            placeholder="Search assets..." 
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-[#0A0B0E] border border-[#1E293B] rounded pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all font-sans"
          />
        </div>
      </div>

      {/* Asset List Header */}
      <div className="flex items-center justify-between px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-[#1E293B] shadow-sm z-10">
        <div className="w-1/3 text-left">Asset</div>
        <div className="w-1/3 text-right">Price</div>
        <div className="w-1/3 text-right">24h %</div>
      </div>

      {/* List Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {filteredAssets.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-xs">No assets found</div>
        ) : (
          <div className="flex flex-col">
            {filteredAssets.map(asset => {
              const isSelected = selectedId === asset.id;
              const isUp = asset.changePercent >= 0;
              const colorClass = isUp ? 'text-success' : 'text-danger';

              // Prepare SVG Sparkline
              const points = asset.sparkline && asset.sparkline.length > 0 
                ? asset.sparkline.map((price, i) => {
                    const min = Math.min(...asset.sparkline);
                    const max = Math.max(...asset.sparkline) || 1;
                    const x = (i / (asset.sparkline.length - 1)) * 30;
                    const y = 16 - ((price - min) / (max - min)) * 16;
                    return `${x},${y}`;
                  }).join(' ')
                : '';

              return (
                <button
                  key={asset.id}
                  onClick={() => onSelect(asset.id)}
                  className={`w-full text-left px-3 py-2 border-b border-[#1E293B]/50 hover:bg-[#1E293B]/30 transition-colors flex items-center justify-between group ${
                    isSelected ? 'bg-[#1E293B]/50 border-l-2 border-l-success' : 'border-l-2 border-l-transparent'
                  }`}
                >
                  {/* Left: Info */}
                  <div className="w-1/3 flex flex-col justify-center">
                    <span className="font-bold text-slate-200 text-xs truncate max-w-[80px]">{asset.symbol}</span>
                    <span className="text-[10px] text-slate-500 font-medium">{asset.volume}</span>
                  </div>

                  {/* Center: Sparkline & Price */}
                  <div className="w-1/3 flex flex-col items-end justify-center">
                    <span className={`font-mono text-xs font-semibold ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                      {asset.price.toLocaleString(undefined, { maximumSignificantDigits: 6 })}
                    </span>
                  </div>

                  {/* Right: Change & Sparkline */}
                  <div className="w-1/3 flex items-center justify-end gap-2">
                    {points && (
                      <svg width="30" height="16" className="opacity-70 group-hover:opacity-100 transition-opacity">
                        <polyline 
                          points={points} 
                          fill="none" 
                          stroke={isUp ? '#00D084' : '#FF3B5C'}
                          strokeWidth="1.5"
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                        />
                      </svg>
                    )}
                    <div className={`p-1 rounded font-mono text-[10px] font-bold min-w-[45px] text-right ${
                        isUp ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
                      }`}
                    >
                      {isUp ? '+' : ''}{asset.changePercent.toFixed(2)}%
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

export default AssetList;
