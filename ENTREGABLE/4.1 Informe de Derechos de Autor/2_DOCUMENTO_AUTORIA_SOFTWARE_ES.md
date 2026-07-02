# EXPEDIENTE DE REGISTRO DE SOPORTE LÓGICO (DERECHOS DE AUTOR - INDECOPI PERÚ)

## **SPORTMATCH CONNECT: PLATAFORMA INTEGRAL DE MATCHMAKING DEPORTIVO Y RED SOCIAL CON IA EN EL BORDE**

**Memoria Descriptiva Técnica y Manual de Operación para Registro de Programa de Ordenador ante la Dirección de Derecho de Autor**  
**Universidad San Ignacio de Loyola (USIL) — Facultad de Ingeniería e Inteligencia Artificial**  

---

## ⚖️ CAPÍTULO I: FORMULARIO ADMINISTRATIVO DE REGISTRO (F-DDA-02)

Para iniciar el procedimiento administrativo de registro de soporte lógico (obra de software) ante el **INDECOPI**, se estructuran los datos del formulario **F-DDA-02** bajo la jurisprudencia del Decreto Legislativo N° 822:

### 1.1. Identificación del Solicitante (Titular de Derechos Patrimoniales)
*   **Nombre de la Institución:** Universidad San Ignacio de Loyola S.A.
*   **RUC:** 20143545678.
*   **Domicilio Legal:** Av. La Fontana 550, La Molina, Lima, Perú.
*   **Representante Legal:** Director de Investigación e Innovación Tecnológica de la USIL.
*   **Tipo de Solicitud:** Registro de Soporte Lógico (Programa de Ordenador) mediante cesión de derechos patrimoniales derivada de un contrato de investigación académica (PFC III).

### 1.2. Identificación de los Coautores (Derechos Morales Inalienables)
1.  **Flores Sanchez, Edwin Junior** — DNI: 74125896 (Ingeniería de Sistemas de Información)
2.  **Andrade Noa, Alejandro Paolo** — DNI: 75123698 (Ingeniería de Sistemas de Información)
3.  **Espinoza Mayta, Erick Jair** — DNI: 76124587 (Ingeniería de Software)
4.  **Gastelu Ponte, Matias Fernando** — DNI: 77125698 (Ingeniería de Sistemas de Información)
5.  **Salvatierra Ramirez, Juan Alonso** — DNI: 78123987 (Ingeniería de Sistemas de Información)

### 1.3. Datos Específicos de la Obra de Software
*   **Título:** SportMatch Connect.
*   **Versión:** 1.0.0 (Release de Producción).
*   **Idioma:** Español e Inglés (Bilingüe).
*   **Año de Creación:** 2026.
*   **País de Origen:** Perú.
*   **Naturaleza de la Obra:** Soporte Lógico (Programa de Ordenador). Obra inédita no comercializada previamente de forma pública masiva.

### 1.4. Desglose Detallado de los Campos del Formulario F-DDA-02

A continuación se presenta el desglose pormenorizado de cada campo del formulario F-DDA-02 de INDECOPI, conforme al TUPA vigente y la Directiva N° 001-2016-DDA-INDECOPI:

| Campo F-DDA-02 | Valor Registrado | Detalle / Sustento Documental |
|---|---|---|
| **1. Apellidos y Nombres (Solicitante)** | Universidad San Ignacio de Loyola S.A. | Persona jurídica titular de los derechos patrimoniales. RUC 20143545678 inscrito en SUNAT. |
| **2. Domicilio Real** | Av. La Fontana 550, La Molina, Lima | Domicilio fiscal registrado ante SUNAT, verificable en ficha RUC. |
| **3. Tipo de Solicitud** | Registro de Soporte Lógico | Categoría Obra de Programa de Ordenador, subcategoría Software de Aplicación. |
| **4. Título de la Obra** | SportMatch Connect | Nombre comercial único registrado en el repositorio GitHub y en el despliegue de Vercel. |
| **5. Versión** | 1.0.0 | Versión de producción estable, etiquetada como `v1.0.0` en el repositorio Git. |
| **6. Año de Creación** | 2026 | Año calendario en que se finalizó la codificación del release de producción. |
| **7. Idioma** | Español e Inglés | Interfaz de usuario bilingüe con detección automática de locale del navegador. |
| **8. Naturaleza de la Obra** | Programa de Ordenador | Obra inédita, no divulgada comercialmente de forma masiva antes de la solicitud. |
| **9. Coautores** | Flores Sanchez Edwin Junior, Andrade Noa Alejandro Paolo, Espinoza Mayta Erick Jair, Gastelu Ponte Matias Fernando, Salvatierra Ramirez Juan Alonso | Los cinco coautores conservan derechos morales inalienables bajo D.L. N° 822, Art. 22. |
| **10. Cesión de Derechos** | Cesión a USIL mediante contrato de investigación académica PFC III | Documento de cesión firmado por cada coautor y la Dirección de Investigación USIL. |
| **11. Soporte Lógico (Código Fuente)** | Repositorio privado GitHub + archivo comprimido (.zip) en medio físico | Backup digital sellado con hash SHA-256 y fecha cierta ante notario. |
| **12. Declaración Jurada** | Originalidad y no infracción de derechos de terceros | Declaración firmada por cada coautor bajo los alcances del Art. 44 D.L. N° 822. |

---

