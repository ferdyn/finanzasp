import React from 'react';
import { TipAndSplitCalculator } from './TipAndSplitCalculator';
import { X } from 'lucide-react';
import { Transaction } from '../types/finance';

interface TipAndSplitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenTransactionWithData?: (data: Partial<Transaction>) => void;
}

export const TipAndSplitModal: React.FC<TipAndSplitModalProps> = ({
  isOpen,
  onClose,
  onOpenTransactionWithData,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tip-split-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 max-w-3xl w-full shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar modal"
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <TipAndSplitCalculator
          isModal={true}
          onClose={onClose}
          onOpenTransactionWithData={(data) => {
            onClose();
            if (onOpenTransactionWithData) {
              onOpenTransactionWithData(data);
            }
          }}
        />
      </div>
    </div>
  );
};
