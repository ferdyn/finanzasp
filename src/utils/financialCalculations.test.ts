import { describe, it, expect } from 'vitest';
import {
  toCents,
  fromCents,
  addMoney,
  subtractMoney,
  multiplyMoney,
  divideMoney,
  calculateAccountBalance,
  calculateNetWorth,
  calculateBudgetProgress,
  calculateSavingsRate,
  calculateGoalProgress,
  calculatePeriodMetrics,
  calculateTransactionImpact,
  validateTransfer,
  applyTransactionToAccounts,
  applyTransactionUpdateToAccounts,
  applyTransactionDeletionToAccounts,
  calculateNetWorthByCurrency,
  convertCurrency,
  auditAccountIntegrity,
  isLiabilityAccount,
  canDeleteAccount,
} from './financialCalculations';
import { Account, Transaction, Budget, SavingsGoal } from '../types/finance';

describe('Financial Calculations — Pure Math & Decimal Precision', () => {
  it('prevents floating point errors with cent conversion (0.1 + 0.2 = 0.30)', () => {
    // In native JS: 0.1 + 0.2 === 0.30000000000000004
    expect(0.1 + 0.2).not.toBe(0.3);
    expect(addMoney(0.1, 0.2)).toBe(0.3);
  });

  it('handles subtractions and negative decimals accurately', () => {
    expect(subtractMoney(100.1, 0.2)).toBe(99.9);
    expect(subtractMoney(50, 100)).toBe(-50);
  });

  it('multiplies and divides with proper cent rounding', () => {
    expect(multiplyMoney(10.55, 1.21)).toBe(12.77); // IVA 21%
    expect(divideMoney(100, 3)).toBe(33.33);
    expect(divideMoney(100, 0)).toBe(0); // Zero division safe
  });
});

describe('calculateAccountBalance', () => {
  const baseAccount: Account = {
    id: 'acc-1',
    name: 'Checking Account',
    type: 'checking',
    balance: 1000,
    initialBalance: 1000,
    currency: 'EUR',
    color: '#004481',
    icon: 'Landmark',
  };

  it('calculates balance with income, expense, and transfers', () => {
    const transactions: Transaction[] = [
      {
        id: 'tx-1',
        amount: 250.5,
        type: 'income',
        categoryId: 'cat-salary',
        accountId: 'acc-1',
        date: '2026-03-01',
      },
      {
        id: 'tx-2',
        amount: 100.25,
        type: 'expense',
        categoryId: 'cat-food',
        accountId: 'acc-1',
        date: '2026-03-02',
      },
      {
        id: 'tx-3',
        amount: 50.0,
        type: 'transfer',
        categoryId: 'cat-transfer',
        accountId: 'acc-1', // outgoing transfer
        toAccountId: 'acc-2',
        date: '2026-03-03',
      },
      {
        id: 'tx-4',
        amount: 30.0,
        type: 'transfer',
        categoryId: 'cat-transfer',
        accountId: 'acc-2',
        toAccountId: 'acc-1', // incoming transfer
        date: '2026-03-04',
      },
    ];

    // Initial: 1000 + 250.50 - 100.25 - 50.00 + 30.00 = 1130.25
    const balance = calculateAccountBalance(baseAccount, transactions);
    expect(balance).toBe(1130.25);
  });

  it('ignores self-transfers to the same account', () => {
    const transactions: Transaction[] = [
      {
        id: 'tx-self',
        amount: 100,
        type: 'transfer',
        categoryId: 'cat-transfer',
        accountId: 'acc-1',
        toAccountId: 'acc-1', // Same account transfer
        date: '2026-03-01',
      },
    ];

    const balance = calculateAccountBalance(baseAccount, transactions);
    expect(balance).toBe(1000);
  });
});

