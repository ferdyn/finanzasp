import React from 'react';
import { CurrencyCode } from '../../types/finance';
import { formatMoney } from '../../utils/format';
import { PieChart, ChevronRight } from 'lucide-react';
import { DynamicIcon } from '../DynamicIcon';

export interface CategorySpendItem {
  name: string;
  value: number;
  color: string;
  icon?: string;
}

interface SpendingHighlightsProps {
  topExpenses: CategorySpendItem[];
  totalExpense: number;
  currency: CurrencyCode;
  onNavigateToAnalytics: () => void;
}

export const SpendingHighlights: React.FC<SpendingHighlightsProps> = ({
  topExpenses,
  totalExpense,
  currency,
  onNavigateToAnalytics,
}) => {
  return (
    <div
      id="dashboard-spending-highlights"
      className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between"
    >
      <div>
        {/* Cabecera */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <PieChart className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Gastos por Categoría
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Principales destinos de tus gastos
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onNavigateToAnalytics}
            className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 flex items-center gap-0.5 transition-colors"
          >
            <span>Detalle</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Lista de Categorías de Gasto o Estado Vacío */}
        {topExpenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-4">
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              No hay gastos registrados en este período
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              Los gastos que registres se clasificarán automáticamente aquí
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {topExpenses.map((item) => {
              const percentOfTotal = totalExpense > 0 
                ? Math.round((item.value / totalExpense) * 100) 
                : 0;

              return (
                <div key={item.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-white shrink-0"
                        style={{ backgroundColor: item.color }}
                      >
                        <DynamicIcon name={item.icon || 'PieChart'} size={13} />
                      </div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[140px]">
                        {item.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 font-mono-num">
                      <span data-amount={item.value} className="font-bold text-slate-900 dark:text-white">
                        {formatMoney(item.value, currency)}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-400">({percentOfTotal}%)</span>
                    </div>
                  </div>

                  {/* Barra proporcional */}
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, Math.max(2, percentOfTotal))}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Resumen inferior de total gastado */}
      {topExpenses.length > 0 && (
        <div className="pt-3 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Total gastado en el período</span>
          <span data-amount={totalExpense} className="font-bold text-slate-900 dark:text-white font-mono-num">
            {formatMoney(totalExpense, currency)}
          </span>
        </div>
      )}
    </div>
  );
};
