import { AIProvider, AIProviderConfig } from '../types';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const SYSTEM_PROMPT = `You are an expert financial analyst and trading assistant for NovaStock,
a stock and crypto trading platform. Help users analyze stocks, understand
technical indicators (RSI, MACD, Moving Averages), evaluate crypto assets,
assess trading risks, and make informed investment decisions.
Be concise, data-driven, and always remind users that this is not
financial advice.`;

export async function sendMessage(
  config: AIProviderConfig,
  messages: ChatMessage[],
  systemPrompt: string = SYSTEM_PROMPT
): Promise<string> {
  switch (config.provider) {
    case 'gemini':
      return sendGeminiMessage(config, messages, systemPrompt);
    case 'openai':
      return sendOpenAIMessage(config, messages, systemPrompt);
    case 'anthropic':
      return sendAnthropicMessage(config, messages, systemPrompt);
    default:
      throw new Error(`Unsupported AI provider: ${config.provider}`);
  }
}

async function sendGeminiMessage(
  config: AIProviderConfig,
  messages: ChatMessage[],
  systemPrompt: string
): Promise<string> {
  try {
    // Import Gemini SDK dynamically to avoid issues if not available
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey: config.apiKey });

    // Convert messages to Gemini format
    const geminiMessages = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    // Add system instruction
    const response = await ai.models.generateContent({
      model: config.model,
      contents: geminiMessages,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      }
    });

    return response.text || 'I apologize, but I couldn\'t generate a response at this time.';
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw new Error('Failed to get response from Gemini API');
  }
}

async function sendOpenAIMessage(
  config: AIProviderConfig,
  messages: ChatMessage[],
  systemPrompt: string
): Promise<string> {
  try {
    const openaiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model,
        messages: openaiMessages,
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error('INVALID_API_KEY');
      }
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'I apologize, but I couldn\'t generate a response at this time.';
  } catch (error) {
    console.error('OpenAI API Error:', error);
    if (error instanceof Error && error.message === 'INVALID_API_KEY') {
      throw error;
    }
    throw new Error('Failed to get response from OpenAI API');
  }
}

async function sendAnthropicMessage(
  config: AIProviderConfig,
  messages: ChatMessage[],
  systemPrompt: string
): Promise<string> {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: 1000,
        system: systemPrompt,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error('INVALID_API_KEY');
      }
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    return data.content?.[0]?.text || 'I apologize, but I couldn\'t generate a response at this time.';
  } catch (error) {
    console.error('Anthropic API Error:', error);
    if (error instanceof Error && error.message === 'INVALID_API_KEY') {
      throw error;
    }
    throw new Error('Failed to get response from Anthropic API');
  }
}

// Default configurations
export const DEFAULT_CONFIGS: Record<AIProvider, Omit<AIProviderConfig, 'apiKey' | 'isCustom'>> = {
  gemini: {
    provider: 'gemini',
    model: 'gemini-2.0-flash-exp',
  },
  openai: {
    provider: 'openai',
    model: 'gpt-4o',
  },
  anthropic: {
    provider: 'anthropic',
    model: 'claude-sonnet-4-6',
  },
};

export const PROVIDER_MODELS = {
  gemini: ['gemini-2.0-flash-exp', 'gemini-1.5-pro', 'gemini-1.5-flash'],
  openai: ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  anthropic: ['claude-sonnet-4-6', 'claude-haiku-4-5'],
} as const;