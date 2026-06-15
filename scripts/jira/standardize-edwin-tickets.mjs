// ============================================================
// scripts/standardize-edwin-tickets.mjs
// Estandariza SOLO las 8 US de Edwin en Sprint 4.
// Formato aplicado:
//   TÍTULO:  Verbo + Feature (sin prefijo SCRUM-AI-XX)
//   DESCRIPCIÓN (ADF):
//     - H1: Contexto de la feature
//     - H2: User Story  → "Como... quiero... para..."
//     - H2: Criterios de Aceptación (checklist)
//     - H2: Notas Técnicas (opcional)
//     - H2: Referencias (commits, docs, etc.)
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
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${text.slice(0, 200)}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

// ------------------------------------------------------------
// Helpers ADF
// ------------------------------------------------------------
const adfText = (text) => ({ type: "text", text });
const adfPara = (text) => ({
  type: "paragraph",
  content: [adfText(text)],
});
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
          content: [
            { type: "text", text: "☑ " },
            { type: "text", text },
          ],
        },
      ],
    },
  ],
});
const adfCode = (text, language = "typescript") => ({
  type: "codeBlock",
  attrs: { language },
  content: [{ type: "text", text }],
});

// ------------------------------------------------------------
// Estructura estandarizada para las 8 US de Edwin
// Cada entrada tiene:
//   - newSummary  → título limpio
//   - description → array de nodos ADF
// ------------------------------------------------------------
const STANDARD_TICKETS = {
  "SCRUM-338": {
    newSummary: "Sugerir comentarios inteligentes mientras el usuario escribe",
    context:
      "Hoy el usuario debe pensar y redactar comentarios completos en el feed de SportMatch, lo que reduce la participación y el engagement de la comunidad.",
    userStory:
      "Como usuario activo en el feed, quiero recibir sugerencias inteligentes de comentarios mientras escribo, para participar más fácilmente en conversaciones y aumentar mi engagement en la plataforma.",
    criteria: [
      "Endpoint `POST /api/v1/ai/comment-suggestion` que recibe el texto parcial y devuelve 3 sugerencias.",
      "Debounce de 800ms en el frontend para no saturar la API mientras el usuario escribe.",
      "Caché de sugerencias en cliente (Map por postId) para evitar requests duplicados.",
      "Renderizado inline con teclado: ↑↓ para navegar, Enter/Tab para insertar.",
      "Rate limiting por userId: máx. 30 sugerencias por minuto.",
    ],
    technical:
      "Vertex AI Text con `gemini-2.5-flash`. Prompt incluye: post original + primeros 3 comentarios + texto parcial del usuario. Temperatura 0.7, maxOutputTokens 80.",
    references: [
      "Commits: `dfb8672` (anti-mock safeguards), `140ef2c` (Vertex AI integration).",
      "Docs: `src/features/ai-assistant/api/sportyAiAPI.ts` (módulo de IA ya operativo).",
    ],
  },
  "SCRUM-339": {
    newSummary: "Etiquetar automáticamente los posts con hashtags relevantes",
    context:
      "Los usuarios publican contenido sin saber qué hashtags usar, lo que reduce la discoverability y limita que el post llegue a deportistas afines.",
    userStory:
      "Como usuario que publica contenido, quiero que mis posts se etiqueten automáticamente con hashtags relevantes, para aumentar la discoverability de mi contenido y llegar a más deportistas interesados en mis actividades.",
    criteria: [
      "Hook en `POST /api/v1/posts` que genera 3-5 hashtags antes de persistir.",
      "Nueva tabla `post_tags(post_id, tag, created_at)` con índice en `tag`.",
      "Endpoint `GET /api/v1/posts/search?tag=padel-lima` para búsqueda por hashtag.",
      "Tags normalizados: lowercase, sin acentos, formato `deporte-zona` o `deporte-nivel`.",
      "Solo se persisten tags con confianza > 0.7 (umbral configurable).",
    ],
    technical:
      "Vertex AI Text con structured output (JSON schema). Prompt: 'Genera hashtags para: {contenido_post}. Devuelve JSON con array `tags`'. Validación con Zod antes de insertar.",
    references: [
      "Schema actual: `src/entities/types.ts` → interface Post (añadir campo `tags?: string[]`).",
      "Tabla nueva requiere migración SQL en Supabase.",
    ],
  },
  "SCRUM-340": {
    newSummary: "Moderar contenido tóxico, NSFW y spam automáticamente",
    context:
      "Hoy no hay moderación automática: posts, comentarios y avatares inapropiados pueden pasar al feed público, dañando la experiencia de la comunidad.",
    userStory:
      "Como administrador de la plataforma, quiero detección automática de contenido tóxico, NSFW y spam, para mantener un ambiente seguro y proteger a los usuarios de interacciones dañinas.",
    criteria: [
      "Pipeline en backend NestJS que valida todo `POST /posts` y `POST /comments` antes de persistir.",
      "Si `toxicity > 0.8` o `nsfw > 0.7` → marca `flagged: true` y oculta del feed público.",
      "Cola de revisión manual: `flagged = true` aparece en panel admin (`/app/admin`).",
      "Re-challenge si el admin aprueba: el contenido se publica retroactivamente.",
      "Métrica: latency del pipeline < 800ms para no degradar UX.",
    ],
    technical:
      "Vertex AI Text con `safetySettings: BLOCK_NONE` para inspeccionar categorías. Combina con el moderador client-side existente (`src/features/moderation/` con tfjs+nsfwjs) para defense-in-depth.",
    references: [
      "Código existente: `fdae10d` (client-side moderation), `038568d` (policies).",
      "Tabla actual: `posts.flagged`, `comments.flagged` ya existen en schema.",
    ],
  },
  "SCRUM-341": {
    newSummary: "Soportar múltiples idiomas en el asistente Sporty",
    context:
      "El asistente Sporty solo entiende español, lo que limita la expansión a mercados angloparlantes y lusófonos (Brasil es el mercado de pádel más grande de LATAM).",
    userStory:
      "Como usuario internacional, quiero interactuar con el asistente Sporty en mi idioma nativo (inglés o portugués), para tener una experiencia personalizada y accesible sin barreras lingüísticas.",
    criteria: [
      "Selector de idioma en `ChatInterface` (🇪🇸 ES / 🇺🇸 EN / 🇧🇷 PT).",
      "Detección automática del idioma del usuario con `navigator.language`.",
      "Persistencia del idioma elegido en `localStorage` (key: `sporty.lang`).",
      "System prompt localizado: tres variantes (ES/EN/PT) según idioma activo.",
      "Respuestas generadas siempre en el idioma detectado (no traducción posterior).",
    ],
    technical:
      "Vertex AI Text es nativamente multilingüe. Se añade el parámetro `language` al `generateContent()` y se selecciona el system prompt de la variante correspondiente. No requiere modelos distintos.",
    references: [
      "i18n existente: `src/shared/i18n/locales/{es,en}.json` (añadir `pt.json`).",
      "Vertex AI docs: https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models",
    ],
  },
  "SCRUM-342": {
    newSummary: "Entender jerga deportiva peruana y latinoamericana",
    context:
      "El LLM base no distingue jerga local peruana: 'pichanguita', 'canchita', 'repesca', 'cachito', 'fulbito'. Esto genera respuestas formales e inexactas para usuarios locales.",
    userStory:
      "Como usuario peruano y latinoamericano, quiero que Sporty entienda jerga deportiva local como pichanguita, canchita, repesca y cachito, para comunicarme de forma natural sin formalismos.",
    criteria: [
      "Diccionario de jerga LATAM con mínimo 30 términos peruanos y 10 argentinos/chilenos.",
      "Few-shot examples en system prompt: 5 conversaciones modelo usando jerga local.",
      "Reconoce y responde usando los mismos términos cuando el usuario los usa.",
      "Si un término es ambiguo (ej. 'cachito' = amistad o juego), pide aclaración amable.",
    ],
    technical:
      "Few-shot prompting en el system prompt de `vertex-ai.service.ts`. No requiere fine-tuning. Dataset de jerga: 30 términos peruanos + 10 regionales curados manualmente.",
    references: [
      "Archivo: `server/src/ai/vertex-ai.service.ts` (líneas 60-80, systemInstruction).",
      "PRójimo: `server/src/ai/slang-dataset.json` con el catálogo de términos.",
    ],
  },
  "SCRUM-343": {
    newSummary: "Permitir entrada por voz al asistente Sporty (Speech-to-Text)",
    context:
      "Durante actividades deportivas los usuarios no pueden escribir. Necesitan interactuar con Sporty sin soltar la raqueta, la pelota o el manillar.",
    userStory:
      "Como usuario en movimiento durante actividades deportivas, quiero hablarle al asistente Sporty en lugar de escribir, para interactuar hands-free sin detener mi entrenamiento o partido.",
    criteria: [
      "Botón de micrófono persistente en `ChatInterface` (icono + estado visual cuando escucha).",
      "Web Speech API como fallback (gratis, on-device) y Vertex AI Speech para producción.",
      "Transcripción se inyecta automáticamente al `input` del chat antes de enviar.",
      "Indicador de nivel de volumen animado durante la grabación.",
      "Permiso de micrófono solicitado solo la primera vez, con explicación clara.",
    ],
    technical:
      "Web Speech API para MVP (gratis, sin backend). Upgrade a `@google-cloud/speech` v6 con `googleAuthOptions` (mismo patrón que `vertex-ai.service.ts`) para mejor precisión en español. Long-running: usar `MediaRecorder` + chunks de 1s para streaming.",
    references: [
      "Patrón existente: `server/src/ai/ai-config.service.ts` (dual mode: local/serverless).",
      "Web Speech API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API",
    ],
  },
  "SCRUM-344": {
    newSummary: "Permitir respuesta por voz del asistente Sporty (Text-to-Speech)",
    context:
      "Usuarios con discapacidad visual o en multitarea (cocinando, manejando al gym) no pueden leer respuestas largas de Sporty.",
    userStory:
      "Como usuario con discapacidad visual o en situación de multitarea, quiero que Sporty me responda con voz natural, para recibir información sin necesidad de mirar la pantalla.",
    criteria: [
      "Botón de altavoz en cada mensaje del asistente para reproducir solo ese mensaje.",
      "Toggle global 'Auto-play' (off por defecto) para reproducir respuestas automáticamente.",
      "Voz seleccionada: 'es-ES-Neural2-A' (mujer) y 'es-ES-Neural2-B' (hombre) en español.",
      "Velocidad ajustable: 0.8x / 1x / 1.2x (slider en configuración).",
      "Pause/Resume controls visibles durante reproducción.",
    ],
    technical:
      "Web Speech SpeechSynthesis API (gratis) para MVP. Upgrade a Vertex AI Text-to-Speech (`@google-cloud/text-to-speech`) con voces Neural2 y WaveNet para producción. Cachear el audio generado por hash del texto para no regenerar.",
    references: [
      "Web Speech TTS: https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis",
      "Vertex AI TTS docs: https://cloud.google.com/text-to-speech/docs",
    ],
  },
  "SCRUM-345": {
    newSummary: "Recordar el contexto de los últimos 5 mensajes en conversaciones de voz",
    context:
      "Las conversaciones por voz con Sporty se sienten incoherentes: cada mensaje es independiente y el LLM no recuerda lo que se dijo antes, lo que rompe la experiencia conversacional.",
    userStory:
      "Como usuario conversacional, quiero que Sporty recuerde el contexto de mis últimos 5 mensajes por voz, para mantener conversaciones naturales y coherentes sin repetir información.",
    criteria: [
      "Ventana deslizante: el system prompt incluye los últimos 5 turnos (user+assistant).",
      "Tokens totales < 2000 para mantener latencia < 1s en la respuesta.",
      "Si la conversación excede 5 turnos, los más antiguos se descartan (FIFO).",
      "Persistencia opcional: si el usuario hace logout, los mensajes no se guardan (sesión efímera, como ya está definido en `useAiAssistantStore`).",
      "Métrica de calidad: el LLM debe poder responder preguntas de seguimiento ('¿y eso cuándo es?') sin pedir contexto.",
    ],
    technical:
      "Modificar `vertex-ai.service.ts` para aceptar `conversationHistory: Message[]` y construir el prompt concatenando los turnos. El frontend (`useAiAssistantStore`) ya mantiene `messages[]` en memoria, solo hay que pasarlo al `sendMessageToAI()`.",
    references: [
      "Store actual: `src/features/ai-assistant/model/useAiAssistantStore.ts` (campo `messages`).",
      "Capa API: `src/features/ai-assistant/api/sportyAiAPI.ts` (añadir parámetro opcional `history`).",
    ],
  },
};

