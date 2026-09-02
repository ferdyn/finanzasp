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
      addAccount(payload);
    }

    onClose();
  };

  const handleDelete = () => {
    if (accountToEdit && confirm('¿Estás seguro de eliminar esta cuenta?')) {
      deleteAccount(accountToEdit.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <h3 className="font-bold text-lg text-slate-800">
            {accountToEdit ? 'Editar Cuenta' : 'Nueva Cuenta'}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-xs sm:text-sm font-medium rounded-xl border border-red-200">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Nombre de la Cuenta
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. BBVA Nómina, Santander Ahorro..."
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
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
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Saldo Actual ({currency})
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={balanceStr}
                onChange={(e) => setBalanceStr(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono-num font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Entidad / Banco
              </label>
              <input
                type="text"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="Ej. BBVA, CaixaBank..."
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {type === 'credit' && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Límite de Crédito ({currency})
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={creditLimitStr}
                onChange={(e) => setCreditLimitStr(e.target.value)}
                placeholder="3000"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono-num text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Color Distintivo
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    color === c ? 'scale-125 ring-2 ring-slate-800 ring-offset-2' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
            {accountToEdit && (
              <button
                type="button"
                onClick={handleDelete}
                className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl border border-red-200 transition-colors"
                title="Eliminar cuenta"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-sm font-semibold text-white shadow-md transition-all flex items-center justify-center gap-1.5"
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