describe('calculateNetWorth', () => {
  it('calculates total assets, liabilities, and net worth correctly', () => {
    const accounts: Account[] = [
      {
        id: 'acc-1',
        name: 'Checking',
        type: 'checking',
        balance: 3450.8,
        currency: 'EUR',
        color: '#004481',
        icon: 'Landmark',
      },
      {
        id: 'acc-2',
        name: 'Savings',
        type: 'savings',
        balance: 12500.0,
        currency: 'EUR',
        color: '#10b981',
        icon: 'PiggyBank',
      },
      {
        id: 'acc-3',
        name: 'Credit Card',
        type: 'credit',
        balance: -340.25, // Debt / Liability
        currency: 'EUR',
        color: '#f59e0b',
        icon: 'CreditCard',
      },
      {
        id: 'acc-4',
        name: 'Loan',
        type: 'debt',
        balance: -1500.0, // Debt / Liability
        currency: 'EUR',
        color: '#ef4444',
        icon: 'Receipt',
      },
    ];

    const result = calculateNetWorth(accounts);
    // Assets: 3450.80 + 12500.00 = 15950.80
    expect(result.totalAssets).toBe(15950.8);
    // Liabilities: 340.25 + 1500.00 = 1840.25
    expect(result.totalLiabilities).toBe(1840.25);
    // Net Worth: 15950.80 - 1840.25 = 14110.55
    expect(result.totalNetWorth).toBe(14110.55);
  });
});

describe('calculateBudgetProgress', () => {
  const sampleBudget: Budget = {
    id: 'b-1',
    categoryId: 'cat-groceries',
    monthlyLimit: 500,
    period: '2026-03',
  };

  it('calculates progress when spend is below limit', () => {
    const transactions: Transaction[] = [
      {
        id: 'tx-1',
        amount: 150,
        type: 'expense',
        categoryId: 'cat-groceries',
        accountId: 'acc-1',
        date: '2026-03-05',
      },
      {
        id: 'tx-2',
        amount: 100,
        type: 'expense',
        categoryId: 'cat-groceries',
        accountId: 'acc-1',
        date: '2026-03-12',
      },
      // Different category, should not count
      {
        id: 'tx-3',
        amount: 80,
        type: 'expense',
        categoryId: 'cat-entertainment',
        accountId: 'acc-1',
        date: '2026-03-15',
      },
      // Different month, should not count
      {
        id: 'tx-4',
        amount: 200,
        type: 'expense',
        categoryId: 'cat-groceries',
        accountId: 'acc-1',
        date: '2026-02-28',
      },
    ];

    const progress = calculateBudgetProgress(sampleBudget, transactions);
    expect(progress.spent).toBe(250);
    expect(progress.remaining).toBe(250);
    expect(progress.percentage).toBe(50);
    expect(progress.isOverBudget).toBe(false);
  });

  it('handles over-budget state gracefully', () => {
    const transactions: Transaction[] = [
      {
        id: 'tx-1',
        amount: 600,
        type: 'expense',
        categoryId: 'cat-groceries',
        accountId: 'acc-1',
        date: '2026-03-10',
      },
    ];

    const progress = calculateBudgetProgress(sampleBudget, transactions);
    expect(progress.spent).toBe(600);
    expect(progress.remaining).toBe(0);
    expect(progress.percentage).toBe(120);
    expect(progress.isOverBudget).toBe(true);
  });
});

describe('calculateSavingsRate', () => {
  it('calculates positive savings rate correctly', () => {
    const { netSavings, savingsRate } = calculateSavingsRate(3000, 2100);
    expect(netSavings).toBe(900);
    expect(savingsRate).toBe(30); // (900 / 3000) * 100 = 30%
  });

  it('handles zero or negative income without division by zero', () => {
    const res1 = calculateSavingsRate(0, 500);
    expect(res1.savingsRate).toBe(0);

    const res2 = calculateSavingsRate(-100, 500);
    expect(res2.savingsRate).toBe(0);
  });
});

