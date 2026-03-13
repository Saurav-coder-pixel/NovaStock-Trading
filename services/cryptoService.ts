import { CryptoCoin, Candle, TimeFrame } from '../types';

const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3';

// List of top cryptocurrencies to fetch via Binance
export const TOP_CRYPTO_SYMBOLS = [
  { id: 'bitcoin', symbol: 'BTCUSDT', name: 'Bitcoin', image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png' },
  { id: 'ethereum', symbol: 'ETHUSDT', name: 'Ethereum', image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png' },
  { id: 'solana', symbol: 'SOLUSDT', name: 'Solana', image: 'https://assets.coingecko.com/coins/images/4128/large/solana.png' },
  { id: 'binancecoin', symbol: 'BNBUSDT', name: 'BNB', image: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png' },
  { id: 'ripple', symbol: 'XRPUSDT', name: 'XRP', image: 'https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png' },
  { id: 'dogecoin', symbol: 'DOGEUSDT', name: 'Dogecoin', image: 'https://assets.coingecko.com/coins/images/5/large/dogecoin.png' },
  { id: 'cardano', symbol: 'ADAUSDT', name: 'Cardano', image: 'https://assets.coingecko.com/coins/images/975/large/cardano.png' },
  { id: 'avalanche-2', symbol: 'AVAXUSDT', name: 'Avalanche', image: 'https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png' },
  { id: 'matic-network', symbol: 'MATICUSDT', name: 'Polygon', image: 'https://assets.coingecko.com/coins/images/4713/large/matic-token-icon.png' },
  { id: 'polkadot', symbol: 'DOTUSDT', name: 'Polkadot', image: 'https://assets.coingecko.com/coins/images/12171/large/polkadot.png' }
];

export const fetchTopCryptos = async (): Promise<CryptoCoin[]> => {
  try {
    // Using Binance 24hr ticker API
    const response = await fetch('https://api.binance.com/api/v3/ticker/24hr');
    
    if (!response.ok) {
        throw new Error('Failed to fetch crypto data from Binance');
    }

    const data: any[] = await response.json();
    const result: CryptoCoin[] = [];

    TOP_CRYPTO_SYMBOLS.forEach(tc => {
        const binanceData = data.find(d => d.symbol === tc.symbol);
        if (binanceData) {
            const currentPrice = parseFloat(binanceData.lastPrice);
            // Generate a synthetic sparkline to prevent SVG rendering crashes (since 24hr ticker lacks history points)
            const syntheticSparkline = Array.from({length: 20}, (_, i) => 
               currentPrice * (1 + (Math.sin(i) * 0.02) + (Math.random() * 0.01 - 0.005))
            );

            result.push({
                id: tc.id,
                symbol: tc.symbol.replace('USDT', ''),
                name: tc.name,
                image: tc.image,
                price: currentPrice,
                change24h: parseFloat(binanceData.priceChangePercent),
                marketCap: parseFloat(binanceData.quoteVolume) * currentPrice, 
                volume24h: parseFloat(binanceData.quoteVolume),
                sparkline: syntheticSparkline 
            });
        }
    });

    return result;
  } catch (error) {
    console.error('Error fetching top cryptos:', error);
    return [];
  }
};

export const fetchCryptoHistory = async (id: string, days: number = 30): Promise<Candle[]> => {
  try {
    const tcInfo = TOP_CRYPTO_SYMBOLS.find(t => t.id === id);
    if (!tcInfo) throw new Error('Symbol not found');
    
    // Determine interval and limit based on days
    let interval = '1d';
    let limit = days;
    
    if (days === 1) {
       interval = '5m';
       limit = 288;
    } else if (days === 7) {
       interval = '1h';
       limit = 168;
    } else if (days === 90) {
       interval = '1d';
       limit = 90;
    } else if (days === 365) {
       interval = '1w';
       limit = 52;
    }

    const response = await fetch(`https://api.binance.com/api/v3/klines?symbol=${tcInfo.symbol}&interval=${interval}&limit=${limit}`);

    if (!response.ok) {
      throw new Error('Failed to fetch crypto history from Binance');
    }

    const data = await response.json();
    
    return data.map((d: any) => ({
      time: new Date(d[0]).toISOString(),
      open: parseFloat(d[1]),
      high: parseFloat(d[2]),
      low: parseFloat(d[3]),
      close: parseFloat(d[4]),
      volume: parseFloat(d[5]),
      isPrediction: false
    }));
  } catch (error) {
    console.error('Error fetching crypto history:', error);
    return [];
  }
};

// Manage WebSocket connection for real-time prices
type CryptoListener = (cryptos: CryptoCoin[]) => void;
const cryptoListeners: Set<CryptoListener> = new Set();
let ws: WebSocket | null = null;
let cachedCryptos: CryptoCoin[] = [];

export const subscribeToCryptoUpdates = (callback: CryptoListener, intervalMs: number = 10000) => {
  cryptoListeners.add(callback);
  
  // Immediately send cached data if available
  if (cachedCryptos.length > 0) {
    callback(cachedCryptos);
  } else {
    // Fetch immediately on first sub
    fetchTopCryptos().then(data => {
      cachedCryptos = data;
      callback(data);
    });
  }

  // Manage WebSocket
  if (!ws && typeof window !== 'undefined') {
    const streams = TOP_CRYPTO_SYMBOLS.map(t => `${t.symbol.toLowerCase()}@ticker`).join('/');
    ws = new WebSocket(`wss://stream.binance.com:9443/ws/${streams}`);
    
    ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        const { s: symbol, c: lastPrice, P: priceChangePercent, q: quoteVolume } = message;
        
        let updated = false;
        cachedCryptos = cachedCryptos.map(coin => {
            const tcInfo = TOP_CRYPTO_SYMBOLS.find(t => t.id === coin.id);
            if (tcInfo && tcInfo.symbol === symbol) {
                updated = true;
                return {
                    ...coin,
                    price: parseFloat(lastPrice),
                    change24h: parseFloat(priceChangePercent),
                    marketCap: parseFloat(quoteVolume) * 100, // Est marketCap update
                    volume24h: parseFloat(quoteVolume)
                };
            }
            return coin;
        });

        if (updated && cryptoListeners.size > 0) {
            cryptoListeners.forEach(cb => cb([...cachedCryptos]));
        }
    };

    ws.onerror = (error) => {
        console.error("Binance WebSocket Error:", error);
    };

    ws.onclose = () => {
        ws = null;
    };
  }

  return () => {
    cryptoListeners.delete(callback);
    // Cleanup if no listeners
    if (cryptoListeners.size === 0 && ws) {
      ws.close();
      ws = null;
    }
  };
};
