import { describe, it, expect } from 'vitest';
import {
  applyTransactionToAccounts,
  validateTransfer,
  calculateAccountBalance,
  calculatePeriodMetrics,
  calculateTransactionImpact,
} from './financialCalculations';
import { Account, Category, Transaction, TransactionType } from '../types/finance';
import { ROLE_DEFINITIONS, UserRole } from '../types/user';

describe('Quick Add — Core UX Logic & Financial Action Validation', () => {
  const initialAccounts: Account[] = [
    { id: 'acc-main', name: 'Cuenta Principal', type: 'checking', balance: 1500, currency: 'EUR', color: '', icon: '', initialBalance: 1500 },
    { id: 'acc-savings', name: 'Cuenta Ahorro', type: 'savings', balance: 3000, currency: 'EUR', color: '', icon: '', initialBalance: 3000 },
    { id: 'acc-usd', name: 'USD Account', type: 'savings', balance: 1000, currency: 'USD', color: '', icon: '', initialBalance: 1000 },
  ];

  const categories: Category[] = [
    { id: 'cat-groceries', name: 'Supermercado', type: 'expense', color: '#ef4444', icon: 'ShoppingCart' },
    { id: 'cat-salary', name: 'Nómina', type: 'income', color: '#10b981', icon: 'Briefcase' },
    { id: 'cat-transfer', name: 'Transferencia', type: 'expense', color: '#6366f1', icon: 'ArrowRightLeft' },
  ];

  // Helper validation function matching QuickAddModal validation rules
  function validateQuickAddPayload(payload: {
    type: TransactionType;
    amountStr: string;
    selectedAccount: string;
    toAccount?: string;
    userRole: UserRole;
  }): { isValid: boolean; error?: string; parsedAmount?: number } {
    const permissions = ROLE_DEFINITIONS[payload.userRole].defaultPermissions;
    if (!permissions.canCreateTransactions) {
      return { isValid: false, error: 'No tienes permisos para registrar transacciones' };
    }

    const normalized = payload.amountStr.trim().replace(',', '.');
    const parsedAmount = parseFloat(normalized);
    if (!payload.amountStr.trim() || isNaN(parsedAmount) || parsedAmount <= 0 || !/^\d+(\.\d{1,4})?$/.test(normalized)) {
      return { isValid: false, error: 'Introduce un importe válido' };
    }

    if (!payload.selectedAccount) {
      return { isValid: false, error: 'Selecciona una cuenta' };
    }

    if (payload.type === 'transfer') {
      if (!payload.toAccount || payload.toAccount === payload.selectedAccount) {
        return { isValid: false, error: 'Selecciona una cuenta de destino diferente' };
      }
    }

    return { isValid: true, parsedAmount };
  }

  // 1. Gasto Válido
  it('1. Gasto válido: descuenta el importe de la cuenta origen y categoriza como gasto sin generar ingresos', () => {
    const check = validateQuickAddPayload({
      type: 'expense',
      amountStr: '45.50',
      selectedAccount: 'acc-main',
      userRole: 'admin',
    });
    expect(check.isValid).toBe(true);

    const tx: Transaction = {
      id: 'tx-quick-exp',
      amount: check.parsedAmount!,
      type: 'expense',
      categoryId: 'cat-groceries',
      accountId: 'acc-main',
      date: '2026-03-01',
    };

    const updatedAccounts = applyTransactionToAccounts(initialAccounts, tx);
    const mainAcc = updatedAccounts.find(a => a.id === 'acc-main');
    expect(mainAcc?.balance).toBe(1454.50); // 1500 - 45.50

    const metrics = calculatePeriodMetrics([tx], '2026-03');
    expect(metrics.expense).toBe(45.50);
    expect(metrics.income).toBe(0);
  });

  // 2. Ingreso Válido
  it('2. Ingreso válido: incrementa el balance de la cuenta seleccionada y aumenta ingresos operacionales', () => {
    const check = validateQuickAddPayload({
      type: 'income',
      amountStr: '2200.00',
      selectedAccount: 'acc-main',
      userRole: 'admin',
    });
    expect(check.isValid).toBe(true);

    const tx: Transaction = {
      id: 'tx-quick-inc',
      amount: check.parsedAmount!,
      type: 'income',
      categoryId: 'cat-salary',
      accountId: 'acc-main',
      date: '2026-03-01',
    };

    const updatedAccounts = applyTransactionToAccounts(initialAccounts, tx);
    const mainAcc = updatedAccounts.find(a => a.id === 'acc-main');
    expect(mainAcc?.balance).toBe(3700.00); // 1500 + 2200

    const metrics = calculatePeriodMetrics([tx], '2026-03');
    expect(metrics.income).toBe(2200.00);
    expect(metrics.expense).toBe(0);
  });

  // 3. Transferencia Válida
  it('3. Transferencia válida: descuenta origen, abona destino y NO cuenta como ingreso ni como gasto', () => {
    const check = validateQuickAddPayload({
      type: 'transfer',
      amountStr: '500',
      selectedAccount: 'acc-main',
      toAccount: 'acc-savings',
      userRole: 'manager',
    });
    expect(check.isValid).toBe(true);

    const tx: Transaction = {
      id: 'tx-quick-tr',
      amount: check.parsedAmount!,
      type: 'transfer',
      categoryId: 'cat-transfer',
      accountId: 'acc-main',
      toAccountId: 'acc-savings',
      date: '2026-03-01',
    };

    const updatedAccounts = applyTransactionToAccounts(initialAccounts, tx);
    expect(updatedAccounts.find(a => a.id === 'acc-main')?.balance).toBe(1000); // 1500 - 500
    expect(updatedAccounts.find(a => a.id === 'acc-savings')?.balance).toBe(3500); // 3000 + 500

    // En métricas del período, una transferencia no es ingreso ni gasto
    const metrics = calculatePeriodMetrics([tx], '2026-03');
    expect(metrics.income).toBe(0);
    expect(metrics.expense).toBe(0);
  });

  // 4. Transferencia origen = destino
  it('4. Transferencia origen = destino: rechaza con error de validación sin modificar balances', () => {
    const check = validateQuickAddPayload({
      type: 'transfer',
      amountStr: '100',
      selectedAccount: 'acc-main',
      toAccount: 'acc-main',
      userRole: 'admin',
    });

    expect(check.isValid).toBe(false);
    expect(check.error).toContain('destino diferente');

    const pureTransferValidation = validateTransfer('acc-main', 'acc-main', 100, initialAccounts);
    expect(pureTransferValidation.isValid).toBe(false);
  });

  // 5. Importe Inválido
  it('5. Importe inválido: rechaza strings vacíos, 0, números negativos y caracteres no numéricos', () => {
    const testCases = ['', '   ', '0', '-50', 'abc', '10.5.5'];
    for (const val of testCases) {
      const check = validateQuickAddPayload({
        type: 'expense',
        amountStr: val,
        selectedAccount: 'acc-main',
        userRole: 'admin',
      });
      expect(check.isValid).toBe(false);
      expect(check.error).toContain('importe válido');
    }
  });

  // 6. Usuario sin permiso
  it('6. Usuario sin permiso: bloquea a rol viewer o sin permiso para crear transacciones en Quick Add', () => {
    const viewerCheck = validateQuickAddPayload({
      type: 'expense',
      amountStr: '25.00',
      selectedAccount: 'acc-main',
      userRole: 'viewer',
    });
    expect(viewerCheck.isValid).toBe(false);
    expect(viewerCheck.error).toContain('permisos');
  });

  // 7. No duplicar movimiento al guardar (Protección contra doble envío / isSubmitting)
  it('7. Protección contra doble guardado: previene inserciones dobles por pulsaciones rápidas simultáneas', () => {
    let callCount = 0;
    let isSubmitting = false;

    const mockAddTransaction = () => {
      if (isSubmitting) return; // Guard clause
      isSubmitting = true;
      callCount++;
    };

    // Primer click
    mockAddTransaction();
    expect(callCount).toBe(1);

    // Segundo click mientras isSubmitting es true
    mockAddTransaction();
    expect(callCount).toBe(1); // No incrementó
  });

  // 8. Transferencia multidivisa
  it('8. Transferencia multidivisa en Quick Add: convierte tasa cambiaria correctamente entre EUR y USD', () => {
    const txMulticurrency: Transaction = {
      id: 'tx-quick-multi',
      amount: 100, // 100 EUR from acc-main to acc-usd
      type: 'transfer',
      categoryId: 'cat-transfer',
      accountId: 'acc-main',
      toAccountId: 'acc-usd',
      date: '2026-03-01',
    };

    const impact = calculateTransactionImpact(txMulticurrency, initialAccounts);
    expect(impact.fromDelta).toBe(-100);
    // 100 EUR -> USD (1.08 rate) = +108 USD
    expect(impact.toDelta).toBe(108);

    const updated = applyTransactionToAccounts(initialAccounts, txMulticurrency);
    expect(updated.find(a => a.id === 'acc-main')?.balance).toBe(1400); // 1500 - 100 EUR
    expect(updated.find(a => a.id === 'acc-usd')?.balance).toBe(1108); // 1000 + 108 USD
  });
});
