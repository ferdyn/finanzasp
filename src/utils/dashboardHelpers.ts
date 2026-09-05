import { Account, Budget, Category, RecurringBill, Transaction } from '../types/finance';
import { isLiabilityAccount } from './financialCalculations';
import { getRecurringStatus } from './recurring';
import { formatMoney } from './format';

export interface MonthTrendData {
  period: string; // YYYY-MM
  label: string;  // e.g. "Oct", "Nov", "Dic"
  income: number;
  expense: number;
  net: number;
}

export interface RelevantBudget {
  id: string;
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  spent: number;
  limit: number;
  percent: number;
  isExceeded: boolean;
  isWarning: boolean;
  statusText: string;
}

export interface FinancialInsight {
  id: string;
  type: 'positive' | 'warning' | 'info' | 'alert';
  title: string;
  description: string;
  iconName: string;
  actionLabel?: string;
  actionTab?: string;
}

/**
 * Calcula la liquidez inmediata disponible (cuentas corrientes y efectivo, excluyendo pasivos y depósitos a plazo)
 */
export function calculateAvailableLiquidity(accounts: Account[]): number {
  return accounts
    .filter(acc => !isLiabilityAccount(acc) && (acc.type === 'checking' || (acc.type as string) === 'cash'))
    .reduce((sum, acc) => sum + Math.max(0, acc.balance), 0);
}

/**
 * Calcula la evolución mensual de ingresos vs gastos para los últimos N meses (por defecto 6)
 */
export function calculateHistoricalMonthlyTrend(
  transactions: Transaction[],
  currentPeriod: string, // YYYY-MM
  numMonths: number = 6
): MonthTrendData[] {
  const [yearStr, monthStr] = currentPeriod.split('-');
  const currentYear = parseInt(yearStr, 10) || new Date().getFullYear();
  const currentMonth = parseInt(monthStr, 10) || (new Date().getMonth() + 1);

  const months: string[] = [];
  for (let i = numMonths - 1; i >= 0; i--) {
    const targetDate = new Date(currentYear, currentMonth - 1 - i, 1);
    const y = targetDate.getFullYear();
    const m = String(targetDate.getMonth() + 1).padStart(2, '0');
    months.push(`${y}-${m}`);
  }

  return months.map(period => {
    const [y, m] = period.split('-').map(Number);
    const dateObj = new Date(y, m - 1, 1);
    const label = dateObj.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '');
    const capitalizedLabel = label.charAt(0).toUpperCase() + label.slice(1);

    const txsInMonth = transactions.filter(t => t.date.startsWith(period));
    let income = 0;
    let expense = 0;

    for (const tx of txsInMonth) {
      if (tx.type === 'income') {
        income = Math.round((income + tx.amount) * 100) / 100;
      } else if (tx.type === 'expense') {
        expense = Math.round((expense + tx.amount) * 100) / 100;
      }
      // Las transferencias no suman a ingresos ni gastos
    }

    const net = Math.round((income - expense) * 100) / 100;

    return {
      period,
      label: capitalizedLabel,
      income,
      expense,
      net,
    };
  });
}

/**
 * Filtra y prioriza los presupuestos más relevantes para el Dashboard (excedidos o cercanos al límite)
 */
export function getRelevantBudgets(
  budgets: Budget[],
  getCategorySpendForPeriod: (catId: string, period: string) => number,
  getCategoryById: (id: string) => Category | undefined,
  selectedPeriod: string,
  maxItems: number = 3
): RelevantBudget[] {
  const activeBudgets = budgets.filter(b => b.period === selectedPeriod);

  const processed: RelevantBudget[] = activeBudgets.map(b => {
    const cat = getCategoryById(b.categoryId);
    const spent = getCategorySpendForPeriod(b.categoryId, selectedPeriod);
    const limit = b.monthlyLimit;
    const rawPercent = limit > 0 ? (spent / limit) * 100 : 0;
    const percent = Math.round(rawPercent);
    const isExceeded = spent > limit;
    const threshold = b.alertThreshold || 85;
    const isWarning = !isExceeded && percent >= threshold;

    let statusText = 'Saludable';
    if (isExceeded) {
      statusText = `Excedido por ${formatMoney(spent - limit)}`;
    } else if (isWarning) {
      statusText = `Cerca del límite (${percent}%)`;
    } else {
      statusText = `Disponible: ${formatMoney(Math.max(0, limit - spent))}`;
    }

    return {
      id: b.id,
      categoryId: b.categoryId,
      categoryName: cat?.name || 'Categoría',
      categoryColor: cat?.color || '#6366f1',
      categoryIcon: cat?.icon || 'PieChart',
      spent,
      limit,
      percent,
      isExceeded,
      isWarning,
      statusText,
    };
  });

  // Ordenar: primero los excedidos por mayor exceso, luego los en alerta por mayor %, luego el resto
  processed.sort((a, b) => {
    if (a.isExceeded && !b.isExceeded) return -1;
    if (!a.isExceeded && b.isExceeded) return 1;
    return b.percent - a.percent;
  });

  return processed.slice(0, maxItems);
}

