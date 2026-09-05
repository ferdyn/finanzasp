import React, { useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatMoney, formatMonthPeriod, CURRENCIES } from '../utils/format';
import { DynamicIcon } from './DynamicIcon';
import { BottomSheet } from './ui/BottomSheet';
import { Check, Trash2 } from 'lucide-react';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryIdToEdit?: string | null;
}

export const BudgetModal: React.FC<BudgetModalProps> = ({
  isOpen,
  onClose,
  categoryIdToEdit,
}) => {
  const { categories, budgets, setBudget, deleteBudget, selectedPeriod, currency } = useFinance();

  const [categoryId, setCategoryId] = useState<string>('');
  const [limitStr, setLimitStr] = useState<string>('');
  const [alertThreshold, setAlertThreshold] = useState<number>(80);
  const [autoRenew, setAutoRenew] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const expenseCategories = categories.filter((c) => c.type === 'expense');

  useEffect(() => {
    if (categoryIdToEdit) {
      setCategoryId(categoryIdToEdit);
      const existing = budgets.find((b) => b.categoryId === categoryIdToEdit);
      if (existing) {
        setLimitStr(existing.monthlyLimit.toString());
        setAlertThreshold(existing.alertThreshold || 80);
        setAutoRenew(existing.autoRenew !== false);
      }
    } else {
      setCategoryId(expenseCategories[0]?.id || '');
      setLimitStr('');
      setAlertThreshold(80);
      setAutoRenew(true);
    }
    setError('');
  }, [categoryIdToEdit, isOpen, budgets, expenseCategories]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!categoryId) {
      setError('Por favor selecciona una categoría');
      return;
    }

    const parsedLimit = parseFloat(limitStr.replace(',', '.'));
    if (isNaN(parsedLimit) || parsedLimit <= 0) {
      setError('Por favor introduce un límite numérico positivo mayor a 0');
      return;
    }

    setBudget(categoryId, parsedLimit, alertThreshold, autoRenew);
    onClose();
  };

  const handleDelete = () => {
    if (!categoryIdToEdit) return;
    const cat = categories.find((c) => c.id === categoryIdToEdit);
    const existing = budgets.find((b) => b.categoryId === categoryIdToEdit);
    if (existing && window.confirm(`¿Eliminar el presupuesto para "${cat?.name || 'esta categoría'}"?`)) {
      deleteBudget(existing.id);
      onClose();
    }
  };

  const currSymbol = CURRENCIES[currency]?.symbol || '€';
  const existingBudget = budgets.find((b) => b.categoryId === categoryId);

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={categoryIdToEdit ? 'Editar Presupuesto' : 'Nuevo Presupuesto'}
      description={`Periodo: ${formatMonthPeriod(selectedPeriod)}`}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSave} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 text-xs sm:text-sm font-medium rounded-xl border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            Categoría de Gasto
          </label>
          <select
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value);
              const b = budgets.find((bg) => bg.categoryId === e.target.value);
              if (b) {
                setLimitStr(b.monthlyLimit.toString());
                setAlertThreshold(b.alertThreshold || 80);
                setAutoRenew(b.autoRenew !== false);
              }
            }}
            disabled={!!categoryIdToEdit}
            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60 min-h-[44px]"
          >
            {expenseCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            Límite Mensual ({currSymbol})
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400 dark:text-slate-500">
              {currSymbol}
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={limitStr}
              onChange={(e) => setLimitStr(e.target.value)}
              placeholder="Ej. 350.00"
              autoFocus
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-lg font-bold font-mono-num text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          {existingBudget && !categoryIdToEdit && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 font-medium">
              Ya existe un límite de {formatMoney(existingBudget.monthlyLimit, currency)} para esta categoría. Al guardar se actualizará.
            </p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Alerta Preventiva al Superar el:
            </label>
            <span className="text-xs font-bold font-mono-num px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
              {alertThreshold}%
            </span>
          </div>
          <input
            type="range"
            min="50"
            max="100"
            step="5"
            value={alertThreshold}
            onChange={(e) => setAlertThreshold(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-600"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>50% (Muy cauto)</span>
            <span>80% (Recomendado)</span>
            <span>100% (Límite estricto)</span>
          </div>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Renovación Automática</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Mantener este límite activo para los siguientes meses</p>
          </div>
          <input
            type="checkbox"
            checked={autoRenew}
            onChange={(e) => setAutoRenew(e.target.checked)}
            className="w-4 h-4 text-emerald-600 rounded border-slate-300 dark:border-slate-600 focus:ring-emerald-500 cursor-pointer"
          />
        </div>

        <div className="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 pb-1">
          {categoryIdToEdit && (
            <button
              type="button"
              onClick={handleDelete}
              aria-label="Eliminar este presupuesto"
              className="p-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-800 transition-colors min-w-[48px] min-h-[48px] flex items-center justify-center active:scale-95"
              title="Eliminar presupuesto"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors min-h-[48px] active:scale-[0.98]"
          >
            Cancelar
          </button>

          <button
            type="submit"
            className="flex-1 py-3 px-4 rounded-xl bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-700 text-sm font-semibold text-white shadow-md transition-all flex items-center justify-center gap-2 min-h-[48px] active:scale-[0.98]"
          >
            <Check className="w-4 h-4" />
            <span>Guardar</span>
          </button>
        </div>
      </form>
    </BottomSheet>
  );
};
