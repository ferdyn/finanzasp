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
 * Calcula el impacto contable (débito/crédito) de una transacción en las cuentas involucradas.
 * Soporta transferencias multidivisa y garantiza neutralidad ante transferencias a la misma cuenta.
 */
export function calculateTransactionImpact(
  transaction: Transaction,
  accounts?: Account[],
  exchangeRates: Record<string, number> = DEFAULT_EXCHANGE_RATES
): {
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

    // Calcular monto de destino (con conversión de divisas si las cuentas difieren)
    let destinationAmount = amount;
    if (accounts && toAccountId) {
      const fromAcc = accounts.find(a => a.id === transaction.accountId);
      const toAcc = accounts.find(a => a.id === toAccountId);
      if (fromAcc && toAcc && fromAcc.currency !== toAcc.currency) {
        destinationAmount = convertCurrency(amount, fromAcc.currency, toAcc.currency, exchangeRates);
      }
    }

    return {
      fromAccountId: transaction.accountId,
      fromDelta: -amount,
      toAccountId: toAccountId || undefined,
      toDelta: toAccountId ? destinationAmount : 0,
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
 * 1. Su saldo base inicial (initialBalance, o balance inicial como apertura)
 * 2. Todas las transacciones registradas en el Libro Mayor
 * 
 * Regla de Fuente Única de Verdad:
 * currentBalance = initialBalance + Sum(Incomes) - Sum(Expenses) + Sum(Transfers In) - Sum(Transfers Out)
 */
export function calculateAccountBalance(
  account: Account,
  transactions: Transaction[],
  accounts?: Account[],
  exchangeRates: Record<string, number> = DEFAULT_EXCHANGE_RATES
): number {
  const baseCents = toCents(account.initialBalance !== undefined ? account.initialBalance : account.balance);
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
        let incomingAmount = tx.amount;
        if (accounts) {
          const fromAcc = accounts.find(a => a.id === tx.accountId);
          if (fromAcc && fromAcc.currency && account.currency && fromAcc.currency !== account.currency) {
            incomingAmount = convertCurrency(tx.amount, fromAcc.currency, account.currency, exchangeRates);
          }
        }
        totalDeltaCents += toCents(incomingAmount);
      }
    }
  }

  return fromCents(baseCents + totalDeltaCents);
}

/**
 * Determina si una cuenta debe catalogarse como Pasivo.
 * Una cuenta es pasivo si:
 * 1. Su tipo es intrínsecamente pasivo ('credit' o 'debt')
 * 2. Su saldo es negativo (sobregiro o descubierto bancario)
 */
export function isLiabilityAccount(acc: Account): boolean {
  return acc.type === 'credit' || acc.type === 'debt' || acc.balance < 0;
}

/**
 * Desglosa el saldo de una cuenta en componente de Activo o Pasivo de forma matemáticamente exacta.
 */
export function getAccountAssetLiabilityBreakdown(acc: Account): {
  assetAmount: number;
  liabilityAmount: number;
} {
  const isLiabType = acc.type === 'credit' || acc.type === 'debt';
  if (isLiabType) {
    return {
      assetAmount: 0,
      liabilityAmount: Math.abs(acc.balance),
    };
  }

  if (acc.balance >= 0) {
    return {
      assetAmount: acc.balance,
      liabilityAmount: 0,
    };
  } else {
    return {
      assetAmount: 0,
      liabilityAmount: Math.abs(acc.balance),
    };
  }
}

/**
 * Calcula el patrimonio neto (Net Worth), separando activos y pasivos.
 * Activos: saldos de cuentas de activo con balance >= 0
 * Pasivos: deudas, tarjetas y saldos negativos de cuentas
 * Patrimonio Neto = Activos - Pasivos
 * Soporta consolidación multidivisa a divisa objetivo si las cuentas manejan distintas monedas.
 */
