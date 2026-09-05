import React from 'react';
import { MonthTrendData } from '../../utils/dashboardHelpers';
import { CurrencyCode } from '../../types/finance';
import { formatMoney } from '../../utils/format';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, BarChart3 } from 'lucide-react';

interface FinancialEvolutionChartProps {
  trendData: MonthTrendData[];
  currency: CurrencyCode;
  onNavigateToAnalytics: () => void;
}

export const FinancialEvolutionChart: React.FC<FinancialEvolutionChartProps> = ({
  trendData,
  currency,
  onNavigateToAnalytics,
}) => {
  const hasData = trendData.some((d) => d.income > 0 || d.expense > 0);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const incomeVal = payload.find((p: any) => p.dataKey === 'income')?.value || 0;
      const expenseVal = payload.find((p: any) => p.dataKey === 'expense')?.value || 0;
      const netVal = incomeVal - expenseVal;

      return (
        <div className="bg-white dark:bg-slate-850 p-3 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 text-xs space-y-1.5 z-50">
          <p className="font-bold text-slate-800 dark:text-slate-100">{label}</p>
          <div className="flex items-center justify-between gap-4 text-emerald-600 dark:text-emerald-400 font-mono-num">
            <span>Ingresos:</span>
            <span className="font-bold">+{formatMoney(incomeVal, currency)}</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-rose-600 dark:text-rose-400 font-mono-num">
            <span>Gastos:</span>
            <span className="font-bold">-{formatMoney(expenseVal, currency)}</span>
          </div>
          <div className="pt-1 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between gap-4 font-mono-num font-bold">
            <span className="text-slate-600 dark:text-slate-300">Balance:</span>
            <span className={netVal >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
              {netVal >= 0 ? '+' : ''}{formatMoney(netVal, currency)}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      id="dashboard-evolution-chart"
      className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Evolución Ingresos vs Gastos
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Tendencia de los últimos 6 meses
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onNavigateToAnalytics}
          className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
        >
          Ver análisis completo
        </button>
      </div>

      {!hasData ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-xs font-medium text-slate-400">
            No hay datos suficientes para mostrar la evolución temporal
          </p>
        </div>
      ) : (
        <div>
          {/* Gráfico Recharts con altura adaptativa */}
          <div className="h-56 sm:h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.6} />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickFormatter={(val) => (val >= 1000 ? `${Math.round(val / 1000)}k` : val)}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="income"
                  name="Ingresos"
                  fill="#10b981"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={28}
                />
                <Bar
                  dataKey="expense"
                  name="Gastos"
                  fill="#f43f5e"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={28}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Resumen textual accesible para lectores de pantalla */}
          <div className="sr-only">
            <h4>Resumen de evolución en 6 meses:</h4>
            <ul>
              {trendData.map((d) => (
                <li key={d.period}>
                  {d.label}: Ingresos {formatMoney(d.income, currency)}, Gastos {formatMoney(d.expense, currency)}, Balance neto {formatMoney(d.net, currency)}.
                </li>
              ))}
            </ul>
          </div>

          {/* Leyenda compacta */}
          <div className="flex items-center justify-center gap-6 mt-3 text-xs font-bold">
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Ingresos</span>
            </div>
            <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>Gastos</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
