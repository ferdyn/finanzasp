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
