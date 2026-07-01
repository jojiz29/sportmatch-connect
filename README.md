# SportMatch Connect 🏆

> **Plataforma de Matchmaking Deportivo, Red Social y Gestión de Torneos con IA en el Borde**

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite)](https://vite.dev)
[![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs)](https://nestjs.com)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase)](https://supabase.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-Private-red)](#)

---

## 📋 Tabla de Contenidos

- [Descripción](#-descripción)
- [Stack Tecnológico](#-stack-tecnológico)
- [Arquitectura](#-arquitectura)
- [Funcionalidades Principales](#-funcionalidades-principales)
- [Módulos de IA](#-módulos-de-ia)
- [Configuración del Entorno](#-configuración-del-entorno)
- [Comandos de Desarrollo](#-comandos-de-desarrollo)
- [Despliegue](#-despliegue)
- [Calidad de Código](#-calidad-de-código)
- [Documentación Interna](#-documentación-interna)
- [Contribución](#-contribución)

---

## 🎯 Descripción

**SportMatch Connect** es un ecosistema digital completo para el deporte amateur. Combina matchmaking predictivo, red social deportiva, gestión de torneos y una economía de recompensas virtuales (**FitCoins**) para combatir el abandono de la actividad física y centralizar la coordinación de partidos y competiciones.

**Deportes soportados:** Fútbol · Tenis · Básquetbol · Pádel · Vóleibol

**Usuarios objetivo:** Jugadores amateur, equipos locales (Squads), negocios deportivos (B2B) y organizadores de torneos.

---

## 🛠 Stack Tecnológico

### Frontend

| Tecnología | Versión | Rol |
|---|---|---|
| React | 19 | UI con Concurrent Features |
| TypeScript | 5.8 | Tipado estricto end-to-end |
| Vite | 7 | Dev server + bundler de producción |
| Tailwind CSS | v4 | Design system por utilidades |
| TanStack Router | 1.x | Routing declarativo type-safe |
| TanStack Query | 5.x | Data fetching + cache del servidor |
| Zustand | 5 | Estado global ligero y reactivo |
| Framer Motion | 12 | Animaciones y transiciones premium |
| shadcn/ui + Radix UI | latest | Componentes accesibles y composables |
| React Hook Form + Zod | 7.x / 3.x | Formularios con validación tipada |
| Leaflet + react-leaflet | 1.9 / 5.x | Mapas interactivos con clustering |
| Three.js + @react-three | 0.184 | Preview 3D de canchas (AR) |
| Stripe | 9.x | Pasarela de pago integrada |
| TensorFlow.js + NSFWJS | 4.x | Moderación de imágenes en cliente |
| i18next | 26 | Internacionalización (es / en / pt) |
| Recharts | 2.x | Visualización de estadísticas |

### Backend

| Tecnología | Versión | Rol |
|---|---|---|
| NestJS | 11 | Framework REST modular |
| Prisma | 5 | ORM + migraciones |
| Supabase PostgreSQL | latest | Base de datos principal + RLS |
| Passport + JWT | 0.7 / 11.x | Autenticación stateless |
| Stripe SDK | 22.x | Procesamiento de pagos server-side |
| Google Vertex AI | Gemini | Chat IA (Sporty) + recomendaciones |
| Google Cloud Speech | 7.x | STT: transcripción de voz |
| Google Cloud TTS | 6.x | TTS: síntesis de habla natural |
| Swagger / OpenAPI | 11.x | Documentación automática de la API |

### Infraestructura & DevOps

| Herramienta | Uso |
|---|---|
| Vercel | Hosting del frontend (CDN global) |
| Render | Hosting del backend NestJS |
| Supabase | PostgreSQL + Auth + Storage + Realtime |
| Docker + SonarQube | Análisis de calidad de código (local) |
| Husky + lint-staged | Pre-commit hooks (ESLint → Prettier → tsc) |
| Playwright | Tests E2E de flujos críticos |
| Vitest | Tests unitarios con cobertura V8 |
| GitHub Actions | CI/CD automático |

---

## 🏗 Arquitectura

### Feature-Sliced Design (FSD)

El frontend sigue la arquitectura **Feature-Sliced Design** con importaciones estrictamente unidireccionales (solo hacia abajo):

```
src/
├── app/          # Entry point, providers globales, ErrorBoundary
├── routes/       # Páginas-rutas (TanStack Router) — sin lógica de negocio
├── features/     # Módulos de negocio autocontenidos
│   ├── ai-assistant/       # Chat Sporty (Vertex AI)
│   ├── ai-security/        # Moderación de contenido IA
│   ├── ai-text/            # Smart Comments + Auto-Hashtags
│   ├── ai-vision/          # Moderación de imágenes (TensorFlow.js)
│   ├── ar-court-preview/   # Preview 3D de canchas (Three.js)
│   ├── b2b-ai/             # Recomendaciones B2B con IA
│   ├── bookings/           # Reservas de canchas
│   ├── chat/               # Chat en tiempo real (Supabase Realtime)
│   ├── courts/             # Gestión de canchas
│   ├── engagement-ai/      # Sistema de engagement y logros con IA
│   ├── feed/               # Feed social de publicaciones
│   ├── map/                # Mapa interactivo con geolocalización
│   ├── matchmaking/        # Motor de emparejamiento de jugadores
│   ├── notifications/      # Notificaciones push y en-app
│   ├── profile/            # Perfil de usuario y estadísticas
│   ├── social/             # Seguidores, squads, interacciones
│   ├── squads/             # Gestión de equipos
│   ├── voice/              # STT / TTS (voz en el chat)
│   └── wallet/             # FitCoins, historial de pagos, Stripe
├── entities/     # Modelos de dominio (User, Court, Match, Post...)
├── shared/       # Utilidades, UI genérica, hooks, API clients
│   ├── api/      # Servicios de acceso a datos (Supabase + Backend)
│   ├── hooks/    # Hooks reutilizables
│   ├── lib/      # Helpers (crypto, payments, date...)
│   └── ui/       # Componentes de diseño base
└── styles.css    # Tokens globales del design system (Tailwind v4)
```

### Backend (NestJS Modular)

```
server/src/
├── ai/           # Vertex AI, Speech-to-Text, TTS, recomendaciones
├── auth/         # JWT + Passport + Guards + Decorators
├── bookings/     # CRUD de reservas
├── courts/       # CRUD de canchas
├── engagement/   # Motor de engagement y eventos de comportamiento
├── matches/      # Gestión de partidos y resultados
├── matchmaking/  # Algoritmo de emparejamiento server-side
├── payments/     # Stripe webhooks y procesamiento de pagos
├── posts/        # Feed social (posts + imágenes multipart)
├── profiles/     # Perfiles de usuario
├── social/       # Followers, likes, squads
├── sports/       # Catálogo de deportes
├── users/        # CRUD de usuarios
├── wallet/       # FitCoins, transacciones, saldo
├── ar/           # Endpoint de AR court preview
└── health/       # Healthcheck para Render keepalive
```

### Diagrama de Capas

```
┌─────────────────────────────────────────────────────┐
│                  Vercel (Frontend)                   │
│  React 19 · Vite · TanStack Router · Zustand        │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │  TensorFlow │  │  Three.js AR │  │ Web Speech │  │
│  │  (Edge AI)  │  │  Court 3D    │  │  STT/TTS   │  │
│  └─────────────┘  └──────────────┘  └────────────┘  │
└──────────────────────┬──────────────────────────────┘
                       │ HTTPS / REST
┌──────────────────────▼──────────────────────────────┐
│               Render (Backend NestJS)                │
│  Auth · Payments · AI · Social · Matchmaking        │
└──────────┬──────────────────────┬───────────────────┘
           │                      │
┌──────────▼──────────┐  ┌────────▼────────────────────┐
│  Supabase Postgres  │  │  Google Cloud (Vertex AI)   │
│  RLS + Realtime +   │  │  Gemini · Speech · TTS      │
│  Storage + Auth     │  └─────────────────────────────┘
└─────────────────────┘
```

---

## ✨ Funcionalidades Principales

### 🎯 Matchmaking Inteligente
Motor de emparejamiento que considera deporte, nivel de habilidad, ubicación geográfica (Haversine), horarios disponibles y compatibilidad social. Algoritmo de puntuación multivariable con descarte de jugadores ya vistos.

### 🗺 Mapa Interactivo
Visualización en tiempo real de canchas y jugadores disponibles usando Leaflet con clustering automático (`react-leaflet-cluster`). Filtros por deporte, radio y disponibilidad.

### 💬 Chat en Tiempo Real
Mensajería directa entre jugadores con subscripciones a Supabase Realtime. Soporte para mensajes de texto e imágenes moderadas.

### 📰 Feed Social
Red social deportiva completa: publicaciones con imagen, reacciones, comentarios, hashtags automáticos por IA, y sistema de seguidores. Feed paginado con infinite scroll.

### 👥 Squads
Creación y gestión de equipos deportivos. Los squads tienen perfil propio, miembros, historial de partidos y comunicación grupal.

### 🏟 Reservas de Canchas
Sistema de reservas con calendario, validación de disponibilidad y confirmación por email. Integración con el módulo de wallet para pagos.

### 💰 Wallet & FitCoins
Economía gamificada con moneda virtual **FitCoins** ganada por actividad deportiva. Pasarela de pago real con **Stripe** (tarjeta, Apple Pay, Google Pay) y sistema de descuentos con FitCoins.

### 🔔 Notificaciones
Notificaciones en-app y push: nuevos matches, mensajes, invitaciones a partidos, logros desbloqueados, ofertas de negocios locales.

### 🌍 Internacionalización
Soporte nativo para **Español, Inglés y Portugués** con detección automática del idioma del navegador y slang regional (pichanguita, pelada, rachão).

---

## 🤖 Módulos de IA

### 🛡 Moderación en el Borde (Edge AI — Sin costo de cloud)
- **Motor:** TensorFlow.js + NSFWJS (modelo MobileNet en el navegador)
- **Privacidad:** Las imágenes nunca salen del dispositivo. Se analizan localmente antes de cualquier upload.
- **Umbral:** Bloqueo si `Porn | Hentai | Sexy > 60%` de confianza.
- **Anti-spam:** Flags `isAnalyzingImage` / `isAnalyzingAvatar` previenen cargas concurrentes y fugas de memoria.
- **Fallback:** Si el CDN del modelo falla, se aplica modo tolerante (safe-by-default).

### 🗣 Sporty — Asistente Deportivo IA
- **Motor:** Google Vertex AI (Gemini)
- **Personalidad:** Respuestas cortas y naturales, sin aperturas robóticas. Slang regional por idioma.
- **Capacidades:** Recomendaciones de canchas/jugadores, respuestas sobre reglas deportivas, recordatorios de reservas, motivación personalizada.
- **Voz (STT):** Web Speech API con fallback a Google Cloud Speech (`/api/v1/ai/voice/transcribe`).
- **Voz (TTS):** Web Speech API con fallback a Google Cloud TTS Neural2 (`/api/v1/ai/voice/synthesize`).
- **Idiomas:** es / en / pt con detección automática.

### ✍ Smart Comments & Auto-Hashtags
- **Smart Comments:** Sugerencias de comentarios contextuales al redactar en el feed.
- **Auto-Hashtags:** Generación automática de 3-5 hashtags relevantes al publicar un post.
- **Motor:** Vertex AI con contexto del deporte y contenido del post.

### 📊 Engagement AI
Motor de personalización que construye un perfil comportamental privado a partir de eventos deportivos (`MATCH_JOINED`, `POST_CREATED`, `PLAYER_CONNECTED`, etc.) para generar:
- Retos diarios personalizados
- Logros sugeridos
- Resumen semanal de actividad
- Narrativas deportivas
- Notificaciones inteligentes

La metadata se guarda sin copiar contenido sensible. **RLS de Supabase** garantiza que cada usuario solo accede a sus propios eventos.

### 🏢 B2B AI
Recomendaciones de productos y servicios deportivos locales (academias, tiendas, entrenadores) para usuarios Business con segmentación por deporte, nivel y ubicación.

---

## ⚙️ Configuración del Entorno

### Requisitos

- **Node.js** ≥ 20.0.0
- **npm** ≥ 10.0.0
- **Docker** (opcional, para SonarQube local)

### Variables de entorno (Frontend — raíz del proyecto)

Copia `.env.example` y rellena los valores:

```bash
cp .env.example .env
```

| Variable | Descripción | Requerida |
|---|---|---|
| `VITE_SUPABASE_URL` | URL del proyecto Supabase | ✅ |
| `VITE_SUPABASE_ANON_KEY` | Anon key de Supabase | ✅ |
| `VITE_API_BASE_URL` | URL del backend NestJS | ✅ |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Clave pública de Stripe | ✅ |
| `VITE_USE_MOCKS` | `true` para modo offline sin Supabase | ⚙️ |
| `VITE_CHAT_DEFAULT_LANG` | Idioma del chat (`es`/`en`/`pt`) | ⚙️ |
| `VITE_SUPABASE_FUNCTIONS_URL` | Override de URL de Supabase Functions | ⚙️ |

> **Nota:** Si `VITE_SUPABASE_URL` o `VITE_SUPABASE_ANON_KEY` no están configuradas, la app entra en **modo fallback resiliente** (no hay pantalla en blanco).

### Variables de entorno (Backend — `/server/.env`)

```bash
cp server/.env.example server/.env
```

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | PostgreSQL con pgBouncer (`port 6543`, `pgbouncer=true`) |
| `DIRECT_URL` | PostgreSQL directo (`port 5432`) para migraciones Prisma |
| `JWT_SECRET` | Secreto para firmar tokens JWT |
| `STRIPE_SECRET_KEY` | Clave secreta de Stripe |
| `GOOGLE_CLOUD_PROJECT_ID` | ID del proyecto de Google Cloud |
| `GOOGLE_APPLICATION_CREDENTIALS` | Ruta al JSON de credenciales GCP |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key para operaciones admin |

> **Arquitectura Dual-URL de Prisma:** `DATABASE_URL` usa el pooler de Supabase (pgBouncer, us-west-2, puerto 6543) para queries. `DIRECT_URL` usa conexión directa (puerto 5432) para migraciones.

---

## 🚀 Comandos de Desarrollo

### Iniciar el stack completo (frontend + backend)

```bash
npm run dev
```

> ⚠️ Esto inicia ambos servidores concurrentemente. El frontend corre en `http://localhost:5173`.

### Solo el frontend (recomendado para desarrollo UI)

```bash
npx vite --port 5173 --strictPort
```

### Solo el backend

```bash
npm run dev:backend
```

### Build de producción

```bash
# Frontend
npm run build

# Backend
cd server && npm run build
```

### Análisis del bundle

```bash
npm run build:analyze
```

### Type checking

```bash
npm run typecheck           # Frontend
cd server && npm run build  # Backend (tsc)
```

### Linting y formateo

```bash
npm run lint     # ESLint
npm run format   # Prettier
```

---

## 🧪 Testing

### Tests unitarios (Vitest)

```bash
npm run test              # Ejecuta la suite completa
npm run test:watch        # Modo watch
```

### Tests E2E (Playwright)

```bash
npm run test:e2e
```

### Análisis de calidad (SonarQube)

```bash
# 1. Levantar SonarQube local con Docker
npm run sonar:up

# 2. Acceder a http://localhost:9000 y crear el proyecto "sportmatch-connect"

# 3. Ejecutar el análisis
npm run sonar:scan

# 4. Apagar SonarQube
npm run sonar:down
```

---

## 📦 Despliegue

### Frontend → Vercel

El frontend se despliega automáticamente en Vercel en cada push a `main`.

```powershell
# Ver estado de despliegues
powershell -ExecutionPolicy Bypass -File scripts/infra/vercel-status.ps1

# Gestionar variables de entorno
powershell -ExecutionPolicy Bypass -File scripts/infra/vercel-env.ps1
```

**Proyectos Vercel:**
- `sportmatch-connect` — Producción principal
- `sportmatch-connect-czs5` — Staging
- `sportmatch-connect-juan-alonso` — Preview personal

### Backend → Render

```powershell
# Estado del servicio y logs
powershell -ExecutionPolicy Bypass -File scripts/infra/render-status.ps1
powershell -ExecutionPolicy Bypass -File scripts/infra/render-logs.ps1 -Tail 50

# Trigger de deploy manual
powershell -ExecutionPolicy Bypass -File scripts/infra/render-deploy.ps1

# Actualizar variables de entorno
powershell -ExecutionPolicy Bypass -File scripts/infra/render-env-set.ps1
```

> ⚠️ **Render Free Tier:** El servicio entra en hibernación tras inactividad. Hacer una request de "wake-up" 2-5 minutos antes de una demo.

### Base de datos → Supabase

- Las migraciones se aplican con `prisma db push` desde el entorno de CI o manualmente.
- Cambios de schema directos en el Dashboard de Supabase requieren ejecutar `NOTIFY pgrst, 'reload schema'` en el SQL Editor para que PostgREST los detecte.

---

## ✅ Calidad de Código

### Pre-commit hooks (Husky)

Cada commit ejecuta automáticamente:
1. `eslint --fix` — Corrección de errores de estilo
2. `prettier --write` — Formateo consistente
3. `tsc --noEmit` — Validación de tipos TypeScript

### Estándares aplicados

- **SonarQube:** Análisis estático con 0 issues críticos en producción
- **Complejidad cognitiva:** ≤ 15 por función
- **Profundidad de anidación:** ≤ 4 niveles
- **Seguridad:** Sin `Math.random` — se usa `crypto.getRandomValues` vía helpers en `src/shared/lib/crypto.ts`
- **Regex seguras:** Sin expresiones regulares vulnerables a ReDoS
- **TypeScript strict:** `noImplicitAny`, `strictNullChecks` habilitados

### Auditoría de seguridad

```bash
cd server && npm audit --production
```

**Estado actual:** 0 vulnerabilidades críticas ni altas en dependencias de producción.

---

## 📚 Documentación Interna

| Documento | Descripción |
|---|---|
| [`docs/VISION-V2.md`](docs/VISION-V2.md) | Roadmap de arquitectura V2 (escalabilidad, IA vectorial, PostGIS) |
| [`docs/ENVIRONMENT_VARIABLES.md`](docs/ENVIRONMENT_VARIABLES.md) | Referencia completa de todas las variables de entorno |
| [`docs/ENGAGEMENT_AI.md`](docs/ENGAGEMENT_AI.md) | Especificación del motor de engagement con IA |
| [`docs/VERCEL_DEPLOY.md`](docs/VERCEL_DEPLOY.md) | Guía detallada de despliegue en Vercel |
| [`docs/design-system.md`](docs/design-system.md) | Tokens de diseño y componentes del sistema |
| [`docs/matchmaking-score.md`](docs/matchmaking-score.md) | Algoritmo de puntuación del matchmaking |
| [`docs/premium-pricing-tiers.md`](docs/premium-pricing-tiers.md) | Planes de suscripción y modelo de precios |
| [`docs/adr/`](docs/adr/) | Architecture Decision Records |
| [`docs/sprints/`](docs/sprints/) | Historial de sprints y retrospectivas |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | Guía de contribución y estándares del equipo |
| [`AGENTS.md`](AGENTS.md) | Quirks del proyecto para agentes de IA |

### Architecture Decision Records (ADR)

Las decisiones arquitectónicas irreversibles se documentan en `docs/adr/`. Ver [`docs/adr/README.md`](docs/adr/README.md) para la guía de cuándo y cómo crear una ADR.

---

## 🤝 Contribución

Ver [`CONTRIBUTING.md`](CONTRIBUTING.md) para las normas del equipo.

**Resumen rápido:**

1. **Ramas:** `feature/nombre`, `bugfix/nombre`, `hotfix/nombre`, `refactor/nombre`
2. **Commits:** Conventional Commits — `feat(área): descripción en imperativo`
3. **FSD:** Toda la lógica va en `features/` o `entities/`. Nunca en `routes/` o `app/`.
4. **TypeScript:** Prohibido `any`. Define interfaces en `src/entities/`.
5. **Tests:** Cada nueva funcionalidad debe tener tests unitarios en `tests/`.
6. **Pre-commit:** Los hooks validan automáticamente. Si falla `tsc`, corrige antes de commitear.

---

## 📐 Convenciones de Nombres de Archivos

| Tipo | Patrón | Ejemplo |
|---|---|---|
| Componente React | `PascalCase.tsx` | `MatchCard.tsx` |
| Hook | `useCamelCase.ts` | `useMatchmaking.ts` |
| Store Zustand | `useCamelCaseStore.ts` | `useWalletStore.ts` |
| Servicio API | `camelCaseService.ts` | `feedService.ts` |
| Tipo / Interface | `types.ts` en el módulo | `types.ts` |
| Constantes | `UPPER_SNAKE_CASE` | `MAX_FITCOINS` |

---

<div align="center">

**SportMatch Connect** · Proyecto de Ingeniería de Software 2026

_Construido con ❤️ para revolucionar el deporte amateur_

</div>
