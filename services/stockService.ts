import { Candle, Stock, TimeFrame } from '../types';

// Mock list of stocks
export const WATCHLIST: Stock[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', price: 175.43, change: 1.25, changePercent: 0.72, volume: 45000000, sector: 'Technology' },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 890.12, change: 15.30, changePercent: 1.75, volume: 32000000, sector: 'Technology' },
  { symbol: 'TSLA', name: 'Tesla Inc.', price: 168.90, change: -2.40, changePercent: -1.40, volume: 89000000, sector: 'Automotive' },
  { symbol: 'AMZN', name: 'Amazon.com', price: 180.25, change: 0.90, changePercent: 0.50, volume: 22000000, sector: 'Retail' },
  { symbol: 'MSFT', name: 'Microsoft Corp', price: 420.55, change: 3.10, changePercent: 0.74, volume: 18000000, sector: 'Technology' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 155.60, change: -0.50, changePercent: -0.32, volume: 15000000, sector: 'Technology' },
];

// Helper to calculate SMA
const calculateSMA = (data: Candle[], period: number, index: number): number | undefined => {
  if (index < period - 1) return undefined;
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[index - i].close;
  }
  return sum / period;
};

// Helper to calculate RSI
const calculateRSI = (data: Candle[], period: number = 14) => {
  let gains = 0;
  let losses = 0;
  
  // First average
  for (let i = 1; i <= period; i++) {
    const change = data[i].close - data[i - 1].close;
    if (change > 0) gains += change;
    else losses -= change;
  }
  
  let avgGain = gains / period;
  let avgLoss = losses / period;
  
  // Subsequent values
  for (let i = period + 1; i < data.length; i++) {
    const change = data[i].close - data[i - 1].close;
    if (change > 0) {
      avgGain = (avgGain * (period - 1) + change) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) - change) / period;
    }
    
    const rs = avgGain / (avgLoss === 0 ? 1 : avgLoss);
    data[i].rsi = 100 - (100 / (1 + rs));
  }
};

// Helper to calculate MACD (Simplified)
const calculateMACD = (data: Candle[]) => {
  // Approximate EMAs with SMAs for this mock data generator to keep it light
  // Real implementation would use recursive EMA
  for (let i = 26; i < data.length; i++) {
    const ema12 = calculateSMA(data, 12, i) || data[i].close;
    const ema26 = calculateSMA(data, 26, i) || data[i].close;
    const macd = ema12 - ema26;
    data[i].macd = macd;
  }
  
  // Signal line (9 period SMA of MACD)
  for (let i = 35; i < data.length; i++) {
     let sum = 0;
     for(let j=0; j<9; j++) {
       sum += data[i-j].macd || 0;
     }
     const signal = sum / 9;
     data[i].macdSignal = signal;
     data[i].macdHist = (data[i].macd || 0) - signal;
  }
};

