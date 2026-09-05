import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: string;
  children: React.ReactNode;
  headerAction?: React.ReactNode;
  maxWidth?: string;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  headerAction,
  maxWidth = 'max-w-xl',
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    // Prevenir scroll en el fondo
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150"
    >
      {/* Backdrop con desenfoque suave y soporte para cierre al pulsar fuera */}
      <div
        className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Contenedor Bottom Sheet en móvil / Modal centrado en desktop */}
      <div
        className={`relative z-10 w-full ${maxWidth} bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl shadow-2xl border-t sm:border border-slate-200/80 dark:border-slate-800 flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden animate-in slide-in-from-bottom duration-200 sm:zoom-in-95`}
      >
        {/* Handle visual táctil en móvil para indicar arrastre / panel inferior */}
        <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />

        {/* Cabecera común accesible */}
        {(title || description || headerAction) && (
          <div className="px-5 py-3.5 sm:py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
            <div className="min-w-0 flex-1">
              {typeof title === 'string' ? (
                <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 truncate">
                  {title}
                </h2>
              ) : (
                title
              )}
              {description && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  {description}
                </p>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {headerAction}
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar ventana"
                className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Contenido con scroll optimizado y soporte para safe-area en iPhone / Android */}
        <div className="flex-1 overflow-y-auto px-5 py-4 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] sm:pb-5 space-y-4">
          {children}
        </div>
      </div>
    </div>
  );
};
