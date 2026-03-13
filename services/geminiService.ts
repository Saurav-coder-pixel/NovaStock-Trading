import { GoogleGenAI, Type } from "@google/genai";
import { Candle, Stock } from "../types";

const API_KEY = process.env.API_KEY || ''; 
const ai = new GoogleGenAI({ apiKey: API_KEY });

const SYSTEM_INSTRUCTION = `
You are Nova, an elite AI Financial Analyst for a high-frequency trading platform. 
Your goal is to provide concise, data-driven insights on stock market trends.
You are analytical, objective, and professional, but accessible.

IMPORTANT RULES:
1. Always include a disclaimer: "Not financial advice."
2. Analyze technical indicators (RSI, MACD, Moving Averages) if data is provided.
3. Be concise. Use markdown for formatting.
4. If asked to predict, assess trends but emphasize uncertainty.
`;

export const getGeminiChatResponse = async (
  message: string, 
  currentStock: Stock, 
  contextData?: string
) => {
  try {
    const model = 'gemini-3-flash-preview';
    
    let fullPrompt = `User Query: "${message}"\n\n`;
    fullPrompt += `Current Focus Stock: ${currentStock.symbol} (${currentStock.name}) Price: $${currentStock.price.toFixed(2)}\n`;
    
    if (contextData) {
      fullPrompt += `Recent Market Data Context: ${contextData}\n`;
    }

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
    return "I'm currently unable to connect to the market analysis network. Please try again later.";
  }
};

export const generateAIPrediction = async (symbol: string, history: Candle[]) => {
  try {
    const model = 'gemini-3-flash-preview'; 
    
    // Filter history to ensure no previous predictions are included if the caller didn't filter
    const cleanHistory = history.filter(c => !c.isPrediction);
    
    // Simplify history to reduce token count for demo
    const simplifiedHistory = cleanHistory.slice(-20).map(c => 
      `${c.time.split('T')[0]}: Close $${c.close.toFixed(2)}, Vol ${c.volume}`
    ).join('\n');

    const prompt = `
      Analyze the following 20-day price history for ${symbol}:
      ${simplifiedHistory}

      Perform a technical analysis simulation.
      Return a JSON object with the following structure:
      {
        "trend": "UP" | "DOWN" | "NEUTRAL",
        "confidence": number (0-100),
        "riskLevel": "LOW" | "MEDIUM" | "HIGH",
        "targetPrice": number (predicted price in 5 periods),
        "reasoning": "Short string explaining why (max 15 words)",
        "predictedPath": [number, number, number, number, number] (next 5 closing prices)
      }
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            trend: { type: Type.STRING, enum: ["UP", "DOWN", "NEUTRAL"] },
            confidence: { type: Type.NUMBER },
            riskLevel: { type: Type.STRING, enum: ["LOW", "MEDIUM", "HIGH"] },
            targetPrice: { type: Type.NUMBER },
            reasoning: { type: Type.STRING },
            predictedPath: { 
              type: Type.ARRAY, 
              items: { type: Type.NUMBER } 
            }
          }
        }
      }
    });

    let jsonString = response.text || '{}';
    // Remove markdown code blocks if present
    if (jsonString.includes('```json')) {
      jsonString = jsonString.replace(/```json/g, '').replace(/```/g, '');
    } else if (jsonString.includes('```')) {
      jsonString = jsonString.replace(/```/g, '');
    }
    
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Prediction Error:", error);
    return null;
  }
};