import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Account, Budget, Category, CurrencyCode, RecurringBill, SavingsGoal, ThemeMode, Transaction } from '../types/finance';
import { DEFAULT_CATEGORIES } from '../data/categories';
import { INITIAL_ACCOUNTS, INITIAL_GOALS, INITIAL_RECURRING, generateSeedBudgets, generateSeedTransactions } from '../data/seedData';
import { getCurrentMonthPeriod } from '../utils/format';

interface FinanceContextType {
  // Estado base
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  budgets: Budget[];
  goals: SavingsGoal[];
  recurringBills: RecurringBill[];
  currency: CurrencyCode;
  selectedPeriod: string; // YYYY-MM
  theme: ThemeMode;
  effectiveTheme: 'light' | 'dark';
  
  // Setters de periodo, moneda y tema
  setSelectedPeriod: (period: string) => void;
  setCurrency: (currency: CurrencyCode) => void;
  setTheme: (theme: ThemeMode) => void;

  // Acciones de Transacciones
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;

  // Acciones de Cuentas
  addAccount: (account: Omit<Account, 'id'>) => void;
  updateAccount: (id: string, account: Partial<Account>) => void;
  deleteAccount: (id: string) => void;

  // Acciones de Categorías
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, category: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  // Acciones de Presupuesto
  setBudget: (categoryId: string, monthlyLimit: number, alertThreshold?: number) => void;
  deleteBudget: (id: string) => void;

  // Acciones de Metas
  addGoal: (goal: Omit<SavingsGoal, 'id'>) => void;
  updateGoal: (id: string, goal: Partial<SavingsGoal>) => void;
  contributeToGoal: (id: string, amount: number, fromAccountId?: string) => void;
  deleteGoal: (id: string) => void;

  // Acciones de Recurrentes
  addRecurringBill: (bill: Omit<RecurringBill, 'id'>) => void;
  updateRecurringBill: (id: string, bill: Partial<RecurringBill>) => void;
  deleteRecurringBill: (id: string) => void;
  processRecurringBill: (id: string) => void;

  // Utilidades de datos
  resetToSeedData: () => void;
  clearAllData: () => void;
  exportDataJSON: () => void;
  exportTransactionsCSV: () => void;
  importDataJSON: (jsonString: string) => boolean;

  // Métricas calculadas
  metrics: {
    totalNetWorth: number;
    totalAssets: number;
    totalLiabilities: number;
    currentMonthIncome: number;
    currentMonthExpense: number;
    currentMonthNet: number;
    savingsRate: number; // Porcentaje
    previousMonthExpense: number;
    previousMonthIncome: number;
    expenseDiffPercent: number;
    financialHealthScore: number; // 0 a 100
  };

