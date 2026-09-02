import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatMoney, formatDate } from '../utils/format';
import { DynamicIcon } from '../components/DynamicIcon';
import { 
  Search, Filter, Download, Plus, ArrowLeftRight, TrendingDown, 
  TrendingUp, Calendar, Tag, FileSpreadsheet, X 
} from 'lucide-react';

import { Transaction } from '../types/finance';

interface TransactionsViewProps {
  onOpenNewTransaction: () => void;
  onEditTransaction: (txId: string) => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  onOpenNewTransaction,
  onEditTransaction,
}) => {
  const { 
    transactions, 
    categories, 
    accounts, 
    currency, 
    selectedPeriod,
    getCategoryById, 
    getAccountById,
    exportTransactionsCSV 
  } = useFinance();

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all'); // all | expense | income | transfer
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterAccount, setFilterAccount] = useState<string>('all');
  const [filterPeriodOnly, setFilterPeriodOnly] = useState<boolean>(true);

  // Filtrado
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // Filtro de periodo
      if (filterPeriodOnly && !t.date.startsWith(selectedPeriod)) {
        return false;
      }

      // Filtro tipo
      if (filterType !== 'all' && t.type !== filterType) {
        return false;
      }

      // Filtro categoría
      if (filterCategory !== 'all' && t.categoryId !== filterCategory) {
        return false;
      }

      // Filtro cuenta
      if (filterAccount !== 'all' && t.accountId !== filterAccount && t.toAccountId !== filterAccount) {
        return false;
      }

      // Búsqueda por texto (nota, categoría, etiquetas, cuenta)
      if (search.trim()) {
        const query = search.toLowerCase();
        const cat = getCategoryById(t.categoryId)?.name?.toLowerCase() || '';
        const acc = getAccountById(t.accountId)?.name?.toLowerCase() || '';
        const note = (t.note || '').toLowerCase();
        const tags = (t.tags || []).join(' ').toLowerCase();

        const match = cat.includes(query) || acc.includes(query) || note.includes(query) || tags.includes(query);
        if (!match) return false;
      }

      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, filterPeriodOnly, selectedPeriod, filterType, filterCategory, filterAccount, search]);

  // Agrupar por fechas
  const groupedTransactions = useMemo<Record<string, Transaction[]>>(() => {
    const groups: Record<string, Transaction[]> = {};
    filteredTransactions.forEach(t => {
      if (!groups[t.date]) groups[t.date] = [];
      groups[t.date].push(t);
    });
    return groups;
  }, [filteredTransactions]);

  // Totales de la selección filtrada
  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    filteredTransactions.forEach(t => {
      if (t.type === 'income') income += t.amount;
      if (t.type === 'expense') expense += t.amount;
    });
    return {
      income,
      expense,
      balance: income - expense,
      count: filteredTransactions.length,
    };
  }, [filteredTransactions]);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header de la vista */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Movimientos y Transacciones
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Historial de operaciones, filtros por categoría y búsqueda detallada
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportTransactionsCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold shadow-sm transition-colors"
            title="Exportar a CSV"
          >
            <Download className="w-4 h-4" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={onOpenNewTransaction}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold shadow-md shadow-emerald-600/20 transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Movimiento</span>
          </button>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
        
        {/* Input de Búsqueda */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por concepto, categoría, cuenta o etiqueta..."
            className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filtros rápidos en fila */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100">
          
          {/* Tipo */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">Todos los tipos</option>
            <option value="expense">Solo Gastos</option>
            <option value="income">Solo Ingresos</option>
            <option value="transfer">Solo Transferencias</option>
          </select>

          {/* Categoría */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">Todas las categorías</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Cuenta */}
          <select
            value={filterAccount}
            onChange={(e) => setFilterAccount(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">Todas las cuentas</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>

          {/* Periodo o Todo el Historial */}
          <button
            type="button"
            onClick={() => setFilterPeriodOnly(!filterPeriodOnly)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all text-center ${
              filterPeriodOnly
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-slate-100 border-slate-200 text-slate-700'
            }`}
          >
            {filterPeriodOnly ? 'Solo Mes Seleccionado' : 'Todo el Historial'}
          </button>

        </div>

      </div>

      {/* Banner Resumen de Filtro */}
      <div className="grid grid-cols-3 gap-3 p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm text-center">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ingresos Filtrados</span>
          <p className="text-sm sm:text-lg font-black text-emerald-600 font-mono-num mt-0.5">
            +{formatMoney(totals.income, currency)}
          </p>
        </div>
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gastos Filtrados</span>
          <p className="text-sm sm:text-lg font-black text-slate-900 font-mono-num mt-0.5">
            -{formatMoney(totals.expense, currency)}
          </p>
        </div>
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Balance ({totals.count} movs)</span>
          <p className={`text-sm sm:text-lg font-black font-mono-num mt-0.5 ${
            totals.balance >= 0 ? 'text-emerald-600' : 'text-red-600'
          }`}>
            {formatMoney(totals.balance, currency)}
          </p>
        </div>
      </div>

      {/* Listado Agrupado por Fechas */}
      {filteredTransactions.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
          <p className="text-base font-bold text-slate-700">No se encontraron movimientos con los filtros aplicados</p>
          <p className="text-xs text-slate-400 mt-1 mb-4">Prueba limpiando la búsqueda o cambiando el mes seleccionado</p>
          <button
            onClick={() => {
              setSearch('');
              setFilterType('all');
              setFilterCategory('all');
              setFilterAccount('all');
            }}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 rounded-xl transition-colors"
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedTransactions).map(([dateStr, txs]: [string, Transaction[]]) => {
            const dayExpense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
            const dayIncome = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);

            return (
              <div key={dateStr} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                {/* Header del día */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50/90 border-b border-slate-100 text-xs">
                  <span className="font-bold text-slate-700 capitalize">
                    {formatDate(dateStr, 'long')}
                  </span>
                  <div className="flex items-center gap-3 font-mono-num font-semibold text-[11px]">
                    {dayIncome > 0 && <span className="text-emerald-600">+{formatMoney(dayIncome, currency)}</span>}
                    {dayExpense > 0 && <span className="text-slate-700">-{formatMoney(dayExpense, currency)}</span>}
                  </div>
                </div>

                {/* Items del día */}
                <div className="divide-y divide-slate-100">
                  {txs.map((tx) => {
                    const cat = getCategoryById(tx.categoryId);
                    const acc = getAccountById(tx.accountId);
                    const toAcc = tx.toAccountId ? getAccountById(tx.toAccountId) : null;
                    const isExpense = tx.type === 'expense';
                    const isIncome = tx.type === 'income';

                    return (
                      <div
                        key={tx.id}
                        onClick={() => onEditTransaction(tx.id)}
                        className="flex items-center justify-between py-3 px-4 hover:bg-slate-50 cursor-pointer transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform"
                            style={{ backgroundColor: cat?.color || '#64748b' }}
                          >
                            <DynamicIcon name={cat?.icon || 'CircleDollarSign'} size={18} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold text-slate-800 leading-snug">
                                {tx.note || cat?.name || 'Movimiento'}
                              </p>
                              {tx.isRecurring && (
                                <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-slate-100 text-slate-600">
                                  Fijo
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                              <span className="font-medium text-slate-500">{cat?.name}</span>
                              <span>•</span>
                              <span>
                                {tx.type === 'transfer' ? `${acc?.name} ➔ ${toAcc?.name}` : acc?.name}
                              </span>
                            </div>
                            {tx.tags && tx.tags.length > 0 && (
                              <div className="flex items-center gap-1 mt-1">
                                {tx.tags.map(tag => (
                                  <span key={tag} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded">
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className={`text-sm sm:text-base font-bold font-mono-num text-right ${
                          isExpense ? 'text-slate-900' : isIncome ? 'text-emerald-600' : 'text-blue-600'
                        }`}>
                          {isExpense ? '-' : isIncome ? '+' : ''}{formatMoney(tx.amount, currency)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
