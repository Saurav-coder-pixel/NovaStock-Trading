import React, { useState, useEffect } from 'react';
import { 
  User, Bell, Shield, CreditCard, Moon, Globe, LogOut, 
  Layout, Database, Check, AlertTriangle, Smartphone, Mail, 
  Zap, Monitor, Grid, BarChart2, Server, Wifi, Bot, Eye, EyeOff,
  Settings as SettingsIcon
} from 'lucide-react';
import { AIProvider, AIProviderConfig } from '../../types';
import { DEFAULT_CONFIGS, PROVIDER_MODELS, sendMessage } from '../../services/aiProviderService';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [notifications, setNotifications] = useState({
    email_alerts: true,
    push_marketing: false,
    sms_security: true,
    daily_digest: true,
    price_volatility: true
  });
  const [chartPrefs, setChartPrefs] = useState({
    theme: 'classic',
    showGrid: true,
    showVolume: true,
    extendedHours: false
  });

  const renderContent = () => {
    switch (activeTab) {
      case 'general':
        return <GeneralSettings />;
      case 'appearance':
        return <AppearanceSettings prefs={chartPrefs} setPrefs={setChartPrefs} />;
      case 'notifications':
        return <NotificationSettings prefs={notifications} setPrefs={setNotifications} />;
      case 'ai':
        return <AIAssistantSettings />;
      case 'api':
        return <APISettings />;
      default:
        return <GeneralSettings />;
    }
  };

  const navItems = [
    { id: 'general', label: 'General Profile', icon: User },
    { id: 'appearance', label: 'Appearance & Charts', icon: Layout },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'ai', label: 'AI Assistant', icon: Bot },
    { id: 'api', label: 'API & Data', icon: Database },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'billing', label: 'Billing & Plans', icon: CreditCard },
  ];

  return (
    <div className="max-w-5xl mx-auto animate-fade-in h-[calc(100vh-140px)] flex flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">Settings</h1>
        <p className="text-slate-500 dark:text-slate-400">Manage your workspace, preferences, and connections.</p>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-8 h-full overflow-hidden">
        {/* Navigation Sidebar */}
        <div className="md:col-span-1 flex flex-col h-full">
           <nav className="space-y-1 flex-1">
             {navItems.map((item) => (
               <button 
                 key={item.id}
                 onClick={() => setActiveTab(item.id)}
                 className={`w-full text-left px-4 py-3 rounded-lg font-medium text-sm flex items-center gap-3 transition-colors ${
                   activeTab === item.id 
                    ? 'bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 border border-transparent'
                 }`}
               >
                 <item.icon size={18} /> {item.label}
               </button>
             ))}
           </nav>
           
           <button className="w-full text-left px-4 py-3 rounded-lg text-rose-500 dark:text-rose-400 hover:text-rose-600 dark:hover:text-rose-300 hover:bg-rose-500/10 font-medium text-sm flex items-center gap-3 transition-colors mt-auto border border-transparent hover:border-rose-500/20">
             <LogOut size={18} /> Sign Out
           </button>
        </div>

        {/* Content Area */}
        <div className="md:col-span-3 bg-surface border border-border rounded-2xl p-6 lg:p-8 overflow-y-auto custom-scrollbar shadow-2xl">
           {renderContent()}
        </div>
      </div>
    </div>
  );
};

// --- Subcomponents ---

