import React, { useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useUser } from '../context/UserContext';
import { formatMoney, formatMonthPeriod } from '../utils/format';
import { getRecurringStatus } from '../utils/recurring';
import { 
  calculateAvailableLiquidity, 
  calculateHistoricalMonthlyTrend, 
  getRelevantBudgets, 
  generateDeterministicInsights 
} from '../utils/dashboardHelpers';
import { FinancialHero } from '../components/dashboard/FinancialHero';
import { PeriodSummarySection } from '../components/dashboard/PeriodSummarySection';
import { QuickActionsBar } from '../components/dashboard/QuickActionsBar';
import { FinancialInsightsCard } from '../components/dashboard/FinancialInsightsCard';
import { FinancialEvolutionChart } from '../components/dashboard/FinancialEvolutionChart';
import { BudgetHighlights } from '../components/dashboard/BudgetHighlights';
import { SpendingHighlights, CategorySpendItem } from '../components/dashboard/SpendingHighlights';
import { RecentActivityList } from '../components/dashboard/RecentActivityList';
import { RecurringRemindersWidget } from '../components/RecurringRemindersWidget';
import { TransactionType } from '../types/finance';
import { Bell, Check, ChevronRight, Zap } from 'lucide-react';

interface DashboardViewProps {
  onOpenNewTransaction: (type?: TransactionType) => void;
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
    setSelectedPeriod,
    accounts, 
    budgets, 
    categories, 
    transactions,
    recurringBills,
    processRecurringBill,
    getCategoryById, 
    getAccountById,
    getCategorySpendForPeriod,
    extremeSavingsMode,
    extremeSavingsAnalysis
  } = useFinance();

  const { hasPermission } = useUser();
  const canCreateTransactions = hasPermission('canCreateTransactions');
  const canEditTransactions = hasPermission('canEditTransactions');
  const canManageBudgets = hasPermission('canManageBudgets');
  const canViewNetWorth = hasPermission('canViewNetWorth');

  // 1. Alertas urgentes de facturas y recibos vencidos o que vencen hoy
  const urgentBills = useMemo(() => {
    return recurringBills
      .filter(b => b.isActive)
      .map(b => ({
        ...b,
        status: getRecurringStatus(b.nextDueDate, b.reminderDays || 7)
      }))
      .filter(b => b.status.isOverdue || b.status.isToday);
  }, [recurringBills]);

  const overdueBills = urgentBills.filter(b => b.status.isOverdue);
  const todayBills = urgentBills.filter(b => b.status.isToday);

  // 2. Liquidez operativa inmediata (cuentas corrientes + efectivo)
  const availableLiquidity = useMemo(() => {
    return calculateAvailableLiquidity(accounts);
  }, [accounts]);

  // 3. Evolución histórica mensual (Ingresos vs Gastos en 6 meses)
  const monthlyTrendData = useMemo(() => {
    return calculateHistoricalMonthlyTrend(transactions, selectedPeriod, 6);
  }, [transactions, selectedPeriod]);

  // 4. Presupuestos más relevantes (excedidos o cercanos al límite)
  const relevantBudgets = useMemo(() => {
    return getRelevantBudgets(budgets, getCategorySpendForPeriod, getCategoryById, selectedPeriod, 3);
  }, [budgets, getCategorySpendForPeriod, getCategoryById, selectedPeriod]);

  // 5. Gastos por categoría destacados en el período
  const topExpenses: CategorySpendItem[] = useMemo(() => {
    return categories
      .filter(c => c.type === 'expense')
      .map(c => ({
        name: c.name,
        value: getCategorySpendForPeriod(c.id, selectedPeriod),
        color: c.color,
        icon: c.icon,
      }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 4);
  }, [categories, getCategorySpendForPeriod, selectedPeriod]);

  // 6. Lista de transacciones del período ordenadas cronológicamente
  const periodTransactions = useMemo(() => {
    return transactions
      .filter(t => t.date.startsWith(selectedPeriod))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, selectedPeriod]);

  // 7. Lista de períodos disponibles con transacciones para el selector
  const availablePeriods = useMemo(() => {
    const periodSet = new Set<string>();
    transactions.forEach(t => {
      if (t.date && t.date.length >= 7) {
        periodSet.add(t.date.substring(0, 7));
      }
    });
    periodSet.add(selectedPeriod);
    return Array.from(periodSet).sort().reverse();
  }, [transactions, selectedPeriod]);

  // 8. Insights financieros deterministas
  const insights = useMemo(() => {
    return generateDeterministicInsights({
      currentMonthIncome: metrics.currentMonthIncome,
      currentMonthExpense: metrics.currentMonthExpense,
      previousMonthExpense: metrics.previousMonthExpense,
      savingsRate: metrics.savingsRate,
      relevantBudgets,
      recurringBills,
      extremeSavingsMode,
    });
  }, [
    metrics.currentMonthIncome,
    metrics.currentMonthExpense,
    metrics.previousMonthExpense,
    metrics.savingsRate,
    relevantBudgets,
    recurringBills,
    extremeSavingsMode,
  ]);

  return (
    <div className="space-y-6 pb-12" id="finantrack-dashboard">
      
      {/* Banner de Recordatorios de Pagos Vencidos o de Hoy */}
      {urgentBills.length > 0 && (
        <div 
          role="alert"
          aria-live="assertive"
          className={`p-4 sm:p-5 rounded-3xl border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in duration-300 ${
            overdueBills.length > 0
              ? 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800'
              : 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
              overdueBills.length > 0 
                ? 'bg-rose-500 text-white' 
                : 'bg-amber-500 text-white'
            }`}>
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                  {overdueBills.length > 0 
                    ? `Atención: ${overdueBills.length} pago${overdueBills.length > 1 ? 's' : ''} vencido${overdueBills.length > 1 ? 's' : ''}`
                    : `Atención: ${todayBills.length} pago${todayBills.length > 1 ? 's' : ''} que vence${todayBills.length > 1 ? 'n' : ''} hoy`
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
                    {b.name} (<span data-amount={b.amount} className="font-mono-num font-semibold">{formatMoney(b.amount, currency)}</span>)
                  </span>
                ))}
                {urgentBills.length > 2 && ` y ${urgentBills.length - 2} más`} • Total pendiente:{' '}
                <strong data-amount={urgentBills.reduce((acc, b) => acc + b.amount, 0)} className="text-slate-900 dark:text-white font-mono-num font-bold">
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
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all flex items-center gap-1.5 min-h-[44px]"
              >
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Pagar {urgentBills[0].name}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setActiveTab('ajustes')}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white shadow-xs transition-all flex items-center gap-1.5 min-h-[44px]"
            >
              <span>Gestionar Recordatorios</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Banner de Modo de Ahorro Extremo */}
      {extremeSavingsMode && (
        <div 
          role="status"
          className="p-4 sm:p-5 rounded-3xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
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
                Gastos esenciales: <strong data-amount={extremeSavingsAnalysis.essentialSpent} className="text-emerald-600 dark:text-emerald-400 font-mono-num font-bold">{formatMoney(extremeSavingsAnalysis.essentialSpent, currency)}</strong> • Prescindibles: <strong data-amount={extremeSavingsAnalysis.nonEssentialSpent} className="text-amber-600 dark:text-amber-400 font-mono-num font-bold">{formatMoney(extremeSavingsAnalysis.nonEssentialSpent, currency)}</strong> • Potencial ahorro: <strong data-amount={extremeSavingsAnalysis.totalPotentialMonthlySavings} className="text-emerald-600 dark:text-emerald-400 font-mono-num font-bold">+{formatMoney(extremeSavingsAnalysis.totalPotentialMonthlySavings, currency)}/mes</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab('presupuestos')}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition-all flex items-center gap-1.5 min-h-[44px]"
            >
              <span>Ver Plan de Recortes</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* NIVEL 1: Estado Financiero Actual (Patrimonio Neto / Liquidez dominante) */}
      <FinancialHero
        totalNetWorth={metrics.totalNetWorth}
        availableLiquidity={availableLiquidity}
        totalAssets={metrics.totalAssets}
        totalLiabilities={metrics.totalLiabilities}
        currentMonthNet={metrics.currentMonthNet}
        financialHealthScore={metrics.financialHealthScore}
        currency={currency}
        onNavigateToAccounts={() => setActiveTab('patrimonio')}
        canViewNetWorth={canViewNetWorth}
      />

      {/* NIVEL 2 & 3: Selector de Período y Tarjetas de Resumen del Período */}
      <PeriodSummarySection
        selectedPeriod={selectedPeriod}
        onSelectPeriod={setSelectedPeriod}
        availablePeriods={availablePeriods}
        income={metrics.currentMonthIncome}
        expense={metrics.currentMonthExpense}
        net={metrics.currentMonthNet}
        savingsRate={metrics.savingsRate}
        previousMonthExpense={metrics.previousMonthExpense}
        previousMonthIncome={metrics.previousMonthIncome}
        currency={currency}
      />

      {/* NIVEL 8: Acciones Rápidas (+ Gasto, + Ingreso, + Traspaso con Quick Add) */}
      <QuickActionsBar
        onOpenQuickAdd={(type) => onOpenNewTransaction(type)}
        onNavigateTab={setActiveTab}
        canCreateTransactions={canCreateTransactions}
      />

      {/* NIVEL 9: Insights Financieros Deterministas ("A tener en cuenta") */}
      <FinancialInsightsCard
        insights={insights}
        onNavigateTab={setActiveTab}
      />

      {/* NIVEL 4, 5, 6: Cuadrícula de 2 columnas en Desktop / 1 columna en Mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Columna Izquierda: Evolución Financiera y Gastos Destacados */}
        <div className="space-y-6">
          {/* NIVEL 4: Gráfico de Evolución Ingresos vs Gastos */}
          <FinancialEvolutionChart
            trendData={monthlyTrendData}
            currency={currency}
            onNavigateToAnalytics={() => setActiveTab('analisis')}
          />

          {/* NIVEL 6: Gastos Destacados por Categoría */}
          <SpendingHighlights
            topExpenses={topExpenses}
            totalExpense={metrics.currentMonthExpense}
            currency={currency}
            onNavigateToAnalytics={() => setActiveTab('analisis')}
          />
        </div>

        {/* Columna Derecha: Control de Presupuestos y Recordatorios Recurrentes */}
        <div className="space-y-6">
          {/* NIVEL 5: Control de Presupuestos */}
          <BudgetHighlights
            budgets={relevantBudgets}
            currency={currency}
            onNavigateToBudgets={() => setActiveTab('presupuestos')}
            canManageBudgets={canManageBudgets}
          />

          {/* Recordatorios de Pagos y Vencimientos */}
          <RecurringRemindersWidget
            onOpenNewRecurring={() => setActiveTab('ajustes')}
            onOpenSettings={() => setActiveTab('ajustes')}
          />
        </div>

      </div>

      {/* NIVEL 7: Actividad Reciente */}
      <RecentActivityList
        transactions={periodTransactions}
        getCategoryById={getCategoryById}
        getAccountById={getAccountById}
        currency={currency}
        onOpenNewTransaction={() => onOpenNewTransaction('expense')}
        onEditTransaction={onEditTransaction}
        onNavigateToTransactions={() => setActiveTab('movimientos')}
        canCreateTransactions={canCreateTransactions}
        canEditTransactions={canEditTransactions}
      />

    </div>
  );
};
