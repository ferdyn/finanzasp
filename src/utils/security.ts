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
  throw new Error('Web Crypto API no disponible para generación criptográfica de sal.');
}

/**
 * Genera un identificador único seguro basado en timestamp y bytes criptográficos aleatorios.
 * Reemplaza de forma segura Math.random() para IDs de transacciones, logs y entidades.
 * Falla de forma estricta si Web Crypto no está disponible (sin fallbacks inseguros).
 */
export function generateSecureId(prefix = 'id', byteLength = 4): string {
  const cryptoObj = getCrypto();
  if (cryptoObj && cryptoObj.getRandomValues) {
    const bytes = new Uint8Array(byteLength);
    cryptoObj.getRandomValues(bytes);
    const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
    return `${prefix}-${Date.now()}-${hex}`;
  }
  throw new Error('Web Crypto API no disponible para generación segura de IDs.');
}

/**
 * Genera un número entero aleatorio criptográficamente seguro en el rango [min, max].
 * Falla de forma estricta si Web Crypto no está disponible (sin fallbacks inseguros).
 */
export function generateSecureRandomNumber(min: number, max: number): number {
  const cryptoObj = getCrypto();
  if (cryptoObj && cryptoObj.getRandomValues) {
    const uint32 = new Uint32Array(1);
    cryptoObj.getRandomValues(uint32);
    const fraction = uint32[0] / 0x100000000;
    return Math.floor(min + fraction * (max - min + 1));
  }
  throw new Error('Web Crypto API no disponible para generación segura de números aleatorios.');
}

const PBKDF2_ITERATIONS = (typeof process !== 'undefined' && (process.env.NODE_ENV === 'test' || Boolean(process.env.VITEST))) ? 1000 : 600000;

/**
 * Genera el hash criptográfico robusto de un PIN con sal utilizando PBKDF2 (600,000 iteraciones con HMAC-SHA-256 en prod, 1,000 en test).
 * Formato del hash: pbkdf2$<hex>
 */
export async function hashPin(pin: string, salt: string): Promise<string> {
  const cryptoObj = getCrypto();
  if (cryptoObj?.subtle) {
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
        iterations: PBKDF2_ITERATIONS,
        hash: 'SHA-256',
      },
      keyMaterial,
      256
    );

    const hashArray = Array.from(new Uint8Array(derivedBits));
    const hex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return `pbkdf2$${hex}`;
  }

  // Entornos Node.js / Vitest
  if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    try {
      const nodeCrypto = await import('crypto');
      const derived = nodeCrypto.pbkdf2Sync(
        pin,
        `finantrack_pbkdf2_${salt}`,
        PBKDF2_ITERATIONS,
        32,
        'sha256'
      );
      return `pbkdf2$${derived.toString('hex')}`;
    } catch {
      // fallback to throw
    }
  }

  throw new Error('API Criptográfica segura (PBKDF2) no disponible en este entorno.');
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
 * Alfabeto Base32 de alta legibilidad (32 caracteres = 2^5, exactamente 5 bits por caracter).
 * Excluye caracteres visualmente ambiguos (0, 1, I, O).
 */
export const CROCKFORD_BASE32_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

/**
 * Genera una Clave Maestra de Recuperación de Seguridad con entropía criptográfica de alta seguridad.
 * Utiliza exclusivamente crypto.getRandomValues() para eliminar cualquier predictibilidad.
 * Formato: RECOVER-XXXX-XXXX-XXXX-XXXX (16 caracteres base-32 = 80 bits de entropía pura)
 */
export function generateRecoveryKey(): string {
  const cryptoObj = getCrypto();
  if (!cryptoObj || !cryptoObj.getRandomValues) {
    throw new Error('Web Crypto API no disponible para generación de Recovery Key criptográfica.');
  }

  // 16 caracteres = 4 bloques de 4 caracteres
  // Dado que el alfabeto tiene exactamente 32 caracteres (2^5), (byte & 31)
  // tiene una distribución estrictamente uniforme (256 / 32 = 8 valores posibles por símbolo)
  // sin introducir ningún sesgo de módulo.
  const randomBytes = new Uint8Array(16);
  cryptoObj.getRandomValues(randomBytes);

  const blocks: string[] = [];
  for (let b = 0; b < 4; b++) {
    let block = '';
    for (let i = 0; i < 4; i++) {
      const idx = randomBytes[b * 4 + i] & 31; // 0..31 sin sesgo sobre 32 caracteres
      block += CROCKFORD_BASE32_ALPHABET.charAt(idx);
    }
    blocks.push(block);
  }
  return `RECOVER-${blocks.join('-')}`;
}

/**
 * Genera el hash criptográfico robusto de una Clave Maestra de Recuperación con sal utilizando PBKDF2 (600,000 iteraciones con HMAC-SHA-256).
 * Formato: pbkdf2_rec$<hex>
 */
