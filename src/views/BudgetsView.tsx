import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatMoney, formatMonthPeriod } from '../utils/format';
import { DynamicIcon } from '../components/DynamicIcon';
import { 
  Plus, AlertTriangle, CheckCircle2, AlertCircle, 
  TrendingDown, PieChart, Sparkles, SlidersHorizontal, Edit3 
} from 'lucide-react';

interface BudgetsViewProps {
  onOpenBudgetModal: (categoryId?: string) => void;
}

export const BudgetsView: React.FC<BudgetsViewProps> = ({ onOpenBudgetModal }) => {
  const { 
    categories, 
    budgets, 
    selectedPeriod, 
    currency, 
    getCategoryById, 
    getCategorySpendForPeriod 
  } = useFinance();

  const [filter, setFilter] = useState<'all' | 'exceeded' | 'warning' | 'ok'>('all');

  const expenseCategories = categories.filter(c => c.type === 'expense');

  // Mapear todas las categorías de gasto y su presupuesto
  const categoryBudgets = expenseCategories.map(cat => {
    const budget = budgets.find(b => b.categoryId === cat.id && b.period === selectedPeriod);
    const spent = getCategorySpendForPeriod(cat.id, selectedPeriod);
    const limit = budget?.monthlyLimit || 0;
    const hasBudget = limit > 0;
    const percent = hasBudget ? Math.round((spent / limit) * 100) : 0;
    const remaining = Math.max(0, limit - spent);
    const overspent = Math.max(0, spent - limit);
    const isExceeded = hasBudget && spent > limit;
    const isWarning = hasBudget && !isExceeded && spent >= (limit * (budget?.alertThreshold || 85)) / 100;

    return {
      category: cat,
      budget,
      spent,
      limit,
      hasBudget,
      percent,
      remaining,
      overspent,
      isExceeded,
      isWarning,
    };
  });

  // Filtro
  const filteredList = categoryBudgets.filter(item => {
    if (!item.hasBudget && filter !== 'all') return false;
    if (filter === 'exceeded') return item.isExceeded;
    if (filter === 'warning') return item.isWarning;
    if (filter === 'ok') return item.hasBudget && !item.isExceeded && !item.isWarning;
    return true;
  });

  // Métricas totales de presupuestos
  const totalBudgeted = budgets
    .filter(b => b.period === selectedPeriod)
    .reduce((sum, b) => sum + b.monthlyLimit, 0);

  const totalSpentInBudgetedCats = categoryBudgets
    .filter(item => item.hasBudget)
    .reduce((sum, item) => sum + item.spent, 0);

  const totalRemaining = Math.max(0, totalBudgeted - totalSpentInBudgetedCats);
  const overallPercent = totalBudgeted > 0 ? Math.round((totalSpentInBudgetedCats / totalBudgeted) * 100) : 0;

  const exceededCount = categoryBudgets.filter(b => b.isExceeded).length;
  const warningCount = categoryBudgets.filter(b => b.isWarning).length;

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Presupuestos Mensuales
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Límites de gasto y control para <span className="text-slate-800 font-semibold">{formatMonthPeriod(selectedPeriod)}</span>
          </p>
        </div>

        <button
          onClick={() => onOpenBudgetModal()}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold shadow-md shadow-emerald-600/20 transition-all hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          <span>Fijar Presupuesto</span>
        </button>
      </div>

      {/* Banner Resumen Global */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Presupuestado</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono-num">
                {formatMoney(totalSpentInBudgetedCats, currency)}
              </span>
              <span className="text-sm font-bold text-slate-400 font-mono-num">
                / {formatMoney(totalBudgeted, currency)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-xl border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Disponible: {formatMoney(totalRemaining, currency)}</span>
            </div>
            {exceededCount > 0 && (
              <div className="flex items-center gap-1.5 bg-red-50 text-red-800 px-3 py-1.5 rounded-xl border border-red-200">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span>{exceededCount} sobrepasados</span>
              </div>
            )}
          </div>
        </div>

        {/* Barra de progreso global */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-semibold text-slate-500">
            <span>Progreso del mes ({overallPercent}%)</span>
            <span>{totalBudgeted > 0 ? (100 - overallPercent) : 0}% disponible</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                overallPercent > 100 ? 'bg-red-500' : overallPercent >= 85 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, overallPercent)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Filtros de estado */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        <button
          onClick={() => setFilter('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
            filter === 'all'
              ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          Todas las categorías ({categoryBudgets.length})
        </button>

        <button
          onClick={() => setFilter('exceeded')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
            filter === 'exceeded'
              ? 'bg-red-500 text-white border-red-500 shadow-sm'
              : 'bg-white text-red-600 border-slate-200 hover:bg-red-50'
          }`}
        >
          Excedidos ({exceededCount})
        </button>

        <button
          onClick={() => setFilter('warning')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
            filter === 'warning'
              ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
              : 'bg-white text-amber-600 border-slate-200 hover:bg-amber-50'
          }`}
        >
          En alerta ({warningCount})
        </button>

        <button
          onClick={() => setFilter('ok')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
            filter === 'ok'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
              : 'bg-white text-emerald-700 border-slate-200 hover:bg-emerald-50'
          }`}
        >
          Dentro de límite
        </button>
      </div>

      {/* Grid de Presupuestos por Categoría */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredList.map((item) => {
          const { category, hasBudget, limit, spent, percent, remaining, overspent, isExceeded, isWarning } = item;

          return (
            <div
              key={category.id}
              className={`bg-white p-5 rounded-2xl border transition-all shadow-sm hover:shadow-md ${
                isExceeded 
                  ? 'border-red-300 ring-1 ring-red-300' 
                  : isWarning 
                  ? 'border-amber-300 ring-1 ring-amber-300' 
                  : 'border-slate-200/80'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm"
                    style={{ backgroundColor: category.color }}
                  >
                    <DynamicIcon name={category.icon} size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm sm:text-base text-slate-900 leading-snug">
                      {category.name}
                    </h4>
                    <p className="text-xs text-slate-400 font-medium">
                      {hasBudget ? `Límite: ${formatMoney(limit, currency)}/mes` : 'Sin límite fijado'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => onOpenBudgetModal(category.id)}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                  title="Ajustar límite"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>

              {hasBudget ? (
                <div className="space-y-2 mt-4 pt-3 border-t border-slate-100">
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="font-bold text-slate-700">
                      Gastado: <span className="font-mono-num">{formatMoney(spent, currency)}</span>
                    </span>
                    <span className={`font-bold font-mono-num ${
                      isExceeded ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-emerald-600'
                    }`}>
                      {percent}%
                    </span>
                  </div>

                  {/* Barra de progreso */}
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isExceeded ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, percent)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1">
                    {isExceeded ? (
                      <span className="text-red-600 font-bold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Excedido por {formatMoney(overspent, currency)}
                      </span>
                    ) : isWarning ? (
                      <span className="text-amber-600 font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Quedan {formatMoney(remaining, currency)} (Cerca del límite)
                      </span>
                    ) : (
                      <span className="text-emerald-700 font-semibold">
                        Disponible: {formatMoney(remaining, currency)}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500">Gastado este mes: <strong>{formatMoney(spent, currency)}</strong></span>
                  <button
                    onClick={() => onOpenBudgetModal(category.id)}
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors"
                  >
                    + Fijar Límite
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
};
