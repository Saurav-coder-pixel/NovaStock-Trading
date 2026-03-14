import React, { useEffect, useState, useCallback } from 'react';
import { Menu, Layers } from 'lucide-react';
import Sidebar from './components/Layout/Sidebar';
import MarketOverview from './components/Market/MarketOverview';
import DashboardHome from './components/Dashboard/DashboardHome';
import Portfolio from './components/Portfolio/Portfolio';
import Settings from './components/Settings/Settings';
import { WATCHLIST, subscribeToTicker } from './services/stockService';
import { Stock, ViewType } from './types';

const App: React.FC = () => {
  const [watchlist, setWatchlist] = useState<Stock[]>(WATCHLIST);
  const [currentStock, setCurrentStock] = useState<Stock>(WATCHLIST[0]);
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(256);

  const handleSidebarWidthChange = useCallback((w: number) => {
    setSidebarWidth(w);
  }, []);
  
  // Theme State
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') as 'dark' | 'light' || 'dark';
    }
    return 'dark';
  });

  // Apply Theme
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Initialize Data Subscription
  useEffect(() => {
    const unsubscribers = watchlist.map(stock => {
      return subscribeToTicker(stock.symbol, (updatedStock) => {
        setWatchlist(prev => prev.map(s => s.symbol === updatedStock.symbol ? updatedStock : s));
        if (updatedStock.symbol === currentStock.symbol) {
          setCurrentStock(updatedStock);
        }
      });
    });
    return () => { unsubscribers.forEach(unsub => unsub()); };
  }, [currentStock.symbol]); 

  const handleStockSelect = (stock: Stock) => {
    setCurrentStock(stock);
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <DashboardHome 
            watchlist={watchlist} 
            onNavigate={setCurrentView} 
            onSelectStock={handleStockSelect}
          />
        );
      case 'market':
        return (
          <MarketOverview 
            currentStock={currentStock} 
            isChatOpen={isChatOpen} 
            onToggleChat={() => setIsChatOpen(!isChatOpen)}
            isDarkMode={theme === 'dark'} 
            onSelectStock={handleStockSelect}
          />
        );
      case 'portfolio':
        return <Portfolio watchlist={watchlist} />;
      case 'settings':
        return <Settings />;
      default:
        return (
          <DashboardHome 
            watchlist={watchlist} 
            onNavigate={setCurrentView} 
            onSelectStock={handleStockSelect}
          />
        );
    }
  };

  return (
    <div className="flex h-screen overflow-hidden font-sans text-slate-900 dark:text-slate-100 selection:bg-indigo-500/30 bg-background transition-colors duration-300">
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <Sidebar 
        watchlist={watchlist} 
        currentStock={currentStock} 
        onSelectStock={handleStockSelect} 
        currentView={currentView}
        onViewChange={setCurrentView}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        isDarkMode={theme === 'dark'}
        toggleTheme={toggleTheme}
        onWidthChange={handleSidebarWidthChange}
      />

      <div
        className="flex-1 flex flex-col min-w-0 relative"
        style={{ transition: 'margin-left 0.05s linear' }}
      >
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between p-4 border-b border-border bg-surface sticky top-0 z-30 transition-colors duration-300">
           <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Layers className="text-white w-5 h-5" />
             </div>
             <span className="font-bold text-slate-900 dark:text-white text-lg">NovaTrade</span>
           </div>
           <button 
             onClick={() => setIsMobileMenuOpen(true)} 
             className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
           >
             <Menu size={24} />
           </button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-10 scroll-smooth">
          {renderView()}
        </main>
      </div>
    </div>
  );
};

export default App;