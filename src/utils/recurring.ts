import { RecurringBill, Account } from '../types/finance';

export interface RecurringStatusInfo {
  status: 'overdue' | 'today' | 'urgent' | 'upcoming' | 'future';
  daysLeft: number;
  label: string;
  shortLabel: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  dotColor: string;
  isApproaching: boolean;
  isOverdue: boolean;
  isToday: boolean;
}

/**
 * Calcula la diferencia en días entre una fecha dada (YYYY-MM-DD) y el día de hoy (medianoche local).
 */
export function getDaysUntil(dateString: string): number {
  if (!dateString) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [year, month, day] = dateString.split('-').map(Number);
  const targetDate = new Date(year, month - 1, day);
  targetDate.setHours(0, 0, 0, 0);

  const diffTime = targetDate.getTime() - today.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Obtiene el estado detallado de vencimiento y estilos visuales para un pago recurrente.
 */
export function getRecurringStatus(nextDueDate: string, alertThresholdDays = 7): RecurringStatusInfo {
  const daysLeft = getDaysUntil(nextDueDate);

  if (daysLeft < 0) {
    const overdueDays = Math.abs(daysLeft);
    return {
      status: 'overdue',
      daysLeft,
      label: overdueDays === 1 ? '¡Vencido hace 1 día!' : `¡Vencido hace ${overdueDays} días!`,
      shortLabel: `Vencido (${overdueDays}d)`,
      badgeBg: 'bg-rose-50 dark:bg-rose-950/60',
      badgeText: 'text-rose-700 dark:text-rose-300',
      badgeBorder: 'border-rose-300 dark:border-rose-800',
      dotColor: 'bg-rose-500',
      isApproaching: true,
      isOverdue: true,
      isToday: false,
    };
  }

  if (daysLeft === 0) {
    return {
      status: 'today',
      daysLeft,
      label: '¡Vence hoy!',
      shortLabel: 'Vence hoy',
      badgeBg: 'bg-amber-50 dark:bg-amber-950/60',
      badgeText: 'text-amber-800 dark:text-amber-300',
      badgeBorder: 'border-amber-300 dark:border-amber-700',
      dotColor: 'bg-amber-500',
      isApproaching: true,
      isOverdue: false,
      isToday: true,
    };
  }

  if (daysLeft === 1) {
    return {
      status: 'urgent',
      daysLeft,
      label: 'Vence mañana',
      shortLabel: 'Mañana',
      badgeBg: 'bg-orange-50 dark:bg-orange-950/60',
      badgeText: 'text-orange-800 dark:text-orange-300',
      badgeBorder: 'border-orange-200 dark:border-orange-800',
      dotColor: 'bg-orange-500',
      isApproaching: true,
      isOverdue: false,
      isToday: false,
    };
  }

  if (daysLeft <= 3) {
    return {
      status: 'urgent',
      daysLeft,
      label: `Vence en ${daysLeft} días`,
      shortLabel: `En ${daysLeft} días`,
      badgeBg: 'bg-amber-50/80 dark:bg-amber-950/40',
      badgeText: 'text-amber-700 dark:text-amber-300',
      badgeBorder: 'border-amber-200 dark:border-amber-800/80',
      dotColor: 'bg-amber-400',
      isApproaching: true,
      isOverdue: false,
      isToday: false,
    };
  }

  if (daysLeft <= alertThresholdDays) {
    return {
      status: 'upcoming',
      daysLeft,
      label: `Vence en ${daysLeft} días`,
      shortLabel: `En ${daysLeft} días`,
      badgeBg: 'bg-blue-50 dark:bg-blue-950/50',
      badgeText: 'text-blue-700 dark:text-blue-300',
      badgeBorder: 'border-blue-200 dark:border-blue-800',
      dotColor: 'bg-blue-500',
      isApproaching: true,
      isOverdue: false,
      isToday: false,
    };
  }

  return {
    status: 'future',
    daysLeft,
    label: `Próximo: en ${daysLeft} días`,
    shortLabel: `En ${daysLeft} días`,
    badgeBg: 'bg-slate-50 dark:bg-slate-800/80',
    badgeText: 'text-slate-600 dark:text-slate-400',
    badgeBorder: 'border-slate-200 dark:border-slate-700',
    dotColor: 'bg-slate-400',
    isApproaching: false,
    isOverdue: false,
    isToday: false,
  };
}

/**
 * Calcula la siguiente fecha según la frecuencia.
 */
export function calculateNextDueDate(currentDateStr: string, frequency: RecurringBill['frequency']): string {
  const [year, month, day] = (currentDateStr || new Date().toISOString().split('T')[0]).split('-').map(Number);
  const date = new Date(year, month - 1, day);

  if (frequency === 'weekly') {
    date.setDate(date.getDate() + 7);
  } else if (frequency === 'monthly') {
    date.setMonth(date.getMonth() + 1);
  } else if (frequency === 'bimonthly') {
    date.setMonth(date.getMonth() + 2);
  } else if (frequency === 'yearly') {
    date.setFullYear(date.getFullYear() + 1);
  }

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Pospone una fecha en un número dado de días.
 */
export function postponeDateByDays(currentDateStr: string, days: number): string {
  const [year, month, day] = (currentDateStr || new Date().toISOString().split('T')[0]).split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Texto legible en español para la frecuencia.
 */
export function formatFrequency(frequency: RecurringBill['frequency']): string {
  switch (frequency) {
    case 'weekly':
      return 'Semanal';
    case 'monthly':
      return 'Mensual';
    case 'bimonthly':
      return 'Bimestral';
    case 'yearly':
      return 'Anual';
    default:
      return frequency;
  }
}

/**
 * Verifica si una cuenta tiene saldo suficiente para un gasto recurrente.
 */
export function checkAccountBalanceSufficiency(bill: RecurringBill, account?: Account): {
  isSufficient: boolean;
  difference: number;
} {
  if (!account || bill.type !== 'expense') {
    return { isSufficient: true, difference: 0 };
  }

  const isSufficient = account.balance >= bill.amount;
  const difference = account.balance - bill.amount;
  return { isSufficient, difference };
}
