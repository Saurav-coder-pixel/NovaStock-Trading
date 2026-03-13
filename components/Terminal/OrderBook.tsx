import React from 'react';

export type OrderLevel = [string, string]; // [price, quantity]

interface OrderBookProps {
  bids: OrderLevel[];
  asks: OrderLevel[];
  currentPrice: number;
}

const OrderBook: React.FC<OrderBookProps> = ({ bids, asks, currentPrice }) => {
  // Pre-calculate max volumes for depth bars
  const maxAskQty = Math.max(...asks.map(a => parseFloat(a[1])), 1);
  const maxBidQty = Math.max(...bids.map(b => parseFloat(b[1])), 1);
  const maxQty = Math.max(maxAskQty, maxBidQty);

  return (
    <div className="flex flex-col h-full bg-[#111318] text-xs font-mono">
      <div className="flex items-center justify-between px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-[#1E293B]">
        <span>Price</span>
        <span>Amount</span>
        <span>Total</span>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Asks (Red) - Displayed from bottom up (lowest ask near spread) */}
        <div className="flex-1 overflow-y-auto flex flex-col-reverse custom-scrollbar">
          {asks.slice(0, 15).reverse().map((ask, i) => {
            const price = parseFloat(ask[0]);
            const qty = parseFloat(ask[1]);
            const total = price * qty;
            const depth = (qty / maxQty) * 100;

            return (
              <div key={`ask-${i}`} className="flex justify-between px-3 py-0.5 relative cursor-pointer hover:bg-[#1E293B]/50 transition-colors">
                <div 
                  className="absolute right-0 top-0 bottom-0 bg-danger/10 z-0" 
                  style={{ width: `${depth}%` }}
                />
                <span className="text-danger z-10">{price.toFixed(2)}</span>
                <span className="text-slate-300 z-10">{qty.toFixed(4)}</span>
                <span className="text-slate-500 z-10">{total.toFixed(0)}</span>
              </div>
            );
          })}
        </div>

        {/* Spread / Current Price */}
        <div className="py-2 px-3 border-y border-[#1E293B] flex items-center justify-center gap-2 bg-[#0A0B0E]">
           <span className="text-lg font-bold text-slate-100">{currentPrice.toFixed(2)}</span>
           <span className="text-[10px] text-slate-500 uppercase">Spread Detail</span>
        </div>

        {/* Bids (Green) */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {bids.slice(0, 15).map((bid, i) => {
            const price = parseFloat(bid[0]);
            const qty = parseFloat(bid[1]);
            const total = price * qty;
            const depth = (qty / maxQty) * 100;

            return (
              <div key={`bid-${i}`} className="flex justify-between px-3 py-0.5 relative cursor-pointer hover:bg-[#1E293B]/50 transition-colors">
                <div 
                  className="absolute right-0 top-0 bottom-0 bg-success/10 z-0" 
                  style={{ width: `${depth}%` }}
                />
                <span className="text-success z-10">{price.toFixed(2)}</span>
                <span className="text-slate-300 z-10">{qty.toFixed(4)}</span>
                <span className="text-slate-500 z-10">{total.toFixed(0)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default OrderBook;
