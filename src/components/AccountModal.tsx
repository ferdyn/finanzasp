import React, { useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Account, AccountType } from '../types/finance';
import { DynamicIcon } from './DynamicIcon';
import { X, Check, Trash2 } from 'lucide-react';

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

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Por favor indica un nombre para la cuenta');
      return;
    }

    const parsedBalance = parseFloat(balanceStr.replace(',', '.'));
    if (isNaN(parsedBalance)) {
      setError('El saldo inicial debe ser un número válido');
      return;
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
      creditLimit: creditLimitStr ? parseFloat(creditLimitStr.replace(',', '.')) : undefined,
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
    if (accountToEdit && confirm('¿Estás seguro de eliminar esta cuenta?')) {
      const success = deleteAccount(accountToEdit.id);
      if (success !== false) {
        onClose();
      }
    }
  };

  return (
    <div 
      role="dialog"
      aria-modal="true"
      aria-labelledby="account-modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div 
        className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl shadow-2xl border-t sm:border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[90vh] pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Barra de arrastre móvil */}
        <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto my-2.5 sm:hidden shrink-0" aria-hidden="true" />

        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50">
          <h3 id="account-modal-title" className="font-bold text-lg text-slate-800 dark:text-white">
            {accountToEdit ? 'Editar Cuenta' : 'Nueva Cuenta'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal de cuenta"
            className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scroll-touch">
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
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {ACCOUNT_TYPES.map((t) => (
                <option key={t.type} value={t.type}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
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
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono-num font-bold text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono-num text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Color Distintivo
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform ${
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
      </div>
    </div>
  );
};
