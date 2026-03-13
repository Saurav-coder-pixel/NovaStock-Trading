import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, X, Minimize2 } from 'lucide-react';
import { ChatMessage, Stock, AIProviderConfig } from '../../types';
import { sendMessage, DEFAULT_CONFIGS } from '../../services/aiProviderService';

interface AssistantProps {
  currentStock: Stock;
  isOpen: boolean;
  onClose: () => void;
}

const Assistant: React.FC<AssistantProps> = ({ currentStock, isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'model',
      text: "Hello! I'm Nova. I can analyze market trends and predict stock movements for you. Ask me about any stock in your watchlist.",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiConfig, setAiConfig] = useState<AIProviderConfig>({
    provider: 'gemini',
    apiKey: '',
    model: 'gemini-2.0-flash-exp',
    isCustom: false
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  // Load AI config from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('novastock_ai_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as AIProviderConfig;
        setAiConfig(parsed);
      } catch (error) {
        console.error('Failed to parse saved AI config:', error);
        // Fall back to default Gemini config
        setAiConfig({
          provider: 'gemini',
          apiKey: '',
          model: 'gemini-2.0-flash-exp',
          isCustom: false
        });
      }
    }
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Convert messages to the format expected by sendMessage
      const chatMessages = messages.concat(userMsg).map(msg => ({
        role: msg.role === 'model' ? 'assistant' : msg.role,
        content: msg.text
      }));

      const responseText = await sendMessage(aiConfig, chatMessages);

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText || "I'm having trouble analyzing the data right now.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error('AI API Error:', error);

      let errorMessage = "I'm having trouble connecting to the AI service right now. Please try again later.";

      if (error instanceof Error && error.message === 'INVALID_API_KEY') {
        errorMessage = "Invalid API key. Please check your AI Assistant settings and ensure your API key is correct.";
      }

      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: errorMessage,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="flex flex-col h-full bg-[#11141d] border-l border-slate-800 w-96 shadow-2xl z-30">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-[#11141d]/95 backdrop-blur flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Sparkles className="text-white w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">
              Nova AI · {aiConfig.provider === 'gemini' ? 'Gemini' : aiConfig.provider === 'openai' ? 'GPT' : 'Claude'}
            </h2>
            <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <p className="text-[10px] text-slate-400 font-medium">Financial Analyst Active</p>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors p-1 hover:bg-white/5 rounded-md">
            <Minimize2 size={16} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 scroll-smooth">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border border-white/5 ${msg.role === 'user' ? 'bg-slate-800' : 'bg-indigo-600'}`}>
              {msg.role === 'user' ? <User size={14} className="text-slate-300" /> : <Bot size={14} className="text-white" />}
            </div>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                msg.role === 'user'
                  ? 'bg-slate-800 text-slate-100 rounded-tr-none'
                  : 'bg-[#1a1f2e] text-indigo-100 border border-slate-800 rounded-tl-none'
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.text}</div>
              <div className="text-[10px] opacity-40 mt-1.5 text-right font-mono">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
           <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center border border-indigo-400/30">
                 <Bot size={14} />
              </div>
              <div className="bg-[#1a1f2e] border border-slate-800 px-4 py-3 rounded-2xl rounded-tl-none flex gap-1.5 items-center h-10">
                 <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></span>
                 <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-75"></span>
                 <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-150"></span>
              </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-[#11141d] border-t border-slate-800">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Nova to analyze..."
            className="w-full bg-[#1a1f2e] text-slate-200 text-sm rounded-xl pl-4 pr-12 py-3.5 border border-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md shadow-indigo-900/20"
          >
            <Send size={16} />
          </button>
        </div>
        <p className="text-[10px] text-center text-slate-600 mt-3">
            Nova provides analysis, not financial advice.
        </p>
      </div>
    </div>
  );
};

export default Assistant;