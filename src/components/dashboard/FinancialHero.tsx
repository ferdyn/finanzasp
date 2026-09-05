import React from 'react';
import { ShieldCheck, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Wallet, Landmark, Layers } from 'lucide-react';
import { CurrencyCode } from '../../types/finance';
import { formatMoney } from '../../utils/format';

interface FinancialHeroProps {
  totalNetWorth: number;
  availableLiquidity: number;
  totalAssets: number;
  totalLiabilities: number;
  currentMonthNet: number;
  financialHealthScore: number;
  currency: CurrencyCode;
  onNavigateToAccounts: () => void;
  canViewNetWorth: boolean;
}

export const FinancialHero: React.FC<FinancialHeroProps> = ({
  totalNetWorth,
  availableLiquidity,
  totalAssets,
  totalLiabilities,
  currentMonthNet,
  financialHealthScore,
  currency,
  onNavigateToAccounts,
  canViewNetWorth,
}) => {
  const isSurplus = currentMonthNet >= 0;

  const healthStatusText = financialHealthScore >= 80 
    ? 'Excelente' 
    : financialHealthScore >= 60 
    ? 'Equilibrado' 
    : 'Atención requerida';

  return (
    <div
      id="dashboard-hero-state"
      className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-white via-slate-50/90 to-slate-100/80 dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 p-5 sm:p-7 border border-slate-200/90 dark:border-slate-800 shadow-sm transition-all"
    >
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        
        {/* Nivel 1: Número Primario Dominante (Patrimonio Neto o Liquidez) */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              {canViewNetWorth ? 'Patrimonio Neto Total' : 'Saldo Disponible'}
            </span>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                isSurplus
                  ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
              }`}
            >
              {isSurplus ? (
                <>
                  <ArrowUpRight className="w-3 h-3 stroke-[2.5]" />
                  <span>Superávit del mes</span>
                </>
              ) : (
                <>
                  <ArrowDownRight className="w-3 h-3 stroke-[2.5]" />
                  <span>Déficit del mes</span>
                </>
              )}
            </span>
          </div>

          {/* Cifra Dominante */}
          <div className="flex items-baseline gap-2">
            <h2
              data-amount={canViewNetWorth ? totalNetWorth : availableLiquidity}
              className="text-3xl sm:text-4xl md:text-5xl font-black font-mono-num tracking-tight text-slate-900 dark:text-slate-50"
            >
              {formatMoney(canViewNetWorth ? totalNetWorth : availableLiquidity, currency)}
            </h2>
          </div>

          {/* Sub-información contextual y clara */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span>
              Liquidez operativa:{' '}
              <strong data-amount={availableLiquidity} className="text-slate-900 dark:text-slate-200 font-mono-num font-bold">
                {formatMoney(availableLiquidity, currency)}
              </strong>
            </span>
            {totalLiabilities > 0 && canViewNetWorth && (
              <>
                <span>•</span>
                <span>
                  Deudas / Pasivos:{' '}
                  <strong data-amount={totalLiabilities} className="text-rose-600 dark:text-rose-400 font-mono-num font-bold">
                    -{formatMoney(totalLiabilities, currency)}
                  </strong>
                </span>
              </>
            )}
          </div>
        </div>

        {/* Bloque Lateral: Salud Financiera y Desglose Rápido */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 self-start lg:self-center">
          
          {/* Tarjeta de Salud Financiera */}
          <div className="flex items-center gap-3 bg-white/90 dark:bg-slate-800/80 backdrop-blur-sm px-4 py-3 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
            <div className="relative flex items-center justify-center w-11 h-11 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border-2 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-extrabold text-sm font-mono-num shrink-0">
              {financialHealthScore}
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Salud Financiera</span>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                {healthStatusText} ({financialHealthScore}/100)
              </p>
            </div>
          </div>

          {/* Acceso Rápido a Patrimonio / Cuentas */}
          <button
            type="button"
            onClick={onNavigateToAccounts}
            className="flex items-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 rounded-2xl text-xs font-bold transition-colors border border-slate-200/60 dark:border-slate-700/60 min-h-[44px]"
            title="Ver todas las cuentas bancarias y balances detallados"
          >
            <Landmark className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Mis Cuentas</span>
          </button>
        </div>

      </div>

      {/* Sutil halo decorativo suave, sin saturación excesiva */}
      <div className="absolute -right-16 -bottom-16 w-48 h-48 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
    </div>
  );
};
