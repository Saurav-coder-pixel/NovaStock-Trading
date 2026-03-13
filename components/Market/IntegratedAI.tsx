import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Sparkles, X, Shield, Activity, TrendingUp, AlertTriangle, HelpCircle, GripHorizontal, Maximize2 } from 'lucide-react';
import { Stock, ChatMessage, PredictionResult, Candle } from '../../types';
import { getGeminiChatResponse, generateAIPrediction } from '../../services/geminiService';

interface IntegratedAIProps {
  stock: Stock;
  history: Candle[];
  isOpen: boolean;
  onClose: () => void;
  onPredictionUpdate: (prediction: PredictionResult | null) => void;
  currentPrediction: PredictionResult | null;
}

const IntegratedAI: React.FC<IntegratedAIProps> = ({ 
  stock, 
  history, 
  isOpen, 
  onClose,
  onPredictionUpdate,
  currentPrediction
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // Drag and Resize State
  const [position, setPosition] = useState({ x: 16, y: 16 }); // Initial offsets from top-right
  const [size, setSize] = useState({ width: 380, height: 500 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const initialPos = useRef({ x: 0, y: 0 });
  const initialSize = useRef({ width: 0, height: 0 });

  // Initialize with greeting or context
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: 'init',
          role: 'model',
          text: `I'm tracking ${stock.symbol} real-time. Would you like to generate a price forecast or analyze the current trend?`,
          timestamp: new Date()
        }
      ]);
    }
  }, [isOpen, stock.symbol]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // --- Dragging Logic ---
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.drag-handle')) {
      setIsDragging(true);
      dragStartPos.current = { x: e.clientX, y: e.clientY };
      initialPos.current = { x: position.x, y: position.y };
      e.preventDefault();
    }
  };

  // --- Resizing Logic ---
  const handleResizeStart = (e: React.MouseEvent) => {
    setIsResizing(true);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    initialSize.current = { width: size.width, height: size.height };
    initialPos.current = { x: position.x, y: position.y };
    e.preventDefault();
    e.stopPropagation();
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      const dx = e.clientX - dragStartPos.current.x;
      const dy = e.clientY - dragStartPos.current.y;
      
      // We are working with right/top offsets usually, but let's stick to simple relative movement
      // To move left/right relative to right: 16, decreasing x moves it right, increasing moves it left.
      setPosition({
        x: initialPos.current.x - dx,
        y: initialPos.current.y + dy
      });
    }

    if (isResizing) {
      const dx = e.clientX - dragStartPos.current.x;
      const dy = e.clientY - dragStartPos.current.y;
      
      // Resize from bottom-left
      // Initial width + dx would grow right, but we are docked right, so dx grows left.
      // dx < 0 means mouse moved left, which should increase width
      const newWidth = Math.max(280, initialSize.current.width - dx);
      const newHeight = Math.max(300, initialSize.current.height + dy);
      
      setSize({ width: newWidth, height: newHeight });
      // If we grow width to the left, we need to adjust position.x so it stays visually docked correctly if we used right positioning
      // But since we use right: position.x, increasing width automatically expands left. 
    }
  }, [isDragging, isResizing]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  const handleRunForecast = async () => {
    setIsTyping(true);
    const loadingMsg: ChatMessage = {
      id: 'loading-pred',
      role: 'model',
      text: "Analyzing market structure and volatility patterns...",
      timestamp: new Date()
    };
    setMessages(prev => [...prev, loadingMsg]);

    try {
      const cleanHistory = history.filter(c => !c.isPrediction);
      const prediction = await generateAIPrediction(stock.symbol, cleanHistory);
      
      onPredictionUpdate(prediction);
      
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== 'loading-pred');
        return [
          ...filtered, 
          {
            id: Date.now().toString(),
            role: 'model',
            text: prediction?.reasoning || "Analysis complete. I've projected the trend and highlighted the forecast period on the chart.",
            timestamp: new Date()
          }
        ];
      });

    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev.filter(m => m.id !== 'loading-pred'), {
        id: Date.now().toString(),
        role: 'model',
        text: "I encountered an error processing the market data.",
        timestamp: new Date()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const processUserMessage = async (text: string) => {
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    try {
      let context = "";
      if (currentPrediction) {
        context = `[SYSTEM DATA: ACTIVE PREDICTION]
        Trend: ${currentPrediction.trend}
        Confidence: ${currentPrediction.confidence}%
        Risk: ${currentPrediction.riskLevel}
        Reasoning: ${currentPrediction.reasoning}
        Target Price: $${currentPrediction.targetPrice}
        
        [INSTRUCTION]
        The user is asking about the current prediction.
        Format your response neatly using Markdown list or bold headers.
        
        Recommended Structure:
        **Trend Analysis**: Briefly explain the ${currentPrediction.trend} trend.
        **Confidence Score**: Explain ${currentPrediction.confidence}% reliability in simple terms (e.g., high/low certainty).
        **Risk Assessment**: Explain the ${currentPrediction.riskLevel} risk factor.
        **Key Driver**: Explain "${currentPrediction.reasoning}" simply.
        
        Keep it concise, professional, and beginner-friendly. Avoid long paragraphs.`;
      } else {
        context = `[SYSTEM DATA] No active AI prediction is currently generated/displayed on the chart. If the user asks for a forecast, suggest they use the "Generate AI Forecast" button.`;
      }

      const response = await getGeminiChatResponse(text, stock, context);
      
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: response,
        timestamp: new Date()
      }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: "I was unable to process your request at this time.",
        timestamp: new Date()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const textToSend = input;
    setInput('');
    await processUserMessage(textToSend);
  };

  const handleExplainPrediction = () => {
    processUserMessage("Please break down the confidence and risk factors of this prediction.");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      ref={containerRef}
      onMouseDown={handleMouseDown}
      style={{ 
        top: `${position.y}px`, 
        right: `${position.x}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        position: 'absolute'
      }}
      className={`flex flex-col bg-surface/95 dark:bg-[#0B0E14]/90 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 rounded-2xl shadow-2xl z-40 overflow-hidden animate-in fade-in zoom-in-95 duration-200 ${isDragging ? 'cursor-move opacity-90 scale-[1.01]' : ''} transition-transform select-none`}
    >
        {/* Resize Handle - Bottom Left */}
        <div 
          onMouseDown={handleResizeStart}
          className="absolute bottom-0 left-0 w-6 h-6 cursor-sw-resize z-50 group flex items-end p-1"
        >
          <div className="w-2 h-2 border-b-2 border-l-2 border-slate-400 group-hover:border-indigo-500 transition-colors" />
        </div>

        {/* Header / Drag Handle */}
        <div className="drag-handle p-4 border-b border-border flex items-center justify-between bg-white/50 dark:bg-white/5 cursor-move active:bg-slate-100 dark:active:bg-white/10 transition-colors">
            <div className="flex items-center gap-2 pointer-events-none">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                    <Sparkles className="text-white w-4 h-4" />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      Nova Analyst
                      <GripHorizontal size={14} className="text-slate-400 opacity-50" />
                    </h3>
                    <p className="text-[10px] text-slate-500 font-medium">Live Market Context</p>
                </div>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); onClose(); }} 
              className="p-1.5 hover:bg-rose-500/10 hover:text-rose-500 rounded-lg transition-colors text-slate-500"
            >
                <X size={18} />
            </button>
        </div>

        {/* Prediction Stats HUD */}
        {currentPrediction && (
             <div className="bg-indigo-900/10 dark:bg-indigo-900/20 border-b border-indigo-500/10 p-3 grid grid-cols-3 gap-2">
                 <div className="flex flex-col items-center p-1.5 bg-surface/50 dark:bg-black/20 rounded-lg border border-border/50">
                     <span className="text-[9px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-tighter">Trend</span>
                     <div className={`flex items-center gap-1 mt-0.5 font-bold text-[11px] ${currentPrediction.trend === 'UP' ? 'text-emerald-500' : currentPrediction.trend === 'DOWN' ? 'text-rose-500' : 'text-amber-500'}`}>
                         {currentPrediction.trend === 'UP' ? <TrendingUp size={10} /> : <Activity size={10} />}
                         {currentPrediction.trend}
                     </div>
                 </div>
                 <div className="flex flex-col items-center p-1.5 bg-surface/50 dark:bg-black/20 rounded-lg border border-border/50">
                     <span className="text-[9px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-tighter">Conf.</span>
                     <div className="flex items-center gap-1 mt-0.5 font-bold text-[11px] text-indigo-500">
                         <Shield size={10} />
                         {currentPrediction.confidence}%
                     </div>
                 </div>
                 <div className="flex flex-col items-center p-1.5 bg-surface/50 dark:bg-black/20 rounded-lg border border-border/50">
                     <span className="text-[9px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-tighter">Risk</span>
                     <div className={`flex items-center gap-1 mt-0.5 font-bold text-[11px] ${currentPrediction.riskLevel === 'HIGH' ? 'text-rose-500' : currentPrediction.riskLevel === 'MEDIUM' ? 'text-amber-500' : 'text-emerald-500'}`}>
                         <AlertTriangle size={10} />
                         {currentPrediction.riskLevel}
                     </div>
                 </div>
             </div>
        )}

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar select-text">
            {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[90%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                        msg.role === 'user' 
                        ? 'bg-indigo-600 text-white rounded-br-none' 
                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-bl-none'
                    }`}>
                        <div dangerouslySetInnerHTML={{ 
                            __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br />')
                        }} />
                    </div>
                </div>
            ))}
            
            {/* Typing Indicator */}
            {isTyping && (
                <div className="flex justify-start">
                     <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-2xl rounded-bl-none flex gap-1.5 items-center">
                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></span>
                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce delay-75"></span>
                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce delay-150"></span>
                     </div>
                </div>
            )}
            
            {/* Quick Actions */}
            {!isTyping && (
                <div className="flex flex-col gap-2">
                    {!currentPrediction && messages.length < 3 && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleRunForecast(); }}
                            className="w-full py-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 group"
                        >
                            <Sparkles size={14} className="group-hover:scale-110 transition-transform" /> Generate AI Forecast
                        </button>
                    )}
                    
                    {currentPrediction && (
                         <button 
                            onClick={(e) => { e.stopPropagation(); handleExplainPrediction(); }}
                            className="w-full py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 group animate-in fade-in"
                        >
                            <HelpCircle size={14} className="group-hover:scale-110 transition-transform" /> Explain Confidence & Risk
                        </button>
                    )}
                </div>
            )}
            
            <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-3 border-t border-border bg-white/50 dark:bg-white/5">
            <div className="relative flex items-center gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onMouseDown={(e) => e.stopPropagation()} // Prevent drag while typing
                    placeholder="Ask about this chart..."
                    className="flex-1 bg-transparent border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-500 transition-colors text-slate-900 dark:text-white placeholder:text-slate-500"
                />
                <button 
                    onClick={(e) => { e.stopPropagation(); handleSend(); }}
                    disabled={!input.trim() || isTyping}
                    className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20 transition-all"
                >
                    <Send size={16} />
                </button>
            </div>
            <p className="text-[9px] text-center text-slate-400 mt-2">
                Drag header to move • Resize from bottom-left
            </p>
        </div>
    </div>
  );
};

export default IntegratedAI;