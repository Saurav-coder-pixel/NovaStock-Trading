import React from 'react';
import { Stock, ViewType } from '../../types';
import { TrendingUp, DollarSign, Wallet, ArrowRight, Activity, Zap } from 'lucide-react';

interface DashboardHomeProps {
  watchlist: Stock[];
  onNavigate: (view: ViewType) => void;
  onSelectStock: (stock: Stock) => void;
}

const DashboardHome: React.FC<DashboardHomeProps> = ({ watchlist, onNavigate, onSelectStock }) => {
  // Mock total balance calculations
  const totalBalance = 124590.50;
  const daysPL = 2340.20;
  const daysPLPercent = 1.85;

  // Sort watchlist by absolute move for "Top Movers"
  const sortedMovers = [...watchlist].sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent));

  const handleStockClick = (stock: Stock) => {
    onSelectStock(stock);
    onNavigate('market');
  };

  return (
    <div className="max-w-6xl mx-auto animate-fade-in space-y-6 lg:space-y-8 pb-10">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">Good Morning, Alex</h1>
          <p className="text-sm md:text-base text-slate-500 dark:text-slate-400">Here's what's happening in your portfolio today.</p>
        </div>
        <div className="text-right hidden md:block">
          <p className="text-sm text-slate-500 font-mono">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
        <div 
            onClick={() => onNavigate('portfolio')}
            className="md:col-span-2 bg-gradient-to-br from-indigo-900 to-slate-900 dark:from-indigo-900/50 dark:to-slate-900 border border-indigo-500/20 rounded-2xl p-5 lg:p-6 relative overflow-hidden group shadow-xl cursor-pointer hover:shadow-2xl hover:border-indigo-500/40 transition-all duration-300"
        >
           <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <Wallet size={100} className="lg:w-[120px] lg:h-[120px] text-white" />
           </div>
           <p className="text-indigo-100/80 font-medium mb-1 text-sm lg:text-base">Total Balance</p>
           <h2 className="text-3xl sm:text-4xl md:text-5xl font-mono font-bold text-white mb-4 tracking-tighter">
             ${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
           </h2>
           <div className="flex items-center gap-3">
             <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs sm:text-sm font-bold">
               <TrendingUp size={14} className="sm:w-4 sm:h-4" />
               +${daysPL.toLocaleString()} ({daysPLPercent}%)
             </div>
             <span className="text-indigo-100/60 text-xs sm:text-sm group-hover:text-indigo-100 transition-colors">Today's P&L</span>
           </div>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-5 lg:p-6 flex flex-col justify-between hover:border-indigo-500/30 transition-colors shadow-sm">
           <div>
             <div className="flex justify-between items-start mb-4">
               <div className="p-2 bg-sky-500/10 rounded-lg">
                 <DollarSign className="text-sky-500" size={20} />
               </div>
               <span className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded font-medium">Buying Power</span>
             </div>
             <p className="text-slate-500 text-sm mb-1">Cash Available</p>
             <p className="text-xl sm:text-2xl font-mono font-bold text-slate-900 dark:text-white">$14,250.00</p>
           </div>
           <button 
             onClick={() => onNavigate('portfolio')}
             className="w-full mt-4 py-2 border border-border hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-sm text-slate-600 dark:text-slate-300 transition-colors font-medium"
           >
             Deposit Funds
           </button>
        </div>
      </div>

      {/* Market Pulse & Top Movers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8">
        {/* Top Movers */}
        <div className="bg-surface border border-border rounded-2xl p-4 lg:p-6 shadow-sm">
           <div className="flex items-center justify-between mb-4 lg:mb-6">
             <div className="flex items-center gap-2">
               <Activity className="text-indigo-500" size={20} />
               <h3 className="font-bold text-slate-900 dark:text-white text-sm lg:text-base">Top Movers</h3>
             </div>
             <button onClick={() => onNavigate('market')} className="text-xs text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 font-medium">
               View Market <ArrowRight size={12} />
             </button>
           </div>
           <div className="space-y-3 lg:space-y-4">
             {sortedMovers.slice(0, 4).map(stock => (
               <div 
                key={stock.symbol} 
                onClick={() => handleStockClick(stock)}
                className="flex items-center justify-between p-3 bg-slate-50 dark:bg-[#0B0E14] border border-border rounded-xl hover:border-indigo-500/30 hover:shadow-md cursor-pointer transition-all duration-200 group"
               >
                 <div className="flex items-center gap-3">
                   <div className={`w-1 h-8 rounded-full transition-all group-hover:h-10 ${stock.change >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                   <div>
                     <p className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{stock.symbol}</p>
                     <p className="text-xs text-slate-500">{stock.name}</p>
                   </div>
                 </div>
                 <div className="text-right">
                   <p className="font-mono font-medium text-slate-900 dark:text-white text-sm">${stock.price.toFixed(2)}</p>
                   <p className={`text-xs font-bold ${stock.change >= 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
                     {stock.change >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                   </p>
                 </div>
               </div>
             ))}
           </div>
        </div>

        {/* AI Insight Card */}
        <div className="bg-gradient-to-br from-slate-100 to-white dark:from-[#151921] dark:to-[#0B0E14] border border-border rounded-2xl p-4 lg:p-6 flex flex-col shadow-sm">
           <div className="flex items-center justify-between mb-4">
             <h3 className="font-bold text-slate-900 dark:text-white text-sm lg:text-base">Market Pulse</h3>
             <span className="text-[10px] text-indigo-500 dark:text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 font-bold">AI GENERATED</span>
           </div>
           <div className="flex-1 bg-white dark:bg-slate-900/50 rounded-xl p-4 border border-border mb-4 shadow-inner">
             <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed italic">
               "Tech sector is showing strong resilience today led by NVDA, despite broader market consolidation. Volatility indices suggest caution in the upcoming trading session."
             </p>
             <div className="mt-3 flex items-center gap-2">
               <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center">
                 <Zap size={10} className="text-white" />
               </div>
               <span className="text-xs text-slate-500 font-medium">Nova AI • 2m ago</span>
             </div>
           </div>
           <div className="mt-auto">
             <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Trending News</h4>
             <ul className="space-y-3">
                <li className="flex justify-between items-start gap-2 group cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 p-2 -mx-2 rounded-lg transition-colors">
                  <span className="text-sm text-slate-600 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-white transition-colors line-clamp-1">Fed signals potential rate adjustments in Q3</span>
                  <span className="text-xs text-slate-500 whitespace-nowrap">WSJ</span>
                </li>
                <li className="flex justify-between items-start gap-2 group cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 p-2 -mx-2 rounded-lg transition-colors">
                  <span className="text-sm text-slate-600 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-white transition-colors line-clamp-1">Global chip shortage eases, impacting supply chains</span>
                  <span className="text-xs text-slate-500 whitespace-nowrap">Bloomberg</span>
                </li>
             </ul>
           </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;