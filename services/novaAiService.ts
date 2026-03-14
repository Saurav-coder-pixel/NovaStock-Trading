import { AIProviderConfig, Stock, CryptoCoin } from '../types';
import { sendMessage } from './aiProviderService';

// ── System Prompt ─────────────────────────────────────────────────────────────
export const NOVA_SYSTEM_PROMPT = `You are Nova, an elite AI Financial Analyst and Trading Strategist for NovaTrade — a premium stock and cryptocurrency trading platform.

Your expertise covers:
- Stock market analysis (equities, ETFs, indices)
- Cryptocurrency analysis (Bitcoin, Ethereum, altcoins, DeFi)
- Technical analysis (RSI, MACD, Moving Averages, Bollinger Bands, Volume)
- Fundamental analysis (P/E ratios, market cap, sector trends)
- Portfolio optimization and risk management
- Buy / Hold / Sell recommendations with clear rationale
- Asset comparison and correlation analysis
- Market sentiment and macroeconomic context

RESPONSE RULES:
1. Always be concise but insightful. Use bullet points and sections for clarity.
2. When asked to predict: give a directional bias (Bullish 📈 / Bearish 📉 / Neutral ➡️), confidence %, key reasoning, key risks, and a suggested price target range.
3. When comparing assets: use a structured table or side-by-side breakdown (momentum, risk, upside potential).
4. When giving buy/sell guidance: state the signals (BUY 🟢 / SELL 🔴 / HOLD 🟡), entry/exit price zones if possible, and stop-loss hint.
5. Use relevant emojis to make responses visually scannable (📊 📈 📉 🟢 🔴 🟡 ⚠️ 💡).
6. Always end predictions with: "⚠️ Not financial advice. Always do your own research."
7. If live market data is provided, reference it directly in your analysis.
8. Keep responses under 400 words unless a detailed comparison is requested.
`;

// ── Quick Action Chips ────────────────────────────────────────────────────────
export const QUICK_ACTIONS = [
  { label: '📈 Predict Bitcoin', prompt: 'Give me a prediction for Bitcoin (BTC) over the next 7 days. Include trend direction, confidence, price target, key signals, and risks.' },
  { label: '📊 Compare BTC vs ETH', prompt: 'Compare Bitcoin (BTC) vs Ethereum (ETH). Which one has better upside potential right now? Give me a structured comparison.' },
  { label: '🟢 Should I buy AAPL?', prompt: 'Analyze Apple (AAPL) stock. Should I buy, hold, or sell right now? Give me your recommendation with key signals.' },
  { label: '📉 Predict TSLA', prompt: 'Give me a technical and fundamental prediction for Tesla (TSLA) stock for the next 2 weeks.' },
  { label: '🔥 Top stocks to buy', prompt: 'Based on current market conditions, what are the top 3 stocks to consider buying right now? Compare them briefly.' },
  { label: '💎 Best crypto to hold', prompt: 'Which cryptocurrencies have the strongest long-term hold potential right now? Compare the top 3.' },
  { label: '⚖️ Compare MSFT vs GOOGL', prompt: 'Compare Microsoft (MSFT) vs Alphabet/Google (GOOGL). Which one is a better investment right now? Include valuation and momentum.' },
  { label: '🌍 Market sentiment', prompt: 'What is the current overall market sentiment for stocks and crypto? Is it bullish or bearish? What are the key macro drivers?' },
  { label: '🛡️ Low-risk crypto picks', prompt: 'What are the lowest-risk cryptocurrencies to invest in right now? Explain why they are safer than altcoins.' },
  { label: '📊 NVDA analysis', prompt: 'Give me a full analysis of NVIDIA (NVDA) stock. Is it overbought or still has room to grow? Include RSI, momentum, and fundamental perspective.' },
];

// ── Build context string from live market data ─────────────────────────────────
export const buildMarketContext = (stocks: Stock[], cryptos: CryptoCoin[]): string => {
  const lines: string[] = ['=== LIVE MARKET DATA (for your analysis) ==='];

  if (stocks.length > 0) {
    lines.push('\n📊 Stocks:');
    stocks.forEach(s => {
      const sign = s.change >= 0 ? '+' : '';
      lines.push(`  ${s.symbol} (${s.name}): $${s.price.toFixed(2)} | ${sign}${s.changePercent.toFixed(2)}% today | Vol: ${(s.volume / 1_000_000).toFixed(1)}M`);
    });
  }

  if (cryptos.length > 0) {
    lines.push('\n₿ Crypto:');
    cryptos.forEach(c => {
      const sign = c.change24h >= 0 ? '+' : '';
      lines.push(`  ${c.symbol} (${c.name}): $${c.price.toFixed(2)} | ${sign}${c.change24h.toFixed(2)}% 24h | Vol: $${(c.volume24h / 1_000_000).toFixed(0)}M`);
    });
  }

  lines.push('\n=== END MARKET DATA ===\n');
  return lines.join('\n');
};

// ── Main send function ────────────────────────────────────────────────────────
export const sendNovaMessage = async (
  config: AIProviderConfig,
  messages: { role: 'user' | 'assistant'; content: string }[],
  stocks: Stock[],
  cryptos: CryptoCoin[]
): Promise<string> => {
  const marketCtx = buildMarketContext(stocks, cryptos);

  // Prepend context to the last user message
  const enrichedMessages = messages.map((msg, idx) => {
    if (idx === messages.length - 1 && msg.role === 'user') {
      return { ...msg, content: `${marketCtx}\nUser question: ${msg.content}` };
    }
    return msg;
  });

  return sendMessage(config, enrichedMessages, NOVA_SYSTEM_PROMPT);
};
