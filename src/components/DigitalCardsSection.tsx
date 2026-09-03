import React, { useState } from 'react';
import { DigitalCard } from '../types/digitalCards';
import { formatMoney } from '../utils/format';
import { CurrencyCode } from '../types/finance';
import { 
  CreditCard, 
  Lock, 
  Unlock, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Zap, 
  Globe, 
  Sliders, 
  Plus, 
  Check, 
  AlertCircle,
  Wifi
} from 'lucide-react';

interface DigitalCardsSectionProps {
  currency: CurrencyCode;
  canManageCards: boolean;
  onOpenSecurityPinPrompt?: (onSuccess: () => void) => void;
}

const INITIAL_CARDS: DigitalCard[] = [
  {
    id: 'card-1',
    accountId: 'acc-1',
    cardholderName: 'ALEJANDRO MARTÍNEZ',
    brand: 'visa',
    type: 'debit',
    lastFour: '4829',
    fullNumberMasked: '4532 •••• •••• 4829',
    expiryDate: '08/28',
    cvv: '842',
    status: 'active',
    colorGradient: 'from-slate-900 via-indigo-950 to-slate-900 border-indigo-500/30',
    monthlyLimit: 3000,
    currentMonthlySpent: 845.50,
    isContactlessEnabled: true,
    isOnlineShoppingEnabled: true,
    isInternationalEnabled: true,
  },
  {
    id: 'card-2',
    accountId: 'acc-2',
    cardholderName: 'ALEJANDRO MARTÍNEZ',
    brand: 'mastercard',
    type: 'credit',
    lastFour: '9150',
    fullNumberMasked: '5412 •••• •••• 9150',
    expiryDate: '11/27',
    cvv: '319',
    status: 'active',
    colorGradient: 'from-slate-900 via-emerald-950 to-slate-900 border-emerald-500/30',
    monthlyLimit: 1500,
    currentMonthlySpent: 320.00,
    isContactlessEnabled: true,
    isOnlineShoppingEnabled: true,
    isInternationalEnabled: false,
  }
];

