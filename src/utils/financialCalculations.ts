/**
 * Módulo de Cálculos Financieros Críticos — FinanTrack Pro
 * 
 * Funciones puras independientes de la UI y de React para garantizar:
 * 1. Integridad contable y cálculo exacto en centavos (evita errores de coma flotante IEEE 754).
 * 2. Determinismo en balances, patrimonio, presupuestos y metas.
 * 3. Fuente única de verdad verificable mediante tests unitarios.
 */

import { Account, Transaction, Budget, SavingsGoal } from '../types/finance';

/**
 * Convierte una cantidad monetaria decimal a centavos enteros para aritmética exacta.
 * E.g., 19.99 -> 1999, -100.10 -> -10010
 */
export function toCents(amount: number): number {
  if (isNaN(amount) || !isFinite(amount)) return 0;
  return Math.round(amount * 100);
}

/**
 * Convierte centavos enteros a valor decimal estándar con 2 decimales.
 * E.g., 1999 -> 19.99
 */
export function fromCents(cents: number): number {
  if (isNaN(cents) || !isFinite(cents)) return 0;
  return Math.round(cents) / 100;
}

/**
 * Suma monetaria precisa en centavos.
 */
export function addMoney(a: number, b: number): number {
  return fromCents(toCents(a) + toCents(b));
}

/**
 * Resta monetaria precisa en centavos.
 */
export function subtractMoney(a: number, b: number): number {
  return fromCents(toCents(a) - toCents(b));
}

/**
 * Multiplicación monetaria precisa con redondeo contable a centavos.
 */
export function multiplyMoney(amount: number, factor: number): number {
  return fromCents(Math.round(toCents(amount) * factor));
}

/**
 * Divide monetaria precisa con redondeo contable a centavos.
 */
export function divideMoney(amount: number, divisor: number): number {
  if (divisor === 0) return 0;
  return fromCents(Math.round(toCents(amount) / divisor));
}

/**
 * Calcula el impacto contable (débito/crédito) de una transacción en las cuentas involucradas.
 */
export function calculateTransactionImpact(transaction: Transaction): {
  fromAccountId: string;
  fromDelta: number; // en valor monetario
  toAccountId?: string;
  toDelta?: number;
} {
  const amount = Math.abs(transaction.amount);

  if (transaction.type === 'expense') {
    return {
      fromAccountId: transaction.accountId,
      fromDelta: -amount,
    };
  }

  if (transaction.type === 'income') {
    return {
      fromAccountId: transaction.accountId,
      fromDelta: amount,
    };
  }

  if (transaction.type === 'transfer') {
    const toAccountId = transaction.toAccountId;
    // Si la transferencia es a la misma cuenta, el efecto neto es 0
    if (toAccountId === transaction.accountId) {
      return {
        fromAccountId: transaction.accountId,
        fromDelta: 0,
        toAccountId,
        toDelta: 0,
      };
    }

    return {
      fromAccountId: transaction.accountId,
      fromDelta: -amount,
      toAccountId: toAccountId || undefined,
      toDelta: toAccountId ? amount : 0,
    };
  }

  return {
    fromAccountId: transaction.accountId,
    fromDelta: 0,
  };
}

/**
 * Valida si una transferencia entre cuentas es válida y coherente.
 */
export function validateTransfer(
  fromAccountId: string,
  toAccountId: string | undefined,
  amount: number,
  accounts: Account[]
): { isValid: boolean; error?: string } {
  if (!fromAccountId) {
    return { isValid: false, error: 'Debes seleccionar una cuenta de origen.' };
  }

  if (!toAccountId) {
    return { isValid: false, error: 'Debes seleccionar una cuenta de destino.' };
  }

  if (fromAccountId === toAccountId) {
    return { isValid: false, error: 'La cuenta de origen y destino deben ser diferentes.' };
  }

  if (isNaN(amount) || amount <= 0) {
    return { isValid: false, error: 'El importe transferido debe ser mayor a 0.' };
  }

  const fromAcc = accounts.find(a => a.id === fromAccountId);
  if (!fromAcc) {
    return { isValid: false, error: 'La cuenta de origen no existe.' };
  }

  const toAcc = accounts.find(a => a.id === toAccountId);
  if (!toAcc) {
    return { isValid: false, error: 'La cuenta de destino no existe.' };
  }

  return { isValid: true };
}

