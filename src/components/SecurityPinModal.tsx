import React, { useState } from 'react';
import { useSecurity } from '../context/SecurityContext';
import { Lock, KeyRound, Check, X, AlertCircle, ShieldCheck } from 'lucide-react';

interface SecurityPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'setup' | 'change' | 'disable' | 'unlock';
  onSuccess?: () => void;
}

export const SecurityPinModal: React.FC<SecurityPinModalProps> = ({
  isOpen,
  onClose,
  mode,
  onSuccess,
}) => {
  const { setupPin, changePin, disableLock, unlockWithPin, pinLength } = useSecurity();

  // Estados de inputs
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'current' | 'new' | 'confirm'>('new');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inicializar estado según el modo
  React.useEffect(() => {
    if (isOpen) {
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
      setError('');
      if (mode === 'change' || mode === 'disable' || mode === 'unlock') {
        setStep('current');
      } else {
        setStep('new');
      }
    }
  }, [isOpen, mode]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'unlock') {
      if (!currentPin || currentPin.length < 4) {
        setError('Introduce tu PIN de seguridad.');
        return;
      }
      setIsSubmitting(true);
      const res = await unlockWithPin(currentPin);
      setIsSubmitting(false);
      if (res.success) {
        onSuccess?.();
        onClose();
      } else {
        setError(res.error || 'PIN incorrecto.');
      }
      return;
    }

    if (mode === 'disable') {
      if (!currentPin || currentPin.length < 4) {
        setError('Introduce tu PIN actual.');
        return;
      }
      setIsSubmitting(true);
      const res = await disableLock(currentPin);
      setIsSubmitting(false);
      if (res.success) {
        onSuccess?.();
        onClose();
      } else {
        setError(res.error || 'PIN incorrecto.');
      }
      return;
    }

    if (mode === 'change' && step === 'current') {
      if (!currentPin || currentPin.length < 4) {
        setError('Introduce tu PIN actual.');
        return;
      }
      setStep('new');
      return;
    }

    if (step === 'new') {
      if (!newPin || newPin.length < 4) {
        setError('El PIN debe tener al menos 4 dígitos numéricos.');
        return;
      }
      if (!/^\d+$/.test(newPin)) {
        setError('El PIN solo debe contener dígitos numéricos (0-9).');
        return;
      }
      setStep('confirm');
      return;
    }

    if (step === 'confirm') {
      if (confirmPin !== newPin) {
        setError('Los PINs introducidos no coinciden. Inténtalo de nuevo.');
        setConfirmPin('');
        return;
      }

      setIsSubmitting(true);
      if (mode === 'setup') {
        const ok = await setupPin(newPin);
        setIsSubmitting(false);
        if (ok) {
          onSuccess?.();
          onClose();
        } else {
          setError('No se pudo configurar el PIN.');
        }
      } else if (mode === 'change') {
        const res = await changePin(currentPin, newPin);
        setIsSubmitting(false);
        if (res.success) {
          onSuccess?.();
          onClose();
        } else {
          setError(res.error || 'Error al actualizar el PIN.');
        }
      }
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-5 shadow-2xl relative text-left">
        {/* Cabecera del modal */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                {mode === 'setup' && 'Configurar PIN de Seguridad'}
                {mode === 'change' && 'Cambiar PIN de Seguridad'}
                {mode === 'disable' && 'Desactivar Bloqueo de Pantalla'}
                {mode === 'unlock' && 'Verificar PIN de Seguridad'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {mode === 'setup' && 'Protege tus finanzas al abrir la app'}
                {mode === 'change' && 'Actualiza tu clave de acceso'}
                {mode === 'disable' && 'Confirma con tu PIN actual'}
                {mode === 'unlock' && 'Introduce tu PIN para autorizar la acción'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error notice */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Paso: Verificar PIN actual */}
          {((mode === 'change' && step === 'current') || mode === 'disable' || mode === 'unlock') && (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                {mode === 'unlock' ? 'Introduce tu PIN de seguridad' : 'Introduce tu PIN actual'}
              </label>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={8}
                autoFocus
                value={currentPin}
                onChange={e => setCurrentPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                className="w-full text-center text-2xl font-mono-num font-bold tracking-widest px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          )}

          {/* Paso: Nuevo PIN */}
          {((mode === 'setup' && step === 'new') || (mode === 'change' && step === 'new')) && (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Introduce tu nuevo PIN (4-6 dígitos)
              </label>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                autoFocus
                value={newPin}
                onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                className="w-full text-center text-2xl font-mono-num font-bold tracking-widest px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-[11px] text-slate-400">
                Usa 4 o 6 números fáciles de recordar pero difíciles de adivinar.
              </p>
            </div>
          )}

          {/* Paso: Confirmar nuevo PIN */}
          {step === 'confirm' && (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Confirma tu nuevo PIN
              </label>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                autoFocus
                value={confirmPin}
                onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                className="w-full text-center text-2xl font-mono-num font-bold tracking-widest px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-xs font-bold text-white shadow-sm shadow-emerald-500/30 transition-all flex items-center justify-center gap-1.5"
            >
              {isSubmitting ? (
                <span>Verificando...</span>
              ) : mode === 'unlock' ? (
                <span>Confirmar PIN</span>
              ) : mode === 'disable' ? (
                <span>Desactivar</span>
              ) : step === 'confirm' ? (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Guardar PIN</span>
                </>
              ) : (
                <span>Continuar</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
