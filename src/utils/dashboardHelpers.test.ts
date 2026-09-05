import { describe, it, expect } from 'vitest';
import {
  calculateAvailableLiquidity,
  calculateHistoricalMonthlyTrend,
  getRelevantBudgets,
  generateDeterministicInsights,
} from './dashboardHelpers';
import { Account, Budget, Category, RecurringBill, Transaction } from '../types/finance';

describe('Dashboard Helpers — Pure Calculations & Insights', () => {
  const mockAccounts: Account[] = [
    { id: 'acc-1', name: 'Cuenta Corriente', type: 'checking', balance: 2500, initialBalance: 2500, currency: 'EUR', color: '#10b981', icon: 'Landmark' },
    { id: 'acc-2', name: 'Efectivo', type: 'cash', balance: 350, initialBalance: 350, currency: 'EUR', color: '#3b82f6', icon: 'Wallet' },
    { id: 'acc-3', name: 'Inversión Fondo', type: 'investment', balance: 15000, initialBalance: 15000, currency: 'EUR', color: '#8b5cf6', icon: 'TrendingUp' },
    { id: 'acc-4', name: 'Tarjeta Crédito', type: 'credit', balance: 600, initialBalance: 600, currency: 'EUR', color: '#f43f5e', icon: 'CreditCard' },
  ];

  describe('calculateAvailableLiquidity', () => {
    it('sums only checking and cash accounts', () => {
      const liquidity = calculateAvailableLiquidity(mockAccounts);
      expect(liquidity).toBe(2850); // 2500 + 350
    });

    it('returns 0 if no cash or checking accounts exist', () => {
      const accounts: Account[] = [
        { id: 'acc-inv', name: 'Inversión', type: 'investment', balance: 5000, initialBalance: 5000, currency: 'EUR', color: '#8b5cf6', icon: 'TrendingUp' },
      ];
      expect(calculateAvailableLiquidity(accounts)).toBe(0);
    });
  });

  describe('calculateHistoricalMonthlyTrend', () => {
    const mockTxs: Transaction[] = [
      { id: 'tx-1', type: 'income', amount: 3000, date: '2026-03-05', categoryId: 'cat-inc', accountId: 'acc-1' },
      { id: 'tx-2', type: 'expense', amount: 1200, date: '2026-03-10', categoryId: 'cat-exp', accountId: 'acc-1' },
      { id: 'tx-3', type: 'transfer', amount: 500, date: '2026-03-12', categoryId: 'cat-exp', accountId: 'acc-1', toAccountId: 'acc-2' },
      { id: 'tx-4', type: 'income', amount: 2800, date: '2026-02-01', categoryId: 'cat-inc', accountId: 'acc-1' },
      { id: 'tx-5', type: 'expense', amount: 1500, date: '2026-02-15', categoryId: 'cat-exp', accountId: 'acc-1' },
    ];

    it('generates accurate 6-month historical data without counting transfers as income or expense', () => {
      const trend = calculateHistoricalMonthlyTrend(mockTxs, '2026-03', 6);
      expect(trend).toHaveLength(6);

      const march = trend.find(m => m.period === '2026-03');
      expect(march).toBeDefined();
      expect(march?.income).toBe(3000);
      expect(march?.expense).toBe(1200);
      expect(march?.net).toBe(1800);

      const feb = trend.find(m => m.period === '2026-02');
      expect(feb).toBeDefined();
      expect(feb?.income).toBe(2800);
      expect(feb?.expense).toBe(1500);
      expect(feb?.net).toBe(1300);
    });
  });

  describe('getRelevantBudgets', () => {
    const mockBudgets: Budget[] = [
      { id: 'b-1', categoryId: 'cat-food', period: '2026-03', monthlyLimit: 400, alertThreshold: 80 },
      { id: 'b-2', categoryId: 'cat-transport', period: '2026-03', monthlyLimit: 150, alertThreshold: 80 },
      { id: 'b-3', categoryId: 'cat-leisure', period: '2026-03', monthlyLimit: 200, alertThreshold: 80 },
    ];

    const mockCategories: Category[] = [
      { id: 'cat-food', name: 'Alimentación', icon: 'Utensils', color: '#10b981', type: 'expense' },
      { id: 'cat-transport', name: 'Transporte', icon: 'Car', color: '#3b82f6', type: 'expense' },
      { id: 'cat-leisure', name: 'Ocio', icon: 'Film', color: '#f59e0b', type: 'expense' },
    ];

    it('prioritizes exceeded budgets first, then warning budgets', () => {
      // Food: 450/400 (exceeded), Transport: 130/150 (87% - warning), Leisure: 50/200 (25% - ok)
      const spendMap: Record<string, number> = {
        'cat-food': 450,
        'cat-transport': 130,
        'cat-leisure': 50,
      };

      const result = getRelevantBudgets(
        mockBudgets,
        (catId) => spendMap[catId] || 0,
        (id) => mockCategories.find(c => c.id === id),
        '2026-03',
        3
      );

      expect(result).toHaveLength(3);
      expect(result[0].categoryId).toBe('cat-food');
      expect(result[0].isExceeded).toBe(true);
      expect(result[1].categoryId).toBe('cat-transport');
      expect(result[1].isWarning).toBe(true);
      expect(result[2].categoryId).toBe('cat-leisure');
      expect(result[2].isExceeded).toBe(false);
      expect(result[2].isWarning).toBe(false);
    });
  });

  describe('generateDeterministicInsights', () => {
    it('produces actionable deterministic insights based on numbers', () => {
      const insights = generateDeterministicInsights({
        currentMonthIncome: 3000,
        currentMonthExpense: 1800,
        previousMonthExpense: 2200,
        savingsRate: 40,
        relevantBudgets: [
          {
            id: 'b-1',
            categoryId: 'cat-1',
            categoryName: 'Restaurantes',
            categoryColor: '#ef4444',
            categoryIcon: 'Utensils',
            spent: 250,
            limit: 200,
            percent: 125,
            isExceeded: true,
            isWarning: false,
            statusText: 'Excedido',
          },
        ],
        recurringBills: [],
        extremeSavingsMode: false,
      });

      expect(insights.length).toBeGreaterThan(0);
      expect(insights[0].type).toBe('alert');
      expect(insights[0].title).toContain('Restaurantes');
    });
  });
});
