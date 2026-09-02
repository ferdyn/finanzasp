import React, { useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Transaction, TransactionType } from '../types/finance';
import { DynamicIcon } from './DynamicIcon';
import { X, Check, ArrowRightLeft, TrendingDown, TrendingUp, Calendar, Tag, FileText, Trash2 } from 'lucide-react';
import { CURRENCIES } from '../utils/format';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionToEdit?: Transaction | null;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  transactionToEdit,
}) => {
  const { categories, accounts, currency, addTransaction, updateTransaction, deleteTransaction } = useFinance();

  const [type, setType] = useState<TransactionType>('expense');
  const [amountStr, setAmountStr] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [accountId, setAccountId] = useState<string>('');
  const [toAccountId, setToAccountId] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState<string>('');
  const [tagInput, setTagInput] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (transactionToEdit) {
      setType(transactionToEdit.type);
      setAmountStr(transactionToEdit.amount.toString());
      setCategoryId(transactionToEdit.categoryId);
      setAccountId(transactionToEdit.accountId);
      setToAccountId(transactionToEdit.toAccountId || '');
      setDate(transactionToEdit.date);
      setNote(transactionToEdit.note || '');
      setTags(transactionToEdit.tags || []);
      setIsRecurring(transactionToEdit.isRecurring || false);
    } else {
      setType('expense');
      setAmountStr('');
      const defaultExpCat = categories.find(c => c.type === 'expense');
      setCategoryId(defaultExpCat ? defaultExpCat.id : (categories[0]?.id || ''));
      setAccountId(accounts[0]?.id || '');
      setToAccountId(accounts[1]?.id || '');
      setDate(new Date().toISOString().split('T')[0]);
      setNote('');
      setTags([]);
      setIsRecurring(false);
    }
    setError('');
  }, [transactionToEdit, isOpen, categories, accounts]);

  if (!isOpen) return null;

  const filteredCategories = categories.filter(c => c.type === (type === 'transfer' ? 'expense' : type));
  const currSymbol = CURRENCIES[currency]?.symbol || '€';

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsedAmount = parseFloat(amountStr.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Por favor introduce un importe válido mayor a 0');
      return;
    }

    if (!accountId) {
      setError('Por favor selecciona una cuenta');
      return;
    }

    if (type === 'transfer' && (!toAccountId || toAccountId === accountId)) {
      setError('Selecciona una cuenta de destino diferente');
      return;
    }

    const payload = {
      amount: parsedAmount,
      type,
      categoryId: type === 'transfer' ? (categories.find(c => c.id === 'cat-inversiones')?.id || categoryId || categories[0].id) : categoryId,
      accountId,
      toAccountId: type === 'transfer' ? toAccountId : undefined,
      date,
      note: note.trim(),
      tags,
      isRecurring,
    };

    if (transactionToEdit) {
      updateTransaction(transactionToEdit.id, payload);
    } else {
      addTransaction(payload);
    }

    onClose();
  };

  const handleDelete = () => {
    if (transactionToEdit && confirm('¿Estás seguro de eliminar este movimiento?')) {
      deleteTransaction(transactionToEdit.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50">
          <h3 className="font-bold text-lg text-slate-800 dark:text-white">
            {transactionToEdit ? 'Editar Movimiento' : 'Nuevo Movimiento'}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 text-xs sm:text-sm font-medium rounded-xl border border-red-200 dark:border-red-800">
              {error}
            </div>
          )}

          {/* Selector de Tipo (Gasto / Ingreso / Transferencia) */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700">
            <button
              type="button"
              onClick={() => {
                setType('expense');
                const cat = categories.find(c => c.type === 'expense');
                if (cat) setCategoryId(cat.id);
              }}
              className={`flex items-center justify-center gap-1.5 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${
                type === 'expense'
                  ? 'bg-red-500 text-white shadow-md shadow-red-500/20'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <TrendingDown className="w-4 h-4" />
              <span>Gasto</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setType('income');
                const cat = categories.find(c => c.type === 'income');
                if (cat) setCategoryId(cat.id);
              }}
              className={`flex items-center justify-center gap-1.5 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${
                type === 'income'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Ingreso</span>
            </button>

            <button
              type="button"
              onClick={() => setType('transfer')}
              className={`flex items-center justify-center gap-1.5 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${
                type === 'transfer'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>Transferencia</span>
            </button>
          </div>

          {/* Importe */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Importe
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-400">
                {currSymbol}
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                placeholder="0.00"
                autoFocus
                className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-2xl font-bold text-slate-900 dark:text-white font-mono-num placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Selector de Categorías (Sólo para Gastos e Ingresos) */}
          {type !== 'transfer' && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Categoría
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800/50">
                {filteredCategories.map((cat) => {
                  const isSelected = categoryId === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategoryId(cat.id)}
                      className={`flex items-center gap-2 p-2 rounded-lg text-left text-xs font-semibold border transition-all ${
                        isSelected
                          ? 'bg-white dark:bg-slate-700 border-slate-900 dark:border-emerald-500 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-900 dark:ring-emerald-500'
                          : 'bg-white/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <div 
                        className="w-6 h-6 rounded-md flex items-center justify-center text-white shrink-0"
                        style={{ backgroundColor: cat.color }}
                      >
                        <DynamicIcon name={cat.icon} size={14} />
                      </div>
                      <span className="truncate">{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Selector de Cuentas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                {type === 'transfer' ? 'Cuenta Origen' : 'Cuenta'}
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.balance.toFixed(2)} {acc.currency})
                  </option>
                ))}
              </select>
            </div>

            {type === 'transfer' && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Cuenta Destino
                </label>
                <select
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Selecciona destino</option>
                  {accounts
                    .filter((acc) => acc.id !== accountId)
                    .map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({acc.balance.toFixed(2)} {acc.currency})
                      </option>
                    ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Fecha
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-3 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Nota */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Nota / Concepto
            </label>
            <div className="relative">
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ej. Supermercado semanal, Cena con amigos..."
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Etiquetas (Tags) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Etiquetas (Presiona Enter para añadir)
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                >
                  <Tag className="w-3 h-3" />
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-emerald-900 dark:hover:text-white"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              placeholder="Añadir etiqueta (ej. Viaje, Trabajo, Extra)..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Checkbox Recurrente */}
          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Movimiento Fijo / Periódico</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Marca si es un gasto recurrente como alquiler, nómina o suscripción</p>
            </div>
            <input
              type="checkbox"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded border-slate-300 dark:border-slate-600 focus:ring-emerald-500 cursor-pointer"
            />
          </div>

          {/* Botones de Acción */}
          <div className="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            {transactionToEdit && (
              <button
                type="button"
                onClick={handleDelete}
                className="p-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-800 transition-colors"
                title="Eliminar movimiento"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-700 text-sm font-semibold text-white shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{transactionToEdit ? 'Guardar Cambios' : 'Registrar'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
