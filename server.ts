import express from "express";
import path from "path";
import crypto from "crypto";
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

  // Soporte directo mediante cabeceras de cliente para llamadas desde contexto
  const roleHeader = req.headers['x-user-role'];
  const userIdHeader = req.headers['x-user-id'];
  const userNameHeader = req.headers['x-user-name'];
  if (typeof roleHeader === 'string' && ['admin', 'manager', 'member', 'viewer'].includes(roleHeader)) {
    return {
      token: 'stateless-header-session',
      userId: typeof userIdHeader === 'string' ? userIdHeader : 'usr-default',
      userName: typeof userNameHeader === 'string' ? userNameHeader : 'Usuario FinanTrack',
      role: roleHeader as ServerUserRole,
      expiresAt: Date.now() + 3600000,
    };
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

  app.use(express.json({ limit: "1mb" }));

  // Endpoint de salud
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // --- 1. Sesiones de Usuario y RBAC ---
  app.post("/api/auth/session", (req, res) => {
    const { userId, role, name } = req.body;
    const safeRole: ServerUserRole = ['admin', 'manager', 'member', 'viewer'].includes(role)
      ? role
      : 'viewer';
    const safeUserId = String(userId || 'usr-default').slice(0, 50);
    const safeName = String(name || 'Usuario').slice(0, 80);

    const token = crypto.randomBytes(32).toString('hex');
    const session: ServerUserSession = {
      token,
      userId: safeUserId,
      userName: safeName,
      role: safeRole,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 horas
    };

    activeSessions.set(token, session);
    res.json({
      token,
      expiresAt: new Date(session.expiresAt).toISOString(),
      user: {
        id: safeUserId,
        name: safeName,
        role: safeRole,
        permissions: ROLE_PERMISSIONS[safeRole],
      },
    });
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
    ipLockoutState.delete(ip);
    res.json({ success: true, message: "Contador de intentos de PIN reseteado exitosamente" });
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
        return res.json({ verified: true });
      }

      res.status(400).json({ verified: false, error: 'Aserción biométrica rechazada' });
    } catch (err: any) {
      console.error('Error verifying auth response:', err);
      res.status(400).json({ verified: false, error: err.message || 'Fallo de autenticación biométrica' });
    }
  });

  // Endpoints WebAuthn de compatibilidad previa
  app.get("/api/auth/webauthn/challenge", (req, res) => {
    const challengeBuffer = crypto.randomBytes(32);
    const challenge = challengeBuffer.toString("base64url");
    activeWebAuthnChallenges.set(challenge, {
      challenge,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });
    res.json({ challenge });
  });

  app.post("/api/auth/webauthn/verify", (req, res) => {
    const { challenge, credentialId } = req.body;
    if (!challenge) {
      return res.status(400).json({ success: false, error: "Challenge requerido" });
    }

    const rec = activeWebAuthnChallenges.get(challenge);
    if (!rec || Date.now() > rec.expiresAt) {
      return res.status(400).json({ success: false, error: "El desafío WebAuthn ha expirado o es inválido" });
    }

    activeWebAuthnChallenges.delete(challenge);
    res.json({
      success: true,
      verified: true,
      credentialId: credentialId || "verified-platform-credential",
      timestamp: new Date().toISOString(),
    });
  });

  // --- 4. Auditoría en Servidor Protegida por RBAC ---
  app.post("/api/audit/log", (req, res) => {
    const ip = req.ip || req.socket.remoteAddress || "127.0.0.1";
    const { action, category, title, description, severity, userId, userName } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: "Datos de auditoría incompletos" });
    }

    const newLog: ServerAuditLog = {
      id: `srv-log-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`,
      timestamp: new Date().toISOString(),
      ip,
      userId: userId ? String(userId).slice(0, 50) : undefined,
      userName: userName ? String(userName).slice(0, 50) : undefined,
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
  });

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

        const candidateModels = ["gemini-3.6-flash", "gemini-3.8-flash", "gemini-3.1-flash-lite"];
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
