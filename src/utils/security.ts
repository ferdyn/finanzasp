/**
 * Utilidades de Seguridad, Criptografía y Web Authentication API (WebAuthn)
 * para FinanTrack.
 */

export interface SecurityConfig {
  isLockEnabled: boolean;
  pinHash: string | null;
  pinSalt: string | null;
  pinLength: number;
  biometricsEnabled: boolean;
  webAuthnCredentialId: string | null;
  autoLockTimeout: 'immediate' | '1m' | '5m' | '15m' | 'launch_only';
  lastActiveTimestamp: number;
}

const SECURITY_STORAGE_KEY = 'finantrack_security_config_v1';
const FAILED_ATTEMPTS_KEY = 'finantrack_security_failed_attempts';
const LOCKOUT_TIMESTAMP_KEY = 'finantrack_security_lockout_until';

export const MAX_FAILED_ATTEMPTS = 5;
export const LOCKOUT_DURATION_MS = 30 * 1000; // 30 segundos tras 5 intentos fallidos

/**
 * Genera una sal criptográficamente segura aleatoria en formato hex.
 */
export function generateSalt(length = 16): string {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Genera el hash criptográfico SHA-256 de un PIN con sal utilizando Web Crypto API.
 */
export async function hashPin(pin: string, salt: string): Promise<string> {
  if (typeof window === 'undefined' || !window.crypto?.subtle) {
    // Fallback básico si Web Crypto Subtle no estuviese disponible
    let hash = 0;
    const str = `${salt}:${pin}`;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return `fb_${Math.abs(hash).toString(16)}`;
  }

  const encoder = new TextEncoder();
  const data = encoder.encode(`finantrack_salt_${salt}:${pin}`);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Convierte un ArrayBuffer o Uint8Array a base64url string
 */
function bufferToBase64Url(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Convierte un base64url string a Uint8Array
 */
function base64UrlToBuffer(base64url: string): Uint8Array {
  const padding = '='.repeat((4 - (base64url.length % 4)) % 4);
  const base64 = (base64url + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Comprueba si el navegador soporta Web Authentication API y autenticador de plataforma (Touch ID, Face ID, Windows Hello).
 */
export async function checkWebAuthnSupport(): Promise<{
  isSupported: boolean;
  isPlatformAvailable: boolean;
}> {
  if (
    typeof window === 'undefined' ||
    !window.isSecureContext ||
    !window.PublicKeyCredential ||
    !navigator.credentials
  ) {
    return { isSupported: false, isPlatformAvailable: false };
  }

  try {
    let isPlatformAvailable = false;
    if (typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function') {
      isPlatformAvailable = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    } else {
      isPlatformAvailable = true;
    }
    return { isSupported: true, isPlatformAvailable };
  } catch (err) {
    return { isSupported: true, isPlatformAvailable: false };
  }
}

/**
 * Registra una credencial biométrica en el dispositivo mediante WebAuthn
 */
export async function registerBiometricCredential(
  userName = 'Usuario FinanTrack'
): Promise<{ success: boolean; credentialId?: string; error?: string }> {
  try {
    const support = await checkWebAuthnSupport();
    if (!support.isSupported) {
      return { success: false, error: 'Web Authentication API no está soportada en este navegador.' };
    }

    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const userId = new Uint8Array(16);
    window.crypto.getRandomValues(userId);

    const credential = (await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: {
          name: 'FinanTrack - Finanzas Personales',
        },
        user: {
          id: userId,
          name: 'user@finantrack.app',
          displayName: userName,
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },  // ES256 (estándar para Touch ID/Face ID/Windows Hello)
          { alg: -257, type: 'public-key' }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform', // Obliga al sensor biométrico del dispositivo
          userVerification: 'required',
          requireResidentKey: false,
        },
        timeout: 60000,
        attestation: 'none',
      },
    })) as PublicKeyCredential | null;

    if (!credential) {
      return { success: false, error: 'No se pudo generar la credencial de autenticación biométrica.' };
    }

    const credentialId = bufferToBase64Url(credential.rawId);
    return { success: true, credentialId };
  } catch (err: any) {
    console.warn('WebAuthn register error:', err);
    if (err.name === 'NotAllowedError') {
      return { success: false, error: 'Acceso biométrico cancelado o no autorizado por el sistema operativo.' };
    }
    if (err.name === 'SecurityError') {
      return { success: false, error: 'Restricción de seguridad del navegador o iframe para biometría. Usa el PIN de seguridad.' };
    }
    return { success: false, error: err.message || 'Error al configurar autenticación biométrica.' };
  }
}

/**
 * Autentica al usuario usando el sensor biométrico del dispositivo mediante WebAuthn
 */
export async function verifyBiometricCredential(
  credentialId?: string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    const support = await checkWebAuthnSupport();
    if (!support.isSupported) {
      return { success: false, error: 'Biometría no soportada en este dispositivo.' };
    }

    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const allowCredentials: PublicKeyCredentialDescriptor[] = [];
    if (credentialId) {
      try {
        allowCredentials.push({
          id: base64UrlToBuffer(credentialId),
          type: 'public-key',
          transports: ['internal'],
        });
      } catch (e) {
        // En caso de fallo de parsing, continúa sin restricción de id
      }
    }

    const assertion = (await navigator.credentials.get({
      publicKey: {
        challenge,
        userVerification: 'required',
        allowCredentials: allowCredentials.length > 0 ? allowCredentials : undefined,
        timeout: 60000,
      },
    })) as PublicKeyCredential | null;

    if (assertion && assertion.id) {
      return { success: true };
    }
    return { success: false, error: 'Verificación biométrica no completada.' };
  } catch (err: any) {
    console.warn('WebAuthn auth error:', err);
    if (err.name === 'NotAllowedError') {
      return { success: false, error: 'Autenticación cancelada o huella/rostro no reconocido.' };
    }
    return { success: false, error: err.message || 'Fallo de autenticación biométrica.' };
  }
}

