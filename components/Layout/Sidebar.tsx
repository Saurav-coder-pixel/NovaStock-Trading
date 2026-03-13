import React, { useRef, useState, useCallback, useEffect } from 'react';
import { LayoutDashboard, LineChart, PieChart, Settings, Layers, X, Moon, Sun, Bitcoin, GripVertical } from 'lucide-react';
import { Stock, ViewType } from '../../types';

const MIN_WIDTH = 220;
const MAX_WIDTH = 420;
const DEFAULT_WIDTH = 256; // w-64 = 16rem = 256px

interface SidebarProps {
  watchlist: Stock[];
  currentStock: Stock;
  onSelectStock: (stock: Stock) => void;
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  isOpen?: boolean;
  onClose?: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  onWidthChange?: (width: number) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  watchlist, 
  currentStock, 
  onSelectStock,
  currentView,
  onViewChange,
  isOpen = false,
  onClose,
  isDarkMode,
  toggleTheme,
  onWidthChange,
}) => {
  const [sidebarWidth, setSidebarWidth] = useState<number>(DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(DEFAULT_WIDTH);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'market', label: 'Stock Market', icon: LineChart },
    { id: 'crypto', label: 'Crypto Exchange', icon: Bitcoin },
    { id: 'portfolio', label: 'Portfolio', icon: PieChart },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleNavigation = (view: ViewType) => {
    onViewChange(view);
    if (onClose) onClose();
  };

  const handleStockClick = (stock: Stock) => {
    onSelectStock(stock);
    onViewChange('market');
    if (onClose) onClose();
  };

  // ── Resize Logic ──────────────────────────────────────────────────
  const onMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    startXRef.current = e.clientX;
    startWidthRef.current = sidebarWidth;
    setIsResizing(true);
  }, [sidebarWidth]);

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    const delta = e.clientX - startXRef.current;
    const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidthRef.current + delta));
    setSidebarWidth(newWidth);
    onWidthChange?.(newWidth);
  }, [isResizing, onWidthChange]);

  const onMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
      // Prevent text selection during drag
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'col-resize';
    } else {
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    }
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [isResizing, onMouseMove, onMouseUp]);

  // Notify parent of default width on mount
  useEffect(() => {
    onWidthChange?.(DEFAULT_WIDTH);
  }, []);
  // ──────────────────────────────────────────────────────────────────

  return (
    <>
      <div 
        ref={sidebarRef}
        style={{ width: `${sidebarWidth}px`, minWidth: `${MIN_WIDTH}px`, maxWidth: `${MAX_WIDTH}px` }}
        className={`fixed inset-y-0 left-0 z-50 bg-surface border-r border-border flex flex-col h-full shadow-2xl lg:relative lg:translate-x-0 ${
          isResizing ? '' : 'sidebar-transition'
        } ${isOpen ? 'translate-x-0' : '-translate-x-full'} sidebar-root`}
      >
        {/* Brand */}
        <div className="p-6 flex items-center justify-between" style={{ minWidth: 0 }}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 flex-shrink-0 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Layers className="text-white w-5 h-5" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white truncate">NovaTrade</span>
          </div>
          <button 
            onClick={onClose} 
            className="lg:hidden flex-shrink-0 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors p-1"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
          {/* Main Nav */}
          <div className="px-6 mb-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Platform</div>
          <nav className="space-y-1 px-3 mb-8">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.id as ViewType)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all group ${
                  currentView === item.id 
                    ? 'bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/10' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
              >
                <item.icon size={18} className={`flex-shrink-0 ${currentView === item.id ? 'text-indigo-600 dark:text-indigo-400' : 'group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors'}`} /> 
                <span className="text-sm font-medium truncate">{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Watchlist */}
          <div className="px-6 mb-3 flex items-center justify-between">
             <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Watchlist</span>
             <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">LIVE</span>
             </div>
          </div>
          <div className="px-3 space-y-1">
            {watchlist.map((stock) => (
              <button
                key={stock.symbol}
                onClick={() => handleStockClick(stock)}
                className={`w-full flex items-center justify-between px-3 py-3 rounded-xl transition-all border ${
                  currentStock.symbol === stock.symbol && currentView === 'market'
                    ? 'bg-gradient-to-r from-slate-100 to-white dark:from-slate-800 dark:to-slate-900 border-indigo-500/30 shadow-lg' 
                    : 'hover:bg-slate-100 dark:hover:bg-white/5 border-transparent'
                }`}
              >
                <div className="text-left min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`font-bold font-mono ${currentStock.symbol === stock.symbol && currentView === 'market' ? 'text-indigo-600 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                      {stock.symbol}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 truncate max-w-[7rem]">{stock.name}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-medium text-slate-800 dark:text-slate-200 font-mono">${stock.price.toFixed(2)}</div>
                  <div className={`text-[10px] flex items-center justify-end gap-1 font-medium ${stock.change >= 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
                    {stock.change >= 0 ? '+' : ''}{Math.abs(stock.changePercent).toFixed(2)}%
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-border space-y-4">
           {/* Theme Toggle */}
           <button 
             onClick={toggleTheme}
             className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
           >
             <span className="text-xs font-medium">Appearance</span>
             <div className="flex items-center gap-2">
               {isDarkMode ? <Moon size={14} className="text-indigo-400" /> : <Sun size={14} className="text-amber-500" />}
               <span className="text-xs">{isDarkMode ? 'Dark' : 'Light'}</span>
             </div>
           </button>

          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-indigo-600 to-violet-700 p-4 shadow-lg group cursor-pointer">
             <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-white opacity-10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500"></div>
            <p className="text-xs text-white font-bold mb-0.5 relative z-10">Upgrade to Pro</p>
            <p className="text-[10px] text-indigo-100 mb-3 relative z-10 opacity-80">Unlock unlimited AI predictions.</p>
            <button className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white text-[10px] font-bold py-2 rounded-lg transition-colors relative z-10">
              View Plans
            </button>
          </div>
        </div>

        {/* ── Resize Handle ── */}
        <div
          onMouseDown={onMouseDown}
          className={`sidebar-resize-handle ${isResizing ? 'sidebar-resize-handle--active' : ''}`}
          title="Drag to resize sidebar"
          aria-label="Resize sidebar"
        >
          {/* subtle grip dots */}
          <div className="sidebar-resize-grip">
            <GripVertical size={12} className="text-slate-400 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;