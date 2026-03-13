import React, { useState } from 'react';

interface OrderPanelProps {
  symbol?: string;
  currentPrice?: number;
}

const OrderPanel: React.FC<OrderPanelProps> = ({ symbol = 'ASSET', currentPrice = 0 }) => {
  const [orderType, setOrderType] = useState<'limit' | 'market'>('limit');
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const parsedAmount = parseFloat(amount) || 0;
  const units = currentPrice > 0 ? (parsedAmount / currentPrice).toFixed(6) : '0.000000';

  const handleTrade = () => {
    if (parsedAmount <= 0) return;
    const msg = `Order Placed: ${side.toUpperCase()} ${units} ${symbol} at $${currentPrice.toLocaleString()}`;
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
    setAmount('');
  };

  return (
    <div className="flex flex-col bg-[#111318] p-4 text-sm font-sans border-t border-[#1E293B] h-full relative">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full mt-2 w-11/12 bg-success text-white text-xs font-bold px-3 py-2 rounded shadow-xl z-50 text-center animate-fade-in">
          {toastMessage}
        </div>
      )}

      {/* Buy/Sell Tabs */}
      <div className="flex bg-[#0A0B0E] p-1 rounded-lg mb-4">
        <button
          onClick={() => setSide('buy')}
          className={`flex-1 py-1.5 rounded text-xs font-bold transition-all ${
            side === 'buy' ? 'bg-success text-white shadow-lg shadow-success/20' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          Buy
        </button>
        <button
          onClick={() => setSide('sell')}
          className={`flex-1 py-1.5 rounded text-xs font-bold transition-all ${
            side === 'sell' ? 'bg-danger text-white shadow-lg shadow-danger/20' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          Sell
        </button>
      </div>

      {/* Order Types */}
      <div className="flex gap-4 mb-4 text-xs font-bold border-b border-[#1E293B] pb-2">
        <button
          onClick={() => setOrderType('limit')}
          className={`${orderType === 'limit' ? 'text-slate-200' : 'text-slate-600'}`}
        >
          Limit
        </button>
        <button
          onClick={() => setOrderType('market')}
          className={`${orderType === 'market' ? 'text-slate-200' : 'text-slate-600'}`}
        >
          Market
        </button>
        <button className="text-slate-600">Stop-Limit</button>
      </div>

      {/* Inputs */}
      <div className="space-y-3">
        {orderType === 'limit' && (
          <div className="flex bg-[#0A0B0E] border border-[#1E293B] rounded px-3 py-2 items-center">
            <span className="text-slate-500 text-xs w-12">Price</span>
            <input type="text" readOnly value={currentPrice > 0 ? currentPrice.toFixed(2) : ''} className="bg-transparent flex-1 text-right text-slate-200 font-mono focus:outline-none" placeholder="0.00" />
            <span className="text-slate-500 text-xs ml-2">USDT</span>
          </div>
        )}
        
        <div className="flex bg-[#0A0B0E] border border-[#1E293B] rounded px-3 py-2 items-center">
          <span className="text-slate-500 text-xs w-12">Amount</span>
          <input 
            type="number" 
            value={amount} 
            onChange={e => setAmount(e.target.value)} 
            className="bg-transparent flex-1 text-right text-slate-200 font-mono focus:outline-none" 
            placeholder="0.00" 
          />
          <span className="text-slate-500 text-xs ml-2">USDT</span>
        </div>

        {/* Slider Simulation */}
        <div className="px-1 py-1">
           <div className="h-1 bg-[#1E293B] rounded-full relative">
              <div className="absolute w-3 h-3 bg-indigo-500 rounded-full top-1/2 -translate-y-1/2 cursor-pointer shadow-lg z-10 left-1/4"></div>
              <div className="absolute left-0 top-0 bottom-0 bg-indigo-500/50 w-1/4 rounded-full"></div>
              {[0, 25, 50, 75, 100].map(p => (
                 <div key={p} className="absolute w-2 h-2 rounded-full bg-[#1E293B] border border-[#0A0B0E] top-1/2 -translate-y-1/2 z-0" style={{ left: `calc(${p}% - 4px)` }}></div>
              ))}
           </div>
        </div>

        <div className="text-center text-xs font-mono text-slate-400 mt-2">
           You will receive <span className="text-slate-200 font-bold">{units}</span> {symbol}
        </div>
      </div>

      <button 
        onClick={handleTrade}
        className={`w-full mt-auto mb-2 py-3 rounded-lg font-bold text-sm text-white shadow-xl transition-transform active:scale-95 ${
          side === 'buy' ? 'bg-success shadow-success/20 hover:bg-success/90' : 'bg-danger shadow-danger/20 hover:bg-danger/90'
        }`}
      >
        {side === 'buy' ? 'Buy' : 'Sell'} {symbol}
      </button>

    </div>
  );
};

export default OrderPanel;
