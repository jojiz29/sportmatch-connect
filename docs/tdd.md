# Technical Design Document (TDD) - SportMatch Connect

**Document Owner:** Lead Solution Architect
**Status:** V1 Final - Production Ready
**Date:** May 2026

## 1. Executive Summary

SportMatch Connect es una plataforma escalable ("Serie-A grade") que resuelve el problema de conectar deportistas amateur mediante Inteligencia Artificial, telemetría IoT (FitCoins) y reservas de canchas en tiempo real. Este documento describe la arquitectura C-Level de la aplicación web.

## 2. Architecture: Feature-Sliced Design (FSD)

Para asegurar escalabilidad con un equipo creciente, adoptamos FSD. Este patrón divide el proyecto en capas de abstracción estrictas:

- **`app/`**: Inicialización del ecosistema (React, Providers, Router, ProtectedRoutes).
- **`pages/`**: Vistas ruteables (`MapPage`, `MatchPage`). Son agnósticas a la lógica de negocio; solo componen widgets.
- **`features/`**: Lógica de valor de negocio (`matchmaking`, `wallet`, `iot`, `map`). Contienen hooks de TanStack Query y stores de Zustand.
- **`entities/`**: Modelos de datos crudos vinculados al dominio 1:1 con el schema SQL (`User`, `Court`, `Transaction`).
- **`shared/`**: El ecosistema primitivo. Atomic UI (Shadcn), librerías de monitoreo (Sentry/PostHog), configuración i18n, y el cliente API unificado.

_Constraint:_ Una capa solo puede importar de las que están por debajo de ella. Las dependencias circulares y la deuda técnica (Spaghetti code) quedan imposibilitadas por diseño.

## 3. Technology Stack & Key Decisions (ADRs)

| Dimensión                | Tecnología           | Razón (ADR)                                                                                                                                   |
| ------------------------ | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Framework**            | Vite + React 19      | Máxima velocidad de HMR y build.                                                                                                              |
| **Routing & SEO**        | TanStack Router      | Type-safety absoluto en rutas, precarga de datos eficiente, y meta tags dinámicos nativos en el ciclo de vida del loader.                     |
| **State Management**     | Zustand              | Utilizado exclusivamente para el flujo pesado de telemetría IoT, usando `shallow` selects para evitar re-renders masivos (60fps lock).        |
| **Data Fetching**        | TanStack Query       | Manejo de caché, invalidaciones automáticas, y _Optimistic Updates_ para interacciones veloces como el swipe de Matchmaking.                  |
| **Backend as a Service** | Supabase             | Base de datos PostgreSQL con SDK nativo. Elegido por su motor de Real-time (WebSockets) y su Auth.                                            |
| **Atomic UI**            | Shadcn + Tailwind v4 | Sistema de diseño de bajo peso. Los componentes viven en `/shared/ui` y son totalmente personalizables sin amarrarnos a librerías de estilos. |
| **Animaciones**          | Framer Motion        | Integrado para físicas realistas de arrastre (drag constraints) y transiciones de ruta orquestadas por `<AnimatePresence>`.                   |

## 4. Security & Data Flow

### 4.1 Hybrid Data Layer (Mock vs Prod)

El `apiClient` abstrae la capa de red implementando un Patrón de Repositorio. Dependiendo de `VITE_USE_MOCKS`, resuelve la data desde `src/lib/mock.ts` o lanza peticiones reales al SDK de Supabase. Esto permite al equipo trabajar offline y hacer demos funcionales sin depender del backend.

### 4.2 Row Level Security (RLS)

PostgreSQL está blindado mediante políticas RLS (`supabase/seed.sql`):

- Lecturas públicas limitadas a la superficie necesaria (Perfiles, Canchas, Matches).
- La tabla crítica `Transactions` restringe el `SELECT` a `auth.uid() = user_id`.
- Las escrituras (INSERTS) están bloqueadas desde el cliente. Deben realizarse mediante _Edge Functions_ autoritarias para prevenir inyección de FitCoins falsos.

## 5. DevOps & Observability

- **Dockerización**: Entorno unificado vía `docker-compose.yml` para desarrollo, y multi-stage `Dockerfile` (Node:20-alpine) para deploys a producción.
- **CI/CD**: GitHub Actions exige el paso exitoso de Vitest (Tests unitarios y matemáticos), ESLint, y TypeCheck (`tsc --noEmit`) en cada Pull Request antes del merge.
- **Monitoring**: Wrapper en `shared/lib/monitoring.ts` que suprime logs inútiles en PROD y orquesta `captureException` y `captureEvent` listos para Sentry/PostHog.
- **Bundle Tracking**: Integración con `rollup-plugin-visualizer` invocable mediante `npm run build:analyze` para auditar el tamaño de la aplicación a medida que crece.
