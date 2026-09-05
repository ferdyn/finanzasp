import React from 'react';
import { TrendingUp, TrendingDown, PiggyBank, Sparkles, ArrowUpRight, ArrowDownRight, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { CurrencyCode } from '../../types/finance';
import { formatMoney, formatMonthPeriod, formatMonthPeriodShort, getCurrentMonthPeriod } from '../../utils/format';

interface PeriodSummarySectionProps {
  selectedPeriod: string;
  onSelectPeriod: (period: string) => void;
  availablePeriods: string[];
  income: number;
  expense: number;
  net: number;
  savingsRate: number;
  previousMonthExpense: number;
  previousMonthIncome: number;
  currency: CurrencyCode;
}

export const PeriodSummarySection: React.FC<PeriodSummarySectionProps> = ({
  selectedPeriod,
  onSelectPeriod,
  availablePeriods,
  income,
  expense,
  net,
  savingsRate,
  previousMonthExpense,
  previousMonthIncome,
  currency,
}) => {
  const currentMonthPeriod = getCurrentMonthPeriod();

  // Calcular el periodo del mes anterior
  const [yearStr, monthStr] = selectedPeriod.split('-');
  const currentYear = parseInt(yearStr, 10);
  const currentMonth = parseInt(monthStr, 10);
  const prevDate = new Date(currentYear, currentMonth - 2, 1);
  const prevPeriod = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

  const nextDate = new Date(currentYear, currentMonth, 1);
  const nextPeriod = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;

  // Variación de gasto vs mes anterior
  let expenseDiffPercent: number | null = null;
  if (previousMonthExpense > 0 && expense > 0) {
    const diff = ((expense - previousMonthExpense) / previousMonthExpense) * 100;
    expenseDiffPercent = Math.round(diff);
  }

  // Variación de ingresos vs mes anterior
  let incomeDiffPercent: number | null = null;
  if (previousMonthIncome > 0 && income > 0) {
    const diff = ((income - previousMonthIncome) / previousMonthIncome) * 100;
    incomeDiffPercent = Math.round(diff);
  }

  return (
    <div className="space-y-4" id="dashboard-period-summary">
      
      {/* Nivel 3: Selector de Período Limpio y Accesible */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/60 dark:bg-slate-900/60 p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
        
        {/* Título de sección y mes actual */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">
              Período de Análisis
            </span>
            <span className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
              {formatMonthPeriod(selectedPeriod)}
            </span>
          </div>
        </div>

        {/* Botones de navegación y presets de períodos */}
        <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
          
          {/* Navegación mes anterior / siguiente */}
          <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-200/60 dark:border-slate-700/60">
            <button
              type="button"
              onClick={() => onSelectPeriod(prevPeriod)}
              className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-white dark:hover:bg-slate-700 transition-colors"
              title="Mes anterior"
              aria-label="Ir al mes anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onSelectPeriod(nextPeriod)}
              className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-white dark:hover:bg-slate-700 transition-colors"
              title="Mes siguiente"
              aria-label="Ir al mes siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Preset "Este mes" */}
          <button
            type="button"
            onClick={() => onSelectPeriod(currentMonthPeriod)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all min-h-[38px] ${
              selectedPeriod === currentMonthPeriod
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Este mes
          </button>

          {/* Selector desplegable de meses si hay historial disponible */}
          {availablePeriods.length > 0 && (
            <select
              value={selectedPeriod}
              onChange={(e) => onSelectPeriod(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl border-none focus:ring-2 focus:ring-emerald-500 cursor-pointer min-h-[38px]"
              aria-label="Seleccionar mes específico"
            >
              {availablePeriods.map((p) => (
                <option key={p} value={p} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                  {formatMonthPeriodShort(p)}
                </option>
              ))}
            </select>
          )}

        </div>

      </div>

      {/* Nivel 2: 4 Tarjetas de Resumen del Período */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* 1. Ingresos */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Ingresos
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div data-amount={income} className="text-lg sm:text-2xl font-black font-mono-num text-slate-900 dark:text-white tracking-tight">
            +{formatMoney(income, currency)}
          </div>
          <div className="mt-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            {incomeDiffPercent !== null ? (
              <span className={`inline-flex items-center gap-0.5 ${
                incomeDiffPercent >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'
              }`}>
                {incomeDiffPercent >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {incomeDiffPercent >= 0 ? `+${incomeDiffPercent}%` : `${incomeDiffPercent}%`} vs mes anterior
              </span>
            ) : (
              <span>Mes anterior: {formatMoney(previousMonthIncome, currency)}</span>
            )}
          </div>
        </div>

        {/* 2. Gastos */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Gastos
            </span>
            <div className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div data-amount={expense} className="text-lg sm:text-2xl font-black font-mono-num text-slate-900 dark:text-white tracking-tight">
            -{formatMoney(expense, currency)}
          </div>
          <div className="mt-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            {expenseDiffPercent !== null ? (
              <span className={`inline-flex items-center gap-0.5 ${
                expenseDiffPercent <= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {expenseDiffPercent > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {expenseDiffPercent > 0 ? `+${expenseDiffPercent}%` : `${expenseDiffPercent}%`} vs mes anterior
              </span>
            ) : (
              <span>Mes anterior: {formatMoney(previousMonthExpense, currency)}</span>
            )}
          </div>
        </div>

        {/* 3. Ahorro Neto */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Ahorro Neto
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <div
            data-amount={net}
            className={`text-lg sm:text-2xl font-black font-mono-num tracking-tight ${
              net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
            }`}
          >
            {net >= 0 ? '+' : ''}{formatMoney(net, currency)}
          </div>
          <div className="mt-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            {net >= 0 ? 'Superávit del período' : 'Déficit del período'}
          </div>
        </div>

        {/* 4. Tasa de Ahorro */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Tasa de Ahorro
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div data-amount={savingsRate} className="text-lg sm:text-2xl font-black font-mono-num text-slate-900 dark:text-white tracking-tight">
            {savingsRate}%
          </div>
          <div className="mt-1.5 flex items-center gap-1.5">
            <div className="flex-1 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  savingsRate >= 20 ? 'bg-emerald-500' : savingsRate >= 10 ? 'bg-amber-500' : 'bg-red-400'
                }`}
                style={{ width: `${Math.min(100, (savingsRate / 20) * 100)}%` }}
              />
            </div>
            <span className="text-[10px] font-bold text-slate-400">Meta: 20%</span>
          </div>
        </div>

      </div>

    </div>
  );
};