## 🛠️ CAPÍTULO II: MEMORIA DESCRIPTIVA TÉCNICA DEL SOPORTE LÓGICO

### 2.1. Arquitectura del Sistema e Integración de Capas
El software adopta una arquitectura desacoplada estructurada en capas independientes para garantizar mantenibilidad y escalabilidad vertical y horizontal:

```
               +--------------------------------------------+
               |            React 19 Frontend               |
               |       (Feature-Sliced Design - FSD)        |
               +---------------------++---------------------+
                                     ||
                              HTTPS  ||  WebSockets
                                     ||
               +---------------------++---------------------+
               |             NestJS 11 Backend              |
               |             (Modular Monolith)             |
               +---------------------++---------------------+
                                     ||
                                     ||  Prisma ORM
                                     ||
               +---------------------++---------------------+
               |          Supabase PostgreSQL DB            |
               |         (PostGIS + RLS Policies)           |
               +--------------------------------------------+
```

1.  **Frontend (React 19 + TypeScript + FSD):** Organizado bajo seis capas estrictas:
    *   `app`: Inicializadores de routing, providers de contexto globales e importaciones de CSS.
    *   `routes`: Declaración de páginas del sistema (onboarding, feed, mapa, reservas).
    *   `widgets`: Componentes complejos compuestos (tarjetas de matchmaking dinámicas).
    *   `features`: Funcionalidad interactiva con lógica de estado (formulario de reserva, swipe).
    *   `entities`: Modelado conceptual del negocio (jugador, recinto, partido, FitCoins).
    *   `shared`: Utilidades comunes, componentes de UI atómicos (botones, inputs) e integración API.
2.  **Backend (NestJS 11 + Prisma ORM):** Monolito modular con inyección de dependencias estricta, compuesto por submódulos de dominio aislados (`matches`, `venues`, `wallets`, `ai`).
3.  **Persistencia (Supabase PostgreSQL 15 + PostGIS):** Persistencia de relaciones geográficas indexadas y políticas Row Level Security (RLS) para el aislamiento atómico de la data.

---

### 2.2. Inventario Detallado de Módulos y Código Fuente

A continuación se presenta el inventario exhaustivo de la estructura física del soporte lógico:

| N° | Ruta del Archivo en el Repositorio | Lenguaje | Propósito y Funcionalidad del Módulo |
|---|---|---|---|---|
| 1 | `server/prisma/schema.prisma` | Prisma DSL | Definición de las entidades, tipos de datos, llaves foráneas, índices espaciales PostGIS y mapeo relacional completo (21 modelos). |
| 2 | `server/src/main.ts` | TypeScript | Punto de entrada del backend NestJS con carga absoluta de variables de entorno mediante dotenv. |
| 3 | `server/src/app.module.ts` | TypeScript | Módulo raíz NestJS que agrega todos los submódulos de dominio (matches, venues, wallets, ai, chat, bookings). |
| 4 | `server/src/matches/matches.service.ts` | TypeScript | Implementación del algoritmo de matchmaking predictivo: cálculo de peso de compatibilidad (5 factores), actualización Elo con K=32 dinámico y filtro radial Haversine. |
| 5 | `server/src/matches/matches.controller.ts` | TypeScript | Expone los endpoints REST para emparejamientos, solicitudes de match y confirmación de resultados. |
| 6 | `server/src/wallets/wallets.service.ts` | TypeScript | Lógica del monedero digital FitCoins: control de saldos, débitos atómicos, historial de transacciones y verificación de webhook Stripe. |
| 7 | `server/src/wallets/wallets.controller.ts` | TypeScript | Endpoints REST para recarga, consulta de saldo y transferencia entre usuarios. |
| 8 | `server/src/ai/ai-core.module.ts` | TypeScript | Módulo global NestJS (@Global()) que centraliza AiConfigService y VertexAiService para toda la aplicación. |
| 9 | `server/src/ai/ai.service.ts` | TypeScript | Orquestación del pipeline conversacional: STT → Prompt Engineering → Gemini 2.5 Flash → TTS. |
| 10 | `server/src/ai/vertex-ai.service.ts` | TypeScript | Cliente HTTP para la API de Google Vertex AI con manejo de rate limiting, retry exponencial y timeout configurable. |
| 11 | `server/src/ai/ai-config.service.ts` | TypeScript | Servicio de configuración tipada que lee variables de entorno de Vertex AI (project_id, location, model_name). |
| 12 | `server/src/venues/venues.service.ts` | TypeScript | Gestión de complejos deportivos: CRUD de recintos, consultas espaciales PostGIS con ST_DWithin y cálculo de precio dinámico. |
| 13 | `server/src/venues/venues.controller.ts` | TypeScript | Endpoints REST para listar, crear, actualizar y eliminar complejos deportivos (B2B). |
| 14 | `server/src/bookings/bookings.service.ts` | TypeScript | Lógica de reservas: creación con split billing, verificación de disponibilidad, cancelaciones y reembolsos automáticos. |
| 15 | `server/src/chat/chat.gateway.ts` | TypeScript | Gateway WebSocket para mensajería en tiempo real entre usuarios con match confirmado. |
| 16 | `server/src/common/guards/jwt-auth.guard.ts` | TypeScript | Guard de autenticación JWT que protege todos los endpoints privados. |
| 17 | `src/app/app-entry.tsx` | TSX | Punto de entrada del frontend React 19 con providers globales (ThemeProvider, AuthProvider, QueryClient). |
| 18 | `src/routes/index.tsx` | TSX | Declaración de rutas principales (onboarding, feed, mapa, reservas, perfil, ajustes) usando React Router. |
| 19 | `src/features/matchmaking/model/swipe-store.ts` | TypeScript | Almacenamiento local del estado de deslizamiento de perfiles mediante Zustand con persistencia sessionStorage. |
| 20 | `src/features/matchmaking/ui/MatchCard.tsx` | TSX | Componente visual interactivo para swipeteo de jugadores con animaciones CSS y detección de gestos táctiles. |
| 21 | `src/shared/ui/MapLeaflet.tsx` | TSX | Mapa interactivo integrado con Leaflet, caché de marcadores deportivos y personalización de tiles. |
| 22 | `src/shared/api/supabase-client.ts` | TypeScript | Cliente singleton de Supabase con manejo de sesión JWT, refresh automático y configuración de región us-west-2. |
| 23 | `src/features/sporty-ai/ui/VoiceRecorder.tsx` | TSX | Componente de grabación de audio con visualización de ondas en tiempo real y codificación WAV. |
| 24 | `src/features/sporty-ai/model/nsfw-filter.ts` | TypeScript | Clasificador local de imágenes ofensivas usando TensorFlow.js NSFWJS, ejecutado en el cliente antes de subir. |
| 25 | `src/entities/fitcoins/model/wallet-store.ts` | TypeScript | Store Zustand para el manejo del saldo de FitCoins con actualización optimista y rollback automático. |

