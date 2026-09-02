import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Account, AutoBudgetRule, Budget, BudgetCutSuggestion, Category, CurrencyCode, RecurringBill, SavingsGoal, ThemeMode, Transaction, TransactionTemplate } from '../types/finance';
import { DEFAULT_CATEGORIES } from '../data/categories';
import { INITIAL_ACCOUNTS, INITIAL_GOALS, INITIAL_RECURRING, INITIAL_TEMPLATES, generateSeedBudgets, generateSeedTransactions } from '../data/seedData';
import { getCurrentMonthPeriod } from '../utils/format';

interface FinanceContextType {
  // Estado base
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  budgets: Budget[];
  autoBudgetRules: AutoBudgetRule[];
  goals: SavingsGoal[];
  recurringBills: RecurringBill[];
  templates: TransactionTemplate[];
  currency: CurrencyCode;
  selectedPeriod: string; // YYYY-MM
  theme: ThemeMode;
  effectiveTheme: 'light' | 'dark';
  
  // Modo de Ahorro Extremo
  extremeSavingsMode: boolean;
  setExtremeSavingsMode: (enabled: boolean) => void;
  toggleCategoryEssential: (categoryId: string) => void;
  isCategoryEssential: (categoryId: string) => boolean;
  extremeSavingsAnalysis: {
    essentialSpent: number;
    nonEssentialSpent: number;
    nonEssentialBudgetTotal: number;
    totalPotentialMonthlySavings: number;
    suggestions: BudgetCutSuggestion[];
    hasBudgetBackup: boolean;
  };
  applyAllExtremeBudgetSuggestions: () => void;
  applyExtremeBudgetCutForCategory: (categoryId: string, newLimit: number) => void;
  restoreBudgetsBeforeExtremeSavings: () => void;

  // Setters de periodo, moneda y tema
  setSelectedPeriod: (period: string) => void;
  setCurrency: (currency: CurrencyCode) => void;
  setTheme: (theme: ThemeMode) => void;

  // Acciones de Transacciones
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;

  // Acciones de Plantillas de Transacción
  addTemplate: (template: Omit<TransactionTemplate, 'id'>) => TransactionTemplate;
  updateTemplate: (id: string, template: Partial<TransactionTemplate>) => void;
  deleteTemplate: (id: string) => void;

  // Acciones de Cuentas
  addAccount: (account: Omit<Account, 'id'>) => void;
  updateAccount: (id: string, account: Partial<Account>) => void;
  deleteAccount: (id: string) => void;

  // Acciones de Categorías
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, category: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  // Acciones de Presupuesto y Límites Automáticos
  setBudget: (categoryId: string, monthlyLimit: number, alertThreshold?: number, autoRenew?: boolean) => void;
  deleteBudget: (id: string) => void;
  toggleBudgetAutoRenew: (categoryId: string) => void;
  saveAutoBudgetRules: (rules: AutoBudgetRule[]) => void;

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
  AUTO_BUDGET_RULES: 'finantrack_auto_budget_rules_v2',
  GOALS: 'finantrack_goals_v2',
  RECURRING: 'finantrack_recurring_v2',
  TEMPLATES: 'finantrack_templates_v2',
  CURRENCY: 'finantrack_currency_v2',
  THEME: 'finantrack_theme_preference',
  EXTREME_SAVINGS_MODE: 'finantrack_extreme_savings_mode',
  BUDGETS_BACKUP_CUTS: 'finantrack_budgets_backup_cuts',
};

