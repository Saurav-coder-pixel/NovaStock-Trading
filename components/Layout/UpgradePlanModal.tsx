import React, { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, Zap, Crown, Sparkles } from 'lucide-react';

interface UpgradePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PLANS = [
  {
    key: 'basic',
    name: 'Basic',
    price: 'Free',
    period: '',
    icon: Sparkles,
    iconColor: 'text-slate-400',
    iconBg: 'bg-slate-700/50',
    badge: null as string | null,
    features: [
      'Real-time crypto & stock prices',
      'Basic candlestick charts',
      '5 AI analyses per day',
      '10 assets in watchlist',
    ],
    selectedBorder: 'border-slate-400',
    selectedBg: 'bg-slate-800/40',
    selectedBadgeText: 'Current Plan',
    selectedBadgeClass: 'bg-slate-600 text-slate-200',
  },
  {
    key: 'pro',
    name: 'Pro',
    price: '$19',
    period: '/month',
    icon: Zap,
    iconColor: 'text-yellow-400',
    iconBg: 'bg-yellow-500/10',
    badge: 'MOST POPULAR' as string | null,
    features: [
      'Everything in Basic',
      'Unlimited AI analyses',
      'Advanced chart indicators (RSI, MACD, BB)',
      'Full order book depth',
      '50 assets in watchlist',
      'Priority data refresh (5s interval)',
    ],
    selectedBorder: 'border-[#00D084]',
    selectedBg: 'bg-[#00D084]/5',
    selectedBadgeText: 'Selected',
    selectedBadgeClass: 'bg-[#00D084] text-black',
  },
  {
    key: 'elite',
    name: 'Elite',
    price: '$49',
    period: '/month',
    icon: Crown,
    iconColor: 'text-purple-400',
    iconBg: 'bg-purple-500/10',
    badge: null as string | null,
    features: [
      'Everything in Pro',
      'AI portfolio optimizer',
      'Custom price alerts',
      'Unlimited watchlist',
      '1s real-time data',
      'API access',
      'Dedicated support',
    ],
    selectedBorder: 'border-purple-500',
    selectedBg: 'bg-purple-500/5',
    selectedBadgeText: 'Selected',
    selectedBadgeClass: 'bg-purple-600 text-white',
  },
];

const CTA_CONFIG: Record<string, { label: string; disabled: boolean; className: string }> = {
  basic: {
    label: 'Current Plan',
    disabled: true,
    className:
      'w-full py-3 rounded-xl text-sm font-bold bg-slate-700 text-slate-500 cursor-not-allowed',
  },
  pro: {
    label: 'Upgrade to Pro — $19/month',
    disabled: false,
    className:
      'w-full py-3 rounded-xl text-sm font-bold transition-all active:scale-[0.98] bg-[#00D084] hover:bg-[#00b872] text-black shadow-lg shadow-[#00D084]/30 hover:shadow-[#00D084]/50',
  },
  elite: {
    label: 'Upgrade to Elite — $49/month',
    disabled: false,
    className:
      'w-full py-3 rounded-xl text-sm font-bold transition-all active:scale-[0.98] bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-500 hover:to-blue-400 text-white shadow-lg shadow-purple-500/30',
  },
};

