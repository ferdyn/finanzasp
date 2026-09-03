import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const PORT = 3000;

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

  app.use(express.json());

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // AI Financial Advisor endpoint
  app.post("/api/advisor", async (req, res) => {
    try {
      const { question, financialContext } = req.body;

      if (!question) {
        return res.status(400).json({ error: "Pregunta requerida" });
      }

      const client = getAiClient();
      if (!client) {
        return res.status(503).json({
          fallback: true,
          answer: "El servicio de IA requiere configurar GEMINI_API_KEY en los ajustes.",
        });
      }

      const prompt = `Eres un asesor financiero personal experto, empático y práctico en español para la aplicación FinanTrack.
Contexto financiero del usuario:
- Moneda: ${financialContext?.currency || 'EUR'}
- Ingresos de este mes: ${financialContext?.income || 0}
- Gastos de este mes: ${financialContext?.expense || 0}
- Tasa de Ahorro: ${financialContext?.savingsRate || 0}%
- Patrimonio Neto: ${financialContext?.netWorth || 0}
- % en Necesidades (regla 50/30/20): ${financialContext?.needsPct || 0}%
- % en Deseos/Ocio: ${financialContext?.wantsPct || 0}%

Pregunta del usuario:
"${question}"

Instrucciones:
1. Responde de forma clara, directa y estructurada con viñetas cuando sea apropiado.
2. Da consejos cuantitativos y accionables adaptados a sus números.
3. Sé motivador, prudente y profesional. Máximo 3 o 4 párrafos concisos.`;

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
