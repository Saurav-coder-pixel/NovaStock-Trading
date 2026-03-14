import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send, Bot, User, Sparkles, BrainCircuit, TrendingUp,
  Bitcoin, BarChart2, RefreshCw, ChevronDown, X, Zap, LineChart
} from 'lucide-react';
import { ChatMessage, Stock, CryptoCoin, AIProviderConfig } from '../../types';
import { sendNovaMessage, QUICK_ACTIONS } from '../../services/novaAiService';
import { subscribeToCryptoUpdates } from '../../services/cryptoService';
import InlineMiniChart, { detectAssets, ChartAsset } from './InlineMiniChart';

interface NovaAIChatProps {
  watchlist: Stock[];
}

// Simple markdown-like renderer (bold, newlines, lists)
const renderMarkdown = (text: string): React.ReactElement => {
  const lines = text.split('\n');
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        // Bold **text**
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        const rendered = parts.map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={j} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
          }
          return <span key={j}>{part}</span>;
        });
        if (line.trim() === '') return <div key={i} className="h-1" />;
        return <div key={i} className="leading-relaxed">{rendered}</div>;
      })}
    </div>
  );
};

const ASSET_FILTERS = ['All Assets', 'Stocks Only', 'Crypto Only'] as const;
type AssetFilter = typeof ASSET_FILTERS[number];

// Extended message type that can carry chart data
type NovaMessage = ChatMessage & { charts?: ChartAsset[] };

// Chart-specific quick action chips
const CHART_QUICK_ACTIONS = [
  { label: '📊 Chart BTC', cmd: 'chart BTC' },
  { label: '📊 Chart ETH', cmd: 'chart ETH' },
  { label: '📊 Chart AAPL', cmd: 'chart AAPL' },
  { label: '📊 Chart NVDA', cmd: 'chart NVDA' },
  { label: '📊 Chart TSLA', cmd: 'chart TSLA' },
  { label: '📊 Chart SOL', cmd: 'chart SOL' },
] as const;

// Parse chart command: "chart BTC", "show chart for AAPL", etc.
const parseChartCommand = (text: string): ChartAsset[] | null => {
  const lower = text.toLowerCase().trim();
  const isChartCmd = lower.startsWith('chart ') || lower.startsWith('show chart') || lower.startsWith('/chart');
  if (!isChartCmd) return null;
  const assets = detectAssets(text);
  return assets.length > 0 ? assets : null;
};