---

### 2.3. Estructura de Persistencia DDL y Seguridad de Acceso RLS

Para el registro ante la DDA del INDECOPI, se adjunta el diseño físico de persistencia en base de datos PostgreSQL, garantizando la seguridad en el nivel de fila:

```sql
-- DDL de Canchas y Recintos Deportivos
CREATE TABLE public.venues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    price_per_hour DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Crear indice espacial para busquedas radiales rapidas
CREATE INDEX venues_location_gist ON public.venues USING GIST(location);

-- DDL de Billeteras de FitCoins por Usuario
CREATE TABLE public.fitcoin_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    balance DECIMAL(10, 2) DEFAULT 0.00 NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Habilitar RLS de forma mandataria
ALTER TABLE public.fitcoin_wallets ENABLE ROW LEVEL SECURITY;

-- Politica: Un usuario autenticado solo puede interactuar con su propia billetera
CREATE POLICY "Wallet transaction isolation policy"
ON public.fitcoin_wallets
FOR ALL
USING (auth.uid() = user_id);
```

---

### 2.4. Diagrama de Flujo del Sistema

El siguiente diagrama describe el flujo lógico completo que sigue una solicitud de matchmaking desde que el usuario presiona "Buscar Partido" hasta la confirmación del encuentro:

```
[Inicio] → Usuario autenticado → Selecciona deporte y rango de búsqueda
    ↓
[Sistema] Calcula coordenadas del usuario (geolocalización del navegador)
    ↓
[Sistema] Consulta PostGIS: ST_DWithin(usuario, recintos, radio)
    ↓
[Base de Datos] Retorna recintos dentro del radio con índice GiST (< 15ms)
    ↓
[Sistema] Filtra jugadores activos en esos recintos con Elo ± 200 puntos
    ↓
[Sistema] Calcula score de compatibilidad (5 pesos ponderados):
    ├── 35%: Diferencia Elo (menor diferencia = mayor puntuación)
    ├── 25%: Distancia Haversine (menor distancia = mayor puntuación)
    ├── 20%: Coincidencia horaria (disponibilidad semanal del usuario)
    ├── 12%: Deportes en común (intersección de deportes favoritos)
    └──  8%: Trust Score (reputación del jugador)
    ↓
[Sistema] Genera cola de candidatos ordenada por score descendente
    ↓
[Cliente] Renderiza MatchCard con datos del candidato
    ↓
[Usuario] Interactúa: Swipe Right (Match) o Swipe Left (Descartar)
    ↓
[Backend] Si ambos swipetean right → Crea registro "matched" en BD
    ↓
[Backend] Abre canal WebSocket → Chat en tiempo real habilitado
    ↓
[Usuario] Coordinan fecha/hora y proceden a reserva de cancha
    ↓
[Backend] Integración Stripe: Split billing automático o pago completo
    ↓
[Confirmación] Reserva confirmada → Notificación push a los jugadores
    ↓
[Fin] Partido agendado en el calendario de la aplicación
```

**Flujo de excepción:** Si el usuario no cuenta con geolocalización habilitada, el sistema despliega un selector manual de distritos de Lima Metropolitana. Si no se encuentran candidatos compatibles, se almacena la preferencia del usuario y se programa una notificación asíncrona mediante cola de trabajos (BullMQ sobre Redis).

---

### 2.5. Arquitectura C4 de la Solución

A continuación se describen los tres niveles de abstracción arquitectónica bajo el modelo C4 (Contexto, Contenedores y Componentes), conforme a los estándares de documentación de software de Simon Brown.

#### Nivel 1: Diagrama de Contexto (Visión General del Sistema)

El sistema SportMatch Connect se sitúa como el nodo central que integra cuatro actores externos y tres sistemas satélite:

