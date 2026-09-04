import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSecurity } from '../context/SecurityContext';
import { getLockoutState } from '../utils/security';
import { Lock, Fingerprint, Delete, ShieldCheck, AlertTriangle, KeyRound, HelpCircle, X, Check } from 'lucide-react';

export const LockScreen: React.FC = () => {
  const {
    isLocked,
    pinLength,
    isBiometricsEnabled,
    isBiometricsAvailable,
    hasRecoveryKey,
    unlockWithPin,
    unlockWithBiometrics,
    verifyAndResetWithRecoveryKey,
  } = useSecurity();

  const [enteredPin, setEnteredPin] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [lockoutSeconds, setLockoutSeconds] = useState<number>(0);
  const [showForgotModal, setShowForgotModal] = useState<boolean>(false);
  const [recoveryInput, setRecoveryInput] = useState<string>('');
  const [recoveryError, setRecoveryError] = useState<string>('');
  const [isRecovering, setIsRecovering] = useState<boolean>(false);
  const biometricAttemptedRef = useRef<boolean>(false);

  // Comprobar estado de rate-limiting (bloqueo por intentos erróneos)
  useEffect(() => {
    const updateLockout = () => {
      const state = getLockoutState();
      setLockoutSeconds(state.isLockedOut ? state.remainingLockoutSeconds : 0);
    };

    updateLockout();
    const interval = setInterval(updateLockout, 1000);
    return () => clearInterval(interval);
  }, []);

  // Intentar desbloqueo biométrico automático al montar si está habilitado
  useEffect(() => {
    if (!isLocked) {
      biometricAttemptedRef.current = false;
      return;
    }

    const state = getLockoutState();
    if (isBiometricsEnabled && !state.isLockedOut && !biometricAttemptedRef.current) {
      biometricAttemptedRef.current = true;
      // Pequeño retardo para dar tiempo al render inicial
      const timer = setTimeout(() => {
        handleBiometricUnlock();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [isLocked, isBiometricsEnabled]);

  // Manejador de verificación de PIN
  const handleVerify = useCallback(async (pinToCheck: string) => {
    if (lockoutSeconds > 0 || isVerifying) return;

    setIsVerifying(true);
    setErrorMessage('');

    try {
      const result = await unlockWithPin(pinToCheck);
      if (result.success) {
        setEnteredPin('');
        setErrorMessage('');
      } else {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(120);
        }
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 450);
        setEnteredPin('');
        setErrorMessage(result.error || 'PIN incorrecto');

        if (result.isLockedOut && result.remainingSeconds) {
          setLockoutSeconds(result.remainingSeconds);
        }
      }
    } catch (err: any) {
      setErrorMessage('Error al verificar el PIN');
    } finally {
      setIsVerifying(false);
    }
  }, [lockoutSeconds, isVerifying, unlockWithPin]);

  // Añadir un dígito
  const handleAddDigit = useCallback((digit: string) => {
    if (lockoutSeconds > 0 || isVerifying) return;
    if (errorMessage) setErrorMessage('');

    setEnteredPin(prev => {
      if (prev.length >= pinLength) return prev;
      const next = prev + digit;
      if (next.length === pinLength) {
        // Ejecutar verificación en el siguiente microtask para actualizar UI
        setTimeout(() => handleVerify(next), 50);
      }
      return next;
    });
  }, [lockoutSeconds, isVerifying, errorMessage, pinLength, handleVerify]);

  // Borrar último dígito
  const handleDeleteDigit = useCallback(() => {
    if (lockoutSeconds > 0 || isVerifying) return;
    setEnteredPin(prev => prev.slice(0, -1));
    if (errorMessage) setErrorMessage('');
  }, [lockoutSeconds, isVerifying, errorMessage]);

  // Desbloqueo Biométrico
  const handleBiometricUnlock = async () => {
    if (lockoutSeconds > 0 || isVerifying) return;

    setIsVerifying(true);
    setErrorMessage('');
    try {
      const res = await unlockWithBiometrics();
      if (!res.success) {
        setErrorMessage(res.error || 'Autenticación biométrica no completada.');
      }
    } catch (e: any) {
      setErrorMessage('Error con el sensor biométrico');
    } finally {
      setIsVerifying(false);
    }
  };

  // Soporte para teclado físico (0-9, Backspace, Enter)
  useEffect(() => {
    if (!isLocked) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar si el modal de ayuda está abierto
      if (showForgotModal) return;

      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleAddDigit(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleDeleteDigit();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (enteredPin.length >= 4) {
          handleVerify(enteredPin);
        }
      } else if (e.key === 'Escape') {
        setEnteredPin('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLocked, showForgotModal, handleAddDigit, handleDeleteDigit, handleVerify, enteredPin]);

  // Garantizar que el modo oculto (privacy-mode) nunca oculte o distorsione el teclado ni los dígitos del bloqueo de pantalla
  useEffect(() => {
    if (!isLocked) return;

    const hadPrivacyMode = document.documentElement.classList.contains('privacy-mode');
    if (hadPrivacyMode) {
      document.documentElement.classList.remove('privacy-mode');
    }

    return () => {
      // Al desbloquearse o desmontarse, restaurar el modo oculto si estaba configurado por el usuario
      if (hadPrivacyMode && typeof window !== 'undefined') {
        const savedPrivacy = localStorage.getItem('finantrack_privacy_mode');
        if (savedPrivacy === 'true') {
          document.documentElement.classList.add('privacy-mode');
        }
      }
    };
  }, [isLocked]);

  if (!isLocked) return null;

  return (
    <div
      id="screen-lock-barrier"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lock-title"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-xl text-slate-900 dark:text-white select-none animate-fadeIn"
    >
      <div className="w-full max-w-sm flex flex-col items-center text-center space-y-6 p-7 sm:p-8 rounded-3xl bg-gradient-to-br from-white/95 via-slate-50/95 to-slate-100/90 dark:from-slate-900/95 dark:via-slate-800/90 dark:to-slate-900/95 text-slate-900 dark:text-white border border-slate-200/80 dark:border-slate-800 shadow-2xl backdrop-blur-xl">
        {/* Cabecera / Identidad de la app */}
        <div className="flex flex-col items-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 ring-4 ring-emerald-500/20">
            <Lock className="w-8 h-8 text-white stroke-[2.2]" />
          </div>

          <div>
            <h1 id="lock-title" className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              FinanTrack
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Acceso protegido • Introduce tu PIN de seguridad
            </p>
          </div>
        </div>

        {/* Indicadores Visuales de Dígitos (PIN Dots) */}
        <div
          className={`flex items-center justify-center gap-4 py-2 ${
            isShaking ? 'animate-shake' : ''
          }`}
          aria-label={`Has introducido ${enteredPin.length} de ${pinLength} dígitos`}
        >
          {Array.from({ length: pinLength }).map((_, index) => {
            const isFilled = index < enteredPin.length;
            return (
              <div
                key={index}
                className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                  isFilled
                    ? 'bg-emerald-500 border-emerald-500 scale-110 shadow-sm shadow-emerald-500/50'
                    : 'bg-transparent border-slate-300 dark:border-slate-600'
                }`}
              />
            );
          })}
        </div>

        {/* Notificaciones y Mensajes de Estado */}
        <div className="min-h-[28px] flex items-center justify-center px-2">
          {lockoutSeconds > 0 ? (
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/30 animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>Bloqueado temporalmente: reintenta en {lockoutSeconds}s</span>
            </div>
          ) : errorMessage ? (
            <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700 dark:text-rose-400 bg-rose-500/10 px-3 py-1.5 rounded-full border border-rose-500/30">
              <span>{errorMessage}</span>
            </div>
          ) : (
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {isBiometricsEnabled ? 'Usa tu huella/rostro o introduce tu PIN' : 'Introduce tu código numérico'}
            </span>
          )}
        </div>

        {/* Teclado Táctil Numérico */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-[280px] lockscreen-keypad no-privacy-blur">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
            <button
              key={num}
              type="button"
              id={`keypad-${num}`}
              onClick={() => handleAddDigit(num)}
              disabled={lockoutSeconds > 0 || isVerifying}
              className="w-20 h-16 sm:w-20 sm:h-16 rounded-2xl bg-white dark:bg-slate-800/90 hover:bg-slate-100 dark:hover:bg-slate-700/90 active:scale-95 text-slate-900 dark:text-white font-sans no-privacy-blur font-bold text-2xl border border-slate-200/90 dark:border-slate-700/80 shadow-xs transition-all flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none mx-auto select-none"
              style={{ filter: 'none', WebkitFilter: 'none', opacity: 1 }}
            >
              <span className="no-privacy-blur select-none pointer-events-none text-slate-900 dark:text-white font-bold text-2xl">
                {num}
              </span>
            </button>
          ))}

          {/* Botón de Biometría (o espacio en blanco) */}
          <div className="flex items-center justify-center">
            {isBiometricsEnabled ? (
              <button
                type="button"
                id="keypad-biometrics"
                onClick={handleBiometricUnlock}
                disabled={lockoutSeconds > 0 || isVerifying}
                title="Desbloquear con Sensor Biométrico (Touch ID / Face ID)"
                className="w-20 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 active:scale-95 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 shadow-xs transition-all flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none no-privacy-blur select-none"
                style={{ filter: 'none', WebkitFilter: 'none', opacity: 1 }}
              >
                <Fingerprint className="w-7 h-7 stroke-[2.2]" />
              </button>
            ) : (
              <div className="w-20 h-16" />
            )}
          </div>

          {/* Dígito 0 */}
          <button
            type="button"
            id="keypad-0"
            onClick={() => handleAddDigit('0')}
            disabled={lockoutSeconds > 0 || isVerifying}
            className="w-20 h-16 rounded-2xl bg-white dark:bg-slate-800/90 hover:bg-slate-100 dark:hover:bg-slate-700/90 active:scale-95 text-slate-900 dark:text-white font-sans no-privacy-blur font-bold text-2xl border border-slate-200/90 dark:border-slate-700/80 shadow-xs transition-all flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none mx-auto select-none"
            style={{ filter: 'none', WebkitFilter: 'none', opacity: 1 }}
          >
            <span className="no-privacy-blur select-none pointer-events-none text-slate-900 dark:text-white font-bold text-2xl">
              0
            </span>
          </button>

          {/* Botón Borrar (Backspace) */}
          <div className="flex items-center justify-center">
            <button
              type="button"
              id="keypad-delete"
              onClick={handleDeleteDigit}
              disabled={enteredPin.length === 0 || lockoutSeconds > 0 || isVerifying}
              title="Borrar último dígito"
              className="w-20 h-16 rounded-2xl bg-white dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700/80 active:scale-95 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200/80 dark:border-slate-700/60 shadow-xs transition-all flex items-center justify-center disabled:opacity-20 disabled:pointer-events-none no-privacy-blur"
            >
              <Delete className="w-6 h-6 stroke-[2]" />
            </button>
          </div>
        </div>

        {/* Acceso Rápido a Biometría / Ayuda */}
        <div className="flex flex-col items-center gap-3 pt-2">
          {isBiometricsEnabled && (
            <button
              type="button"
              onClick={handleBiometricUnlock}
              disabled={lockoutSeconds > 0 || isVerifying}
              className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors py-1 px-3 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
            >
              <Fingerprint className="w-4 h-4" />
              <span>Usar Sensor Biométrico</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowForgotModal(true)}
            className="text-[11px] text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 underline transition-colors"
          >
            ¿Has olvidado tu PIN?
          </button>
        </div>
      </div>

      {/* Modal de Recuperación / Restablecimiento de Emergencia */}
      {showForgotModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-60 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
        >
          <div className="bg-gradient-to-br from-white via-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl text-left text-slate-900 dark:text-white">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center">
                <KeyRound className="w-5 h-5" />
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowForgotModal(false);
                  setRecoveryError('');
                  setRecoveryInput('');
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Recuperación Segura de Acceso
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Para proteger tus datos contra accesos no autorizados, introduce la Clave Maestra de Recuperación generada al activar tu PIN (formato RECOVER-XXXX-XXXX-XXXX-XXXX).
              </p>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!recoveryInput.trim()) {
                  setRecoveryError('Por favor introduce tu clave de recuperación.');
                  return;
                }
                setIsRecovering(true);
                setRecoveryError('');
                const res = await verifyAndResetWithRecoveryKey(recoveryInput);
                setIsRecovering(false);
                if (res.success) {
                  setShowForgotModal(false);
                  setRecoveryInput('');
                } else {
                  setRecoveryError(res.error || 'Clave no válida.');
                }
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Clave de Recuperación
                </label>
                <input
                  type="text"
                  value={recoveryInput}
                  onChange={(e) => {
                    setRecoveryInput(e.target.value.toUpperCase());
                    setRecoveryError('');
                  }}
                  placeholder="RECOVER-XXXX-XXXX-XXXX-XXXX"
                  autoFocus
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm font-mono font-bold tracking-wider text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 uppercase"
                />
                {recoveryError && (
                  <p className="text-xs font-semibold text-rose-500 mt-1.5 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{recoveryError}</span>
                  </p>
                )}
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(false);
                    setRecoveryError('');
                    setRecoveryInput('');
                  }}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isRecovering}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-xs font-bold text-white shadow-sm shadow-amber-500/30 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isRecovering ? 'Verificando...' : 'Verificar y Desbloquear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
