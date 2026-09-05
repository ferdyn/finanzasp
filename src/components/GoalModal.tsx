import React, { useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { SavingsGoal } from '../types/finance';
import confetti from 'canvas-confetti';
import { Check, Trash2, PiggyBank, PlusCircle } from 'lucide-react';
import { CURRENCIES, formatMoney } from '../utils/format';
import { BottomSheet } from './ui/BottomSheet';

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  goalToEdit?: SavingsGoal | null;
  mode?: 'create' | 'edit' | 'contribute';
}

const GOAL_COLORS = ['#10b981', '#ec4899', '#3b82f6', '#8b5cf6', '#f59e0b', '#06b6d4', '#6366f1'];

export const GoalModal: React.FC<GoalModalProps> = ({
  isOpen,
  onClose,
  goalToEdit,
  mode = 'create',
}) => {
  const { currency, accounts, addGoal, updateGoal, contributeToGoal, deleteGoal } = useFinance();

  const [name, setName] = useState('');
  const [targetAmountStr, setTargetAmountStr] = useState('');
  const [currentAmountStr, setCurrentAmountStr] = useState('0');
  const [deadline, setDeadline] = useState('');
  const [category, setCategory] = useState('');
  const [notes, setNotes] = useState('');
  const [color, setColor] = useState(GOAL_COLORS[0]);
  const [icon, setIcon] = useState('ShieldCheck');

  // Aportación
  const [contributionAmount, setContributionAmount] = useState('');
  const [fromAccountId, setFromAccountId] = useState(accounts[0]?.id || '');
  const [error, setError] = useState('');

  useEffect(() => {
    if (goalToEdit) {
      setName(goalToEdit.name);
      setTargetAmountStr(goalToEdit.targetAmount.toString());
      setCurrentAmountStr(goalToEdit.currentAmount.toString());
      setDeadline(goalToEdit.deadline || '');
      setCategory(goalToEdit.category || '');
      setNotes(goalToEdit.notes || '');
      setColor(goalToEdit.color || GOAL_COLORS[0]);
      setIcon(goalToEdit.icon || 'ShieldCheck');
      setContributionAmount('');
    } else {
      setName('');
      setTargetAmountStr('');
      setCurrentAmountStr('0');
      setDeadline('');
      setCategory('General');
      setNotes('');
      setColor(GOAL_COLORS[0]);
      setIcon('ShieldCheck');
      setContributionAmount('');
    }
    setError('');
  }, [goalToEdit, isOpen]);

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('El nombre de la meta es obligatorio');
      return;
    }

    const parsedTarget = parseFloat(targetAmountStr.replace(',', '.'));
    if (isNaN(parsedTarget) || parsedTarget <= 0) {
      setError('Introduce un monto objetivo mayor a 0');
      return;
    }

    const parsedCurrent = parseFloat(currentAmountStr.replace(',', '.')) || 0;

    const payload = {
      name: name.trim(),
      targetAmount: parsedTarget,
      currentAmount: parsedCurrent,
      deadline: deadline || undefined,
      category: category.trim() || undefined,
      notes: notes.trim() || undefined,
      color,
      icon,
    };

    if (goalToEdit) {
      updateGoal(goalToEdit.id, payload);
    } else {
      addGoal(payload);
    }

    onClose();
  };

  const handleContribute = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!goalToEdit) return;

    const parsedAmount = parseFloat(contributionAmount.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Introduce un importe de aportación válido mayor a 0');
      return;
    }

    contributeToGoal(goalToEdit.id, parsedAmount, fromAccountId || undefined);

    if (goalToEdit.currentAmount + parsedAmount >= goalToEdit.targetAmount) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}
    }

    onClose();
  };

  const handleDelete = () => {
    if (!goalToEdit) return;
    if (window.confirm(`¿Estás seguro de que deseas eliminar la meta "${goalToEdit.name}"?`)) {
      deleteGoal(goalToEdit.id);
      onClose();
    }
  };

  const currSymbol = CURRENCIES[currency]?.symbol || '€';

  // Modo Aportación
  if (mode === 'contribute' && goalToEdit) {
    const remaining = Math.max(0, goalToEdit.targetAmount - goalToEdit.currentAmount);

    return (
      <BottomSheet
        isOpen={isOpen}
        onClose={onClose}
        title={
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <PiggyBank className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-800 dark:text-white leading-tight">Aportar a Meta</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate max-w-[200px]">{goalToEdit.name}</p>
            </div>
          </div>
        }
        maxWidth="max-w-md"
      >
        <form onSubmit={handleContribute} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 text-xs font-medium rounded-xl border border-red-200 dark:border-red-800">
              {error}
            </div>
          )}

          <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Acumulado actual</p>
              <p className="text-base font-bold text-slate-800 dark:text-white font-mono-num">
                {formatMoney(goalToEdit.currentAmount, currency)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Faltante</p>
              <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono-num">
                {formatMoney(remaining, currency)}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Importe de Aportación
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-slate-400 dark:text-slate-500">
                {currSymbol}
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={contributionAmount}
                onChange={(e) => setContributionAmount(e.target.value)}
                placeholder="100.00"
                autoFocus
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xl font-bold font-mono-num text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Descontar de Cuenta
            </label>
            <select
              value={fromAccountId}
              onChange={(e) => setFromAccountId(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
            >
              <option value="">No registrar movimiento automático</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.balance.toFixed(2)} {acc.currency})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 pb-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors min-h-[48px] active:scale-[0.98]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-sm font-semibold text-white shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 min-h-[48px] active:scale-[0.98]"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Confirmar Aporte</span>
            </button>
          </div>
        </form>
      </BottomSheet>
    );
  }

  // Modo Crear / Editar Meta
  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={goalToEdit ? 'Editar Meta de Ahorro' : 'Nueva Meta de Ahorro'}
      description="Planifica tus metas de ahorro e inversión futura"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSaveGoal} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 text-xs sm:text-sm font-medium rounded-xl border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            Nombre de la Meta
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Vacaciones, Entrada Casa, Fondo Emergencia..."
            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            autoFocus
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Monto Objetivo ({currSymbol})
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={targetAmountStr}
              onChange={(e) => setTargetAmountStr(e.target.value)}
              placeholder="5000"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono-num font-bold text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Ahorrado Inicial ({currSymbol})
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={currentAmountStr}
              onChange={(e) => setCurrentAmountStr(e.target.value)}
              placeholder="0"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono-num text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Fecha Límite (Opcional)
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Categoría
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Ej. Viajes, Hogar..."
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            Color Distintivo
          </label>
          <div className="flex items-center gap-2.5 flex-wrap">
            {GOAL_COLORS.map((c) => (
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

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            Notas / Motivación
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="¿Por qué es importante este objetivo?..."
            rows={2}
            className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 pb-1">
          {goalToEdit && (
            <button
              type="button"
              onClick={handleDelete}
              aria-label="Eliminar esta meta de ahorro"
              className="p-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-800 transition-colors min-w-[48px] min-h-[48px] flex items-center justify-center active:scale-95"
              title="Eliminar meta"
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
            <span>Guardar Meta</span>
          </button>
        </div>
      </form>
    </BottomSheet>
  );
};