/**
 * Calcula el saldo exacto de una cuenta reconstruyéndolo a partir de:
 * 1. Su saldo base inicial (initialBalance, o balance inicial si no hay historial)
 * 2. Todas las transacciones registradas que afectan a esa cuenta
 * 
 * Garantiza total consistencia contable:
 * Incomes (+), Expenses (-), Incoming Transfers (+), Outgoing Transfers (-)
 */
export function calculateAccountBalance(
  account: Account,
  transactions: Transaction[]
): number {
  // Saldo base de la cuenta
  const baseCents = toCents(account.initialBalance !== undefined ? account.initialBalance : account.balance);

  // Si account.initialBalance está explícitamente fijado, reconstruimos el delta a partir de todas las transacciones
  // Si no está fijado, usamos el saldo de la cuenta considerando que ya refleja las transacciones históricas
  // Para reconstrucción determinista completa:
  let totalDeltaCents = 0;

  for (const tx of transactions) {
    const amountCents = toCents(tx.amount);

    if (tx.type === 'income' && tx.accountId === account.id) {
      totalDeltaCents += amountCents;
    } else if (tx.type === 'expense' && tx.accountId === account.id) {
      totalDeltaCents -= amountCents;
    } else if (tx.type === 'transfer') {
      if (tx.accountId === account.id && tx.toAccountId === account.id) {
        // Transferencia dentro de la misma cuenta: sin efecto
        continue;
      }
      if (tx.accountId === account.id) {
        totalDeltaCents -= amountCents;
      }
      if (tx.toAccountId === account.id) {
        totalDeltaCents += amountCents;
      }
    }
  }

  if (account.initialBalance !== undefined) {
    return fromCents(baseCents + totalDeltaCents);
  }

  // Si no hay initialBalance definido, se devuelve el balance actual
  return account.balance;
}

/**
 * Calcula el patrimonio neto (Net Worth), separando activos y pasivos.
 * Activos: saldos de cuentas con balance >= 0
 * Pasivos: deudas y saldos negativos de tarjetas o préstamos (balance < 0)
 * Patrimonio Neto = Activos - Pasivos
 */
export function calculateNetWorth(accounts: Account[]): {
  totalAssets: number;
  totalLiabilities: number;
  totalNetWorth: number;
} {
  let assetsCents = 0;
  let liabilitiesCents = 0;

  for (const acc of accounts) {
    // Si la cuenta está oculta, no se excluye salvo que así se configure expresamente
    const balCents = toCents(acc.balance);
    if (balCents >= 0) {
      assetsCents += balCents;
    } else {
      liabilitiesCents += Math.abs(balCents);
    }
  }

  const totalAssets = fromCents(assetsCents);
  const totalLiabilities = fromCents(liabilitiesCents);
  const totalNetWorth = fromCents(assetsCents - liabilitiesCents);

  return {
    totalAssets,
    totalLiabilities,
    totalNetWorth,
  };
}

/**
 * Calcula el progreso de un presupuesto mensual para una categoría.
 */
export function calculateBudgetProgress(
  budget: Budget,
  transactions: Transaction[]
): {
  limit: number;
  spent: number;
  remaining: number;
  percentage: number;
  isOverBudget: boolean;
} {
  const limitValue = budget.monthlyLimit !== undefined ? budget.monthlyLimit : ((budget as any).limit || 0);
  const limitCents = toCents(limitValue);
  let spentCents = 0;

  for (const tx of transactions) {
    // Solo gastos del mismo periodo y categoría
    if (
      tx.type === 'expense' &&
      tx.categoryId === budget.categoryId &&
      tx.date.startsWith(budget.period)
    ) {
      spentCents += toCents(tx.amount);
    }
  }

  const limit = fromCents(limitCents);
  const spent = fromCents(spentCents);
  const remainingCents = Math.max(0, limitCents - spentCents);
  const remaining = fromCents(remainingCents);

  const percentage = limitCents > 0
    ? Math.round((spentCents / limitCents) * 100)
    : 0;

  const isOverBudget = spentCents > limitCents;

  return {
    limit,
    spent,
    remaining,
    percentage,
    isOverBudget,
  };
}

/**
 * Calcula la tasa de ahorro (% sobre los ingresos).
 * Si los ingresos son 0 o negativos, la tasa es 0%.
 * Tasa = ((Ingresos - Gastos) / Ingresos) * 100
 */