/**
 * Genera insights deterministas, explicables y matemáticamente fundamentados para el usuario
 */
export function generateDeterministicInsights(params: {
  currentMonthIncome: number;
  currentMonthExpense: number;
  previousMonthExpense: number;
  savingsRate: number;
  relevantBudgets: RelevantBudget[];
  recurringBills: RecurringBill[];
  extremeSavingsMode?: boolean;
}): FinancialInsight[] {
  const {
    currentMonthIncome,
    currentMonthExpense,
    previousMonthExpense,
    savingsRate,
    relevantBudgets,
    recurringBills,
    extremeSavingsMode,
  } = params;

  const insights: FinancialInsight[] = [];

  // 1. Alerta de Presupuestos Excedidos o en Peligro
  const exceededBudget = relevantBudgets.find(b => b.isExceeded);
  const warningBudget = relevantBudgets.find(b => b.isWarning);

  if (exceededBudget) {
    insights.push({
      id: 'insight-budget-exceeded',
      type: 'alert',
      title: `Presupuesto de ${exceededBudget.categoryName} superado`,
      description: `Has consumido el ${exceededBudget.percent}% del límite asignado este mes.`,
      iconName: 'AlertTriangle',
      actionLabel: 'Revisar presupuestos',
      actionTab: 'presupuestos',
    });
  } else if (warningBudget) {
    insights.push({
      id: 'insight-budget-warning',
      type: 'warning',
      title: `${warningBudget.categoryName} al ${warningBudget.percent}%`,
      description: `Quedan ${formatMoney(Math.max(0, warningBudget.limit - warningBudget.spent))} antes de alcanzar el tope mensual.`,
      iconName: 'AlertCircle',
      actionLabel: 'Ver detalle',
      actionTab: 'presupuestos',
    });
  }

  // 2. Variación de Gasto vs Mes Anterior
  if (previousMonthExpense > 0 && currentMonthExpense > 0) {
    const diff = currentMonthExpense - previousMonthExpense;
    const diffPercent = Math.round((Math.abs(diff) / previousMonthExpense) * 100);

    if (diff < 0 && diffPercent >= 5) {
      insights.push({
        id: 'insight-expense-reduced',
        type: 'positive',
        title: 'Gasto controlado',
        description: `Llevas un ${diffPercent}% menos de gasto que el mes anterior a esta fecha.`,
        iconName: 'TrendingDown',
      });
    } else if (diff > 0 && diffPercent >= 15) {
      insights.push({
        id: 'insight-expense-increased',
        type: 'warning',
        title: 'Gasto superior al mes pasado',
        description: `Tus gastos han aumentado un ${diffPercent}% en comparación con el mes anterior.`,
        iconName: 'TrendingUp',
        actionLabel: 'Ver análisis',
        actionTab: 'analisis',
      });
    }
  }

  // 3. Tasa de Ahorro
  if (currentMonthIncome > 0) {
    if (savingsRate >= 20) {
      insights.push({
        id: 'insight-savings-healthy',
        type: 'positive',
        title: `Tasa de ahorro saludable (${savingsRate}%)`,
        description: 'Estás cumpliendo o superando la meta de ahorro recomendada del 20%.',
        iconName: 'CheckCircle2',
      });
    } else if (savingsRate > 0 && savingsRate < 10) {
      insights.push({
        id: 'insight-savings-low',
        type: 'info',
        title: `Ahorro mensual modesto (${savingsRate}%)`,
        description: 'Tu tasa de ahorro está por debajo del 10%. Intenta recortar gastos no esenciales.',
        iconName: 'PiggyBank',
        actionLabel: 'Fijar metas',
        actionTab: 'metas',
      });
    }
  }

  // 4. Recordatorios Próximos (vencimientos a 7 días o menos)
  const upcomingBills = recurringBills
    .filter(b => b.isActive)
    .map(b => ({
      bill: b,
      status: getRecurringStatus(b.nextDueDate, b.reminderDays || 7),
    }))
    .filter(b => b.status.daysLeft <= 3 && !b.status.isOverdue);

  if (upcomingBills.length > 0 && insights.length < 3) {
    const nextBill = upcomingBills[0];
    insights.push({
      id: 'insight-upcoming-bill',
      type: 'info',
      title: `Próximo recibo: ${nextBill.bill.name}`,
      description: `Vence ${nextBill.status.isToday ? 'hoy' : `en ${nextBill.status.daysLeft} días`} (${formatMoney(nextBill.bill.amount)}).`,
      iconName: 'Clock',
      actionLabel: 'Ver ajustes',
      actionTab: 'ajustes',
    });
  }

  // 5. Modo de Ahorro Extremo
  if (extremeSavingsMode && insights.length < 3) {
    insights.push({
      id: 'insight-extreme-savings',
      type: 'warning',
      title: 'Modo de Ahorro Extremo activo',
      description: 'Se están priorizando únicamente los gastos catalogados como esenciales.',
      iconName: 'Zap',
      actionLabel: 'Ver plan',
      actionTab: 'presupuestos',
    });
  }

  return insights.slice(0, 3);
}
