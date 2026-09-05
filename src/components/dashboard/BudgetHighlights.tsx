import React from 'react';
import { RelevantBudget } from '../../utils/dashboardHelpers';
import { CurrencyCode } from '../../types/finance';
import { formatMoney } from '../../utils/format';
import { Target, ChevronRight, AlertTriangle, CheckCircle2, Plus } from 'lucide-react';
import { DynamicIcon } from '../DynamicIcon';

interface BudgetHighlightsProps {
  budgets: RelevantBudget[];
  currency: CurrencyCode;
  onNavigateToBudgets: () => void;
  canManageBudgets: boolean;
}

export const BudgetHighlights: React.FC<BudgetHighlightsProps> = ({
  budgets,
  currency,
  onNavigateToBudgets,
  canManageBudgets,
}) => {
  const exceededCount = budgets.filter((b) => b.isExceeded).length;
  const warningCount = budgets.filter((b) => b.isWarning).length;

  return (
    <div
      id="dashboard-budget-highlights"
      className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between"
    >
      <div>
        {/* Cabecera */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Control de Presupuestos
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Categorías con mayor seguimiento
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onNavigateToBudgets}
            className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 flex items-center gap-0.5 transition-colors"
          >
            <span>Ver todos</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Lista de presupuestos relevantes o Estado Vacío */}
        {budgets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-4">
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              No hay presupuestos activos en este período
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 mb-3">
              Fija límites mensuales para controlar tus gastos por categoría
            </p>
            {canManageBudgets && (
              <button
                type="button"
                onClick={onNavigateToBudgets}
                className="px-3 py-2 bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 hover:bg-purple-100 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Crear presupuesto</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3.5">
            {budgets.map((b) => (
              <div key={b.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-white shrink-0"
                      style={{ backgroundColor: b.categoryColor }}
                    >
                      <DynamicIcon name={b.categoryIcon} size={13} />
                    </div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[140px]">
                      {b.categoryName}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 font-mono-num">
                    <span
                      data-amount={b.spent}
                      className={`font-bold ${
                        b.isExceeded
                          ? 'text-red-600 dark:text-red-400'
                          : b.isWarning
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {formatMoney(b.spent, currency)}
                    </span>
                    <span className="text-slate-400">/ {formatMoney(b.limit, currency)}</span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                        b.isExceeded
                          ? 'bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300'
                          : b.isWarning
                          ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {b.percent}%
                    </span>
                  </div>
                </div>

                {/* Barra de progreso */}
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      b.isExceeded ? 'bg-red-500' : b.isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, b.percent)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Resumen inferior de estado */}
      {budgets.length > 0 && (
        <div className="pt-3 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium">
          <span>
            {exceededCount > 0 ? (
              <strong className="text-red-600 dark:text-red-400">{exceededCount} excedido(s)</strong>
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400">Sin presupuestos excedidos</span>
            )}
          </span>
          <button
            type="button"
            onClick={onNavigateToBudgets}
            className="hover:text-slate-800 dark:hover:text-slate-200 underline"
          >
            Ajustar límites
          </button>
        </div>
      )}
    </div>
  );
};
