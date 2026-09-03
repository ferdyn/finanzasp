import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useUser } from '../context/UserContext';
import { formatMoney, formatDate } from '../utils/format';
import { DynamicIcon } from '../components/DynamicIcon';
import { 
  Search, Filter, Download, Plus, ArrowLeftRight, TrendingDown, 
  TrendingUp, Calendar, Tag, FileSpreadsheet, X, Sparkles, AlertCircle,
  Zap, ShieldCheck, Receipt
} from 'lucide-react';

import { Transaction } from '../types/finance';
import { TipAndSplitModal } from '../components/TipAndSplitModal';
import { TransactionReceiptModal } from '../components/TransactionReceiptModal';

interface TransactionsViewProps {
  onOpenNewTransaction: () => void;
  onEditTransaction: (txId: string) => void;
  onOpenNewTransactionWithData?: (data: Partial<Transaction>) => void;
}

// Normaliza texto para búsqueda insensible a acentos, diacríticos y mayúsculas
const normalizeText = (text: string): string => {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
};

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  onOpenNewTransaction,
  onEditTransaction,
  onOpenNewTransactionWithData,
}) => {
  const { 
    transactions, 
    categories, 
    accounts, 
    currency, 
    selectedPeriod,
    getCategoryById, 
    getAccountById,
    exportTransactionsCSV,
    extremeSavingsMode,
    isCategoryEssential,
    extremeSavingsAnalysis
  } = useFinance();
  const { hasPermission } = useUser();
  const canCreateTransactions = hasPermission('canCreateTransactions');
  const canEditTransactions = hasPermission('canEditTransactions');
  const canExportReports = hasPermission('canExportReports');

  const [isTipSplitModalOpen, setIsTipSplitModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [searchTarget, setSearchTarget] = useState<'all' | 'description' | 'category'>('all'); // all = descripción y categoría
  const [filterType, setFilterType] = useState<string>('all'); // all | expense | income | transfer
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterAccount, setFilterAccount] = useState<string>('all');
  const [filterPeriodOnly, setFilterPeriodOnly] = useState<boolean>(true);
  const [filterEssential, setFilterEssential] = useState<'all' | 'essential' | 'non_essential'>('all');
  const [selectedTxForReceipt, setSelectedTxForReceipt] = useState<Transaction | null>(null);

  // Categorías frecuentes para chips de acceso rápido
  const quickCategories = useMemo(() => {
    return categories.filter(c => c.type === 'expense').slice(0, 6);
  }, [categories]);

  // Comprueba si una transacción coincide con la búsqueda en tiempo real
  const matchesSearch = (t: Transaction, query: string, target: 'all' | 'description' | 'category') => {
    if (!query) return true;
    const normQuery = normalizeText(query);
    const catName = getCategoryById(t.categoryId)?.name || '';
    const normCategory = normalizeText(catName);
    const normDescription = normalizeText(t.note || '');
    const normAccount = normalizeText(getAccountById(t.accountId)?.name || '');
    const normTags = normalizeText((t.tags || []).join(' '));

    if (target === 'description') {
      return normDescription.includes(normQuery);
    }
    if (target === 'category') {
      return normCategory.includes(normQuery);
    }
    // 'all': Busca en descripción o categoría (además de cuenta y tags de forma complementaria)
    return (
      normDescription.includes(normQuery) || 
      normCategory.includes(normQuery) || 
      normAccount.includes(normQuery) || 
      normTags.includes(normQuery)
    );
  };

  // Filtrado principal
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

      // Filtro categoría fija
      if (filterCategory !== 'all' && t.categoryId !== filterCategory) {
        return false;
      }

      // Filtro cuenta fija
      if (filterAccount !== 'all' && t.accountId !== filterAccount && t.toAccountId !== filterAccount) {
        return false;
      }

      // Filtro de esenciales vs prescindibles
      if (filterEssential === 'essential' && (t.type !== 'expense' || !isCategoryEssential(t.categoryId))) {
        return false;
      }
      if (filterEssential === 'non_essential' && (t.type !== 'expense' || isCategoryEssential(t.categoryId))) {
        return false;
      }

      // Búsqueda en tiempo real por descripción o categoría
      if (!matchesSearch(t, search, searchTarget)) {
        return false;
      }

      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, filterPeriodOnly, selectedPeriod, filterType, filterCategory, filterAccount, filterEssential, search, searchTarget, isCategoryEssential]);

  // Conteo de coincidencias globales fuera del periodo para alertar al usuario si busca un gasto pasado
  const globalMatchesCount = useMemo(() => {
    if (!search.trim() || !filterPeriodOnly) return 0;
    return transactions.filter(t => matchesSearch(t, search, searchTarget)).length;
  }, [transactions, search, searchTarget, filterPeriodOnly]);

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
      <div id="transactions-view-header" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
            Movimientos y Transacciones
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Historial de operaciones, filtros por categoría y búsqueda en tiempo real
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsTipSplitModalOpen(true)}
            aria-label="Calculadora de propinas y división de gastos"
            className="flex items-center gap-1.5 px-3.5 py-2.5 min-h-[44px] rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold shadow-sm transition-colors active:scale-95"
            title="Dividir cuenta y calcular propina"
          >
            <Receipt className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">Dividir & Propinas</span>
            <span className="sm:hidden">Propinas</span>
          </button>

          {canExportReports && (
            <button
              type="button"
              onClick={exportTransactionsCSV}
              aria-label="Exportar transacciones a formato CSV"
              className="flex items-center gap-1.5 px-3.5 py-2.5 min-h-[44px] rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold shadow-sm transition-colors active:scale-95"
              title="Exportar a CSV"
            >
              <Download className="w-4 h-4" />
              <span>Exportar CSV</span>
            </button>
          )}

          {canCreateTransactions && (
            <button
              id="btn-new-transaction"
              type="button"
              onClick={onOpenNewTransaction}
              aria-label="Crear nuevo movimiento"
              className="flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold shadow-md shadow-emerald-600/20 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Movimiento</span>
            </button>
          )}
        </div>
      </div>

      {/* Banner Modo de Ahorro Extremo */}
      {extremeSavingsMode && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-950/40 dark:via-slate-900 dark:to-slate-900 border border-amber-300 dark:border-amber-700/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-amber-500/30">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                  Modo de Ahorro Extremo Activo
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white">
                  PRIORIDAD VITAL
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Gastos esenciales: <strong className="text-emerald-600 dark:text-emerald-400 font-mono-num">{formatMoney(extremeSavingsAnalysis.essentialSpent, currency)}</strong> • Gastos prescindibles: <strong className="text-amber-600 dark:text-amber-400 font-mono-num">{formatMoney(extremeSavingsAnalysis.nonEssentialSpent, currency)}</strong>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setFilterEssential(filterEssential === 'essential' ? 'all' : 'essential')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                filterEssential === 'essential'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{filterEssential === 'essential' ? 'Viendo solo esenciales' : 'Filtrar solo esenciales'}</span>
            </button>

            {filterEssential !== 'all' && (
              <button
                type="button"
                onClick={() => setFilterEssential('all')}
                className="px-2.5 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 underline"
              >
                Ver todos
              </button>
            )}
          </div>
        </div>
      )}

      {/* Barra de Filtros y Búsqueda en Tiempo Real */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3.5">
        
        {/* Input Principal de Búsqueda con selector de objetivo */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5">
          <div className="relative flex-1">
            <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${
              search ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'
            }`} />
            <input
              type="text"
              inputMode="search"
              autoCorrect="off"
              autoCapitalize="none"
              aria-label="Buscar transacciones en tiempo real"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar descripción o categoría..."
              className="w-full pl-8 sm:pl-9 pr-20 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-1.5 focus:ring-emerald-500 transition-all"
            />

            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  aria-label="Limpiar búsqueda"
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-700 transition-colors active:scale-90"
                  title="Limpiar búsqueda"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <span className="text-[11px] font-bold font-mono-num px-2 py-0.5 rounded-md bg-slate-200/60 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300">
                {filteredTransactions.length}
              </span>
            </div>
          </div>

          {/* Selector de campo de búsqueda: Descripción, Categoría o Ambos */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0 self-start md:self-auto text-xs font-semibold">
            <button
              type="button"
              onClick={() => setSearchTarget('all')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                searchTarget === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Buscar en descripción y categoría"
            >
              Todo
            </button>
            <button
              type="button"
              onClick={() => setSearchTarget('description')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                searchTarget === 'description'
                  ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Filtrar solo por descripción o concepto"
            >
              Descripción
            </button>
            <button
              type="button"
              onClick={() => setSearchTarget('category')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                searchTarget === 'category'
                  ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Filtrar solo por nombre de categoría"
            >
              Categoría
            </button>
          </div>
        </div>

        {/* Chips de Categorías Frecuentes para filtrado instantáneo */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 shrink-0 mr-1">
            Filtro rápido:
          </span>
          {quickCategories.map((cat) => {
            const isSelected = filterCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setFilterCategory(isSelected ? 'all' : cat.id)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                  isSelected
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700 border border-transparent dark:border-slate-750'
                }`}
              >
                <div 
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                <span>{cat.name}</span>
                {isSelected && <X className="w-3 h-3 ml-0.5" />}
              </button>
            );
          })}
          {(search || filterCategory !== 'all' || filterType !== 'all' || filterAccount !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setFilterCategory('all');
                setFilterType('all');
                setFilterAccount('all');
              }}
              className="text-[11px] font-bold text-slate-400 hover:text-red-500 dark:hover:text-red-400 px-2 py-1 transition-colors shrink-0 underline"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        {/* Filtros secundarios en fila */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          
          {/* Tipo */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            aria-label="Filtrar por tipo de transacción"
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-normal text-slate-700 dark:text-slate-300 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-1.5 focus:ring-emerald-500 min-h-[38px] truncate"
          >
            <option value="all">Todos los tipos</option>
            <option value="expense">Solo Gastos</option>
            <option value="income">Solo Ingresos</option>
            <option value="transfer">Solo Transferencias</option>
          </select>

          {/* Categoría completa */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            aria-label="Filtrar por categoría"
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-normal text-slate-700 dark:text-slate-300 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-1.5 focus:ring-emerald-500 min-h-[38px] truncate"
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
            aria-label="Filtrar por cuenta"
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-normal text-slate-700 dark:text-slate-300 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-1.5 focus:ring-emerald-500 min-h-[38px] truncate"
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
            aria-label={filterPeriodOnly ? 'Ver transacciones de todo el historial' : 'Ver transacciones solo de este mes'}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-normal border transition-all text-center min-h-[38px] flex items-center justify-center truncate ${
              filterPeriodOnly
                ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300/80 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            <span className="truncate">{filterPeriodOnly ? 'Mes Seleccionado' : 'Todo el Historial'}</span>
          </button>

        </div>

      </div>

      {/* Sugerencia de búsqueda cuando hay 0 resultados en el mes pero sí en otros meses */}
      {search.trim() && filterPeriodOnly && filteredTransactions.length === 0 && globalMatchesCount > 0 && (
        <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>
              No hay movimientos en el mes actual para <strong>"{search}"</strong>, pero se encontraron <strong>{globalMatchesCount}</strong> en otros meses.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setFilterPeriodOnly(false)}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shrink-0 transition-colors shadow-xs"
          >
            Ver en todo el historial
          </button>
        </div>
      )}

      {/* Banner Resumen de Filtro con degradado insignia de patrimonio */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-5 sm:p-6 rounded-3xl shadow-xl shadow-slate-900/10 relative overflow-hidden border border-slate-800">
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center sm:text-left sm:divide-x sm:divide-white/10">
          <div className="sm:pr-4">
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
              Ingresos Filtrados
            </span>
            <p className="text-xl sm:text-2xl font-black text-emerald-300 font-mono-num mt-1">
              +{formatMoney(totals.income, currency)}
            </p>
          </div>
          <div className="sm:px-4">
            <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider block">
              Gastos Filtrados
            </span>
            <p className="text-xl sm:text-2xl font-black text-rose-300 font-mono-num mt-1">
              -{formatMoney(totals.expense, currency)}
            </p>
          </div>
          <div className="sm:pl-4">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
              Balance Filtrado ({totals.count} movs)
            </span>
            <p className={`text-xl sm:text-2xl font-black font-mono-num mt-1 ${
              totals.balance >= 0 ? 'text-white' : 'text-amber-400'
            }`}>
              {totals.balance >= 0 ? '+' : ''}{formatMoney(totals.balance, currency)}
            </p>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Listado Agrupado por Fechas */}
      {filteredTransactions.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
          <p className="text-base font-bold text-slate-700 dark:text-slate-200">No se encontraron movimientos con los filtros aplicados</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 mb-4">Prueba limpiando la búsqueda por descripción o categoría</p>
          <button
            onClick={() => {
              setSearch('');
              setSearchTarget('all');
              setFilterType('all');
              setFilterCategory('all');
              setFilterAccount('all');
            }}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 rounded-xl transition-colors"
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
              <div key={dateStr} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
                {/* Header del día */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50/90 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300 capitalize">
                    {formatDate(dateStr, 'long')}
                  </span>
                  <div className="flex items-center gap-3 font-mono-num font-semibold text-[11px]">
                    {dayIncome > 0 && <span className="text-emerald-600 dark:text-emerald-400">+{formatMoney(dayIncome, currency)}</span>}
                    {dayExpense > 0 && <span className="text-slate-700 dark:text-slate-300">-{formatMoney(dayExpense, currency)}</span>}
                  </div>
                </div>

                {/* Items del día */}
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {txs.map((tx) => {
                    const cat = getCategoryById(tx.categoryId);
                    const acc = getAccountById(tx.accountId);
                    const toAcc = tx.toAccountId ? getAccountById(tx.toAccountId) : null;
                    const isExpense = tx.type === 'expense';
                    const isIncome = tx.type === 'income';
                    const isEssential = isExpense && isCategoryEssential(tx.categoryId);

                    // Comprobar si la categoría coincide con la búsqueda activa
                    const isCategoryMatch = search.trim() && cat && normalizeText(cat.name).includes(normalizeText(search));

                    return (
                      <div
                        key={tx.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          if (canEditTransactions) {
                            onEditTransaction(tx.id);
                          } else {
                            setSelectedTxForReceipt(tx);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            if (canEditTransactions) {
                              onEditTransaction(tx.id);
                            } else {
                              setSelectedTxForReceipt(tx);
                            }
                          }
                        }}
                        aria-label={`${canEditTransactions ? 'Editar' : 'Ver detalle de'} transacción ${tx.note || cat?.name || 'Movimiento'}, ${formatMoney(tx.amount, currency)}`}
                        className={`flex items-center justify-between py-3.5 px-4 min-h-[56px] cursor-pointer transition-colors group ${
                          extremeSavingsMode && isExpense
                            ? isEssential
                              ? 'bg-emerald-500/5 hover:bg-emerald-500/10 active:bg-emerald-500/15'
                              : 'opacity-70 hover:opacity-100 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 active:bg-slate-100 dark:active:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform shadow-xs"
                            style={{ backgroundColor: cat?.color || '#64748b' }}
                          >
                            <DynamicIcon name={cat?.icon || 'CircleDollarSign'} size={18} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-snug">
                                {tx.note || cat?.name || 'Movimiento'}
                              </p>
                              {tx.isRecurring && (
                                <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                  Fijo
                                </span>
                              )}
                              {isExpense && (
                                isEssential ? (
                                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80">
                                    <ShieldCheck className="w-2.5 h-2.5" />
                                    <span>Esencial</span>
                                  </span>
                                ) : extremeSavingsMode ? (
                                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/80">
                                    <span>Prescindible</span>
                                  </span>
                                ) : null
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                              <span className={`font-medium ${
                                isCategoryMatch 
                                  ? 'text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded' 
                                  : 'text-slate-600 dark:text-slate-400'
                              }`}>
                                {cat?.name}
                              </span>
                              <span>•</span>
                              <span>
                                {tx.type === 'transfer' ? `${acc?.name} ➔ ${toAcc?.name}` : acc?.name}
                              </span>
                            </div>
                            {tx.tags && tx.tags.length > 0 && (
                              <div className="flex items-center gap-1 mt-1">
                                {tx.tags.map(tag => (
                                  <span key={tag} className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.2 rounded">
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTxForReceipt(tx);
                            }}
                            title="Ver comprobante oficial"
                            aria-label={`Ver comprobante de ${tx.note || cat?.name || 'movimiento'}`}
                            className="p-2 rounded-xl text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors opacity-75 group-hover:opacity-100 flex items-center justify-center min-w-[36px] min-h-[36px]"
                          >
                            <Receipt className="w-4 h-4" />
                          </button>

                          <div className={`text-sm sm:text-base font-bold font-mono-num tabular-nums text-right ${
                            isExpense ? 'text-rose-600 dark:text-rose-400' : isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'
                          }`}>
                            {isExpense ? '-' : isIncome ? '+' : '↔'}{formatMoney(tx.amount, currency)}
                          </div>
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

      {/* Modal de Comprobante Financiero (Regla UX/UI p. 4) */}
      {selectedTxForReceipt && (
        <TransactionReceiptModal
          isOpen={true}
          transaction={selectedTxForReceipt}
          onClose={() => setSelectedTxForReceipt(null)}
        />
      )}

      {/* Modal de Calculadora de Propinas y División de Gastos */}
      <TipAndSplitModal
        isOpen={isTipSplitModalOpen}
        onClose={() => setIsTipSplitModalOpen(false)}
        onOpenTransactionWithData={(data) => {
          if (onOpenNewTransactionWithData) {
            onOpenNewTransactionWithData(data);
          } else {
            onOpenNewTransaction();
          }
        }}
      />

    </div>
  );
};

