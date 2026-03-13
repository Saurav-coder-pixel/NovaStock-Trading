import React, { useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Candle, TimeFrame } from '../../types';

interface CryptoChartProps {
  data: Candle[];
  timeframe: TimeFrame;
  onTimeframeChange: (tf: TimeFrame) => void;
  isDarkMode?: boolean;
}

const CryptoChart: React.FC<CryptoChartProps> = ({ data, timeframe, onTimeframeChange, isDarkMode = true }) => {
  const chartData = useMemo(() => {
    return data.map(d => ({
      ...d,
      dateFormatted: new Date(d.time).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    }));
  }, [data]);

  const minPrice = Math.min(...data.map(d => d.close));
  const maxPrice = Math.max(...data.map(d => d.close));
  const domain = [minPrice * 0.95, maxPrice * 1.05];

  const timeFrames = [
    { label: '1D', value: TimeFrame.D1 },
    { label: '1W', value: TimeFrame.W1 },
    { label: '1M', value: TimeFrame.M1 },
    { label: '3M', value: TimeFrame.M3 },
    { label: '1Y', value: TimeFrame.Y1 },
  ];

  return (
    <div className="bg-white dark:bg-surface border border-slate-200 dark:border-border rounded-xl shadow-sm p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Price Chart</h3>
        <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1 rounded-lg">
          {timeFrames.map((tf) => (
            <button
              key={tf.value}
              onClick={() => onTimeframeChange(tf.value)}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                timeframe === tf.value
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-amber-500'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex-1 min-h-[300px]">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#334155' : '#e2e8f0'} />
              <XAxis 
                dataKey="dateFormatted" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: isDarkMode ? '#94a3b8' : '#64748b' }}
                dy={10}
              />
              <YAxis 
                domain={domain}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: isDarkMode ? '#94a3b8' : '#64748b' }}
                tickFormatter={(val) => `$${val.toLocaleString()}`}
              />
              <Tooltip
                contentStyle={{ 
                  backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                  borderColor: isDarkMode ? '#334155' : '#e2e8f0',
                  borderRadius: '0.5rem',
                  color: isDarkMode ? '#f8fafc' : '#0f172a',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
                itemStyle={{ color: '#6366f1', fontWeight: 'bold' }}
                labelStyle={{ color: isDarkMode ? '#94a3b8' : '#64748b', marginBottom: '4px' }}
                formatter={(value: number) => [`$${value.toLocaleString(undefined, { maximumFractionDigits: 6 })}`, 'Price']}
              />
              <Line 
                type="monotone" 
                dataKey="close" 
                stroke="#6366f1" 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6, fill: '#6366f1', stroke: isDarkMode ? '#1e293b' : '#ffffff', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CryptoChart;
