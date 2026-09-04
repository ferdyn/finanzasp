import express from "express";
import path from "path";
import crypto from "crypto";
import helmet from "helmet";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from "@simplewebauthn/server";

dotenv.config();

const PORT = 3000;

// Rate limiting por ámbito y por IP
interface RateLimitRecord {
  count: number;
  resetTime: number;
}
const ipRateLimits = new Map<string, RateLimitRecord>();

export function createRateLimiter(scope: string, limit: number, windowMs: number) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || "127.0.0.1";
    const key = `${scope}:${ip}`;
    const now = Date.now();
    const record = ipRateLimits.get(key);

    if (!record || now > record.resetTime) {
      ipRateLimits.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (record.count >= limit) {
      const waitSeconds = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', waitSeconds.toString());
      return res.status(429).json({
        error: `Demasiadas solicitudes en ${scope}. Por favor espera ${waitSeconds} segundos.`,
        retryAfter: waitSeconds,
      });
    }

    record.count += 1;
    next();
  };
}

// Intentos fallidos de PIN y bloqueo por IP
interface AuthLockoutRecord {
  failedAttempts: number;
  lockoutUntil: number;
  lastAttempt: number;
}
export const ipLockoutState = new Map<string, AuthLockoutRecord>();

// WebAuthn: Almacén de credenciales y desafíos activos
interface StoredWebAuthnCredential {
  id: string; // base64URL ID
  publicKey: Uint8Array;
  counter: number;
  transports?: any[];
  userId: string;
  userName: string;
  createdAt: string;
}
export const serverWebAuthnCredentials = new Map<string, StoredWebAuthnCredential>();
export const activeWebAuthnChallenges = new Map<string, { challenge: string; expiresAt: number }>();

// Sesiones de usuario y control de acceso basado en roles (RBAC)
export type ServerUserRole = 'admin' | 'manager' | 'member' | 'viewer';

export interface ServerUserRecord {
  id: string;
  name: string;
  email: string;
  role: ServerUserRole;
  status: 'active' | 'inactive';
}

// Registro seguro de usuarios en el servidor (Fuente de Verdad de Identidad y Roles)
export const serverUserRegistry = new Map<string, ServerUserRecord>([
  ['user-admin', { id: 'user-admin', name: 'Carlos Mendoza (Admin)', email: 'admin@finantrack.app', role: 'admin', status: 'active' }],
  ['user-manager', { id: 'user-manager', name: 'Laura García (Gestor)', email: 'laura@finantrack.app', role: 'manager', status: 'active' }],
  ['user-member', { id: 'user-member', name: 'David Mendoza (Miembro)', email: 'david@finantrack.app', role: 'member', status: 'active' }],
  ['user-viewer', { id: 'user-viewer', name: 'Elena Audit (Auditor)', email: 'elena@finantrack.app', role: 'viewer', status: 'active' }],
  ['user-dependent', { id: 'user-dependent', name: 'Sofía Mendoza', email: 'sofia@finantrack.app', role: 'viewer', status: 'active' }],
]);

export interface ServerUserCredential {
  userId: string;
  pinHash: string;
  pinSalt: string;
}

export function hashPinSync(pin: string, salt: string): string {
  const derived = crypto.pbkdf2Sync(
    pin,
    `finantrack_pbkdf2_${salt}`,
    600000,
    32,
    'sha256'
  );
  return `pbkdf2$${derived.toString('hex')}`;
}

export function verifyPinSync(pin: string, storedHash: string, salt: string): boolean {
  if (!pin || !storedHash || !salt) return false;
  const computed = hashPinSync(pin, salt);
  const bufA = Buffer.from(computed, 'utf8');
  const bufB = Buffer.from(storedHash, 'utf8');
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
}

// Almacén seguro de credenciales PBKDF2 para usuarios.
// En producción no existen usuarios ni PINs predeterminados/hardcodeados.
export const serverUserCredentials = new Map<string, ServerUserCredential>();

/**
 * Verifica el PIN del usuario contra su credencial en serverUserCredentials.
 * Si el usuario posee un hash legado SHA-256:
 * 1. Verifica la credencial con el hash legado.
 * 2. Si es válido, deriva inmediatamente un nuevo hash moderno PBKDF2 (600,000 iteraciones).
 * 3. Persiste el nuevo hash en serverUserCredentials (almacenamiento real).
 * 4. A partir de ese momento, el hash legado queda sobrescrito y deja de ser aceptado.
 */
