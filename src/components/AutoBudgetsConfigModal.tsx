import React, { useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { AutoBudgetRule } from '../types/finance';
import { DynamicIcon } from './DynamicIcon';
import { X, Check, RotateCcw, Sparkles, CheckCircle2, ShieldAlert } from 'lucide-react';
import { CURRENCIES, formatMonthPeriod, getNextMonthFormatted } from '../utils/format';

interface AutoBudgetsConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DraftRuleItem {
  monthlyLimit: number;
  alertThreshold: number;
  enabled: boolean;
}

export const AutoBudgetsConfigModal: React.FC<AutoBudgetsConfigModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { 
    categories, 
    budgets, 
    autoBudgetRules, 
    selectedPeriod, 
    currency, 
    saveAutoBudgetRules 
  } = useFinance();

  const expenseCategories = categories.filter(c => c.type === 'expense');
  const currSymbol = CURRENCIES[currency]?.symbol || '€';

  // Reglas editables locales
  const [draftRules, setDraftRules] = useState<Record<string, DraftRuleItem>>({});
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) {
      setSavedSuccess(false);
      return;
    }

    // Inicializar el borrador a partir de autoBudgetRules existentes o presupuestos del periodo actual
    const initial: Record<string, DraftRuleItem> = {};
    
    expenseCategories.forEach(cat => {
      const existingRule = autoBudgetRules.find(r => r.categoryId === cat.id);
      const budgetInCurrentPeriod = budgets.find(b => b.categoryId === cat.id && b.period === selectedPeriod);

      if (existingRule) {
        initial[cat.id] = {
          monthlyLimit: existingRule.monthlyLimit,
          alertThreshold: existingRule.alertThreshold || 85,
          enabled: existingRule.enabled,
        };
      } else if (budgetInCurrentPeriod) {
        initial[cat.id] = {
          monthlyLimit: budgetInCurrentPeriod.monthlyLimit,
          alertThreshold: budgetInCurrentPeriod.alertThreshold || 85,
          enabled: budgetInCurrentPeriod.autoRenew !== false,
        };
      } else {
        initial[cat.id] = {
          monthlyLimit: 0,
          alertThreshold: 85,
          enabled: false,
        };
      }
    });

    setDraftRules(initial);
  }, [isOpen, autoBudgetRules, budgets, selectedPeriod, categories]);

  if (!isOpen) return null;

  const handleToggle = (categoryId: string) => {
    setDraftRules(prev => ({
      ...prev,
      [categoryId]: {
        ...prev[categoryId],
        enabled: !prev[categoryId]?.enabled,
      }
    }));
  };

  const handleLimitChange = (categoryId: string, val: string) => {
    const num = parseFloat(val.replace(',', '.'));
    setDraftRules(prev => ({
      ...prev,
      [categoryId]: {
        ...prev[categoryId],
        monthlyLimit: isNaN(num) ? 0 : num,
      }
    }));
  };

  const handleThresholdChange = (categoryId: string, threshold: number) => {
    setDraftRules(prev => ({
      ...prev,
      [categoryId]: {
        ...prev[categoryId],
        alertThreshold: threshold,
      }
    }));
  };

  const handleEnableAll = () => {
    setDraftRules(prev => {
      const updated: Record<string, DraftRuleItem> = { ...prev };
      Object.keys(updated).forEach(id => {
        // Si tiene límite 0, asignarle un valor sugerido de 100
        const currentLimit = updated[id]?.monthlyLimit || 0;
        updated[id] = {
          ...updated[id],
          enabled: true,
          monthlyLimit: currentLimit > 0 ? currentLimit : 100,
        };
      });
      return updated;
    });
  };

  const handleCopyFromCurrentMonth = () => {
    setDraftRules(prev => {
      const updated: Record<string, DraftRuleItem> = { ...prev };
      expenseCategories.forEach(cat => {
        const b = budgets.find(item => item.categoryId === cat.id && item.period === selectedPeriod);
        if (b && b.monthlyLimit > 0) {
          updated[cat.id] = {
            monthlyLimit: b.monthlyLimit,
            alertThreshold: b.alertThreshold || 85,
            enabled: true,
          };
        }
      });
      return updated;
    });
  };

  const handleSave = () => {
    const rulesToSave: AutoBudgetRule[] = Object.keys(draftRules).map(categoryId => {
      const data = draftRules[categoryId];
      return {
        categoryId,
        monthlyLimit: data.monthlyLimit,
        alertThreshold: data.alertThreshold,
        enabled: data.enabled && data.monthlyLimit > 0,
      };
    });

    saveAutoBudgetRules(rulesToSave);
    setSavedSuccess(true);
    setTimeout(() => {
      onClose();
    }, 400);
  };

  const activeCount = Object.keys(draftRules).filter(id => draftRules[id]?.enabled && draftRules[id]?.monthlyLimit > 0).length;
  const nextMonthName = getNextMonthFormatted(selectedPeriod);

  return (
    <div 
      role="dialog"
      aria-modal="true"
      aria-labelledby="autobudgets-modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div 
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl shadow-2xl border-t sm:border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[90vh] pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Barra táctil de arrastre móvil */}
        <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto my-2.5 sm:hidden shrink-0" aria-hidden="true" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 id="autobudgets-modal-title" className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                Límites Mensuales Automáticos
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Se reinician a 0€ gastados el día 1 de cada mes
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal de límites automáticos"
            className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Explicación y Barra de Acciones Rápidas */}
        <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-3">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 space-y-1">
              <p className="font-semibold text-slate-900 dark:text-slate-100">
                ¿Cómo funciona el reinicio automático?
              </p>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-xs">
                Las categorías con límite automático mantendrán su tope activo mes a mes. Cada <strong>día 1 del mes</strong>, el contador de gasto vuelve a <strong>0 {currSymbol}</strong> y dispones del <strong>100%</strong> de tu presupuesto sin tener que reintroducirlo manualmente. Próximo reinicio: <strong>1 de {nextMonthName}</strong>.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-emerald-100 dark:border-emerald-900/60">
            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
              {activeCount} de {expenseCategories.length} categorías configuradas
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyFromCurrentMonth}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Copiar del mes actual
              </button>
              <button
                type="button"
                onClick={handleEnableAll}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm"
              >
                Activar en todas
              </button>
            </div>
          </div>
        </div>

        {/* Lista de Categorías */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3 flex-1 divide-y divide-slate-100 dark:divide-slate-800/80">
          {expenseCategories.map(cat => {
            const rule = draftRules[cat.id] || { monthlyLimit: 0, alertThreshold: 85, enabled: false };
            const isEnabled = rule.enabled;

            return (
              <div 
                key={cat.id} 
                className={`pt-3 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl transition-colors ${
                  isEnabled 
                    ? 'bg-slate-50/90 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60' 
                    : 'opacity-60 hover:opacity-100'
                }`}
              >
                {/* Categoría & Switch */}
                <div className="flex items-center gap-3 min-w-[200px]">
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      onChange={() => handleToggle(cat.id)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>

                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm"
                    style={{ backgroundColor: cat.color }}
                  >
                    <DynamicIcon name={cat.icon} size={18} />
                  </div>

                  <div>
                    <span className="font-bold text-sm text-slate-800 dark:text-slate-100 block leading-tight">
                      {cat.name}
                    </span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500">
                      {isEnabled ? 'Reinicio día 1 activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>

                {/* Inputs de Configuración de Límite y Umbral */}
                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">Límite:</span>
                    <div className="relative w-28">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        {currSymbol}
                      </span>
                      <input
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="10"
                        disabled={!isEnabled}
                        value={rule.monthlyLimit === 0 ? '' : rule.monthlyLimit}
                        onChange={(e) => handleLimitChange(cat.id, e.target.value)}
                        placeholder="0"
                        className="w-full pl-7 pr-2 py-2 text-xs font-bold font-mono-num rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white disabled:opacity-40 focus:ring-2 focus:ring-emerald-500 outline-none min-h-[38px]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-400 dark:text-slate-500 font-medium" title="Umbral de Alerta">
                      Alerta:
                    </span>
                    <select
                      disabled={!isEnabled}
                      value={rule.alertThreshold}
                      onChange={(e) => handleThresholdChange(cat.id, Number(e.target.value))}
                      className="px-2 py-1.5 text-xs font-medium rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 disabled:opacity-40 focus:ring-2 focus:ring-emerald-500 outline-none"
                    >
                      <option value={70}>70%</option>
                      <option value={80}>80%</option>
                      <option value={85}>85%</option>
                      <option value={90}>90%</option>
                      <option value={95}>95%</option>
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 pb-1">
          <button
            type="button"
            onClick={onClose}
            className="py-3 px-5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-[0.98] transition-all min-h-[48px]"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={savedSuccess}
            className="py-3 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-500 text-white text-xs sm:text-sm font-semibold shadow-md shadow-emerald-600/20 active:scale-[0.98] transition-all flex items-center gap-2 min-h-[48px]"
          >
            {savedSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>¡Límites Guardados!</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Guardar y Aplicar Reglas</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