// Helper to generate random candles
export const generateHistory = (symbol: string, timeframe: TimeFrame): Candle[] => {
  const data: Candle[] = [];
  let points = 100;
  let intervalMinutes = 60; // Default 1H

  switch (timeframe) {
    case TimeFrame.D1: points = 48; intervalMinutes = 30; break; // Every 30 mins
    case TimeFrame.W1: points = 84; intervalMinutes = 120; break;
    case TimeFrame.M1: points = 30; intervalMinutes = 1440; break; // Daily
    case TimeFrame.M3: points = 90; intervalMinutes = 1440; break;
    case TimeFrame.Y1: points = 52; intervalMinutes = 10080; break; // Weekly
  }

  // Increase points slightly to allow indicators to warm up, then slice
  const warmupPoints = 35;
  const totalPoints = points + warmupPoints;

  // Seed price based on symbol
  const stock = WATCHLIST.find(s => s.symbol === symbol);
  const targetCurrentPrice = stock?.price || 100;
  const targetChange = stock?.change || 0;

  let targetStartPrice = targetCurrentPrice;
  if (timeframe === TimeFrame.D1) {
    targetStartPrice = targetCurrentPrice - targetChange;
  } else {
    // For other timeframes, create a stable pseudo-random trend based on the symbol
    const hash = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const trend = ((hash % 20) - 10) / 100; // -10% to +10%
    
    let multiplier = 1;
    if (timeframe === TimeFrame.W1) multiplier = 2;
    if (timeframe === TimeFrame.M1) multiplier = 4;
    if (timeframe === TimeFrame.M3) multiplier = 8;
    if (timeframe === TimeFrame.Y1) multiplier = 20;
    
    targetStartPrice = targetCurrentPrice * (1 - trend * multiplier);
  }

  // Start date back in time
  let time = new Date();
  time.setMinutes(time.getMinutes() - (totalPoints * intervalMinutes));

  // Generate random walk
  const walk = [];
  let currentPrice = targetStartPrice;
  for (let i = 0; i < totalPoints; i++) {
    const volatility = currentPrice * 0.005; // 0.5% volatility
    const change = (Math.random() - 0.5) * volatility;
    
    const open = currentPrice;
    const close = currentPrice + change;
    const high = Math.max(open, close) + Math.random() * (volatility * 0.5);
    const low = Math.min(open, close) - Math.random() * (volatility * 0.5);
    const volume = Math.floor(Math.random() * 1000000) + 500000;

    walk.push({ open, high, low, close, volume });
    currentPrice = close;
  }

  // Apply linear transformation to force start and end prices of the visible chart
  const i_start = warmupPoints;
  const i_end = totalPoints - 1;
  
  const wStart = walk[i_start].open;
  const wEnd = walk[i_end].close;
  
  const offsetStart = targetStartPrice - wStart;
  const offsetEnd = targetCurrentPrice - wEnd;
  
  const B = (offsetEnd - offsetStart) / (i_end - i_start);
  const A = offsetStart - B * i_start;

  for (let i = 0; i < totalPoints; i++) {
    const adjustment = A + B * i;
    const w = walk[i];
    
    const candle: Candle = {
      time: time.toISOString(),
      open: Math.max(0.01, w.open + adjustment),
      high: Math.max(0.01, w.high + adjustment),
      low: Math.max(0.01, w.low + adjustment),
      close: Math.max(0.01, w.close + adjustment),
      volume: w.volume,
      isPrediction: false
    };
    
    data.push(candle);
    time = new Date(time.getTime() + intervalMinutes * 60000);
  }

  // Calculate Indicators
  for (let i = 0; i < data.length; i++) {
    data[i].ma7 = calculateSMA(data, 7, i);
    data[i].ma25 = calculateSMA(data, 25, i);
  }
  calculateRSI(data);
  calculateMACD(data);

  // Return only the requested points, slicing off warmup
  return data.slice(warmupPoints);
};

// Simulate live updates
type Listener = (stock: Stock) => void;
const listeners: Map<string, Listener[]> = new Map();

export const subscribeToTicker = (symbol: string, callback: Listener) => {
  if (!listeners.has(symbol)) {
    listeners.set(symbol, []);
  }
  listeners.get(symbol)?.push(callback);

  // Start simulation if not already running globally (mock implementation simplified)
  const interval = setInterval(() => {
    const stock = WATCHLIST.find(s => s.symbol === symbol);
    if (stock) {
      // Random walk
      const delta = (Math.random() - 0.45) * (stock.price * 0.002);
      stock.price += delta;
      stock.change += delta;
      stock.changePercent = (stock.change / (stock.price - stock.change)) * 100;
      
      callback({ ...stock });
    }
  }, 3000);

  return () => {
    const list = listeners.get(symbol);
    if (list) {
      const index = list.indexOf(callback);
      if (index > -1) list.splice(index, 1);
    }
    clearInterval(interval);
  };
};

export const fetchStockHistory = async (symbol: string, timeframe: string): Promise<Candle[]> => {
  try {
    let interval = '1d';
    let range = '1y';
    if (timeframe === '1m') { interval = '1m'; range = '1d'; }
    else if (timeframe === '5m') { interval = '5m'; range = '5d'; }
    else if (timeframe === '15m') { interval = '15m'; range = '5d'; }
    else if (timeframe === '1H') { interval = '1h'; range = '1mo'; }
    else if (timeframe === '4H') { interval = '1h'; range = '3mo'; }
    else if (timeframe === '1D') { interval = '1d'; range = '1y'; }
    else if (timeframe === '1W') { interval = '1wk'; range = '2y'; }

    // Use a CORS proxy
    const targetUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${interval}&range=${range}`;
    const url = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Yahoo Finance API returned ${response.status}`);
    const data = await response.json();
    
    const result = data.chart.result[0];
    const timestamps = result.timestamp;
    const quote = result.indicators.quote[0];
    
    if (!timestamps || !quote) throw new Error('Invalid data model');
    
    const candles: Candle[] = [];
    for (let i = 0; i < timestamps.length; i++) {
        if (quote.open[i] === null || quote.close[i] === null) continue;
        
        candles.push({
            time: new Date(timestamps[i] * 1000).toISOString(),
            open: quote.open[i],
            high: quote.high[i],
            low: quote.low[i],
            close: quote.close[i],
            volume: quote.volume[i] || 0,
            isPrediction: false
        });
    }
    
    if (candles.length === 0) throw new Error('No valid candles parsed');
    return candles;
  } catch (err) {
    console.warn('Yahoo Finance fetch failed, using mock generator.', err);
    // fallback to mock generator
    return generateHistory(symbol, timeframe as TimeFrame || TimeFrame.D1);
  }
};