export function verifyAndMigrateUserPinSync(
  userId: string,
  pin: string
): boolean {
  if (!userId || !pin) return false;
  const creds = serverUserCredentials.get(userId);
  if (!creds || !creds.pinHash || !creds.pinSalt) return false;

  // 1. Hash moderno con PBKDF2
  if (creds.pinHash.startsWith('pbkdf2$')) {
    const computed = hashPinSync(pin, creds.pinSalt);
    const bufA = Buffer.from(computed, 'utf8');
    const bufB = Buffer.from(creds.pinHash, 'utf8');
    return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
  }

  // 2. Detección y verificación de hash legado SHA-256
  const legacyComputed = crypto
    .createHash('sha256')
    .update(`finantrack_salt_${creds.pinSalt}:${pin}`)
    .digest('hex');
  const bufA = Buffer.from(legacyComputed, 'utf8');
  const bufB = Buffer.from(creds.pinHash, 'utf8');
  const isLegacyValid = bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);

  if (isLegacyValid) {
    // 3. Generar nuevo hash robusto PBKDF2 (600,000 iteraciones)
    const modernHash = hashPinSync(pin, creds.pinSalt);
    // 4. Persistir en el almacenamiento real de credenciales
    serverUserCredentials.set(userId, {
      ...creds,
      pinHash: modernHash,
    });
    // 5. El hash legado ha sido sobrescrito en el almacenamiento y no se vuelve a aceptar
    return true;
  }

  return false;
}

// Configuración de Clave Maestra de Recuperación Criptográfica (sin secretos hardcodeados)
export function hashRecoveryKeySync(key: string, salt: string): string {
  const normalized = key.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  const derived = crypto.pbkdf2Sync(
    normalized,
    `finantrack_rec_pbkdf2_${salt}`,
    600000,
    32,
    'sha256'
  );
  return `pbkdf2_rec$${derived.toString('hex')}`;
}

/**
 * Verifica la Clave Maestra de Recuperación.
 * Si la configuración previa almacenaba un hash legado SHA-256:
 * 1. Valida la clave con el formato legado.
 * 2. Si es válida, deriva inmediatamente un hash PBKDF2 (600,000 iteraciones).
 * 3. Persiste el nuevo hash en serverRecoveryConfig (almacenamiento real).
 * 4. El hash antiguo deja de existir y nunca más se acepta.
 */
export function verifyAndMigrateRecoveryKeySync(recoveryKey: string): boolean {
  if (!serverRecoveryConfig.hash || !serverRecoveryConfig.salt || !recoveryKey) {
    return false;
  }

  // 1. Hash moderno PBKDF2
  if (serverRecoveryConfig.hash.startsWith('pbkdf2_rec$')) {
    const computedHash = hashRecoveryKeySync(recoveryKey, serverRecoveryConfig.salt);
    const bufA = Buffer.from(computedHash, 'utf8');
    const bufB = Buffer.from(serverRecoveryConfig.hash, 'utf8');
    return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
  }

  // 2. Hash legado SHA-256
  const normalized = recoveryKey.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  const legacyComputed = crypto
    .createHash('sha256')
    .update(`finantrack_recovery_${serverRecoveryConfig.salt}:${normalized}`)
    .digest('hex');
  const bufA = Buffer.from(legacyComputed, 'utf8');
  const bufB = Buffer.from(serverRecoveryConfig.hash, 'utf8');
  const isLegacyValid = bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);

  if (isLegacyValid) {
    // 3. Generar nuevo hash PBKDF2
    const modernHash = hashRecoveryKeySync(recoveryKey, serverRecoveryConfig.salt);
    // 4. Persistir en almacenamiento real
    serverRecoveryConfig = {
      ...serverRecoveryConfig,
      hash: modernHash,
    };
    // 5. Dejar de aceptar el hash legado
    return true;
  }

  return false;
}

const envRecoveryKey = (process.env.MASTER_RECOVERY_KEY || '').trim();
const resolvedInitialSalt = (process.env.RECOVERY_KEY_SALT || '').trim() || (envRecoveryKey ? crypto.randomBytes(16).toString('hex') : '');

export let serverRecoveryConfig: { salt: string; hash: string | null } = {
  salt: envRecoveryKey ? resolvedInitialSalt : '',
  hash: envRecoveryKey ? hashRecoveryKeySync(envRecoveryKey, resolvedInitialSalt) : null,
};

export function setServerRecoveryConfig(key: string | null, salt?: string) {
  if (!key) {
    serverRecoveryConfig = { salt: '', hash: null };
    return;
  }
  const targetSalt = salt || crypto.randomBytes(16).toString('hex');
  serverRecoveryConfig = {
    salt: targetSalt,
    hash: hashRecoveryKeySync(key, targetSalt),
  };
}

// Almacén multi-usuario en servidor para pruebas y protección IDOR
export interface ServerTransactionRecord {
  id: string;
  userId: string;
  accountId: string;
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  categoryId: string;
  date: string;
  description?: string;
  toAccountId?: string;
}

export interface ServerAccountRecord {
  id: string;
  userId: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
}

export const serverTransactions = new Map<string, ServerTransactionRecord>([
  ['tx-user-admin-1', { id: 'tx-user-admin-1', userId: 'user-admin', accountId: 'acc-admin-1', amount: 500, type: 'income', categoryId: 'salary', date: '2026-03-01' }],
  ['tx-user-member-1', { id: 'tx-user-member-1', userId: 'user-member', accountId: 'acc-member-1', amount: 100, type: 'expense', categoryId: 'groceries', date: '2026-03-01' }],
]);