export const DigitalCardsSection: React.FC<DigitalCardsSectionProps> = ({
  currency,
  canManageCards,
  onOpenSecurityPinPrompt,
}) => {
  const [cards, setCards] = useState<DigitalCard[]>(() => {
    try {
      const saved = localStorage.getItem('finantrack_digital_cards');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_CARDS;
  });

  const [selectedCardId, setSelectedCardId] = useState<string>(cards[0]?.id || 'card-1');
  const [revealedCvvCardId, setRevealedCvvCardId] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const selectedCard = cards.find(c => c.id === selectedCardId) || cards[0];

  const saveCards = (newCards: DigitalCard[]) => {
    setCards(newCards);
    try {
      localStorage.setItem('finantrack_digital_cards', JSON.stringify(newCards));
    } catch {}
  };

  const showToast = (msg: string) => {
    setActionFeedback(msg);
    setTimeout(() => setActionFeedback(null), 2500);
  };

  const toggleCardFreeze = (cardId: string) => {
    if (!canManageCards) return;
    const target = cards.find(c => c.id === cardId);
    if (!target) return;

    const newStatus = target.status === 'active' ? 'frozen' : 'active';
    const updated = cards.map(c => c.id === cardId ? { ...c, status: newStatus } : c);
    saveCards(updated);
    
    // Feedback háptico
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate(40); } catch {}
    }

    showToast(newStatus === 'frozen' ? 'Tarjeta bloqueada temporalmente' : 'Tarjeta desbloqueada y operativa');
  };

  const handleRevealCvv = (cardId: string) => {
    if (revealedCvvCardId === cardId) {
      setRevealedCvvCardId(null);
      return;
    }

    // Solicitar PIN de seguridad si la callback existe
    if (onOpenSecurityPinPrompt) {
      onOpenSecurityPinPrompt(() => {
        setRevealedCvvCardId(cardId);
        setTimeout(() => setRevealedCvvCardId(null), 15000); // Auto-ocultar tras 15 segundos por seguridad
      });
    } else {
      setRevealedCvvCardId(cardId);
      setTimeout(() => setRevealedCvvCardId(null), 15000);
    }
  };

  const toggleFeature = (cardId: string, feature: 'isContactlessEnabled' | 'isOnlineShoppingEnabled' | 'isInternationalEnabled') => {
    if (!canManageCards) return;
    const updated = cards.map(c => c.id === cardId ? { ...c, [feature]: !c[feature] } : c);
    saveCards(updated);
    showToast('Preferencias de seguridad actualizadas');
  };

  return (
    <div className="space-y-4 pt-2">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Tarjetas Digitales Vinculadas</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Control directo de bloqueo, CVV dinámico y límites mensuales
          </p>
        </div>

        {actionFeedback && (
          <div className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-full text-xs font-semibold flex items-center gap-1.5 animate-in fade-in">
            <Check className="w-3.5 h-3.5" />
            <span>{actionFeedback}</span>
          </div>
        )}
      </div>

      {/* Grid: Tarjetas Visuales + Panel de Controles */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Columna Izquierda: Tarjetas estilo Físico (Página 6) */}
        <div className="lg:col-span-5 space-y-3">
          {cards.map((card) => {
            const isSelected = card.id === selectedCardId;
            const isFrozen = card.status === 'frozen';

            return (
              <div
                key={card.id}
                onClick={() => setSelectedCardId(card.id)}
                className={`relative p-5 sm:p-6 rounded-3xl cursor-pointer transition-all duration-300 border-2 overflow-hidden shadow-lg ${
                  card.colorGradient
                } ${
                  isSelected ? 'ring-2 ring-indigo-500 scale-[1.01]' : 'opacity-80 hover:opacity-100'
                } ${
                  isFrozen ? 'grayscale-[80%] brightness-75' : ''
                }`}
              >
                {/* Microchip y Contactless */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    {/* EMV Chip visual */}
                    <div className="w-10 h-7 rounded-md bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 border border-amber-300/60 shadow-inner flex items-center justify-center">
                      <div className="w-6 h-4 border border-amber-700/40 rounded-sm" />
                    </div>
                    <Wifi className="w-4 h-4 text-white/70 rotate-90" />
                  </div>

                  {/* Brand Logo & Status */}
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      isFrozen ? 'bg-rose-500/80 text-white' : 'bg-emerald-500/80 text-white'
                    }`}>
                      {isFrozen ? 'Bloqueada' : 'Activa'}
                    </span>
                    <span className="text-sm font-black text-white italic tracking-wider">
                      {card.brand === 'visa' ? 'VISA' : 'Mastercard'}
                    </span>
                  </div>
                </div>

                {/* Número Enmascarado con Tipografía Monoespaciada Tabular */}
                <div className="space-y-1 mb-4">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">
                    Número de Tarjeta
                  </span>
                  <div className="text-base sm:text-lg font-mono font-bold text-white tracking-widest">
                    {revealedCvvCardId === card.id ? card.fullNumberMasked : `•••• •••• •••• ${card.lastFour}`}
                  </div>
                </div>

                {/* Datos del Titular y Expiración */}
                <div className="flex items-end justify-between text-white/90 pt-1">
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Titular</span>
                    <span className="text-xs font-bold uppercase tracking-wider">{card.cardholderName}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Caduca</span>
                      <span className="text-xs font-mono font-bold">{card.expiryDate}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider block">CVV</span>
                      <span className="text-xs font-mono font-bold">
                        {revealedCvvCardId === card.id ? card.cvv : '•••'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Columna Derecha: Acciones Rápidas & Límite Mensual (Página 6) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-5">
          {selectedCard && (
            <>
              {/* Acciones Rápidas */}
              <div>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-3">
                  Acciones Rápidas de Seguridad ({selectedCard.brand.toUpperCase()} •••• {selectedCard.lastFour})
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {/* Botón Bloquear / Desbloquear */}
                  <button
                    type="button"
                    onClick={() => toggleCardFreeze(selectedCard.id)}
                    className={`p-3 rounded-2xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-2 text-center min-h-[72px] ${
                      selectedCard.status === 'frozen'
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
                        : 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 text-rose-700 dark:text-rose-300 hover:bg-rose-100'
                    }`}
                  >
                    {selectedCard.status === 'frozen' ? (
                      <>
                        <Unlock className="w-5 h-5" />
                        <span>Desbloquear</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-5 h-5" />
                        <span>Bloquear Tarjeta</span>
                      </>
                    )}
                  </button>

                  {/* Ver Datos Seguros / CVV */}
                  <button
                    type="button"
                    onClick={() => handleRevealCvv(selectedCard.id)}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/80 text-xs font-bold transition-all flex flex-col items-center justify-center gap-2 text-center min-h-[72px]"
                  >
                    {revealedCvvCardId === selectedCard.id ? (
                      <>
                        <EyeOff className="w-5 h-5 text-indigo-500" />
                        <span>Ocultar CVV</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-5 h-5 text-indigo-500" />
                        <span>Ver CVV Seguro</span>
                      </>
                    )}
                  </button>

                  {/* Indicador de Tipo */}
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex flex-col items-center justify-center gap-1.5 text-center min-h-[72px]">
                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                    <span className="capitalize">Tipo {selectedCard.type === 'credit' ? 'Crédito' : 'Débito'}</span>
                  </div>
                </div>
              </div>

              {/* Límite de Gasto Mensual */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    Límite Mensual de Compras
                  </span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white font-mono-num">
                    {formatMoney(selectedCard.currentMonthlySpent, currency)} / {formatMoney(selectedCard.monthlyLimit, currency)}
                  </span>
                </div>

                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (selectedCard.currentMonthlySpent / selectedCard.monthlyLimit) * 100)}%` }}
                  />
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Disponible este mes:{' '}
                  <strong className="text-slate-800 dark:text-slate-200 font-mono-num">
                    {formatMoney(Math.max(0, selectedCard.monthlyLimit - selectedCard.currentMonthlySpent), currency)}
                  </strong>
                </p>
              </div>

              {/* Interruptores de Canales de Pago */}
              <div className="space-y-2 pt-1">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Canales de Operación
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => toggleFeature(selectedCard.id, 'isContactlessEnabled')}
                    className={`p-2.5 rounded-xl border flex items-center justify-between font-semibold transition-colors ${
                      selectedCard.isContactlessEnabled
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-300 text-emerald-800 dark:text-emerald-200'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 text-slate-400'
                    }`}
                  >
                    <span>Contactless</span>
                    <span className="text-[10px] font-bold">{selectedCard.isContactlessEnabled ? 'SÍ' : 'NO'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleFeature(selectedCard.id, 'isOnlineShoppingEnabled')}
                    className={`p-2.5 rounded-xl border flex items-center justify-between font-semibold transition-colors ${
                      selectedCard.isOnlineShoppingEnabled
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-300 text-emerald-800 dark:text-emerald-200'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 text-slate-400'
                    }`}
                  >
                    <span>Compras Online</span>
                    <span className="text-[10px] font-bold">{selectedCard.isOnlineShoppingEnabled ? 'SÍ' : 'NO'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleFeature(selectedCard.id, 'isInternationalEnabled')}
                    className={`p-2.5 rounded-xl border flex items-center justify-between font-semibold transition-colors ${
                      selectedCard.isInternationalEnabled
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-300 text-emerald-800 dark:text-emerald-200'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 text-slate-400'
                    }`}
                  >
                    <span>Extranjero</span>
                    <span className="text-[10px] font-bold">{selectedCard.isInternationalEnabled ? 'SÍ' : 'NO'}</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
};
