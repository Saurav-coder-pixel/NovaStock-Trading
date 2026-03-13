import { GoogleGenAI } from "@google/genai";
import { CryptoCoin, Candle } from "../types";

const API_KEY = process.env.API_KEY || ''; 
const ai = new GoogleGenAI({ apiKey: API_KEY });

const SYSTEM_INSTRUCTION = `
You are Nova Crypto, an elite AI Cryptocurrency Analyst. 
Your goal is to provide concise, data-driven insights on crypto market trends based on the data provided.
You are analytical, objective, and professional.

IMPORTANT RULES:
1. Always include a disclaimer: "This is AI-generated analysis, not financial advice."
2. Analyze the provided OHLC and volume history data to identify support/resistance and trends.
3. Be concise. Use markdown for formatting.
4. Structure the response clearly corresponding to the requested questions.
`;

export const getCryptoGeminiAnalysis = async (
  coin: CryptoCoin,
  history: Candle[]
) => {
  try {
    const model = 'gemini-3-flash-preview';
    
    // Extract recent data
    const last30Days = history.slice(-30);
    const priceArray = last30Days.map(c => c.close.toFixed(2)).join(', ');
    const volumeArray = last30Days.map(c => Math.round(c.volume)).join(', ');
    
    // Calculate a basic RSI string representation based on recent trend (since full RSI might not be pre-calculated in history)
    // For the prompt, we typically calculate RSI, but since CoinGecko history is raw prices, we'll let Gemini analyze the raw array, or we can provide a dummy/estimated RSI if we don't calculate it client-side.
    // Let's pass the raw data and let the LLM do its job as requested in the template.
    
    const fullPrompt = `You are a cryptocurrency market analyst. Analyze the following data for ${coin.name} (${coin.symbol}):

Current Price: $${coin.price}
24h Change: ${coin.change24h}%
Market Cap: $${coin.marketCap}
30-day price history (daily close): [${priceArray}]
30-day volume history: [${volumeArray}]
Current RSI (14-day): [Please calculate an estimated RSI based on the 30-day price history provided above]

Based on this data:
1. What is the short-term price outlook (1-7 days)?
2. What is the medium-term outlook (1-3 months)?
3. What are key support and resistance levels?
4. What is the risk level (High/Medium/Low)?
5. What action would you recommend? (Hold, Buy the dip, Take profits, Watch and wait)
Provide 3 bullet-point reasons backing the prediction.

Provide a structured, concise analysis with clear reasoning. End with a disclaimer that this is not financial advice.`;

    const response = await ai.models.generateContent({
      model: model,
      contents: fullPrompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      }
    });

    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I'm currently unable to connect to the crypto analysis network. Please try again later.\n\n*This is AI-generated analysis, not financial advice.*";
  }
};
