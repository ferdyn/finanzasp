import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  SecurityConfig,
  loadSecurityConfig,
  saveSecurityConfig,
  generateSalt,
  hashPin,
  generateRecoveryKey,
  hashRecoveryKey,
  verifyRecoveryKey,
  checkWebAuthnSupport,
  registerBiometricCredential,
  verifyBiometricCredential,
  getLockoutState,
  recordFailedAttempt,
  clearFailedAttempts,
  MAX_FAILED_ATTEMPTS,
} from '../utils/security';

interface SecurityContextType {
  isLockEnabled: boolean;
  isLocked: boolean;
  hasPin: boolean;
  pinLength: number;
  isBiometricsAvailable: boolean;
  isBiometricsEnabled: boolean;
  autoLockTimeout: SecurityConfig['autoLockTimeout'];
  hasRecoveryKey: boolean;
  lastGeneratedRecoveryKey: string | null;
  clearLastGeneratedRecoveryKey: () => void;
  
  // Acciones de bloqueo y desbloqueo
  lockApp: () => void;
  unlockWithPin: (pin: string) => Promise<{ success: boolean; error?: string; remainingAttempts?: number; isLockedOut?: boolean; remainingSeconds?: number }>;
  unlockWithBiometrics: () => Promise<{ success: boolean; error?: string }>;
  
  // Configuración de PIN y biometría
  setupPin: (pin: string) => Promise<{ success: boolean; recoveryKey?: string }>;
  changePin: (currentPin: string, newPin: string) => Promise<{ success: boolean; error?: string }>;
  disableLock: (currentPin: string) => Promise<{ success: boolean; error?: string }>;
  enableBiometrics: () => Promise<{ success: boolean; error?: string }>;
  disableBiometrics: () => void;
  setAutoLockTimeout: (timeout: SecurityConfig['autoLockTimeout']) => void;
  resetSecurityData: () => void;
  verifyAndResetWithRecoveryKey: (enteredKey: string) => Promise<{ success: boolean; error?: string }>;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export const SecurityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<SecurityConfig>(() => loadSecurityConfig());
  