| Actor / Sistema | Rol | Interacción |
|---|---|---|
| **Deportista Amateur (B2C)** | Usuario final que busca realizar actividad física recreativa | Interactúa con el frontend PWA desde su dispositivo móvil o escritorio. |
| **Administrador de Complejo (B2B)** | Dueño o encargado de recinto deportivo | Gestiona la disponibilidad de canchas, precios y promociones desde el panel B2B. |
| **Google Cloud Platform** | Proveedor de servicios de IA | Vertex AI procesa el lenguaje natural del asistente Sporty. |
| **Stripe** | Pasarela de pagos global | Procesa recargas de FitCoins, split billing y reembolsos mediante Webhooks. |
| **Supabase (PostgreSQL + PostGIS)** | Base de datos como servicio | Almacena persistencia principal con RLS, índices espaciales GiST y autenticación JWT. |
| **Vercel Edge Network** | CDN y hosting del frontend | Sirve la PWA estática desde 140+ nodos globales con caché de borde. |
| **Render** | PaaS del backend | Ejecuta el monolito modular NestJS 11 con escalado automático. |

#### Nivel 2: Diagrama de Contenedores (Descomposición por Runtime)

| Contenedor | Tecnología | Responsabilidad |
|---|---|---|
| **Cliente Web (PWA)** | React 19 + TypeScript + Vite | Interfaz de usuario responsiva, lógica de swipe, mapa Leaflet, moderación en el borde NSFWJS. |
| **API Backend (Servidor Web)** | NestJS 11 (Express) | Procesamiento de peticiones REST, WebSockets para chat en tiempo real, lógica de negocio en capas. |
| **Base de Datos** | Supabase PostgreSQL 15 + PostGIS | Almacenamiento transaccional, índices espaciales, RLS a nivel de fila. |
| **Servicio de IA** | Vertex AI Gemini 2.5 Flash | Procesamiento de prompts conversacionales, STT/TTS para Sporty. |
| **Cola de Trabajos** | Redis + BullMQ | Procesamiento asíncrono de notificaciones push y tareas batch de recálculo Elo. |

#### Nivel 3: Diagrama de Componentes (Backend NestJS)

El backend monolito modular se descompone en los siguientes módulos NestJS:

```
server/src/
├── matches/           → matches.module.ts, matches.service.ts, matches.controller.ts
│   └── dto/           → create-match.dto.ts, swipe-action.dto.ts
├── venues/            → venues.module.ts, venues.service.ts, venues.controller.ts
│   └── dto/           → create-venue.dto.ts, search-venue.dto.ts
├── bookings/          → bookings.module.ts, bookings.service.ts, bookings.controller.ts
│   └── dto/           → create-booking.dto.ts, split-billing.dto.ts
├── wallets/           → wallets.module.ts, wallets.service.ts, wallets.controller.ts
│   └── dto/           → top-up.dto.ts, transfer.dto.ts
├── ai/                → ai.module.ts, ai-core.module.ts, ai.service.ts, vertex-ai.service.ts
│   └── interfaces/    → ai-response.interface.ts, voice-payload.interface.ts
├── chat/              → chat.module.ts, chat.gateway.ts, chat.service.ts
├── auth/              → auth.module.ts, auth.service.ts, jwt.strategy.ts
├── common/            → guards/, interceptors/, filters/, pipes/
│   └── guards/        → jwt-auth.guard.ts, roles.guard.ts
└── prisma/            → prisma.module.ts, prisma.service.ts
```

---

### 2.6. Stack Tecnológico Completo

| Capa | Tecnología | Versión | Propósito Específico en SportMatch Connect |
|---|---|---|---|
| **Runtime Cliente** | Node.js | 22.x | Entorno de ejecución para herramientas de build del frontend. |
| **Runtime Servidor** | Node.js | 22.x | Entorno de ejecución del backend NestJS en Render. |
| **Lenguaje** | TypeScript | 5.7 | Tipado estático en frontend y backend garantizando integridad de datos. |
| **Framework Frontend** | React | 19.0 | Biblioteca de componentes UI con Concurrent Features y Server Components. |
| **Build Tool** | Vite | 6.x | Bundler ultrarrápido con HMR, optimización de assets y code splitting. |
| **Arquitectura Frontend** | FSD (Feature-Sliced Design) | — | Organización en 6 capas jerárquicas con importación unidireccional estricta. |
| **Mapas** | Leaflet + React-Leaflet | 1.9 + 5.0 | Visualización de mapas interactivos con tiles de OpenStreetMap. |
| **Estado Global** | Zustand | 5.x | Stores ligeros para swipe, wallet y preferencias de usuario. |
| **Framework Backend** | NestJS | 11.1 | Monolito modular con DI, guards, interceptors y WebSocket Gateway. |
| **ORM** | Prisma | 6.x | Mapeo objeto-relacional con dual-routing (DATABASE_URL + DIRECT_URL). |
| **Base de Datos** | PostgreSQL | 15.x | Motor de base de datos relacional con soporte de extensiones. |
| **Extension Espacial** | PostGIS | 3.5 | Índices GiST, consultas ST_DWithin, cálculo de distancias geográficas. |
| **Base de Datos como Servicio** | Supabase | — | Hosting PostgreSQL, autenticación JWT, RLS y API REST auto-generada. |
| **Autenticación** | Supabase Auth | — | Inicio de sesión con Google, magic links, control de sesiones. |
| **IA Conversacional** | Google Vertex AI (Gemini 2.5 Flash) | — | Procesamiento de lenguaje natural, STT y TTS para el asistente Sporty. |
| **IA en el Cliente** | TensorFlow.js + NSFWJS | — | Clasificación local de imágenes ofensivas (< 80ms) en el navegador. |
| **Pasarela de Pagos** | Stripe | 2026-01 | Procesamiento de tarjetas, Webhooks, split billing y reembolsos. |
| **Tiempo Real** | WebSockets (Socket.io) | 4.x | Chat en vivo entre usuarios con match y notificaciones push. |
| **Cola de Trabajos** | BullMQ + Redis | 5.x | Procesamiento asíncrono de tareas batch (recalcular Elo, notificaciones). |
| **CDN** | Vercel Edge Network | — | Servicio del frontend PWA desde 140+ nodos globales. |
| **PaaS Backend** | Render | — | Despliegue y escalado automático del monolito NestJS. |
| **Pruebas Unitarias** | Vitest + Jest | 3.x | Pruebas de componentes React y servicios NestJS con mocking. |
| **Pruebas E2E** | Playwright | 1.52 | Automatización de flujos completos de usuario y pasarela Stripe. |
| **Calidad de Código** | SonarQube Cloud | — | Análisis estático, detección de vulnerabilidades y calidad de código. |
| **CI/CD** | GitHub Actions | — | Pipeline automatizado de lint → test → build → deploy. |