console.log(`=== Estandarizando ${Object.keys(STANDARD_TICKETS).length} tickets de Edwin ===\n`);

let ok = 0;
let fail = 0;
for (const [key, data] of Object.entries(STANDARD_TICKETS)) {
  try {
    // Construir ADF
    const adf = {
      type: "doc",
      version: 1,
      content: [
        adfHeading(3, "📋 Contexto"),
        adfPara(data.context),
        adfHeading(3, "👤 User Story"),
        adfPara(data.userStory),
        adfHeading(3, "✅ Criterios de Aceptación"),
        ...data.criteria.map((c) => adfBullet(c)),
        adfHeading(3, "🔧 Notas Técnicas"),
        adfPara(data.technical),
        adfHeading(3, "🔗 Referencias"),
        ...data.references.map((r) => adfBullet(r)),
      ],
    };

    // PUT al issue
    await api(`/rest/api/3/issue/${key}`, {
      method: "PUT",
      body: JSON.stringify({
        fields: {
          summary: data.newSummary,
          description: adf,
        },
      }),
    });
    console.log(`  ✓ ${key} → "${data.newSummary}"`);
    ok++;
  } catch (err) {
    console.error(`  ! ${key} ERROR: ${err.message.slice(0, 150)}`);
    fail++;
  }
}

console.log(`\n=== RESUMEN ===`);
console.log(`OK: ${ok} | FALLOS: ${fail}`);
