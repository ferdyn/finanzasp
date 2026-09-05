import React from 'react';
import { Transaction, Account, Category, CurrencyCode } from '../../types/finance';
import { formatMoney, formatDate } from '../../utils/format';
import { DynamicIcon } from '../DynamicIcon';
import { Clock, ChevronRight, Plus, ArrowRightLeft } from 'lucide-react';

interface RecentActivityListProps {
  transactions: Transaction[];
  getCategoryById: (id: string) => Category | undefined;
  getAccountById: (id: string) => Account | undefined;
  currency: CurrencyCode;
  onOpenNewTransaction: () => void;
  onEditTransaction: (txId: string) => void;
  onNavigateToTransactions: () => void;
  canCreateTransactions: boolean;
  canEditTransactions: boolean;
}

export const RecentActivityList: React.FC<RecentActivityListProps> = ({
  transactions,
  getCategoryById,
  getAccountById,
  currency,
  onOpenNewTransaction,
  onEditTransaction,
  onNavigateToTransactions,
  canCreateTransactions,
  canEditTransactions,
}) => {
  const displayTxs = transactions.slice(0, 5);

  return (
    <div
      id="dashboard-recent-activity"
      className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs"
    >
      {/* Cabecera */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Actividad Reciente
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Últimos movimientos registrados
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canCreateTransactions && (
            <button
              type="button"
              onClick={onOpenNewTransaction}
              className="hidden sm:flex items-center gap-1 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800 text-xs font-bold rounded-xl transition-colors min-h-[38px]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Añadir</span>
            </button>
          )}
          <button
            type="button"
            onClick={onNavigateToTransactions}
            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1 min-h-[38px]"
          >
            <span>Ver todos</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Lista de Transacciones o Estado Vacío */}
      {displayTxs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
            No hay movimientos registrados en este período
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 mb-4">
            Comienza registrando tu primer ingreso, gasto o transferencia
          </p>
          {canCreateTransactions && (
            <button
              type="button"
              onClick={onOpenNewTransaction}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 min-h-[44px]"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Primer Movimiento</span>
            </button>
          )}
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {displayTxs.map((tx) => {
            const cat = getCategoryById(tx.categoryId);
            const acc = getAccountById(tx.accountId);
            const toAcc = tx.toAccountId ? getAccountById(tx.toAccountId) : undefined;
            const isExpense = tx.type === 'expense';
            const isIncome = tx.type === 'income';
            const isTransfer = tx.type === 'transfer';

            return (
              <div
                key={tx.id}
                role="button"
                tabIndex={0}
                onClick={() => {
                  if (canEditTransactions) {
                    onEditTransaction(tx.id);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (canEditTransactions) {
                      onEditTransaction(tx.id);
                    }
                  }
                }}
                aria-label={`${canEditTransactions ? 'Ver o editar' : 'Ver'} movimiento ${
                  tx.note || cat?.name || 'Movimiento'
                }, ${formatMoney(tx.amount, currency)}`}
                className="flex items-center justify-between py-3 px-2 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 active:bg-slate-100 dark:active:bg-slate-800 cursor-pointer transition-colors group min-h-[52px]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform shadow-2xs"
                    style={{
                      backgroundColor: isTransfer ? '#6366f1' : cat?.color || '#64748b',
                    }}
                  >
                    {isTransfer ? (
                      <ArrowRightLeft className="w-4 h-4 stroke-[2.2]" />
                    ) : (
                      <DynamicIcon name={cat?.icon || 'CircleDollarSign'} size={18} />
                    )}
                  </div>

                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
                        {tx.note || (isTransfer ? 'Transferencia' : cat?.name) || 'Movimiento'}
                      </p>
                      {tx.isRecurring && (
                        <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                          Recurrente
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5 truncate">
                      <span>{formatDate(tx.date, 'relative')}</span>
                      <span>•</span>
                      <span className="truncate">
                        {isTransfer
                          ? `${acc?.name || 'Origen'} → ${toAcc?.name || 'Destino'}`
                          : acc?.name || 'Cuenta'}
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  data-amount={tx.amount}
                  className={`text-xs sm:text-sm font-bold font-mono-num tabular-nums text-right shrink-0 ${
                    isExpense
                      ? 'text-rose-600 dark:text-rose-400'
                      : isIncome
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-indigo-600 dark:text-indigo-400'
                  }`}
                >
                  {isExpense ? '-' : isIncome ? '+' : '↔'}
                  {formatMoney(tx.amount, currency)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
