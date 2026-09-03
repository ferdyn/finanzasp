import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { useUser } from '../context/UserContext';
import { formatMoney, formatDate, formatMonthPeriod } from '../utils/format';
import { DynamicIcon } from '../components/DynamicIcon';
import { RecurringRemindersWidget } from '../components/RecurringRemindersWidget';
import { getRecurringStatus } from '../utils/recurring';
import { 
  TrendingDown, TrendingUp, Wallet, ArrowUpRight, ArrowDownRight, 
  PiggyBank, ShieldCheck, AlertTriangle, CheckCircle2, 
  ChevronRight, Plus, Sparkles, PieChart, CreditCard, Target, Zap, Bell, Check, Clock
} from 'lucide-react';
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface DashboardViewProps {
  onOpenNewTransaction: () => void;
  onEditTransaction: (txId: string) => void;
  setActiveTab: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenNewTransaction,
  onEditTransaction,
  setActiveTab,
}) => {
  const { 
    metrics, 
    currency, 
    selectedPeriod, 
    accounts, 
    budgets, 
    goals, 
    categories, 
    transactions,
    recurringBills,
    processRecurringBill,
    getCategoryById, 
    getCategorySpendForPeriod,
    extremeSavingsMode,
    extremeSavingsAnalysis
  } = useFinance();
  const { hasPermission } = useUser();
  const canCreateTransactions = hasPermission('canCreateTransactions');
  const canEditTransactions = hasPermission('canEditTransactions');
  const canEditBudgets = hasPermission('canManageBudgets');

  // Alertas de recordatorios urgentes/vencidos
  const urgentBills = recurringBills
    .filter(b => b.isActive)
    .map(b => ({
      ...b,
      status: getRecurringStatus(b.nextDueDate, b.reminderDays || 7)
    }))
    .filter(b => b.status.isOverdue || b.status.isToday);

  const overdueBills = urgentBills.filter(b => b.status.isOverdue);
  const todayBills = urgentBills.filter(b => b.status.isToday);

  const currentTxs = transactions
    .filter(t => t.date.startsWith(selectedPeriod))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Datos para gráfico de categorías de gastos
  const categorySpendData = categories
    .filter(c => c.type === 'expense')
    .map(c => {
      const value = getCategorySpendForPeriod(c.id, selectedPeriod);
      return {
        name: c.name,
        value,
        color: c.color,
        icon: c.icon,
      };
    })
    .filter(item => item.value > 0)
    .sort((a, b) => b.value - a.value);

  // Top 4 gastos
  const topExpenses = categorySpendData.slice(0, 4);

  // Presupuestos activos
  const activeBudgets = budgets.filter(b => b.period === selectedPeriod);
  const budgetsWithProgress = activeBudgets.map(b => {
    const category = getCategoryById(b.categoryId);
    const spent = getCategorySpendForPeriod(b.categoryId, selectedPeriod);
    const percent = Math.min(100, Math.round((spent / b.monthlyLimit) * 100));
    const isExceeded = spent > b.monthlyLimit;
    const isWarning = spent >= (b.monthlyLimit * (b.alertThreshold || 85)) / 100;
    return {
      ...b,
      category,
      spent,
      percent,
      isExceeded,
      isWarning,
    };
  });

  return (
    <div className="space-y-6 pb-12">
      
      {/* Saludo y Resumen de Estado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
            Resumen Financiero
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Estado de cuentas, ingresos y gastos de <span className="text-slate-800 dark:text-slate-200 font-semibold">{formatMonthPeriod(selectedPeriod)}</span>
          </p>
        </div>

        {/* Score de Salud Financiera */}
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2.5 sm:px-4 sm:py-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border-2 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-extrabold text-sm font-mono-num">
            {metrics.financialHealthScore}
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Salud Financiera</span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              {metrics.financialHealthScore >= 80 ? 'Excelente estado' : metrics.financialHealthScore >= 60 ? 'Buen control' : 'Requiere atención'}
            </p>
          </div>
        </div>
      </div>

      {/* Banner de Recordatorios de Pagos Vencidos o de Hoy */}
      {urgentBills.length > 0 && (
        <div className={`p-4 sm:p-5 rounded-2xl border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in duration-300 ${
          overdueBills.length > 0
            ? 'bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-transparent dark:from-rose-950/40 dark:via-slate-900 dark:to-slate-900 border-rose-300 dark:border-rose-800'
            : 'bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-950/40 dark:via-slate-900 dark:to-slate-900 border-amber-300 dark:border-amber-800'
        }`}>
          <div className="flex items-center gap-3.5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
              overdueBills.length > 0 
                ? 'bg-rose-500 text-white shadow-rose-500/30' 
                : 'bg-amber-500 text-white shadow-amber-500/30'
            }`}>
              <Bell className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                  {overdueBills.length > 0 
                    ? `¡Atención! ${overdueBills.length} pago${overdueBills.length > 1 ? 's' : ''} recurrente${overdueBills.length > 1 ? 's' : ''} vencido${overdueBills.length > 1 ? 's' : ''}`
                    : `¡Atención! Tienes ${todayBills.length} pago${todayBills.length > 1 ? 's' : ''} que vence${todayBills.length > 1 ? 'n' : ''} hoy`
                  }
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black text-white ${
                  overdueBills.length > 0 ? 'bg-rose-600' : 'bg-amber-500'
                }`}>
                  {overdueBills.length > 0 ? 'VENCIDO' : 'HOY'}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                {urgentBills.slice(0, 2).map((b, i) => (
                  <span key={b.id}>
                    {i > 0 && ', '}
                    {b.name} (<span className="font-mono-num font-semibold">{formatMoney(b.amount, currency)}</span>)
                  </span>
                ))}
                {urgentBills.length > 2 && ` y ${urgentBills.length - 2} más`} • Total pendiente:{' '}
                <strong className="text-slate-900 dark:text-white font-mono-num">
                  {formatMoney(urgentBills.reduce((acc, b) => acc + b.amount, 0), currency)}
                </strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            {urgentBills.length === 1 && canCreateTransactions && (
              <button
                type="button"
                onClick={() => processRecurringBill(urgentBills[0].id)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20 transition-all flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Pagar {urgentBills[0].name}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setActiveTab('ajustes')}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white shadow-sm transition-all flex items-center gap-1.5"
            >
              <span>Gestionar Recordatorios</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Banner de Modo de Ahorro Extremo */}
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
                  EN VIGOR
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Gastos esenciales: <strong className="text-emerald-600 dark:text-emerald-400 font-mono-num">{formatMoney(extremeSavingsAnalysis.essentialSpent, currency)}</strong> • Prescindibles: <strong className="text-amber-600 dark:text-amber-400 font-mono-num">{formatMoney(extremeSavingsAnalysis.nonEssentialSpent, currency)}</strong> • Potencial ahorro: <strong className="text-emerald-600 dark:text-emerald-400 font-mono-num">+{formatMoney(extremeSavingsAnalysis.totalPotentialMonthlySavings, currency)}/mes</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab('presupuestos')}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-sm shadow-amber-500/20 transition-all flex items-center gap-1.5"
            >
              <span>Ver Plan de Recortes</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Banner Principal de Resumen Financiero con el degradado adaptativo */}
      <div id="dashboard-balance-banner" className="bg-gradient-to-br from-white via-slate-50 to-slate-100/80 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 text-slate-900 dark:text-white p-6 sm:p-8 rounded-3xl shadow-md shadow-slate-200/50 dark:shadow-xl dark:shadow-slate-900/20 relative overflow-hidden border border-slate-200/80 dark:border-slate-800 transition-colors">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                Balance Neto Mensual
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                metrics.currentMonthNet >= 0 
                  ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30' 
                  : 'bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30'
              }`}>
                {metrics.currentMonthNet >= 0 ? 'Superávit' : 'Déficit'}
              </span>
            </div>
            <div className="text-3xl sm:text-4xl font-black font-mono-num tracking-tight mt-1 text-slate-900 dark:text-white">
              {metrics.currentMonthNet >= 0 ? '+' : ''}{formatMoney(metrics.currentMonthNet, currency)}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Tasa de ahorro del <strong className="text-emerald-600 dark:text-emerald-300 font-semibold">{metrics.savingsRate}%</strong> • Salud financiera de <strong className="text-slate-900 dark:text-white font-semibold">{metrics.financialHealthScore}/100</strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:gap-5 bg-slate-100/90 dark:bg-white/10 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-white/10">
            <div>
              <span className="text-[10px] sm:text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                Ingresos
              </span>
              <span className="text-base sm:text-xl font-bold font-mono-num text-emerald-600 dark:text-emerald-300">
                +{formatMoney(metrics.currentMonthIncome, currency)}
              </span>
            </div>
            <div className="w-px h-8 sm:h-10 bg-slate-200 dark:bg-white/20" />
            <div>
              <span className="text-[10px] sm:text-[11px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider block">
                Gastos
              </span>
              <span className="text-base sm:text-xl font-bold font-mono-num text-rose-600 dark:text-rose-300">
                -{formatMoney(metrics.currentMonthExpense, currency)}
              </span>
            </div>
            <div className="w-px h-8 sm:h-10 bg-slate-200 dark:bg-white/20" />
            <div>
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-600 dark:text-indigo-300 uppercase tracking-wider block">
                Patrimonio Total
              </span>
              <span className="text-base sm:text-xl font-bold font-mono-num text-slate-900 dark:text-white">
                {formatMoney(metrics.totalNetWorth, currency)}
              </span>
            </div>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -top-10 w-48 h-48 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 4 Métricas Principales */}
      <div id="dashboard-kpi-grid" className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Ingresos */}
        <div className="bg-gradient-to-br from-white via-slate-50/60 to-slate-100/50 dark:from-slate-900 dark:via-slate-800/80 dark:to-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ingresos</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white font-mono-num">
            {formatMoney(metrics.currentMonthIncome, currency)}
          </div>
          <div className="flex items-center gap-1 mt-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            <span>Mes anterior:</span>
            <span className="font-mono-num">{formatMoney(metrics.previousMonthIncome, currency)}</span>
          </div>
        </div>

        {/* Gastos */}
        <div className="bg-gradient-to-br from-white via-slate-50/60 to-slate-100/50 dark:from-slate-900 dark:via-slate-800/80 dark:to-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Gastos</span>
            <div className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white font-mono-num">
            {formatMoney(metrics.currentMonthExpense, currency)}
          </div>
          <div className="flex items-center gap-1 mt-1 text-[11px] font-semibold">
            {metrics.expenseDiffPercent > 0 ? (
              <span className="text-red-600 dark:text-red-400 flex items-center gap-0.5">
                <ArrowUpRight className="w-3 h-3" />+{metrics.expenseDiffPercent}% vs mes anterior
              </span>
            ) : metrics.expenseDiffPercent < 0 ? (
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                <ArrowDownRight className="w-3 h-3" />{metrics.expenseDiffPercent}% vs mes anterior
              </span>
            ) : (
              <span className="text-slate-400">Sin variación</span>
            )}
          </div>
        </div>

        {/* Ahorro Neto */}
        <div className="bg-gradient-to-br from-white via-slate-50/60 to-slate-100/50 dark:from-slate-900 dark:via-slate-800/80 dark:to-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ahorro Neto</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-lg sm:text-2xl font-black font-mono-num ${
            metrics.currentMonthNet >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
          }`}>
            {formatMoney(metrics.currentMonthNet, currency)}
          </div>
          <div className="mt-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            {metrics.currentMonthNet >= 0 ? 'Superávit mensual' : 'Déficit mensual'}
          </div>
        </div>

        {/* Tasa de Ahorro */}
        <div className="bg-gradient-to-br from-white via-slate-50/60 to-slate-100/50 dark:from-slate-900 dark:via-slate-800/80 dark:to-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tasa de Ahorro</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white font-mono-num">
            {metrics.savingsRate}%
          </div>
          <div className="mt-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${
              metrics.savingsRate >= 20 ? 'bg-emerald-500' : metrics.savingsRate >= 10 ? 'bg-amber-500' : 'bg-red-400'
            }`} />
            <span>Objetivo recomendado: 20%</span>
          </div>
        </div>

      </div>

      {/* Fila 2: Cuentas y Presupuestos Rápidos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Cuentas y Saldo Total */}
        <div className="bg-gradient-to-br from-white via-slate-50/60 to-slate-100/50 dark:from-slate-900 dark:via-slate-800/80 dark:to-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Mis Cuentas</h3>
              </div>
              <button
                onClick={() => setActiveTab('patrimonio')}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-0.5"
              >
                <span>Ver todas</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {accounts.slice(0, 4).map((acc) => (
                <div
                  key={acc.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100/80 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-700/60 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                      style={{ backgroundColor: acc.color }}
                    >
                      <DynamicIcon name={acc.icon} size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-snug">{acc.name}</p>
                      <p className="text-[11px] text-slate-400 capitalize">{acc.type}</p>
                    </div>
                  </div>
                  <div className={`text-sm font-bold font-mono-num ${
                    acc.balance >= 0 ? 'text-slate-900 dark:text-white' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {formatMoney(acc.balance, currency)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Patrimonio Neto</span>
            <span className="text-base font-extrabold text-slate-900 dark:text-white font-mono-num">
              {formatMoney(metrics.totalNetWorth, currency)}
            </span>
          </div>
        </div>

        {/* Desglose de Gastos por Categoría */}
        <div className="bg-gradient-to-br from-white via-slate-50/60 to-slate-100/50 dark:from-slate-900 dark:via-slate-800/80 dark:to-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <PieChart className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Gastos por Categoría</h3>
              </div>
              <button
                onClick={() => setActiveTab('analisis')}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-0.5"
              >
                <span>Detalles</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {categorySpendData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <p className="text-xs text-slate-400">No hay gastos registrados en este mes</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topExpenses.map((item) => {
                  const percentOfTotal = metrics.currentMonthExpense > 0
                    ? Math.round((item.value / metrics.currentMonthExpense) * 100)
                    : 0;
                  return (
                    <div key={item.name} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[140px]">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 font-mono-num">
                          <span className="font-bold text-slate-900 dark:text-white">{formatMoney(item.value, currency)}</span>
                          <span className="text-[10px] text-slate-400">({percentOfTotal}%)</span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${percentOfTotal}%`, backgroundColor: item.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Total Gastado este mes</span>
            <span className="font-bold text-slate-900 dark:text-white font-mono-num">{formatMoney(metrics.currentMonthExpense, currency)}</span>
          </div>
        </div>

        {/* Estado de Presupuestos Activos */}
        <div className="bg-gradient-to-br from-white via-slate-50/60 to-slate-100/50 dark:from-slate-900 dark:via-slate-800/80 dark:to-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Control de Presupuesto</h3>
              </div>
              <button
                onClick={() => setActiveTab('presupuestos')}
                className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 flex items-center gap-0.5"
              >
                <span>Ajustar</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {budgetsWithProgress.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <p className="text-xs text-slate-400 mb-2">No has fijado presupuestos para este mes</p>
                {canEditBudgets && (
                  <button
                    onClick={() => setActiveTab('presupuestos')}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 rounded-lg transition-colors"
                  >
                    Fijar presupuesto
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {budgetsWithProgress.slice(0, 4).map((b) => (
                  <div key={b.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[130px]">
                        {b.category?.name || 'Categoría'}
                      </span>
                      <span className={`font-mono-num font-bold text-xs ${
                        b.isExceeded ? 'text-red-600 dark:text-red-400' : b.isWarning ? 'text-amber-600 dark:text-amber-400' : 'text-slate-800 dark:text-slate-200'
                      }`}>
                        {formatMoney(b.spent, currency)} / {formatMoney(b.monthlyLimit, currency)}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          b.isExceeded ? 'bg-red-500' : b.isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, b.percent)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>{budgetsWithProgress.filter(b => b.isExceeded).length} presupuestos excedidos</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">{budgetsWithProgress.filter(b => !b.isExceeded).length} en orden</span>
          </div>
        </div>

      </div>

      {/* Widget Interactivo de Recordatorios de Pagos y Vencimientos */}
      <RecurringRemindersWidget
        onOpenNewRecurring={() => setActiveTab('ajustes')}
        onOpenSettings={() => setActiveTab('ajustes')}
      />

      {/* Fila 3: Últimos Movimientos */}
      <div className="bg-gradient-to-br from-white via-slate-50/60 to-slate-100/50 dark:from-slate-900 dark:via-slate-800/80 dark:to-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Últimos Movimientos</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Actividad reciente en tus cuentas</p>
          </div>
          <div className="flex items-center gap-2">
            {canCreateTransactions && (
              <button
                onClick={onOpenNewTransaction}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold rounded-xl transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Añadir</span>
              </button>
            )}
            <button
              onClick={() => setActiveTab('movimientos')}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1"
            >
              <span>Ver todos</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {currentTxs.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">No hay movimientos registrados en este mes</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 mb-4">Comienza registrando tu primer ingreso o gasto</p>
            {canCreateTransactions && (
              <button
                onClick={onOpenNewTransaction}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow transition-colors"
              >
                + Registrar Movimiento
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {currentTxs.slice(0, 6).map((tx) => {
              const cat = getCategoryById(tx.categoryId);
              const acc = useFinance().getAccountById(tx.accountId);
              const isExpense = tx.type === 'expense';
              const isIncome = tx.type === 'income';

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
                  aria-label={`${canEditTransactions ? 'Ver o editar' : 'Ver'} movimiento ${tx.note || cat?.name || 'Movimiento'}, ${formatMoney(tx.amount, currency)}`}
                  className="flex items-center justify-between py-3.5 px-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 active:bg-slate-100 dark:active:bg-slate-800 cursor-pointer transition-colors group min-h-[52px]"
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
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-snug">
                          {tx.note || cat?.name || 'Movimiento'}
                        </p>
                        {tx.isRecurring && (
                          <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            Fijo
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span>{formatDate(tx.date, 'relative')}</span>
                        <span>•</span>
                        <span>{acc?.name || 'Cuenta'}</span>
                      </div>
                    </div>
                  </div>

                  <div className={`text-sm sm:text-base font-bold font-mono-num tabular-nums text-right ${
                    isExpense ? 'text-rose-600 dark:text-rose-400' : isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'
                  }`}>
                    {isExpense ? '-' : isIncome ? '+' : '↔'}{formatMoney(tx.amount, currency)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
