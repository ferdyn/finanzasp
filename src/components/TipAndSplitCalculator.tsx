import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatMoney } from '../utils/format';
import { 
  Receipt, Users, Percent, DollarSign, Copy, Check, RotateCcw, 
  Plus, Minus, Share2, CreditCard, ArrowRight, Utensils, Smile, 
  Sparkles, CheckCircle2, ChevronDown, ChevronUp, User, PieChart
} from 'lucide-react';
import { Transaction } from '../types/finance';

interface Participant {
  id: string;
  name: string;
  amount: number;
}

export interface TipAndSplitCalculatorProps {
  onClose?: () => void;
  isModal?: boolean;
  onOpenTransactionWithData?: (data: Partial<Transaction>) => void;
}

export const TipAndSplitCalculator: React.FC<TipAndSplitCalculatorProps> = ({
  onClose,
  isModal = false,
  onOpenTransactionWithData,
}) => {
  const { currency, accounts, categories, addTransaction } = useFinance();

  // Estados principales de la cuenta
  const [billAmountStr, setBillAmountStr] = useState<string>('60.00');
  const [tipType, setTipType] = useState<'percent' | 'fixed'>('percent');
  const [tipPercent, setTipPercent] = useState<number>(10);
  const [customPercentStr, setCustomPercentStr] = useState<string>('');
  const [fixedTipStr, setFixedTipStr] = useState<string>('');
  const [numPeople, setNumPeople] = useState<number>(3);
  const [roundingMode, setRoundingMode] = useState<'none' | 'person_up' | 'total_up'>('none');
  const [splitMode, setSplitMode] = useState<'equal' | 'custom'>('equal');

  // Comensales para reparto personalizado
  const [participants, setParticipants] = useState<Participant[]>([
    { id: 'p-1', name: 'Yo', amount: 25 },
    { id: 'p-2', name: 'Comensal 2', amount: 20 },
    { id: 'p-3', name: 'Comensal 3', amount: 15 },
  ]);

  // Estados para registrar directamente en FinanTrack
  const [selectedAccountId, setSelectedAccountId] = useState<string>(accounts[0]?.id || '');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(() => {
    const foodCat = categories.find(c => c.name.toLowerCase().includes('restaur') || c.name.toLowerCase().includes('aliment') || c.id === 'cat-alimentacion');
    return foodCat?.id || categories.find(c => c.type === 'expense')?.id || '';
  });
  const [isSavedToast, setIsSavedToast] = useState<boolean>(false);
  const [copiedSummary, setCopiedSummary] = useState<boolean>(false);

  // Cálculos base
  const billAmount = Math.max(0, parseFloat(billAmountStr) || 0);

  // En reparto personalizado, podemos sincronizar o sumar el consumo de los participantes
  const customSubtotal = useMemo(() => {
    return participants.reduce((acc, p) => acc + (p.amount || 0), 0);
  }, [participants]);

  const effectiveSubtotal = splitMode === 'custom' ? customSubtotal : billAmount;

  // Monto de propina base
  const rawTipAmount = useMemo(() => {
    if (tipType === 'fixed') {
      return Math.max(0, parseFloat(fixedTipStr) || 0);
    }
    const pct = customPercentStr ? Math.max(0, parseFloat(customPercentStr) || 0) : tipPercent;
    return (effectiveSubtotal * pct) / 100;
  }, [effectiveSubtotal, tipType, fixedTipStr, tipPercent, customPercentStr]);

  const rawTotal = effectiveSubtotal + rawTipAmount;

  // Aplicación de redondeo
  const { finalTotal, finalTipAmount, perPersonAmount, effectiveTipPercent } = useMemo(() => {
    const count = Math.max(1, splitMode === 'custom' ? participants.length : numPeople);

    if (roundingMode === 'person_up') {
      const unroundedPerPerson = rawTotal / count;
      const roundedPerPerson = Math.ceil(unroundedPerPerson);
      const total = roundedPerPerson * count;
      const tip = Math.max(0, total - effectiveSubtotal);
      const effPct = effectiveSubtotal > 0 ? (tip / effectiveSubtotal) * 100 : 0;
      return {
        finalTotal: total,
        finalTipAmount: tip,
        perPersonAmount: roundedPerPerson,
        effectiveTipPercent: effPct,
      };
    }

    if (roundingMode === 'total_up') {
      const total = Math.ceil(rawTotal);
      const tip = Math.max(0, total - effectiveSubtotal);
      const perPerson = total / count;
      const effPct = effectiveSubtotal > 0 ? (tip / effectiveSubtotal) * 100 : 0;
      return {
        finalTotal: total,
        finalTipAmount: tip,
        perPersonAmount: perPerson,
        effectiveTipPercent: effPct,
      };
    }

    // Sin redondeo
    const perPerson = count > 0 ? rawTotal / count : rawTotal;
    const effPct = effectiveSubtotal > 0 ? (rawTipAmount / effectiveSubtotal) * 100 : 0;
    return {
      finalTotal: rawTotal,
      finalTipAmount: rawTipAmount,
      perPersonAmount: perPerson,
      effectiveTipPercent: effPct,
    };
  }, [effectiveSubtotal, rawTipAmount, rawTotal, roundingMode, splitMode, participants.length, numPeople]);

  // Desglose de participantes si es reparto personalizado
  const participantsBreakdown = useMemo(() => {
    if (splitMode !== 'custom') return [];
    const totalConsumption = customSubtotal || 1;

    return participants.map((p) => {
      const shareRatio = p.amount / totalConsumption;
      const personTip = finalTipAmount * shareRatio;
      const personTotal = p.amount + personTip;
      return {
        ...p,
        tipShare: personTip,
        totalToPay: personTotal,
      };
    });
  }, [splitMode, participants, customSubtotal, finalTipAmount]);

  // Porción correspondiente al usuario (en equitativo = perPersonAmount, en custom = Yo)
  const myPortion = useMemo(() => {
    if (splitMode === 'equal') {
      return perPersonAmount;
    }
    const myEntry = participantsBreakdown.find(p => p.id === 'p-1' || p.name.toLowerCase() === 'yo');
    return myEntry ? myEntry.totalToPay : perPersonAmount;
  }, [splitMode, perPersonAmount, participantsBreakdown]);

  // Manejadores de participantes
  const handleAddParticipant = () => {
    const nextIndex = participants.length + 1;
    setParticipants([
      ...participants,
      { id: `p-${Date.now()}`, name: `Comensal ${nextIndex}`, amount: 0 },
    ]);
  };

  const handleUpdateParticipant = (id: string, updates: Partial<Participant>) => {
    setParticipants(participants.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const handleRemoveParticipant = (id: string) => {
    if (participants.length <= 1) return;
    setParticipants(participants.filter(p => p.id !== id));
  };

  // Restablecer calculadora
  const handleReset = () => {
    setBillAmountStr('60.00');
    setTipType('percent');
    setTipPercent(10);
    setCustomPercentStr('');
    setFixedTipStr('');
    setNumPeople(3);
    setRoundingMode('none');
    setSplitMode('equal');
    setParticipants([
      { id: 'p-1', name: 'Yo', amount: 25 },
      { id: 'p-2', name: 'Comensal 2', amount: 20 },
      { id: 'p-3', name: 'Comensal 3', amount: 15 },
    ]);
    setIsSavedToast(false);
  };

  // Copiar resumen al portapapeles para WhatsApp / Telegram
  const handleCopySummary = async () => {
    const count = splitMode === 'custom' ? participants.length : numPeople;
    let text = `🧾 *División de Cuenta & Propina*\n`;
    text += `• Subtotal consumo: ${formatMoney(effectiveSubtotal, currency)}\n`;
    text += `• Propina (${effectiveTipPercent.toFixed(1)}%): ${formatMoney(finalTipAmount, currency)}\n`;
    text += `• Total a pagar: ${formatMoney(finalTotal, currency)}\n`;
    text += `• Total personas: ${count}\n\n`;

    if (splitMode === 'equal') {
      text += `👉 *Cuota por persona:* ${formatMoney(perPersonAmount, currency)} c/u\n`;
      if (roundingMode !== 'none') {
        text += `_(Ajustado con redondeo fácil)_\n`;
      }
    } else {
      text += `📋 *Desglose individual:*\n`;
      participantsBreakdown.forEach((p) => {
        text += `• ${p.name}: ${formatMoney(p.totalToPay, currency)} (Consumo: ${formatMoney(p.amount, currency)} + Propina: ${formatMoney(p.tipShare, currency)})\n`;
      });
    }

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      }
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 3000);
    } catch {
      // Fallback
    }
  };

  // Registrar directamente como transacción en FinanTrack
  const handleSaveToFinanTrack = () => {
    const amountToRegister = Math.round(myPortion * 100) / 100;
    if (amountToRegister <= 0) return;

    addTransaction({
      amount: amountToRegister,
      type: 'expense',
      categoryId: selectedCategoryId || 'cat-alimentacion',
      accountId: selectedAccountId || accounts[0]?.id || '',
      date: new Date().toISOString().split('T')[0],
      note: `Cuenta compartida (${splitMode === 'equal' ? `${numPeople} personas` : 'mi parte'} + propina)`,
      tags: ['restaurante', 'propina', 'dividido'],
    });

    setIsSavedToast(true);
    setTimeout(() => setIsSavedToast(false), 4000);
  };

  // Abrir modal de transacción completo con datos pre-cargados
  const handleOpenFullModal = () => {
    if (onOpenTransactionWithData) {
      onOpenTransactionWithData({
        amount: Math.round(myPortion * 100) / 100,
        type: 'expense',
        categoryId: selectedCategoryId,
        accountId: selectedAccountId,
        date: new Date().toISOString().split('T')[0],
        note: `Cuenta compartida (${splitMode === 'equal' ? `${numPeople} personas` : 'mi parte'} + propina)`,
        tags: ['restaurante', 'propina', 'dividido'],
      });
    }
  };

  // Presets de propina estándar
  const tipPresets = [
    { label: '0%', value: 0, sentiment: 'Sin propina' },
    { label: '5%', value: 5, sentiment: 'Básica' },
    { label: '10%', value: 10, sentiment: 'Estándar' },
    { label: '12%', value: 12, sentiment: 'Buen servicio' },
    { label: '15%', value: 15, sentiment: 'Excelente' },
    { label: '18%', value: 18, sentiment: 'Excepcional' },
    { label: '20%', value: 20, sentiment: 'Extraordinaria' },
  ];

  return (
    <div className="space-y-6">
      
      {/* Encabezado de la herramienta */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-center shrink-0 shadow-xs">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>Calculadora de Propinas y División de Gastos</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-800/80">
                Finanzas Prácticas
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Calcula propinas según el servicio, divide cuentas entre comensales y registra tu parte al instante
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold transition-colors"
            title="Restablecer valores a los valores por defecto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer</span>
          </button>

          {isModal && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Cerrar calculadora"
            >
              <Minus className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Selector de Modo de División (Equitativo vs Consumo Personalizado) */}
      <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 max-w-md">
        <button
          type="button"
          onClick={() => setSplitMode('equal')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            splitMode === 'equal'
              ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Reparto Equitativo (Partes Iguales)</span>
        </button>

        <button
          type="button"
          onClick={() => setSplitMode('custom')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            splitMode === 'custom'
              ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <PieChart className="w-4 h-4" />
          <span>Por Consumo Individual</span>
        </button>
      </div>

      {/* Contenido en cuadrícula responsiva */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Columna Izquierda: Parámetros y Entradas (7 columnas) */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* 1. Importe de la cuenta */}
          <div className="bg-gradient-to-br from-white via-slate-50/60 to-slate-100/50 dark:from-slate-900 dark:via-slate-800/80 dark:to-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="bill-amount-input" className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Importe Total de la Cuenta ({currency})</span>
              </label>
              {splitMode === 'custom' && (
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  Calculado de consumos individuales
                </span>
              )}
            </div>

            {splitMode === 'equal' ? (
              <div className="relative">
                <input
                  id="bill-amount-input"
                  type="number"
                  step="0.01"
                  min="0"
                  value={billAmountStr}
                  onChange={(e) => setBillAmountStr(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-4 pr-12 py-3 bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl text-xl sm:text-2xl font-black font-mono-num text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-base font-bold text-slate-400 dark:text-slate-500">
                  {currency}
                </span>
              </div>
            ) : (
              <div className="p-3.5 bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Suma de consumos ingresados:</span>
                  <span className="text-2xl font-black font-mono-num text-slate-900 dark:text-white">
                    {formatMoney(effectiveSubtotal, currency)}
                  </span>
                </div>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded-lg">
                  {participants.length} comensales
                </span>
              </div>
            )}
          </div>

          {/* 2. Configuración de Propina */}
          <div className="bg-gradient-to-br from-white via-slate-50/60 to-slate-100/50 dark:from-slate-900 dark:via-slate-800/80 dark:to-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Percent className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Propina (Gratificación)
                </span>
              </div>

              {/* Selector % vs Fijo */}
              <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setTipType('percent')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    tipType === 'percent'
                      ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  Porcentaje (%)
                </button>
                <button
                  type="button"
                  onClick={() => setTipType('fixed')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    tipType === 'fixed'
                      ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  Monto Fijo ({currency})
                </button>
              </div>
            </div>

            {tipType === 'percent' ? (
              <div className="space-y-3">
                {/* Botones de porcentaje predeterminado */}
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                  {tipPresets.map((preset) => {
                    const isSelected = tipPercent === preset.value && !customPercentStr;
                    return (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => {
                          setTipPercent(preset.value);
                          setCustomPercentStr('');
                        }}
                        className={`py-2 px-1 rounded-xl text-center font-bold text-xs transition-all border ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-600/30'
                            : 'bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-slate-700 hover:border-emerald-500/50'
                        }`}
                      >
                        <span className="block font-mono-num text-sm">{preset.label}</span>
                        <span className={`text-[9px] block truncate font-medium ${isSelected ? 'text-emerald-100' : 'text-slate-400'}`}>
                          {preset.sentiment}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Input de porcentaje personalizado y Slider interactivo */}
                <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
                  <div className="flex-1 w-full flex items-center gap-3">
                    <input
                      type="range"
                      min="0"
                      max="30"
                      step="1"
                      value={customPercentStr ? parseFloat(customPercentStr) || 0 : tipPercent}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setTipPercent(val);
                        setCustomPercentStr('');
                      }}
                      className="w-full accent-emerald-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                    />
                    <span className="font-mono-num font-bold text-xs text-slate-700 dark:text-slate-300 w-10 text-right">
                      {customPercentStr ? `${customPercentStr}%` : `${tipPercent}%`}
                    </span>
                  </div>

                  <div className="w-full sm:w-36 relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      placeholder="Otro %"
                      value={customPercentStr}
                      onChange={(e) => setCustomPercentStr(e.target.value)}
                      className="w-full pl-3 pr-7 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono-num"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      %
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="number"
                  step="0.50"
                  min="0"
                  placeholder="0.00"
                  value={fixedTipStr}
                  onChange={(e) => setFixedTipStr(e.target.value)}
                  className="w-full pl-4 pr-12 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-lg font-bold font-mono-num text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                  {currency}
                </span>
              </div>
            )}
          </div>

          {/* 3. Número de Personas / Comensales (si es reparto equitativo) */}
          {splitMode === 'equal' ? (
            <div className="bg-gradient-to-br from-white via-slate-50/60 to-slate-100/50 dark:from-slate-900 dark:via-slate-800/80 dark:to-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Número de Comensales</span>
                </label>
                <span className="text-xs font-bold font-mono-num text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-200/60 dark:border-emerald-800/60">
                  {numPeople} {numPeople === 1 ? 'persona' : 'personas'}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setNumPeople(Math.max(1, numPeople - 1))}
                  disabled={numPeople <= 1}
                  className="w-11 h-11 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 disabled:opacity-30 disabled:pointer-events-none text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center transition-all shadow-xs"
                  aria-label="Restar una persona"
                >
                  <Minus className="w-5 h-5" />
                </button>

                <div className="flex-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                  {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setNumPeople(n)}
                      className={`min-w-[36px] h-10 px-2.5 rounded-xl font-mono-num font-bold text-xs sm:text-sm transition-all border ${
                        numPeople === n
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setNumPeople(numPeople + 1)}
                  className="w-11 h-11 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center transition-all shadow-xs"
                  aria-label="Añadir una persona"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : (
            /* Lista de Comensales para Reparto por Consumo */
            <div className="bg-gradient-to-br from-white via-slate-50/60 to-slate-100/50 dark:from-slate-900 dark:via-slate-800/80 dark:to-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Consumo por Comensal</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Introduce lo que pidió cada persona; la propina se prorrateará según su consumo
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAddParticipant}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Añadir</span>
                </button>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {participants.map((p, idx) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-2 p-2.5 bg-white dark:bg-slate-800/90 rounded-xl border border-slate-200/80 dark:border-slate-700 shadow-xs"
                  >
                    <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold text-xs shrink-0">
                      {idx + 1}
                    </div>

                    <input
                      type="text"
                      value={p.name}
                      onChange={(e) => handleUpdateParticipant(p.id, { name: e.target.value })}
                      placeholder={`Comensal ${idx + 1}`}
                      className="flex-1 min-w-[90px] px-2.5 py-1.5 text-xs font-bold text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />

                    <div className="w-28 relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={p.amount === 0 ? '' : p.amount}
                        onChange={(e) => handleUpdateParticipant(p.id, { amount: Math.max(0, parseFloat(e.target.value) || 0) })}
                        placeholder="0.00"
                        className="w-full pl-2.5 pr-7 py-1.5 text-xs font-bold font-mono-num text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                        {currency}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveParticipant(p.id)}
                      disabled={participants.length <= 1}
                      className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 disabled:opacity-20 disabled:pointer-events-none rounded-lg transition-colors"
                      title="Eliminar comensal"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Opciones de Redondeo Inteligente */}
          <div className="bg-gradient-to-br from-white via-slate-50/60 to-slate-100/50 dark:from-slate-900 dark:via-slate-800/80 dark:to-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">
              Redondeo Inteligente de Cambio
            </span>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRoundingMode('none')}
                className={`p-2.5 rounded-xl text-center border text-xs font-bold transition-all ${
                  roundingMode === 'none'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <span>Exacto</span>
                <span className={`block text-[10px] font-normal ${roundingMode === 'none' ? 'text-emerald-100' : 'text-slate-400'}`}>
                  Con céntimos
                </span>
              </button>

              <button
                type="button"
                onClick={() => setRoundingMode('person_up')}
                className={`p-2.5 rounded-xl text-center border text-xs font-bold transition-all ${
                  roundingMode === 'person_up'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <span>Por Persona ↑</span>
                <span className={`block text-[10px] font-normal ${roundingMode === 'person_up' ? 'text-emerald-100' : 'text-slate-400'}`}>
                  Al entero más alto
                </span>
              </button>

              <button
                type="button"
                onClick={() => setRoundingMode('total_up')}
                className={`p-2.5 rounded-xl text-center border text-xs font-bold transition-all ${
                  roundingMode === 'total_up'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <span>Total Cuenta ↑</span>
                <span className={`block text-[10px] font-normal ${roundingMode === 'total_up' ? 'text-emerald-100' : 'text-slate-400'}`}>
                  Sin monedas chicas
                </span>
              </button>
            </div>
          </div>

        </div>

        {/* Columna Derecha: Tarjeta de Resumen y Acciones (5 columnas) */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Tarjeta de Resumen con degradado insignia adaptativo */}
          <div className="bg-gradient-to-br from-white via-slate-50 to-slate-100/80 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6 sm:p-7 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-md shadow-slate-200/50 dark:shadow-xl dark:shadow-slate-900/20 relative overflow-hidden space-y-5 transition-colors">
            
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 block">
                {splitMode === 'equal' ? 'Cuota a Pagar Por Persona' : 'Tu Cuota Estimada (Yo)'}
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white font-mono-num tracking-tight">
                  {formatMoney(myPortion, currency)}
                </span>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  {splitMode === 'equal' ? `(÷ ${numPeople} comensales)` : 'con propina incluida'}
                </span>
              </div>
            </div>

            {/* Desglose de totales */}
            <div className="space-y-2.5 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>Subtotal Consumo:</span>
                <span className="font-bold font-mono-num text-slate-800 dark:text-slate-200">
                  {formatMoney(effectiveSubtotal, currency)}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <span>Propina calculada</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-bold">
                    {effectiveTipPercent.toFixed(1)}%
                  </span>
                </span>
                <span className="font-bold font-mono-num text-emerald-600 dark:text-emerald-400">
                  +{formatMoney(finalTipAmount, currency)}
                </span>
              </div>

              {roundingMode !== 'none' && (
                <div className="flex items-center justify-between text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                  <span>Ajuste por redondeo fácil:</span>
                  <span className="font-mono-num">
                    +{formatMoney(finalTotal - rawTotal, currency)}
                  </span>
                </div>
              )}

              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-sm">
                <span className="font-extrabold text-slate-900 dark:text-white">Total con Propina:</span>
                <span className="font-black font-mono-num text-slate-900 dark:text-white text-base">
                  {formatMoney(finalTotal, currency)}
                </span>
              </div>
            </div>

            {/* Si es personalizado, mini desglose por comensal */}
            {splitMode === 'custom' && participantsBreakdown.length > 0 && (
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Desglose individual completo:
                </span>
                <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                  {participantsBreakdown.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-100/80 dark:bg-slate-800/60"
                    >
                      <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[120px]">
                        {p.name}
                      </span>
                      <span className="font-bold font-mono-num text-slate-900 dark:text-white">
                        {formatMoney(p.totalToPay, currency)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Acciones de Compartir */}
            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleCopySummary}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-98"
              >
                {copiedSummary ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-300">¡Copiado al Portapapeles!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4 text-emerald-400" />
                    <span>Copiar Resumen para WhatsApp</span>
                  </>
                )}
              </button>
            </div>

            {/* Glow decorativo sutil */}
            <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          </div>

          {/* Módulo de Integración: Registrar directamente en FinanTrack */}
          <div className="bg-gradient-to-br from-white via-slate-50/60 to-slate-100/50 dark:from-slate-900 dark:via-slate-800/80 dark:to-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                  Registrar mi parte en FinanTrack
                </span>
              </div>
              <span className="text-xs font-bold font-mono-num text-emerald-600 dark:text-emerald-400">
                {formatMoney(myPortion, currency)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                  Cuenta de pago
                </label>
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({formatMoney(acc.balance, currency)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                  Categoría
                </label>
                <select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {categories.filter(c => c.type === 'expense').map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={handleSaveToFinanTrack}
                disabled={myPortion <= 0}
                className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 disabled:opacity-40 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all"
              >
                <Check className="w-4 h-4" />
                <span>Guardar como Gasto</span>
              </button>

              {onOpenTransactionWithData && (
                <button
                  type="button"
                  onClick={handleOpenFullModal}
                  disabled={myPortion <= 0}
                  className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-98 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center transition-all"
                  title="Abrir formulario completo para agregar más notas o recibos"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>

            {isSavedToast && (
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>¡Gasto de {formatMoney(myPortion, currency)} guardado exitosamente en tus transacciones!</span>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