const GeneralSettings = () => (
  <div className="space-y-8 animate-fade-in">
    <div>
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
        <User size={20} className="text-indigo-500 dark:text-indigo-400" /> Profile Information
      </h3>
      <div className="flex items-center gap-6 mb-8">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-3xl font-bold text-white shadow-lg ring-4 ring-white dark:ring-[#151921]">
            A
          </div>
          <div>
            <div className="flex gap-3 mb-2">
              <button className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition-colors font-medium">Upload New</button>
              <button className="text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors">Remove</button>
            </div>
            <p className="text-xs text-slate-500">Recommended: 400x400px JPG, PNG.</p>
          </div>
      </div>
      <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">First Name</label>
            <input type="text" defaultValue="Alex" className="w-full bg-slate-50 dark:bg-[#0B0E14] border border-border rounded-xl px-4 py-3 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Last Name</label>
            <input type="text" defaultValue="Morgan" className="w-full bg-slate-50 dark:bg-[#0B0E14] border border-border rounded-xl px-4 py-3 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" />
          </div>
          <div className="col-span-2 space-y-2">
            <label className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Email Address</label>
            <input type="email" defaultValue="alex.morgan@example.com" className="w-full bg-slate-50 dark:bg-[#0B0E14] border border-border rounded-xl px-4 py-3 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" />
          </div>
          <div className="col-span-2 space-y-2">
            <label className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Bio</label>
            <textarea rows={3} defaultValue="Senior Quantitative Trader focused on high-frequency arbitrage strategies." className="w-full bg-slate-50 dark:bg-[#0B0E14] border border-border rounded-xl px-4 py-3 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none" />
          </div>
      </div>
    </div>
    
    <div className="flex justify-end pt-4 border-t border-border">
      <button className="bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-slate-800 dark:hover:bg-slate-200 px-6 py-2.5 rounded-lg text-sm font-bold transition-colors">
        Save Changes
      </button>
    </div>
  </div>
);

const AppearanceSettings = ({ prefs, setPrefs }: any) => (
  <div className="space-y-8 animate-fade-in">
    <div>
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
        <Layout size={20} className="text-indigo-500 dark:text-indigo-400" /> Chart Theme
      </h3>
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { id: 'classic', label: 'Classic', color: 'bg-[#10b981]' },
          { id: 'midnight', label: 'Midnight', color: 'bg-indigo-500' },
          { id: 'contrast', label: 'High Contrast', color: 'bg-white' }
        ].map((theme) => (
          <button 
            key={theme.id}
            onClick={() => setPrefs({...prefs, theme: theme.id})}
            className={`relative p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-3 ${
              prefs.theme === theme.id 
                ? 'border-indigo-500 bg-indigo-500/10' 
                : 'border-border bg-slate-50 dark:bg-[#0B0E14] hover:border-slate-400 dark:hover:border-slate-700'
            }`}
          >
            <div className={`w-full h-24 rounded-lg bg-slate-200 dark:bg-slate-900 relative overflow-hidden`}>
              {/* Mock Chart */}
              <div className="absolute inset-0 flex items-center justify-center">
                 <div className="flex items-end gap-1 h-12">
                    <div className={`w-2 h-8 ${theme.color} opacity-40 rounded-sm`}></div>
                    <div className={`w-2 h-12 ${theme.color} rounded-sm`}></div>
                    <div className={`w-2 h-6 ${theme.color} opacity-60 rounded-sm`}></div>
                 </div>
              </div>
            </div>
            <span className={`text-sm font-medium ${prefs.theme === theme.id ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>{theme.label}</span>
            {prefs.theme === theme.id && (
              <div className="absolute top-2 right-2 bg-indigo-600 rounded-full p-1">
                <Check size={12} className="text-white" />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>

    <div>
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
        <Monitor size={20} className="text-indigo-500 dark:text-indigo-400" /> Display Options
      </h3>
      <div className="space-y-4">
        <ToggleRow 
          label="Show Grid Lines" 
          description="Display background grid on technical charts"
          active={prefs.showGrid} 
          onChange={() => setPrefs({...prefs, showGrid: !prefs.showGrid})} 
          icon={<Grid size={18} />}
        />
        <ToggleRow 
          label="Show Volume Histogram" 
          description="Display trading volume bars below price action"
          active={prefs.showVolume} 
          onChange={() => setPrefs({...prefs, showVolume: !prefs.showVolume})} 
          icon={<BarChart2 size={18} />}
        />
        <ToggleRow 
          label="Extended Hours" 
          description="Show pre-market and after-hours trading data"
          active={prefs.extendedHours} 
          onChange={() => setPrefs({...prefs, extendedHours: !prefs.extendedHours})} 
          icon={<Moon size={18} />}
        />
      </div>
    </div>
  </div>
);

const NotificationSettings = ({ prefs, setPrefs }: any) => (
  <div className="space-y-8 animate-fade-in">
    <div>
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
        <Bell size={20} className="text-indigo-500 dark:text-indigo-400" /> Alert Preferences
      </h3>
      <div className="bg-slate-50 dark:bg-[#0B0E14] border border-border rounded-xl divide-y divide-border">
        <ToggleRow 
          label="Price Volatility Alerts" 
          description="Get notified when watchlist stocks move >5% in an hour"
          active={prefs.price_volatility} 
          onChange={() => setPrefs({...prefs, price_volatility: !prefs.price_volatility})} 
          icon={<Zap size={18} className="text-amber-500" />}
          transparent
        />
         <ToggleRow 
          label="Daily Portfolio Digest" 
          description="Morning summary of your portfolio performance"
          active={prefs.daily_digest} 
          onChange={() => setPrefs({...prefs, daily_digest: !prefs.daily_digest})} 
          icon={<Mail size={18} className="text-sky-500" />}
          transparent
        />
         <ToggleRow 
          label="Security Alerts" 
          description="Login attempts and suspicious activity"
          active={prefs.sms_security} 
          onChange={() => setPrefs({...prefs, sms_security: !prefs.sms_security})} 
          icon={<Shield size={18} className="text-emerald-500" />}
          transparent
        />
      </div>
    </div>

    <div>
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
        <Smartphone size={20} className="text-indigo-500 dark:text-indigo-400" /> Delivery Channels
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         <div className="p-4 bg-slate-50 dark:bg-[#0B0E14] border border-border rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div className="p-2 bg-slate-200 dark:bg-slate-800 rounded-lg"><Mail size={20} className="text-slate-600 dark:text-slate-300"/></div>
               <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Email</p>
                  <p className="text-xs text-slate-500">alex.morgan@example.com</p>
               </div>
            </div>
            <div className="px-2 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold rounded uppercase">Verified</div>
         </div>
         <div className="p-4 bg-slate-50 dark:bg-[#0B0E14] border border-border rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div className="p-2 bg-slate-200 dark:bg-slate-800 rounded-lg"><Smartphone size={20} className="text-slate-600 dark:text-slate-300"/></div>
               <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">SMS</p>
                  <p className="text-xs text-slate-500">+1 (555) •••-••88</p>
               </div>
            </div>
            <button className="text-xs text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 font-medium">Edit</button>
         </div>
      </div>
    </div>
  </div>
);

const APISettings = () => (
  <div className="space-y-8 animate-fade-in">
    {/* Gemini Status */}
    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-500/20 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
         <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
               <Zap className="text-white" size={20} />
            </div>
            <div>
               <h3 className="text-lg font-bold text-slate-900 dark:text-white">Gemini AI Engine</h3>
               <p className="text-xs text-indigo-600 dark:text-indigo-200">Powered by Google GenAI Models</p>
            </div>
         </div>
         <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">OPERATIONAL</span>
         </div>
      </div>
      <div className="grid grid-cols-3 gap-4 mt-6">
         <div className="bg-white/50 dark:bg-[#0B0E14]/50 rounded-xl p-3 border border-indigo-500/10">
            <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Latency</p>
            <p className="text-xl font-mono font-bold text-slate-900 dark:text-white">45ms</p>
         </div>
         <div className="bg-white/50 dark:bg-[#0B0E14]/50 rounded-xl p-3 border border-indigo-500/10">
            <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Requests/Min</p>
            <p className="text-xl font-mono font-bold text-slate-900 dark:text-white">24</p>
         </div>
         <div className="bg-white/50 dark:bg-[#0B0E14]/50 rounded-xl p-3 border border-indigo-500/10">
            <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Model</p>
            <p className="text-xl font-mono font-bold text-slate-900 dark:text-white">Flash 2.5</p>
         </div>
      </div>
    </div>

    {/* Data Connections */}
    <div>
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
        <Server size={20} className="text-indigo-500 dark:text-indigo-400" /> Data Feeds & Integrations
      </h3>
      <div className="space-y-4">
         <div className="bg-slate-50 dark:bg-[#0B0E14] border border-border rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="p-2 bg-slate-200 dark:bg-slate-800 rounded-lg border border-slate-300 dark:border-slate-700">
                  <Globe size={24} className="text-slate-600 dark:text-slate-300" />
               </div>
               <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">NYSE Real-time Data</h4>
                  <p className="text-xs text-slate-500">Level 1 Quotes & Trades</p>
               </div>
            </div>
            <button className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors">
               Disconnect
            </button>
         </div>
         
         <div className="bg-slate-50 dark:bg-[#0B0E14] border border-border rounded-xl p-4 flex items-center justify-between opacity-75">
            <div className="flex items-center gap-4">
               <div className="p-2 bg-slate-200 dark:bg-slate-800 rounded-lg border border-slate-300 dark:border-slate-700">
                  <Wifi size={24} className="text-slate-500" />
               </div>
               <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Bloomberg Terminal Link</h4>
                  <p className="text-xs text-slate-500">Institutional Feed Integration</p>
               </div>
            </div>
            <button className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-900/20">
               Connect
            </button>
         </div>
      </div>
    </div>

    {/* Developer Info */}
    <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 flex items-start gap-3">
       <AlertTriangle size={18} className="text-amber-500 mt-0.5 flex-shrink-0" />
       <div>
          <h4 className="text-sm font-bold text-amber-500 mb-1">Developer Mode</h4>
          <p className="text-xs text-amber-600/70 dark:text-amber-200/60 leading-relaxed">
             Advanced API key management for custom data sources is restricted in this demo environment. The primary GenAI connection is managed via secure environment variables.
          </p>
       </div>
    </div>
  </div>
);

const AIAssistantSettings = () => {
  const [aiConfig, setAiConfig] = useState<AIProviderConfig>({
    provider: 'gemini',
    apiKey: '',
    model: 'gemini-2.0-flash-exp',
    isCustom: false
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  // Load saved config on mount
  useEffect(() => {
    const saved = localStorage.getItem('novastock_ai_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setAiConfig(parsed);
      } catch (error) {
        console.error('Failed to parse saved AI config:', error);
      }
    }
  }, []);

  const handleProviderChange = (provider: AIProvider) => {
    const defaultConfig = DEFAULT_CONFIGS[provider];
    setAiConfig(prev => ({
      ...prev,
      provider,
      model: defaultConfig.model,
      apiKey: provider === 'gemini' ? '' : prev.apiKey, // Clear API key for Gemini (uses env)
      isCustom: provider !== 'gemini'
    }));
    setTestResult(null);
  };

  const handleSave = () => {
    localStorage.setItem('novastock_ai_config', JSON.stringify(aiConfig));
    setTestResult('Configuration saved successfully!');
    setTimeout(() => setTestResult(null), 3000);
  };

  const handleReset = () => {
    localStorage.removeItem('novastock_ai_config');
    setAiConfig({
      provider: 'gemini',
      apiKey: '',
      model: 'gemini-2.0-flash-exp',
      isCustom: false
    });
    setTestResult('Reset to default Gemini configuration.');
    setTimeout(() => setTestResult(null), 3000);
  };

  const testConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const testMessage = [{ role: 'user' as const, content: 'Hello, can you confirm this connection is working?' }];
      const response = await sendMessage(aiConfig, testMessage);
      setTestResult('✅ Connection successful! AI responded.');
    } catch (error) {
      if (error instanceof Error && error.message === 'INVALID_API_KEY') {
        setTestResult('❌ Invalid API key. Please check your credentials.');
      } else {
        setTestResult('❌ Connection failed. Please check your settings.');
      }
    } finally {
      setIsTesting(false);
    }
  };

  const getProviderInfo = (provider: AIProvider) => {
    switch (provider) {
      case 'gemini':
        return { name: 'Google Gemini', color: 'text-blue-500', bgColor: 'bg-blue-500', description: 'Powered by Google\'s Gemini models' };
      case 'openai':
        return { name: 'OpenAI', color: 'text-green-500', bgColor: 'bg-green-500', description: 'Powered by GPT models' };
      case 'anthropic':
        return { name: 'Anthropic Claude', color: 'text-purple-500', bgColor: 'bg-purple-500', description: 'Powered by Claude models' };
    }
  };

  const providerInfo = getProviderInfo(aiConfig.provider);
  const isActive = aiConfig.provider === 'gemini' || (aiConfig.isCustom && aiConfig.apiKey.trim());

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
          <Bot size={20} className="text-indigo-500 dark:text-indigo-400" /> AI Assistant Configuration
        </h3>

        {/* Provider Selection */}
        <div className="mb-8">
          <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 block">Choose AI Provider</label>
          <div className="space-y-3">
            {(['gemini', 'openai', 'anthropic'] as AIProvider[]).map((provider) => {
              const info = getProviderInfo(provider);
              const isSelected = aiConfig.provider === provider;
              return (
                <button
                  key={provider}
                  onClick={() => handleProviderChange(provider)}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-500/10'
                      : 'border-border bg-slate-50 dark:bg-[#0B0E14] hover:border-slate-400 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full ${info.bgColor} flex items-center justify-center`}>
                        {isSelected && <Check size={12} className="text-white" />}
                      </div>
                      <div>
                        <p className={`font-bold ${isSelected ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                          {info.name}
                        </p>
                        <p className="text-xs text-slate-500">{info.description}</p>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Active</span>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* API Key Input (for non-Gemini providers) */}
        {aiConfig.provider !== 'gemini' && (
          <div className="mb-8">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">
              API Key
              {!aiConfig.apiKey.trim() && (
                <span className="text-amber-500 ml-2 text-xs">Required for {providerInfo.name}</span>
              )}
            </label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={aiConfig.apiKey}
                onChange={(e) => setAiConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                placeholder={`Enter your ${providerInfo.name} API key`}
                className="w-full bg-slate-50 dark:bg-[#0B0E14] border border-border rounded-xl px-4 py-3 pr-12 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              >
                {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Your API key is stored locally and never transmitted to our servers.
            </p>
          </div>
        )}

        {/* Model Selection */}
        <div className="mb-8">
          <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">Model</label>
          <select
            value={aiConfig.model}
            onChange={(e) => setAiConfig(prev => ({ ...prev, model: e.target.value }))}
            className="w-full bg-slate-50 dark:bg-[#0B0E14] border border-border rounded-xl px-4 py-3 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
          >
            {PROVIDER_MODELS[aiConfig.provider].map((model) => (
              <option key={model} value={model}>{model}</option>
            ))}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={handleSave}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-lg shadow-indigo-500/20"
          >
            Save & Apply
          </button>
          <button
            onClick={testConnection}
            disabled={!isActive || isTesting}
            className="bg-slate-600 hover:bg-slate-500 disabled:bg-slate-400 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-colors"
          >
            {isTesting ? 'Testing...' : 'Test Connection'}
          </button>
          <button
            onClick={handleReset}
            className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-6 py-2.5 rounded-lg text-sm font-bold transition-colors border border-border"
          >
            Reset to Default
          </button>
        </div>

        {/* Status Messages */}
        {testResult && (
          <div className={`p-4 rounded-xl border ${
            testResult.includes('✅')
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
              : testResult.includes('❌')
              ? 'bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-300'
              : 'bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-300'
          }`}>
            <p className="text-sm font-medium">{testResult}</p>
          </div>
        )}

        {/* Info Box */}
        <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10 flex items-start gap-3">
          <SettingsIcon size={18} className="text-indigo-500 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mb-1">AI Provider Settings</h4>
            <p className="text-xs text-indigo-600/70 dark:text-indigo-200/60 leading-relaxed">
              Choose your preferred AI provider for the trading assistant. Gemini is the default and requires no setup.
              OpenAI and Anthropic require valid API keys which are stored locally in your browser.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const ToggleRow = ({ label, description, active, onChange, icon, transparent = false }: any) => (
  <div className={`flex items-center justify-between p-4 ${transparent ? '' : 'bg-slate-50 dark:bg-[#0B0E14] border border-border rounded-xl'}`}>
    <div className="flex items-center gap-4">
      {icon && <div className={`p-2 rounded-lg ${active ? 'bg-indigo-500/10 text-indigo-500' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>{icon}</div>}
      <div>
        <p className={`text-sm font-bold ${active ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>{label}</p>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
    </div>
    <button 
      onClick={onChange}
      className={`w-12 h-6 rounded-full relative transition-colors ${active ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'}`}
    >
      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${active ? 'left-7' : 'left-1'}`}></div>
    </button>
  </div>
);

export default Settings;