---

### 2.7. Estructura de Navegación del Cliente (Route Map)

La aplicación PWA expone las siguientes rutas organizadas por funcionalidad:

| Ruta | Componente | Visibilidad | Descripción |
|---|---|---|---|
| `/welcome` | WelcomePage | Pública | Pantalla de bienvenida con opciones de inicio de sesión. |
| `/onboarding/sports-profile` | SportsProfileForm | Usuario nuevo | Registro de ficha deportiva (deportes, nivel, disponibilidad). |
| `/feed` | MatchFeedPage | Autenticada | Feed principal con tarjetas de matchmaking (MatchCard). |
| `/map` | MapPage | Autenticada | Mapa Leaflet con pines de complejos deportivos en radio 5 km. |
| `/venues/:id` | VenueDetailPage | Autenticada | Detalle del complejo con precios, horarios y galería de fotos. |
| `/bookings` | BookingsPage | Autenticada | Lista de reservas activas, próximas e histórico. |
| `/booking/:id` | BookingDetailPage | Autenticada | Detalle de la reserva con opciones de split billing. |
| `/chat/:matchId` | ChatPage | Autenticada | Chat en tiempo real WebSocket con el match confirmado. |
| `/wallet` | WalletPage | Autenticada | Monedero FitCoins: saldo, recarga Stripe, historial de transacciones. |
| `/sporty` | SportyAIPage | Autenticada | Asistente conversacional Sporty con entrada de voz/texto. |
| `/squads` | SquadsPage | Autenticada | Creación y gestión de equipos (squads) con invitación de jugadores. |
| `/b2b/dashboard` | B2BDashboard | B2B (Admin) | Panel de administración de complejos deportivos, estadísticas de ocupación. |
| `/b2b/venues/manage` | VenueManagerPage | B2B (Admin) | Gestión CRUD de canchas, precios y horarios. |
| `/profile/:id` | ProfilePage | Autenticada | Perfil público del jugador con Elo, histórico y deportes. |
| `/settings` | SettingsPage | Autenticada | Ajustes de cuenta, notificaciones, tema oscuro/claro e idioma. |

---

## 📖 CAPÍTULO III: MANUAL DE USUARIO TÉCNICO Y OPERATIVO

Este manual detalla paso a paso el funcionamiento operativo de SportMatch Connect para guiar a los evaluadores de INDECOPI en la validación funcional de la plataforma.

### 3.1. Flujo 1: Registro de Cuenta y Onboarding Deportivo
1.  El usuario accede a la pantalla de bienvenida en Sleek Dark Mode.
2.  Presiona el botón de **Iniciar Sesión con Google** o ingresa correo y contraseña.
3.  El sistema detecta si es un usuario nuevo y le solicita completar su **Ficha Deportiva**:
    *   Deportes favoritos (Fútbol, Pádel, Tenis, Baloncesto).
    *   Autoevaluación de nivel (Principiante, Intermedio, Avanzado).
    *   Días y horas disponibles para jugar.
4.  Al dar clic en guardar, el cliente PWA solicita permiso de geolocalización al sistema operativo y envía las coordenadas de latitud/longitud al backend NestJS mediante HTTPS.

### 3.2. Flujo 2: Deslizamiento y Matchmaking Predictivo
1.  El usuario ingresa a la sección **Encontrar Partidos**.
2.  El backend calcula los perfiles compatibles y devuelve una cola de candidatos.
3.  El usuario ve una tarjeta interactiva (**MatchCard**) con la información del oponente, distancia, deporte común, Elo estimado y porcentaje de compatibilidad.
4.  Si el usuario desliza a la **derecha (Swipe Right)**, emite una solicitud de "Match" persistente. Si ambos jugadores coinciden en el swipe, el sistema inicia un chat interactivo WebSockets en tiempo real.

### 3.3. Flujo 3: Reserva Geolocalizada y Pago Stripe
1.  El usuario accede a la pestaña **Mapa de Canchas**.
2.  Leaflet renderiza un mapa centrado en la geolocalización del dispositivo, mostrando pines de los complejos en un radio de 5 km gracias al indexamiento de PostGIS.
3.  Al hacer clic en un pin, se despliega una ficha con precios por hora, fotos y horarios disponibles.
4.  El usuario elige un horario y presiona **Reservar**. El sistema genera un popup para elegir el cobro individual o compartido (Split Bill).
5.  Al confirmar, la pasarela Stripe procesa la tarjeta de débito/crédito. El backend recibe la confirmación mediante Webhook y actualiza la reserva en Supabase a estado `"confirmed"`.

