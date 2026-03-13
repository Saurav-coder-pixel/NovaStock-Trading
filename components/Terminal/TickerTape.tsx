import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export interface TickerItem {
  symbol: string;
  price: number;
  change: number;
}

interface TickerTapeProps {
  items: TickerItem[];
}

const TickerTape: React.FC<TickerTapeProps> = ({ items }) => {
  if (!items || items.length === 0) return <div>Loading ticker...</div>;

  // Duplicate items to ensure smooth infinite scrolling
  const displayItems = [...items, ...items, ...items];

  return (
    <div className="flex items-center gap-8 whitespace-nowrap">
      {displayItems.map((item, idx) => {
        const isUp = item.change >= 0;
        return (
          <div key={`${item.symbol}-${idx}`} className="flex items-center gap-2">
            <span className="font-bold text-slate-300">{item.symbol}</span>
            <span className="font-mono text-slate-100">${item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</span>
            <span className={`flex items-center text-[10px] font-bold ${isUp ? 'text-success' : 'text-danger'}`}>
              {isUp ? <TrendingUp size={10} className="mr-0.5" /> : <TrendingDown size={10} className="mr-0.5" />}
              {Math.abs(item.change).toFixed(2)}%
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default TickerTape;
