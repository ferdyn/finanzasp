export type TransactionType = 'expense' | 'income' | 'transfer';

export type AccountType = 'checking' | 'savings' | 'credit' | 'investment' | 'cash' | 'crypto' | 'debt';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'expense' | 'income';
  isDefault?: boolean;
  isEssential?: boolean; // Para Modo de Ahorro Extremo (Gasto básico e imprescindible)
}

export interface BudgetCutSuggestion {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  currentLimit: number;
  currentSpent: number;
  suggestedLimit: number;
  cutAmount: number;
  cutPercent: number;
  reason: string;
  priority: 'urgent' | 'recommended' | 'optional';
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  color: string;
  icon: string;
  institution?: string;
  accountNumber?: string;
  isHidden?: boolean;
  creditLimit?: number; // Para tarjetas de crédito
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  accountId: string;
  toAccountId?: string; // Para transferencias
  date: string; // ISO format YYYY-MM-DD
  note?: string;
  tags?: string[];
  isRecurring?: boolean;
  recurringFrequency?: 'monthly' | 'weekly' | 'yearly';
  createdByUserId?: string;
  createdByName?: string;
}

export interface Budget {
  id: string;
  categoryId: string;
  monthlyLimit: number;
  period: string; // YYYY-MM
  alertThreshold?: number; // % (default 85)
  autoRenew?: boolean; // Reinicio automático mensual (se reactiva el día 1 de cada mes con contador a 0)
  lastRenewedAt?: string; // Fecha de renovación ISO
}

export interface AutoBudgetRule {
  categoryId: string;
  monthlyLimit: number;
  alertThreshold: number;
  enabled: boolean;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  color: string;
  icon: string;
  category?: string;
  notes?: string;
}

export type RecurringFrequency = 'weekly' | 'biweekly' | 'monthly' | 'bimonthly' | 'quarterly' | 'semiannual' | 'yearly';

export interface RecurringBill {
  id: string;
  name: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  accountId: string;
  frequency: RecurringFrequency;
  nextDueDate: string;
  isActive: boolean;
  reminderDays?: number;
  notes?: string;
}

export interface TransactionTemplate {
  id: string;
  name: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  accountId: string;
  toAccountId?: string;
  note?: string;
  tags?: string[];
  isRecurring?: boolean;
}

export type CurrencyCode = 'EUR' | 'USD' | 'MXN' | 'COP' | 'ARS' | 'CLP' | 'PEN' | 'GBP';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  position: 'before' | 'after';
  decimals: number;
}