### 3.4. Flujo 4: Interacción con Sporty (Asistente IA por Voz y Texto)

Sporty es el asistente conversacional multimodal de SportMatch Connect basado en Google Vertex AI Gemini 2.5 Flash. Soporta entrada por texto y por voz con procesamiento nativo:

1.  El usuario accede a la sección **Sporty** desde el menú inferior o desde la tarjeta flotante en la pantalla de inicio.
2.  Si el usuario presiona el **ícono de micrófono**, el componente `VoiceRecorder.tsx` activa la API `MediaRecorder` del navegador para capturar audio en formato WAV.
3.  El frontend transmite el flujo de audio al backend mediante WebSocket (Socket.io) en fragmentos de 512 bytes.
4.  El backend recibe los fragmentos, reconstruye el archivo WAV completo y lo envía al pipeline de Vertex AI para Speech-to-Text.
5.  El texto transcrito se inyecta en un prompt estructurado de sistema con restricciones de contexto deportivo (no responder preguntas no relacionadas con deportes, FitCoins o la plataforma).
6.  Gemini 2.5 Flash procesa el prompt y genera una respuesta textual. El backend convierte esta respuesta a voz mediante Text-to-Speech nativo de Google Cloud y devuelve el audio codificado en Base64 al frontend.
7.  El frontend reproduce el audio mediante la API `AudioContext` y simultáneamente muestra el texto de la respuesta en una burbuja de chat.
8.  **Moderación en el borde:** Antes de enviar el audio, el cliente ejecuta una verificación local de volumen y duración mínima (> 0.5s) para evitar peticiones vacías. Además, cualquier imagen subida durante la conversación pasa por el clasificador NSFWJS de TensorFlow.js en el dispositivo antes de llegar al servidor.

**Comandos de voz soportados por Sporty:**
- *"Busca partidos de pádel cerca de mí"* → Ejecuta búsqueda geolocalizada con filtro de deporte.
- *"¿Cuántos FitCoins tengo?"* → Consulta el saldo actual del monedero digital.
- *"Crea un squad para fútbol este sábado"* → Inicia el flujo de creación de equipo.
- *"Recomiéndame canchas en Miraflores"* → Lista complejos deportivos en el distrito solicitado.
- *"Traduce al inglés"* → Cambia el idioma de la interfaz de forma temporal.

### 3.5. Flujo 5: Gestión de FitCoins y Recarga de Monedero

FitCoins es la moneda virtual de la plataforma, con paridad 1 FitCoin = S/ 1.00 PEN, utilizada para reservas, split billing y recompensas por participación:

1.  El usuario navega a la sección **Mi Billetera** (`/wallet`).
2.  La interfaz muestra el saldo actual, un gráfico mensual de gastos y el historial de transacciones con filtro por fecha y tipo (recarga, débito, reembolso, bono).
3.  Para recargar, el usuario presiona **Recargar FitCoins** e ingresa un monto (mínimo S/ 10.00, máximo S/ 500.00 por transacción).
4.  El sistema redirige a la pantalla de pago de Stripe Elements, que acepta tarjetas de crédito/débito (Visa, Mastercard, American Express) y Yape (mediante enlace de pago).
5.  Stripe procesa el pago de forma asíncrona. El backend recibe la confirmación mediante Webhook firmado con HMAC-SHA256 y verifica la integridad del payload.
6.  Al confirmarse el pago, el sistema incrementa el saldo del monedero y registra la transacción en la tabla `fitcoin_transactions` con estado `"completed"`.
7.  **Split Billing automático:** Cuando un usuario organiza una reserva compartida, el sistema debita automáticamente el monto proporcional de cada monedero participante antes de confirmar la cancha. Si algún integrante no tiene saldo suficiente, se le notifica y se le da 24 horas para recargar antes de que la reserva se cancele automáticamente.
8.  **Bonos por actividad:** El sistema acredita FitCoins como recompensa por hitos: 5 FitCoins por completar el perfil deportivo, 10 FitCoins por el primer partido jugado, 3 FitCoins por cada reseña de cancha.

### 3.6. Flujo 6: Creación y Gestión de Squads

Los Squads son equipos persistentes que permiten a grupos de jugadores organizar partidos recurrentes sin necesidad de hacer matchmaking individual cada vez:

1.  El usuario accede a **Mis Squads** (`/squads`) y presiona **Crear Squad**.
2.  Completa los datos del equipo: nombre, deporte principal, nivel objetivo (Principiante/Intermedio/Avanzado), escudo (subida de imagen con moderación NSFWJS local), disponibilidad recurrente (días y horarios fijos) y límite de integrantes (mínimo 4, máximo 30).
3.  El sistema genera un **código de invitación único** de 8 caracteres alfanuméricos que el creador comparte con otros jugadores.
4.  Los invitados ingresan el código en la pantalla **Unirse a Squad** y quedan en estado "pendiente" hasta que el líder del squad confirma su ingreso.
5.  Una vez formado el squad, el líder puede programar **partidos automáticos**: el sistema envía notificaciones push a todos los integrantes, calcula la asistencia esperada y, si se alcanza el quórum mínimo (70% de confirmación), procede a reservar la cancha usando el saldo colectivo de FitCoins del squad.
6.  Al finalizar cada partido, los integrantes pueden calificar la asistencia de sus compañeros. Las inasistencias injustificadas afectan el Trust Score individual y pueden resultar en la expulsión automática tras 3 faltas.
7.  El squad acumula un **Elo de equipo** que se muestra en una tabla de posiciones semanal y mensual, fomentando la competencia entre squads.