describe('calculateGoalProgress', () => {
  it('computes goal percentage and completion', () => {
    const goal: SavingsGoal = {
      id: 'g-1',
      name: 'Vacation',
      targetAmount: 2000,
      currentAmount: 1500,
      color: '#10b981',
      icon: 'Plane',
    };

    const result = calculateGoalProgress(goal);
    expect(result.percentage).toBe(75);
    expect(result.remainingAmount).toBe(500);
    expect(result.isCompleted).toBe(false);
  });

  it('caps percentage at 100% when goal is surpassed', () => {
    const goal: SavingsGoal = {
      id: 'g-2',
      name: 'Emergency',
      targetAmount: 1000,
      currentAmount: 1200,
      color: '#10b981',
      icon: 'Shield',
    };

    const result = calculateGoalProgress(goal);
    expect(result.percentage).toBe(100);
    expect(result.remainingAmount).toBe(0);
    expect(result.isCompleted).toBe(true);
  });
});

describe('validateTransfer', () => {
  const accounts: Account[] = [
    { id: 'acc-1', name: 'A', type: 'checking', balance: 500, currency: 'EUR', color: '', icon: '' },
    { id: 'acc-2', name: 'B', type: 'savings', balance: 1000, currency: 'EUR', color: '', icon: '' },
  ];

  it('rejects transfer with same origin and destination', () => {
    const res = validateTransfer('acc-1', 'acc-1', 100, accounts);
    expect(res.isValid).toBe(false);
    expect(res.error).toContain('diferentes');
  });

  it('rejects transfer with invalid amount', () => {
    const res = validateTransfer('acc-1', 'acc-2', 0, accounts);
    expect(res.isValid).toBe(false);
  });

  it('accepts valid distinct accounts and positive amount', () => {
    const res = validateTransfer('acc-1', 'acc-2', 150, accounts);
    expect(res.isValid).toBe(true);
  });
});

describe('Atomic Transaction Impact — Add, Edit, Delete Cycle', () => {
  const initialAccounts: Account[] = [
    { id: 'acc-1', name: 'Main', type: 'checking', balance: 1000, currency: 'EUR', color: '', icon: '' },
    { id: 'acc-2', name: 'Savings', type: 'savings', balance: 500, currency: 'EUR', color: '', icon: '' },
  ];

  it('maintains integrity across Income Add -> Edit -> Delete cycle', () => {
    // 1. Add income +100
    const tx1: Transaction = {
      id: 'tx-1',
      amount: 100,
      type: 'income',
      categoryId: 'salary',
      accountId: 'acc-1',
      date: '2026-03-01',
    };
    const afterAdd = applyTransactionToAccounts(initialAccounts, tx1);
    expect(afterAdd.find(a => a.id === 'acc-1')?.balance).toBe(1100);

    // 2. Edit +100 -> +250 (incremental delta must be +150, ending at 1250, NOT 1350)
    const tx2: Transaction = {
      ...tx1,
      amount: 250,
    };
    const afterEdit = applyTransactionUpdateToAccounts(afterAdd, tx1, tx2);
    expect(afterEdit.find(a => a.id === 'acc-1')?.balance).toBe(1250);

    // 3. Delete tx2 -> must revert cleanly to exactly 1000
    const afterDelete = applyTransactionDeletionToAccounts(afterEdit, tx2);
    expect(afterDelete.find(a => a.id === 'acc-1')?.balance).toBe(1000);
  });

  it('maintains integrity across Transfer Add -> Edit -> Delete cycle', () => {
    // 1. Add transfer 200 from acc-1 to acc-2
    const transfer1: Transaction = {
      id: 'tx-t1',
      amount: 200,
      type: 'transfer',
      categoryId: 'transfer',
      accountId: 'acc-1',
      toAccountId: 'acc-2',
      date: '2026-03-01',
    };
    const afterAdd = applyTransactionToAccounts(initialAccounts, transfer1);
    expect(afterAdd.find(a => a.id === 'acc-1')?.balance).toBe(800);
    expect(afterAdd.find(a => a.id === 'acc-2')?.balance).toBe(700);

    // 2. Edit transfer 200 -> 300
    const transfer2: Transaction = {
      ...transfer1,
      amount: 300,
    };
    const afterEdit = applyTransactionUpdateToAccounts(afterAdd, transfer1, transfer2);
    expect(afterEdit.find(a => a.id === 'acc-1')?.balance).toBe(700);
    expect(afterEdit.find(a => a.id === 'acc-2')?.balance).toBe(800);

    // 3. Delete transfer -> both accounts must revert to initial values
    const afterDelete = applyTransactionDeletionToAccounts(afterEdit, transfer2);
    expect(afterDelete.find(a => a.id === 'acc-1')?.balance).toBe(1000);
    expect(afterDelete.find(a => a.id === 'acc-2')?.balance).toBe(500);
  });
});

