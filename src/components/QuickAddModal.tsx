import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useUser } from '../context/UserContext';
import { TransactionType } from '../types/finance';
import { BottomSheet } from './ui/BottomSheet';
import { DynamicIcon } from './DynamicIcon';
import { TrendingDown, TrendingUp, ArrowRightLeft, Check, Sparkles, SlidersHorizontal, Loader2 } from 'lucide-react';
import { CURRENCIES, formatMoney } from '../utils/format';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenFullModal: (type: TransactionType, initialData?: any) => void;
  initialType?: TransactionType;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({
  isOpen,
  onClose,
  onOpenFullModal,
  initialType = 'expense',
}) => {
  const { categories, accounts, currency, addTransaction, templates } = useFinance();
  const { hasPermission } = useUser();

  const [type, setType] = useState<TransactionType>(initialType);
  const [amountStr, setAmountStr] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedAccount, setSelectedAccount] = useState<string>(accounts[0]?.id || '');
  const [toAccount, setToAccount] = useState<string>(accounts[1]?.id || '');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Initial category setup
  React.useEffect(() => {
    if (isOpen) {
      if (initialType) {
        setType(initialType);
      }
      setAmountStr('');
      setNote('');
      setError('');
      setSelectedAccount(accounts[0]?.id || '');
      setToAccount(accounts[1]?.id || '');
      const activeType = initialType || type;
      const defaultCat = categories.find(c => c.type === (activeType === 'transfer' ? 'expense' : activeType));
      setSelectedCategory(defaultCat?.id || categories[0]?.id || '');
    }
  }, [isOpen, initialType, categories, accounts]);

  if (!isOpen) return null;

  const filteredCategories = categories.filter(c => c.type === (type === 'transfer' ? 'expense' : type));
  const currSymbol = CURRENCIES[currency]?.symbol || '€';

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!hasPermission('canCreateTransactions')) {
      setError('No tienes permisos para registrar transacciones');
      return;
    }

    const normalized = amountStr.trim().replace(',', '.');
    const parsedAmount = parseFloat(normalized);
    if (!amountStr.trim() || isNaN(parsedAmount) || parsedAmount <= 0 || !/^\d+(\.\d{1,4})?$/.test(normalized)) {
      setError('Introduce un importe válido');
      return;
    }

    if (!selectedAccount) {
      setError('Selecciona una cuenta');
      return;
    }

    if (type === 'transfer' && (!toAccount || toAccount === selectedAccount)) {
      setError('Selecciona una cuenta de destino diferente');
      return;
    }

    setIsSubmitting(true);
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate(15); } catch {}
    }

    try {
      addTransaction({
        amount: parsedAmount,
        type,
        categoryId: type === 'transfer' ? (categories.find(c => c.id === 'cat-inversiones')?.id || selectedCategory || categories[0]?.id) : selectedCategory,
        accountId: selectedAccount,
        toAccountId: type === 'transfer' ? toAccount : undefined,
        date: new Date().toISOString().split('T')[0],
        note: note.trim(),
        tags: [],
        isRecurring: false,
      });

      setIsSubmitting(false);
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err?.message || 'Error al guardar movimiento');
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            Registro Rápido
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300">
            3 pasos
          </span>
        </div>
      }
      headerAction={
        <button
          type="button"
          onClick={() => {
            onClose();
            onOpenFullModal(type, {
              amount: parseFloat(amountStr.replace(',', '.')) || undefined,
              categoryId: selectedCategory,
              accountId: selectedAccount,
              toAccountId: toAccount,
              note,
            });
          }}
          className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
          title="Abrir formulario completo con tags, fecha y recurrencia"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Formulario completo</span>
        </button>
      }
      maxWidth="max-w-md"
    >
      <form onSubmit={handleQuickSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 text-xs font-medium rounded-xl border border-red-200 dark:border-red-800 animate-in fade-in">
            {error}
          </div>
        )}

        {/* 1. Selector de Tipo */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700">
          <button
            type="button"
            onClick={() => {
              setType('expense');
              const defaultCat = categories.find(c => c.type === 'expense');
              if (defaultCat) setSelectedCategory(defaultCat.id);
            }}
            className={`flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold rounded-lg transition-all min-h-[44px] ${
              type === 'expense'
                ? 'bg-red-500 text-white shadow-md shadow-red-500/20'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <TrendingDown className="w-4 h-4" />
            <span>Gasto</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setType('income');
              const defaultCat = categories.find(c => c.type === 'income');
              if (defaultCat) setSelectedCategory(defaultCat.id);
            }}
            className={`flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold rounded-lg transition-all min-h-[44px] ${
              type === 'income'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Ingreso</span>
          </button>

          <button
            type="button"
            onClick={() => setType('transfer')}
            className={`flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold rounded-lg transition-all min-h-[44px] ${
              type === 'transfer'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>Traspaso</span>
          </button>
        </div>

        {/* 2. Importe con Teclado Numérico Directo */}
        <div>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-3xl font-bold text-slate-400">
              {currSymbol}
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              placeholder="0.00"
              autoFocus
              className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-2xl text-3xl font-black text-slate-900 dark:text-white font-mono-num placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-center"
            />
          </div>

          {/* Botones de incremento rápido */}
          <div className="flex items-center justify-center gap-1.5 mt-2 overflow-x-auto no-scrollbar py-0.5">
            {[5, 10, 20, 50, 100].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => {
                  const curr = parseFloat(amountStr.replace(',', '.')) || 0;
                  setAmountStr((curr + val).toString());
                }}
                className="px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition-all min-h-[36px]"
              >
                +{val}
              </button>
            ))}
            {amountStr && (
              <button
                type="button"
                onClick={() => setAmountStr('')}
                className="px-3 py-1.5 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors min-h-[36px]"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>

        {/* 3. Selección de Categoría / Origen */}
        {type !== 'transfer' ? (
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">
              Categoría
            </label>
            <div className="grid grid-cols-3 gap-1.5 max-h-36 overflow-y-auto p-1 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800/40 scroll-touch">
              {filteredCategories.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl text-center border transition-all min-h-[56px] active:scale-95 ${
                      isSelected
                        ? 'bg-white dark:bg-slate-700 border-slate-900 dark:border-emerald-500 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-900 dark:ring-emerald-500'
                        : 'bg-white/60 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-white mb-1 shadow-xs"
                      style={{ backgroundColor: cat.color }}
                    >
                      <DynamicIcon name={cat.icon} size={14} />
                    </div>
                    <span className="text-[10px] font-semibold truncate max-w-full leading-tight">
                      {cat.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                Origen
              </label>
              <select
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-white min-h-[44px]"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.balance.toFixed(2)}€)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                Destino
              </label>
              <select
                value={toAccount}
                onChange={(e) => setToAccount(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-white min-h-[44px]"
              >
                {accounts
                  .filter((a) => a.id !== selectedAccount)
                  .map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.balance.toFixed(2)}€)
                    </option>
                  ))}
              </select>
            </div>
          </div>
        )}

        {/* 4. Cuenta y Concepto opcional */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {type !== 'transfer' && (
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                Cuenta
              </label>
              <select
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-white min-h-[40px]"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.balance.toFixed(2)}€)
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className={type === 'transfer' ? 'sm:col-span-2' : ''}>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
              Nota / Detalle (Opcional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ej. Café, Almuerzo..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white placeholder:text-slate-400 min-h-[40px]"
            />
          </div>
        </div>

        {/* Botón de Guardado Inmediato */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 rounded-xl bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-700 text-sm font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 min-h-[48px] active:scale-[0.98]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Check className="w-5 h-5 stroke-[2.5]" />
                <span>Registrar {type === 'expense' ? 'Gasto' : type === 'income' ? 'Ingreso' : 'Traspaso'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </BottomSheet>
  );
};
