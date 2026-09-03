import React, { useState } from 'react';
import { FraudAlertData } from '../types/digitalCards';
import { formatMoney } from '../utils/format';
import { CurrencyCode } from '../types/finance';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Lock, 
  MapPin, 
  Clock, 
  CreditCard, 
  AlertTriangle, 
  CheckCircle2, 
  X,
  Volume2,
  Zap,
  Info
} from 'lucide-react';

interface FraudAlertModalProps {
  isOpen: boolean;
  alert: FraudAlertData | null;
  onClose: () => void;
  onApprove: (alertId: string) => void;
  onBlockCard: (alertId: string, cardLastFour: string) => void;
}

export const FraudAlertModal: React.FC<FraudAlertModalProps> = ({
  isOpen,
  alert,
  onClose,
  onApprove,
  onBlockCard,
}) => {
  const [resolvedState, setResolvedState] = useState<'approved' | 'blocked' | null>(null);

  if (!isOpen || !alert) return null;

  const handleApprove = () => {
    // Feedback háptico
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate(30); } catch {}
    }
    setResolvedState('approved');
    setTimeout(() => {
      onApprove(alert.id);
      setResolvedState(null);
      onClose();
    }, 1200);
  };

  const handleBlock = () => {
    // Feedback háptico fuerte
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate([100, 50, 100]); } catch {}
    }
    setResolvedState('blocked');
    setTimeout(() => {
      onBlockCard(alert.id, alert.cardLastFour);
      setResolvedState(null);
      onClose();
    }, 1400);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="fraud-alert-title"
      aria-describedby="fraud-alert-desc"
    >
      <div 
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border-2 border-rose-500/80 overflow-hidden flex flex-col transition-all animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera Urgente con Alerta Semafórica */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-rose-600 via-red-600 to-amber-600 text-white flex items-center justify-between relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
          
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-lg animate-pulse">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-white/25 text-white border border-white/30">
                <AlertTriangle className="w-3 h-3" />
                Alerta de Fraude Urgente (PSD2 / SCA)
              </span>
              <h3 id="fraud-alert-title" className="text-base sm:text-lg font-black tracking-tight mt-1">
                ¿Reconoces esta transacción?
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/15 transition-colors relative z-10"
            aria-label="Cerrar alerta"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido de la Alerta */}
        <div className="p-5 sm:p-6 space-y-4">
          {resolvedState === 'approved' ? (
            <div className="text-center py-6 space-y-3 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                Transacción Confirmada y Autorizada
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Hemos verificado que tú eres el titular. El cargo ha sido procesado de forma segura.
              </p>
            </div>
          ) : resolvedState === 'blocked' ? (
            <div className="text-center py-6 space-y-3 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto shadow-sm">
                <Lock className="w-9 h-9" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                Tarjeta Bloqueada Inmediatamente
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Se ha bloqueado la tarjeta terminada en •••• {alert.cardLastFour} en menos de 1 segundo para evitar cargos no autorizados. Nuestro equipo de seguridad ha iniciado el protocolo de protección.
              </p>
            </div>
          ) : (
            <>
              {/* Tarjeta de Importe y Comercio */}
              <div className="p-4 rounded-2xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wider">
                    Importe detectado
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200">
                    Riesgo Alto • Actividad Inusual
                  </span>
                </div>

                <div className="text-3xl sm:text-4xl font-black font-mono-num text-rose-600 dark:text-rose-400">
                  -{formatMoney(alert.amount, alert.currency as CurrencyCode)}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-rose-200/60 dark:border-rose-900/40 text-xs">
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <CreditCard className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Tarjeta <strong>{alert.cardBrand.toUpperCase()} •••• {alert.cardLastFour}</strong></span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Ubicación: <strong>{alert.location}</strong></span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <Zap className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Comercio: <strong>{alert.merchant}</strong></span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Hora: <strong>{alert.timestamp}</strong></span>
                  </div>
                </div>
              </div>

              {/* Razón de Seguridad */}
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
                <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Motivo de la verificación automática:</p>
                  <p className="mt-0.5 text-slate-600 dark:text-slate-300 leading-relaxed">
                    {alert.riskReason || 'Esta compra supera el umbral configurado de 500 € y proviene de una ubicación o terminal distinta a tu patrón habitual.'}
                  </p>
                </div>
              </div>

              {/* Botones de Acción Inmediata (<1s response time conforme a directriz UX) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  id="fraud-alert-block-btn"
                  onClick={handleBlock}
                  className="w-full py-3.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white text-xs sm:text-sm font-bold shadow-lg shadow-rose-600/25 transition-all flex items-center justify-center gap-2 min-h-[48px]"
                >
                  <Lock className="w-4 h-4" />
                  <span>No, Bloquear Tarjeta</span>
                </button>

                <button
                  type="button"
                  id="fraud-alert-approve-btn"
                  onClick={handleApprove}
                  className="w-full py-3.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 active:scale-[0.98] text-white text-xs sm:text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2 min-h-[48px]"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Sí, Fui Yo (Autorizar)</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
