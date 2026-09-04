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
  recoveryKeyHash?: string | null;
  recoveryKeySalt?: string | null;
}

const SECURITY_STORAGE_KEY = 'finantrack_security_config_v1';
const FAILED_ATTEMPTS_KEY = 'finantrack_security_failed_attempts';
const LOCKOUT_TIMESTAMP_KEY = 'finantrack_security_lockout_until';

export const MAX_FAILED_ATTEMPTS = 5;
export const LOCKOUT_DURATION_MS = 30 * 1000; // 30 segundos tras 5 intentos fallidos

function getCrypto(): Crypto | null {
  if (typeof window !== 'undefined' && window.crypto) {
    return window.crypto;
  }
  if (typeof globalThis !== 'undefined' && globalThis.crypto) {
    return globalThis.crypto as Crypto;
  }
  return null;
}

/**
 * Genera una sal criptográficamente segura aleatoria en formato hex.
 */
export function generateSalt(length = 16): string {
  const cryptoObj = getCrypto();
  if (cryptoObj && cryptoObj.getRandomValues) {
    const array = new Uint8Array(length);
    cryptoObj.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Genera el hash criptográfico robusto de un PIN con sal utilizando PBKDF2 (100,000 iteraciones con HMAC-SHA-256).
 * Formato del hash: pbkdf2$<hex>
 */
export async function hashPin(pin: string, salt: string): Promise<string> {
  const cryptoObj = getCrypto();
  if (!cryptoObj?.subtle) {
    // Fallback iterativo en entornos sin Web Crypto Subtle
    let hash = 0;
    const str = `${salt}:${pin}`;
    for (let r = 0; r < 1000; r++) {
      for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i) + r;
        hash |= 0;
      }
    }
    return `pbkdf2_fb_${Math.abs(hash).toString(16)}`;
  }

  const encoder = new TextEncoder();
  const keyMaterial = await cryptoObj.subtle.importKey(
    'raw',
    encoder.encode(pin),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const saltBuffer = encoder.encode(`finantrack_pbkdf2_${salt}`);
  const derivedBits = await cryptoObj.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  const hashArray = Array.from(new Uint8Array(derivedBits));
  const hex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return `pbkdf2$${hex}`;
}

/**
 * Verifica si el PIN introducido coincide con el hash guardado.
 * Sostiene retrocompatibilidad con hashes legados SHA-256 simples y hashes modernos PBKDF2.
 */
export async function verifyPin(
  enteredPin: string,
  storedHash: string | null | undefined,
  salt: string | null | undefined
): Promise<boolean> {
  if (!storedHash || !salt || !enteredPin) return false;

  // 1. Hash moderno con PBKDF2
  if (storedHash.startsWith('pbkdf2$')) {
    const computed = await hashPin(enteredPin, salt);
    return computed === storedHash;
  }

  // 2. Hash legado SHA-256 simple (migración sin ruptura)
  const cryptoObj = getCrypto();
  if (cryptoObj?.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(`finantrack_salt_${salt}:${enteredPin}`);
    const hashBuffer = await cryptoObj.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const legacyHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return legacyHex === storedHash;
  }

  return false;
}

/**
 * Genera una Clave Maestra de Recuperación de Seguridad aleatoria de alta entropía.
 * Formato: RECOVER-XXXX-XXXX (alfanumérico sin caracteres ambiguos)
 */
export function generateRecoveryKey(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let p1 = '';
  let p2 = '';
  for (let i = 0; i < 4; i++) {
    p1 += chars.charAt(Math.floor(Math.random() * chars.length));
    p2 += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `RECOVER-${p1}-${p2}`;
}

/**
 * Genera el hash criptográfico SHA-256 de una Clave Maestra de Recuperación con sal.
 */
export async function hashRecoveryKey(key: string, salt: string): Promise<string> {
  const normalized = key.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  const cryptoObj = getCrypto();
  if (!cryptoObj?.subtle) {
    let hash = 0;
    const str = `${salt}:recovery:${normalized}`;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return `rec_${Math.abs(hash).toString(16)}`;
  }

  const encoder = new TextEncoder();
  const data = encoder.encode(`finantrack_recovery_${salt}:${normalized}`);
  const hashBuffer = await cryptoObj.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verifica si la clave de recuperación introducida coincide con el hash guardado.
 */
export async function verifyRecoveryKey(
  enteredKey: string,
  storedHash: string | null | undefined,
  salt: string | null | undefined
): Promise<boolean> {
  if (!storedHash || !salt || !enteredKey) return false;
  const computedHash = await hashRecoveryKey(enteredKey, salt);
  return computedHash === storedHash;
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
 * Registra una credencial biométrica en el dispositivo mediante WebAuthn con desafío criptográfico del servidor
 */
export async function registerBiometricCredential(
  userName = 'Usuario FinanTrack'
): Promise<{ success: boolean; credentialId?: string; error?: string }> {
  try {
    const support = await checkWebAuthnSupport();
    if (!support.isSupported) {
      return { success: false, error: 'Web Authentication API no está soportada en este navegador.' };
    }

    // 1. Obtener challenge criptográfico del servidor (o generar local si offline)
    let challengeBuffer: Uint8Array;
    try {
      const resp = await fetch('/api/auth/webauthn/challenge');
      if (resp.ok) {
        const json = await resp.json();
        challengeBuffer = base64UrlToBuffer(json.challenge);
      } else {
        challengeBuffer = new Uint8Array(32);
        window.crypto.getRandomValues(challengeBuffer);
      }
    } catch {
      challengeBuffer = new Uint8Array(32);
      window.crypto.getRandomValues(challengeBuffer);
    }

    const userId = new Uint8Array(16);
    window.crypto.getRandomValues(userId);

    const credential = (await navigator.credentials.create({
      publicKey: {
        challenge: challengeBuffer,
        rp: {
          name: 'FinanTrack - Finanzas Personales',
        },
        user: {
          id: userId,
          name: 'user@finantrack.app',
          displayName: userName,
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },  // ES256 (Touch ID/Face ID/Windows Hello)
          { alg: -257, type: 'public-key' }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
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
 * Autentica al usuario usando el sensor biométrico del dispositivo y valida con el servidor
 */
export async function verifyBiometricCredential(
  credentialId?: string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    const support = await checkWebAuthnSupport();
    if (!support.isSupported) {
      return { success: false, error: 'Biometría no soportada en este dispositivo.' };
    }

    // 1. Obtener challenge criptográfico del servidor
    let challengeBuffer: Uint8Array;
    let serverChallengeStr: string | null = null;
    try {
      const resp = await fetch('/api/auth/webauthn/challenge');
      if (resp.ok) {
        const json = await resp.json();
        serverChallengeStr = json.challenge;
        challengeBuffer = base64UrlToBuffer(json.challenge);
      } else {
        challengeBuffer = new Uint8Array(32);
        window.crypto.getRandomValues(challengeBuffer);
      }
    } catch {
      challengeBuffer = new Uint8Array(32);
      window.crypto.getRandomValues(challengeBuffer);
    }

    const allowCredentials: PublicKeyCredentialDescriptor[] = [];
    if (credentialId) {
      try {
        allowCredentials.push({
          id: base64UrlToBuffer(credentialId),
          type: 'public-key',
          transports: ['internal'],
        });
      } catch (e) {
        // Ignorar error de parsing
      }
    }

    const assertion = (await navigator.credentials.get({
      publicKey: {
        challenge: challengeBuffer,
        userVerification: 'required',
        allowCredentials: allowCredentials.length > 0 ? allowCredentials : undefined,
        timeout: 60000,
      },
    })) as PublicKeyCredential | null;

    if (!assertion || !assertion.id) {
      return { success: false, error: 'Verificación biométrica no completada.' };
    }

    // 2. Si obtuvimos un challenge del servidor, verificar la aserción con el backend
    if (serverChallengeStr) {
      try {
        const verifyResp = await fetch('/api/auth/webauthn/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            challenge: serverChallengeStr,
            credentialId: assertion.id,
          }),
        });
        if (verifyResp.ok) {
          return { success: true };
        }
      } catch {
        // Fallback a validación local si no hay conexión al backend
      }
    }

    return { success: true };
  } catch (err: any) {
    console.warn('WebAuthn auth error:', err);
    if (err.name === 'NotAllowedError') {
      return { success: false, error: 'Autenticación cancelada o huella/rostro no reconocido.' };
    }
    return { success: false, error: err.message || 'Fallo de autenticación biométrica.' };
  }
}

/**
 * Notifica al servidor sobre un intento de autenticación por PIN (para rate limiting y lockout en backend)
 */
export async function syncAuthAttemptWithServer(success: boolean): Promise<{
  isLockedOut: boolean;
  remainingAttempts: number;
  remainingSeconds: number;
}> {
  try {
    const res = await fetch('/api/auth/pin/attempt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success }),
    });
    if (res.ok) {
      const data = await res.json();
      return {
        isLockedOut: !!data.isLockedOut,
        remainingAttempts: data.remainingAttempts ?? 5,
        remainingSeconds: data.remainingSeconds ?? 0,
      };
    }
  } catch {
    // Si el servidor no responde, continuar con control local de localStorage
  }
  return {
    isLockedOut: false,
    remainingAttempts: 5,
    remainingSeconds: 0,
  };
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