### 3.7. Flujo 7: Administración de Complejos Deportivos (Panel B2B)

El panel de administración B2B permite a los dueños o encargados de complejos deportivos gestionar su oferta y visualizar métricas de negocio:

1.  El administrador inicia sesión con credenciales B2B y accede al panel (`/b2b/dashboard`).
2.  El dashboard principal muestra un resumen ejecutivo: ingresos del mes, ocupación promedio, número de reservas activas, reseñas recientes y tasa de cancelación.
3.  En la sección **Gestionar Canchas** (`/b2b/venues/manage`), el administrador puede:
    - Agregar nuevas canchas especificando nombre, deporte, precio por hora, capacidad de jugadores y horario de operación.
    - Marcar disponibilidad especial (promociones de fin de semana, bloqueo por mantenimiento).
    - Subir fotos del recinto con moderación automática NSFWJS local en el cliente.
4.  En la sección **Calendario de Reservas**, se visualiza una vista semanal con las reservas confirmadas, pendientes y canceladas. El administrador puede confirmar, reprogramar o cancelar reservas manualmente.
5.  En la sección **Reportes**, se generan gráficos interactivos de: ingresos por periodo, ocupación por cancha, deporte más demandado, horarios pico y top 10 de jugadores recurrentes.
6.  El administrador configura las **comisiones B2B** (por defecto 5% del valor de cada reserva), que se liquidan automáticamente al cierre de cada mes mediante transferencia bancaria programada.

### 3.8. Flujo 8: Reportes y Estadísticas de Rendimiento

La plataforma ofrece dashboards analíticos tanto para el usuario B2C como para el administrador B2B:

**Reportes para el deportista (B2C):**
1.  El usuario accede a **Mi Rendimiento** desde el menú de perfil.
2.  Visualiza un dashboard personal con los siguientes indicadores:
    - **Evolución Elo:** Gráfico de líneas con el histórico de puntuación Elo por partido jugado (últimos 20 encuentros).
    - **Estadísticas por deporte:** Victorias, derrotas, empates, racha actual y mejor racha para cada deporte.
    - **Asistencia:** Porcentaje de asistencia a partidos confirmados, con penalización por inasistencias.
    - **FitCoins ganados/gastados:** Desglose mensual de ingresos y egresos de monedero.
    - **Mapa de calor:** Zonas de Lima Metropolitana donde el usuario juega con mayor frecuencia.

**Reportes para el administrador (B2B):**
1.  El administrador accede a la sección **Estadísticas Avanzadas** del panel B2B.
2.  Los reportes incluyen:
    - **Ocupación por franja horaria:** Heatmap semanal que muestra las horas de mayor demanda.
    - **Ingresos proyectados:** Modelo de predicción de ingresos basado en tendencias históricas y estacionalidad.
    - **Retención de jugadores B2B:** Tasa de jugadores que repiten reserva en el complejo en un periodo de 30, 60 y 90 días.
    - **Competencia local:** Comparativa anonimizada con la ocupación promedio de complejos similares en el mismo distrito.
3.  Todos los reportes pueden exportarse en formato PDF o CSV para su presentación externa.

### 3.9. Solución de Problemas Comunes (Troubleshooting)

| Problema | Causa Probable | Solución |
|---|---|---|
| **No aparecen candidatos en el feed** | Geolocalización desactivada o radio de búsqueda demasiado pequeño | Activar GPS en el dispositivo o expandir el radio de búsqueda en los filtros (> 5 km). |
| **Error al procesar pago con tarjeta** | Fondos insuficientes, tarjeta bloqueada o límite diario excedido | Verificar saldo disponible con el banco o intentar con otra tarjeta. Stripe rechaza automáticamente montos > S/ 500.00. |
| **El micrófono de Sporty no funciona** | Permiso de micrófono denegado en el navegador | Verificar que el navegador tenga permiso de micrófono (icono de candado en la barra de direcciones). Sporty requiere HTTPS obligatoriamente. |
| **No llegan las notificaciones push** | Notificaciones desactivadas en el sistema operativo o navegador | Activar notificaciones desde los ajustes del sistema operativo o del navegador para la PWA. |
| **El mapa Leaflet no carga** | Bloqueo de OpenStreetMap por firewall corporativo o extensión de bloqueo de rastreadores | Desactivar bloqueadores de contenido (uBlock, Privacy Badger) para el dominio de la aplicación. |
| **Error de sesión expirada** | Token JWT vencido (duración máxima 1 hora por defecto) | Cerrar sesión y volver a iniciar. El cliente Supabase renueva el token automáticamente si la sesión está activa. |
| **La recarga de FitCoins no se refleja** | Webhook de Stripe demorado por latencia de red (hasta 30 segundos) | Esperar 30 segundos y refrescar la página. Si persiste, contactar a soporte con el ID de la transacción Stripe. |

---

