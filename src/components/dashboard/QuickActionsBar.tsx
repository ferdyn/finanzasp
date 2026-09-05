import React from 'react';
import { TrendingDown, TrendingUp, ArrowRightLeft, Target, PiggyBank, Landmark, Plus } from 'lucide-react';
import { TransactionType } from '../../types/finance';

interface QuickActionsBarProps {
  onOpenQuickAdd: (type: TransactionType) => void;
  onNavigateTab: (tab: string) => void;
  canCreateTransactions: boolean;
}

export const QuickActionsBar: React.FC<QuickActionsBarProps> = ({
  onOpenQuickAdd,
  onNavigateTab,
  canCreateTransactions,
}) => {
  return (
    <div id="dashboard-quick-actions" className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Acciones Frecuentes
        </h3>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
        
        {/* + Registrar Gasto */}
        <button
          type="button"
          onClick={() => onOpenQuickAdd('expense')}
          disabled={!canCreateTransactions}
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-red-50/80 dark:bg-red-950/40 hover:bg-red-100/90 dark:hover:bg-red-950/70 border border-red-200/80 dark:border-red-900/60 text-red-700 dark:text-red-300 transition-all min-h-[64px] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed group shadow-2xs"
          title="Registrar nuevo gasto"
        >
          <div className="w-8 h-8 rounded-xl bg-red-500 text-white flex items-center justify-center mb-1.5 shadow-xs shadow-red-500/30 group-hover:scale-105 transition-transform">
            <TrendingDown className="w-4 h-4 stroke-[2.5]" />
          </div>
          <span className="text-xs font-bold text-slate-900 dark:text-slate-100">+ Gasto</span>
        </button>

        {/* + Registrar Ingreso */}
        <button
          type="button"
          onClick={() => onOpenQuickAdd('income')}
          disabled={!canCreateTransactions}
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 hover:bg-emerald-100/90 dark:hover:bg-emerald-950/70 border border-emerald-200/80 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300 transition-all min-h-[64px] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed group shadow-2xs"
          title="Registrar nuevo ingreso"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center mb-1.5 shadow-xs shadow-emerald-600/30 group-hover:scale-105 transition-transform">
            <TrendingUp className="w-4 h-4 stroke-[2.5]" />
          </div>
          <span className="text-xs font-bold text-slate-900 dark:text-slate-100">+ Ingreso</span>
        </button>

        {/* + Transferencia */}
        <button
          type="button"
          onClick={() => onOpenQuickAdd('transfer')}
          disabled={!canCreateTransactions}
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 hover:bg-indigo-100/90 dark:hover:bg-indigo-950/70 border border-indigo-200/80 dark:border-indigo-900/60 text-indigo-700 dark:text-indigo-300 transition-all min-h-[64px] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed group shadow-2xs"
          title="Registrar traspaso entre cuentas"
        >
          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center mb-1.5 shadow-xs shadow-indigo-600/30 group-hover:scale-105 transition-transform">
            <ArrowRightLeft className="w-4 h-4 stroke-[2.5]" />
          </div>
          <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Traspaso</span>
        </button>

        {/* Acceso a Presupuestos */}
        <button
          type="button"
          onClick={() => onNavigateTab('presupuestos')}
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-100/80 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 transition-all min-h-[64px] active:scale-[0.98] group shadow-2xs"
          title="Ver y configurar presupuestos mensuales"
        >
          <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
            <Target className="w-4 h-4 stroke-[2.2]" />
          </div>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Presupuestos</span>
        </button>

        {/* Acceso a Metas */}
        <button
          type="button"
          onClick={() => onNavigateTab('metas')}
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-100/80 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 transition-all min-h-[64px] active:scale-[0.98] group shadow-2xs"
          title="Ver objetivos y metas de ahorro"
        >
          <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
            <PiggyBank className="w-4 h-4 stroke-[2.2]" />
          </div>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Metas</span>
        </button>

        {/* Acceso a Patrimonio */}
        <button
          type="button"
          onClick={() => onNavigateTab('patrimonio')}
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-100/80 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 transition-all min-h-[64px] active:scale-[0.98] group shadow-2xs"
          title="Ver cuentas bancarias y balances globales"
        >
          <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
            <Landmark className="w-4 h-4 stroke-[2.2]" />
          </div>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Cuentas</span>
        </button>

      </div>
    </div>
  );
};
