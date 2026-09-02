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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-800">Simulador de Interés Compuesto</h3>
              <p className="text-xs text-slate-500 font-medium">Proyecta el crecimiento de tu capital en el tiempo</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Sliders / Inputs de control */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50/80 rounded-xl border border-slate-200/80">
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                <span>Capital Inicial</span>
                <span className="text-indigo-600 font-mono-num">{formatMoney(initialDeposit, currency)}</span>
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
              <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                <span>Aportación Mensual</span>
                <span className="text-emerald-600 font-mono-num">{formatMoney(monthlyContribution, currency)}/mes</span>
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
              <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                <span>Rentabilidad Anual Estimada</span>
                <span className="text-amber-600 font-mono-num">{annualRate}%</span>
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
              <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                <span>Horizonte Temporal</span>
                <span className="text-purple-600 font-mono-num">{years} años</span>
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
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Aportado</p>
              <p className="text-base sm:text-lg font-bold text-slate-700 font-mono-num mt-0.5">
                {formatMoney(finalState?.invested || 0, currency)}
              </p>
            </div>

            <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-200">
              <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Intereses Ganados</p>
              <p className="text-base sm:text-lg font-bold text-emerald-700 font-mono-num mt-0.5">
                {formatMoney(finalState?.interest || 0, currency)}
              </p>
            </div>

            <div className="p-3 bg-indigo-50/90 rounded-xl border border-indigo-200">
              <p className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">Capital Final</p>
              <p className="text-base sm:text-lg font-bold text-indigo-800 font-mono-num mt-0.5">
                {formatMoney(finalState?.total || 0, currency)}
              </p>
            </div>
          </div>

          {/* Gráfico de Crecimiento */}
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Proyección de Crecimiento ({years} Años)
            </h4>
            <div className="h-64 w-full bg-slate-50 rounded-xl p-2 border border-slate-200">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={simulationData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="year" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip 
                    formatter={(val: number) => formatMoney(val, currency)}
                    labelStyle={{ fontWeight: 'bold' }}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #cbd5e1', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                  />
                  <Area type="monotone" dataKey="total" name="Total Acumulado" stroke="#4f46e5" fill="#c7d2fe" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="invested" name="Dinero Aportado" stroke="#10b981" fill="#a7f3d0" fillOpacity={0.8} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="py-2 px-5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors"
          >
            Cerrar Simulador
          </button>
        </div>
      </div>
    </div>
  );
};
