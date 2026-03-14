import React, { useState } from 'react';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';

interface TerminalLayoutProps {
  tickerText?: React.ReactNode;
  leftPanel?: React.ReactNode;
  mainChart?: React.ReactNode;
  rightPanel?: React.ReactNode;
  headerControls?: React.ReactNode;
  bottomPanel?: React.ReactNode;
}

const TerminalLayout: React.FC<TerminalLayoutProps> = ({
  tickerText,
  leftPanel,
  mainChart,
  rightPanel,
  headerControls,
  bottomPanel,
}) => {
  const [sidebarVisible, setSidebarVisible] = useState(true);

  return (
    <div className="flex flex-col h-full w-full bg-background overflow-hidden text-slate-100 font-sans">

      {/* 1. Ticker Tape Strip */}
      {tickerText && (
        <div className="h-8 border-b border-border bg-[#0B0E14] flex items-center overflow-hidden whitespace-nowrap px-4 text-xs font-mono">
          <div className="animate-[ticker_60s_linear_infinite] inline-block">
            {tickerText}
          </div>
        </div>
      )}

      {/* 2. Top Header / Controls */}
      <div className="h-14 border-b border-border bg-surface flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2">
          {/* Sidebar toggle */}
          <button
            onClick={() => setSidebarVisible(v => !v)}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-all border border-transparent hover:border-[#1E293B]"
            title={sidebarVisible ? 'Collapse asset list' : 'Expand asset list'}
          >
            {sidebarVisible
              ? <PanelLeftClose size={16} />
              : <PanelLeftOpen size={16} />
            }
          </button>
          {headerControls}
        </div>
      </div>

      {/* 3. Main Dashboard Grid */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left Column (Asset List) — slides in/out */}
        <div
          className="border-r border-border bg-surface flex flex-col overflow-hidden shrink-0 transition-all duration-300 ease-in-out"
          style={{
            width: sidebarVisible ? 300 : 0,
            minWidth: sidebarVisible ? 300 : 0,
            opacity: sidebarVisible ? 1 : 0,
            pointerEvents: sidebarVisible ? 'auto' : 'none',
          }}
        >
          {leftPanel}
        </div>

        {/* Center Column (Charts / AI) */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#0A0B0E]">
          <div className="flex-1 min-h-0 relative p-1 pb-0 flex flex-col gap-1">
            {mainChart}
          </div>
          {bottomPanel && (
            <div className="border-t border-border bg-surface shrink-0">
              {bottomPanel}
            </div>
          )}
        </div>

        {/* Right Column (Order Book & Widgets) */}
        <div className="w-[320px] border-l border-border bg-surface flex flex-col overflow-hidden shrink-0">
          {rightPanel}
        </div>

      </div>

      <style>{`
        @keyframes ticker {
          0% { transform: translateX(100vw); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  );
};

export default TerminalLayout;