const UpgradePlanModal: React.FC<UpgradePlanModalProps> = ({ isOpen, onClose }) => {
  const [selectedPlan, setSelectedPlan] = useState('basic');
  const [toast, setToast] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  // Animate in/out
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [isOpen]);

  // Reset selection when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => setSelectedPlan('basic'), 300);
    }
  }, [isOpen]);

  const handleUpgrade = () => {
    const plan = PLANS.find((p) => p.key === selectedPlan);
    if (!plan || selectedPlan === 'basic') return;
    setToast(`Redirecting to payment for ${plan.name} plan...`);
    setTimeout(() => setToast(null), 3000);
  };

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose]
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const cta = CTA_CONFIG[selectedPlan];

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        opacity: visible ? 1 : 0,
        transition: 'opacity 220ms ease',
        zIndex: 99999,
      }}
      onClick={handleBackdropClick}
    >
      {/* Toast */}
      {toast && (
        <div
          className="fixed top-6 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-sm font-bold px-5 py-3 rounded-xl shadow-2xl pointer-events-none"
          style={{ zIndex: 100001, whiteSpace: 'nowrap' }}
        >
          💳 {toast}
        </div>
      )}

      {/* Modal box */}
      <div
        className="relative w-full max-w-4xl bg-[#0A0B0E] rounded-2xl border border-[#1E293B] shadow-2xl"
        style={{
          transform: visible ? 'scale(1)' : 'scale(0.93)',
          opacity: visible ? 1 : 0,
          transition: 'transform 260ms cubic-bezier(0.34,1.56,0.64,1), opacity 220ms ease',
          maxHeight: '90vh',
          overflowY: 'auto',
          zIndex: 100000,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow decoration */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[120px] rounded-full pointer-events-none"
          style={{ background: 'rgba(99,102,241,0.08)', filter: 'blur(40px)' }}
        />

        {/* Header */}
        <div className="relative flex items-start justify-between p-6 pb-4 border-b border-[#1E293B]">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Choose Your Plan</h2>
            <p className="text-slate-500 text-sm mt-1">Unlock the full power of NovaTrade</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-[#1E293B] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Plan Cards */}
        <div className="relative p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            const isSelected = selectedPlan === plan.key;

            return (
              <div
                key={plan.key}
                onClick={() => setSelectedPlan(plan.key)}
                className="relative flex flex-col rounded-xl border p-5 transition-all duration-200"
                style={{
                  cursor: 'pointer',
                  backgroundColor: isSelected ? undefined : '#111318',
                  opacity: isSelected ? 1 : 0.6,
                  borderColor: isSelected
                    ? plan.key === 'basic'
                      ? '#94a3b8'
                      : plan.key === 'pro'
                      ? '#00D084'
                      : '#a855f7'
                    : '#1E293B',
                  background: isSelected
                    ? plan.key === 'basic'
                      ? 'rgba(51,65,85,0.4)'
                      : plan.key === 'pro'
                      ? 'rgba(0,208,132,0.04)'
                      : 'rgba(168,85,247,0.04)'
                    : '#111318',
                  boxShadow: isSelected
                    ? plan.key === 'pro'
                      ? '0 0 0 1px rgba(0,208,132,0.2), 0 8px 32px rgba(0,208,132,0.08)'
                      : plan.key === 'elite'
                      ? '0 0 0 1px rgba(168,85,247,0.2), 0 8px 32px rgba(168,85,247,0.08)'
                      : 'none'
                    : 'none',
                  userSelect: 'none',
                }}
              >
                {/* MOST POPULAR badge */}
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <span className="bg-yellow-400 text-black text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
                      {plan.badge}
                    </span>
                  </div>
                )}

                {/* "Selected" indicator top-right */}
                {isSelected && (
                  <div className="absolute top-3 right-3">
                    <span
                      className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-widest ${plan.selectedBadgeClass}`}
                    >
                      {plan.selectedBadgeText}
                    </span>
                  </div>
                )}

                {/* Check ring when selected */}
                {isSelected && (
                  <div
                    className="absolute top-3 left-3 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{
                      background:
                        plan.key === 'pro'
                          ? '#00D084'
                          : plan.key === 'elite'
                          ? '#a855f7'
                          : '#64748b',
                    }}
                  >
                    <Check size={11} color="#000" strokeWidth={3} />
                  </div>
                )}

                {/* Icon */}
                <div
                  className={`w-10 h-10 rounded-lg ${plan.iconBg} flex items-center justify-center mb-4 mt-1`}
                  style={{ marginTop: isSelected ? '1.5rem' : undefined }}
                >
                  <Icon size={20} className={plan.iconColor} />
                </div>

                {/* Plan name */}
                <div className="mb-1">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    {plan.name}
                  </span>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-1 mb-5">
                  <span className="text-3xl font-extrabold text-white font-mono">{plan.price}</span>
                  {plan.period && (
                    <span className="text-slate-500 text-sm">{plan.period}</span>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-2.5 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm text-slate-400">
                      <div className="mt-0.5 w-4 h-4 rounded-full bg-[#00D084]/15 flex items-center justify-center shrink-0">
                        <Check size={10} className="text-[#00D084]" />
                      </div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Unified CTA */}
        <div className="px-6 pb-4">
          <button
            disabled={cta.disabled}
            onClick={handleUpgrade}
            className={cta.className}
          >
            {cta.label}
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-600 text-[11px] pb-5">
          Cancel anytime · No hidden fees · Secure payment via Stripe
        </p>
      </div>
    </div>,
    document.body
  );
};

export default UpgradePlanModal;
