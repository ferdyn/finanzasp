import { CurrencyCode, CurrencyConfig } from '../types/finance';

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  EUR: { code: 'EUR', symbol: '€', name: 'Euro (EUR)', position: 'after', decimals: 2 },
  USD: { code: 'USD', symbol: '$', name: 'Dólar Estadounidense (USD)', position: 'before', decimals: 2 },
  MXN: { code: 'MXN', symbol: '$', name: 'Peso Mexicano (MXN)', position: 'before', decimals: 2 },
  COP: { code: 'COP', symbol: '$', name: 'Peso Colombiano (COP)', position: 'before', decimals: 0 },
  ARS: { code: 'ARS', symbol: '$', name: 'Peso Argentino (ARS)', position: 'before', decimals: 2 },
  CLP: { code: 'CLP', symbol: '$', name: 'Peso Chileno (CLP)', position: 'before', decimals: 0 },
  PEN: { code: 'PEN', symbol: 'S/', name: 'Sol Peruano (PEN)', position: 'before', decimals: 2 },
  GBP: { code: 'GBP', symbol: '£', name: 'Libra Esterlina (GBP)', position: 'before', decimals: 2 },
};

let _globalPrivacyMode = false;

export function setGlobalPrivacyMode(enabled: boolean): void {
  _globalPrivacyMode = enabled;
}

export function getGlobalPrivacyMode(): boolean {
  return _globalPrivacyMode;
}

export function formatMoney(amount: number, currencyCode: CurrencyCode = 'EUR'): string {
  const config = CURRENCIES[currencyCode] || CURRENCIES.EUR;
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  const formattedNum = new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: config.decimals,
    maximumFractionDigits: config.decimals,
  }).format(absAmount);

  const withSymbol = config.position === 'before'
    ? `${config.symbol}${formattedNum}`
    : `${formattedNum} ${config.symbol}`;

  return isNegative ? `-${withSymbol}` : withSymbol;
}

/**
 * Formatea un monto asegurando signo explícito (+ / -) para accesibilidad daltónica
 * y consistencia visual en balances e informes financieros (Regla UX/UI [36†L902-L909])
 */
export function formatMoneySigned(amount: number, currencyCode: CurrencyCode = 'EUR'): string {
  if (amount > 0) {
    return `+${formatMoney(amount, currencyCode)}`;
  }
  if (amount < 0) {
    return formatMoney(amount, currencyCode);
  }
  return formatMoney(0, currencyCode);
}

export function formatDate(dateString: string, format: 'short' | 'medium' | 'long' | 'relative' = 'medium'): string {
  if (!dateString) return '';
  const date = new Date(dateString + 'T12:00:00');
  
  if (isNaN(date.getTime())) return dateString;

  if (format === 'short') {
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
  }

  if (format === 'medium') {
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  if (format === 'long') {
    return date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  if (format === 'relative') {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const diffDays = Math.round((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoy';
    if (diffDays === -1) return 'Ayer';
    if (diffDays === 1) return 'Mañana';
    if (diffDays > -7 && diffDays < 0) {
      return date.toLocaleDateString('es-ES', { weekday: 'long' });
    }
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  }

  return date.toLocaleDateString('es-ES');
}

export function getCurrentMonthPeriod(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function formatMonthPeriod(period: string): string {
  const [year, month] = period.split('-').map(Number);
  if (!year || !month) return period;
  const date = new Date(year, month - 1, 1);
  const monthName = date.toLocaleDateString('es-ES', { month: 'long' });
  return `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`;
}

export function formatMonthPeriodShort(period: string): string {
  const [year, month] = period.split('-').map(Number);
  if (!year || !month) return period;
  const date = new Date(year, month - 1, 1);
  const monthName = date.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '');
  return `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`;
}

export function getNextMonthPeriod(period: string): string {
  const [year, month] = period.split('-').map(Number);
  if (!year || !month) return period;
  const nextDate = new Date(year, month, 1);
  const nextYear = nextDate.getFullYear();
  const nextMonth = String(nextDate.getMonth() + 1).padStart(2, '0');
  return `${nextYear}-${nextMonth}`;
}

export function getNextMonthFormatted(period: string): string {
  const [year, month] = period.split('-').map(Number);
  if (!year || !month) return period;
  const nextDate = new Date(year, month, 1);
  const monthName = nextDate.toLocaleDateString('es-ES', { month: 'long' });
  return `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${nextDate.getFullYear()}`;
}