/**
 * Carga la configuración de seguridad almacenada en el dispositivo
 */
export function loadSecurityConfig(): SecurityConfig {
  const defaultCfg: SecurityConfig = {
    isLockEnabled: false,
    pinHash: null,
    pinSalt: null,
    pinLength: 4,
    biometricsEnabled: false,
    webAuthnCredentialId: null,
    autoLockTimeout: 'immediate',
    lastActiveTimestamp: Date.now(),
  };

  if (typeof window === 'undefined') return defaultCfg;

  try {
    const raw = localStorage.getItem(SECURITY_STORAGE_KEY);
    if (!raw) return defaultCfg;
    const parsed = JSON.parse(raw);
    return { ...defaultCfg, ...parsed };
  } catch (e) {
    console.error('Error parsing security config:', e);
    return defaultCfg;
  }
}

/**
 * Guarda la configuración de seguridad en localStorage
 */
export function saveSecurityConfig(cfg: SecurityConfig): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SECURITY_STORAGE_KEY, JSON.stringify(cfg));
  } catch (e) {
    console.error('Error saving security config:', e);
  }
}

/**
 * Obtiene el estado de intentos fallidos y bloqueo temporal
 */
export function getLockoutState(): {
  failedAttempts: number;
  isLockedOut: boolean;
  remainingLockoutSeconds: number;
} {
  if (typeof window === 'undefined') {
    return { failedAttempts: 0, isLockedOut: false, remainingLockoutSeconds: 0 };
  }

  const failedAttempts = parseInt(localStorage.getItem(FAILED_ATTEMPTS_KEY) || '0', 10);
  const lockoutUntil = parseInt(localStorage.getItem(LOCKOUT_TIMESTAMP_KEY) || '0', 10);
  const now = Date.now();

  if (lockoutUntil > now) {
    const remainingSecs = Math.ceil((lockoutUntil - now) / 1000);
    return {
      failedAttempts,
      isLockedOut: true,
      remainingLockoutSeconds: remainingSecs,
    };
  }

  return {
    failedAttempts,
    isLockedOut: false,
    remainingLockoutSeconds: 0,
  };
}

/**
 * Registra un intento fallido de desbloqueo y aplica rate-limiting si supera el límite
 */
export function recordFailedAttempt(): {
  attempts: number;
  isLockedOut: boolean;
  remainingSeconds: number;
} {
  if (typeof window === 'undefined') return { attempts: 1, isLockedOut: false, remainingSeconds: 0 };

  const currentAttempts = parseInt(localStorage.getItem(FAILED_ATTEMPTS_KEY) || '0', 10) + 1;
  localStorage.setItem(FAILED_ATTEMPTS_KEY, currentAttempts.toString());

  if (currentAttempts >= MAX_FAILED_ATTEMPTS) {
    const lockoutUntil = Date.now() + LOCKOUT_DURATION_MS;
    localStorage.setItem(LOCKOUT_TIMESTAMP_KEY, lockoutUntil.toString());
    return {
      attempts: currentAttempts,
      isLockedOut: true,
      remainingSeconds: Math.ceil(LOCKOUT_DURATION_MS / 1000),
    };
  }

  return {
    attempts: currentAttempts,
    isLockedOut: false,
    remainingSeconds: 0,
  };
}

/**
 * Reinicia el contador de intentos fallidos tras un desbloqueo exitoso
 */
export function clearFailedAttempts(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(FAILED_ATTEMPTS_KEY);
  localStorage.removeItem(LOCKOUT_TIMESTAMP_KEY);
}
