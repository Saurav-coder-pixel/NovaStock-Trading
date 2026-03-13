# NovaStock Trading

A production-ready, AI-powered stock exchange platform featuring real-time NYSE data simulation, interactive technical charts, and a Gemini-powered financial assistant.

## 🚀 Features

### Core Trading Platform
- **Real-time Market Data**: Simulated NYSE data with live price updates
- **Interactive Charts**: Advanced technical analysis with multiple indicators
- **Multi-Asset Support**: Track and compare multiple stocks simultaneously
- **Portfolio Management**: Comprehensive portfolio tracking and analysis

### AI-Powered Analytics
- **Gemini AI Assistant**: Intelligent financial analysis and market insights
- **Price Predictions**: AI-driven trend analysis and forecasting
- **Technical Indicators**: RSI, MACD, Moving Averages with automated analysis
- **Risk Assessment**: AI-powered risk evaluation for trading decisions

### User Experience
- **Dark/Light Theme**: Modern UI with theme switching
- **Responsive Design**: Optimized for desktop and mobile devices
- **Real-time Updates**: Live data streaming and notifications
- **Intuitive Navigation**: Clean sidebar navigation with multiple views

## 🛠️ Technology Stack

- **Frontend**: React 19.2.3 with TypeScript
- **Build Tool**: Vite 6.2.0
- **Charts**: Recharts 3.6.0
- **AI Integration**: Google Gemini AI (@google/genai)
- **Icons**: Lucide React
- **Styling**: Tailwind CSS (via className utilities)

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd NovaStock-Trading-1
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   API_KEY=your_google_gemini_api_key_here
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## 🏗️ Project Structure

```
NovaStock-Trading-1/
├── components/
│   ├── Charts/
│   │   └── MarketChart.tsx          # Interactive price charts
│   ├── Chat/
│   │   └── Assistant.tsx            # AI assistant interface
│   ├── Dashboard/
│   │   ├── DashboardHome.tsx        # Main dashboard view
│   │   └── StockHeader.tsx          # Stock selection header
│   ├── Layout/
│   │   └── Sidebar.tsx              # Navigation sidebar
│   ├── Market/
│   │   ├── IntegratedAI.tsx         # AI prediction interface
│   │   └── MarketOverview.tsx       # Market data display
│   ├── Portfolio/
│   │   └── Portfolio.tsx            # Portfolio management
│   └── Settings/
│       └── Settings.tsx             # Application settings
├── services/
│   ├── geminiService.ts             # Gemini AI integration
│   └── stockService.ts              # Stock data simulation
├── types.ts                         # TypeScript type definitions
├── App.tsx                          # Main application component
├── index.tsx                        # Application entry point
└── package.json                     # Project dependencies
```

## 🎯 Key Components

### MarketChart
Advanced charting component featuring:
- Candlestick charts with technical indicators
- AI prediction overlays
- Multi-stock comparison
- Interactive tooltips with detailed information

### AI Assistant
Powered by Google Gemini with capabilities for:
- Market analysis and insights
- Price prediction with confidence scores
- Risk assessment
- Technical indicator interpretation

### Real-time Data
Simulated live market data including:
- Price updates every few seconds
- Volume tracking
- Historical data generation
- Multi-timeframe support (1D, 1W, 1M, 3M, 1Y)

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## 🤖 AI Features

### Market Analysis
The AI assistant provides:
- Real-time market sentiment analysis
- Technical indicator explanations
- Trading strategy suggestions
- Risk assessment reports

### Price Predictions
- Short-term price forecasting
- Confidence scoring
- Risk level assessment (Low/Medium/High)
- Visual prediction overlays on charts

## 📊 Technical Indicators

- **Moving Averages**: 7-day and 25-day MA
- **RSI (Relative Strength Index)**: Momentum oscillator
- **MACD**: Trend-following momentum indicator
- **Volume Analysis**: Trading volume visualization

## 🎨 Themes

The application supports both dark and light themes with:
- Automatic system preference detection
- Manual theme switching
- Consistent theming across all components
- Accessible color schemes

## 📱 Responsive Design

Optimized for all screen sizes:
- Desktop: Full feature set with multi-panel layout
- Tablet: Adapted navigation and chart sizing
- Mobile: Streamlined interface with collapsible menus

## 🔒 Security & Privacy

- Client-side only application
- No user data storage
- API keys managed via environment variables
- Simulated data for demonstration purposes

## 🚀 Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Deploy the `dist` folder to your hosting service

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is for educational and demonstration purposes.

## ⚠️ Disclaimer

This application uses simulated market data and AI-powered analysis for educational purposes only. Not intended for actual trading or financial advice. Always consult with qualified financial professionals before making investment decisions.

---

**Built with ❤️ using React, TypeScript, and AI**