describe('Multi-Currency Handling — Distinct Currencies & Conversion', () => {
  const multiCurrencyAccounts: Account[] = [
    { id: 'acc-eur-1', name: 'Banco Santander', type: 'checking', balance: 2500, currency: 'EUR', color: '', icon: '' },
    { id: 'acc-usd-1', name: 'Chase Bank', type: 'savings', balance: 1500, currency: 'USD', color: '', icon: '' },
    { id: 'acc-mxn-1', name: 'BBVA México', type: 'checking', balance: 20000, currency: 'MXN', color: '', icon: '' },
    { id: 'acc-usd-debt', name: 'US Credit Card', type: 'credit', balance: -200, currency: 'USD', color: '', icon: '' },
  ];

  it('separates net worth by currency without blind mixing (100 EUR + 100 USD != 200 EUR)', () => {
    const result = calculateNetWorthByCurrency(multiCurrencyAccounts);

    expect(result['EUR']).toBeDefined();
    expect(result['EUR'].totalAssets).toBe(2500);
    expect(result['EUR'].totalNetWorth).toBe(2500);

    expect(result['USD']).toBeDefined();
    expect(result['USD'].totalAssets).toBe(1500);
    expect(result['USD'].totalLiabilities).toBe(200);
    expect(result['USD'].totalNetWorth).toBe(1300);

    expect(result['MXN']).toBeDefined();
    expect(result['MXN'].totalAssets).toBe(20000);
    expect(result['MXN'].totalNetWorth).toBe(20000);
  });

  it('converts currencies transparently with reference exchange rates', () => {
    // 108 USD = 100 EUR (rate 1.08)
    const convertedToEUR = convertCurrency(108, 'USD', 'EUR');
    expect(convertedToEUR).toBe(100);

    // Identity
    expect(convertCurrency(500, 'EUR', 'EUR')).toBe(500);
  });
});

describe('auditAccountIntegrity — Ledger Consistency Checks', () => {
  it('detects no discrepancies when accounts match transaction ledger', () => {
    const account: Account = {
      id: 'acc-1',
      name: 'Main',
      type: 'checking',
      balance: 1200,
      initialBalance: 1000,
      currency: 'EUR',
      color: '',
      icon: '',
    };
    const transactions: Transaction[] = [
      { id: 'tx-1', amount: 200, type: 'income', categoryId: 'cat', accountId: 'acc-1', date: '2026-03-01' },
    ];

    const audit = auditAccountIntegrity([account], transactions);
    expect(audit.isHealthy).toBe(true);
    expect(audit.discrepancies.length).toBe(0);
  });

  it('detects discrepancies when account balance deviates from transaction ledger', () => {
    const account: Account = {
      id: 'acc-1',
      name: 'Main',
      type: 'checking',
      balance: 1500, // Discrepancy! (Expected 1000 + 200 = 1200)
      initialBalance: 1000,
      currency: 'EUR',
      color: '',
      icon: '',
    };
    const transactions: Transaction[] = [
      { id: 'tx-1', amount: 200, type: 'income', categoryId: 'cat', accountId: 'acc-1', date: '2026-03-01' },
    ];

    const audit = auditAccountIntegrity([account], transactions);
    expect(audit.isHealthy).toBe(false);
    expect(audit.discrepancies.length).toBe(1);
    expect(audit.discrepancies[0].discrepancy).toBe(300);
  });
});