export async function hashRecoveryKey(key: string, salt: string): Promise<string> {
  const normalized = key.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  const cryptoObj = getCrypto();
  if (cryptoObj?.subtle) {
    const encoder = new TextEncoder();
    const keyMaterial = await cryptoObj.subtle.importKey(
      'raw',
      encoder.encode(normalized),
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );

    const saltBuffer = encoder.encode(`finantrack_rec_pbkdf2_${salt}`);
    const derivedBits = await cryptoObj.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: saltBuffer,
        iterations: PBKDF2_ITERATIONS,
        hash: 'SHA-256',
      },
      keyMaterial,
      256
    );

    const hashArray = Array.from(new Uint8Array(derivedBits));
    const hex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return `pbkdf2_rec$${hex}`;
  }

  if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    try {
      const nodeCrypto = await import('crypto');
      const derived = nodeCrypto.pbkdf2Sync(
        normalized,
        `finantrack_rec_pbkdf2_${salt}`,
        PBKDF2_ITERATIONS,
        32,
        'sha256'
      );
      return `pbkdf2_rec$${derived.toString('hex')}`;
    } catch {
      // fallback to throw
    }
  }

  throw new Error('API Criptográfica segura (PBKDF2) no disponible para derivación de Recovery Key.');
}

/**
 * Verifica si la clave de recuperación introducida coincide con el hash guardado.
 * Admite tanto el estándar moderno PBKDF2 como retrocompatibilidad con hashes legados SHA-256.
 */
export async function verifyRecoveryKey(
  enteredKey: string,
  storedHash: string | null | undefined,
  salt: string | null | undefined
): Promise<boolean> {
  if (!storedHash || !salt || !enteredKey) return false;
  
  // 1. Verificación moderna PBKDF2
  if (storedHash.startsWith('pbkdf2_rec$')) {
    const computed = await hashRecoveryKey(enteredKey, salt);
    return computed === storedHash;
  }

  // 2. Retrocompatibilidad SHA-256 legado para configuraciones previas
  const normalized = enteredKey.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  const cryptoObj = getCrypto();
  if (cryptoObj?.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(`finantrack_recovery_${salt}:${normalized}`);
    const hashBuffer = await cryptoObj.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const legacyHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return legacyHex === storedHash;
  }

  return false;
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
  userName = 'Usuario FinanTrack',
  userId = 'usr-default'
): Promise<{ success: boolean; credentialId?: string; error?: string }> {
  try {
    const support = await checkWebAuthnSupport();
    if (!support.isSupported) {
      return { success: false, error: 'Web Authentication API no está soportada en este navegador.' };
    }

    // 1. Obtener opciones criptográficas de registro del servidor
    const optionsResp = await fetch('/api/auth/webauthn/generate-registration-options', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userName, userId }),
    });

    if (!optionsResp.ok) {
      const err = await optionsResp.json().catch(() => ({}));
      return { success: false, error: err.error || 'No se pudieron generar opciones de registro biométrico.' };
    }

    const options = await optionsResp.json();

    // 2. Usar @simplewebauthn/browser para iniciar el registro
    const { startRegistration } = await import('@simplewebauthn/browser');
    const registrationResponse = await startRegistration({ optionsJSON: options });

    // 3. Verificar la respuesta criptográfica en el servidor
    const verifyResp = await fetch('/api/auth/webauthn/verify-registration', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        response: registrationResponse,
        userId,
        userName,
      }),
    });

    const verifyData = await verifyResp.json();
    if (verifyResp.ok && verifyData.verified) {
      return { success: true, credentialId: verifyData.credentialId || registrationResponse.id };
    }

    return { success: false, error: verifyData.error || 'Verificación biométrica fallida en servidor' };
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
 * Autentica al usuario usando el sensor biométrico del dispositivo y valida criptográficamente con el servidor
 */
export async function verifyBiometricCredential(
  credentialId?: string | null,
  userId = 'usr-default'
): Promise<{ success: boolean; error?: string; token?: string; user?: any }> {
  try {
    const support = await checkWebAuthnSupport();
    if (!support.isSupported) {
      return { success: false, error: 'Biometría no soportada en este dispositivo.' };
    }

    // 1. Obtener opciones criptográficas de autenticación del servidor
    const optionsResp = await fetch('/api/auth/webauthn/generate-authentication-options', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credentialId, userId }),
    });

    if (!optionsResp.ok) {
      const err = await optionsResp.json().catch(() => ({}));
      return { success: false, error: err.error || 'No se pudieron generar opciones de autenticación biométrica.' };
    }

    const options = await optionsResp.json();

    // 2. Usar @simplewebauthn/browser para iniciar la autenticación
    const { startAuthentication } = await import('@simplewebauthn/browser');
    const authResponse = await startAuthentication({ optionsJSON: options });

    // 3. Enviar aserción al servidor para verificación criptográfica estricta
    const verifyResp = await fetch('/api/auth/webauthn/verify-authentication', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        response: authResponse,
        userId,
      }),
    });

    const verifyData = await verifyResp.json();
    if (verifyResp.ok && verifyData.verified) {
      return {
        success: true,
        token: verifyData.token,
        user: verifyData.user,
      };
    }

    return { success: false, error: verifyData.error || 'Aserción biométrica rechazada por el servidor' };
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