const NovaAIChat: React.FC<NovaAIChatProps> = ({ watchlist }) => {
  const [messages, setMessages] = useState<NovaMessage[]>([
    {
      id: '1',
      role: 'model',
      text: `Welcome! I'm **Nova AI Analyst** — your personal financial intelligence engine. 🧠✨

I can help you with:
📈 **Stock & Crypto Predictions** — directional bias, price targets, confidence scores
⚖️ **Asset Comparisons** — side-by-side analysis of any two stocks or cryptos
🟢 **Buy / Sell / Hold Signals** — backed by technical & fundamental reasoning
🌍 **Market Sentiment** — macro conditions, sector trends, risk outlook
📊 **Interactive Charts** — charts auto-appear when I mention any stock or crypto!

Use the quick actions below or ask me anything. I'm analyzing live market data right now.`,
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [assetFilter, setAssetFilter] = useState<AssetFilter>('All Assets');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [cryptos, setCryptos] = useState<CryptoCoin[]>([]);
  const [showContextPanel, setShowContextPanel] = useState(true);
  const [aiConfig, setAiConfig] = useState<AIProviderConfig>({
    provider: 'gemini',
    apiKey: '',
    model: 'gemini-2.0-flash-exp',
    isCustom: false,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const filterMenuRef = useRef<HTMLDivElement>(null);

  // Load AI config
  useEffect(() => {
    const saved = localStorage.getItem('novastock_ai_config');
    if (saved) {
      try { setAiConfig(JSON.parse(saved)); } catch {}
    }
  }, []);

  // Subscribe to live crypto data
  useEffect(() => {
    const unsub = subscribeToCryptoUpdates((data) => {
      setCryptos(data.slice(0, 8)); // top 8 for context panel
    });
    return unsub;
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Close filter dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filterMenuRef.current && !filterMenuRef.current.contains(e.target as Node)) {
        setShowFilterMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const getFilteredContext = useCallback(() => {
    const stocks = assetFilter !== 'Crypto Only' ? watchlist : [];
    const cryptoList = assetFilter !== 'Stocks Only' ? cryptos : [];
    return { stocks, cryptoList };
  }, [assetFilter, watchlist, cryptos]);

  const sendUserMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: NovaMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: text.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');

    // —— Chart command shortcut (no AI needed) ——————————————————
    const chartAssets = parseChartCommand(text);
    if (chartAssets) {
      const assetList = chartAssets.map(a => `**${a.symbol}** (${a.name})`).join(', ');
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: `📊 Here are the live charts for ${assetList}. Use the **1D / 1W / 1M** tabs to switch timeframes, and click ↗️ to expand for full stats.`,
        charts: chartAssets,
        timestamp: new Date(),
      }]);
      return;
    }
    // ———————————————————————————————————————————

    setIsLoading(true);

    try {
      const { stocks, cryptoList } = getFilteredContext();
      const chatHistory = [...messages, userMsg]
        .filter(m => m.role !== 'system')
        .map(m => ({
          role: (m.role === 'model' ? 'assistant' : 'user') as 'user' | 'assistant',
          content: m.text,
        }));

      const responseText = await sendNovaMessage(aiConfig, chatHistory, stocks, cryptoList);
      const text = responseText || "I couldn't generate a response. Please try again.";
      // Detect any stock/crypto mentioned in the AI response and attach charts
      const charts = detectAssets(text);

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text,
        charts: charts.length > 0 ? charts : undefined,
        timestamp: new Date(),
      }]);
    } catch (err: any) {
      let errText = "⚠️ I'm having trouble connecting to the AI service. Please check your API key in **Settings** and try again.";
      if (err?.message === 'INVALID_API_KEY') {
        errText = "🔑 Invalid API key. Please go to **Settings** and update your AI provider credentials.";
      }
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: errText,
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, messages, aiConfig, getFilteredContext]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendUserMessage(input);
    }
  };

  const handleQuickAction = (prompt: string) => {
    sendUserMessage(prompt);
  };

  const clearChat = () => {
    setMessages([{
      id: Date.now().toString(),
      role: 'model',
      text: "Chat cleared. I'm ready for your next question! 🧠",
      timestamp: new Date(),
    }]);
  };

  const providerLabel = aiConfig.provider === 'gemini' ? 'Gemini' : aiConfig.provider === 'openai' ? 'GPT' : 'Claude';

  return (
    <div className="flex h-full gap-0 overflow-hidden" style={{ height: 'calc(100vh - 80px)' }}>

      {/* ── Main Chat Panel ──────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 bg-[#0d1117] rounded-2xl border border-slate-800/60 overflow-hidden shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/70 bg-[#0d1117]/95 backdrop-blur-sm flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <BrainCircuit className="text-white w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#0d1117] animate-pulse" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white flex items-center gap-2">
                Nova AI Analyst
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300">
                  {providerLabel}
                </span>
              </h1>
              <p className="text-[11px] text-slate-400">Stock & Crypto Intelligence · Live Market Data</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Asset filter */}
            <div className="relative" ref={filterMenuRef}>
              <button
                onClick={() => setShowFilterMenu(v => !v)}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-slate-800/70 border border-slate-700/50 text-slate-300 hover:bg-slate-700/80 transition-colors"
              >
                {assetFilter === 'All Assets' ? <BarChart2 size={12} /> : assetFilter === 'Stocks Only' ? <TrendingUp size={12} /> : <Bitcoin size={12} />}
                {assetFilter}
                <ChevronDown size={11} className={`transition-transform ${showFilterMenu ? 'rotate-180' : ''}`} />
              </button>
              {showFilterMenu && (
                <div className="absolute right-0 top-full mt-1.5 w-36 bg-[#161b27] border border-slate-700 rounded-xl overflow-hidden shadow-2xl z-50">
                  {ASSET_FILTERS.map(f => (
                    <button
                      key={f}
                      onClick={() => { setAssetFilter(f); setShowFilterMenu(false); }}
                      className={`w-full text-left px-3 py-2 text-xs transition-colors ${assetFilter === f ? 'bg-indigo-600/20 text-indigo-300' : 'text-slate-300 hover:bg-slate-700/50'}`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => setShowContextPanel(v => !v)}
              title="Toggle market panel"
              className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 rounded-lg transition-colors"
            >
              <BarChart2 size={15} />
            </button>

            <button
              onClick={clearChat}
              title="Clear chat"
              className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 rounded-lg transition-colors"
            >
              <RefreshCw size={15} />
            </button>
          </div>
        </div>

        {/* Quick Action Chips —— AI analysis */}
        <div className="flex-shrink-0 px-4 pt-3 pb-1 border-b border-slate-800/50 overflow-x-auto no-scrollbar">
          <div className="text-[9px] text-slate-600 uppercase tracking-widest mb-1.5 px-1">AI Analysis</div>
          <div className="flex gap-2 mb-2" style={{ width: 'max-content' }}>
            {QUICK_ACTIONS.map((action, i) => (
              <button
                key={i}
                onClick={() => handleQuickAction(action.prompt)}
                disabled={isLoading}
                className="flex-shrink-0 flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-full border border-slate-700/60 bg-slate-800/40 text-slate-300 hover:bg-indigo-500/10 hover:border-indigo-500/40 hover:text-indigo-300 transition-all whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Zap size={10} className="flex-shrink-0 text-indigo-400" />
                {action.label}
              </button>
            ))}
          </div>
          <div className="text-[9px] text-slate-600 uppercase tracking-widest mb-1.5 px-1">Chart Bot — No API key needed</div>
          <div className="flex gap-2" style={{ width: 'max-content' }}>
            {CHART_QUICK_ACTIONS.map((action, i) => (
              <button
                key={i}
                onClick={() => sendUserMessage(action.cmd)}
                disabled={isLoading}
                className="flex-shrink-0 flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-full border border-indigo-800/50 bg-indigo-950/30 text-indigo-300 hover:bg-indigo-500/15 hover:border-indigo-500/40 hover:text-indigo-200 transition-all whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <BarChart2 size={10} className="flex-shrink-0 text-indigo-400" />
                {action.label}
              </button>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6 custom-scrollbar">

          {/* Animated background grid */}
          <div className="pointer-events-none fixed inset-0 opacity-[0.03]" style={{
            backgroundImage: 'linear-gradient(rgba(99,102,241,1) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,1) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }} />

          {messages.map((msg) => {
            const novaMsg = msg as NovaMessage;
            return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md ${
                msg.role === 'user'
                  ? 'bg-slate-700/80 border border-slate-600/50'
                  : 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-500/20'
              }`}>
                {msg.role === 'user'
                  ? <User size={14} className="text-slate-300" />
                  : <Bot size={14} className="text-white" />}
              </div>

              {/* Bubble + charts */}
              <div className={`flex flex-col gap-0 ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-[82%]`}>
                <div className={`w-full rounded-2xl px-4 py-3 text-sm shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-slate-800/90 text-slate-100 rounded-tr-none border border-slate-700/40'
                    : 'bg-gradient-to-br from-[#151c2c] to-[#111827] text-slate-200 rounded-tl-none border border-indigo-500/15 shadow-indigo-950/50'
                }`}>
                  {msg.role === 'model'
                    ? renderMarkdown(msg.text)
                    : <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>
                  }
                  <div className="text-[10px] opacity-35 mt-2 text-right font-mono">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                {/* Inline charts — only on bot messages with detected assets */}
                {msg.role === 'model' && novaMsg.charts && novaMsg.charts.length > 0 && (
                  <div className="w-full mt-1 space-y-2">
                    <div className="flex items-center gap-1.5 text-[10px] text-indigo-400/70 font-medium px-1">
                      <LineChart size={10} />
                      Chart Bot — {novaMsg.charts.length} asset{novaMsg.charts.length > 1 ? 's' : ''} detected
                    </div>
                    {novaMsg.charts.map(asset => (
                      <InlineMiniChart key={asset.symbol} asset={asset} />
                    ))}
                  </div>
                )}
              </div>
            </div>
            );
          })}

          {/* Typing indicator */}
          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
                <Bot size={14} className="text-white" />
              </div>
              <div className="bg-gradient-to-br from-[#151c2c] to-[#111827] border border-indigo-500/15 px-4 py-3 rounded-2xl rounded-tl-none flex gap-1.5 items-center h-11">
                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="flex-shrink-0 p-4 border-t border-slate-800/60 bg-[#0d1117]/90 backdrop-blur-sm">
          <div className="relative flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Nova to predict, compare, or analyze any stock or crypto..."
                rows={1}
                className="w-full bg-[#161b27] text-slate-200 text-sm rounded-xl pl-4 pr-4 py-3 border border-slate-700/60 focus:outline-none focus:border-indigo-500/70 focus:ring-1 focus:ring-indigo-500/40 transition-all placeholder:text-slate-600 resize-none min-h-[46px] max-h-32"
                style={{ lineHeight: '1.5' }}
                onInput={e => {
                  const t = e.target as HTMLTextAreaElement;
                  t.style.height = 'auto';
                  t.style.height = `${Math.min(t.scrollHeight, 128)}px`;
                }}
              />
            </div>
            <button
              onClick={() => sendUserMessage(input)}
              disabled={!input.trim() || isLoading}
              className="flex-shrink-0 p-3 bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:scale-105 active:scale-95"
            >
              <Send size={17} />
            </button>
          </div>
          <p className="text-[10px] text-center text-slate-600 mt-2.5">
            <span className="text-indigo-500/60">Nova</span> provides AI analysis for educational purposes only — not financial advice.
          </p>
        </div>
      </div>

      {/* ── Live Market Context Panel ──────────────────────────────────── */}
      {showContextPanel && (
        <div className="w-64 flex-shrink-0 ml-4 flex flex-col gap-3 overflow-y-auto custom-scrollbar pb-2">

          {/* Stocks panel */}
          <div className="bg-[#0d1117] border border-slate-800/60 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={13} className="text-indigo-400" />
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Stocks</span>
              <span className="ml-auto flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] text-emerald-500 font-bold">LIVE</span>
              </span>
            </div>
            <div className="space-y-2">
              {watchlist.map(s => (
                <div key={s.symbol} className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-200 font-mono">{s.symbol}</div>
                    <div className="text-[10px] text-slate-500 truncate" style={{ maxWidth: 80 }}>{s.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-medium text-slate-300 font-mono">${s.price.toFixed(2)}</div>
                    <div className={`text-[10px] font-semibold ${s.changePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {s.changePercent >= 0 ? '+' : ''}{s.changePercent.toFixed(2)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Crypto panel */}
          {cryptos.length > 0 && (
            <div className="bg-[#0d1117] border border-slate-800/60 rounded-2xl p-4 shadow-xl">
              <div className="flex items-center gap-2 mb-3">
                <Bitcoin size={13} className="text-orange-400" />
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Crypto</span>
                <span className="ml-auto flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[9px] text-emerald-500 font-bold">LIVE</span>
                </span>
              </div>
              <div className="space-y-2">
                {cryptos.map(c => (
                  <div key={c.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <img src={c.image} alt={c.name} className="w-4 h-4 rounded-full flex-shrink-0" onError={e => (e.currentTarget.style.display = 'none')} />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-200 font-mono">{c.symbol}</div>
                        <div className="text-[10px] text-slate-500 truncate">{c.name}</div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xs font-medium text-slate-300 font-mono">
                        ${c.price >= 1000 ? (c.price / 1000).toFixed(2) + 'k' : c.price.toFixed(2)}
                      </div>
                      <div className={`text-[10px] font-semibold ${c.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {c.change24h >= 0 ? '+' : ''}{c.change24h.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tips card */}
          <div className="bg-gradient-to-br from-indigo-900/30 to-purple-900/20 border border-indigo-500/20 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={12} className="text-indigo-400" />
              <span className="text-[11px] font-bold text-indigo-300">Pro Tips</span>
            </div>
            <ul className="space-y-1.5 text-[10px] text-slate-400 leading-relaxed">
              <li>💬 Ask <span className="text-indigo-400">"Compare BTC vs ETH"</span></li>
              <li>📈 Ask <span className="text-indigo-400">"Predict AAPL next week"</span></li>
              <li>🎯 Ask <span className="text-indigo-400">"Should I buy NVDA now?"</span></li>
              <li>🌍 Ask <span className="text-indigo-400">"Current market sentiment"</span></li>
              <li>📊 <span className="text-indigo-400">Charts appear automatically!</span></li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default NovaAIChat;
