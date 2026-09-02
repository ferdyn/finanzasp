import React, { useMemo, useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatMoney, formatMonthPeriod } from '../utils/format';
import { DynamicIcon } from '../components/DynamicIcon';
import { BarChart3, TrendingUp, TrendingDown, PieChart as PieIcon, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, 
  CartesianGrid, Legend, PieChart, Pie, Cell 
} from 'recharts';

export const AnalyticsView: React.FC = () => {
  const { transactions, categories, currency, selectedPeriod, metrics, getCategorySpendForPeriod } = useFinance();

  const [monthsRange, setMonthsRange] = useState<number>(6);

  // Generar datos históricos para los últimos N meses
  const historyData = useMemo(() => {
    const data = [];
    const [currentYear, currentMonth] = selectedPeriod.split('-').map(Number);

    for (let i = monthsRange - 1; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - 1 - i, 1);
      const periodStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = d.toLocaleDateString('es-ES', { month: 'short' });

      const monthTxs = transactions.filter(t => t.date.startsWith(periodStr));
      const income = monthTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const expense = monthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      const savings = Math.max(0, income - expense);

      data.push({
        period: periodStr,
        name: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
        Ingresos: Math.round(income),
        Gastos: Math.round(expense),
        Ahorro: Math.round(savings),
      });
    }

    return data;
  }, [transactions, selectedPeriod, monthsRange]);

  // Desglose de gastos del mes actual por categoría
  const categoryExpenses = useMemo(() => {
    return categories
      .filter(c => c.type === 'expense')
      .map(c => ({
        name: c.name,
        value: getCategorySpendForPeriod(c.id, selectedPeriod),
        color: c.color,
        icon: c.icon,
      }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [categories, selectedPeriod, getCategorySpendForPeriod]);

  // Desglose de ingresos del mes actual
  const categoryIncomes = useMemo(() => {
    const currentTxs = transactions.filter(t => t.date.startsWith(selectedPeriod) && t.type === 'income');
    return categories
      .filter(c => c.type === 'income')
      .map(c => {
        const value = currentTxs.filter(t => t.categoryId === c.id).reduce((s, t) => s + t.amount, 0);
        return {
          name: c.name,
          value,
          color: c.color,
          icon: c.icon,
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
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Análisis y Estadísticas
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Métricas de ahorro, evolución temporal y distribución de capital
          </p>
        </div>

        {/* Selector de rango de meses */}
        <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200 rounded-xl shadow-sm text-xs font-bold">
          <button
            onClick={() => setMonthsRange(3)}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              monthsRange === 3 ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            3 Meses
          </button>
          <button
            onClick={() => setMonthsRange(6)}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              monthsRange === 6 ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            6 Meses
          </button>
          <button
            onClick={() => setMonthsRange(12)}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              monthsRange === 12 ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            12 Meses
          </button>
        </div>
      </div>

      {/* Gráfico de Barras: Evolución Temporal */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-900">Evolución Ingresos vs Gastos vs Ahorro</h3>
            <p className="text-xs text-slate-400 font-medium">Comparativa mensual en los últimos {monthsRange} meses</p>
          </div>
        </div>

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={historyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
              <Tooltip 
                formatter={(val: number) => formatMoney(val, currency)}
                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
              />
              <Legend />
              <Bar dataKey="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Gastos" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Ahorro" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Distribución de Gastos e Ingresos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Gastos por Categoría */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-900 mb-1">
              Desglose de Gastos ({formatMonthPeriod(selectedPeriod)})
            </h3>
            <p className="text-xs text-slate-400 mb-4 font-medium">
              Distribución porcentual de los {formatMoney(metrics.currentMonthExpense, currency)} gastados
            </p>

            {categoryExpenses.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">Sin gastos este mes</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryExpenses}
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {categoryExpenses.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val: number) => formatMoney(val, currency)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {categoryExpenses.map((cat) => {
                    const pct = metrics.currentMonthExpense > 0 
                      ? Math.round((cat.value / metrics.currentMonthExpense) * 100) 
                      : 0;
                    return (
                      <div key={cat.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 truncate max-w-[140px]">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                          <span className="font-semibold text-slate-700 truncate">{cat.name}</span>
                        </div>
                        <span className="font-bold text-slate-900 font-mono-num shrink-0">
                          {formatMoney(cat.value, currency)} ({pct}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="pt-3 mt-4 border-t border-slate-100 text-xs font-semibold text-slate-500 flex justify-between">
            <span>Total Gastos</span>
            <span className="font-bold text-slate-900 font-mono-num">{formatMoney(metrics.currentMonthExpense, currency)}</span>
          </div>
        </div>

        {/* Fuentes de Ingresos */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-900 mb-1">
              Fuentes de Ingresos ({formatMonthPeriod(selectedPeriod)})
            </h3>
            <p className="text-xs text-slate-400 mb-4 font-medium">
              Total percibido: {formatMoney(metrics.currentMonthIncome, currency)}
            </p>

            {categoryIncomes.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">Sin ingresos registrados este mes</div>
            ) : (
              <div className="space-y-3 pt-2">
                {categoryIncomes.map((cat) => {
                  const pct = metrics.currentMonthIncome > 0
                    ? Math.round((cat.value / metrics.currentMonthIncome) * 100)
                    : 0;

                  return (
                    <div key={cat.name} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                          <span className="font-semibold text-slate-800">{cat.name}</span>
                        </div>
                        <span className="font-bold text-emerald-600 font-mono-num">
                          {formatMoney(cat.value, currency)} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-3 mt-4 border-t border-slate-100 text-xs font-semibold text-slate-500 flex justify-between">
            <span>Total Ingresos</span>
            <span className="font-bold text-emerald-600 font-mono-num">{formatMoney(metrics.currentMonthIncome, currency)}</span>
          </div>
        </div>

      </div>

    </div>
  );
};
