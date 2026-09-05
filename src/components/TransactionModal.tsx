import React, { useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useUser } from '../context/UserContext';
import { ROLE_DEFINITIONS } from '../types/user';
import { Transaction, TransactionTemplate, TransactionType } from '../types/finance';
import { DynamicIcon } from './DynamicIcon';
import { 
  Check, ArrowRightLeft, TrendingDown, TrendingUp, Tag,
  Trash2, Bookmark, BookmarkPlus, Sparkles, ShieldAlert,
  Loader2, ShieldCheck, Info, X
} from 'lucide-react';
import { CURRENCIES, formatMoney } from '../utils/format';
import { TransactionReceiptModal } from './TransactionReceiptModal';
import { BottomSheet } from './ui/BottomSheet';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionToEdit?: Transaction | null;
  initialData?: Partial<Transaction> | null;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  transactionToEdit,
  initialData,
}) => {
  const { 
    categories, 
    accounts, 
    currency, 
    addTransaction, 
    updateTransaction, 
    deleteTransaction,
    templates,
    addTemplate,
    deleteTemplate,
  } = useFinance();

  const { currentUser, hasPermission } = useUser();

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

  // Estados para Plantillas
  const [saveAsTemplate, setSaveAsTemplate] = useState<boolean>(false);
  const [templateName, setTemplateName] = useState<string>('');
  const [showSaveTemplateBox, setShowSaveTemplateBox] = useState<boolean>(false);
  const [inlineTemplateName, setInlineTemplateName] = useState<string>('');
  const [saveTemplateError, setSaveTemplateError] = useState<string>('');
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [savedTxForReceipt, setSavedTxForReceipt] = useState<Transaction | null>(null);

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
      setType(initialData?.type || 'expense');
      setAmountStr(initialData?.amount !== undefined ? initialData.amount.toString() : '');
      const defaultExpCat = categories.find(c => c.type === 'expense');
      setCategoryId(initialData?.categoryId || (defaultExpCat ? defaultExpCat.id : (categories[0]?.id || '')));
      setAccountId(initialData?.accountId || (accounts[0]?.id || ''));
      setToAccountId(initialData?.toAccountId || (accounts[1]?.id || ''));
      setDate(initialData?.date || new Date().toISOString().split('T')[0]);
      setNote(initialData?.note || '');
      setTags(initialData?.tags || []);
      setIsRecurring(initialData?.isRecurring || false);
    }
    setError('');
    setSaveAsTemplate(false);
    setTemplateName('');
    setShowSaveTemplateBox(false);
    setInlineTemplateName('');
    setSaveTemplateError('');
    setActiveTemplateId(null);
    setToastMessage(null);
  }, [transactionToEdit, initialData, isOpen, categories, accounts]);

  const filteredCategories = categories.filter(c => c.type === (type === 'transfer' ? 'expense' : type));
  const currSymbol = CURRENCIES[currency]?.symbol || '€';

  const liveParsedAmount = parseFloat(amountStr.replace(',', '.'));
  const isAmountValid = !isNaN(liveParsedAmount) && liveParsedAmount > 0;
  const isAmountInvalid = amountStr.trim() !== '' && (!isAmountValid || liveParsedAmount <= 0);

  const fromAcc = accounts.find(a => a.id === accountId);
  const toAcc = accounts.find(a => a.id === toAccountId);

  const handleApplyTemplate = (tmpl: TransactionTemplate) => {
    setType(tmpl.type);
    setAmountStr(tmpl.amount > 0 ? tmpl.amount.toString() : '');
    setCategoryId(tmpl.categoryId);
    setAccountId(tmpl.accountId);
    if (tmpl.toAccountId) {
      setToAccountId(tmpl.toAccountId);
    }
    setNote(tmpl.note || '');
    setTags(tmpl.tags ? [...tmpl.tags] : []);
    setIsRecurring(!!tmpl.isRecurring);
    setActiveTemplateId(tmpl.id);
    setToastMessage(`Plantilla "${tmpl.name}" cargada`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSaveCurrentAsTemplate = () => {
    setSaveTemplateError('');
    const parsedAmount = parseFloat(amountStr.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setSaveTemplateError('Introduce un importe válido para guardar la plantilla');
      return;
    }
    if (!accountId) {
      setSaveTemplateError('Selecciona una cuenta para la plantilla');
      return;
    }
    if (type === 'transfer' && (!toAccountId || toAccountId === accountId)) {
      setSaveTemplateError('Selecciona una cuenta de destino diferente');
      return;
    }

    const defaultSuggestedName = note.trim() || categories.find(c => c.id === categoryId)?.name || 'Plantilla personalizada';
    const finalName = inlineTemplateName.trim() || defaultSuggestedName;

    const newTmpl = addTemplate({
      name: finalName,
      type,
      amount: parsedAmount,
      categoryId: type === 'transfer' ? (categories.find(c => c.id === 'cat-inversiones')?.id || categoryId || categories[0].id) : categoryId,
      accountId,
      toAccountId: type === 'transfer' ? toAccountId : undefined,
      note: note.trim(),
      tags: [...tags],
      isRecurring,
    });

    setActiveTemplateId(newTmpl.id);
    setShowSaveTemplateBox(false);
    setInlineTemplateName('');
    setToastMessage(`Plantilla "${finalName}" guardada`);
    setTimeout(() => setToastMessage(null), 3000);
  };

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

    const targetCategoryId = type === 'transfer' 
      ? (categories.find(c => c.id === 'cat-inversiones')?.id || categoryId || categories[0].id) 
      : categoryId;

    const payload = {
      amount: parsedAmount,
      type,
      categoryId: targetCategoryId,
      accountId,
      toAccountId: type === 'transfer' ? toAccountId : undefined,
      date,
      note: note.trim(),
      tags,
      isRecurring,
    };

    if (saveAsTemplate) {
      const defaultSuggestedName = note.trim() || categories.find(c => c.id === categoryId)?.name || 'Plantilla periódica';
      const finalName = templateName.trim() || defaultSuggestedName;
      addTemplate({
        name: finalName,
        type,
        amount: parsedAmount,
        categoryId: targetCategoryId,
        accountId,
        toAccountId: type === 'transfer' ? toAccountId : undefined,
        note: note.trim(),
        tags: [...tags],
        isRecurring,
      });
    }

    setIsProcessing(true);

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate(15); } catch {}
    }

    setTimeout(() => {
      if (transactionToEdit) {
        updateTransaction(transactionToEdit.id, payload);
        setIsProcessing(false);
        onClose();
      } else {
        const createdTx = addTransaction(payload);
        setIsProcessing(false);
        setSavedTxForReceipt(createdTx);
      }
    }, 400);
  };

  const handleDelete = () => {
    if (transactionToEdit && confirm('¿Estás seguro de eliminar este movimiento?')) {
      deleteTransaction(transactionToEdit.id);
      onClose();
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <span className="text-base sm:text-lg font-bold text-slate-800 dark:text-white">
            {transactionToEdit ? 'Editar Movimiento' : 'Nuevo Movimiento'}
          </span>
          {activeTemplateId && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300">
              <Bookmark className="w-3 h-3" />
              Plantilla activa
            </span>
          )}
        </div>
      }
      headerAction={
        <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg mr-1">
          <span>{currentUser.avatar}</span>
          <span className="truncate max-w-[90px]">{currentUser.name}</span>
        </span>
      }
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Advertencia si no tiene permiso */}
        {!hasPermission(transactionToEdit ? 'canEditTransactions' : 'canCreateTransactions') && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 rounded-xl text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>Tu rol ({ROLE_DEFINITIONS[currentUser.role]?.name}) tiene restringida la modificación de movimientos.</span>
          </div>
        )}

        {/* Toast / Banner Informativo */}
        {toastMessage && (
          <div className="flex items-center justify-between gap-2 p-2.5 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs font-semibold animate-in fade-in slide-in-from-top-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{toastMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="p-1 hover:bg-emerald-100 dark:hover:bg-emerald-900 rounded-lg transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 text-xs sm:text-sm font-medium rounded-xl border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}

        {/* Sección de Plantillas Rápidas */}
        <div className="bg-slate-50/90 dark:bg-slate-800/60 rounded-xl p-3 border border-slate-200/80 dark:border-slate-700/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                Plantillas Rápidas
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                {templates.length}
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowSaveTemplateBox(!showSaveTemplateBox);
                setSaveTemplateError('');
                if (!inlineTemplateName) {
                  setInlineTemplateName(note || categories.find(c => c.id === categoryId)?.name || '');
                }
              }}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
            >
              <BookmarkPlus className="w-3.5 h-3.5" />
              <span>{showSaveTemplateBox ? 'Cerrar guardado' : 'Guardar actual como plantilla'}</span>
            </button>
          </div>

          {/* Formulario desplegable para guardar la transacción actual como plantilla */}
          {showSaveTemplateBox && (
            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-emerald-300 dark:border-emerald-700/70 shadow-sm space-y-2.5 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-800 dark:text-slate-100">
                  Nombre de la plantilla
                </label>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">Guarda tipo, categoría, cuenta e importe</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={inlineTemplateName}
                  onChange={(e) => setInlineTemplateName(e.target.value)}
                  placeholder={note || categories.find(c => c.id === categoryId)?.name || 'Ej. Alquiler mensual, Compra Mercadona...'}
                  className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleSaveCurrentAsTemplate}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors shrink-0 flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Guardar</span>
                </button>
              </div>
              {saveTemplateError && (
                <p className="text-[11px] text-red-600 dark:text-red-400 font-medium">{saveTemplateError}</p>
              )}
            </div>
          )}

          {/* Lista horizontal de plantillas */}
          {templates.length > 0 ? (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5">
              {templates.map((tmpl) => {
                const cat = categories.find(c => c.id === tmpl.categoryId);
                const isSelected = activeTemplateId === tmpl.id;
                return (
                  <div
                    key={tmpl.id}
                    className={`group relative flex items-center gap-2 pl-2.5 pr-2 py-1.5 rounded-xl border text-xs shrink-0 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white dark:bg-slate-900 border-emerald-500 dark:border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm'
                        : 'bg-white/90 dark:bg-slate-900/90 border-slate-200/90 dark:border-slate-700/90 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm'
                    }`}
                    onClick={() => handleApplyTemplate(tmpl)}
                    title={`Clic para rellenar el formulario con "${tmpl.name}"`}
                  >
                    <div
                      className="w-5 h-5 rounded-md flex items-center justify-center text-white shrink-0"
                      style={{ backgroundColor: cat?.color || '#10b981' }}
                    >
                      <DynamicIcon name={cat?.icon || 'Tag'} size={12} />
                    </div>

                    <div className="flex flex-col text-left">
                      <span className="font-bold text-slate-800 dark:text-slate-100 truncate max-w-[130px] leading-tight">
                        {tmpl.name}
                      </span>
                      <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 font-mono-num">
                        <span className={tmpl.type === 'expense' ? 'text-red-500' : tmpl.type === 'income' ? 'text-emerald-500' : 'text-blue-500'}>
                          {tmpl.type === 'expense' ? '-' : tmpl.type === 'income' ? '+' : '↔'}
                        </span>
                        <span>{formatMoney(tmpl.amount, currency)}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`¿Eliminar la plantilla "${tmpl.name}"?`)) {
                          deleteTemplate(tmpl.id);
                          if (activeTemplateId === tmpl.id) setActiveTemplateId(null);
                        }
                      }}
                      className="ml-1 p-1 text-slate-300 hover:text-red-500 dark:text-slate-600 dark:hover:text-red-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Eliminar plantilla"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-[11px] text-slate-400 dark:text-slate-500 italic py-1">
              No hay plantillas creadas. Guarda tus transacciones habituales para rellenar este formulario al instante con 1 clic.
            </p>
          )}
        </div>

        {/* Selector de Tipo (Gasto / Ingreso / Transferencia) */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700">
          <button
            type="button"
            onClick={() => {
              setType('expense');
              const cat = categories.find(c => c.type === 'expense');
              if (cat) setCategoryId(cat.id);
            }}
            className={`flex items-center justify-center gap-1.5 py-2.5 text-xs sm:text-sm font-bold rounded-lg transition-all min-h-[44px] ${
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
            className={`flex items-center justify-center gap-1.5 py-2.5 text-xs sm:text-sm font-bold rounded-lg transition-all min-h-[44px] ${
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
            className={`flex items-center justify-center gap-1.5 py-2.5 text-xs sm:text-sm font-bold rounded-lg transition-all min-h-[44px] ${
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
          <label htmlFor="transaction-amount-input" className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            Importe
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-400">
              {currSymbol}
            </span>
            <input
              id="transaction-amount-input"
              type="text"
              inputMode="decimal"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              placeholder="0.00"
              autoFocus
              className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-2xl font-bold text-slate-900 dark:text-white font-mono-num placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Acceso Rápido a Importes Frecuentes (Ideal para móvil con una sola mano) */}
          <div className="flex items-center gap-1.5 mt-2 overflow-x-auto no-scrollbar py-0.5">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 shrink-0 mr-0.5">
              Rápido:
            </span>
            {[5, 10, 20, 50, 100].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => {
                  const current = parseFloat(amountStr.replace(',', '.')) || 0;
                  setAmountStr((current + val).toString());
                }}
                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition-all shrink-0 min-h-[36px]"
                aria-label={`Añadir ${val} al importe`}
              >
                +{val}
              </button>
            ))}
            {amountStr && (
              <button
                type="button"
                onClick={() => setAmountStr('')}
                className="px-2.5 py-1 text-xs font-bold text-red-500 hover:text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors shrink-0 min-h-[36px]"
                aria-label="Borrar importe introducido"
              >
                Borrar
              </button>
            )}
          </div>

          {isAmountInvalid && (
            <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 mt-1.5 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
              <Info className="w-3.5 h-3.5 shrink-0" />
              <span>Introduce un importe válido superior a 0 (ej. 25,50)</span>
            </p>
          )}
          {isAmountValid && (
            <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 mt-1.5 flex items-center gap-1 animate-in fade-in">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>Importe verificado: <strong className="font-mono-num font-bold">{formatMoney(liveParsedAmount, currency)}</strong></span>
            </p>
          )}
        </div>

        {/* Selector de Categorías (Sólo para Gastos e Ingresos) */}
        {type !== 'transfer' && (
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Categoría
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 scroll-touch">
              {filteredCategories.map((cat) => {
                const isSelected = categoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    role="button"
                    aria-pressed={isSelected}
                    onClick={() => setCategoryId(cat.id)}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl text-left text-xs font-semibold border transition-all min-h-[44px] active:scale-95 ${
                      isSelected
                        ? 'bg-white dark:bg-slate-700 border-slate-900 dark:border-emerald-500 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-900 dark:ring-emerald-500'
                        : 'bg-white/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div 
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 shadow-xs"
                      style={{ backgroundColor: cat.color }}
                    >
                      <DynamicIcon name={cat.icon} size={15} />
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
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
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
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
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
                className="w-full pl-3.5 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
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
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
            className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Sección de Movimiento Recurrente & Opción de Guardar como Plantilla */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
          <div className="flex items-center justify-between">
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

          <div className="pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={saveAsTemplate}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setSaveAsTemplate(checked);
                  if (checked && !templateName) {
                    setTemplateName(note || categories.find(c => c.id === categoryId)?.name || '');
                  }
                }}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 dark:border-slate-600 focus:ring-emerald-500 cursor-pointer"
              />
              <div className="flex items-center gap-1.5">
                <Bookmark className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  Guardar como plantilla reutilizable
                </span>
              </div>
            </label>

            {saveAsTemplate && (
              <div className="pl-6 pt-1 space-y-1 animate-in fade-in slide-in-from-top-1 duration-150">
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Nombre para la plantilla (ej. Mi Alquiler, Gimnasio)..."
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Se añadirá a tus plantillas rápidas para rellenar este formulario en 1 clic.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Tarjeta de verificación para transferencias */}
        {type === 'transfer' && fromAcc && toAcc && isAmountValid && (
          <div className="p-3.5 bg-blue-50/80 dark:bg-blue-950/40 rounded-2xl border border-blue-200 dark:border-blue-800/80 space-y-2 text-xs text-slate-700 dark:text-slate-300 animate-in fade-in">
            <div className="flex items-center gap-1.5 font-bold text-blue-700 dark:text-blue-300">
              <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>Verificación Transparente de Transferencia</span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-semibold">
              <span className="text-slate-500 dark:text-slate-400">Origen: {fromAcc.name}</span>
              <span className="text-blue-600 dark:text-blue-400 flex items-center gap-1">➔ Destino: {toAcc.name}</span>
            </div>
            <div className="flex items-center justify-between pt-1.5 border-t border-blue-200/60 dark:border-blue-800/60 text-[11px]">
              <span>Comisión bancaria: <strong className="font-mono-num text-emerald-600 dark:text-emerald-400 font-bold">0,00 {currency} (0%)</strong></span>
              <span>Disponibilidad: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">Inmediata</strong></span>
            </div>
          </div>
        )}

        {/* Botones de Acción */}
        <div className="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 pb-1">
          {transactionToEdit && hasPermission('canDeleteTransactions') && (
            <button
              type="button"
              onClick={handleDelete}
              aria-label="Eliminar este movimiento permanentemente"
              className="p-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-800 transition-colors min-w-[48px] min-h-[48px] flex items-center justify-center active:scale-95"
              title="Eliminar movimiento"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors min-h-[48px] active:scale-[0.98] disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={isProcessing || !hasPermission(transactionToEdit ? 'canEditTransactions' : 'canCreateTransactions')}
            className="flex-1 py-3 px-4 rounded-xl bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold text-white shadow-md transition-all flex items-center justify-center gap-2 min-h-[48px] active:scale-[0.98]"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Confirmando...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>{transactionToEdit ? 'Guardar Cambios' : 'Registrar'}</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Modal de Comprobante Pos-Confirmación */}
      {savedTxForReceipt && (
        <TransactionReceiptModal
          isOpen={true}
          transaction={savedTxForReceipt}
          onClose={() => {
            setSavedTxForReceipt(null);
            onClose();
          }}
        />
      )}
    </BottomSheet>
  );
};
