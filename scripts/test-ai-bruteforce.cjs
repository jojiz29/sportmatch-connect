// =============================================================================
// scripts/test-ai-bruteforce.cjs
//
// Script de diagnóstico por "fuerza bruta" para validar la conectividad con Gemini
// a través de 4 métodos independientes.
//
// Para ejecutar desde la raíz:
//   node scripts/test-ai-bruteforce.cjs
// =============================================================================

const fs = require("fs");
const path = require("path");

// Inyección dinámica de node_modules del backend para poder resolver dependencias
// desde la raíz sin necesidad de instalarlas en el frontend.
const serverNodeModules = path.resolve(process.cwd(), "server/node_modules");
if (fs.existsSync(serverNodeModules)) {
  module.paths.push(serverNodeModules);
}

// Cargar variables de entorno del backend manualmente con dotenv
const dotenv = require("dotenv");
const serverEnvPath = path.resolve(process.cwd(), "server/.env");
if (fs.existsSync(serverEnvPath)) {
  dotenv.config({ path: serverEnvPath });
}

const { GoogleGenAI } = require("@google/genai");
const { GoogleAuth } = require("google-auth-library");

const COLORS = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
};

async function runTests() {
  console.log(`${COLORS.bold}${COLORS.cyan}============================================================`);
  console.log("             SportMatch Gemini Diagnostic Tool (CJS)");
  console.log(`============================================================${COLORS.reset}\n`);

  const results = [];
  const prompt = "Prueba de sistema. Responde OK.";

  const apiKey = process.env.GOOGLE_GENAI_API_KEY;
  const projectId = process.env.GOOGLE_CLOUD_PROJECT;
  const location = process.env.VERTEX_AI_LOCATION || "global";
  const modelId = process.env.VERTEX_AI_MODEL_ID || "gemini-3.5-flash";
  const credentialsPath = path.resolve(process.cwd(), "server/credentials/google-cloud-credentials.json");

  console.log(`${COLORS.bold}Environment Variables loaded:${COLORS.reset}`);
  console.log(`  GOOGLE_GENAI_API_KEY: ${apiKey ? "PROVED (starts with " + apiKey.slice(0, 10) + "...)" : "MISSING"}`);
  console.log(`  GOOGLE_CLOUD_PROJECT: ${projectId || "MISSING"}`);
  console.log(`  VERTEX_AI_LOCATION:   ${location}`);
  console.log(`  VERTEX_AI_MODEL_ID:   ${modelId}`);
  console.log(`  Credentials path:     ${credentialsPath} (${fs.existsSync(credentialsPath) ? "EXISTS" : "MISSING"})\n`);

  // ---------------------------------------------------------------------------
  // MÉTODO 1: SDK de Google AI Studio (@google/genai)
  // ---------------------------------------------------------------------------
  console.log(`${COLORS.bold}--- running Método 1 (Google AI Studio SDK)... ---${COLORS.reset}`);
  if (!apiKey) {
    results.push({
      method: "Método 1: SDK de Google AI Studio",
      status: "FAILED",
      details: "Falta GOOGLE_GENAI_API_KEY en las variables de entorno.",
    });
    console.log(`${COLORS.red}✕ Skip: No API Key${COLORS.reset}\n`);
  } else {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: modelId,
        contents: prompt,
        config: { maxOutputTokens: 10 },
      });
      const text = response.text?.trim() || "";
      results.push({
        method: "Método 1: SDK de Google AI Studio",
        status: "SUCCESS",
        details: `Respuesta: "${text}"`,
      });
      console.log(`${COLORS.green}✅ SUCCESS: Respuesta: "${text}"${COLORS.reset}\n`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      results.push({
        method: "Método 1: SDK de Google AI Studio",
        status: "FAILED",
        details: msg,
      });
      console.log(`${COLORS.red}✕ FAILED: ${msg}${COLORS.reset}\n`);
    }
  }

  // ---------------------------------------------------------------------------
  // MÉTODO 2: Llamada REST Pura (Fetch) a Google AI Studio
  // ---------------------------------------------------------------------------
  console.log(`${COLORS.bold}--- running Método 2 (REST Pura a AI Studio)... ---${COLORS.reset}`);
  if (!apiKey) {
    results.push({
      method: "Método 2: Llamada REST Pura (AI Studio)",
      status: "FAILED",
      details: "Falta GOOGLE_GENAI_API_KEY en las variables de entorno.",
    });
    console.log(`${COLORS.red}✕ Skip: No API Key${COLORS.reset}\n`);
  } else {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: {
            parts: [{ text: prompt }],
          },
          generationConfig: {
            maxOutputTokens: 200,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(JSON.stringify(data));
      }

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
      results.push({
        method: "Método 2: Llamada REST Pura (AI Studio)",
        status: "SUCCESS",
        details: `Respuesta: "${text}"`,
      });
      console.log(`${COLORS.green}✅ SUCCESS: Respuesta: "${text}"${COLORS.reset}\n`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      results.push({
        method: "Método 2: Llamada REST Pura (AI Studio)",
        status: "FAILED",
        details: msg,
      });
      console.log(`${COLORS.red}✕ FAILED: ${msg}${COLORS.reset}\n`);
    }
  }

  // ---------------------------------------------------------------------------
  // MÉTODO 3: SDK de Vertex AI (@google/genai con credentials)
  // ---------------------------------------------------------------------------
  console.log(`${COLORS.bold}--- running Método 3 (Vertex AI SDK)... ---${COLORS.reset}`);
  if (!fs.existsSync(credentialsPath) && !process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
    results.push({
      method: "Método 3: SDK de Vertex AI (JSON)",
      status: "FAILED",
      details: "No existe el archivo credentials ni GOOGLE_APPLICATION_CREDENTIALS_JSON.",
    });
    console.log(`${COLORS.red}✕ Skip: No credentials JSON found${COLORS.reset}\n`);
  } else {
    try {
      const googleAuthOptions = {};
      const credentialsJsonRaw = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
      if (credentialsJsonRaw) {
        googleAuthOptions.credentials = JSON.parse(credentialsJsonRaw);
      } else {
        googleAuthOptions.keyFile = credentialsPath;
      }

      const ai = new GoogleGenAI({
        vertexai: true,
        project: projectId,
        location: location,
        googleAuthOptions,
      });

      const response = await ai.models.generateContent({
        model: modelId,
        contents: prompt,
        config: { maxOutputTokens: 10 },
      });
      const text = response.text?.trim() || "";
      console.log("Raw Response Method 3:", JSON.stringify(response, null, 2));
      results.push({
        method: "Método 3: SDK de Vertex AI (JSON)",
        status: "SUCCESS",
        details: `Respuesta: "${text}"`,
      });
      console.log(`${COLORS.green}✅ SUCCESS: Respuesta: "${text}"${COLORS.reset}\n`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      results.push({
        method: "Método 3: SDK de Vertex AI (JSON)",
        status: "FAILED",
        details: msg,
      });
      console.log(`${COLORS.red}✕ FAILED: ${msg}${COLORS.reset}\n`);
    }
  }

  // ---------------------------------------------------------------------------
  // MÉTODO 4: Autenticación por defecto de Google (ADC) + REST a Vertex AI
  // ---------------------------------------------------------------------------
  console.log(`${COLORS.bold}--- running Método 4 (Google ADC + REST a Vertex)... ---${COLORS.reset}`);
  if (!fs.existsSync(credentialsPath) && !process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
    results.push({
      method: "Método 4: Google ADC + REST a Vertex",
      status: "FAILED",
      details: "No existe el archivo credentials ni GOOGLE_APPLICATION_CREDENTIALS_JSON.",
    });
    console.log(`${COLORS.red}✕ Skip: No credentials JSON found${COLORS.reset}\n`);
  } else {
    try {
      const googleAuthOptions = {};
      const credentialsJsonRaw = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
      
      const auth = new GoogleAuth({
        keyFile: credentialsJsonRaw ? undefined : credentialsPath,
        credentials: credentialsJsonRaw ? JSON.parse(credentialsJsonRaw) : undefined,
        scopes: ["https://www.googleapis.com/auth/cloud-platform"],
      });

      const client = await auth.getClient();
      const tokenResponse = await client.getAccessToken();
      const accessToken = tokenResponse.token;

      if (!accessToken) {
        throw new Error("No se pudo generar el token de acceso.");
      }

      // Consumimos el endpoint REST de Vertex AI (locations/global para Gemini 3.5)
      const url = `https://aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelId}:generateContent`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            }
          ],
          generationConfig: {
            maxOutputTokens: 200,
          },
        }),
      });

      const data = await res.json();
      console.log("Raw Response Method 4:", JSON.stringify(data, null, 2));
      if (!res.ok) {
        throw new Error(JSON.stringify(data));
      }

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
      results.push({
        method: "Método 4: Google ADC + REST a Vertex",
        status: "SUCCESS",
        details: `Respuesta: "${text}"`,
      });
      console.log(`${COLORS.green}✅ SUCCESS: Respuesta: "${text}"${COLORS.reset}\n`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      results.push({
        method: "Método 4: Google ADC + REST a Vertex",
        status: "FAILED",
        details: msg,
      });
      console.log(`${COLORS.red}✕ FAILED: ${msg}${COLORS.reset}\n`);
    }
  }

  // ---------------------------------------------------------------------------
  // MOSTRAR RESUMEN FINAL
  // ---------------------------------------------------------------------------
  console.log(`${COLORS.bold}${COLORS.cyan}============================================================`);
  console.log("                      DIAGNOSTIC SUMMARY");
  console.log(`============================================================${COLORS.reset}`);
  
  for (const r of results) {
    const symbol = r.status === "SUCCESS" ? "✅" : "❌";
    const color = r.status === "SUCCESS" ? COLORS.green : COLORS.red;
    console.log(`${symbol} ${r.method}: ${color}${r.status}${COLORS.reset}`);
    console.log(`   Detalle: ${r.details}\n`);
  }

  const firstSuccess = results.find((r) => r.status === "SUCCESS");
  if (firstSuccess) {
    console.log(`${COLORS.bold}${COLORS.green}🎉 ¡Victoria! Encontré al menos un método que funciona: "${firstSuccess.method}"${COLORS.reset}`);
    
    if (firstSuccess.method.includes("Google AI Studio")) {
      console.log(`\n${COLORS.bold}Bloque de código para copiar en 'vertex-ai.service.ts':${COLORS.reset}`);
      console.log(`
------------------------------------------------------------
import { GoogleGenAI } from "@google/genai";

@Injectable()
export class VertexAiService implements OnModuleInit, OnModuleDestroy {
  private genAi: GoogleGenAI;
  
  onModuleInit() {
    this.genAi = new GoogleGenAI({
      apiKey: process.env.GOOGLE_GENAI_API_KEY
    });
  }
}
------------------------------------------------------------
      `);
    } else if (firstSuccess.method.includes("Llamada REST Pura")) {
      console.log(`\n${COLORS.bold}Bloque de código para copiar en 'vertex-ai.service.ts' (REST Pura):${COLORS.reset}`);
      console.log(`
------------------------------------------------------------
async generateContent(prompt: string) {
  const url = \`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=\${process.env.GOOGLE_GENAI_API_KEY}\`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: { parts: [{ text: prompt }] } })
  });
  const data = await res.json();
  return data.candidates[0].content.parts[0].text;
}
------------------------------------------------------------
      `);
    } else if (firstSuccess.method.includes("Vertex AI (JSON)")) {
      console.log(`\n${COLORS.bold}Tu archivo JSON actual y credenciales de Vertex AI funcionan perfectamente.${COLORS.reset}`);
    } else if (firstSuccess.method.includes("Google ADC")) {
      console.log(`\n${COLORS.bold}Se requiere autenticación por token portador (Bearer ADC) para Vertex AI.${COLORS.reset}`);
    }
  } else {
    console.log(`${COLORS.bold}${COLORS.red}❌ Ningún método de conexión funcionó. Revisa que tu clave API esté activa y sin restricciones en Google Cloud Console o que el API Generative Language esté activa en tu proyecto.${COLORS.reset}`);
  }
}

runTests().catch(console.error);
