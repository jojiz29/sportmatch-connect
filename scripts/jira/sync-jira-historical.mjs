// ============================================================
// scripts/sync-jira-historical.mjs
// Crea tickets históricos para features YA IMPLEMENTADAS en el repo.
// Cada ticket lleva formato US (Como... quiero... para...) y se
// asigna al sprint donde se implementó (status Finalizada).
// NO TOCA tickets existentes de otros miembros.
// Solo crea US de features que NO tienen ticket previo.
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
      const val = parts.slice(1).join("=").trim().replace(/^['"]|['"]$/g, "");
      env[key] = val;
    }
  });

const auth =
  "Basic " +
  Buffer.from(env.JIRA_USER_EMAIL + ":" + env.JIRA_API_TOKEN).toString("base64");

// IDs fijos
const PROJECT_KEY = "SCRUM";
const ISSUE_TYPE_HISTORIA = "10004";
const ISSUE_TYPE_TAREA = "10003";

// Sprint IDs
const SPRINT_1 = 1; // Sprint 1: Social & Geo (closed)
const SPRINT_2 = 41; // SCRUM Sprint 2 (closed)
const SPRINT_3 = 43; // SCRUM Sprint 3 (closed)

// Account IDs
const ACCOUNTS = {
  Edwin: "615b12b4289a54006a07b729",
  Juan: "712020:539a840e-f7b9-4d1f-9be3-7f874c7d3332",
  Erick: "712020:eab89b92-8673-4150-b3ae-864ee56918a2",
  Alejandro: "712020:b2f8a433-6b01-4755-a3cb-b1ebb4a1d865",
  Matias: "712020:8438e249-2ea0-49f1-9fd8-463ec6c8c9dc",
};

// IDs de status en Jira
const STATUS_DONE_ID = "10001"; // Finalizada
const STATUS_TODO_ID = "10000"; // Tareas por hacer

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

function toAdf(text) {
  return {
    type: "doc",
    version: 1,
    content: [{ type: "paragraph", content: [{ type: "text", text }] }],
  };
}

async function createIssue(fields) {
  const data = await api("/rest/api/3/issue", { method: "POST", body: JSON.stringify({ fields }) });
  return data.key;
}

async function addIssueToSprint(issueKey, sprintId) {
  // Los sprints cerrados no aceptan issues via esta API.
  // Solo se intenta si el sprint no es null/0.
  if (!sprintId) return;
  try {
    await api(`/rest/agile/1.0/sprint/${sprintId}/issue`, {
      method: "POST",
      body: JSON.stringify({ issues: [issueKey] }),
    });
  } catch (err) {
    // Si el sprint está cerrado, el label ya identifica la asignación histórica.
    console.log(`    (sprint ${sprintId} cerrado, se omite asignación)`);
  }
}

async function transitionIssue(issueKey, transitionId) {
  await api(`/rest/api/3/issue/${issueKey}/transitions`, {
    method: "POST",
    body: JSON.stringify({ transition: { id: transitionId } }),
  });
}