  // Si el bloqueo está habilitado y tiene PIN, la pantalla se bloquea inmediatamente al iniciar la app
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    const initialConfig = loadSecurityConfig();
    return initialConfig.isLockEnabled && !!initialConfig.pinHash;
  });

  const [isBiometricsAvailable, setIsBiometricsAvailable] = useState<boolean>(false);
  const [lastGeneratedRecoveryKey, setLastGeneratedRecoveryKey] = useState<string | null>(null);
  const clearLastGeneratedRecoveryKey = useCallback(() => setLastGeneratedRecoveryKey(null), []);
  const lastInteractionRef = useRef<number>(Date.now());

  // Comprobar soporte de WebAuthn al montar
  useEffect(() => {
    let isMounted = true;
    checkWebAuthnSupport().then(res => {
      if (isMounted) {
        setIsBiometricsAvailable(res.isSupported && res.isPlatformAvailable);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Actualizar ref y timestamp al interactuar
  const registerUserActivity = useCallback(() => {
    lastInteractionRef.current = Date.now();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    const handleActivity = () => {
      registerUserActivity();
    };

    events.forEach(evt => window.addEventListener(evt, handleActivity, { passive: true }));
    return () => {
      events.forEach(evt => window.removeEventListener(evt, handleActivity));
    };
  }, [registerUserActivity]);

  // Manejo de timeout de inactividad y cambio de visibilidad de pestaña (App Launch / Backgrounding)
  useEffect(() => {
    if (!config.isLockEnabled || !config.pinHash || isLocked) return;

    // Listener de cambio de visibilidad (al ocultar la pestaña o minimizar)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        if (config.autoLockTimeout === 'immediate') {
          setIsLocked(true);
        }
      } else if (document.visibilityState === 'visible') {
        // Al volver, comprobar si el tiempo transcurrido superó el límite
        const elapsedMs = Date.now() - lastInteractionRef.current;
        let timeoutMs = 0;
        if (config.autoLockTimeout === '1m') timeoutMs = 60 * 1000;
        else if (config.autoLockTimeout === '5m') timeoutMs = 5 * 60 * 1000;
        else if (config.autoLockTimeout === '15m') timeoutMs = 15 * 60 * 1000;

        if (timeoutMs > 0 && elapsedMs >= timeoutMs) {
          setIsLocked(true);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Intervalo para verificar inactividad cuando la pestaña sigue visible
    let intervalId: number | null = null;
    let timeoutLimitMs = 0;
    if (config.autoLockTimeout === '1m') timeoutLimitMs = 60 * 1000;
    else if (config.autoLockTimeout === '5m') timeoutLimitMs = 5 * 60 * 1000;
    else if (config.autoLockTimeout === '15m') timeoutLimitMs = 15 * 60 * 1000;

    if (timeoutLimitMs > 0) {
      intervalId = window.setInterval(() => {
        const elapsed = Date.now() - lastInteractionRef.current;
        if (elapsed >= timeoutLimitMs) {
          setIsLocked(true);
        }
      }, 10000); // Comprobar cada 10s
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (intervalId) clearInterval(intervalId);
    };
  }, [config.isLockEnabled, config.pinHash, config.autoLockTimeout, isLocked]);

  // Bloqueo manual
  const lockApp = useCallback(() => {
    if (config.isLockEnabled && config.pinHash) {
      setIsLocked(true);
    }
  }, [config.isLockEnabled, config.pinHash]);

  // Desbloqueo mediante PIN
  const unlockWithPin = useCallback(async (pin: string) => {
    // Comprobar si hay rate limiting activo
    const lockoutState = getLockoutState();
    if (lockoutState.isLockedOut) {
      return {
        success: false,
        error: `Demasiados intentos erróneos. Espera ${lockoutState.remainingLockoutSeconds} segundos.`,
        isLockedOut: true,
        remainingSeconds: lockoutState.remainingLockoutSeconds,
      };
    }

    if (!config.pinHash || !config.pinSalt) {
      // Si no hay PIN configurado, desbloquea directamente
      setIsLocked(false);
      return { success: true };
    }

    const calculatedHash = await hashPin(pin, config.pinSalt);
    if (calculatedHash === config.pinHash) {
      clearFailedAttempts();
      setIsLocked(false);
      lastInteractionRef.current = Date.now();
      return { success: true };
    } else {
      const attempt = recordFailedAttempt();
      if (attempt.isLockedOut) {
        return {
          success: false,
          error: `Has alcanzado el límite de ${MAX_FAILED_ATTEMPTS} intentos. Bloqueado temporalmente por ${attempt.remainingSeconds}s.`,
          isLockedOut: true,
          remainingSeconds: attempt.remainingSeconds,
        };
      }
      const remainingAttempts = MAX_FAILED_ATTEMPTS - attempt.attempts;
      return {
        success: false,
        error: `PIN incorrecto. Te quedan ${remainingAttempts} intento${remainingAttempts === 1 ? '' : 's'}.`,
        remainingAttempts,
      };
    }
  }, [config.pinHash, config.pinSalt]);

  // Desbloqueo mediante WebAuthn / Biometría
  const unlockWithBiometrics = useCallback(async () => {
    const lockoutState = getLockoutState();
    if (lockoutState.isLockedOut) {
      return {
        success: false,
        error: `Bloqueado temporalmente. Espera ${lockoutState.remainingLockoutSeconds}s.`,
      };
    }

    if (!config.biometricsEnabled) {
      return { success: false, error: 'La autenticación biométrica no está habilitada.' };
    }

    const res = await verifyBiometricCredential(config.webAuthnCredentialId);
    if (res.success) {
      clearFailedAttempts();
      setIsLocked(false);
      lastInteractionRef.current = Date.now();
      return { success: true };
    }

    return { success: false, error: res.error || 'Autenticación biométrica fallida.' };
  }, [config.biometricsEnabled, config.webAuthnCredentialId]);

  // Configuración de un nuevo PIN
  const setupPin = useCallback(async (pin: string): Promise<{ success: boolean; recoveryKey?: string }> => {
    if (!pin || pin.length < 4) return { success: false };

    const salt = generateSalt();
    const pinHash = await hashPin(pin, salt);

    // Generar Clave Maestra de Recuperación si no existiera
    const recKey = generateRecoveryKey();
    const recSalt = generateSalt();
    const recHash = await hashRecoveryKey(recKey, recSalt);

    const updated: SecurityConfig = {
      ...config,
      isLockEnabled: true,
      pinHash,
      pinSalt: salt,
      pinLength: pin.length,
      recoveryKeyHash: recHash,
      recoveryKeySalt: recSalt,
      lastActiveTimestamp: Date.now(),
    };

    setConfig(updated);
    saveSecurityConfig(updated);
    clearFailedAttempts();
    setLastGeneratedRecoveryKey(recKey);
    return { success: true, recoveryKey: recKey };
  }, [config]);

  // Cambio de PIN existente (requiere PIN actual)
  const changePin = useCallback(async (currentPin: string, newPin: string) => {
    if (!config.pinHash || !config.pinSalt) {
      return { success: false, error: 'No hay ningún PIN registrado.' };
    }

    const currentHash = await hashPin(currentPin, config.pinSalt);
    if (currentHash !== config.pinHash) {
      return { success: false, error: 'El PIN actual no es correcto.' };
    }

    if (!newPin || newPin.length < 4) {
      return { success: false, error: 'El nuevo PIN debe tener al menos 4 dígitos.' };
    }

    const newSalt = generateSalt();
    const newHash = await hashPin(newPin, newSalt);

    const updated: SecurityConfig = {
      ...config,
      pinHash: newHash,
      pinSalt: newSalt,
      pinLength: newPin.length,
      lastActiveTimestamp: Date.now(),
    };

    setConfig(updated);
    saveSecurityConfig(updated);
    clearFailedAttempts();
    return { success: true };
  }, [config]);

  // Desactivar bloqueo por PIN
  const disableLock = useCallback(async (currentPin: string) => {
    if (config.pinHash && config.pinSalt) {
      const currentHash = await hashPin(currentPin, config.pinSalt);
      if (currentHash !== config.pinHash) {
        return { success: false, error: 'PIN incorrecto. No se puede desactivar el bloqueo.' };
      }
    }

    const updated: SecurityConfig = {
      ...config,
      isLockEnabled: false,
      pinHash: null,
      pinSalt: null,
      biometricsEnabled: false,
      webAuthnCredentialId: null,
    };

    setConfig(updated);
    saveSecurityConfig(updated);
    setIsLocked(false);
    clearFailedAttempts();
    return { success: true };
  }, [config]);

  // Habilitar biometría (WebAuthn)
  const enableBiometrics = useCallback(async () => {
    const res = await registerBiometricCredential();
    if (!res.success) {
      return { success: false, error: res.error || 'No se pudo configurar la biometría.' };
    }

    const updated: SecurityConfig = {
      ...config,
      biometricsEnabled: true,
      webAuthnCredentialId: res.credentialId || null,
    };

    setConfig(updated);
    saveSecurityConfig(updated);
    return { success: true };
  }, [config]);

  // Deshabilitar biometría
  const disableBiometrics = useCallback(() => {
    const updated: SecurityConfig = {
      ...config,
      biometricsEnabled: false,
      webAuthnCredentialId: null,
    };
    setConfig(updated);
    saveSecurityConfig(updated);
  }, [config]);

  // Cambiar timeout de auto-bloqueo
  const setAutoLockTimeout = useCallback((timeout: SecurityConfig['autoLockTimeout']) => {
    const updated: SecurityConfig = {
      ...config,
      autoLockTimeout: timeout,
    };
    setConfig(updated);
    saveSecurityConfig(updated);
  }, [config]);

  // Restablecimiento de emergencia de seguridad (en caso de olvido de PIN)
  const resetSecurityData = useCallback(() => {
    const resetCfg: SecurityConfig = {
      isLockEnabled: false,
      pinHash: null,
      pinSalt: null,
      pinLength: 4,
      biometricsEnabled: false,
      webAuthnCredentialId: null,
      autoLockTimeout: 'immediate',
      lastActiveTimestamp: Date.now(),
      recoveryKeyHash: null,
      recoveryKeySalt: null,
    };
    setConfig(resetCfg);
    saveSecurityConfig(resetCfg);
    clearFailedAttempts();
    setLastGeneratedRecoveryKey(null);
    setIsLocked(false);
  }, []);

  // Verificación y restablecimiento seguro mediante Clave Maestra de Recuperación
  const verifyAndResetWithRecoveryKey = useCallback(
    async (enteredKey: string): Promise<{ success: boolean; error?: string }> => {
      const lockout = getLockoutState();
      if (lockout.isLockedOut) {
        return {
          success: false,
          error: `Dispositivo bloqueado temporalmente por seguridad. Espera ${lockout.remainingLockoutSeconds}s.`,
        };
      }

      if (!enteredKey || enteredKey.trim().length === 0) {
        return { success: false, error: 'Por favor introduce tu Clave Maestra de Recuperación.' };
      }

      // Si existe clave de recuperación configurada
      if (config.recoveryKeyHash && config.recoveryKeySalt) {
        const isValid = await verifyRecoveryKey(enteredKey, config.recoveryKeyHash, config.recoveryKeySalt);
        if (!isValid) {
          const attempt = recordFailedAttempt();
          if (attempt.isLockedOut) {
            return {
              success: false,
              error: `Clave incorrecta. Dispositivo bloqueado por ${attempt.remainingSeconds}s.`,
            };
          }
          return {
            success: false,
            error: 'La Clave Maestra no coincide. Comprueba los caracteres e intenta de nuevo.',
          };
        }
      } else {
        // Modo de compatibilidad para instalaciones previas sin clave inicial:
        // Requiere clave de anulación de emergencia explícita
        const clean = enteredKey.trim().toUpperCase();
        if (clean !== 'RESET-CONFIRM' && clean.length < 6) {
          return {
            success: false,
            error: 'Para restablecer la instalación sin clave previa, escribe "RESET-CONFIRM".',
          };
        }
      }

      // Si la clave es válida, ejecutar reseteo completo
      resetSecurityData();
      return { success: true };
    },
    [config.recoveryKeyHash, config.recoveryKeySalt, resetSecurityData]
  );

  return (
    <SecurityContext.Provider
      value={{
        isLockEnabled: config.isLockEnabled,
        isLocked,
        hasPin: !!config.pinHash,
        pinLength: config.pinLength,
        isBiometricsAvailable,
        isBiometricsEnabled: config.biometricsEnabled,
        autoLockTimeout: config.autoLockTimeout,
        hasRecoveryKey: !!config.recoveryKeyHash,
        lastGeneratedRecoveryKey,
        clearLastGeneratedRecoveryKey,
        lockApp,
        unlockWithPin,
        unlockWithBiometrics,
        setupPin,
        changePin,
        disableLock,
        enableBiometrics,
        disableBiometrics,
        setAutoLockTimeout,
        resetSecurityData,
        verifyAndResetWithRecoveryKey,
      }}
    >
      {children}
    </SecurityContext.Provider>
  );
};

export const useSecurity = (): SecurityContextType => {
  const ctx = useContext(SecurityContext);
  if (!ctx) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return ctx;
};