const DEFAULT_AUTO_BUDGET_RULES: AutoBudgetRule[] = [
  { categoryId: 'cat-alimentacion', monthlyLimit: 400, alertThreshold: 85, enabled: true },
  { categoryId: 'cat-vivienda', monthlyLimit: 900, alertThreshold: 90, enabled: true },
  { categoryId: 'cat-ocio', monthlyLimit: 250, alertThreshold: 80, enabled: true },
  { categoryId: 'cat-transporte', monthlyLimit: 150, alertThreshold: 85, enabled: true },
  { categoryId: 'cat-servicios', monthlyLimit: 120, alertThreshold: 85, enabled: true },
  { categoryId: 'cat-compras', monthlyLimit: 150, alertThreshold: 80, enabled: true },
  { categoryId: 'cat-suscripciones', monthlyLimit: 45, alertThreshold: 90, enabled: true },
  { categoryId: 'cat-salud', monthlyLimit: 80, alertThreshold: 85, enabled: true },
];

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<string>(getCurrentMonthPeriod());
  const [currency, setCurrencyState] = useState<CurrencyCode>(() => {
    return (localStorage.getItem(STORAGE_KEYS.CURRENCY) as CurrencyCode) || 'EUR';
  });

  // Modo de Ahorro Extremo
  const [extremeSavingsMode, setExtremeSavingsModeState] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEYS.EXTREME_SAVINGS_MODE) === 'true';
  });

  const setExtremeSavingsMode = (enabled: boolean) => {
    setExtremeSavingsModeState(enabled);
    localStorage.setItem(STORAGE_KEYS.EXTREME_SAVINGS_MODE, String(enabled));
  };

  const [budgetsBackupBeforeCuts, setBudgetsBackupBeforeCuts] = useState<Budget[] | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BUDGETS_BACKUP_CUTS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return null;
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
      try {
        const parsed: Category[] = JSON.parse(saved);
        return parsed.map(c => {
          if (c.isEssential !== undefined) return c;
          const def = DEFAULT_CATEGORIES.find(dc => dc.id === c.id);
          if (def && def.isEssential !== undefined) {
            return { ...c, isEssential: def.isEssential };
          }
          const lower = c.name.toLowerCase();
          const isDefEssential = ['alimentación', 'supermercado', 'vivienda', 'alquiler', 'servicios', 'luz', 'agua', 'gas', 'transporte', 'salud', 'farmacia', 'mascota', 'impuesto', 'educación'].some(k => lower.includes(k));
          return { ...c, isEssential: isDefEssential };
        });
      } catch (e) { console.error(e); }
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

  const [autoBudgetRules, setAutoBudgetRules] = useState<AutoBudgetRule[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AUTO_BUDGET_RULES);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return DEFAULT_AUTO_BUDGET_RULES;
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

  const [templates, setTemplates] = useState<TransactionTemplate[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_TEMPLATES;
  });

  // Guardar en LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));
  }, [templates]);

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
    localStorage.setItem(STORAGE_KEYS.AUTO_BUDGET_RULES, JSON.stringify(autoBudgetRules));
  }, [autoBudgetRules]);

  // Reinicio y aplicación automática de límites al inicio de cada mes
  useEffect(() => {
    if (!selectedPeriod) return;

    setBudgets(prevBudgets => {
      let hasChanges = false;
      const newBudgets = [...prevBudgets];

      // Para cada regla automática configurada y activa
      autoBudgetRules.forEach(rule => {
        if (!rule.enabled || rule.monthlyLimit <= 0) return;

        const existingIndex = newBudgets.findIndex(
          b => b.categoryId === rule.categoryId && b.period === selectedPeriod
        );

        if (existingIndex === -1) {
          // Si el mes no tiene aún presupuesto fijado, se inicializa automáticamente
          // El gasto acumulado empezará en 0 y el disponible al 100%
          newBudgets.push({
            id: `bgt-auto-${rule.categoryId}-${selectedPeriod}`,
            categoryId: rule.categoryId,
            monthlyLimit: rule.monthlyLimit,
            period: selectedPeriod,
            alertThreshold: rule.alertThreshold,
            autoRenew: true,
            lastRenewedAt: new Date().toISOString(),
          });
          hasChanges = true;
        } else if (newBudgets[existingIndex].autoRenew === undefined) {
          newBudgets[existingIndex] = {
            ...newBudgets[existingIndex],
            autoRenew: true,
          };
          hasChanges = true;
        }
      });

      return hasChanges ? newBudgets : prevBudgets;
    });
  }, [selectedPeriod, autoBudgetRules]);

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

  const isCategoryEssential = (categoryId: string): boolean => {
    const cat = categories.find(c => c.id === categoryId);
    if (!cat) return false;
    if (cat.type !== 'expense') return true;
    if (cat.isEssential !== undefined) return cat.isEssential;
    const def = DEFAULT_CATEGORIES.find(d => d.id === categoryId);
    if (def && def.isEssential !== undefined) return def.isEssential;
    return false;
  };

  const toggleCategoryEssential = (categoryId: string) => {
    setCategories(prev => prev.map(c => {
      if (c.id === categoryId) {
        const currentVal = c.isEssential !== undefined ? c.isEssential : false;
        return { ...c, isEssential: !currentVal };
      }
      return c;
    }));
  };

  // Presupuestos con reinicio automático mensual
  const setBudget = (
    categoryId: string, 
    monthlyLimit: number, 
    alertThreshold: number = 85,
    autoRenew: boolean = true
  ) => {
    setBudgets(prev => {
      const existingIndex = prev.findIndex(b => b.categoryId === categoryId && b.period === selectedPeriod);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = { 
          ...updated[existingIndex], 
          monthlyLimit, 
          alertThreshold,
          autoRenew,
          lastRenewedAt: new Date().toISOString(),
        };
        return updated;
      } else {
        const newBudget: Budget = {
          id: `bgt-${Date.now()}`,
          categoryId,
          monthlyLimit,
          period: selectedPeriod,
          alertThreshold,
          autoRenew,
          lastRenewedAt: new Date().toISOString(),
        };
        return [...prev, newBudget];
      }
    });

    // Sincronizar regla de reinicio automático
    setAutoBudgetRules(prevRules => {
      const ruleIndex = prevRules.findIndex(r => r.categoryId === categoryId);
      if (ruleIndex >= 0) {
        const updated = [...prevRules];
        updated[ruleIndex] = {
          ...updated[ruleIndex],
          monthlyLimit,
          alertThreshold,
          enabled: autoRenew,
        };
        return updated;
      } else {
        return [
          ...prevRules,
          { categoryId, monthlyLimit, alertThreshold, enabled: autoRenew }
        ];
      }
    });
  };

  const deleteBudget = (id: string) => {
    const budgetToDelete = budgets.find(b => b.id === id);
    if (budgetToDelete) {
      // También desactivar la regla automática asociada para que no se re-cree
      setAutoBudgetRules(prevRules => 
        prevRules.map(r => r.categoryId === budgetToDelete.categoryId ? { ...r, enabled: false } : r)
      );
    }
    setBudgets(prev => prev.filter(b => b.id !== id));
  };

  const toggleBudgetAutoRenew = (categoryId: string) => {
    const currentBudget = budgets.find(b => b.categoryId === categoryId && b.period === selectedPeriod);
    const willEnable = currentBudget ? !currentBudget.autoRenew : true;

    setBudgets(prev => prev.map(b => {
      if (b.categoryId === categoryId && b.period === selectedPeriod) {
        return { ...b, autoRenew: willEnable };
      }
      return b;
    }));

    setAutoBudgetRules(prevRules => {
      const ruleIndex = prevRules.findIndex(r => r.categoryId === categoryId);
      if (ruleIndex >= 0) {
        const updated = [...prevRules];
        updated[ruleIndex] = {
          ...updated[ruleIndex],
          enabled: willEnable,
          monthlyLimit: currentBudget ? currentBudget.monthlyLimit : updated[ruleIndex].monthlyLimit,
          alertThreshold: currentBudget?.alertThreshold || updated[ruleIndex].alertThreshold,
        };
        return updated;
      } else if (currentBudget) {
        return [
          ...prevRules,
          {
            categoryId,
            monthlyLimit: currentBudget.monthlyLimit,
            alertThreshold: currentBudget.alertThreshold || 85,
            enabled: willEnable,
          }
        ];
      }
      return prevRules;
    });
  };

  const saveAutoBudgetRules = (rules: AutoBudgetRule[]) => {
    setAutoBudgetRules(rules);

    // Aplicar inmediatamente al mes seleccionado
    setBudgets(prev => {
      const updated = [...prev];
      rules.forEach(rule => {
        const index = updated.findIndex(b => b.categoryId === rule.categoryId && b.period === selectedPeriod);
        if (index >= 0) {
          updated[index] = {
            ...updated[index],
            monthlyLimit: rule.monthlyLimit,
            alertThreshold: rule.alertThreshold,
            autoRenew: rule.enabled,
            lastRenewedAt: new Date().toISOString(),
          };
        } else if (rule.enabled && rule.monthlyLimit > 0) {
          updated.push({
            id: `bgt-auto-${rule.categoryId}-${selectedPeriod}`,
            categoryId: rule.categoryId,
            monthlyLimit: rule.monthlyLimit,
            period: selectedPeriod,
            alertThreshold: rule.alertThreshold,
            autoRenew: true,
            lastRenewedAt: new Date().toISOString(),
          });
        }
      });
      return updated;
    });
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

  // Plantillas de Transacción
  const addTemplate = (data: Omit<TransactionTemplate, 'id'>): TransactionTemplate => {
    const newTemplate: TransactionTemplate = {
      ...data,
      id: `tmpl-${Date.now()}`,
    };
    setTemplates(prev => [newTemplate, ...prev]);
    return newTemplate;
  };

  const updateTemplate = (id: string, updated: Partial<TransactionTemplate>) => {
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, ...updated } : t));
  };

  const deleteTemplate = (id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
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
    setAutoBudgetRules(DEFAULT_AUTO_BUDGET_RULES);
    setGoals(INITIAL_GOALS);
    setRecurringBills(INITIAL_RECURRING);
    setTemplates(INITIAL_TEMPLATES);
    setSelectedPeriod(getCurrentMonthPeriod());
  };

  const clearAllData = () => {
    setAccounts([]);
    setTransactions([]);
    setBudgets([]);
    setGoals([]);
    setRecurringBills([]);
    setTemplates([]);
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
      templates,
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
        if (data.templates) setTemplates(data.templates);
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

  // Análisis y Sugerencias del Modo de Ahorro Extremo
  const extremeSavingsAnalysis = useMemo(() => {
    const monthTxs = transactions.filter(t => t.date.startsWith(selectedPeriod) && t.type === 'expense');
    
    let essentialSpent = 0;
    let nonEssentialSpent = 0;

    monthTxs.forEach(tx => {
      if (isCategoryEssential(tx.categoryId)) {
        essentialSpent += tx.amount;
      } else {
        nonEssentialSpent += tx.amount;
      }
    });

    const expenseCategories = categories.filter(c => c.type === 'expense');
    const nonEssentialCategories = expenseCategories.filter(c => !isCategoryEssential(c.id));

    let nonEssentialBudgetTotal = 0;
    const suggestions: BudgetCutSuggestion[] = [];

    nonEssentialCategories.forEach(cat => {
      const budget = budgets.find(b => b.categoryId === cat.id && b.period === selectedPeriod);
      const spent = getCategorySpendForPeriod(cat.id, selectedPeriod);
      const currentLimit = budget?.monthlyLimit || 0;
      nonEssentialBudgetTotal += currentLimit;

      // Generar sugerencia si hay gasto o presupuesto activo en esta partida prescindible
      if (currentLimit > 0 || spent > 0) {
        let cutPercent = 60;
        let priority: 'urgent' | 'recommended' | 'optional' = 'recommended';
        let reason = 'Reducción en partida prescindible';

        const catNameLower = cat.name.toLowerCase();
        if (catNameLower.includes('suscrip') || catNameLower.includes('stream') || cat.id === 'cat-suscripciones') {
          cutPercent = 80;
          priority = 'urgent';
          reason = 'Pausar temporalmente plataformas de streaming y suscripciones digitales no esenciales';
        } else if (catNameLower.includes('ocio') || catNameLower.includes('restaur') || cat.id === 'cat-ocio') {
          cutPercent = 65;
          priority = 'urgent';
          reason = 'Limitar salidas a restaurantes, copas, ocio nocturno y pedidos de delivery';
        } else if (catNameLower.includes('compras') || catNameLower.includes('ropa') || cat.id === 'cat-compras') {
          cutPercent = 70;
          priority = 'urgent';
          reason = 'Congelar compras discrecionales de moda, tecnología y compras impulsivas';
        } else if (catNameLower.includes('viaje') || catNameLower.includes('vacacion') || cat.id === 'cat-viajes') {
          cutPercent = 85;
          priority = 'recommended';
          reason = 'Suspender viajes recreativos, escapadas de fin de semana y ocio vacacional';
        } else {
          cutPercent = 50;
          priority = 'optional';
          reason = 'Reducir gastos secundarios y partidas varias al mínimo de contingencia';
        }

        const baseAmount = currentLimit > 0 ? currentLimit : spent;
        const suggestedLimit = Math.max(0, Math.round((baseAmount * (100 - cutPercent)) / 100));
        const cutAmount = Math.max(0, baseAmount - suggestedLimit);

        if (cutAmount > 0) {
          suggestions.push({
            categoryId: cat.id,
            categoryName: cat.name,
            categoryColor: cat.color,
            categoryIcon: cat.icon,
            currentLimit,
            currentSpent: spent,
            suggestedLimit,
            cutAmount,
            cutPercent,
            reason,
            priority,
          });
        }
      }
    });

    // Ordenar: urgentes primero, luego recomendadas, luego mayor recorte económico
    suggestions.sort((a, b) => {
      const priorityOrder = { urgent: 0, recommended: 1, optional: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return b.cutAmount - a.cutAmount;
    });

    const totalPotentialMonthlySavings = suggestions.reduce((sum, s) => sum + s.cutAmount, 0);

    return {
      essentialSpent,
      nonEssentialSpent,
      nonEssentialBudgetTotal,
      totalPotentialMonthlySavings,
      suggestions,
      hasBudgetBackup: budgetsBackupBeforeCuts !== null && budgetsBackupBeforeCuts.length > 0,
    };
  }, [categories, budgets, transactions, selectedPeriod, budgetsBackupBeforeCuts]);

  const applyAllExtremeBudgetSuggestions = () => {
    const currentPeriodBudgets = budgets.filter(b => b.period === selectedPeriod);
    setBudgetsBackupBeforeCuts(currentPeriodBudgets);
    localStorage.setItem(STORAGE_KEYS.BUDGETS_BACKUP_CUTS, JSON.stringify(currentPeriodBudgets));

    setBudgets(prev => {
      let updated = [...prev];
      extremeSavingsAnalysis.suggestions.forEach(sugg => {
        const existingIdx = updated.findIndex(b => b.categoryId === sugg.categoryId && b.period === selectedPeriod);
        if (existingIdx !== -1) {
          updated[existingIdx] = {
            ...updated[existingIdx],
            monthlyLimit: sugg.suggestedLimit,
            alertThreshold: 75,
          };
        } else {
          updated.push({
            id: `bgt-extreme-${sugg.categoryId}-${selectedPeriod}`,
            categoryId: sugg.categoryId,
            monthlyLimit: sugg.suggestedLimit,
            period: selectedPeriod,
            alertThreshold: 75,
            autoRenew: true,
          });
        }
      });
      return updated;
    });
  };

  const applyExtremeBudgetCutForCategory = (categoryId: string, newLimit: number) => {
    setBudget(categoryId, newLimit, 75, true);
  };

  const restoreBudgetsBeforeExtremeSavings = () => {
    if (!budgetsBackupBeforeCuts) return;
    setBudgets(prev => {
      const otherPeriods = prev.filter(b => b.period !== selectedPeriod);
      return [...otherPeriods, ...budgetsBackupBeforeCuts];
    });
    setBudgetsBackupBeforeCuts(null);
    localStorage.removeItem(STORAGE_KEYS.BUDGETS_BACKUP_CUTS);
  };

  return (
    <FinanceContext.Provider
      value={{
        transactions,
        accounts,
        categories,
        budgets,
        autoBudgetRules,
        goals,
        recurringBills,
        templates,
        currency,
        selectedPeriod,
        theme,
        effectiveTheme,
        extremeSavingsMode,
        setExtremeSavingsMode,
        toggleCategoryEssential,
        isCategoryEssential,
        extremeSavingsAnalysis,
        applyAllExtremeBudgetSuggestions,
        applyExtremeBudgetCutForCategory,
        restoreBudgetsBeforeExtremeSavings,
        setSelectedPeriod,
        setCurrency,
        setTheme,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addTemplate,
        updateTemplate,
        deleteTemplate,
        addAccount,
        updateAccount,
        deleteAccount,
        addCategory,
        updateCategory,
        deleteCategory,
        setBudget,
        deleteBudget,
        toggleBudgetAutoRenew,
        saveAutoBudgetRules,
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