  // Helper selectors
  getCategoryById: (id: string) => Category | undefined;
  getAccountById: (id: string) => Account | undefined;
  getTransactionsForPeriod: (period: string) => Transaction[];
  getCategorySpendForPeriod: (categoryId: string, period: string) => number;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const STORAGE_KEYS = {
  TRANSACTIONS: 'finantrack_transactions_v2',
  ACCOUNTS: 'finantrack_accounts_v2',
  CATEGORIES: 'finantrack_categories_v2',
  BUDGETS: 'finantrack_budgets_v2',
  GOALS: 'finantrack_goals_v2',
  RECURRING: 'finantrack_recurring_v2',
  CURRENCY: 'finantrack_currency_v2',
  THEME: 'finantrack_theme_preference',
};

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<string>(getCurrentMonthPeriod());
  const [currency, setCurrencyState] = useState<CurrencyCode>(() => {
    return (localStorage.getItem(STORAGE_KEYS.CURRENCY) as CurrencyCode) || 'EUR';
  });

  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME) as ThemeMode;
    if (saved === 'light' || saved === 'dark' || saved === 'system') {
      return saved;
    }
    return 'light';
  });

  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemPrefersDark(e.matches);
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const effectiveTheme: 'light' | 'dark' = useMemo(() => {
    if (theme === 'system') {
      return systemPrefersDark ? 'dark' : 'light';
    }
    return theme;
  }, [theme, systemPrefersDark]);

  useEffect(() => {
    const root = document.documentElement;
    if (effectiveTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    root.style.colorScheme = effectiveTheme;
  }, [effectiveTheme]);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    localStorage.setItem(STORAGE_KEYS.THEME, newTheme);
  };

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return DEFAULT_CATEGORIES;
  });

  const [accounts, setAccounts] = useState<Account[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_ACCOUNTS;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return generateSeedTransactions();
  });

  const [budgets, setBudgets] = useState<Budget[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BUDGETS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return generateSeedBudgets();
  });

  const [goals, setGoals] = useState<SavingsGoal[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.GOALS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_GOALS;
  });

  const [recurringBills, setRecurringBills] = useState<RecurringBill[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.RECURRING);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_RECURRING;
  });

  // Guardar en LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets));
  }, [budgets]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RECURRING, JSON.stringify(recurringBills));
  }, [recurringBills]);

  const setCurrency = (code: CurrencyCode) => {
    setCurrencyState(code);
    localStorage.setItem(STORAGE_KEYS.CURRENCY, code);
  };

  // Helper Lookups
  const getCategoryById = (id: string) => categories.find(c => c.id === id);
  const getAccountById = (id: string) => accounts.find(a => a.id === id);

  const getTransactionsForPeriod = (period: string) => {
    return transactions.filter(tx => tx.date.startsWith(period));
  };

  const getCategorySpendForPeriod = (categoryId: string, period: string) => {
    return transactions
      .filter(tx => tx.categoryId === categoryId && tx.type === 'expense' && tx.date.startsWith(period))
      .reduce((sum, tx) => sum + tx.amount, 0);
  };

  // Acciones de Transacciones
  const addTransaction = (data: Omit<Transaction, 'id'>) => {
    const newTx: Transaction = {
      ...data,
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    };

    setTransactions(prev => [newTx, ...prev]);

    // Actualizar balance de cuentas
    setAccounts(prev => prev.map(acc => {
      if (data.type === 'expense' && acc.id === data.accountId) {
        return { ...acc, balance: acc.balance - data.amount };
      }
      if (data.type === 'income' && acc.id === data.accountId) {
        return { ...acc, balance: acc.balance + data.amount };
      }
      if (data.type === 'transfer') {
        if (acc.id === data.accountId) {
          return { ...acc, balance: acc.balance - data.amount };
        }
        if (acc.id === data.toAccountId) {
          return { ...acc, balance: acc.balance + data.amount };
        }
      }
      return acc;
    }));
  };

  const updateTransaction = (id: string, updated: Partial<Transaction>) => {
    const oldTx = transactions.find(t => t.id === id);
    if (!oldTx) return;

    // Revertir efecto previo en cuentas
    setAccounts(prev => prev.map(acc => {
      let balance = acc.balance;
      if (oldTx.type === 'expense' && acc.id === oldTx.accountId) balance += oldTx.amount;
      if (oldTx.type === 'income' && acc.id === oldTx.accountId) balance -= oldTx.amount;
      if (oldTx.type === 'transfer') {
        if (acc.id === oldTx.accountId) balance += oldTx.amount;
        if (acc.id === oldTx.toAccountId) balance -= oldTx.amount;
      }
      return { ...acc, balance };
    }));

    const finalTx = { ...oldTx, ...updated };

    // Aplicar nuevo efecto
    setAccounts(prev => prev.map(acc => {
      let balance = acc.balance;
      if (finalTx.type === 'expense' && acc.id === finalTx.accountId) balance -= finalTx.amount;
      if (finalTx.type === 'income' && acc.id === finalTx.accountId) balance += finalTx.amount;
      if (finalTx.type === 'transfer') {
        if (acc.id === finalTx.accountId) balance -= finalTx.amount;
        if (acc.id === finalTx.toAccountId) balance += finalTx.amount;
      }
      return { ...acc, balance };
    }));

    setTransactions(prev => prev.map(t => t.id === id ? finalTx : t));
  };

  const deleteTransaction = (id: string) => {
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;

    // Revertir efecto en balance
    setAccounts(prev => prev.map(acc => {
      let balance = acc.balance;
      if (tx.type === 'expense' && acc.id === tx.accountId) balance += tx.amount;
      if (tx.type === 'income' && acc.id === tx.accountId) balance -= tx.amount;
      if (tx.type === 'transfer') {
        if (acc.id === tx.accountId) balance += tx.amount;
        if (acc.id === tx.toAccountId) balance -= tx.amount;
      }
      return { ...acc, balance };
    }));

    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  // Acciones de Cuentas
  const addAccount = (accountData: Omit<Account, 'id'>) => {
    const newAcc: Account = {
      ...accountData,
      id: `acc-${Date.now()}`,
    };
    setAccounts(prev => [...prev, newAcc]);
  };

  const updateAccount = (id: string, updated: Partial<Account>) => {
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, ...updated } : a));
  };

  const deleteAccount = (id: string) => {
    setAccounts(prev => prev.filter(a => a.id !== id));
  };

  // Acciones de Categorías
  const addCategory = (data: Omit<Category, 'id'>) => {
    const newCat: Category = {
      ...data,
      id: `cat-${Date.now()}`,
    };
    setCategories(prev => [...prev, newCat]);
  };

  const updateCategory = (id: string, updated: Partial<Category>) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, ...updated } : c));
  };

  const deleteCategory = (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  // Presupuestos
  const setBudget = (categoryId: string, monthlyLimit: number, alertThreshold: number = 85) => {
    setBudgets(prev => {
      const existingIndex = prev.findIndex(b => b.categoryId === categoryId && b.period === selectedPeriod);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], monthlyLimit, alertThreshold };
        return updated;
      } else {
        const newBudget: Budget = {
          id: `bgt-${Date.now()}`,
          categoryId,
          monthlyLimit,
          period: selectedPeriod,
          alertThreshold,
        };
        return [...prev, newBudget];
      }
    });
  };

  const deleteBudget = (id: string) => {
    setBudgets(prev => prev.filter(b => b.id !== id));
  };

  // Metas de Ahorro
  const addGoal = (data: Omit<SavingsGoal, 'id'>) => {
    const newGoal: SavingsGoal = {
      ...data,
      id: `goal-${Date.now()}`,
    };
    setGoals(prev => [...prev, newGoal]);
  };

  const updateGoal = (id: string, updated: Partial<SavingsGoal>) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, ...updated } : g));
  };

  const contributeToGoal = (id: string, amount: number, fromAccountId?: string) => {
    setGoals(prev => prev.map(g => {
      if (g.id === id) {
        const newAmt = Math.min(g.targetAmount, g.currentAmount + amount);
        return { ...g, currentAmount: newAmt };
      }
      return g;
    }));

    if (fromAccountId) {
      addTransaction({
        amount,
        type: 'transfer',
        categoryId: 'cat-inversiones',
        accountId: fromAccountId,
        date: new Date().toISOString().split('T')[0],
        note: `Aporte a meta de ahorro`,
        tags: ['Ahorro', 'Meta'],
      });
    }
  };

  const deleteGoal = (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  // Recurrentes
  const addRecurringBill = (data: Omit<RecurringBill, 'id'>) => {
    const newBill: RecurringBill = {
      ...data,
      id: `rec-${Date.now()}`,
    };
    setRecurringBills(prev => [...prev, newBill]);
  };

  const updateRecurringBill = (id: string, updated: Partial<RecurringBill>) => {
    setRecurringBills(prev => prev.map(b => b.id === id ? { ...b, ...updated } : b));
  };

  const deleteRecurringBill = (id: string) => {
    setRecurringBills(prev => prev.filter(b => b.id !== id));
  };

  const processRecurringBill = (id: string) => {
    const bill = recurringBills.find(b => b.id === id);
    if (!bill) return;

    addTransaction({
      amount: bill.amount,
      type: bill.type,
      categoryId: bill.categoryId,
      accountId: bill.accountId,
      date: new Date().toISOString().split('T')[0],
      note: `Pago recurrente: ${bill.name}`,
      tags: ['Recurrente', 'Automático'],
      isRecurring: true,
    });

    // Calcular siguiente fecha
    const nextDate = new Date(bill.nextDueDate || new Date());
    if (bill.frequency === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
    else if (bill.frequency === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
    else if (bill.frequency === 'bimonthly') nextDate.setMonth(nextDate.getMonth() + 2);
    else if (bill.frequency === 'yearly') nextDate.setFullYear(nextDate.getFullYear() + 1);

    updateRecurringBill(id, { nextDueDate: nextDate.toISOString().split('T')[0] });
  };

  // Reset y Limpieza
  const resetToSeedData = () => {
    setAccounts(INITIAL_ACCOUNTS);
    setCategories(DEFAULT_CATEGORIES);
    setTransactions(generateSeedTransactions());
    setBudgets(generateSeedBudgets());
    setGoals(INITIAL_GOALS);
    setRecurringBills(INITIAL_RECURRING);
    setSelectedPeriod(getCurrentMonthPeriod());
  };

  const clearAllData = () => {
    setAccounts([]);
    setTransactions([]);
    setBudgets([]);
    setGoals([]);
    setRecurringBills([]);
  };

  const exportDataJSON = () => {
    const backup = {
      exportedAt: new Date().toISOString(),
      currency,
      accounts,
      categories,
      transactions,
      budgets,
      goals,
      recurringBills,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `finantrack_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportTransactionsCSV = () => {
    const headers = ['ID', 'Fecha', 'Tipo', 'Monto', 'Categoría', 'Cuenta', 'Nota', 'Etiquetas'];
    const rows = transactions.map(t => {
      const cat = getCategoryById(t.categoryId)?.name || t.categoryId;
      const acc = getAccountById(t.accountId)?.name || t.accountId;
      return [
        t.id,
        t.date,
        t.type,
        t.amount.toString(),
        `"${cat}"`,
        `"${acc}"`,
        `"${(t.note || '').replace(/"/g, '""')}"`,
        `"${(t.tags || []).join(', ')}"`,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `finantrack_movimientos_${selectedPeriod}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importDataJSON = (jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      if (Array.isArray(data.transactions) && Array.isArray(data.accounts)) {
        if (data.currency) setCurrency(data.currency);
        if (data.accounts) setAccounts(data.accounts);
        if (data.categories) setCategories(data.categories);
        if (data.transactions) setTransactions(data.transactions);
        if (data.budgets) setBudgets(data.budgets);
        if (data.goals) setGoals(data.goals);
        if (data.recurringBills) setRecurringBills(data.recurringBills);
        return true;
      }
      return false;
    } catch (e) {
      console.error('Error importing JSON:', e);
      return false;
    }
  };

  // Métricas calculadas
  const metrics = useMemo(() => {
    // Activos vs Pasivos
    let totalAssets = 0;
    let totalLiabilities = 0;

    accounts.forEach(acc => {
      if (acc.balance >= 0) {
        totalAssets += acc.balance;
      } else {
        totalLiabilities += Math.abs(acc.balance);
      }
    });

    const totalNetWorth = totalAssets - totalLiabilities;

    // Periodo actual
    const currentTxs = transactions.filter(t => t.date.startsWith(selectedPeriod));
    const currentMonthIncome = currentTxs
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const currentMonthExpense = currentTxs
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const currentMonthNet = currentMonthIncome - currentMonthExpense;
    const savingsRate = currentMonthIncome > 0
      ? Math.max(0, Math.round((currentMonthNet / currentMonthIncome) * 100))
      : 0;

    // Periodo anterior para comparativas
    const [currY, currM] = selectedPeriod.split('-').map(Number);
    const prevDate = new Date(currY, currM - 2, 1);
    const prevPeriod = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

    const prevTxs = transactions.filter(t => t.date.startsWith(prevPeriod));
    const previousMonthIncome = prevTxs
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const previousMonthExpense = prevTxs
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenseDiffPercent = previousMonthExpense > 0
      ? Math.round(((currentMonthExpense - previousMonthExpense) / previousMonthExpense) * 100)
      : 0;

    // Puntuación de Salud Financiera (0 - 100)
    let healthScore = 50;
    // 1. Tasa de ahorro (hasta 30 pts)
    if (savingsRate >= 20) healthScore += 30;
    else if (savingsRate >= 10) healthScore += 20;
    else if (savingsRate > 0) healthScore += 10;
    else healthScore -= 15;

    // 2. Control de presupuesto (hasta 30 pts)
    const activeBudgets = budgets.filter(b => b.period === selectedPeriod);
    if (activeBudgets.length > 0) {
      const overBudgetCount = activeBudgets.filter(b => {
        const spent = getCategorySpendForPeriod(b.categoryId, selectedPeriod);
        return spent > b.monthlyLimit;
      }).length;
      if (overBudgetCount === 0) healthScore += 25;
      else healthScore -= overBudgetCount * 10;
    } else {
      healthScore += 10;
    }

    // 3. Ratio Deuda / Patrimonio (hasta 20 pts)
    if (totalAssets > 0) {
      const debtRatio = totalLiabilities / totalAssets;
      if (debtRatio === 0) healthScore += 20;
      else if (debtRatio < 0.2) healthScore += 15;
      else if (debtRatio < 0.5) healthScore += 5;
      else healthScore -= 20;
    }

    const financialHealthScore = Math.min(100, Math.max(10, healthScore));

    return {
      totalNetWorth,
      totalAssets,
      totalLiabilities,
      currentMonthIncome,
      currentMonthExpense,
      currentMonthNet,
      savingsRate,
      previousMonthExpense,
      previousMonthIncome,
      expenseDiffPercent,
      financialHealthScore,
    };
  }, [accounts, transactions, selectedPeriod, budgets]);

  return (
    <FinanceContext.Provider
      value={{
        transactions,
        accounts,
        categories,
        budgets,
        goals,
        recurringBills,
        currency,
        selectedPeriod,
        theme,
        effectiveTheme,
        setSelectedPeriod,
        setCurrency,
        setTheme,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addAccount,
        updateAccount,
        deleteAccount,
        addCategory,
        updateCategory,
        deleteCategory,
        setBudget,
        deleteBudget,
        addGoal,
        updateGoal,
        contributeToGoal,
        deleteGoal,
        addRecurringBill,
        updateRecurringBill,
        deleteRecurringBill,
        processRecurringBill,
        resetToSeedData,
        clearAllData,
        exportDataJSON,
        exportTransactionsCSV,
        importDataJSON,
        metrics,
        getCategoryById,
        getAccountById,
        getTransactionsForPeriod,
        getCategorySpendForPeriod,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
}
