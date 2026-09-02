export type TransactionType = 'expense' | 'income' | 'transfer';

export type AccountType = 'checking' | 'savings' | 'credit' | 'investment' | 'cash' | 'crypto' | 'debt';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'expense' | 'income';
  isDefault?: boolean;
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
}

export interface Budget {
  id: string;
  categoryId: string;
  monthlyLimit: number;
  period: string; // YYYY-MM
  alertThreshold?: number; // % (default 85)
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

export interface RecurringBill {
  id: string;
  name: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  accountId: string;
  frequency: 'weekly' | 'monthly' | 'bimonthly' | 'yearly';
  nextDueDate: string;
  isActive: boolean;
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