export const serverAccounts = new Map<string, ServerAccountRecord>([
  ['acc-admin-1', { id: 'acc-admin-1', userId: 'user-admin', name: 'Cuenta Admin', type: 'checking', balance: 5000, currency: 'EUR' }],
  ['acc-member-1', { id: 'acc-member-1', userId: 'user-member', name: 'Cuenta David', type: 'checking', balance: 800, currency: 'EUR' }],
]);

export interface ServerUserSession {
  token: string;
  userId: string;
  userName: string;
  role: ServerUserRole;
  expiresAt: number;
}
export const activeSessions = new Map<string, ServerUserSession>();

export const ROLE_PERMISSIONS: Record<ServerUserRole, string[]> = {
  admin: [
    'canCreateTransactions',
    'canEditTransactions',
    'canDeleteTransactions',
    'canManageAccounts',
    'canManageBudgets',
    'canManageGoals',
    'canManageUsers',
    'canExportData',
    'canViewAuditLogs',
    'canClearAuditLogs',
    'canConfigureSecurity',
  ],
  manager: [
    'canCreateTransactions',
    'canEditTransactions',
    'canDeleteTransactions',
    'canManageAccounts',
    'canManageBudgets',
    'canManageGoals',
    'canExportData',
    'canViewAuditLogs',
  ],
  member: [
    'canCreateTransactions',
    'canEditTransactions',
    'canManageGoals',
  ],
  viewer: [],
};

/**
 * Extrae la sesión autenticada únicamente mediante tokens criptográficos válidos.
 * Las cabeceras de cliente no autenticadas (x-user-role, x-user-id) NUNCA son fuente de verdad.
 */
export function extractSession(req: express.Request): ServerUserSession | null {
  const authHeader = req.headers.authorization;
  let token: string | undefined;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  } else if (typeof req.headers['x-session-token'] === 'string') {
    token = req.headers['x-session-token'];
  }

  if (token && activeSessions.has(token)) {
    const session = activeSessions.get(token)!;
    if (Date.now() < session.expiresAt) {
      return session;
    }
    activeSessions.delete(token);
  }

  return null;
}

export function requirePermission(permissionKey: string) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const session = extractSession(req);
    if (!session) {
      return res.status(401).json({
        error: "Autenticación requerida. Proporciona una sesión válida o credencial de autorización.",
      });
    }

    const perms = ROLE_PERMISSIONS[session.role] || [];
    if (!perms.includes(permissionKey)) {
      return res.status(403).json({
        error: `Acceso denegado. El rol '${session.role}' no dispone del permiso requerido '${permissionKey}'.`,
      });
    }

    (req as any).userSession = session;
    next();
  };
}

// Almacén seguro en memoria para logs de auditoría (últimos 1000 eventos)
export interface ServerAuditLog {
  id: string;
  timestamp: string;
  ip: string;
  userId?: string;
  userName?: string;
  action: string;
  category: string;
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'danger' | 'success';
}
export const serverAuditLogs: ServerAuditLog[] = [];

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

