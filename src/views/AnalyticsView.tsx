import React, { useMemo, useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatMoney, formatMonthPeriod } from '../utils/format';
import { DynamicIcon } from '../components/DynamicIcon';
import { 
  BarChart3, TrendingUp, TrendingDown, PieChart as PieIcon, 
  Calendar, ArrowUpRight, ArrowDownRight, Layers, HelpCircle
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, 
  CartesianGrid, Legend, PieChart, Pie, Cell 
} from 'recharts';
import { 
  CustomMonthlyTooltip, 
  CustomDailyTooltip, 
  CustomCategoryPieTooltip 
} from '../components/AnalyticsTooltips';

export const AnalyticsView: React.FC = () => {
  const { 
    transactions, 
    categories, 
    accounts, 
    currency, 
    selectedPeriod, 
    metrics 
  } = useFinance();

  const [monthsRange, setMonthsRange] = useState<number>(6);
  const [chartMode, setChartMode] = useState<'monthly' | 'daily'>('monthly');

  // Generar datos históricos para los últimos N meses con transacciones exactas
  const historyData = useMemo(() => {
    const data = [];
    const [currentYear, currentMonth] = selectedPeriod.split('-').map(Number);

    for (let i = monthsRange - 1; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - 1 - i, 1);
      const periodStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = d.toLocaleDateString('es-ES', { month: 'short' });
      const fullMonthName = d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

      const monthTxs = transactions.filter(t => t.date.startsWith(periodStr));
      const incomeTxs = monthTxs.filter(t => t.type === 'income');
      const expenseTxs = monthTxs.filter(t => t.type === 'expense');

      const income = incomeTxs.reduce((s, t) => s + t.amount, 0);
      const expense = expenseTxs.reduce((s, t) => s + t.amount, 0);
      const savings = Math.max(0, income - expense);
      const netSavings = income - expense;
      const savingsRate = income > 0 ? Math.round(((income - expense) / income) * 100) : 0;

      // Mayores gastos e ingresos para mostrar en el tooltip interactivo
      const topExpenseTxs = [...expenseTxs].sort((a, b) => b.amount - a.amount).slice(0, 4);
      const topIncomeTxs = [...incomeTxs].sort((a, b) => b.amount - a.amount).slice(0, 3);

      data.push({
        period: periodStr,
        name: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
        fullPeriodName: fullMonthName.charAt(0).toUpperCase() + fullMonthName.slice(1),
        // Valores numéricos para las barras
        Ingresos: Number(income.toFixed(2)),
        Gastos: Number(expense.toFixed(2)),
        Ahorro: Number(savings.toFixed(2)),
        // Valores exactos con precisión completa para los tooltips
        exactIncome: income,
        exactExpense: expense,
        exactSavings: savings,
        netSavings,
        savingsRate,
        txCount: monthTxs.length,
        incomeCount: incomeTxs.length,
        expenseCount: expenseTxs.length,
        topExpenseTxs,
        topIncomeTxs,
        allTxs: monthTxs,
      });
    }

    return data;
  }, [transactions, selectedPeriod, monthsRange]);

  // Generar datos diarios para el mes seleccionado con todas las transacciones exactas
  const dailyData = useMemo(() => {
    const [year, month] = selectedPeriod.split('-').map(Number);
    if (!year || !month) return [];
    const daysInMonth = new Date(year, month, 0).getDate();
    const days = [];

    for (let d = 1; d <= daysInMonth; d++) {
      const dayStr = `${selectedPeriod}-${String(d).padStart(2, '0')}`;
      const dayTxs = transactions.filter(t => t.date === dayStr);
      const dayIncomeTxs = dayTxs.filter(t => t.type === 'income');
      const dayExpenseTxs = dayTxs.filter(t => t.type === 'expense');

      const dayIncome = dayIncomeTxs.reduce((s, t) => s + t.amount, 0);
      const dayExpense = dayExpenseTxs.reduce((s, t) => s + t.amount, 0);

      const dateObj = new Date(year, month - 1, d);
      const dayOfWeekShort = dateObj.toLocaleDateString('es-ES', { weekday: 'narrow' });
      const fullDateLabel = dateObj.toLocaleDateString('es-ES', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long' 
      });

      days.push({
        day: d,
        date: dayStr,
        label: `${d}`,
        dayOfWeek: dayOfWeekShort,
        fullDateLabel,
        Ingresos: Number(dayIncome.toFixed(2)),
        Gastos: Number(dayExpense.toFixed(2)),
        exactIncome: dayIncome,
        exactExpense: dayExpense,
        txs: dayTxs,
        hasTransactions: dayTxs.length > 0,
      });
    }

    return days;
  }, [transactions, selectedPeriod]);

  // Desglose de gastos del mes actual por categoría con transacciones exactas
  const categoryExpenses = useMemo(() => {
    const currentMonthTxs = transactions.filter(
      t => t.date.startsWith(selectedPeriod) && t.type === 'expense'
    );
    const totalSpent = currentMonthTxs.reduce((s, t) => s + t.amount, 0);

    return categories
      .filter(c => c.type === 'expense')
      .map(c => {
        const catTxs = currentMonthTxs
          .filter(t => t.categoryId === c.id)
          .sort((a, b) => b.amount - a.amount);
        const value = catTxs.reduce((s, t) => s + t.amount, 0);
        const percentage = totalSpent > 0 ? (value / totalSpent) * 100 : 0;

        return {
          id: c.id,
          name: c.name,
          value: Number(value.toFixed(2)),
          exactAmount: value,
          percentage: Number(percentage.toFixed(1)),
          color: c.color,
          icon: c.icon,
          txCount: catTxs.length,
          transactions: catTxs,
          averageTx: catTxs.length > 0 ? value / catTxs.length : 0,
        };
      })
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [categories, selectedPeriod, transactions]);

  // Desglose de ingresos del mes actual con transacciones exactas
  const categoryIncomes = useMemo(() => {
    const currentMonthTxs = transactions.filter(
      t => t.date.startsWith(selectedPeriod) && t.type === 'income'
    );
    const totalIncome = currentMonthTxs.reduce((s, t) => s + t.amount, 0);

    return categories
      .filter(c => c.type === 'income')
      .map(c => {
        const catTxs = currentMonthTxs
          .filter(t => t.categoryId === c.id)
          .sort((a, b) => b.amount - a.amount);
        const value = catTxs.reduce((s, t) => s + t.amount, 0);
        const percentage = totalIncome > 0 ? (value / totalIncome) * 100 : 0;

        return {
          id: c.id,
          name: c.name,
          value: Number(value.toFixed(2)),
          exactAmount: value,
          percentage: Number(percentage.toFixed(1)),
          color: c.color,
          icon: c.icon,
          txCount: catTxs.length,
          transactions: catTxs,
          averageTx: catTxs.length > 0 ? value / catTxs.length : 0,
        };
      })
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [categories, transactions, selectedPeriod]);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
            Análisis y Estadísticas
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Métricas interactivas de ahorro, evolución temporal y montos exactos de transacciones
          </p>
        </div>

        {/* Conmutador de modo de gráfico */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs text-xs font-bold">
            <button
              onClick={() => setChartMode('monthly')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                chartMode === 'monthly'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Mensual</span>
            </button>
            <button
              onClick={() => setChartMode('daily')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                chartMode === 'daily'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Flujo Diario</span>
            </button>
          </div>

          {/* Selector de rango de meses (visible solo en modo mensual) */}
          {chartMode === 'monthly' && (
            <div className="flex items-center gap-1 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs text-xs font-bold">
              <button
                onClick={() => setMonthsRange(3)}
                className={`px-2.5 py-1.5 rounded-lg transition-colors ${
                  monthsRange === 3 
                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900' 
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                3M
              </button>
              <button
                onClick={() => setMonthsRange(6)}
                className={`px-2.5 py-1.5 rounded-lg transition-colors ${
                  monthsRange === 6 
                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900' 
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                6M
              </button>
              <button
                onClick={() => setMonthsRange(12)}
                className={`px-2.5 py-1.5 rounded-lg transition-colors ${
                  monthsRange === 12 
                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900' 
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                12M
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Banner Resumen Analítico con degradado insignia de patrimonio */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl shadow-slate-900/10 relative overflow-hidden border border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Rendimiento Financiero ({formatMonthPeriod(selectedPeriod)})
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                metrics.currentMonthNet >= 0 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}>
                {metrics.currentMonthNet >= 0 ? 'Superávit' : 'Déficit'}
              </span>
            </div>
            <div className="text-3xl sm:text-4xl font-black font-mono-num tracking-tight mt-1 text-white">
              {metrics.currentMonthNet >= 0 ? '+' : ''}{formatMoney(metrics.currentMonthNet, currency)}
            </div>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              Tasa de ahorro del <strong className="text-emerald-300 font-semibold">{metrics.savingsRate}%</strong> • <strong className="text-white font-semibold">{categoryExpenses.length}</strong> categorías de gasto con movimientos
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:gap-5 bg-white/10 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border border-white/10">
            <div>
              <span className="text-[10px] sm:text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
                Total Ingresos
              </span>
              <span className="text-base sm:text-xl font-bold font-mono-num text-emerald-300">
                +{formatMoney(metrics.currentMonthIncome, currency)}
              </span>
            </div>
            <div className="w-px h-8 sm:h-10 bg-white/20" />
            <div>
              <span className="text-[10px] sm:text-[11px] font-bold text-rose-400 uppercase tracking-wider block">
                Total Gastos
              </span>
              <span className="text-base sm:text-xl font-bold font-mono-num text-rose-300">
                -{formatMoney(metrics.currentMonthExpense, currency)}
              </span>
            </div>
            <div className="w-px h-8 sm:h-10 bg-white/20" />
            <div>
              <span className="text-[10px] sm:text-[11px] font-bold text-indigo-300 uppercase tracking-wider block">
                Patrimonio
              </span>
              <span className="text-base sm:text-xl font-bold font-mono-num text-white">
                {formatMoney(metrics.totalNetWorth, currency)}
              </span>
            </div>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -top-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Gráfico Principal: Evolución Temporal o Flujo Diario */}
      <div className="bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-800/80 dark:to-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {chartMode === 'monthly' 
                  ? 'Evolución Ingresos vs Gastos vs Ahorro' 
                  : `Flujo Diario de Movimientos (${formatMonthPeriod(selectedPeriod)})`}
              </h3>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                Pasa el cursor para ver montos exactos
              </span>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
              {chartMode === 'monthly'
                ? `Comparativa mensual en los últimos ${monthsRange} meses con detalle de transacciones al pasar el cursor`
                : 'Desglose día a día de gastos e ingresos con cada transacción individual del día'}
            </p>
          </div>
        </div>

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            {chartMode === 'monthly' ? (
              <BarChart data={historyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" strokeOpacity={0.2} vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <Tooltip 
                  content={
                    <CustomMonthlyTooltip 
                      currency={currency} 
                      categories={categories} 
                      accounts={accounts} 
                    />
                  }
                  wrapperStyle={{ zIndex: 1000, pointerEvents: 'none' }}
                />
                <Legend />
                <Bar dataKey="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Gastos" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Ahorro" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : (
              <BarChart data={dailyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" strokeOpacity={0.2} vertical={false} />
                <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                <Tooltip 
                  content={
                    <CustomDailyTooltip 
                      currency={currency} 
                      categories={categories} 
                      accounts={accounts} 
                    />
                  }
                  wrapperStyle={{ zIndex: 1000, pointerEvents: 'none' }}
                />
                <Legend />
                <Bar dataKey="Ingresos" fill="#10b981" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Gastos" fill="#ef4444" radius={[3, 3, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Distribución de Gastos e Ingresos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Gastos por Categoría */}
        <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Desglose de Gastos ({formatMonthPeriod(selectedPeriod)})
              </h3>
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200/60 dark:border-emerald-800/60">
                Interactivo
              </span>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-4 font-medium">
              Pasa el cursor sobre los segmentos para ver las transacciones exactas de cada categoría
            </p>

            {categoryExpenses.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-500">
                Sin gastos registrados en este mes
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryExpenses}
                        innerRadius={52}
                        outerRadius={78}
                        paddingAngle={3}
                        dataKey="value"
                        className="cursor-pointer outline-none"
                      >
                        {categoryExpenses.map((entry) => (
                          <Cell 
                            key={entry.name} 
                            fill={entry.color} 
                            className="transition-all hover:opacity-80 focus:outline-none"
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        content={
                          <CustomCategoryPieTooltip 
                            currency={currency} 
                            type="expense" 
                            accounts={accounts} 
                          />
                        }
                        wrapperStyle={{ zIndex: 1000, pointerEvents: 'none' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {categoryExpenses.map((cat) => {
                    return (
                      <div 
                        key={cat.name} 
                        className="flex items-center justify-between text-xs p-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                        title={`${cat.txCount} transacciones. Haz hover en el gráfico para ver detalles.`}
                      >
                        <div className="flex items-center gap-2 truncate max-w-[140px]">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                          <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">{cat.name}</span>
                        </div>
                        <span className="font-bold text-slate-900 dark:text-white font-mono-num shrink-0">
                          {formatMoney(cat.exactAmount, currency)} ({cat.percentage}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="pt-3 mt-4 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 flex justify-between items-center">
            <span>Total Gastos del Periodo</span>
            <span className="font-bold text-rose-600 dark:text-rose-400 font-mono-num text-sm">
              -{formatMoney(metrics.currentMonthExpense, currency)}
            </span>
          </div>
        </div>

        {/* Fuentes de Ingresos */}
        <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Fuentes de Ingresos ({formatMonthPeriod(selectedPeriod)})
              </h3>
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200/60 dark:border-emerald-800/60">
                Interactivo
              </span>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-4 font-medium">
              Pasa el cursor sobre los ingresos para ver el desglose de nóminas, rentas y cobros exactos
            </p>

            {categoryIncomes.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-500">
                Sin ingresos registrados este mes
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryIncomes}
                        innerRadius={52}
                        outerRadius={78}
                        paddingAngle={3}
                        dataKey="value"
                        className="cursor-pointer outline-none"
                      >
                        {categoryIncomes.map((entry) => (
                          <Cell 
                            key={entry.name} 
                            fill={entry.color} 
                            className="transition-all hover:opacity-80 focus:outline-none"
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        content={
                          <CustomCategoryPieTooltip 
                            currency={currency} 
                            type="income" 
                            accounts={accounts} 
                          />
                        }
                        wrapperStyle={{ zIndex: 1000, pointerEvents: 'none' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {categoryIncomes.map((cat) => {
                    return (
                      <div 
                        key={cat.name} 
                        className="flex items-center justify-between text-xs p-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                        title={`${cat.txCount} transacciones. Haz hover en el gráfico para ver detalles.`}
                      >
                        <div className="flex items-center gap-2 truncate max-w-[140px]">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                          <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">{cat.name}</span>
                        </div>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono-num shrink-0">
                          +{formatMoney(cat.exactAmount, currency)} ({cat.percentage}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="pt-3 mt-4 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 flex justify-between items-center">
            <span>Total Ingresos del Periodo</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono-num text-sm">
              +{formatMoney(metrics.currentMonthIncome, currency)}
            </span>
          </div>
        </div>

      </div>

    </div>
  );
};
