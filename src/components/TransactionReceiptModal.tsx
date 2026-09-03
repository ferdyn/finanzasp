import React, { useState } from 'react';
import { Transaction } from '../types/finance';
import { useFinance } from '../context/FinanceContext';
import { formatMoney, formatDate } from '../utils/format';
import { DynamicIcon } from './DynamicIcon';
import { 
  CheckCircle2, Share2, Copy, Check, X, ShieldCheck, 
  ArrowRight, Landmark, Tag, Calendar, Receipt, Download
} from 'lucide-react';

interface TransactionReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
}

export const TransactionReceiptModal: React.FC<TransactionReceiptModalProps> = ({
  isOpen,
  onClose,
  transaction,
}) => {
  const { currency, getCategoryById, getAccountById } = useFinance();
  const [copied, setCopied] = useState(false);

  if (!isOpen || !transaction) return null;

  const category = getCategoryById(transaction.categoryId);
  const fromAccount = getAccountById(transaction.accountId);
  const toAccount = transaction.toAccountId ? getAccountById(transaction.toAccountId) : null;
  const isExpense = transaction.type === 'expense';
  const isIncome = transaction.type === 'income';
  const isTransfer = transaction.type === 'transfer';

  const txIdFormatted = `TX-${transaction.id.replace(/[^a-zA-Z0-9]/g, '').slice(-8).toUpperCase()}`;

  const handleCopyReceipt = () => {
    const text = [
      `=== COMPROBANTE FINANCIERO ===`,
      `ID Operación: #${txIdFormatted}`,
      `Fecha: ${formatDate(transaction.date, 'long')}`,
      `Tipo: ${isTransfer ? 'Transferencia' : isIncome ? 'Ingreso' : 'Gasto'}`,
      `Concepto: ${transaction.note || category?.name || 'Movimiento'}`,
      `Importe: ${isExpense ? '-' : isIncome ? '+' : ''}${formatMoney(transaction.amount, currency)}`,
      `Cuenta Origen: ${fromAccount?.name || 'Principal'}`,
      toAccount ? `Cuenta Destino: ${toAccount.name}` : null,
      `Categoría: ${category?.name || 'General'}`,
      `Comisión: 0,00 ${currency} (Sin recargo)`,
      `Estado: CONFIRMADO Y REGISTRADO`,
      `==============================`,
    ].filter(Boolean).join('\n');

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div 
      role="dialog"
      aria-modal="true"
      aria-labelledby="receipt-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div 
        className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del Recibo */}
        <div className="relative bg-gradient-to-br from-emerald-600 to-teal-700 dark:from-emerald-700 dark:to-slate-900 text-white p-6 text-center">
          <button
            onClick={onClose}
            aria-label="Cerrar comprobante"
            className="absolute right-4 top-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors touch-target-min flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-14 h-14 bg-white text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-900/20">
            <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
          </div>

          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-100 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            Operación Confirmada
          </span>
          <h2 id="receipt-title" className="text-xl font-extrabold tracking-tight">
            Comprobante de Movimiento
          </h2>
          <p className="text-xs text-emerald-100/90 font-mono-num mt-0.5">
            #{txIdFormatted}
          </p>
        </div>

        {/* Cuerpo del Recibo con perforaciones simuladas estilo factura */}
        <div className="p-6 space-y-5 overflow-y-auto">
          
          {/* Monto Principal con Dígitos Tabulares de Gran Jerarquía */}
          <div className="text-center py-2 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Importe Total Exacto
            </span>
            <div className={`text-3xl sm:text-4xl font-black font-mono-num tracking-tight mt-0.5 ${
              isIncome 
                ? 'text-emerald-600 dark:text-emerald-400' 
                : isExpense 
                  ? 'text-rose-600 dark:text-rose-400' 
                  : 'text-blue-600 dark:text-blue-400'
            }`}>
              {isExpense ? '-' : isIncome ? '+' : ''}{formatMoney(transaction.amount, currency)}
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              Comisión aplicada: <strong className="font-mono-num text-slate-600 dark:text-slate-300">0,00 {currency}</strong> (0%)
            </p>
          </div>

          {/* Desglose de Campos con Claridad y Contexto (Regla p. 4) */}
          <div className="space-y-3 text-xs divide-y divide-slate-100 dark:divide-slate-800">
            
            {/* Concepto */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Concepto / Descripción:</span>
              <span className="font-bold text-slate-900 dark:text-white text-right max-w-[200px] truncate">
                {transaction.note || category?.name || 'Movimiento general'}
              </span>
            </div>

            {/* Fecha y Hora */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Fecha de registro:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {formatDate(transaction.date, 'long')}
              </span>
            </div>

            {/* Categoría */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Categoría:</span>
              <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                <div 
                  className="w-4 h-4 rounded-md flex items-center justify-center text-white"
                  style={{ backgroundColor: category?.color || '#64748b' }}
                >
                  <DynamicIcon name={category?.icon || 'Tag'} size={10} />
                </div>
                <span>{category?.name || 'Sin asignar'}</span>
              </div>
            </div>

            {/* Cuenta de origen */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Cuenta de origen:</span>
              <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                <Landmark className="w-3.5 h-3.5 text-slate-400" />
                <span>{fromAccount?.name || 'Cuenta Principal'}</span>
              </div>
            </div>

            {/* Cuenta destino si es transferencia */}
            {isTransfer && toAccount && (
              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Cuenta destino:</span>
                <div className="flex items-center gap-1.5 font-bold text-blue-600 dark:text-blue-400">
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>{toAccount.name}</span>
                </div>
              </div>
            )}

            {/* Estado */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Disponibilidad de fondos:</span>
              <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                Inmediata
              </span>
            </div>

            {/* Etiquetas si existen */}
            {transaction.tags && transaction.tags.length > 0 && (
              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Etiquetas:</span>
                <div className="flex flex-wrap gap-1 justify-end max-w-[200px]">
                  {transaction.tags.map(t => (
                    <span key={t} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Botones de acción del comprobante (Regla p. 4) */}
          <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
            <button
              type="button"
              onClick={handleCopyReceipt}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 transition-all flex items-center justify-center gap-2 touch-target-min active:scale-[0.98]"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>¡Copiado al Portapapeles!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-500" />
                  <span>Copiar Comprobante</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-700 text-xs font-bold text-white shadow-md transition-all flex items-center justify-center gap-1.5 touch-target-min active:scale-[0.98]"
            >
              <span>Entendido y Cerrar</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
