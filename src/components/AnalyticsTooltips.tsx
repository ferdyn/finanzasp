import React from 'react';
import { CurrencyCode, Transaction, Category, Account } from '../types/finance';
import { formatMoney, formatDate } from '../utils/format';
import { DynamicIcon } from './DynamicIcon';
import { ArrowUpRight, ArrowDownRight, TrendingUp, Calendar, CreditCard, Tag } from 'lucide-react';

interface CustomMonthlyTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  currency: CurrencyCode;
  categories: Category[];
  accounts: Account[];
}

export const CustomMonthlyTooltip: React.FC<CustomMonthlyTooltipProps> = ({
  active,
  payload,
  label,
  currency,
  categories,
  accounts,
}) => {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0]?.payload;
  if (!data) return null;

  const topExpenseTxs: Transaction[] = data.topExpenseTxs || [];
  const topIncomeTxs: Transaction[] = data.topIncomeTxs || [];

  return (
    <div className="bg-slate-900/95 dark:bg-slate-950/95 text-white p-3.5 sm:p-4 rounded-2xl border border-slate-700/80 shadow-2xl backdrop-blur-md min-w-[290px] max-w-[340px] text-xs pointer-events-none z-50">
      {/* Encabezado del mes */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2.5">
        <div>
          <span className="font-bold text-sm text-white tracking-tight">
            {data.fullPeriodName || label}
          </span>
          <p className="text-[10px] text-slate-400 font-medium">Totales y transacciones exactas</p>
        </div>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
          {data.txCount} {data.txCount === 1 ? 'movimiento' : 'movimientos'}
        </span>
      </div>

      {/* Tarjetas de Montos Exactos */}
      <div className="space-y-1.5 mb-2.5">
        <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
            <span className="text-emerald-300 font-medium">Ingresos ({data.incomeCount})</span>
          </div>
          <span className="font-mono-num font-bold text-emerald-400 text-xs">
            +{formatMoney(data.exactIncome, currency)}
          </span>
        </div>

        <div className="flex items-center justify-between p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />
            <span className="text-rose-300 font-medium">Gastos ({data.expenseCount})</span>
          </div>
          <span className="font-mono-num font-bold text-rose-400 text-xs">
            -{formatMoney(data.exactExpense, currency)}
          </span>
        </div>

        <div className="flex items-center justify-between p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="text-indigo-300 font-medium">Ahorro Neto</span>
          </div>
          <span className={`font-mono-num font-bold text-xs ${data.netSavings >= 0 ? 'text-indigo-300' : 'text-amber-400'}`}>
            {data.netSavings >= 0 ? '+' : ''}{formatMoney(data.netSavings, currency)}
            <span className="text-[10px] font-normal text-slate-400 ml-1">({data.savingsRate}%)</span>
          </span>
        </div>
      </div>

      {/* Lista de Movimientos con Monto Exacto */}
      {topExpenseTxs.length > 0 && (
        <div className="border-t border-slate-800/80 pt-2">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            <span>Mayores gastos del mes</span>
            <span>Monto Exacto</span>
          </div>
          <div className="space-y-1">
            {topExpenseTxs.map((tx) => {
              const cat = categories.find((c) => c.id === tx.categoryId);
              const acc = accounts.find((a) => a.id === tx.accountId);
              return (
                <div key={tx.id} className="flex items-center justify-between gap-2 py-0.5 text-[11px]">
                  <div className="flex items-center gap-1.5 min-w-0 truncate">
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: cat?.color || '#94a3b8' }}
                    />
                    <span className="truncate text-slate-200 font-medium">
                      {tx.note || cat?.name || 'Gasto'}
                    </span>
                    <span className="text-[9px] text-slate-400 shrink-0">
                      ({formatDate(tx.date, 'short')})
                    </span>
                  </div>
                  <span className="font-mono-num font-semibold text-rose-400 shrink-0">
                    -{formatMoney(tx.amount, currency)}
                  </span>
                </div>
              );
            })}
            {data.expenseCount > topExpenseTxs.length && (
              <p className="text-[10px] text-slate-400 pt-0.5 text-right font-medium">
                +{data.expenseCount - topExpenseTxs.length} transacciones más
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface CustomDailyTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  currency: CurrencyCode;
  categories: Category[];
  accounts: Account[];
}

export const CustomDailyTooltip: React.FC<CustomDailyTooltipProps> = ({
  active,
  payload,
  label,
  currency,
  categories,
  accounts,
}) => {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0]?.payload;
  if (!data) return null;

  const txs: Transaction[] = data.txs || [];

  return (
    <div className="bg-slate-900/95 dark:bg-slate-950/95 text-white p-3.5 sm:p-4 rounded-2xl border border-slate-700/80 shadow-2xl backdrop-blur-md min-w-[290px] max-w-[340px] text-xs pointer-events-none z-50">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2.5">
        <div>
          <span className="font-bold text-sm text-white tracking-tight capitalize">
            {data.fullDateLabel || label}
          </span>
          <p className="text-[10px] text-slate-400 font-medium">Detalle del día seleccionado</p>
        </div>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
          {txs.length} {txs.length === 1 ? 'movimiento' : 'movimientos'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-2.5">
        <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <span className="text-[10px] block text-emerald-300 font-medium">Ingresos del día</span>
          <span className="font-mono-num font-bold text-emerald-400 text-xs">
            +{formatMoney(data.exactIncome, currency)}
          </span>
        </div>
        <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
          <span className="text-[10px] block text-rose-300 font-medium">Gastos del día</span>
          <span className="font-mono-num font-bold text-rose-400 text-xs">
            -{formatMoney(data.exactExpense, currency)}
          </span>
        </div>
      </div>

      {txs.length === 0 ? (
        <p className="text-slate-400 text-[11px] italic text-center py-2">
          Sin transacciones registradas este día
        </p>
      ) : (
        <div className="border-t border-slate-800/80 pt-2 space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <span>Transacciones del día</span>
            <span>Monto Exacto</span>
          </div>
          <div className="max-h-36 overflow-y-auto space-y-1.5 pr-0.5">
            {txs.map((tx) => {
              const cat = categories.find((c) => c.id === tx.categoryId);
              const acc = accounts.find((a) => a.id === tx.accountId);
              const isIncome = tx.type === 'income';
              return (
                <div key={tx.id} className="flex items-center justify-between gap-2 py-0.5 border-b border-slate-800/50 last:border-0 text-[11px]">
                  <div className="flex items-center gap-1.5 min-w-0 truncate">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: cat?.color || '#94a3b8' }}
                    />
                    <div className="truncate min-w-0">
                      <p className="text-slate-200 font-semibold truncate leading-tight">
                        {tx.note || cat?.name || 'Movimiento'}
                      </p>
                      <p className="text-[9px] text-slate-400 leading-tight truncate">
                        {cat?.name} {acc ? `· ${acc.name}` : ''}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`font-mono-num font-bold shrink-0 text-xs ${
                      isIncome ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {isIncome ? '+' : '-'}{formatMoney(tx.amount, currency)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

interface CustomCategoryPieTooltipProps {
  active?: boolean;
  payload?: any[];
  currency: CurrencyCode;
  type?: 'expense' | 'income';
  accounts: Account[];
}

export const CustomCategoryPieTooltip: React.FC<CustomCategoryPieTooltipProps> = ({
  active,
  payload,
  currency,
  type = 'expense',
  accounts,
}) => {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0]?.payload;
  if (!data) return null;

  const isIncome = type === 'income';
  const transactions: Transaction[] = data.transactions || [];

  return (
    <div className="bg-slate-900/95 dark:bg-slate-950/95 text-white p-3.5 sm:p-4 rounded-2xl border border-slate-700/80 shadow-2xl backdrop-blur-md min-w-[290px] max-w-[340px] text-xs pointer-events-none z-50">
      {/* Encabezado con Icono y Categoría */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 shadow-xs"
            style={{ backgroundColor: data.color }}
          >
            <DynamicIcon name={data.icon} size={15} className="text-white" />
          </div>
          <div className="min-w-0 truncate">
            <span className="font-bold text-sm text-white tracking-tight truncate block">
              {data.name}
            </span>
            <p className="text-[10px] text-slate-400">
              {data.percentage}% del total de {isIncome ? 'ingresos' : 'gastos'}
            </p>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
          {data.txCount} {data.txCount === 1 ? 'transacción' : 'transacciones'}
        </span>
      </div>

      {/* Banner de Monto Exacto */}
      <div
        className={`p-2.5 rounded-xl mb-2.5 flex items-center justify-between ${
          isIncome ? 'bg-emerald-500/15 border border-emerald-500/30' : 'bg-rose-500/15 border border-rose-500/30'
        }`}
      >
        <div>
          <span className="text-[9px] uppercase font-bold tracking-wider text-slate-300 block">
            Monto exacto acumulado
          </span>
          <span
            className={`text-base font-extrabold font-mono-num ${
              isIncome ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {isIncome ? '+' : '-'}{formatMoney(data.exactAmount, currency)}
          </span>
        </div>
        {data.txCount > 1 && (
          <div className="text-right">
            <span className="text-[9px] uppercase font-semibold text-slate-400 block">Promedio</span>
            <span className="text-xs font-bold font-mono-num text-slate-200">
              {formatMoney(data.averageTx, currency)}
            </span>
          </div>
        )}
      </div>

      {/* Lista de Transacciones Exactas que componen este punto */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
          <span>Movimientos del mes</span>
          <span>Monto Exacto</span>
        </div>

        <div className="max-h-36 overflow-y-auto space-y-1.5 pr-0.5">
          {transactions.slice(0, 5).map((tx) => {
            const acc = accounts.find((a) => a.id === tx.accountId);
            return (
              <div
                key={tx.id}
                className="flex items-center justify-between gap-2 py-0.5 border-b border-slate-800/50 last:border-0 text-[11px]"
              >
                <div className="min-w-0 truncate">
                  <p className="text-slate-200 font-semibold truncate leading-tight">
                    {tx.note || data.name}
                  </p>
                  <p className="text-[9px] text-slate-400 leading-tight">
                    {formatDate(tx.date, 'short')} {acc ? `· ${acc.name}` : ''}
                  </p>
                </div>
                <span
                  className={`font-mono-num font-bold shrink-0 text-xs ${
                    isIncome ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {isIncome ? '+' : '-'}{formatMoney(tx.amount, currency)}
                </span>
              </div>
            );
          })}
        </div>

        {transactions.length > 5 && (
          <p className="text-[10px] text-slate-400 text-right pt-0.5 font-medium">
            +{transactions.length - 5} transacciones más
          </p>
        )}
      </div>
    </div>
  );
};
