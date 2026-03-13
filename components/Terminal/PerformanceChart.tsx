import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

interface PerformanceDataPoint {
  time: string;
  [key: string]: string | number;
}

interface PerformanceChartProps {
  data: PerformanceDataPoint[];
  assets: string[];
  colors: string[];
}

const PerformanceChart: React.FC<PerformanceChartProps> = ({ data, assets, colors }) => {
  if (!data || data.length === 0) {
     return <div className="h-full flex items-center justify-center text-xs text-slate-500 font-mono">Loading relative performance...</div>;
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#111318] border border-[#1E293B] p-2 rounded shadow-xl font-mono text-[10px]">
          <div className="text-slate-500 border-b border-[#1E293B] pb-1 mb-1">
             {new Date(label).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </div>
          {payload.map((p: any, i: number) => (
             <div key={i} className="flex items-center justify-between gap-4 py-0.5">
                <div className="flex items-center gap-1.5">
                   <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color }}></div>
                   <span className="text-slate-300 font-bold">{p.name}</span>
                </div>
                <span className={p.value >= 0 ? 'text-success' : 'text-danger'}>
                   {p.value > 0 ? '+' : ''}{Number(p.value).toFixed(2)}%
                </span>
             </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-full bg-[#111318] border-b border-[#1E293B] flex flex-col pt-2 pb-1 pr-2 relative">
       <div className="absolute top-2 left-4 z-10 flex gap-3 text-[10px] font-bold uppercase tracking-wider">
          {assets.map((a, i) => (
             <div key={a} className="flex items-center gap-1">
                <div className="w-2 h-0.5 rounded" style={{ backgroundColor: colors[i % colors.length] }}></div>
                <span className="text-slate-400">{a}</span>
             </div>
          ))}
          <span className="text-slate-600 ml-2">Relative Performace (30D)</span>
       </div>
       <ResponsiveContainer width="100%" height="100%">
         <LineChart data={data} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
           <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E293B" opacity={0.6} />
           <XAxis 
             dataKey="time" 
             tickFormatter={(time) => new Date(time).toLocaleDateString(undefined, { day: 'numeric' })}
             stroke="#475569"
             tick={{ fontSize: 9, fill: '#64748b' }}
             axisLine={false}
             tickLine={false}
             minTickGap={30}
           />
           <YAxis 
             orientation="right"
             stroke="#475569"
             tick={{ fontSize: 9, fill: '#64748b', fontFamily: 'JetBrains Mono' }}
             tickFormatter={(val) => `${val > 0 ? '+' : ''}${val}%`}
             axisLine={false}
             tickLine={false}
           />
           <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#475569', strokeWidth: 1, strokeDasharray: '4 4' }} />
           
           {assets.map((asset, index) => (
              <Line 
                key={asset}
                type="monotone"
                dataKey={asset}
                stroke={colors[index % colors.length]}
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 4, fill: colors[index % colors.length], stroke: '#111318', strokeWidth: 2 }}
                isAnimationActive={false}
              />
           ))}
         </LineChart>
       </ResponsiveContainer>
    </div>
  );
};

export default PerformanceChart;
