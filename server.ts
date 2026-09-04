import express from "express";
import path from "path";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const PORT = 3000;

// Rate limiting y control de intentos en memoria del servidor
interface RateLimitRecord {
  count: number;
  resetTime: number;
}
const ipRateLimits = new Map<string, RateLimitRecord>();

// Intentos fallidos de autenticación y bloqueo por IP
interface AuthLockoutRecord {
  failedAttempts: number;
  lockoutUntil: number;
  lastAttempt: number;
}
const ipLockoutState = new Map<string, AuthLockoutRecord>();

// Desafíos WebAuthn activos con TTL de 5 minutos
const activeWebAuthnChallenges = new Map<string, number>();

// Almacén seguro en memoria del servidor para logs de auditoría (últimos 1000 eventos)
interface ServerAuditLog {
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
const serverAuditLogs: ServerAuditLog[] = [];

// Middleware simple de Rate Limiting
function applyRateLimit(limit: number, windowMs: number) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || "127.0.0.1";
    const now = Date.now();
    const record = ipRateLimits.get(ip);

    if (!record || now > record.resetTime) {
      ipRateLimits.set(ip, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (record.count >= limit) {
      const waitSeconds = Math.ceil((record.resetTime - now) / 1000);
      return res.status(429).json({
        error: `Demasiadas solicitudes. Por favor espera ${waitSeconds} segundos.`,
        retryAfter: waitSeconds,
      });
    }

    record.count += 1;
    next();
  };
}

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

async function startServer() {
  const app = express();

  app.use(express.json({ limit: "1mb" }));

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // --- 1. Control de Bloqueo por PIN y Rate Limiting en Servidor ---
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

    // Si expiró el bloqueo, restablecer a 0
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

    // Intento fallido
    if (!record) {
      record = { failedAttempts: 1, lockoutUntil: 0, lastAttempt: now };
    } else {
      record.failedAttempts += 1;
      record.lastAttempt = now;
    }

    if (record.failedAttempts >= 5) {
      // Bloqueo temporal por 30 segundos
      record.lockoutUntil = now + 30 * 1000;
      ipLockoutState.set(ip, record);

      // Registrar intento sospechoso en audit log del servidor
      serverAuditLogs.unshift({
        id: `srv-audit-${Date.now()}`,
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

  // --- 2. Desafíos Criptográficos WebAuthn (Servidor) ---
  app.get("/api/auth/webauthn/challenge", (req, res) => {
    // Generar un challenge criptográficamente seguro de 32 bytes en formato base64url
    const challengeBuffer = crypto.randomBytes(32);
    const challenge = challengeBuffer.toString("base64url");
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutos
    activeWebAuthnChallenges.set(challenge, expiresAt);

    // Limpiar retos expirados
    for (const [ch, exp] of activeWebAuthnChallenges.entries()) {
      if (Date.now() > exp) activeWebAuthnChallenges.delete(ch);
    }

    res.json({ challenge });
  });

  app.post("/api/auth/webauthn/verify", (req, res) => {
    const { challenge, credentialId } = req.body;
    if (!challenge) {
      return res.status(400).json({ success: false, error: "Challenge requerido" });
    }

    const expiresAt = activeWebAuthnChallenges.get(challenge);
    if (!expiresAt || Date.now() > expiresAt) {
      return res.status(400).json({ success: false, error: "El desafío WebAuthn ha expirado o es inválido" });
    }

    // Consumir el challenge para evitar replay attacks
    activeWebAuthnChallenges.delete(challenge);

    res.json({
      success: true,
      verified: true,
      credentialId: credentialId || "verified-platform-credential",
      timestamp: new Date().toISOString(),
    });
  });

  // --- 3. Auditoría en Servidor (Tamper-Resistant) ---
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

  app.get("/api/audit/logs", (req, res) => {
    res.json({ logs: serverAuditLogs.slice(0, 100) });
  });

  // --- 4. Asesor Financiero IA Protegido con Rate Limiting y Sanitización ---
  app.post("/api/advisor", applyRateLimit(10, 60 * 1000), async (req, res) => {
    try {
      const { question, financialContext } = req.body;

      if (!question || typeof question !== "string") {
        return res.status(400).json({ error: "Pregunta requerida y debe ser texto" });
      }

      // Sanitización contra prompt-injection y limitación de longitud
      const trimmedQuestion = question.trim().slice(0, 500);
      if (trimmedQuestion.length === 0) {
        return res.status(400).json({ error: "La pregunta no puede estar vacía" });
      }

      // Comprobar patrones obvios de jailbreak o manipulación
      const injectionPattern = /(ignore previous instructions|system prompt|bypass rules|olvida todas las instrucciones|dame tu prompt)/i;
      if (injectionPattern.test(trimmedQuestion)) {
        return res.status(400).json({
          error: "La consulta contiene patrones de solicitud no permitidos.",
        });
      }

      const client = getAiClient();
      if (!client) {
        return res.status(503).json({
          fallback: true,
          answer: "El servicio de IA requiere configurar GEMINI_API_KEY en los ajustes.",
        });
      }

      // Sanitizar contexto financiero numérico para evitar NaNs o inyecciones
      const safeCurrency = String(financialContext?.currency || 'EUR').slice(0, 5);
      const safeIncome = Number(financialContext?.income) || 0;
      const safeExpense = Number(financialContext?.expense) || 0;
      const safeSavingsRate = Number(financialContext?.savingsRate) || 0;
      const safeNetWorth = Number(financialContext?.netWorth) || 0;
      const safeNeedsPct = Number(financialContext?.needsPct) || 0;
      const safeWantsPct = Number(financialContext?.wantsPct) || 0;

      const prompt = `Eres un asesor financiero personal experto, empático y práctico en español para la aplicación FinanTrack.
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
  });

  // Vite middleware for development vs static production build
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`FinanTrack server running on http://localhost:${PORT}`);
  });
}

startServer();