// ------------------------------------------------------------
// Historial de features (formato US estricto)
// sprint = null porque los sprints pasados están cerrados (no se
// pueden asignar). El sprint original va en label "sprint-N" y
// en la descripción.
// ------------------------------------------------------------
const HISTORICAL_TICKETS = [
  // ============== SPRINT 1: Social & Geo ==============
  {
    sprint: null,
    type: ISSUE_TYPE_HISTORIA,
    assignee: ACCOUNTS.Matias,
    summary: "SCRUM-HIST-01: Matchmaking y Mensajería en Tiempo Real",
    description:
      "[Sprint 1: Social & Geo]\n\nComo usuario de SportMatch, quiero encontrar jugadores compatibles y chatear con ellos en tiempo real, para organizar partidos y construir una comunidad deportiva activa.",
    labels: ["historia-usuario", "sprint-1", "matchmaking", "chat", "matias"],
  },
  {
    sprint: null,
    type: ISSUE_TYPE_HISTORIA,
    assignee: ACCOUNTS.Matias,
    summary: "SCRUM-HIST-02: Comentarios y Reacciones en Comunidad",
    description:
      "[Sprint 1: Social & Geo]\n\nComo usuario de la plataforma, quiero comentar y reaccionar a las publicaciones con emojis, para expresar mi opinión y conectar con otros deportistas de la comunidad.",
    labels: ["historia-usuario", "sprint-1", "social", "feed", "matias"],
  },

  // ============== SPRINT 2 ==============
  {
    sprint: null,
    type: ISSUE_TYPE_HISTORIA,
    assignee: ACCOUNTS.Juan,
    summary: "SCRUM-HIST-03: Migración de Backend de Express a NestJS",
    description:
      "[Sprint 2]\n\nComo desarrollador, quiero migrar el backend de Express a NestJS, para tener una arquitectura escalable, mantenible y con tipado estricto en el servidor.",
    labels: ["historia-usuario", "sprint-2", "backend", "nestjs", "juan"],
  },
  {
    sprint: null,
    type: ISSUE_TYPE_HISTORIA,
    assignee: ACCOUNTS.Juan,
    summary: "SCRUM-HIST-04: Módulos de Usuarios, Wallet, Sports y Bookings",
    description:
      "[Sprint 2]\n\nComo usuario, quiero acceder a una gestión completa de mi perfil, billetera FitCoins y reservas de canchas, para administrar toda mi actividad deportiva desde un solo lugar.",
    labels: ["historia-usuario", "sprint-2", "backend", "wallet", "bookings", "juan"],
  },
  {
    sprint: null,
    type: ISSUE_TYPE_HISTORIA,
    assignee: ACCOUNTS.Juan,
    summary: "SCRUM-HIST-05: Integración del Backend de Render en Frontend",
    description:
      "[Sprint 2]\n\nComo desarrollador, quiero conectar el frontend con el backend desplegado en Render en todos los loaders, para tener una API real y consistente en producción.",
    labels: ["historia-usuario", "sprint-2", "backend", "integration", "juan"],
  },
  {
    sprint: null,
    type: ISSUE_TYPE_HISTORIA,
    assignee: ACCOUNTS.Erick,
    summary: "SCRUM-HIST-06: Pasarela de Pagos B2B con Stripe",
    description:
      "[Sprint 2]\n\nComo empresa anunciante, quiero procesar pagos reales con Stripe para promover mis publicaciones destacadas, para monetizar mi presencia en la plataforma.",
    labels: ["historia-usuario", "sprint-2", "stripe", "b2b", "pagos", "erick"],
  },
  {
    sprint: null,
    type: ISSUE_TYPE_HISTORIA,
    assignee: ACCOUNTS.Erick,
    summary: "SCRUM-HIST-07: Verificación de Identidad con DNI (RENIEC)",
    description:
      "[Sprint 2]\n\nComo usuario, quiero verificar mi identidad con mi DNI peruano, para aumentar mi trust score, acceder a funciones premium y generar confianza en la comunidad.",
    labels: ["historia-usuario", "sprint-2", "dni", "verification", "reniec", "erick"],
  },
  {
    sprint: null,
    type: ISSUE_TYPE_HISTORIA,
    assignee: ACCOUNTS.Matias,
    summary: "SCRUM-HIST-08: Sedes y Actividades Geolocalizadas",
    description:
      "[Sprint 2]\n\nComo usuario, quiero encontrar canchas y actividades deportivas cerca de mi ubicación, para practicar deportes en mi zona sin perder tiempo buscando.",
    labels: ["historia-usuario", "sprint-2", "geo", "map", "postgis", "matias"],
  },
  {
    sprint: null,
    type: ISSUE_TYPE_HISTORIA,
    assignee: ACCOUNTS.Alejandro,
    summary: "SCRUM-HIST-09: Internacionalización de Landing Page",
    description:
      "[Sprint 2]\n\nComo usuario internacional, quiero ver la landing page en mi idioma, para entender el producto y registrarme sin barreras lingüísticas.",
    labels: ["historia-usuario", "sprint-2", "i18n", "landing", "alejandro"],
  },
  {
    sprint: null,
    type: ISSUE_TYPE_HISTORIA,
    assignee: ACCOUNTS.Alejandro,
    summary: "SCRUM-HIST-10: Sistema de Temas Tri-state",
    description:
      "[Sprint 2]\n\nComo usuario, quiero elegir entre tres temas visuales, para personalizar mi experiencia y adaptar la interfaz a mis preferencias estéticas y de accesibilidad.",
    labels: ["historia-usuario", "sprint-2", "ui", "theme", "alejandro"],
  },
  {
    sprint: null,
    type: ISSUE_TYPE_HISTORIA,
    assignee: ACCOUNTS.Erick,
    summary: "SCRUM-HIST-11: Desafíos Deportivos y Contrapropuestas",
    description:
      "[Sprint 2]\n\nComo usuario, quiero desafiar a otros jugadores y proponer cambios en los términos del desafío, para organizar partidos competitivos con condiciones negociadas.",
    labels: ["historia-usuario", "sprint-2", "challenges", "matchmaking", "erick"],
  },
  {
    sprint: null,
    type: ISSUE_TYPE_HISTORIA,
    assignee: ACCOUNTS.Juan,
    summary: "SCRUM-HIST-12: Persistencia de Reseñas en Base de Datos",
    description:
      "[Sprint 2]\n\nComo usuario, quiero dejar reseñas que persistan en la base de datos, para compartir mi experiencia y ayudar a otros usuarios con información real.",
    labels: ["historia-usuario", "sprint-2", "reviews", "database", "juan"],
  },

  // ============== SPRINT 3 ==============
  {
    sprint: null,
    type: ISSUE_TYPE_HISTORIA,
    assignee: ACCOUNTS.Edwin,
    summary: "SCRUM-HIST-13: Integración Real de Vertex AI (gemini-2.5-flash)",
    description:
      "[Sprint 3]\n\nComo usuario, quiero conversar con el asistente Sporty powered por Google Vertex AI con el modelo gemini-2.5-flash, para recibir asistencia inteligente real y contextualizada.",
    labels: ["historia-usuario", "sprint-3", "ai", "vertex-ai", "edwin"],
  },
  {
    sprint: null,
    type: ISSUE_TYPE_HISTORIA,
    assignee: ACCOUNTS.Edwin,
    summary: "SCRUM-HIST-14: Refactorización del Sistema de Temas",
    description:
      "[Sprint 3]\n\nComo desarrollador, quiero tener un sistema de temas con tokens semánticos centralizados y tres variantes (world-cup, dark-footballer, light), para mantener consistencia visual y simplificar el theming.",
    labels: ["historia-usuario", "sprint-3", "refactor", "theme", "tokens", "edwin"],
  },
  {
    sprint: null,
    type: ISSUE_TYPE_HISTORIA,
    assignee: ACCOUNTS.Juan,
    summary: "SCRUM-HIST-15: Validación de Tokens JWT de Supabase en Backend",
    description:
      "[Sprint 3]\n\nComo usuario, quiero que mi sesión se valide de forma segura con tokens JWT de Supabase en el backend, para proteger mi cuenta y datos personales.",
    labels: ["historia-usuario", "sprint-3", "auth", "security", "jwt", "juan"],
  },
  {
    sprint: null,
    type: ISSUE_TYPE_HISTORIA,
    assignee: ACCOUNTS.Alejandro,
    summary: "SCRUM-HIST-16: Progressive Web App (PWA)",
    description:
      "[Sprint 3]\n\nComo usuario móvil, quiero instalar la aplicación como PWA desde el navegador, para tener acceso rápido, notificaciones push y uso sin conexión.",
    labels: ["historia-usuario", "sprint-3", "pwa", "mobile", "alejandro"],
  },
  {
    sprint: null,
    type: ISSUE_TYPE_HISTORIA,
    assignee: ACCOUNTS.Edwin,
    summary: "SCRUM-HIST-17: Moderación de Imágenes con IA en Cliente",
    description:
      "[Sprint 3]\n\nComo usuario, quiero que mis imágenes se moderen automáticamente antes de publicar, para tener contenido seguro y prevenir publicaciones inapropiadas.",
    labels: ["historia-usuario", "sprint-3", "ai", "moderation", "tfjs", "edwin"],
  },
  {
    sprint: null,
    type: ISSUE_TYPE_HISTORIA,
    assignee: ACCOUNTS.Matias,
    summary: "SCRUM-HIST-18: Módulo de Calendario Deportivo",
    description:
      "[Sprint 3]\n\nComo usuario, quiero ver un calendario interactivo de eventos y partidos deportivos, para planificar mi agenda deportiva y no perderme ningún evento.",
    labels: ["historia-usuario", "sprint-3", "calendar", "schedule", "matias"],
  },
  {
    sprint: null,
    type: ISSUE_TYPE_HISTORIA,
    assignee: ACCOUNTS.Matias,
    summary: "SCRUM-HIST-19: Validación Mutua de Asistencia entre Jugadores",
    description:
      "[Sprint 3]\n\nComo organizador de un partido, quiero confirmar la asistencia de los jugadores después del encuentro, para llevar control de participación y ajustar el trust score.",
    labels: ["historia-usuario", "sprint-3", "attendance", "validation", "matias"],
  },
  {
    sprint: null,
    type: ISSUE_TYPE_HISTORIA,
    assignee: ACCOUNTS.Erick,
    summary: "SCRUM-HIST-20: Integración Completa de Stripe (React 19)",
    description:
      "[Sprint 3]\n\nComo empresa, quiero procesar pagos reales con Stripe Elements en el frontend con compatibilidad total con React 19, para monetizar mis servicios sin fricción técnica.",
    labels: ["historia-usuario", "sprint-3", "stripe", "react19", "b2b", "erick"],
  },
  {
    sprint: null,
    type: ISSUE_TYPE_TAREA,
    assignee: ACCOUNTS.Edwin,
    summary: "SCRUM-HIST-21: Tests Automatizados y Error Boundaries para Moderación IA",
    description:
      "[Sprint 3]\n\nComo desarrollador, quiero tener tests automatizados, error boundaries, locks y lazy loading para el sistema de moderación de imágenes con IA, para mantener calidad y resiliencia del código.",
    labels: ["tarea", "sprint-3", "testing", "moderation", "edwin"],
  },
];

console.log(`=== Creando ${HISTORICAL_TICKETS.length} tickets históricos ===\n`);
let ok = 0;
let fail = 0;
for (const t of HISTORICAL_TICKETS) {
  try {
    const key = await createIssue({
      project: { key: PROJECT_KEY },
      summary: t.summary,
      description: toAdf(t.description),
      issuetype: { id: t.type },
      assignee: { accountId: t.assignee },
      labels: t.labels,
    });
    await addIssueToSprint(key, t.sprint);
    // Transicionar a Finalizada (Done)
    await transitionIssue(key, "21");
    console.log(`  ✓ ${key} → ${t.summary}`);
    ok++;
  } catch (err) {
    console.error(`  ! ${t.summary} ERROR: ${err.message.slice(0, 120)}`);
    fail++;
  }
}

console.log(`\n=== RESUMEN ===`);
console.log(`OK: ${ok} | FALLOS: ${fail}`);
