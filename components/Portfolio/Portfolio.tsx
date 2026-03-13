import React, { useMemo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { Stock, Holding } from '../../types';
import { Briefcase, ArrowUpRight, ArrowDownRight, PieChart as PieChartIcon, Plus } from 'lucide-react';

interface PortfolioProps {
  watchlist: Stock[];
}

// Mock Holdings Data
const INITIAL_HOLDINGS: Holding[] = [
  { symbol: 'AAPL', quantity: 45, avgCost: 165.50 },
  { symbol: 'NVDA', quantity: 12, avgCost: 650.00 },
  { symbol: 'MSFT', quantity: 25, avgCost: 380.20 },
  { symbol: 'GOOGL', quantity: 30, avgCost: 142.10 },
  { symbol: 'TSLA', quantity: 50, avgCost: 195.00 },
];

const COLORS = ['#6366f1', '#10b981', '#0ea5e9', '#f59e0b', '#ef4444', '#8b5cf6'];

const Portfolio: React.FC<PortfolioProps> = ({ watchlist }) => {
  
  // Calculate portfolio metrics based on live watchlist prices
  const portfolioData = useMemo(() => {
    let totalValue = 0;
    let totalCost = 0;
    
    const enrichedHoldings = INITIAL_HOLDINGS.map(holding => {
      const stock = watchlist.find(s => s.symbol === holding.symbol);
      const currentPrice = stock ? stock.price : holding.avgCost; // Fallback
      const marketValue = currentPrice * holding.quantity;
      const costBasis = holding.avgCost * holding.quantity;
      const gainLoss = marketValue - costBasis;
      const gainLossPercent = (gainLoss / costBasis) * 100;

      totalValue += marketValue;
      totalCost += costBasis;

      return {
        ...holding,
        currentPrice,
        marketValue,
        gainLoss,
        gainLossPercent,
        name: stock?.name || holding.symbol
      };
    });

    const totalGainLoss = totalValue - totalCost;
    const totalGainLossPercent = (totalGainLoss / totalCost) * 100;

    return {
      holdings: enrichedHoldings,
      totalValue,
      totalGainLoss,
      totalGainLossPercent
    };
  }, [watchlist]);

  const allocationData = portfolioData.holdings.map(h => ({
    name: h.symbol,
    value: h.marketValue
  }));

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Portfolio</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage your asset allocation and performance.</p>
        </div>
        <button className="mt-4 md:mt-0 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-indigo-500/20">
          <Plus size={18} /> Add Position
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Main Stats */}
        <div className="lg:col-span-2 bg-surface border border-border rounded-2xl p-6 flex flex-col md:flex-row justify-between items-center gap-6 shadow-sm">
           <div className="flex-1 w-full">
             <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">Net Liquidation Value</p>
             <h2 className="text-4xl font-mono font-bold text-slate-900 dark:text-white mb-2">
                ${portfolioData.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
             </h2>
             <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-bold ${portfolioData.totalGainLoss >= 0 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>
                {portfolioData.totalGainLoss >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                ${Math.abs(portfolioData.totalGainLoss).toLocaleString(undefined, { minimumFractionDigits: 2 })} 
                ({Math.abs(portfolioData.totalGainLossPercent).toFixed(2)}%)
             </div>
           </div>
           <div className="h-16 w-[1px] bg-slate-200 dark:bg-slate-800 hidden md:block"></div>
           <div className="flex gap-8 w-full md:w-auto justify-around md:justify-end">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Day Change</p>
                <p className="text-xl font-mono text-emerald-600 dark:text-emerald-400 font-bold">+$1,240.50</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Buying Power</p>
                <p className="text-xl font-mono text-slate-900 dark:text-white font-bold">$14,250</p>
              </div>
           </div>
        </div>

        {/* Allocation Chart */}
        <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col relative overflow-hidden shadow-sm">
           <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
             <PieChartIcon size={16} className="text-indigo-500 dark:text-indigo-400" /> Allocation
           </h3>
           <div className="flex-1 min-h-[180px]">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={allocationData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {allocationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0)" />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    formatter={(value: number) => `$${value.toLocaleString()}`}
                    contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)', borderRadius: '8px', color: 'var(--text-main)' }}
                    itemStyle={{ color: 'var(--text-main)' }}
                  />
                  <Legend 
                     layout="vertical" 
                     verticalAlign="middle" 
                     align="right"
                     iconSize={8}
                     wrapperStyle={{ fontSize: '10px', color: '#94a3b8' }}
                  />
                </PieChart>
             </ResponsiveContainer>
           </div>
        </div>
      </div>

      {/* Holdings Table */}
      <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-border flex justify-between items-center">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Briefcase size={18} className="text-slate-400" /> Current Holdings
            </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-[#0B0E14] text-xs uppercase text-slate-500 border-b border-border">
                <th className="px-6 py-4 font-semibold tracking-wider">Symbol</th>
                <th className="px-6 py-4 font-semibold tracking-wider text-right">Qty</th>
                <th className="px-6 py-4 font-semibold tracking-wider text-right">Last Price</th>
                <th className="px-6 py-4 font-semibold tracking-wider text-right">Avg Cost</th>
                <th className="px-6 py-4 font-semibold tracking-wider text-right">Market Value</th>
                <th className="px-6 py-4 font-semibold tracking-wider text-right">Return</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {portfolioData.holdings.map((holding) => (
                <tr key={holding.symbol} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs border border-indigo-500/20 group-hover:bg-indigo-500/20">
                        {holding.symbol[0]}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white text-sm">{holding.symbol}</div>
                        <div className="text-xs text-slate-500">{holding.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-sm text-slate-700 dark:text-slate-300">{holding.quantity}</td>
                  <td className="px-6 py-4 text-right font-mono text-sm text-slate-900 dark:text-white">${holding.currentPrice.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right font-mono text-sm text-slate-500 dark:text-slate-400">${holding.avgCost.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right font-mono text-sm font-bold text-slate-900 dark:text-white">${holding.marketValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td className="px-6 py-4 text-right">
                    <div className={`text-sm font-mono font-bold ${holding.gainLoss >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {holding.gainLoss >= 0 ? '+' : ''}{holding.gainLoss.toFixed(2)}
                    </div>
                    <div className={`text-xs ${holding.gainLoss >= 0 ? 'text-emerald-600/70 dark:text-emerald-500/70' : 'text-rose-600/70 dark:text-rose-500/70'}`}>
                       {holding.gainLossPercent.toFixed(2)}%
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Portfolio;