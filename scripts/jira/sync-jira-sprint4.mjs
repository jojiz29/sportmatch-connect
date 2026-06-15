// ============================================================
// scripts/sync-jira-sprint4.mjs
// Sincronización Sprint 4: Borrar recomendaciones obsoletas y
// crear los 8 tickets de Edwin con formato US (Como... quiero... para...)
// NO TOCA tickets de Matías, Juan, Alejandro, Erick.
// ============================================================

import fs from "fs";
import path from "path";

const envLocalPath = path.resolve(process.cwd(), ".env.local");
const env = {};
fs.readFileSync(envLocalPath, "utf-8")
  .split(/\r?\n/)
  .forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const parts = trimmed.split("=");
      const key = parts[0].trim();
      const val = parts
        .slice(1)
        .join("=")
        .trim()
        .replace(/^['"]|['"]$/g, "");
      env[key] = val;
    }
  });

const auth =
  "Basic " + Buffer.from(env.JIRA_USER_EMAIL + ":" + env.JIRA_API_TOKEN).toString("base64");

// IDs fijos
const PROJECT_KEY = "SCRUM";
const ISSUE_TYPE_HISTORIA = "10004";
const SPRINT_ID = 42; // Sprint 4 activo
const EDWIN_ACCOUNT_ID = "615b12b4289a54006a07b729";

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------
async function api(endpoint, options = {}) {
  const url = `${env.JIRA_BASE_URL}${endpoint}`;
  const headers = {
    Authorization: auth,
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  const res = await fetch(url, { ...options, headers });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText} on ${endpoint}: ${text.slice(0, 300)}`);
  }
  if (res.status === 204) return null;
  return text ? JSON.parse(text) : null;
}

async function getTransitions(issueKey) {
  const data = await api(`/rest/api/3/issue/${issueKey}/transitions`);
  return data.transitions || [];
}

async function transitionIssue(issueKey, transitionId) {
  await api(`/rest/api/3/issue/${issueKey}/transitions`, {
    method: "POST",
    body: JSON.stringify({ transition: { id: transitionId } }),
  });
  console.log(`  → ${issueKey} transitioned (id=${transitionId})`);
}

async function deleteIssue(issueKey) {
  await api(`/rest/api/3/issue/${issueKey}?deleteSubtasks=false`, {
    method: "DELETE",
  });
  console.log(`  ✗ ${issueKey} DELETED`);
}

async function createIssue(fields) {
  const data = await api("/rest/api/3/issue", {
    method: "POST",
    body: JSON.stringify({ fields }),
  });
  return data.key;
}

// Convierte texto plano a formato ADF (Atlassian Document Format)
function toAdf(text) {
  return {
    type: "doc",
    version: 1,
    content: [
      {
        type: "paragraph",
        content: [{ type: "text", text }],
      },
    ],
  };
}

async function addIssueToSprint(issueKey, sprintId) {
  await api(`/rest/agile/1.0/sprint/${sprintId}/issue`, {
    method: "POST",
    body: JSON.stringify({ issues: [issueKey] }),
  });
}

// ------------------------------------------------------------
// Paso 1: Borrar las 3 recomendaciones obsoletas
// ------------------------------------------------------------
const TO_DELETE = [
  "SCRUM-218", // Recomendaciones: Sugerencias por IA (Vertex AI)
  "SCRUM-219", // Recomendaciones: Sugerencia de horario óptimo
  "SCRUM-220", // Recomendaciones: Sugerencia de deportes por afinidad
];

console.log("=== PASO 1: Borrar recomendaciones obsoletas ===");
for (const key of TO_DELETE) {
  try {
    // Primero, buscar la transición "Done" o similar para moverla antes de borrar
    const transitions = await getTransitions(key);
    const doneTransition = transitions.find(
      (t) => /done|cerrar|complete|won't do|no se hará/i.test(t.name) || t.to?.id === "10001",
    );
    if (doneTransition) {
      await transitionIssue(key, doneTransition.id);
    }
    await deleteIssue(key);
  } catch (err) {
    console.error(`  ! ${key} ERROR: ${err.message}`);
  }
}

// ------------------------------------------------------------
// Paso 2: Crear los 8 tickets de Edwin en Sprint 4
// Formato: Como [rol] quiero [acción] para [beneficio]
// ------------------------------------------------------------
const EDWIN_TICKETS = [
  {
    summary: "SCRUM-AI-01: Smart Comment Suggestions",
    description:
      "Como usuario activo en el feed, quiero recibir sugerencias inteligentes de comentarios mientras escribo, para participar más fácilmente en conversaciones y aumentar mi engagement en la plataforma.",
    labels: ["ai", "sprint-4", "vertex-ai", "nlp", "edwin", "historia-usuario"],
  },
  {
    summary: "SCRUM-AI-02: Auto-Hashtags & Discovery",
    description:
      "Como usuario que publica contenido, quiero que mis posts se etiqueten automáticamente con hashtags relevantes, para aumentar la discoverability de mi contenido y llegar a más deportistas interesados en mis actividades.",
    labels: ["ai", "sprint-4", "vertex-ai", "nlp", "edwin", "historia-usuario"],
  },
  {
    summary: "SCRUM-AI-03: Content Moderation",
    description:
      "Como administrador de la plataforma, quiero detección automática de contenido tóxico, NSFW y spam, para mantener un ambiente seguro y proteger a los usuarios de interacciones dañinas.",
    labels: ["ai", "sprint-4", "vertex-ai", "moderation", "edwin", "historia-usuario"],
  },
  {
    summary: "SCRUM-AI-04: Multi-language Sporty",
    description:
      "Como usuario internacional, quiero interactuar con el asistente Sporty en mi idioma nativo (inglés o portugués), para tener una experiencia personalizada y accesible sin barreras lingüísticas.",
    labels: ["ai", "sprint-4", "vertex-ai", "i18n", "edwin", "historia-usuario"],
  },
  {
    summary: "SCRUM-AI-05: Spanish Slang Understanding",
    description:
      "Como usuario peruano y latinoamericano, quiero que Sporty entienda jerga deportiva local como pichanguita, canchita, repesca y cachito, para comunicarme de forma natural sin formalismos.",
    labels: ["ai", "sprint-4", "vertex-ai", "nlp", "edwin", "latam", "historia-usuario"],
  },
  {
    summary: "SCRUM-AI-06: Voice Input (STT)",
    description:
      "Como usuario en movimiento durante actividades deportivas, quiero hablarle al asistente Sporty en lugar de escribir, para interactuar hands-free sin detener mi entrenamiento o partido.",
    labels: ["ai", "sprint-4", "voice", "stt", "edwin", "historia-usuario"],
  },
  {
    summary: "SCRUM-AI-07: Voice Output (TTS)",
    description:
      "Como usuario con discapacidad visual o en situación de multitarea, quiero que Sporty me responda con voz natural, para recibir información sin necesidad de mirar la pantalla.",
    labels: ["ai", "sprint-4", "voice", "tts", "edwin", "accessibility", "historia-usuario"],
  },
  {
    summary: "SCRUM-AI-08: Voice Context Memory",
    description:
      "Como usuario conversacional, quiero que Sporty recuerde el contexto de mis últimos 5 mensajes por voz, para mantener conversaciones naturales y coherentes sin repetir información.",
    labels: ["ai", "sprint-4", "voice", "context", "edwin", "historia-usuario"],
  },
];

console.log("\n=== PASO 2: Crear 8 tickets de Edwin en Sprint 4 ===");
const created = [];
for (const ticket of EDWIN_TICKETS) {
  try {
    const key = await createIssue({
      project: { key: PROJECT_KEY },
      summary: ticket.summary,
      description: toAdf(ticket.description),
      issuetype: { id: ISSUE_TYPE_HISTORIA },
      assignee: { accountId: EDWIN_ACCOUNT_ID },
      labels: ticket.labels,
    });
    await addIssueToSprint(key, SPRINT_ID);
    console.log(`  ✓ ${key} created: ${ticket.summary}`);
    created.push(key);
  } catch (err) {
    console.error(`  ! ${ticket.summary} ERROR: ${err.message}`);
  }
}

console.log(`\n=== RESUMEN ===`);
console.log(`Borradas: ${TO_DELETE.length} recomendaciones obsoletas`);
console.log(`Creadas: ${created.length} historias de Edwin en Sprint 4`);
console.log(`Keys: ${created.join(", ")}`);
