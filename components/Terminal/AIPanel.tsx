import React, { useState } from 'react';
import { Bot, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { AIAnalysisResult } from '../../services/anthropicService';

interface AIPanelProps {
  analysis: AIAnalysisResult | null;
  isLoading: boolean;
  onRefresh: () => void;
}

const AIPanel: React.FC<AIPanelProps> = ({ analysis, isLoading, onRefresh }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (isLoading) {
    return (
      <div className="bg-[#111318] border-t border-[#1E293B] p-4 flex flex-col items-center justify-center min-h-[150px]">
        <Bot className="w-8 h-8 text-primary animate-pulse mb-3" />
        <div className="text-sm font-mono text-slate-400">NovaAI is crunching the numbers...</div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="bg-[#111318] border-t border-[#1E293B] p-4 flex flex-col items-center justify-center min-h-[150px]">
        <div className="text-center text-sm font-sans text-slate-500 mb-4">
           Ready to generate deep market analysis using Anthropic Claude.
        </div>
        <button 
           onClick={onRefresh}
           className="px-6 py-2 bg-[#1E293B] hover:bg-[#2A374E] text-white text-xs font-bold rounded shadow-lg transition-colors flex items-center gap-2"
        >
          <Bot size={14} /> ⚡ Nova AI Analysis
        </button>
      </div>
    );
  }

  const { verdict, confidence, short_term, support_level, resistance_level, risk, action, reasons, disclaimer } = analysis;

  const getVerdictStyle = () => {
    switch (verdict) {
       case 'BULLISH': return 'text-success bg-success/10 shadow-[0_0_15px_rgba(0,208,132,0.3)] border-success/30';
       case 'BEARISH': return 'text-danger bg-danger/10 shadow-[0_0_15px_rgba(255,59,92,0.3)] border-danger/30';
       default: return 'text-amber-500 bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.3)] border-amber-500/30';
    }
  };

  const getActionStyle = () => {
    switch (action) {
       case 'BUY': return 'bg-success text-white';
       case 'SELL': return 'bg-danger text-white';
       case 'HOLD': return 'bg-amber-500 text-white';
       default: return 'bg-slate-500 text-white';
    }
  };

  return (
    <div className="bg-[#111318] border-t border-[#1E293B] font-sans flex flex-col">
       <div className="flex items-center justify-between px-4 py-3 cursor-pointer select-none" onClick={() => setIsExpanded(!isExpanded)}>
          <div className="flex items-center gap-3">
             <div className="w-6 h-6 rounded bg-primary/20 text-primary flex items-center justify-center">
                <Bot size={14} />
             </div>
             <span className="font-bold text-sm text-slate-200 tracking-wide">NOVA AI INTELLIGENCE</span>
          </div>
          <div className="flex items-center gap-4">
             {/* Verdict Badge */}
             <div className={`px-3 py-1 text-[10px] font-black uppercase rounded border ${getVerdictStyle()}`}>
               {verdict}
             </div>
             {isExpanded ? <ChevronDown size={16} className="text-slate-500" /> : <ChevronUp size={16} className="text-slate-500" />}
          </div>
       </div>

       {isExpanded && (
         <div className="px-4 pb-4 animate-in slide-in-from-top-2 duration-300">
            {/* Top Stats Bar */}
            <div className="grid grid-cols-4 gap-4 bg-[#0A0B0E] rounded-lg p-3 border border-[#1E293B] mb-4">
               
               {/* Confidence */}
               <div className="col-span-1">
                 <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Confidence</div>
                 <div className="flex items-center gap-2">
                    <span className="font-mono text-lg font-bold text-slate-200">{confidence}%</span>
                 </div>
                 <div className="w-full h-1 bg-[#1E293B] rounded-full mt-1">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${confidence}%` }}></div>
                 </div>
               </div>

               {/* Risk & Action */}
               <div className="col-span-1 border-l border-[#1E293B] pl-4">
                 <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Recommendation</div>
                 <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${getActionStyle()}`}>{action}</span>
                    <span className={`text-[10px] font-bold ${risk === 'HIGH' ? 'text-danger' : risk === 'MEDIUM' ? 'text-amber-500' : 'text-success'}`}>{risk} RISK</span>
                 </div>
               </div>

               {/* Levels Bar */}
               <div className="col-span-2 border-l border-[#1E293B] pl-4 flex flex-col justify-center">
                 <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                    <span>{support_level} (SUP)</span>
                    <span>{resistance_level} (RES)</span>
                 </div>
                 <div className="relative w-full h-2 bg-gradient-to-r from-danger/20 via-slate-600/20 to-success/20 rounded-full">
                    <div className="absolute top-1/2 left-1/2 w-2 h-4 bg-white rounded-sm -translate-x-1/2 -translate-y-1/2 shadow-[0_0_10px_rgba(255,255,255,0.5)]"></div>
                 </div>
               </div>
            </div>

            {/* Content Split */}
            <div className="flex gap-6">
               <div className="flex-[0.4]">
                 <div className="text-[10px] text-slate-500 font-bold uppercase mb-2">Short Term Outlook</div>
                 <p className="text-sm text-slate-300 leading-relaxed font-serif">{short_term}</p>
                 <button className="mt-4 px-4 py-1.5 bg-[#1E293B] hover:bg-[#2A374E] text-slate-300 text-[10px] font-bold rounded shadow-sm transition-colors" onClick={onRefresh}>
                    Re-Analyze Data
                 </button>
               </div>
               <div className="flex-[0.6]">
                 <div className="text-[10px] text-slate-500 font-bold uppercase mb-2">Key Driving Factors</div>
                 <ul className="space-y-2">
                    {reasons.map((r, i) => (
                       <li key={i} className="flex gap-2 text-xs text-slate-300 items-start">
                          <span className="text-primary mt-1">●</span>
                          <span className="leading-snug">{r}</span>
                       </li>
                    ))}
                 </ul>
               </div>
            </div>

            {/* Disclaimer */}
            <div className="mt-4 pt-3 border-t border-[#1E293B]/50 flex items-center gap-2 text-[9px] text-slate-600">
               <AlertTriangle size={10} />
               {disclaimer}
            </div>
         </div>
       )}
    </div>
  );
};

export default AIPanel;