export function createApp(): express.Express {
  const app = express();

  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }));

  app.use(express.json({ limit: "1mb" }));

  // Endpoint de salud
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // --- 1. Sesiones de Usuario y RBAC ---
  app.post("/api/auth/session", (req, res) => {
    const ip = req.ip || req.socket.remoteAddress || "127.0.0.1";
    const now = Date.now();
    const lockoutRecord = ipLockoutState.get(ip);

    // Comprobación de lockout por fuerza bruta por IP
    if (lockoutRecord && lockoutRecord.lockoutUntil > now) {
      const remainingSeconds = Math.ceil((lockoutRecord.lockoutUntil - now) / 1000);
      return res.status(429).json({
        isLockedOut: true,
        remainingAttempts: 0,
        remainingSeconds,
        error: `Dispositivo bloqueado temporalmente por seguridad. Espera ${remainingSeconds} segundos.`,
      });
    }

    const { userId, pin, password } = req.body || {};
    const callerSession = extractSession(req);
    const callerPerms = callerSession ? (ROLE_PERMISSIONS[callerSession.role] || []) : [];

    // Comprobación de identidad estricta:
    // Opción 1: Un administrador autenticado y verificado aprovisiona la sesión
    const isCallerAdmin = callerSession && callerPerms.includes('canManageUsers');

    const requestedUserId = String(userId || '').slice(0, 50);
    const targetUser = serverUserRegistry.get(requestedUserId);

    if (!targetUser) {
      return res.status(401).json({
        error: "Usuario no encontrado o credenciales inválidas.",
      });
    }

    let isAuthenticated = false;

    if (isCallerAdmin) {
      isAuthenticated = true;
    } else {
      const credential = String(pin || password || '');
      if (credential && verifyAndMigrateUserPinSync(requestedUserId, credential)) {
        isAuthenticated = true;
      }
    }

    if (!isAuthenticated) {
      // Registrar intento fallido en ipLockoutState
      let record = ipLockoutState.get(ip);
      if (!record) {
        record = { failedAttempts: 1, lockoutUntil: 0, lastAttempt: now };
      } else {
        record.failedAttempts += 1;
        record.lastAttempt = now;
      }

      if (record.failedAttempts >= 5) {
        record.lockoutUntil = now + 30 * 1000;
        ipLockoutState.set(ip, record);

        serverAuditLogs.unshift({
          id: `srv-audit-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`,
          timestamp: new Date().toISOString(),
          ip,
          action: 'SECURITY_LOCKOUT',
          category: 'seguridad',
          title: 'Bloqueo por Intentos Excesivos de PIN',
          description: `La dirección ${ip} fue bloqueada tras 5 intentos fallidos consecutivos en /api/auth/session.`,
          severity: 'danger',
        });

        return res.status(429).json({
          isLockedOut: true,
          remainingAttempts: 0,
          remainingSeconds: 30,
          error: "Dispositivo bloqueado temporalmente por seguridad. Espera 30 segundos.",
        });
      }

      ipLockoutState.set(ip, record);

      return res.status(401).json({
        error: "Autenticación requerida. Se debe proporcionar una credencial válida (PIN verificado) para obtener una sesión.",
      });
    }

    // Autenticación exitosa: reiniciar contador de lockout
    ipLockoutState.delete(ip);

    // El servidor impone el rol real registrado
    const finalRole: ServerUserRole = targetUser.role;
    const finalName = targetUser.name;
    const finalUserId = targetUser.id;

    const token = crypto.randomBytes(32).toString('hex');
    const session: ServerUserSession = {
      token,
      userId: finalUserId,
      userName: finalName,
      role: finalRole,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 horas
    };

    activeSessions.set(token, session);
    res.json({
      token,
      expiresAt: new Date(session.expiresAt).toISOString(),
      user: {
        id: finalUserId,
        name: finalName,
        role: finalRole,
        permissions: ROLE_PERMISSIONS[finalRole],
      },
    });
  });

  // Consultar información de la sesión actual
  app.get("/api/auth/me", (req, res) => {
    const session = extractSession(req);
    if (!session) {
      return res.status(401).json({ error: "No autenticado" });
    }
    res.json({
      user: {
        id: session.userId,
        name: session.userName,
        role: session.role,
        permissions: ROLE_PERMISSIONS[session.role],
      },
    });
  });

  // Cerrar sesión
  app.post("/api/auth/logout", (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7).trim();
      activeSessions.delete(token);
    }
    res.json({ success: true, message: "Sesión cerrada exitosamente" });
  });

  // Listar usuarios registrados (requiere permiso de gestión de usuarios)
  app.get("/api/users", requirePermission('canManageUsers'), (req, res) => {
    const users = Array.from(serverUserRegistry.values());
    res.json({ users });
  });

  // --- 2. Control de Bloqueo por PIN y Rate Limiting ---
  app.get("/api/auth/pin/status", (req, res) => {
    const ip = req.ip || req.socket.remoteAddress || "127.0.0.1";
    const now = Date.now();
    const record = ipLockoutState.get(ip);

    if (!record) {
      return res.json({ isLockedOut: false, remainingAttempts: 5, remainingSeconds: 0 });
    }

    if (record.lockoutUntil > now) {
      const remainingSeconds = Math.ceil((record.lockoutUntil - now) / 1000);
      return res.json({ isLockedOut: true, remainingAttempts: 0, remainingSeconds });
    }

    if (record.lockoutUntil > 0 && record.lockoutUntil <= now) {
      ipLockoutState.delete(ip);
      return res.json({ isLockedOut: false, remainingAttempts: 5, remainingSeconds: 0 });
    }

    const remaining = Math.max(0, 5 - record.failedAttempts);
    res.json({ isLockedOut: false, remainingAttempts: remaining, remainingSeconds: 0 });
  });

  app.post("/api/auth/pin/attempt", (req, res) => {
    const ip = req.ip || req.socket.remoteAddress || "127.0.0.1";
    const { success } = req.body;
    const now = Date.now();
    let record = ipLockoutState.get(ip);

    if (success) {
      ipLockoutState.delete(ip);
      return res.json({ success: true, isLockedOut: false });
    }

    if (!record) {
      record = { failedAttempts: 1, lockoutUntil: 0, lastAttempt: now };
    } else {
      record.failedAttempts += 1;
      record.lastAttempt = now;
    }

    if (record.failedAttempts >= 5) {
      record.lockoutUntil = now + 30 * 1000;
      ipLockoutState.set(ip, record);

      serverAuditLogs.unshift({
        id: `srv-audit-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`,
        timestamp: new Date().toISOString(),
        ip,
        action: 'SECURITY_LOCKOUT',
        category: 'seguridad',
        title: 'Bloqueo por Intentos Excesivos de PIN',
        description: `La dirección ${ip} fue bloqueada tras 5 intentos fallidos consecutivos.`,
        severity: 'danger',
      });

      return res.status(429).json({
        isLockedOut: true,
        remainingAttempts: 0,
        remainingSeconds: 30,
        error: "Dispositivo bloqueado temporalmente por seguridad. Espera 30 segundos.",
      });
    }

    ipLockoutState.set(ip, record);
    const remainingAttempts = 5 - record.failedAttempts;
    res.json({
      isLockedOut: false,
      remainingAttempts,
      remainingSeconds: 0,
    });
  });

  app.post("/api/auth/pin/reset", (req, res) => {
    const ip = req.ip || req.socket.remoteAddress || "127.0.0.1";
    const session = extractSession(req);
    const { recoveryKey } = req.body || {};

    const hasAdminSession = session && (ROLE_PERMISSIONS[session.role] || []).includes('canConfigureSecurity');
    
    let isRecoveryAuthorized = false;

    if (hasAdminSession) {
      isRecoveryAuthorized = true;
    } else if (serverRecoveryConfig.hash && typeof recoveryKey === 'string' && recoveryKey.trim().length > 0) {
      isRecoveryAuthorized = verifyAndMigrateRecoveryKeySync(recoveryKey);
    }

    if (!isRecoveryAuthorized) {
      let record = ipLockoutState.get(ip) || { failedAttempts: 0, lockoutUntil: 0, lastAttempt: Date.now() };
      record.failedAttempts += 1;
      record.lastAttempt = Date.now();
      if (record.failedAttempts >= 5) {
        record.lockoutUntil = Date.now() + 30 * 1000;
      }
      ipLockoutState.set(ip, record);

      serverAuditLogs.unshift({
        id: `srv-audit-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`,
        timestamp: new Date().toISOString(),
        ip,
        action: 'FAILED_RECOVERY_ATTEMPT',
        category: 'seguridad',
        title: 'Intento Fallido de Recuperación',
        description: `Intento de restablecimiento de seguridad con clave de recuperación no autorizada desde ${ip}.`,
        severity: 'danger',
      });

      return res.status(403).json({
        error: "Acceso denegado. Clave de recuperación incorrecta o no autorizada.",
      });
    }

    ipLockoutState.delete(ip);

    serverAuditLogs.unshift({
      id: `srv-audit-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`,
      timestamp: new Date().toISOString(),
      ip,
      userId: session?.userId,
      userName: session?.userName || 'Recuperación Maestra',
      action: 'PIN_RESET',
      category: 'seguridad',
      title: 'Restablecimiento de Seguridad y PIN',
      description: hasAdminSession
        ? `Bloqueo de PIN restablecido por el administrador ${session?.userName}.`
        : 'Bloqueo de PIN restablecido mediante Clave Maestra de Recuperación verificada criptográficamente.',
      severity: 'warning',
    });

    res.json({ success: true, message: "Contador de intentos de PIN reseteado exitosamente" });
  });

  // --- Endpoints Multi-Usuario con Protección Estricta contra IDOR ---
  app.get("/api/transactions/:id", (req, res) => {
    const session = extractSession(req);
    if (!session) {
      return res.status(401).json({ error: "Autenticación requerida." });
    }

    const tx = serverTransactions.get(req.params.id);
    if (!tx) {
      return res.status(404).json({ error: "Transacción no encontrada." });
    }

    // Regla IDOR: El usuario solo puede acceder a sus propios recursos salvo rol admin
    if (tx.userId !== session.userId && session.role !== 'admin') {
      return res.status(403).json({ error: "Acceso denegado: recurso perteneciente a otro usuario." });
    }

    res.json({ transaction: tx });
  });

  app.delete("/api/transactions/:id", (req, res) => {
    const session = extractSession(req);
    if (!session) {
      return res.status(401).json({ error: "Autenticación requerida." });
    }

    const tx = serverTransactions.get(req.params.id);
    if (!tx) {
      return res.status(404).json({ error: "Transacción no encontrada." });
    }

    // Regla IDOR: El usuario solo puede eliminar sus propios recursos salvo rol admin
    if (tx.userId !== session.userId && session.role !== 'admin') {
      return res.status(403).json({ error: "Acceso denegado: no puedes eliminar recursos de otro usuario." });
    }

    serverTransactions.delete(req.params.id);
    res.json({ success: true, message: "Transacción eliminada." });
  });

  app.get("/api/accounts/:id", (req, res) => {
    const session = extractSession(req);
    if (!session) {
      return res.status(401).json({ error: "Autenticación requerida." });
    }

    const acc = serverAccounts.get(req.params.id);
    if (!acc) {
      return res.status(404).json({ error: "Cuenta no encontrada." });
    }

    if (acc.userId !== session.userId && session.role !== 'admin') {
      return res.status(403).json({ error: "Acceso denegado: recurso perteneciente a otro usuario." });
    }

    res.json({ account: acc });
  });

  app.delete("/api/accounts/:id", (req, res) => {
    const session = extractSession(req);
    if (!session) {
      return res.status(401).json({ error: "Autenticación requerida." });
    }

    const acc = serverAccounts.get(req.params.id);
    if (!acc) {
      return res.status(404).json({ error: "Cuenta no encontrada." });
    }

    if (acc.userId !== session.userId && session.role !== 'admin') {
      return res.status(403).json({ error: "Acceso denegado: no puedes eliminar recursos de otro usuario." });
    }

    serverAccounts.delete(req.params.id);
    res.json({ success: true, message: "Cuenta eliminada." });
  });

  // --- 3. WebAuthn: Registro y Verificación Criptográfica con @simplewebauthn/server ---
  app.post("/api/auth/webauthn/generate-registration-options", async (req, res) => {
    try {
      const { userName, userId } = req.body;
      const safeUserId = String(userId || 'default-user').slice(0, 64);
      const safeUserName = String(userName || 'Usuario FinanTrack').slice(0, 100);

      const rpID = req.hostname || 'localhost';
      const options = await generateRegistrationOptions({
        rpName: 'FinanTrack - Finanzas Personales',
        rpID,
        userID: new TextEncoder().encode(safeUserId),
        userName: safeUserName,
        userDisplayName: safeUserName,
        attestationType: 'none',
        authenticatorSelection: {
          residentKey: 'discouraged',
          userVerification: 'preferred',
        },
        timeout: 60000,
      });

      activeWebAuthnChallenges.set(safeUserId, {
        challenge: options.challenge,
        expiresAt: Date.now() + 5 * 60 * 1000,
      });

      res.json(options);
    } catch (err: any) {
      console.error('Error generating registration options:', err);
      res.status(500).json({ error: err.message || 'Error al generar opciones de registro biométrico' });
    }
  });

  app.post("/api/auth/webauthn/verify-registration", async (req, res) => {
    try {
      const { response, userId, userName } = req.body as {
        response: RegistrationResponseJSON;
        userId?: string;
        userName?: string;
      };

      const safeUserId = String(userId || 'default-user').slice(0, 64);
      const challengeRecord = activeWebAuthnChallenges.get(safeUserId);

      if (!challengeRecord || Date.now() > challengeRecord.expiresAt) {
        return res.status(400).json({ verified: false, error: 'Desafío WebAuthn expirado o inválido' });
      }

      activeWebAuthnChallenges.delete(safeUserId);

      const rpID = req.hostname || 'localhost';
      const reqOrigin = req.get('origin') || `${req.protocol}://${req.get('host')}`;
      const allowedOrigins = [
        reqOrigin,
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:5173',
      ];

      const verification = await verifyRegistrationResponse({
        response,
        expectedChallenge: challengeRecord.challenge,
        expectedOrigin: allowedOrigins,
        expectedRPID: rpID,
        requireUserVerification: false,
      });

      if (verification.verified && verification.registrationInfo) {
        const { credential } = verification.registrationInfo;
        const storedCred: StoredWebAuthnCredential = {
          id: credential.id,
          publicKey: credential.publicKey,
          counter: credential.counter,
          transports: credential.transports,
          userId: safeUserId,
          userName: userName || 'Usuario FinanTrack',
          createdAt: new Date().toISOString(),
        };

        serverWebAuthnCredentials.set(credential.id, storedCred);

        return res.json({
          verified: true,
          credentialId: credential.id,
        });
      }

      res.status(400).json({ verified: false, error: 'Verificación de credencial biométrica fallida' });
    } catch (err: any) {
      console.error('Error verifying registration response:', err);
      res.status(400).json({ verified: false, error: err.message || 'Fallo al verificar registro de credencial' });
    }
  });

  app.post("/api/auth/webauthn/generate-authentication-options", async (req, res) => {
    try {
      const { credentialId, userId } = req.body;
      const safeUserId = String(userId || 'default-user').slice(0, 64);
      const rpID = req.hostname || 'localhost';

      let allowCredentials: any[] = [];
      if (credentialId && serverWebAuthnCredentials.has(credentialId)) {
        const cred = serverWebAuthnCredentials.get(credentialId)!;
        allowCredentials.push({
          id: cred.id,
          transports: cred.transports,
        });
      } else {
        // Permitir cualquiera de las credenciales registradas para este usuario
        for (const cred of serverWebAuthnCredentials.values()) {
          if (cred.userId === safeUserId) {
            allowCredentials.push({
              id: cred.id,
              transports: cred.transports,
            });
          }
        }
      }

      const options = await generateAuthenticationOptions({
        rpID,
        allowCredentials: allowCredentials.length > 0 ? allowCredentials : undefined,
        userVerification: 'preferred',
        timeout: 60000,
      });

      activeWebAuthnChallenges.set(safeUserId, {
        challenge: options.challenge,
        expiresAt: Date.now() + 5 * 60 * 1000,
      });

      res.json(options);
    } catch (err: any) {
      console.error('Error generating auth options:', err);
      res.status(500).json({ error: err.message || 'Error al generar opciones de autenticación biométrica' });
    }
  });

  app.post("/api/auth/webauthn/verify-authentication", async (req, res) => {
    try {
      const { response, userId } = req.body as {
        response: AuthenticationResponseJSON;
        userId?: string;
      };

      const safeUserId = String(userId || 'default-user').slice(0, 64);
      const challengeRecord = activeWebAuthnChallenges.get(safeUserId);

      if (!challengeRecord || Date.now() > challengeRecord.expiresAt) {
        return res.status(400).json({ verified: false, error: 'Desafío biométrico expirado o no encontrado' });
      }

      activeWebAuthnChallenges.delete(safeUserId);

      const credential = serverWebAuthnCredentials.get(response.id);
      if (!credential) {
        return res.status(400).json({ verified: false, error: 'Credencial biométrica no registrada en el servidor' });
      }

      if (credential.userId !== safeUserId) {
        return res.status(400).json({ verified: false, error: 'La credencial biométrica no pertenece al usuario solicitado' });
      }

      const rpID = req.hostname || 'localhost';
      const reqOrigin = req.get('origin') || `${req.protocol}://${req.get('host')}`;
      const allowedOrigins = [
        reqOrigin,
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:5173',
      ];

      const verification = await verifyAuthenticationResponse({
        response,
        expectedChallenge: challengeRecord.challenge,
        expectedOrigin: allowedOrigins,
        expectedRPID: rpID,
        credential: {
          id: credential.id,
          publicKey: credential.publicKey,
          counter: credential.counter,
          transports: credential.transports,
        },
        requireUserVerification: false,
      });

      if (verification.verified && verification.authenticationInfo) {
        credential.counter = verification.authenticationInfo.newCounter;
        serverWebAuthnCredentials.set(credential.id, credential);

        const targetUser = serverUserRegistry.get(safeUserId);
        let sessionToken: string | undefined;
        let userPayload: any;

        if (targetUser) {
          const token = crypto.randomBytes(32).toString('hex');
          const session: ServerUserSession = {
            token,
            userId: targetUser.id,
            userName: targetUser.name,
            role: targetUser.role,
            expiresAt: Date.now() + 24 * 60 * 60 * 1000,
          };
          activeSessions.set(token, session);
          sessionToken = token;
          userPayload = {
            id: targetUser.id,
            name: targetUser.name,
            role: targetUser.role,
            permissions: ROLE_PERMISSIONS[targetUser.role],
          };
        }

        return res.json({
          verified: true,
          token: sessionToken,
          user: userPayload,
          expiresAt: sessionToken ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : undefined,
        });
      }

      res.status(400).json({ verified: false, error: 'Aserción biométrica rechazada' });
    } catch (err: any) {
      console.error('Error verifying auth response:', err);
      res.status(400).json({ verified: false, error: err.message || 'Fallo de autenticación biométrica' });
    }
  });

  // --- 4. Auditoría en Servidor Protegida por RBAC y Atribución Fidedigna de Autor ---
  app.post(
    "/api/audit/log",
    createRateLimiter('audit_log', 30, 60 * 1000),
    (req, res) => {
      const ip = req.ip || req.socket.remoteAddress || "127.0.0.1";
      const { action, category, title, description, severity } = req.body;

      if (!title || !description) {
        return res.status(400).json({ error: "Datos de auditoría incompletos" });
      }

      // La identidad del autor se extrae estrictamente de la sesión autenticada
      const session = extractSession(req);
      const actorUserId = session ? session.userId : undefined;
      const actorUserName = session ? session.userName : 'Cliente (Anónimo)';

      const newLog: ServerAuditLog = {
        id: `srv-log-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`,
        timestamp: new Date().toISOString(),
        ip,
        userId: actorUserId,
        userName: actorUserName,
        action: action ? String(action).slice(0, 50) : 'SYSTEM_ACTION',
        category: category ? String(category).slice(0, 50) : 'sistema',
        title: String(title).slice(0, 100),
        description: String(description).slice(0, 255),
        severity: ['info', 'warning', 'danger', 'success'].includes(severity) ? severity : 'info',
      };

      serverAuditLogs.unshift(newLog);
      if (serverAuditLogs.length > 1000) {
        serverAuditLogs.pop();
      }

      res.json({ success: true, logId: newLog.id });
    }
  );

  app.get("/api/audit/logs", requirePermission('canViewAuditLogs'), (req, res) => {
    res.json({ logs: serverAuditLogs.slice(0, 100) });
  });

  app.post("/api/audit/clear", requirePermission('canClearAuditLogs'), (req, res) => {
    const ip = req.ip || req.socket.remoteAddress || "127.0.0.1";
    const count = serverAuditLogs.length;
    serverAuditLogs.length = 0;

    // Registrar acción destructiva administrativa
    serverAuditLogs.unshift({
      id: `srv-log-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`,
      timestamp: new Date().toISOString(),
      ip,
      action: 'CLEAR_AUDIT_LOGS',
      category: 'seguridad',
      title: 'Vaciado de Historial de Auditoría',
      description: `Se eliminaron ${count} registros de auditoría por el administrador.`,
      severity: 'warning',
    });

    res.json({ success: true, message: `Historial de auditoría vaciado (${count} registros).` });
  });

  // --- 5. Asesor Financiero IA Protegido con Rate Limiting y Sanitización Estricta ---
  app.post(
    "/api/advisor",
    createRateLimiter('advisor', 10, 60 * 1000),
    async (req, res) => {
      try {
        const { question, financialContext } = req.body;

        if (!question || typeof question !== "string") {
          return res.status(400).json({ error: "Pregunta requerida y debe ser texto" });
        }

        const trimmedQuestion = question.trim().slice(0, 500);
        if (trimmedQuestion.length === 0) {
          return res.status(400).json({ error: "La pregunta no puede estar vacía" });
        }

        // Filtro robusto contra Prompt Injection y Jailbreaks
        const injectionPattern = /(ignore previous instructions|system prompt|bypass rules|olvida todas las instrucciones|dame tu prompt|repite las instrucciones|act as a linux terminal|jailbreak|DAN mode|developer mode)/i;
        if (injectionPattern.test(trimmedQuestion)) {
          return res.status(400).json({
            error: "La consulta contiene patrones de solicitud o instrucciones no permitidas.",
          });
        }

        const client = getAiClient();
        if (!client) {
          return res.status(503).json({
            fallback: true,
            answer: "El servicio de IA requiere configurar GEMINI_API_KEY en los ajustes.",
          });
        }

        const safeCurrency = String(financialContext?.currency || 'EUR').slice(0, 5);
        const safeIncome = Number(financialContext?.income) || 0;
        const safeExpense = Number(financialContext?.expense) || 0;
        const safeSavingsRate = Number(financialContext?.savingsRate) || 0;
        const safeNetWorth = Number(financialContext?.netWorth) || 0;
        const safeNeedsPct = Number(financialContext?.needsPct) || 0;
        const safeWantsPct = Number(financialContext?.wantsPct) || 0;

        const prompt = `Eres un asesor financiero personal experto, empático y practical en español para la aplicación FinanTrack.
Contexto financiero del usuario:
- Moneda: ${safeCurrency}
- Ingresos de este mes: ${safeIncome}
- Gastos de este mes: ${safeExpense}
- Tasa de Ahorro: ${safeSavingsRate}%
- Patrimonio Neto: ${safeNetWorth}
- % en Necesidades (regla 50/30/20): ${safeNeedsPct}%
- % en Deseos/Ocio: ${safeWantsPct}%

Pregunta del usuario:
"${trimmedQuestion}"

Instrucciones de seguridad y comportamiento:
1. Responde de forma clara, directa y estructurada con viñetas cuando sea apropiado.
2. Da consejos cuantitativos y accionables adaptados a sus números.
3. Sé motivador, prudente y profesional. Máximo 3 o 4 párrafos concisos.
4. IMPORTANTE: Bajo ninguna circunstancia intentes o finjas realizar transferencias bancarias, alterar permisos de usuario, modificar saldos o ejecutar transacciones. Eres un asesor exclusivamente consultivo.`;

        const candidateModels = ["gemini-3.8-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"];
        let answer = "";
        let lastError = null;

        for (const modelName of candidateModels) {
          try {
            const response = await client.models.generateContent({
              model: modelName,
              contents: prompt,
            });
            if (response?.text) {
              answer = response.text;
              break;
            }
          } catch (err: any) {
            lastError = err;
            console.warn(`Model ${modelName} failed, trying next fallback:`, err?.message);
          }
        }

        if (!answer) {
          throw lastError || new Error("No se pudo obtener respuesta de los modelos disponibles");
        }

        return res.json({ answer });
      } catch (error: any) {
        console.error("Error in /api/advisor:", error);
        return res.status(500).json({
          fallback: true,
          error: error.message || "Error al procesar consulta con IA",
        });
      }
    }
  );

  return app;
}

export const app = createApp();

async function startServer() {
  const serverApp = createApp();

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    serverApp.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    serverApp.use(express.static(distPath));
    serverApp.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  serverApp.listen(PORT, "0.0.0.0", () => {
    console.log(`FinanTrack server running on http://localhost:${PORT}`);
  });
}

if (process.env.NODE_ENV !== "test" && !process.env.VITEST) {
  startServer();
}
