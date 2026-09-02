import React, { useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { DynamicIcon } from './DynamicIcon';
import { X, Check, Trash2, RotateCcw } from 'lucide-react';
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
  const [autoRenew, setAutoRenew] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const expenseCategories = categories.filter(c => c.type === 'expense');

  useEffect(() => {
    if (categoryIdToEdit) {
      setCategoryId(categoryIdToEdit);
      const existing = budgets.find(b => b.categoryId === categoryIdToEdit && b.period === selectedPeriod);
      if (existing) {
        setLimitStr(existing.monthlyLimit.toString());
        setAlertThreshold(existing.alertThreshold || 85);
        setAutoRenew(existing.autoRenew !== false);
      } else {
        setLimitStr('');
        setAlertThreshold(85);
        setAutoRenew(true);
      }
    } else {
      setCategoryId(expenseCategories[0]?.id || '');
      setLimitStr('');
      setAlertThreshold(85);
      setAutoRenew(true);
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

    setBudget(categoryId, parsedLimit, alertThreshold, autoRenew);
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
    <div 
      role="dialog"
      aria-modal="true"
      aria-labelledby="budget-modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div 
        className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl shadow-2xl border-t sm:border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[90vh] pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Barra táctil indicadora de arrastre en móvil */}
        <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto my-2.5 sm:hidden shrink-0" aria-hidden="true" />

        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50">
          <div>
            <h3 id="budget-modal-title" className="font-bold text-lg text-slate-800 dark:text-white">
              {existingBudget ? 'Editar Presupuesto' : 'Fijar Presupuesto'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Periodo: {formatMonthPeriod(selectedPeriod)}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal de presupuesto"
            className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto scroll-touch">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs sm:text-sm font-medium rounded-xl border border-red-200 dark:border-red-800">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Categoría de Gasto
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              disabled={!!categoryIdToEdit}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-70"
            >
              {expenseCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Límite de Gasto Mensual
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-slate-400 dark:text-slate-500">
                {currSymbol}
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={limitStr}
                onChange={(e) => setLimitStr(e.target.value)}
                placeholder="400.00"
                autoFocus
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xl font-bold font-mono-num text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Umbral de Alerta Temprana
              </label>
              <span className="text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-200/80 dark:border-amber-800/60">
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
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              Recibirás aviso visual en amarillo al superar este porcentaje del presupuesto.
            </p>
          </div>

          {/* Configuración de Reinicio Automático Mensual */}
          <div className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-600/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    Reinicio Automático Mensual
                  </span>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Se renueva el día 1 de cada mes al 100% disponible
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoRenew}
                  onChange={(e) => setAutoRenew(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
            <p className="text-[11px] text-emerald-800/90 dark:text-emerald-300/80 leading-relaxed">
              {autoRenew
                ? '✓ Cada nuevo mes el gasto vuelve a 0€ manteniendo tu límite configurado, sin necesidad de reconfigurarlo.'
                : '○ Límite puntual solo para este periodo. No se replicará en meses futuros.'}
            </p>
          </div>

          <div className="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 pb-1">
            {existingBudget && (
              <button
                type="button"
                onClick={handleDelete}
                aria-label="Eliminar este presupuesto"
                className="p-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-800 transition-colors min-w-[48px] min-h-[48px] flex items-center justify-center active:scale-95"
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
              className="flex-1 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-sm font-semibold text-white shadow-md transition-all flex items-center justify-center gap-2 min-h-[48px] active:scale-[0.98]"
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