export function calculateSavingsRate(
  income: number,
  expense: number
): {
  netSavings: number;
  savingsRate: number;
} {
  const incomeCents = toCents(income);
  const expenseCents = toCents(expense);
  const netCents = incomeCents - expenseCents;
  const netSavings = fromCents(netCents);

  if (incomeCents <= 0) {
    return {
      netSavings,
      savingsRate: 0,
    };
  }

  const rate = Math.round((netCents / incomeCents) * 100);
  return {
    netSavings,
    savingsRate: Math.max(-100, Math.min(100, rate)),
  };
}

/**
 * Calcula el progreso de una meta de ahorro (SavingsGoal).
 */
export function calculateGoalProgress(goal: SavingsGoal): {
  targetAmount: number;
  currentAmount: number;
  remainingAmount: number;
  percentage: number;
  isCompleted: boolean;
} {
  const targetCents = toCents(goal.targetAmount);
  const currentCents = toCents(goal.currentAmount);
  const remainingCents = Math.max(0, targetCents - currentCents);

  const percentage = targetCents > 0
    ? Math.min(100, Math.round((currentCents / targetCents) * 100))
    : 0;

  return {
    targetAmount: fromCents(targetCents),
    currentAmount: fromCents(currentCents),
    remainingAmount: fromCents(remainingCents),
    percentage,
    isCompleted: currentCents >= targetCents,
  };
}

/**
 * Calcula las métricas financieras agregadas para un periodo mensual (YYYY-MM).
 */
export function calculatePeriodMetrics(
  transactions: Transaction[],
  period: string
): {
  income: number;
  expense: number;
  net: number;
  savingsRate: number;
  count: number;
} {
  let incomeCents = 0;
  let expenseCents = 0;
  let count = 0;

  for (const tx of transactions) {
    if (tx.date.startsWith(period)) {
      count++;
      if (tx.type === 'income') {
        incomeCents += toCents(tx.amount);
      } else if (tx.type === 'expense') {
        expenseCents += toCents(tx.amount);
      }
      // Las transferencias se omiten de los ingresos y gastos operativos del periodo
    }
  }

  const income = fromCents(incomeCents);
  const expense = fromCents(expenseCents);
  const net = fromCents(incomeCents - expenseCents);
  const { savingsRate } = calculateSavingsRate(income, expense);

  return {
    income,
    expense,
    net,
    savingsRate,
    count,
  };
}

/**
 * Aplica el impacto de crear una nueva transacción sobre las cuentas existentes
 * de forma atómica y precisa en centavos.
 */
export function applyTransactionToAccounts(
  accounts: Account[],
  transaction: Transaction
): Account[] {
  const impact = calculateTransactionImpact(transaction);

  return accounts.map(acc => {
    let balanceCents = toCents(acc.balance);

    if (acc.id === impact.fromAccountId) {
      balanceCents += toCents(impact.fromDelta);
    }
    if (impact.toAccountId && acc.id === impact.toAccountId) {
      balanceCents += toCents(impact.toDelta || 0);
    }

    return {
      ...acc,
      balance: fromCents(balanceCents),
    };
  });
}

/**
 * Revierte el impacto de una transacción anterior y aplica una nueva de forma atómica.
 */
export function applyTransactionUpdateToAccounts(
  accounts: Account[],
  oldTransaction: Transaction,
  newTransaction: Transaction
): Account[] {
  // 1. Revertir transacción vieja
  const oldImpact = calculateTransactionImpact(oldTransaction);
  let updatedAccounts = accounts.map(acc => {
    let balanceCents = toCents(acc.balance);

    if (acc.id === oldImpact.fromAccountId) {
      balanceCents -= toCents(oldImpact.fromDelta);
    }
    if (oldImpact.toAccountId && acc.id === oldImpact.toAccountId) {
      balanceCents -= toCents(oldImpact.toDelta || 0);
    }

    return {
      ...acc,
      balance: fromCents(balanceCents),
    };
  });

  // 2. Aplicar transacción nueva
  const newImpact = calculateTransactionImpact(newTransaction);
  updatedAccounts = updatedAccounts.map(acc => {
    let balanceCents = toCents(acc.balance);

    if (acc.id === newImpact.fromAccountId) {
      balanceCents += toCents(newImpact.fromDelta);
    }
    if (newImpact.toAccountId && acc.id === newImpact.toAccountId) {
      balanceCents += toCents(newImpact.toDelta || 0);
    }

    return {
      ...acc,
      balance: fromCents(balanceCents),
    };
  });

  return updatedAccounts;
}