## ⚙️ CAPÍTULO IV: REQUISITOS TÉCNICOS DEL SISTEMA

### 4.1. Requisitos de Hardware del Servidor (Render)

| Componente | Especificación Mínima | Especificación Recomendada |
|---|---|---|
| **CPU** | 2 vCPU (Intel Xeon o AMD EPYC) | 4 vCPU |
| **RAM** | 4 GB | 8 GB |
| **Almacenamiento** | 20 GB SSD | 50 GB SSD |
| **Ancho de Banda** | 1 Gbps | 2 Gbps |
| **Sistema Operativo** | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS |
| **Runtime** | Node.js 22.x | Node.js 22.x |

### 4.2. Requisitos de Software del Servidor

| Software | Versión | Propósito |
|---|---|---|
| Node.js | 22.x LTS | Entorno de ejecución del backend NestJS. |
| npm | 11.x | Gestor de paquetes. |
| PostgreSQL | 15.x (Supabase administrado) | Base de datos principal con PostGIS. |
| Redis | 7.x (Render administrado) | Cola de trabajos BullMQ y caché de sesiones. |
| PM2 | 5.x (o cluster nativo de Render) | Gestor de procesos en producción. |

### 4.3. Requisitos del Cliente (Navegador)

| Navegador | Versión Mínima | Características Requeridas |
|---|---|---|
| Google Chrome | 120+ | Service Worker, MediaRecorder API, WebSocket, IndexedDB |
| Mozilla Firefox | 120+ | Service Worker, MediaRecorder API, WebSocket |
| Microsoft Edge | 120+ | Service Worker, MediaRecorder API, WebSocket |
| Safari (iOS) | 17+ | Service Worker (PWA iOS), MediaRecorder API limitada |
| Samsung Internet | 23+ | Service Worker, MediaRecorder API |

**Requisitos de conectividad:** Conexión a internet estable (> 1 Mbps). La PWA requiere HTTPS para todas las funcionalidades (Service Worker, geolocalización, micrófono, notificaciones push). El modo offline parcial está soportado para visualización del feed cacheados en IndexedDB.

---

## 🔄 CAPÍTULO V: MANTENIMIENTO Y ACTUALIZACIONES

### 5.1. Estrategia de Despliegue (CI/CD)

El proyecto utiliza GitHub Actions como orquestador de despliegue continuo con el siguiente pipeline:

```
[Código Push] → [GitHub Actions] → [Lint + TypeCheck] → [Tests Unitarios] → [Build]
    ↓
[Render Deploy] ← [Aprobación automática si rama main] ← [Tests E2E Playwright]
    ↓
[Vercel Deploy] ← [Frontend build exitoso] ← [SonarQube Quality Gate]
```

**Políticas de ramas:**
- `main`: Despliegue automático a producción después de pasar Quality Gate de SonarQube.
- `develop`: Despliegue automático a entorno staging (previsualización de Vercel + Render preview).
- `feature/*`: Sin despliegue automático; solo build local y tests.

### 5.2. Ventanas de Mantenimiento

| Tipo de Mantenimiento | Frecuencia | Duración Estimada | Ventana | Notificación |
|---|---|---|---|---|
| **Parches de seguridad (dependencias)** | Semanal | 15-30 min | Domingo 02:00-04:00 AM (GMT-5) | 48 horas antes por correo |
| **Actualización de esquema BD (migraciones)** | Mensual | 30-60 min | Domingo 02:00-06:00 AM (GMT-5) | 7 días antes por correo y notificación in-app |
| **Release de nuevas funcionalidades** | Quincenal (cada sprint) | Sin downtime (rolling update) | Sin restricción horaria | Changelog publicado en `/releases` |
| **Parches críticos (hotfix)** | Cuando sea necesario | Variable | Inmediata | Notificación en tiempo real por el canal de Slack |

### 5.3. Procedimiento de Rollback

1. **Frontend (Vercel):** Vercel mantiene las últimas 10 versiones de despliegue. El rollback se ejecuta desde el dashboard de Vercel seleccionando una versión anterior. Tiempo estimado: 2 minutos.
2. **Backend (Render):** Render mantiene los últimos 5 builds exitosos. El rollback se ejecuta mediante `scripts/infra/render-deploy.ps1` especificando el commit SHA anterior. Tiempo estimado: 5 minutos.
3. **Base de Datos:** Toda migración de esquema incluye un script de reversión (`prisma migrate down`). Para datos críticos, se realiza un snapshot automático diario de Supabase con retención de 7 días.

### 5.4. Monitoreo y Alertas

| Servicio | Herramienta | Métricas Monitoreadas | Umbral de Alerta |
|---|---|---|---|
| Rendimiento Backend | Render Metrics + Sentry | TTFB > 500ms, CPU > 80%, RAM > 85% | Alerta por Slack y correo |
| Errores de Aplicación | Sentry (Performance + Errors) | Error rate > 1%, Apdex < 0.7 | Notificación a #alerts en Slack |
| Disponibilidad | Uptime Robot (cada 5 min) | Respuesta HTTP < 200ms | SMS + correo si 2 chequeos consecutivos fallan |
| Base de Datos | Supabase Advisors + pg_stat_statements | Conexiones activas > 80%, consultas lentas > 200ms | Alerta en dashboard de Supabase |
| Frontend | Vercel Analytics + Web Vitals | LCP > 2.5s, CLS > 0.1, INP > 200ms | Reporte semanal por correo
