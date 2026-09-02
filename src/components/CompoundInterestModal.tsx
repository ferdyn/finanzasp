import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatMoney } from '../utils/format';
import { X, TrendingUp, DollarSign, Calculator, Sparkles } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface CompoundInterestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CompoundInterestModal: React.FC<CompoundInterestModalProps> = ({ isOpen, onClose }) => {
  const { currency } = useFinance();

  const [initialDeposit, setInitialDeposit] = useState<number>(5000);
  const [monthlyContribution, setMonthlyContribution] = useState<number>(300);
  const [annualRate, setAnnualRate] = useState<number>(8);
  const [years, setYears] = useState<number>(15);

  const simulationData = useMemo(() => {
    const data = [];
    let totalInvested = initialDeposit;
    let balance = initialDeposit;
    const monthlyRate = annualRate / 100 / 12;

    for (let y = 0; y <= years; y++) {
      if (y === 0) {
        data.push({
          year: `Año 0`,
          invested: Math.round(totalInvested),
          interest: 0,
          total: Math.round(balance),
        });
        continue;
      }

      for (let m = 0; m < 12; m++) {
        balance = balance * (1 + monthlyRate) + monthlyContribution;
        totalInvested += monthlyContribution;
      }

      data.push({
        year: `Año ${y}`,
        invested: Math.round(totalInvested),
        interest: Math.round(Math.max(0, balance - totalInvested)),
        total: Math.round(balance),
      });
    }

    return data;
  }, [initialDeposit, monthlyContribution, annualRate, years]);

  if (!isOpen) return null;

  const finalState = simulationData[simulationData.length - 1];

  return (
    <div 
      role="dialog"
      aria-modal="true"
      aria-labelledby="compound-modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div 
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl shadow-2xl border-t sm:border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[90vh] pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Barra táctil de arrastre móvil */}
        <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto my-2.5 sm:hidden shrink-0" aria-hidden="true" />

        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-sm">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h3 id="compound-modal-title" className="font-bold text-base text-slate-800 dark:text-white">Simulador de Interés Compuesto</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Proyecta el crecimiento de tu capital en el tiempo</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar simulador"
            className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scroll-touch">
          {/* Sliders / Inputs de control */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50/80 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700">
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                <span>Capital Inicial</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-mono-num">{formatMoney(initialDeposit, currency)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="50000"
                step="500"
                value={initialDeposit}
                onChange={(e) => setInitialDeposit(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                <span>Aportación Mensual</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-mono-num">{formatMoney(monthlyContribution, currency)}/mes</span>
              </div>
              <input
                type="range"
                min="0"
                max="2000"
                step="50"
                value={monthlyContribution}
                onChange={(e) => setMonthlyContribution(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                <span>Rentabilidad Anual Estimada</span>
                <span className="text-amber-600 dark:text-amber-400 font-mono-num">{annualRate}%</span>
              </div>
              <input
                type="range"
                min="1"
                max="20"
                step="0.5"
                value={annualRate}
                onChange={(e) => setAnnualRate(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                <span>Horizonte Temporal</span>
                <span className="text-purple-600 dark:text-purple-400 font-mono-num">{years} años</span>
              </div>
              <input
                type="range"
                min="1"
                max="40"
                step="1"
                value={years}
                onChange={(e) => setYears(Number(e.target.value))}
                className="w-full accent-purple-600 cursor-pointer"
              />
            </div>
          </div>

          {/* Tarjetas de Resultado Resumen */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
              <p className="text-[11px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Aportado</p>
              <p className="text-base sm:text-lg font-bold text-slate-700 dark:text-slate-200 font-mono-num mt-0.5">
                {formatMoney(finalState?.invested || 0, currency)}
              </p>
            </div>

            <div className="p-3 bg-emerald-50/80 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800">
              <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Intereses Ganados</p>
              <p className="text-base sm:text-lg font-bold text-emerald-700 dark:text-emerald-300 font-mono-num mt-0.5">
                {formatMoney(finalState?.interest || 0, currency)}
              </p>
            </div>

            <div className="p-3 bg-indigo-50/90 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-800">
              <p className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Capital Final</p>
              <p className="text-base sm:text-lg font-bold text-indigo-800 dark:text-indigo-200 font-mono-num mt-0.5">
                {formatMoney(finalState?.total || 0, currency)}
              </p>
            </div>
          </div>

          {/* Gráfico de Crecimiento */}
          <div>
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Proyección de Crecimiento ({years} Años)
            </h4>
            <div className="h-64 w-full bg-slate-50 dark:bg-slate-800/50 rounded-xl p-2 border border-slate-200 dark:border-slate-700">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={simulationData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} />
                  <XAxis dataKey="year" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip 
                    formatter={(val: number) => formatMoney(val, currency)}
                    labelStyle={{ fontWeight: 'bold' }}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #64748b', backgroundColor: 'rgba(15, 23, 42, 0.9)', color: '#f8fafc', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}
                  />
                  <Area type="monotone" dataKey="total" name="Total Acumulado" stroke="#4f46e5" fill="#6366f1" fillOpacity={0.4} />
                  <Area type="monotone" dataKey="invested" name="Dinero Aportado" stroke="#10b981" fill="#10b981" fillOpacity={0.4} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 flex justify-end pb-1">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto min-h-[48px] py-3 px-6 rounded-xl bg-slate-900 dark:bg-emerald-600 text-white text-sm font-semibold hover:bg-slate-800 dark:hover:bg-emerald-700 active:scale-[0.98] transition-all"
          >
            Cerrar Simulador
          </button>
        </div>
      </div>
    </div>
  );
};
