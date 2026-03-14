
export type AIProvider = 'gemini' | 'openai' | 'anthropic';

export interface AIProviderConfig {
  provider: AIProvider;
  apiKey: string;
  model: string;
  isCustom: boolean;
}

export interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  sector: string;
}

export interface Candle {
  time: string; // ISO String or readable time
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  isPrediction?: boolean;
  // Technical Indicators
  ma7?: number;
  ma25?: number;
  rsi?: number;
  macd?: number;
  macdSignal?: number;
  macdHist?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
  timestamp: Date;
  isTyping?: boolean;
}

export enum TimeFrame {
  D1 = '1D',
  W1 = '1W',
  M1 = '1M',
  M3 = '3M',
  Y1 = '1Y',
}

export interface PredictionResult {
  confidence: number;
  trend: 'UP' | 'DOWN' | 'NEUTRAL';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  targetPrice: number;
  reasoning: string;
  predictedPath?: number[];
}

export type ViewType = 'dashboard' | 'market' | 'portfolio' | 'settings' | 'worldmonitor' | 'cryptotrading' | 'novaai';

export interface Holding {
  symbol: string;
  quantity: number;
  avgCost: number;
}

export interface CryptoCoin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  price: number;
  change24h: number;
  marketCap: number;
  volume24h: number;
  sparkline: number[];
}

export interface CryptoStats {
  id: string;
  price: number;
  change24h: number;
  marketCap: number;
  volume24h: number;
}
