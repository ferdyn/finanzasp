import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, Smartphone, KeyRound, AlertTriangle, Check, X, RefreshCw } from 'lucide-react';

interface MfaChallengeModalProps {
  isOpen: boolean;
  actionTitle: string;
  actionDescription: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const MfaChallengeModal: React.FC<MfaChallengeModalProps> = ({
  isOpen,
  actionTitle,
  actionDescription,
  onClose,
  onSuccess,
}) => {
  const [code, setCode] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [method, setMethod] = useState<'app' | 'sms'>('app');
  const [countdown, setCountdown] = useState<number>(30);

  useEffect(() => {
    if (!isOpen) {
      setCode('');
      setError('');
      return;
    }
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 1 ? prev - 1 : 30));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleVerify = () => {
    if (code.length < 6) {
      setError('Por favor introduce el código de 6 dígitos');
      return;
    }

    setIsVerifying(true);
    setError('');

    // Feedback háptico
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate(25); } catch {}
    }

    setTimeout(() => {
      setIsVerifying(false);
      // Permitimos el código de prueba o cualquier 6 dígitos
      onSuccess();
      onClose();
    }, 600);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div className="p-5 bg-gradient-to-r from-indigo-600 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-indigo-200" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200 block">
                Seguridad Escalonada (2FA / SCA)
              </span>
              <h3 className="text-base font-bold tracking-tight">
                Verificación Requerida
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo */}
        <div className="p-5 sm:p-6 space-y-4">
          <div className="p-3 bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 rounded-xl text-xs text-indigo-900 dark:text-indigo-200">
            <p className="font-bold">{actionTitle || 'Autorización de Operación de Alto Importe'}</p>
            <p className="mt-0.5 text-slate-600 dark:text-slate-300">
              {actionDescription || 'Por directiva PSD2 y protección de tu saldo, introduce el código temporal de seguridad.'}
            </p>
          </div>

          {/* Selector de Método */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMethod('app')}
              className={`flex-1 p-2 rounded-xl text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 ${
                method === 'app'
                  ? 'bg-slate-900 dark:bg-slate-800 text-white border-slate-900'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>App Autenticador</span>
            </button>
            <button
              type="button"
              onClick={() => setMethod('sms')}
              className={`flex-1 p-2 rounded-xl text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 ${
                method === 'sms'
                  ? 'bg-slate-900 dark:bg-slate-800 text-white border-slate-900'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>SMS (+34 ••• •• 49)</span>
            </button>
          </div>

          {/* Campo de Código 2FA */}
          <div className="space-y-1.5 text-center">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Código de 6 Dígitos
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="1 2 3 4 5 6"
              className="w-full text-center text-2xl font-mono font-black tracking-widest py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              autoFocus
            />
            {error && <p className="text-xs text-rose-600 font-semibold">{error}</p>}
            <p className="text-[11px] text-slate-400">
              Nuevo código en <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{countdown}s</span>
            </p>
          </div>

          {/* Botón de Confirmación */}
          <button
            type="button"
            onClick={handleVerify}
            disabled={isVerifying || code.length < 6}
            className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-sm shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
          >
            {isVerifying ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Verificando 2FA...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Confirmar y Autorizar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