export function calculateNetWorth(
  accounts: Account[],
  targetCurrency = 'EUR',
  exchangeRates: Record<string, number> = DEFAULT_EXCHANGE_RATES
): {
  totalAssets: number;
  totalLiabilities: number;
  totalNetWorth: number;
  isMultiCurrency: boolean;
  currenciesPresent: string[];
} {
  let assetsCents = 0;
  let liabilitiesCents = 0;
  const currenciesSet = new Set<string>();

  for (const acc of accounts) {
    const cur = acc.currency || 'EUR';
    currenciesSet.add(cur);

    const breakdown = getAccountAssetLiabilityBreakdown(acc);
    // Convertir montos a la divisa de consolidación
    const convertedAsset = convertCurrency(breakdown.assetAmount, cur, targetCurrency, exchangeRates);
    const convertedLiability = convertCurrency(breakdown.liabilityAmount, cur, targetCurrency, exchangeRates);

    assetsCents += toCents(convertedAsset);
    liabilitiesCents += toCents(convertedLiability);
  }

  const totalAssets = fromCents(assetsCents);
  const totalLiabilities = fromCents(liabilitiesCents);
  const totalNetWorth = fromCents(assetsCents - liabilitiesCents);

  return {
    totalAssets,
    totalLiabilities,
    totalNetWorth,
    isMultiCurrency: currenciesSet.size > 1,
    currenciesPresent: Array.from(currenciesSet),
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
  const limitValue = budget.monthlyLimit ?? 0;
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
  transaction: Transaction,
  exchangeRates: Record<string, number> = DEFAULT_EXCHANGE_RATES
): Account[] {
  const impact = calculateTransactionImpact(transaction, accounts, exchangeRates);

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
  newTransaction: Transaction,
  exchangeRates: Record<string, number> = DEFAULT_EXCHANGE_RATES
): Account[] {
  // 1. Revertir transacción vieja
  const oldImpact = calculateTransactionImpact(oldTransaction, accounts, exchangeRates);
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
  const newImpact = calculateTransactionImpact(newTransaction, updatedAccounts, exchangeRates);
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
  transaction: Transaction,
  exchangeRates: Record<string, number> = DEFAULT_EXCHANGE_RATES
): Account[] {
  const impact = calculateTransactionImpact(transaction, accounts, exchangeRates);

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
 * Calcula el patrimonio neto agrupado por cada divisa presente en las cuentas.
 * Evita la suma distorsionada de valores heterogéneos (e.g. 100 EUR + 100 USD).
 * Separa con exactitud activos reales de pasivos reales.
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
    const breakdown = getAccountAssetLiabilityBreakdown(acc);
    result[cur].totalAssets = addMoney(result[cur].totalAssets, breakdown.assetAmount);
    result[cur].totalLiabilities = addMoney(result[cur].totalLiabilities, breakdown.liabilityAmount);
    result[cur].totalNetWorth = subtractMoney(result[cur].totalAssets, result[cur].totalLiabilities);
  }

  return result;
}

/**
 * Valida si una cuenta puede ser eliminada con seguridad o si tiene transacciones vinculadas.
 * Protege la integridad referencial y evita registros huérfanos en transferencias.
 */
export function canDeleteAccount(
  accountId: string,
  transactions: Transaction[]
): {
  canDelete: boolean;
  transactionCount: number;
  reason?: string;
} {
  const count = transactions.filter(
    tx => tx.accountId === accountId || tx.toAccountId === accountId
  ).length;

  if (count > 0) {
    return {
      canDelete: false,
      transactionCount: count,
      reason: `Esta cuenta está vinculada a ${count} transacciones en el Libro Mayor. Oculta la cuenta o reasigna las transacciones antes de eliminarla para preservar la trazabilidad contable.`,
    };
  }

  return { canDelete: true, transactionCount: 0 };
}

/**
 * Parsea con seguridad fechas estándar ISO o YYYY-MM-DD previniendo desfases por huso horario local.
 */
export function parseDateSafe(dateString: string): Date {
  if (!dateString) return new Date();
  if (dateString.length === 10) {
    return new Date(dateString + 'T12:00:00');
  }
  return new Date(dateString);
}

/**
 * Comprueba si una transacción pertenece a un periodo (formato YYYY-MM) de forma estricta.
 */
export function isDateInPeriod(dateString: string, period: string): boolean {
  if (!dateString || !period) return false;
  return dateString.slice(0, 7) === period;
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
  transactions: Transaction[],
  exchangeRates: Record<string, number> = DEFAULT_EXCHANGE_RATES
): {
  isHealthy: boolean;
  discrepancies: AccountReconciliationDiscrepancy[];
} {
  const discrepancies: AccountReconciliationDiscrepancy[] = [];

  for (const account of accounts) {
    const calculated = calculateAccountBalance(account, transactions, accounts, exchangeRates);
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

  return {
    isHealthy: discrepancies.length === 0,
    discrepancies,
  };
}

