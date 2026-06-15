// ============================================================
// scripts/assign-epics-to-edwin.mjs
// 1. Crea las épicas que faltan en el proyecto
// 2. Asigna los 40 tickets de Edwin a sus épicas correspondientes
// ============================================================

import fs from "fs";
import path from "path";

const env = {};
fs.readFileSync(path.resolve(process.cwd(), ".env.local"), "utf-8")
  .split(/\r?\n/)
  .forEach((l) => {
    const t = l.trim();
    if (t && !t.startsWith("#")) {
      const p = t.split("=");
      env[p[0].trim()] = p
        .slice(1)
        .join("=")
        .trim()
        .replace(/^['"]|['"]$/g, "");
    }
  });
const auth =
  "Basic " + Buffer.from(env.JIRA_USER_EMAIL + ":" + env.JIRA_API_TOKEN).toString("base64");

async function api(endpoint, options = {}) {
  const res = await fetch(`${env.JIRA_BASE_URL}${endpoint}`, {
    headers: {
      Authorization: auth,
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${text.slice(0, 250)}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

const adfText = (text) => ({ type: "text", text });
const adfPara = (text) => ({ type: "paragraph", content: [adfText(text)] });
const adfHeading = (level, text) => ({
  type: "heading",
  attrs: { level },
  content: [adfText(text)],
});
const adfBullet = (text) => ({
  type: "bulletList",
  content: [
    {
      type: "listItem",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text }],
        },
      ],
    },
  ],
});

// ------------------------------------------------------------
// Épicas NUEVAS a crear
// ------------------------------------------------------------
const NEW_EPICS = [
  {
    summary: "EPIC - Asistente IA Sporty (Vertex AI)",
    description: {
      type: "doc",
      version: 1,
      content: [
        adfHeading(2, "🎯 Visión"),
        adfPara(
          "Crear un asistente conversacional inteligente (Sporty) powered by Google Vertex AI, con capacidades de NLP, moderación, multilingüe, jerga local y voz bidireccional.",
        ),
        adfHeading(2, "📦 Alcance"),
        adfBullet("Smart Comment Suggestions"),
        adfBullet("Auto-Hashtags & Discovery"),
        adfBullet("Content Moderation (toxicity, NSFW, spam)"),
        adfBullet("Multi-language (ES/EN/PT)"),
        adfBullet("Spanish Slang Understanding"),
        adfBullet("Voice Input (STT)"),
        adfBullet("Voice Output (TTS)"),
        adfBullet("Voice Context Memory"),
        adfHeading(2, "🔧 Stack Técnico"),
        adfPara(
          "Vertex AI Text (gemini-2.5-flash) + Vertex AI Speech. Sistema unificado de prompts con system instructions localizadas. Defensa en profundidad con moderación client-side (tfjs+nsfwjs).",
        ),
      ],
    },
    labels: ["ai", "vertex-ai", "sporty", "edwin", "epic"],
  },
  {
    summary: "EPIC - Gamificación y Progresión del Jugador",
    description: {
      type: "doc",
      version: 1,
      content: [
        adfHeading(2, "🎯 Visión"),
        adfPara(
          "Sistema completo de progresión y engagement: nivel de XP, alertas de subida, desafíos semanales dinámicos y recompensas que motivan la actividad continua.",
        ),
        adfHeading(2, "📦 Alcance"),
        adfBullet("Indicador de nivel de XP y progreso al siguiente nivel"),
        adfBullet("Alerta visual y notificación al subir de nivel"),
        adfBullet("Desafíos semanales dinámicos (reemplazo de hardcoded)"),
        adfHeading(2, "🔧 Stack Técnico"),
        adfPara(
          "Tabla user_xp, Edge Function generate-weekly-challenges, LevelUpModal con framer-motion confetti.",
        ),
      ],
    },
    labels: ["gamification", "engagement", "edwin", "epic"],
  },
  {
    summary: "EPIC - PWA y Experiencia Móvil",
    description: {
      type: "doc",
      version: 1,
      content: [
        adfHeading(2, "🎯 Visión"),
        adfPara(
          "Convertir SportMatch en una Progressive Web App instalable, con experiencia fluida en móvil y soporte offline robusto.",
        ),
        adfHeading(2, "📦 Alcance"),
        adfBullet("Instalación como PWA desde el navegador"),
        adfBullet("Funcionamiento offline con cache de datos"),
        adfBullet("Carga en menos de 2 segundos en 4G (code splitting)"),
        adfHeading(2, "🔧 Stack Técnico"),
        adfPara(
          "vite-plugin-pwa + Workbox + manualChunks + zustand persist + IndexedDB para cola de mutaciones offline.",
        ),
      ],
    },
    labels: ["pwa", "performance", "mobile", "edwin", "epic"],
  },
  {
    summary: "EPIC - Calidad y Testing",
    description: {
      type: "doc",
      version: 1,
      content: [
        adfHeading(2, "🎯 Visión"),
        adfPara(
          "Infraestructura completa de testing automatizado y documentación visual de componentes para mantener calidad consistente.",
        ),
        adfHeading(2, "📦 Alcance"),
        adfBullet("Tests E2E de onboarding y reservas (Playwright)"),
        adfBullet("Tests unitarios de matching y compatibilidad (Vitest)"),
        adfBullet("Pipeline CI/CD con GitHub Actions"),
        adfBullet("Storybook con componentes UI documentados"),
        adfHeading(2, "🔧 Stack Técnico"),
        adfPara(
          "Playwright + Vitest + GitHub Actions + Storybook 8.x + Chromatic para visual regression.",
        ),
      ],
    },
    labels: ["testing", "ci-cd", "storybook", "edwin", "epic"],
  },
  {
    summary: "EPIC - Internacionalización y Localización",
    description: {
      type: "doc",
      version: 1,
      content: [
        adfHeading(2, "🎯 Visión"),
        adfPara(
          "Soporte completo multi-idioma (ES/EN/PT) con formateo localizado de fechas, horas y monedas para mercados LATAM.",
        ),
        adfHeading(2, "📦 Alcance"),
        adfBullet("Cambio de idioma (ES/EN) en configuración"),
        adfBullet("Formato local de fechas, horarios y montos LATAM"),
        adfBullet("Soporte para portugués brasileño (mercado de pádel #1)"),
        adfHeading(2, "🔧 Stack Técnico"),
        adfPara(
          "i18next + date-fns/locale + Intl.NumberFormat. Detección automática por navegador + persistencia manual.",
        ),
      ],
    },
    labels: ["i18n", "l10n", "latam", "edwin", "epic"],
  },
  {
    summary: "EPIC - Accesibilidad (WCAG 2.2)",
    description: {
      type: "doc",
      version: 1,
      content: [
        adfHeading(2, "🎯 Visión"),
        adfPara(
          "SportMatch usable por personas con discapacidad visual o baja visión, cumpliendo estándar WCAG 2.2 AA/AAA.",
        ),
        adfHeading(2, "📦 Alcance"),
        adfBullet("Navegación completa con lectores de pantalla"),
        adfBullet("Modo de alto contraste (WCAG AAA, ratio 7:1)"),
        adfBullet("Skip-links, focus management, ARIA labels"),
        adfHeading(2, "🔧 Stack Técnico"),
        adfPara(
          "Shadcn/Radix UI (ARIA nativo) + @axe-core/playwright para auditoría. prefers-contrast media query.",
        ),
      ],
    },
    labels: ["accessibility", "wcag", "a11y", "edwin", "epic"],
  },
  {
    summary: "EPIC - Cumplimiento y Privacidad",
    description: {
      type: "doc",
      version: 1,
      content: [
        adfHeading(2, "🎯 Visión"),
        adfPara(
          "Cumplir con GDPR y mejores prácticas de privacidad: control del usuario sobre sus datos y derecho al olvido.",
        ),
        adfHeading(2, "📦 Alcance"),
        adfBullet("Control de visibilidad del perfil (público/amigos/privado)"),
        adfBullet("Eliminación de cuenta y datos (derecho al olvido)"),
        adfBullet("Anonimización post-período de gracia (30 días)"),
        adfHeading(2, "🔧 Stack Técnico"),
        adfPara(
          "Soft-delete con timestamps, RLS respetuoso de privacidad, cron job de anonimización.",
        ),
      ],
    },
    labels: ["gdpr", "privacy", "compliance", "edwin", "epic"],
  },
  {
    summary: "EPIC - Integraciones Externas",
    description: {
      type: "doc",
      version: 1,
      content: [
        adfHeading(2, "🎯 Visión"),
        adfPara(
          "Conectar SportMatch con el ecosistema del deportista: Strava, redes sociales, y reactivación automática de usuarios.",
        ),
        adfHeading(2, "📦 Alcance"),
        adfBullet("Compartir logros en redes sociales (Web Share API)"),
        adfBullet("Sincronización con Strava (OAuth + Webhooks)"),
        adfBullet("Alertas automatizadas para usuarios inactivos (>14 días)"),
        adfHeading(2, "🔧 Stack Técnico"),
        adfPara("Web Share API + Strava API + Edge Functions de Supabase para cron jobs."),
      ],
    },
    labels: ["integrations", "strava", "share", "edwin", "epic"],
  },
  {
    summary: "EPIC - Documentación Técnica",
    description: {
      type: "doc",
      version: 1,
      content: [
        adfHeading(2, "🎯 Visión"),
        adfPara(
          "Documentación técnica actualizada que permita onboarding rápido de nuevos developers y mantenimiento eficiente de Edge Functions.",
        ),
        adfHeading(2, "📦 Alcance"),
        adfBullet("Documento de arquitectura con diagramas C4 y ER"),
        adfBullet("Documentación de Edge Functions con ejemplos"),
        adfBullet("ADRs (Architecture Decision Records) formales"),
        adfHeading(2, "🔧 Stack Técnico"),
        adfPara(
          "Markdown + Mermaid/PlantUML para diagramas. Convención ADR estándar (Michael Nygard).",
        ),
      ],
    },
    labels: ["documentation", "architecture", "adr", "edwin", "epic"],
  },
  {
    summary: "EPIC - Métricas y Observabilidad",
    description: {
      type: "doc",
      version: 1,
      content: [
        adfHeading(2, "🎯 Visión"),
        adfPara(
          "Dashboard de métricas de uso para product owner con datos reales, no mocks, para tomar decisiones basadas en evidencia.",
        ),
        adfHeading(2, "📦 Alcance"),
        adfBullet("KPIs: DAU, MAU, retención D1/D7/D30, matches/día, revenue"),
        adfBullet("Gráficos de tendencia temporal (30/90 días)"),
        adfBullet("Funnel de onboarding"),
        adfHeading(2, "🔧 Stack Técnico"),
        adfPara("PostHog + Sentry + queries SQL agregadas. React Query con cache 5 min."),
      ],
    },
    labels: ["analytics", "metrics", "dashboard", "edwin", "epic"],
  },
];

// ------------------------------------------------------------
// Crear las 10 épicas nuevas
// ------------------------------------------------------------
console.log("=== PASO 1: Creando 10 épicas nuevas ===\n");
const epicKeyMap = {};

for (const epic of NEW_EPICS) {
  try {
    const data = await api("/rest/api/3/issue", {
      method: "POST",
      body: JSON.stringify({
        fields: {
          project: { key: "SCRUM" },
          summary: epic.summary,
          description: epic.description,
          issuetype: { name: "Epic" },
          labels: epic.labels,
        },
      }),
    });
    epicKeyMap[epic.summary] = data.key;
    console.log(`  ✓ ${data.key}: ${epic.summary}`);
  } catch (err) {
    console.error(`  ! ${epic.summary} ERROR: ${err.message.slice(0, 200)}`);
  }
}

console.log("\n=== PASO 2: Asignando los 40 tickets de Edwin a sus épicas ===\n");

// Mapeo de tickets a épicas (existentes o nuevas)
const TICKET_EPIC_MAP = {
  // EPIC - Asistente IA Sporty
  "SCRUM-338": "EPIC - Asistente IA Sporty (Vertex AI)",
  "SCRUM-339": "EPIC - Asistente IA Sporty (Vertex AI)",
  "SCRUM-340": "EPIC - Asistente IA Sporty (Vertex AI)",
  "SCRUM-341": "EPIC - Asistente IA Sporty (Vertex AI)",
  "SCRUM-342": "EPIC - Asistente IA Sporty (Vertex AI)",
  "SCRUM-343": "EPIC - Asistente IA Sporty (Vertex AI)",
  "SCRUM-344": "EPIC - Asistente IA Sporty (Vertex AI)",
  "SCRUM-345": "EPIC - Asistente IA Sporty (Vertex AI)",

  // EPIC - Gamificación y Progresión
  "SCRUM-228": "EPIC - Gamificación y Progresión del Jugador",
  "SCRUM-229": "EPIC - Gamificación y Progresión del Jugador",
  "SCRUM-230": "EPIC - Gamificación y Progresión del Jugador",

  // EPIC - PWA y Experiencia Móvil
  "SCRUM-241": "EPIC - PWA y Experiencia Móvil",
  "SCRUM-242": "EPIC - PWA y Experiencia Móvil",
  "SCRUM-243": "EPIC - PWA y Experiencia Móvil",

  // EPIC - Calidad y Testing
  "SCRUM-247": "EPIC - Calidad y Testing",
  "SCRUM-248": "EPIC - Calidad y Testing",
  "SCRUM-249": "EPIC - Calidad y Testing",
  "SCRUM-251": "EPIC - Calidad y Testing",

  // EPIC - Internacionalización
  "SCRUM-239": "EPIC - Internacionalización y Localización",
  "SCRUM-240": "EPIC - Internacionalización y Localización",

  // EPIC - Accesibilidad
  "SCRUM-237": "EPIC - Accesibilidad (WCAG 2.2)",
  "SCRUM-238": "EPIC - Accesibilidad (WCAG 2.2)",

  // EPIC - Cumplimiento y Privacidad
  "SCRUM-244": "EPIC - Cumplimiento y Privacidad",
  "SCRUM-245": "EPIC - Cumplimiento y Privacidad",

  // EPIC - Integraciones Externas
  "SCRUM-234": "EPIC - Integraciones Externas",
  "SCRUM-235": "EPIC - Integraciones Externas",
  "SCRUM-254": "EPIC - Integraciones Externas",

  // EPIC - Documentación Técnica
  "SCRUM-250": "EPIC - Documentación Técnica",
  "SCRUM-252": "EPIC - Documentación Técnica",

  // EPIC - Métricas y Observabilidad
  "SCRUM-253": "EPIC - Métricas y Observabilidad",

  // ÉPICAS EXISTENTES
  "SCRUM-226": "SCRUM-291", // Finanzas y Veracidad (Trust)
  "SCRUM-227": "SCRUM-291",
  "SCRUM-257": "SCRUM-291",
  "SCRUM-231": "SCRUM-27", // Catálogo Comercial
  "SCRUM-233": "SCRUM-27",
  "SCRUM-232": "SCRUM-329", // Gestión de Anuncios
  "SCRUM-255": "SCRUM-331", // Squads / Equipos
  "SCRUM-236": "SCRUM-11", // Matchmaking Deportivo
  "SCRUM-256": "SCRUM-49", // Mapa Comercial Deportivo
};

// Acepta tanto "SCRUM-XX" como "EPIC - ..."
function resolveEpicKey(epicRef) {
  if (epicRef.startsWith("SCRUM-")) return epicRef;
  return epicKeyMap[epicRef];
}

let assigned = 0;
let failed = 0;

for (const [ticketKey, epicRef] of Object.entries(TICKET_EPIC_MAP)) {
  const epicKey = resolveEpicKey(epicRef);
  if (!epicKey) {
    console.error(`  ! ${ticketKey} → épica "${epicRef}" no resuelta`);
    failed++;
    continue;
  }
  try {
    await api(`/rest/api/3/issue/${ticketKey}`, {
      method: "PUT",
      body: JSON.stringify({
        fields: {
          parent: { key: epicKey },
        },
      }),
    });
    console.log(`  ✓ ${ticketKey} → ${epicKey} (${epicRef})`);
    assigned++;
  } catch (err) {
    console.error(`  ! ${ticketKey} ERROR: ${err.message.slice(0, 150)}`);
    failed++;
  }
}

console.log(`\n=== RESUMEN ===`);
console.log(`Épicas creadas: ${Object.keys(epicKeyMap).length}`);
console.log(`Tickets asignados: ${assigned}`);
console.log(`Tickets fallidos: ${failed}`);
console.log(`\nÉpicas nuevas:`);
Object.entries(epicKeyMap).forEach(([name, key]) => console.log(`  ${key}: ${name}`));
