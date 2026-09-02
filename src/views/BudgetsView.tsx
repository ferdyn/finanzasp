import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatMoney, formatMonthPeriod, getNextMonthFormatted } from '../utils/format';
import { DynamicIcon } from '../components/DynamicIcon';
import { AutoBudgetsConfigModal } from '../components/AutoBudgetsConfigModal';
import { 
  Plus, AlertTriangle, CheckCircle2, AlertCircle, 
  TrendingDown, PieChart, Sparkles, SlidersHorizontal, Edit3,
  RotateCcw, CalendarClock, Settings2, Zap, ShieldCheck, Scissors,
  ArrowDownRight, Check, ShieldAlert
} from 'lucide-react';

interface BudgetsViewProps {
  onOpenBudgetModal: (categoryId?: string) => void;
}

export const BudgetsView: React.FC<BudgetsViewProps> = ({ onOpenBudgetModal }) => {
  const { 
    categories, 
    budgets, 
    autoBudgetRules,
    selectedPeriod, 
    currency, 
    getCategoryById, 
    getCategorySpendForPeriod,
    toggleBudgetAutoRenew,
    extremeSavingsMode,
    setExtremeSavingsMode,
    isCategoryEssential,
    extremeSavingsAnalysis,
    applyAllExtremeBudgetSuggestions,
    applyExtremeBudgetCutForCategory,
    restoreBudgetsBeforeExtremeSavings,
  } = useFinance();

  const [filter, setFilter] = useState<'all' | 'essential' | 'non_essential' | 'exceeded' | 'warning' | 'ok'>('all');
  const [isAutoConfigOpen, setIsAutoConfigOpen] = useState<boolean>(false);
  const [actionNotice, setActionNotice] = useState<string>('');

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
    const isAutoRenew = budget ? budget.autoRenew !== false : false;
    const isEssential = isCategoryEssential(cat.id);
    const suggestion = extremeSavingsAnalysis.suggestions.find(s => s.categoryId === cat.id);

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
      isAutoRenew,
      isEssential,
      suggestion,
    };
  });

  // Filtro
  const filteredList = categoryBudgets.filter(item => {
    if (!item.hasBudget && (filter === 'exceeded' || filter === 'warning' || filter === 'ok')) return false;
    if (filter === 'essential') return item.isEssential;
    if (filter === 'non_essential') return !item.isEssential;
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
  const autoRenewCount = categoryBudgets.filter(b => b.hasBudget && b.isAutoRenew).length;
  const nextMonthName = getNextMonthFormatted(selectedPeriod);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Presupuestos Mensuales
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Límites de gasto y control para <span className="text-slate-800 dark:text-slate-200 font-semibold">{formatMonthPeriod(selectedPeriod)}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              const nextState = !extremeSavingsMode;
              setExtremeSavingsMode(nextState);
              setActionNotice(
                nextState 
                  ? '⚡ Modo de Ahorro Extremo activado: Se resaltan gastos esenciales y se muestran sugerencias de recortes.' 
                  : 'Modo de Ahorro Extremo desactivado.'
              );
              setTimeout(() => setActionNotice(''), 4000);
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold border transition-all ${
              extremeSavingsMode 
                ? 'bg-amber-500 text-white border-amber-500 shadow-sm shadow-amber-500/30' 
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-amber-50 dark:hover:bg-amber-950/30'
            }`}
            title="Activar / desactivar Modo de Ahorro Extremo"
          >
            <Zap className={`w-4 h-4 ${extremeSavingsMode ? 'fill-current' : 'text-amber-500'}`} />
            <span>{extremeSavingsMode ? 'Ahorro Extremo ACTIVO' : 'Ahorro Extremo'}</span>
          </button>

          <button
            onClick={() => setIsAutoConfigOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold border border-slate-200 dark:border-slate-700 shadow-sm transition-all"
            title="Configurar reinicio automático mensual"
          >
            <RotateCcw className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Límites Automáticos</span>
          </button>

          <button
            onClick={() => onOpenBudgetModal()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold shadow-md shadow-emerald-600/20 transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>Fijar Presupuesto</span>
          </button>
        </div>
      </div>

      {/* Notificación de acción */}
      {actionNotice && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs sm:text-sm font-bold flex items-center justify-between gap-2 animate-fadeIn">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <span>{actionNotice}</span>
          </div>
          <button
            onClick={() => setActionNotice('')}
            className="text-amber-700 dark:text-amber-400 hover:underline text-xs"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Banner de Modo de Ahorro Extremo y Plan de Recortes */}
      {extremeSavingsMode && (
        <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-950/40 dark:via-slate-900 dark:to-slate-900 border border-amber-300 dark:border-amber-700/80 shadow-md ring-1 ring-amber-400/40 dark:ring-amber-500/30 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/30">
                <Zap className="w-5 h-5 fill-current" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                    Plan de Recortes Activo: Modo de Ahorro Extremo
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white animate-pulse">
                    EN CURSO
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-0.5">
                  Protegiendo gastos esenciales ({formatMoney(extremeSavingsAnalysis.essentialSpent, currency)}) y reduciendo partidas superfluas para generar hasta <strong className="text-amber-600 dark:text-amber-400 font-mono-num">+{formatMoney(extremeSavingsAnalysis.totalPotentialMonthlySavings, currency)}/mes</strong> de ahorro.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
              {extremeSavingsAnalysis.hasBudgetBackup && (
                <button
                  type="button"
                  onClick={() => {
                    restoreBudgetsBeforeExtremeSavings();
                    setActionNotice('Presupuestos previos restaurados correctamente.');
                    setTimeout(() => setActionNotice(''), 4000);
                  }}
                  className="px-3 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restaurar Previos</span>
                </button>
              )}

              {extremeSavingsAnalysis.suggestions.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    applyAllExtremeBudgetSuggestions();
                    setActionNotice('⚡ Todos los límites de ahorro extremo han sido fijados a tus presupuestos.');
                    setTimeout(() => setActionNotice(''), 4000);
                  }}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-white shadow-sm shadow-amber-500/30 transition-all flex items-center gap-1.5 hover:scale-102"
                >
                  <Scissors className="w-3.5 h-3.5" />
                  <span>Aplicar Todos los Recortes ({extremeSavingsAnalysis.suggestions.length})</span>
                </button>
              )}
            </div>
          </div>

          {/* Carrusel / Grid de sugerencias inmediatas */}
          {extremeSavingsAnalysis.suggestions.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2 border-t border-amber-200/50 dark:border-amber-800/50">
              {extremeSavingsAnalysis.suggestions.map((sugg) => {
                const isApplied = sugg.currentLimit > 0 && sugg.currentLimit <= sugg.suggestedLimit;

                return (
                  <div
                    key={sugg.categoryId}
                    className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between gap-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 text-xs"
                          style={{ backgroundColor: sugg.categoryColor }}
                        >
                          <DynamicIcon name={sugg.categoryIcon} size={14} />
                        </div>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                          {sugg.categoryName}
                        </span>
                      </div>

                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 shrink-0">
                        -{sugg.cutPercent}%
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between text-xs font-mono-num">
                      <span className="text-slate-400 text-[11px]">
                        Límite: {sugg.currentLimit > 0 ? formatMoney(sugg.currentLimit, currency) : 'Sin límite'} ➔
                      </span>
                      <span className="font-bold text-amber-600 dark:text-amber-400">
                        {formatMoney(sugg.suggestedLimit, currency)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        applyExtremeBudgetCutForCategory(sugg.categoryId, sugg.suggestedLimit);
                        setActionNotice(`Presupuesto de ${sugg.categoryName} recortado a ${formatMoney(sugg.suggestedLimit, currency)}.`);
                        setTimeout(() => setActionNotice(''), 3500);
                      }}
                      disabled={isApplied}
                      className={`w-full py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        isApplied 
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 cursor-default'
                          : 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs'
                      }`}
                    >
                      {isApplied ? (
                        <>
                          <Check className="w-3 h-3 stroke-[3]" />
                          <span>Límite Aplicado</span>
                        </>
                      ) : (
                        <>
                          <Scissors className="w-3 h-3" />
                          <span>Aplicar recorte (+{formatMoney(sugg.cutAmount, currency)})</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Banner Resumen Global con degradado adaptativo */}
      <div className="bg-gradient-to-br from-white via-slate-50 to-slate-100/80 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 text-slate-900 dark:text-white p-6 sm:p-8 rounded-3xl shadow-md shadow-slate-200/50 dark:shadow-xl dark:shadow-slate-900/20 relative overflow-hidden border border-slate-200/80 dark:border-slate-800 space-y-5 transition-colors">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Total Presupuestado del Mes</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white font-mono-num tracking-tight">
                {formatMoney(totalSpentInBudgetedCats, currency)}
              </span>
              <span className="text-sm sm:text-base font-bold text-slate-500 dark:text-slate-400 font-mono-num">
                / {formatMoney(totalBudgeted, currency)}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              {overallPercent}% del límite global consumido en las categorías con presupuesto
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:gap-4 bg-slate-100/90 dark:bg-white/10 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-white/10">
            <div>
              <span className="text-[10px] sm:text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                Disponible
              </span>
              <span className="text-base sm:text-xl font-bold font-mono-num text-emerald-600 dark:text-emerald-300">
                {formatMoney(totalRemaining, currency)}
              </span>
            </div>
            {exceededCount > 0 && (
              <>
                <div className="w-px h-8 sm:h-10 bg-slate-200 dark:bg-white/20" />
                <div>
                  <span className="text-[10px] sm:text-[11px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider block">
                    Excedidos
                  </span>
                  <span className="text-base sm:text-xl font-bold font-mono-num text-rose-600 dark:text-rose-300">
                    {exceededCount} {exceededCount === 1 ? 'categoría' : 'categorías'}
                  </span>
                </div>
              </>
            )}
            {warningCount > 0 && (
              <>
                <div className="w-px h-8 sm:h-10 bg-slate-200 dark:bg-white/20" />
                <div>
                  <span className="text-[10px] sm:text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">
                    En Alerta
                  </span>
                  <span className="text-base sm:text-xl font-bold font-mono-num text-amber-600 dark:text-amber-300">
                    {warningCount}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Barra de progreso global */}
        <div className="relative z-10 space-y-1.5 pt-1">
          <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
            <span>Progreso del mes ({overallPercent}%)</span>
            <span>{totalBudgeted > 0 ? (100 - overallPercent) : 0}% disponible restante</span>
          </div>
          <div className="w-full bg-slate-200/90 dark:bg-slate-800/90 rounded-full h-3.5 overflow-hidden border border-slate-300/60 dark:border-slate-700/60 p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-500 shadow-sm ${
                overallPercent > 100 ? 'bg-rose-500' : overallPercent >= 85 ? 'bg-amber-500' : 'bg-gradient-to-r from-emerald-500 to-teal-400'
              }`}
              style={{ width: `${Math.min(100, overallPercent)}%` }}
            />
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -top-10 w-48 h-48 bg-teal-500/5 dark:bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Banner de Información de Límites Automáticos Mensuales */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-50/90 via-teal-50/70 to-emerald-50/50 dark:from-emerald-950/40 dark:via-slate-900 dark:to-teal-950/30 border border-emerald-200/80 dark:border-emerald-800/60 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-600/30">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Reinicio Automático Mensual Activo
              </h3>
              <span className="px-2 py-0.5 text-[11px] font-bold bg-emerald-100/80 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 rounded-md border border-emerald-200 dark:border-emerald-700">
                {autoRenewCount} de {expenseCategories.length} categorías
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-2xl">
              Al comenzar cada mes, el contador de gasto vuelve a 0€ y tu disponible vuelve al 100%. Próximo reinicio programado: <span className="font-semibold text-slate-900 dark:text-slate-200">1 de {nextMonthName}</span>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-center">
          <button
            onClick={() => setIsAutoConfigOpen(true)}
            className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-sm shadow-emerald-600/20"
          >
            Configurar Reglas
          </button>
        </div>
      </div>

      {/* Filtros de estado */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        <button
          onClick={() => setFilter('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all whitespace-nowrap shrink-0 ${
            filter === 'all'
              ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-slate-100 shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
          }`}
        >
          Todas ({categoryBudgets.length})
        </button>

        <button
          onClick={() => setFilter('essential')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all whitespace-nowrap shrink-0 flex items-center gap-1 ${
            filter === 'essential'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
              : 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 border-slate-200 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Esenciales ({categoryBudgets.filter(b => b.isEssential).length})</span>
        </button>

        <button
          onClick={() => setFilter('non_essential')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all whitespace-nowrap shrink-0 flex items-center gap-1 ${
            filter === 'non_essential'
              ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
              : 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 border-slate-200 dark:border-slate-700 hover:bg-amber-50 dark:hover:bg-amber-950/30'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Prescindibles ({categoryBudgets.filter(b => !b.isEssential).length})</span>
        </button>

        <button
          onClick={() => setFilter('exceeded')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all whitespace-nowrap shrink-0 ${
            filter === 'exceeded'
              ? 'bg-red-500 text-white border-red-500 shadow-sm'
              : 'bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 border-slate-200 dark:border-slate-700 hover:bg-red-50 dark:hover:bg-red-950/30'
          }`}
        >
          Excedidos ({exceededCount})
        </button>

        <button
          onClick={() => setFilter('warning')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all whitespace-nowrap shrink-0 ${
            filter === 'warning'
              ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
              : 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 border-slate-200 dark:border-slate-700 hover:bg-amber-50 dark:hover:bg-amber-950/30'
          }`}
        >
          En alerta ({warningCount})
        </button>

        <button
          onClick={() => setFilter('ok')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all whitespace-nowrap shrink-0 ${
            filter === 'ok'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
              : 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 border-slate-200 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
          }`}
        >
          Dentro de límite
        </button>
      </div>

      {/* Grid de Presupuestos por Categoría */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredList.map((item) => {
          const { category, hasBudget, limit, spent, percent, remaining, overspent, isExceeded, isWarning, isAutoRenew, isEssential, suggestion } = item;
          const isCutAlreadyApplied = suggestion && limit > 0 && limit <= suggestion.suggestedLimit;

          return (
            <div
              key={category.id}
              className={`p-5 rounded-2xl border transition-all shadow-xs hover:shadow-md bg-gradient-to-br from-white via-slate-50/60 to-slate-100/50 dark:from-slate-900 dark:via-slate-800/80 dark:to-slate-900 ${
                extremeSavingsMode && isEssential
                  ? 'border-emerald-400 dark:border-emerald-600/80 ring-2 ring-emerald-400/30 dark:ring-emerald-500/20'
                  : extremeSavingsMode && !isEssential
                  ? 'border-amber-300/80 dark:border-amber-800/80'
                  : isExceeded 
                  ? 'border-red-300 dark:border-red-800 ring-1 ring-red-300 dark:ring-red-800/80' 
                  : isWarning 
                  ? 'border-amber-300 dark:border-amber-800 ring-1 ring-amber-300 dark:ring-amber-800/80' 
                  : 'border-slate-200/80 dark:border-slate-800'
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
                    <div className="flex flex-wrap items-center gap-1.5">
                      <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white leading-snug">
                        {category.name}
                      </h4>
                      {isEssential ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80">
                          <ShieldCheck className="w-3 h-3" />
                          <span>Esencial</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/80">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Prescindible</span>
                        </span>
                      )}
                    </div>
                    
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                      {hasBudget ? `Límite: ${formatMoney(limit, currency)}/mes` : 'Sin límite fijado'}
                    </p>

                    {/* Indicador de Reinicio Automático */}
                    {hasBudget && (
                      <div className="flex items-center gap-1.5 mt-1">
                        {isAutoRenew ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                            <RotateCcw className="w-2.5 h-2.5" />
                            Reinicio automático (día 1)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                            Límite puntual
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => toggleBudgetAutoRenew(category.id)}
                          title={isAutoRenew ? "Desactivar reinicio automático" : "Activar reinicio automático mensual"}
                          className="text-[10px] text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 underline transition-colors"
                        >
                          {isAutoRenew ? 'Desactivar auto' : 'Hacer recurrente'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => onOpenBudgetModal(category.id)}
                  className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                  title="Ajustar límite"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>

              {/* Callout de Recorte en Modo de Ahorro Extremo para no esenciales */}
              {extremeSavingsMode && !isEssential && suggestion && (
                <div className="mb-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-2 text-xs">
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-200">
                      <Scissors className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>Recorte sugerido: {formatMoney(suggestion.suggestedLimit, currency)} (-{suggestion.cutPercent}%)</span>
                    </div>
                    <p className="text-[11px] text-amber-700 dark:text-amber-400 truncate">
                      {suggestion.reason}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      applyExtremeBudgetCutForCategory(category.id, suggestion.suggestedLimit);
                      setActionNotice(`Presupuesto de ${category.name} ajustado a ${formatMoney(suggestion.suggestedLimit, currency)}.`);
                      setTimeout(() => setActionNotice(''), 3500);
                    }}
                    disabled={isCutAlreadyApplied}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all shrink-0 flex items-center gap-1 ${
                      isCutAlreadyApplied
                        ? 'bg-emerald-600 text-white cursor-default'
                        : 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs'
                    }`}
                  >
                    {isCutAlreadyApplied ? (
                      <>
                        <Check className="w-3 h-3 stroke-[3]" />
                        <span>Fijado</span>
                      </>
                    ) : (
                      <>
                        <Scissors className="w-3 h-3" />
                        <span>Aplicar</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {hasBudget ? (
                <div className="space-y-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      Gastado: <span className="font-mono-num">{formatMoney(spent, currency)}</span>
                    </span>
                    <span className={`font-bold font-mono-num ${
                      isExceeded ? 'text-red-600 dark:text-red-400' : isWarning ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                    }`}>
                      {percent}%
                    </span>
                  </div>

                  {/* Barra de progreso */}
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isExceeded ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, percent)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1">
                    {isExceeded ? (
                      <span className="text-red-600 dark:text-red-400 font-bold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Excedido por {formatMoney(overspent, currency)}
                      </span>
                    ) : isWarning ? (
                      <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Quedan {formatMoney(remaining, currency)} (Cerca del límite)
                      </span>
                    ) : (
                      <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                        Disponible: {formatMoney(remaining, currency)}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Gastado este mes: <strong className="text-slate-700 dark:text-slate-200">{formatMoney(spent, currency)}</strong>
                  </span>
                  <button
                    onClick={() => onOpenBudgetModal(category.id)}
                    className="px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg transition-colors"
                  >
                    + Fijar Límite
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal de Configuración de Límites Automáticos */}
      <AutoBudgetsConfigModal
        isOpen={isAutoConfigOpen}
        onClose={() => setIsAutoConfigOpen(false)}
      />

    </div>
  );
};