/**
 * Revierte el impacto de una transacción eliminada de forma atómica.
 */
export function applyTransactionDeletionToAccounts(
  accounts: Account[],
  transaction: Transaction
): Account[] {
  const impact = calculateTransactionImpact(transaction);

  return accounts.map(acc => {
    let balanceCents = toCents(acc.balance);

    if (acc.id === impact.fromAccountId) {
      balanceCents -= toCents(impact.fromDelta);
    }
    if (impact.toAccountId && acc.id === impact.toAccountId) {
      balanceCents -= toCents(impact.toDelta || 0);
    }

    return {
      ...acc,
      balance: fromCents(balanceCents),
    };
  });
}

/**
 * Tasas de cambio de referencia estándar relativas a EUR (Base 1.0)
 * Proporciona una base transparente sin prometer falsa exactitud de mercado en vivo.
 */
export const DEFAULT_EXCHANGE_RATES: Record<string, number> = {
  EUR: 1.0,
  USD: 1.08,
  MXN: 18.5,
  COP: 4300.0,
  ARS: 1100.0,
  CLP: 1020.0,
  PEN: 4.1,
  GBP: 0.85,
};

/**
 * Convierte un importe monetario entre dos divisas mediante tipo de cambio de referencia.
 */
export function convertCurrency(
  amount: number,
  from: string,
  to: string,
  rates: Record<string, number> = DEFAULT_EXCHANGE_RATES
): number {
  if (from === to) return amount;
  const rateFrom = rates[from] || 1.0;
  const rateTo = rates[to] || 1.0;
  // Convertir from -> EUR (base 1.0) -> to
  const amountInBaseEUR = amount / rateFrom;
  const convertedAmount = amountInBaseEUR * rateTo;
  return fromCents(Math.round(convertedAmount * 100));
}

/**
 * Calcula el patrimonio neto agrupado por cada divisa presente en las cuentas.
 * Evita la suma distorsionada de valores heterogéneos (e.g. 100 EUR + 100 USD).
 */
export function calculateNetWorthByCurrency(accounts: Account[]): Record<string, {
  totalAssets: number;
  totalLiabilities: number;
  totalNetWorth: number;
  accountCount: number;
}> {
  const result: Record<string, {
    totalAssets: number;
    totalLiabilities: number;
    totalNetWorth: number;
    accountCount: number;
  }> = {};

  for (const acc of accounts) {
    const cur = acc.currency || 'EUR';
    if (!result[cur]) {
      result[cur] = {
        totalAssets: 0,
        totalLiabilities: 0,
        totalNetWorth: 0,
        accountCount: 0,
      };
    }

    result[cur].accountCount += 1;
    const balCents = toCents(acc.balance);
    if (balCents >= 0) {
      result[cur].totalAssets = addMoney(result[cur].totalAssets, acc.balance);
    } else {
      result[cur].totalLiabilities = addMoney(result[cur].totalLiabilities, Math.abs(acc.balance));
    }
    result[cur].totalNetWorth = subtractMoney(result[cur].totalAssets, result[cur].totalLiabilities);
  }

  return result;
}

export interface AccountReconciliationDiscrepancy {
  accountId: string;
  accountName: string;
  currentBalance: number;
  ledgerBalance: number;
  discrepancy: number; // current - ledger
}

/**
 * Audita la integridad contable verificando si el balance almacenado en cada cuenta
 * coincide exactamente con el historial de transacciones (Libro Mayor).
 */
export function auditAccountIntegrity(
  accounts: Account[],
  transactions: Transaction[]
): {
  isHealthy: boolean;
  discrepancies: AccountReconciliationDiscrepancy[];
} {
  const discrepancies: AccountReconciliationDiscrepancy[] = [];

  for (const account of accounts) {
    if (account.initialBalance !== undefined) {
      const calculated = calculateAccountBalance(account, transactions);
      const diffCents = Math.abs(toCents(account.balance) - toCents(calculated));
      if (diffCents > 0) {
        discrepancies.push({
          accountId: account.id,
          accountName: account.name,
          currentBalance: account.balance,
          ledgerBalance: calculated,
          discrepancy: fromCents(toCents(account.balance) - toCents(calculated)),
        });
      }
    }
  }

  return {
    isHealthy: discrepancies.length === 0,
    discrepancies,
  };
}

