import React, { useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { DynamicIcon } from './DynamicIcon';
import { X, Check, Trash2 } from 'lucide-react';
import { CURRENCIES, formatMonthPeriod } from '../utils/format';

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
  const { categories, budgets, selectedPeriod, currency, setBudget, deleteBudget } = useFinance();

  const [categoryId, setCategoryId] = useState<string>('');
  const [limitStr, setLimitStr] = useState<string>('');
  const [alertThreshold, setAlertThreshold] = useState<number>(85);
  const [error, setError] = useState<string>('');

  const expenseCategories = categories.filter(c => c.type === 'expense');

  useEffect(() => {
    if (categoryIdToEdit) {
      setCategoryId(categoryIdToEdit);
      const existing = budgets.find(b => b.categoryId === categoryIdToEdit && b.period === selectedPeriod);
      if (existing) {
        setLimitStr(existing.monthlyLimit.toString());
        setAlertThreshold(existing.alertThreshold || 85);
      } else {
        setLimitStr('');
        setAlertThreshold(85);
      }
    } else {
      setCategoryId(expenseCategories[0]?.id || '');
      setLimitStr('');
      setAlertThreshold(85);
    }
    setError('');
  }, [categoryIdToEdit, isOpen, budgets, selectedPeriod]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId) {
      setError('Por favor selecciona una categoría');
      return;
    }

    const parsedLimit = parseFloat(limitStr.replace(',', '.'));
    if (isNaN(parsedLimit) || parsedLimit <= 0) {
      setError('Introduce un límite mensual válido mayor a 0');
      return;
    }

    setBudget(categoryId, parsedLimit, alertThreshold);
    onClose();
  };

  const existingBudget = budgets.find(b => b.categoryId === categoryId && b.period === selectedPeriod);

  const handleDelete = () => {
    if (existingBudget && confirm('¿Deseas eliminar el límite de presupuesto para esta categoría?')) {
      deleteBudget(existingBudget.id);
      onClose();
    }
  };

  const selectedCat = categories.find(c => c.id === categoryId);
  const currSymbol = CURRENCIES[currency]?.symbol || '€';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div>
            <h3 className="font-bold text-lg text-slate-800">
              {existingBudget ? 'Editar Presupuesto' : 'Fijar Presupuesto'}
            </h3>
            <p className="text-xs text-slate-500 font-medium">Periodo: {formatMonthPeriod(selectedPeriod)}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-xs sm:text-sm font-medium rounded-xl border border-red-200">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Categoría de Gasto
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              disabled={!!categoryIdToEdit}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-70"
            >
              {expenseCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Límite de Gasto Mensual
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-slate-400">
                {currSymbol}
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={limitStr}
                onChange={(e) => setLimitStr(e.target.value)}
                placeholder="400.00"
                autoFocus
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xl font-bold font-mono-num text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Umbral de Alerta Temprana
              </label>
              <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                {alertThreshold}% del límite
              </span>
            </div>
            <input
              type="range"
              min="50"
              max="95"
              step="5"
              value={alertThreshold}
              onChange={(e) => setAlertThreshold(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Recibirás aviso visual en amarillo al superar este porcentaje del presupuesto.
            </p>
          </div>

          <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
            {existingBudget && (
              <button
                type="button"
                onClick={handleDelete}
                className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl border border-red-200 transition-colors"
                title="Eliminar presupuesto"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-sm font-semibold text-white shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Guardar</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
