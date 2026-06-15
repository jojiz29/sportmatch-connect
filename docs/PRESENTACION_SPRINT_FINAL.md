# Presentación Sprint Final — Jueves 18-jun-2026

Esta guía te ayuda a configurar la app para la presentación final del Sprint 5.
La presentación será en **Español**, pero la app puede arrancar en **Inglés** por defecto (idioma internacional por showcase). Aquí te explico cómo cambiar.

---

## 🌍 Cambiar el idioma del chat (Sporty)

El idioma del chat se determina por esta prioridad:

1. **Override por build**: variable de entorno `VITE_CHAT_DEFAULT_LANG` (definida en `.env` raíz o en Vercel).
2. **Idioma del navegador** del usuario (es-MX, en-US, pt-BR, etc.).
3. **Fallback**: `"en"` (inglés).

### Para la presentación del jueves (Español)

**Opción A — Recomendada: variable de entorno en Vercel**

En los 3 proyectos de Vercel, agrega / actualiza la variable:

| Key | Value |
|-----|-------|
| `VITE_CHAT_DEFAULT_LANG` | `es` |

Proyectos:
- `sportmatch-connect` (prj_xkYkcOWCW33LPADuE4A5S5sBMkRj)
- `sportmatch-connect-czs5` (prj_Kz1dpeTTAKDoJo5rrF0JNHRnvu1B)
- `sportmatch-connect-juan-alonso` (prj_NIumA1tC8u3RIVSXxuWBR5ffCQoz)

```powershell
# Script helper (agregalo a scripts/infra/vercel-env.ps1 si quieres automatizar)
$body = '{"key":"VITE_CHAT_DEFAULT_LANG","value":"es","type":"plain","target":["production","preview","development"]}'
& curl.exe -s -X POST "https://api.vercel.com/v10/projects/prj_xkYkcOWCW33LPADuE4A5S5sBMkRj/env?teamId=team_1UzxIywpI97PJKofit5JOXoe" `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d $body
```

Después de guardar, **redeploy** cada proyecto para que el bundle incluya la nueva variable.

**Opción B — Cambio dinámico desde la UI (durante la demo)**

El usuario puede cambiar el idioma en caliente abriendo el chat y usando el selector de idioma en el header (`LanguageSelector` en `AppShell.tsx`). Sporty recordará el idioma mientras la sesión esté abierta.

**Opción C — Idioma del navegador**

Simple: abre la app en un navegador configurado en Español. El chat detecta automáticamente `navigator.language` y mapea `es-*` → `"es"`.

---

## 🎙️ Funcionalidades de voz (STT + TTS)

El chat tiene **dos botones** en la barra inferior del input:

- 🎤 **Micrófono**: pulsá para hablar. Tu voz se transcribe a texto automáticamente.
- 🔊 **Speaker**: lee la última respuesta de Sporty en voz alta con voz natural.

### Cómo funciona

- **STT (Speech-to-Text)**: usa la **Web Speech API** del navegador (gratis, on-device). Si tu navegador no la soporta, hace fallback al endpoint `/api/v1/ai/voice/transcribe` (Google Cloud Speech).
- **TTS (Text-to-Speech)**: usa la **Web Speech API** (gratis, nativo). Si el navegador no la soporta, hace fallback al endpoint `/api/v1/ai/voice/synthesize` (Google Cloud TTS con voz Neural2 en es-ES).

### Para la demo

1. Permití el acceso al micrófono cuando el navegador lo pida.
2. La transcripción aparece en vivo ("🎤 Escuchando...").
3. Sporty responde por texto Y por voz (auto-TTS del último mensaje).
4. Podés parar la voz haciendo click en 🔇 (cambia el ícono).

### Voces disponibles

El frontend intenta usar la **mejor voz disponible** del navegador en este orden:
1. Voces "premium / neural / natural" (Samantha, Ava, Allison, Microsoft Neural...)
2. Coincidencia exacta del locale (es-ES, en-US, pt-BR)
3. Cualquier voz del idioma
4. Default del sistema (puede ser robótica)

En macOS las voces premium son: Samantha (es/en), Ava (en-US), etc.
En Windows: Microsoft Helena, Microsoft Zira, etc.
En Chrome / Edge: Google voices (es-ES, en-US).

---

## 🗣️ Personalidad de Sporty (idioma natural)

Sporty ahora habla como un **amigo**, no como un bot corporativo. Reglas clave:

- Respuestas cortas (1-3 frases) por defecto
- Sin openings robóticos ("¡Claro!", "¡Por supuesto!")
- Usa contracciones y jerga local (pichanguita, fulbito, caño, etc. en español)
- Reacciones genuinas ("uy", "qué bueno", "dale", "ah mirá")
- Emojis con moderación (1-2 por mensaje, no abuse)
- Si no sabe algo, lo dice natural en vez de redirigir al soporte

---

## 🛠️ Configuración técnica del backend

Si necesitás tocar las env vars del backend de Render para la demo:

```powershell
# Ver env vars actuales
powershell -ExecutionPolicy Bypass -File scripts/infra/render-status.ps1

# Ver logs en vivo
powershell -ExecutionPolicy Bypass -File scripts/infra/render-logs.ps1 -Tail 50

# Reactivar el servicio si se suspendió (free tier duerme tras inactividad)
# Ver scripts/infra/render-status.ps1
```

Si Render se suspende durante la demo (cold start de hasta 60s), el chat mostrará el watchdog de 15s y luego un mensaje de error pidiendo reintentar. Para evitarlo, hacé una request de "wake-up" 1-2 minutos antes de la presentación (abrir el chat o navegar a cualquier ruta que llame al backend).

---

## 🎯 Checklist para el día de la presentación

- [ ] Render despierto (hacé una request de prueba 5 min antes)
- [ ] Vercel bundles apuntan a `https://sportmatch-connect.onrender.com` (sin `-api`)
- [ ] Si vas a presentar en español: `VITE_CHAT_DEFAULT_LANG=es` configurado en Vercel
- [ ] Micrófono permitido en el navegador
- [ ] Red estable (wifi del会场 probado)
- [ ] 3-4 quick prompts de ejemplo en pantalla (sección de "Sugerencias" del chat vacío)

---

## 📊 Features IA a demostrar (Sprint 5)

1. **Chat en lenguaje natural** con Sporty (SCRUM-345 welcome dinámico + memoria)
2. **Smart Comments** (auto-suggest al escribir un comentario)
3. **Auto-Hashtags** (3-5 tags sugeridos al crear un post)
4. **Content Moderation** (pre-flight: bloquea contenido tóxico/sexual/violento)
5. **Voice-to-Text** (transcripción de audio del usuario)
6. **Text-to-Speech** (respuestas habladas de Sporty con voz natural)
7. **Multi-idioma** (es/en/pt con slang regional: pichanguita, pelada, rachão)

Cada feature es testeable en vivo en el chat de Sporty o en el feed de posts.

---

**Última actualización:** 15-jun-2026 21:35 UTC
