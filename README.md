# SportMatch Connect ⚡

### _La Revolución de la Economía y Conectividad del Deporte Amateur_

[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black&style=for-the-badge)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white&style=for-the-badge)](https://www.typescriptlang.org/)
[![TanStack Router](https://img.shields.io/badge/TanStack_Router-1.168-FF4154?logo=react&logoColor=white&style=for-the-badge)](https://tanstack.com/router)
[![Zustand](https://img.shields.io/badge/Zustand-5.0-orange?style=for-the-badge)](https://github.com/pmndrs/zustand)
[![Supabase](https://img.shields.io/badge/Supabase-2.106-3ECF8E?logo=supabase&logoColor=white&style=for-the-badge)](https://supabase.com/)
[![Tailwind v4](https://img.shields.io/badge/Tailwind_CSS_v4-38B2AC?logo=tailwindcss&logoColor=white&style=for-the-badge)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/Docker-Container-2496ED?logo=docker&logoColor=white&style=for-the-badge)](https://www.docker.com/)

---

## 1. El Pitch de Negocio y Visión Estratégica

### La Oportunidad de Mercado (El Dolor)

El deporte amateur mueve a millones de personas diariamente, sin embargo, el ecosistema padece tres grandes fricciones no resueltas:

1. **Fragmentación Extrema:** Reservar una cancha implica navegar entre llamadas telefónicas, chats de WhatsApp informales o múltiples apps locales de pago que no se comunican entre sí.
2. **Abandono y Falta de Incentivos:** Más del 40% de los deportistas amateurs dejan de practicar semanalmente por falta de motivación, problemas de agenda o incapacidad de encontrar rivales de su misma categoría.
3. **Comunidades Desconectadas:** Los jugadores con agendas compatibles pero sin círculos sociales comunes no tienen un canal unificado para conectar de forma segura y confiable.

### La Solución (SportMatch Connect)

**SportMatch Connect** es la primera super-app que fusiona geolocalización avanzada, incentivos económicos y telemetría en tiempo real bajo tres pilares disruptivos:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          SPORTMATCH CONNECT                             │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
         ┌───────────────────────────┼───────────────────────────┐
         ▼                           ▼                           ▼
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│   MATCHMAKING    │       │     FITCOINS     │       │  TELEMETRÍA IOT  │
│  Predictivo IA   │       │  'Play-to-Earn'  │       │   Wearables Live │
└──────────────────┘       └──────────────────┘       └──────────────────┘
```

1. **Matchmaking Predictivo impulsado por IA:** Olvídate del spam. Nuestro algoritmo empareja instantáneamente a jugadores analizando su disponibilidad horaria, ubicación física, historial deportivo y su **Trust Score** (reputación basada en asistencia y conducta).
2. **Economía Deportiva Gamificada (FitCoins):** Transformamos el sudor en recompensa. A través de un modelo económico sostenible de _Play-to-Earn_, los usuarios ganan FitCoins al finalizar sus partidos o completar retos semanales. Estos FitCoins se canjean directamente por productos reales (bebidas isotónicas, indumentaria, paletas de pádel o alquiler gratuito de canchas) en nuestro Marketplace integrado.
3. **Sincronización de Telemetría IoT en Vivo:** Integramos wearables y dispositivos inteligentes para capturar el rendimiento físico real (frecuencia cardíaca, pasos, calorías quemadas). Estos datos no solo se visualizan de forma atractiva, sino que sirven como prueba de esfuerzo auditable para desbloquear y reclamar recompensas de FitCoins de manera transparente.

### Capacidades Operativas y Escalabilidad

SportMatch Connect está diseñado para un rendimiento de nivel corporativo:

- **Mapa de Alta Densidad:** Renderiza dinámicamente y con cero latencia más de **10k+ usuarios concurrentes** utilizando clústeres espaciales optimizados basados en Leaflet y TanStack Query.
- **Resiliencia SSR/Hydration:** Capa de mapas robusta protegida contra caídas de renderizado de librerías nativas mediante detección dinámica del lado del cliente.
- **Offline-First:** Sistema preparado para operar en modo simulación local sin depender del backend en zonas de baja conectividad.

---

## 2. Gobernanza Técnica e Ingeniería

### Arquitectura de Software (Feature-Sliced Design)

El proyecto se rige por los estrictos principios arquitectónicos de **Feature-Sliced Design (FSD)**. Esta metodología divide el código en capas jerárquicas desacopladas para asegurar la mantenibilidad y escalabilidad del software:

```
src/
├── app/              # Proveedores globales, rutas raíz y estilos principales
├── pages/            # Vistas completas de la aplicación organizadas por layouts
├── features/         # Rebanadas de funcionalidad con efectos secundarios (lógica de negocio)
│   ├── matchmaking/  # Swipe y emparejamiento inteligente de jugadores
│   ├── map/          # Visualización espacial y lógica de geolocalización
│   └── wallet/       # Sistema transaccional de FitCoins y Marketplace
├── entities/         # Modelos de datos puros, stores globales de estado y contratos
│   ├── user/         # Modelos de usuario y hooks de autenticación (useAuth)
│   └── types.ts      # Definiciones de tipo estrictas e inmutables del proyecto
└── shared/           # Elementos atómicos, utilitarios de red (apiClient) e i18n
```

### Políticas Inquebrantables de Código (The Team Rules)

> [!IMPORTANT]
> **1. Zero-Any Policy**
> Está estrictamente prohibido el uso del tipo `any`. Todo objeto o respuesta de red del `apiClient` debe estar tipado explícitamente mediante contratos genéricos en [types.ts](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/src/entities/types.ts). Si un servicio externo no tiene tipos, debes crear su declaración correspondiente en la carpeta `@types`.

> [!WARNING]
> **2. Arquitectura Desacoplada**
> Las vistas localizadas en `src/routes/` deben actuar puramente como orquestadoras del enrutamiento y cargadores de datos preliminares (`loaders`). Queda terminantemente prohibido escribir lógica de negocio pesada, mutaciones o llamadas de API directas en las rutas. Delegue siempre este procesamiento a los hooks especializados dentro de `src/features/`.

> [!TIP]
> **3. Prioridad de Internacionalización (i18n)**
> Está prohibido escribir strings estáticos directamente en el código de la UI. Todo texto (títulos, descripciones, botones, avisos y toasts) debe ser registrado en [es.json](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/src/shared/i18n/locales/es.json) y consumido a través del hook `useTranslation` mediante el helper `t()`.

---

## 3. Guía Paso a Paso para Levantar el Proyecto

### Requisitos Previos

- **Node.js** v20.x o superior.
- **npm** v10.x o superior.
- **Docker** y **Docker Compose** instalados (opcional para levantar bases de datos/contenedores).

### 1. Clonar el repositorio

```bash
git clone https://github.com/jojiz29/sportmatch-connect.git
cd sportmatch-connect
```

### 2. Configurar el Archivo de Entorno

Crea un archivo `.env` en la raíz del proyecto. Por defecto, para el desarrollo local y pruebas offline de la Fase 4, configure las siguientes variables:

```env
VITE_USE_MOCKS=true
VITE_SUPABASE_URL=https://placeholder-url.supabase.co
VITE_SUPABASE_ANON_KEY=placeholder-anon-key
```

### 3. Levantamiento del Proyecto

#### Método A: Despliegue con Docker (Recomendado para entornos limpios)

Para orquestar el ecosistema completo en contenedores aislados:

```bash
docker-compose up --build
```

#### Método B: Despliegue Nativo

Para levantar el servidor de desarrollo local de forma nativa:

```bash
# 1. Instalar dependencias del proyecto
npm install

# 2. Iniciar el entorno de desarrollo local
npm run dev
```

_Nota: Para evitar conflictos en tu sistema local si tienes otros proyectos de desarrollo activos, el servidor de desarrollo de Vite está configurado para intentar enrutarse prioritariamente en el puerto **5178**. Si este está en uso, Vite detectará y escalará automáticamente al primer puerto disponible (ej. 5179)._

---

## 4. Scripts de Control de Calidad (QA) & Optimización

El proyecto cuenta con un pipeline integrado de calidad técnica para asegurar la robustez de las entregas:

| Comando                 | Propósito                                                         | Tecnología            |
| :---------------------- | :---------------------------------------------------------------- | :-------------------- |
| `npm run test`          | Ejecuta las pruebas unitarias y de lógica de negocio              | **Vitest**            |
| `npm run test:e2e`      | Ejecuta las pruebas integrales de flujos de usuario (E2E)         | **Playwright**        |
| `npm run build`         | Compila la aplicación en un paquete de producción optimizado      | **Vite / ESBuild**    |
| `npm run build:analyze` | Analiza el tamaño de las dependencias y la distribución de assets | **Rollup Visualizer** |
| `npm run lint`          | Ejecuta el análisis estático de código para reglas de estilo      | **ESLint**            |
| `npm run format`        | Aplica un formato homogéneo a todos los archivos del código       | **Prettier**          |

### Análisis del Bundle

Al ejecutar `npm run build:analyze`, se generará un reporte interactivo en `dist/stats.html`. Utiliza este reporte antes de cada _Pull Request_ para vigilar que el tamaño del paquete no se infle por dependencias pesadas y asegurar una carga ultra-rápida en móviles.

---

## 5. Gobernanza de Repositorio y Contexto AI

Para asegurar la calidad técnica y la uniformidad visual del código desarrollado por el equipo y los asistentes de Inteligencia Artificial, el repositorio incorpora mecanismos de gobernanza automática y guías de referencia. Es obligatorio revisar la guía de contribución del equipo en [CONTRIBUTING.md](file:///c:/Users/ejuni/OneDrive - SEIDOR SOLUTIONS S.L/Documentos/GitHub/sportmatch-connect/CONTRIBUTING.md) antes de abrir cualquier Pull Request:

### Contexto de Inteligencia Artificial (MCP)

Cualquier asistente de IA (Cursor, Copilot, Lovable, etc.) utilizado en este proyecto leerá automáticamente el archivo [.cursorrules](file:///c:/Users/ejuni/OneDrive - SEIDOR SOLUTIONS S.L/Documentos/GitHub/sportmatch-connect/.cursorrules) en la raíz del repositorio. Este archivo actúa como el manual de directivas de codificación:

- **Feature-Sliced Design (FSD)**: Cumplimiento arquitectónico estricto por capas.
- **Tipado Estricto**: Cero tolerancia al uso de `any` en variables y retornos de funciones.
- **Internacionalización**: Obligatoriedad del uso de hooks de `useTranslation` e inyección en `es.json` (no hardcoding de textos).
- **Zustand y TanStack Query**: Políticas claras para estados persistentes y mutaciones del lado del servidor.

### Sistema de Diseño y Pautas Estéticas

Los desarrolladores deben guiarse estrictamente por el manual técnico [design-system.md](file:///c:/Users/ejuni/OneDrive - SEIDOR SOLUTIONS S.L/Documentos/GitHub/sportmatch-connect/docs/design-system.md) ubicado en la carpeta de documentación. En él se especifican:

- Paletas cromáticas de HSL (Sleek Dark Mode & Neon Green).
- Convenciones de tipografía y espaciados basados en Tailwind CSS v4.
- Orquestación de animaciones físicas y de arrastre mediante `framer-motion`.
- Catálogo de componentes atómicos Shadcn UI en `shared/ui`.

### Blindaje en el Control de Versiones (Hooks de Pre-Commit)

Hemos configurado **Husky** y **lint-staged** para automatizar el control de calidad antes de cada commit. Al realizar una confirmación en Git:

1. `eslint --fix` y `prettier --write` se ejecutan sobre los archivos TS/JSX modificados para forzar el cumplimiento estilístico.
2. `npm run typecheck` (`tsc --noEmit`) se dispara globalmente en el repositorio para evitar la subida de código con errores de tipado TypeScript.

Si alguna de estas verificaciones falla, el commit es abortado de inmediato para mantener la integridad de la rama principal (`main`).
