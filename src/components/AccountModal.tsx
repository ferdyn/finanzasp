import React, { useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Account, AccountType } from '../types/finance';
import { DynamicIcon } from './DynamicIcon';
import { Check, Trash2 } from 'lucide-react';
import { BottomSheet } from './ui/BottomSheet';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountToEdit?: Account | null;
}

const ACCOUNT_TYPES: { type: AccountType; label: string; icon: string }[] = [
  { type: 'checking', label: 'Cuenta Corriente / Nómina', icon: 'Landmark' },
  { type: 'savings', label: 'Cuenta de Ahorro', icon: 'PiggyBank' },
  { type: 'investment', label: 'Inversión / Broker', icon: 'TrendingUp' },
  { type: 'credit', label: 'Tarjeta de Crédito', icon: 'CreditCard' },
  { type: 'cash', label: 'Efectivo / Billetera', icon: 'Banknote' },
  { type: 'crypto', label: 'Criptomonedas', icon: 'Coins' },
  { type: 'debt', label: 'Préstamo / Deuda', icon: 'Receipt' },
];

const COLOR_OPTIONS = [
  '#004481', '#10b981', '#8b5cf6', '#f59e0b', '#0ea5e9', 
  '#ec4899', '#ef4444', '#059669', '#6366f1', '#64748b'
];

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  accountToEdit,
}) => {
  const { currency, addAccount, updateAccount, deleteAccount } = useFinance();

  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('checking');
  const [balanceStr, setBalanceStr] = useState('');
  const [institution, setInstitution] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [color, setColor] = useState(COLOR_OPTIONS[0]);
  const [icon, setIcon] = useState('Landmark');
  const [creditLimitStr, setCreditLimitStr] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (accountToEdit) {
      setName(accountToEdit.name);
      setType(accountToEdit.type);
      setBalanceStr(accountToEdit.balance.toString());
      setInstitution(accountToEdit.institution || '');
      setAccountNumber(accountToEdit.accountNumber || '');
      setColor(accountToEdit.color || COLOR_OPTIONS[0]);
      setIcon(accountToEdit.icon || 'Landmark');
      setCreditLimitStr(accountToEdit.creditLimit?.toString() || '');
    } else {
      setName('');
      setType('checking');
      setBalanceStr('0');
      setInstitution('');
      setAccountNumber('');
      setColor(COLOR_OPTIONS[0]);
      setIcon('Landmark');
      setCreditLimitStr('');
    }
    setError('');
  }, [accountToEdit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('El nombre de la cuenta es obligatorio');
      return;
    }

    const parsedBalance = parseFloat(balanceStr.replace(',', '.'));
    if (isNaN(parsedBalance)) {
      setError('Por favor introduce un saldo válido');
      return;
    }

    let parsedCreditLimit: number | undefined = undefined;
    if (type === 'credit' && creditLimitStr) {
      parsedCreditLimit = parseFloat(creditLimitStr.replace(',', '.'));
      if (isNaN(parsedCreditLimit) || parsedCreditLimit < 0) {
        setError('El límite de crédito debe ser un número positivo');
        return;
      }
    }

    const payload = {
      name: name.trim(),
      type,
      balance: parsedBalance,
      currency,
      color,
      icon,
      institution: institution.trim() || undefined,
      accountNumber: accountNumber.trim() || undefined,
      creditLimit: parsedCreditLimit,
    };

    if (accountToEdit) {
      updateAccount(accountToEdit.id, payload);
    } else {
      addAccount({
        ...payload,
        initialBalance: parsedBalance,
      });
    }

    onClose();
  };

  const handleDelete = () => {
    if (!accountToEdit) return;
    if (window.confirm(`¿Estás seguro de que deseas eliminar la cuenta "${accountToEdit.name}"? Sus transacciones seguirán existiendo en el historial.`)) {
      deleteAccount(accountToEdit.id);
      onClose();
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={accountToEdit ? 'Editar Cuenta' : 'Nueva Cuenta'}
      description="Gestiona tus activos, cuentas corrientes y tarjetas"
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 text-xs sm:text-sm font-medium rounded-xl border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            Nombre de la Cuenta
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. BBVA Nómina, Santander Ahorro..."
            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            Tipo de Cuenta
          </label>
          <select
            value={type}
            onChange={(e) => {
              const selected = e.target.value as AccountType;
              setType(selected);
              const matching = ACCOUNT_TYPES.find(t => t.type === selected);
              if (matching) setIcon(matching.icon);
            }}
            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
          >
            {ACCOUNT_TYPES.map((t) => (
              <option key={t.type} value={t.type}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Saldo Actual ({currency})
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={balanceStr}
              onChange={(e) => setBalanceStr(e.target.value)}
              placeholder="0.00"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono-num font-bold text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Entidad / Banco
            </label>
            <input
              type="text"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              placeholder="Ej. BBVA, CaixaBank..."
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {type === 'credit' && (
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Límite de Crédito ({currency})
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={creditLimitStr}
              onChange={(e) => setCreditLimitStr(e.target.value)}
              placeholder="3000"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono-num text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            Color Distintivo
          </label>
          <div className="flex items-center gap-2.5 flex-wrap">
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                aria-label={`Seleccionar color ${c}`}
                className={`w-8 h-8 rounded-full transition-transform ${
                  color === c ? 'scale-125 ring-2 ring-slate-800 dark:ring-white ring-offset-2 dark:ring-offset-slate-900' : 'hover:scale-110'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 pb-1">
          {accountToEdit && (
            <button
              type="button"
              onClick={handleDelete}
              aria-label="Eliminar esta cuenta"
              className="p-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-800 transition-colors min-w-[48px] min-h-[48px] flex items-center justify-center active:scale-95"
              title="Eliminar cuenta"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors min-h-[48px] active:scale-[0.98]"
          >
            Cancelar
          </button>

          <button
            type="submit"
            className="flex-1 py-3 px-4 rounded-xl bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-700 text-sm font-semibold text-white shadow-md transition-all flex items-center justify-center gap-2 min-h-[48px] active:scale-[0.98]"
          >
            <Check className="w-4 h-4" />
            <span>{accountToEdit ? 'Guardar' : 'Crear Cuenta'}</span>
          </button>
        </div>
      </form>
    </BottomSheet>
  );
};