describe('canDeleteAccount — Referential Integrity Protection', () => {
  it('allows deletion when account has no associated transactions', () => {
    const transactions: Transaction[] = [
      { id: 'tx-1', amount: 50, type: 'expense', categoryId: 'cat', accountId: 'acc-2', date: '2026-03-01' },
    ];
    const check = canDeleteAccount('acc-1', transactions);
    expect(check.canDelete).toBe(true);
    expect(check.transactionCount).toBe(0);
  });

  it('prevents deletion when account is used as origin in transactions', () => {
    const transactions: Transaction[] = [
      { id: 'tx-1', amount: 50, type: 'expense', categoryId: 'cat', accountId: 'acc-1', date: '2026-03-01' },
    ];
    const check = canDeleteAccount('acc-1', transactions);
    expect(check.canDelete).toBe(false);
    expect(check.transactionCount).toBe(1);
    expect(check.reason).toBeDefined();
  });

  it('prevents deletion when account is used as destination in transfers', () => {
    const transactions: Transaction[] = [
      { id: 'tx-1', amount: 100, type: 'transfer', categoryId: 'cat', accountId: 'acc-2', toAccountId: 'acc-1', date: '2026-03-01' },
    ];
    const check = canDeleteAccount('acc-1', transactions);
    expect(check.canDelete).toBe(false);
    expect(check.transactionCount).toBe(1);
  });
});

describe('isLiabilityAccount & Consolidated Multi-Currency Net Worth', () => {
  it('correctly classifies credit and debt accounts as liabilities regardless of negative sign', () => {
    expect(isLiabilityAccount({ id: '1', name: '', type: 'credit', balance: 500, currency: 'EUR', color: '', icon: '' })).toBe(true);
    expect(isLiabilityAccount({ id: '2', name: '', type: 'debt', balance: 1000, currency: 'EUR', color: '', icon: '' })).toBe(true);
    expect(isLiabilityAccount({ id: '3', name: '', type: 'checking', balance: -50, currency: 'EUR', color: '', icon: '' })).toBe(true);
    expect(isLiabilityAccount({ id: '4', name: '', type: 'checking', balance: 500, currency: 'EUR', color: '', icon: '' })).toBe(false);
  });

  it('consolidates multi-currency net worth into target currency', () => {
    const accounts: Account[] = [
      { id: 'a1', name: 'EUR Account', type: 'checking', balance: 100, currency: 'EUR', color: '', icon: '' },
      { id: 'a2', name: 'USD Account', type: 'savings', balance: 108, currency: 'USD', color: '', icon: '' }, // 108 USD = 100 EUR
    ];

    const result = calculateNetWorth(accounts, 'EUR');
    expect(result.isMultiCurrency).toBe(true);
    expect(result.currenciesPresent).toEqual(['EUR', 'USD']);
    // 100 EUR + 100 EUR (converted from 108 USD) = 200 EUR
    expect(result.totalNetWorth).toBe(200);
  });

  it('correctly handles cross-currency transfer impact', () => {
    const accounts: Account[] = [
      { id: 'acc-eur', name: 'EUR Account', type: 'checking', balance: 500, currency: 'EUR', color: '', icon: '' },
      { id: 'acc-usd', name: 'USD Account', type: 'savings', balance: 1000, currency: 'USD', color: '', icon: '' },
    ];

    const tx: Transaction = {
      id: 'tx-cross',
      amount: 100, // 100 EUR transferred out
      type: 'transfer',
      categoryId: 'cat-x',
      accountId: 'acc-eur',
      toAccountId: 'acc-usd',
      date: '2026-03-01',
    };

    const impact = calculateTransactionImpact(tx, accounts);
    // acc-eur loses 100 EUR
    expect(impact.fromAccountId).toBe('acc-eur');
    expect(impact.fromDelta).toBe(-100);
    // acc-usd receives 100 EUR converted to USD: 100 * 1.08 = 108 USD
    expect(impact.toAccountId).toBe('acc-usd');
    expect(impact.toDelta).toBe(108);
  });
});
