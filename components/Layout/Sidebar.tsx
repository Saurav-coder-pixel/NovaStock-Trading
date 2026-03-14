import React, { useState, useRef, useCallback, useEffect } from 'react';
import { LayoutDashboard, LineChart, PieChart, Settings, Layers, X, Moon, Sun, GripVertical, Globe } from 'lucide-react';
import { Stock, ViewType } from '../../types';
import UpgradePlanModal from './UpgradePlanModal';

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState<number>(DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(DEFAULT_WIDTH);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'worldmonitor', label: 'World Monitor', icon: Globe },
    { id: 'market', label: 'Stock Market', icon: LineChart },
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
  const onMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      startXRef.current = e.clientX;
      startWidthRef.current = sidebarWidth;
      setIsResizing(true);
    },
    [sidebarWidth]
  );

  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;
      const delta = e.clientX - startXRef.current;
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidthRef.current + delta));
      setSidebarWidth(newWidth);
      onWidthChange?.(newWidth);
    },
    [isResizing, onWidthChange]
  );

  const onMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  // Double-click resize handle → snap back to default
  const resetWidth = () => {
    setSidebarWidth(DEFAULT_WIDTH);
    onWidthChange?.(DEFAULT_WIDTH);
  };

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
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
        style={{ width: sidebarWidth, minWidth: MIN_WIDTH, maxWidth: MAX_WIDTH, position: 'relative' }}
        className={`fixed inset-y-0 left-0 z-50 bg-surface border-r border-border flex flex-col h-full shadow-2xl lg:relative lg:translate-x-0 ${
          isResizing ? '' : 'transition-[width] duration-75'
        } ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Brand */}
        <div className="p-6 pb-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 flex-shrink-0 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Layers className="text-white w-5 h-5" />
            </div>
            {sidebarWidth > 210 && (
              <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white truncate">
                NovaTrade
              </span>
            )}
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
          {sidebarWidth > 210 && (
            <div className="px-6 mb-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Platform
            </div>
          )}
          <nav className="space-y-1 px-3 mb-8">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.id as ViewType)}
                title={sidebarWidth <= 210 ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all group ${
                  sidebarWidth <= 210 ? 'justify-center' : ''
                } ${
                  currentView === item.id
                    ? 'bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/10'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
              >
                <item.icon
                  size={18}
                  className={`flex-shrink-0 ${
                    currentView === item.id
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : 'group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors'
                  }`}
                />
                {sidebarWidth > 210 && (
                  <span className="text-sm font-medium truncate">{item.label}</span>
                )}
              </button>
            ))}
          </nav>

          {/* Watchlist */}
          {sidebarWidth > 210 && (
            <>
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
                        <span
                          className={`font-bold font-mono ${
                            currentStock.symbol === stock.symbol && currentView === 'market'
                              ? 'text-indigo-600 dark:text-white'
                              : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {stock.symbol}
                        </span>
                      </div>
                      <div
                        className="text-[11px] text-slate-500 truncate"
                        style={{ maxWidth: sidebarWidth - 110 }}
                      >
                        {stock.name}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-medium text-slate-800 dark:text-slate-200 font-mono">
                        ${stock.price.toFixed(2)}
                      </div>
                      <div
                        className={`text-[10px] flex items-center justify-end gap-1 font-medium ${
                          stock.change >= 0
                            ? 'text-emerald-500 dark:text-emerald-400'
                            : 'text-rose-500 dark:text-rose-400'
                        }`}
                      >
                        {stock.change >= 0 ? '+' : ''}
                        {Math.abs(stock.changePercent).toFixed(2)}%
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {sidebarWidth > 210 && (
          <div className="p-4 border-t border-border space-y-4 shrink-0">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
            >
              <span className="text-xs font-medium">Appearance</span>
              <div className="flex items-center gap-2">
                {isDarkMode ? (
                  <Moon size={14} className="text-indigo-400" />
                ) : (
                  <Sun size={14} className="text-amber-500" />
                )}
                <span className="text-xs">{isDarkMode ? 'Dark' : 'Light'}</span>
              </div>
            </button>

            {/* Upgrade Banner */}
            <div
              className="relative overflow-hidden rounded-xl bg-gradient-to-br from-indigo-600 to-violet-700 p-4 shadow-lg group cursor-pointer"
              onClick={() => setIsModalOpen(true)}
            >
              <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-white opacity-10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500"></div>
              <p className="text-xs text-white font-bold mb-0.5 relative z-10">Upgrade to Pro</p>
              <p className="text-[10px] text-indigo-100 mb-3 relative z-10 opacity-80">
                Unlock unlimited AI predictions.
              </p>
              <button
                className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white text-[10px] font-bold py-2 rounded-lg transition-colors relative z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsModalOpen(true);
                }}
              >
                View Plans
              </button>
            </div>
          </div>
        )}

        {/* ── Right-edge Resize Handle ─────────────────────────────────────────── */}
        <div
          onMouseDown={onMouseDown}
          onDoubleClick={resetWidth}
          title="Drag to resize · Double-click to reset"
          className="absolute top-0 right-0 h-full flex items-center group"
          style={{ width: 8, cursor: 'col-resize', zIndex: 10 }}
        >
          {/* Visible thin bar */}
          <div
            className="h-full transition-all duration-150 group-hover:bg-indigo-500/40"
            style={{
              width: isResizing ? 3 : 2,
              backgroundColor: isResizing ? 'rgba(99,102,241,0.6)' : undefined,
              marginLeft: 'auto',
            }}
          />
          {/* Center grip icon */}
          <div className="absolute top-1/2 -translate-y-1/2 right-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <GripVertical size={12} className="text-slate-400 dark:text-slate-600" />
          </div>
        </div>
      </div>

      {/* Upgrade Modal Portal */}
      <UpgradePlanModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};

export default Sidebar;
