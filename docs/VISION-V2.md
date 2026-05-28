# 🚀 SportMatch V2: Arquitectura de Transformación a Red Social Deportiva
**Documento de Visión de Ingeniería y Roadmap de Escalabilidad**  
*Autor: Principal Architect*

---

## 1. Análisis de Deficiencias y Cuellos de Botella (Gap Analysis)

El MVP de SportMatch Connect actual opera bajo un modelo transaccional y local-first (offline-first con mocks). Para escalar a millones de usuarios concurrentes y maximizar el *engagement* diario (retención LTV/CAC), debemos analizar de manera crítica las limitaciones del modelo actual frente a los estándares de la industria (Tinder, Instagram, Facebook).

```
+---------------------------------------------------------------------------------+
|                                 GAP ANALYSIS                                    |
+----------------------------------------------------+----------------------------+
| Componente MVP actual                              | Arquitectura V2            |
+----------------------------------------------------+----------------------------+
| Carga en memoria / Filtrado JS local               | Recomendación IA Vertex /  |
|                                                    | Sistema Elo en Postgres    |
+----------------------------------------------------+----------------------------+
| Sin relaciones sociales (Cuentas aisladas)         | Grafo Social Relacional    |
|                                                    | (Feed, Followers, Squads)  |
+----------------------------------------------------+----------------------------+
| Leaflet client-side / Coordenadas hardcoded        | Consultas espaciales con   |
|                                                    | PostGIS en Supabase        |
+----------------------------------------------------+----------------------------+
```

### A. Motor de Recomendación (vs. Tinder)
#### Deficiencias del MVP:
* **Falta de escalabilidad algorítmica ($O(N)$ client-side):** El archivo `src/features/matchmaking/useMatchmaking.ts` descarga el stack de usuarios mediante una consulta plana a la base de datos (`apiClient.users.getMatches()`) y realiza filtrado local en JS. Con $10^5$ usuarios concurrentes, esto causaría un colapso en el navegador del cliente y un consumo insostenible de ancho de banda.
* **Emparejamiento estático:** Solo se consideran filtros binarios rudimentarios (misma ciudad, deportes compartidos). No existe un historial de rechazos o atracciones mutuas persistentes, provocando que un usuario vuelva a ver a personas descartadas en la siguiente recarga.
* **Ausencia de Balance Competitivo:** Al emparejar no se mide la diferencia real de habilidad de juego, lo que produce partidos frustrantes por disparidad de nivel técnico.

#### Arquitectura de Escalabilidad V2:
1. **Sistema de Elo Rating Multideporte:**  
   Implementación del algoritmo Glicko-2 o Elo dinámico a nivel de base de datos. Cada partido reportado modifica el score de habilidad del jugador ($R_i$) y su desviación de volatilidad ($RD_i$). El algoritmo pondera el resultado en función del Elo esperado de los oponentes.
2. **Pipeline de Recomendación Híbrido (Vertex AI + Postgres Vector):**
   * **Filtro Colaborativo (Embeddings de Preferencia):** Generación de representaciones vectoriales (embeddings de 1536 dimensiones) de los usuarios utilizando los modelos de Vertex AI. El vector codifica el nivel de actividad, comportamiento de swipe, deportes preferidos y horarios comunes.
   * **Búsqueda Vectorial (`pgvector`):** Consultas SQL aceleradas por índices HNSW para encontrar los $K$ vectores más cercanos (mayor similitud de coseno) directamente en Supabase, filtrando concurrentemente a los oponentes ya deslizados (*likes* y *passes* registrados en una tabla de exclusión).

---

### B. Retención Social (vs. Instagram/Facebook)
#### Deficiencias del MVP:
* **Islas de datos sin vinculación afectiva:** La aplicación carece de interacciones recurrentes fuera del flujo de reserva de canchas y chat directo. No hay espacio para presumir logros, subir fotos post-partido o interactuar pasivamente (comentarios, me gusta), disminuyendo drásticamente las sesiones diarias del usuario (DAU/MAU).
* **Ausencia de Grafo Social:** La base de datos no modela la red de relaciones (quién es amigo de quién, quién sigue a qué club, qué equipos/squads están formados). Esto imposibilita la creación de un sistema de recomendación orgánica de partidos compartidos por "amigos de amigos".

#### Arquitectura de Escalabilidad V2:
1. **Grafo de Relaciones Unidireccionales/Bidireccionales:**  
   Estructuración de tablas con indexación compuesta para followers y squads, permitiendo consultas recursivas rápidas (CTE recursivas en PostgreSQL) para determinar grados de separación.
2. **Generación del Feed Híbrido (Fan-out on Write + Read):**
   * Para usuarios con bajo número de seguidores, las publicaciones se inyectan en sus feeds precalculados en caché (Redis).
   * Para creadores de contenido masivos o clubes, el feed se computa dinámicamente al cargar la vista (*Fan-out on Read*) para evitar cuellos de botella de escritura y almacenamiento.

---

### C. Geolocalización en Tiempo Real (PostGIS vs. Leaflet Client-Side)
#### Deficiencias del MVP:
* **Fuga de Privacidad y Procesamiento:** La latitud y longitud de los usuarios y canchas son tratadas como floats genéricos y enviadas al cliente. Esto permite calcular distancias lineales aproximadas, pero expone coordenadas crudas (vulnerabilidad de privacidad) y fuerza al procesador del cliente a computar fórmulas de Haversine de manera redundante.
* **Falta de Indexación Espacial:** Es imposible buscar usuarios que estén físicamente a menos de 5 km de una cancha sin realizar un barrido total de la tabla en base de datos.

#### Arquitectura de Escalabilidad V2:
1. **Activación de PostGIS en Supabase:**  
   Uso del tipo de datos nativo `GEOGRAPHY(Point, 4326)` para representar coordenadas geográficas en el elipsoide WGS84.
2. **Índices Espaciales R-Tree (GIST):**  
   Implementación de índices `USING GIST(geom)` para segmentar el espacio geográfico en cajas delimitadoras jerárquicas. Las búsquedas de cercanía se realizan en tiempo logarítmico $O(\log N)$ en lugar de lineal $O(N)$.
3. **Ofuscación Geográfica:**  
   Las coordenadas exactas del jugador se alteran en el servidor añadiendo un ruido gaussiano sutil (±50m) y se devuelven al cliente únicamente las canchas y el radio aproximado del usuario, protegiendo su ubicación residencial.

---

## 2. Arquitectura del Nuevo Ecosistema (V2 Blueprint)

```
                          ┌────────────────────────┐
                          │    Supabase PostGIS    │
                          │   (Base de Datos SQL)   │
                          └───────────┬────────────┘
                                      │
                         [Supabase Realtime/WS]
                                      │
                                      ▼
┌──────────────────┐      ┌────────────────────────┐      ┌──────────────────┐
│  Redis Cache     │◄────►│  Vite Client (React)   │◄────►│ Cloudflare CDN  │
│  (Feeds & Keys)  │      │  (Framer Motion UI)    │      │  (Media/Images)  │
└──────────────────┘      └────────────────────────┘      └──────────────────┘
```

### A. Modelo de Datos Relacional (DDL SQL)
A continuación se detalla el esquema físico de base de datos optimizado para la fase social.

```sql
-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabla de Relaciones (Social Graph)
CREATE TABLE public.followers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    followed_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_follow UNIQUE (follower_id, followed_id),
    CONSTRAINT no_self_follow CHECK (follower_id <> followed_id)
);

CREATE INDEX idx_followers_follower ON public.followers(follower_id);
CREATE INDEX idx_followers_followed ON public.followers(followed_id);

-- 2. Tabla de Publicaciones (News Feed Posts)
CREATE TABLE public.posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    match_id UUID REFERENCES public.matches(id) ON DELETE SET NULL, -- Opcional link a partido jugado
    caption TEXT,
    location GEOGRAPHY(Point, 4326), -- Ubicación de la publicación
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_posts_creator ON public.posts(creator_id);
CREATE INDEX idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX idx_posts_location ON public.posts USING GIST(location);

-- 3. Tabla de Multimedia de Publicaciones
CREATE TABLE public.post_media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    media_url TEXT NOT NULL,
    media_type VARCHAR(50) NOT NULL, -- 'image/jpeg', 'video/mp4'
    byte_size INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_media_post ON public.post_media(post_id);

-- 4. Tabla de Comentarios
CREATE TABLE public.comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT empty_comment CHECK (char_length(trim(content)) > 0)
);

CREATE INDEX idx_comments_post ON public.comments(post_id);

-- 5. Tabla de Reacciones (Likes/Interacciones)
CREATE TABLE public.likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_post_like UNIQUE (post_id, user_id)
);

CREATE INDEX idx_likes_post ON public.likes(post_id);

-- 6. Tabla de Equipos y Clubs (Squads)
CREATE TABLE public.squads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    bio TEXT,
    logo_url TEXT,
    creator_id UUID NOT NULL REFERENCES public.users(id),
    geom_home GEOGRAPHY(Point, 4326), -- Sede principal del equipo
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_squads_geom ON public.squads USING GIST(geom_home);

-- 7. Tabla de Miembros del Squad
CREATE TABLE public.squad_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    squad_id UUID NOT NULL REFERENCES public.squads(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'player', -- 'captain', 'manager', 'player'
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_squad_member UNIQUE (squad_id, user_id)
);

CREATE INDEX idx_squad_members_squad ON public.squad_members(squad_id);
```

### B. Ejemplo de Consulta de Cercanía Espacial (PostGIS)
Consulta optimizada para encontrar canchas a menos de 5 km de una coordenada de Surco:

```sql
SELECT id, name, price_per_hour,
       ST_Distance(location, ST_MakePoint(-76.9950, -12.1400)::geography) / 1000 AS distance_km
FROM public.courts
WHERE ST_DWithin(location, ST_MakePoint(-76.9950, -12.1400)::geography, 5000)
ORDER BY distance_km ASC;
```

---

### C. Stack Tecnológico de Tiempo Real y Caché
Para soportar la alta concurrencia de eventos dinámicos y la carga inmediata del feed, se introduce la siguiente infraestructura intermedia:

1. **WebSockets (Supabase Realtime + Socket.io):**  
   * **Phoenix Channels:** Utilizados por Supabase Realtime para notificar cambios en la base de datos de manera inmediata a la UI (ej. cuando se crea un post o se envía un mensaje).
   * **Eventos de Matchmaking Live:** Conexión vía WebSockets nativos para la cola de matchmaking, informando a ambos usuarios cuando se consolida una concordancia mutua.
2. **Capa de Caché de Feed en Redis:**  
   * El feed de cada usuario activo se almacena en Redis bajo una estructura de **Sorted Set (ZSET)**.
   * La clave de Redis tiene la estructura `user:feed:{userId}`.
   * El *score* del Sorted Set corresponde al timestamp de la publicación (`created_at`). Esto permite un paginado extremadamente rápido ($O(\log(N) + M)$) mediante comandos `ZREVRANGEBYSCORE`.
   * **Tolerancia a Fallos:** Si la clave en Redis expira o no se encuentra (*Cache Miss*), el servidor ejecuta la consulta SQL en PostgreSQL y reconstruye la caché de Redis de inmediato.
3. **Distribución de Contenido y Optimización de Carga (CDN):**  
   * **Cloudflare CDN / Cloudinary:** Todo el contenido estático y multimedia cargado por los usuarios (fotos de partidos, logos de squads) se almacena en buckets de Supabase Storage y se sirve a través de la red perimetral de Cloudflare.
   * **Optimización en el Edge:** Compresión webp automática y ajuste de resoluciones bajo demanda en la CDN para reducir el consumo de datos celulares en móviles.

---

## 3. El Roadmap de Implementación (Sprints)

Este proyecto de evolución se divide en 4 sprints de dos semanas, ideales para nuestro equipo de 4 desarrolladores. Cada rol (Dev 1 a Dev 4) asumirá responsabilidades específicas para garantizar entregas en paralelo sin bloqueos.

```
       ROADMAP DE IMPLEMENTACIÓN V2
       
       Sprint 1: Social Graph & Followers
       ├── Dev 1: Migración PostGIS
       ├── Dev 2: Tabla Followers & APIs
       ├── Dev 3: Configuración Redis
       └── Dev 4: UI/UX Seguidores
       
       Sprint 2: The Social Feed
       ├── Dev 1: Fan-out en Redis/Postgres
       ├── Dev 2: API de Post/Comments
       ├── Dev 3: Componente SocialFeed UI
       └── Dev 4: Animaciones de Transición
       
       Sprint 3: Matchmaking con IA Real
       ├── Dev 1: Motor Elo Rating DB
       ├── Dev 2: Vertex AI Pipelines
       ├── Dev 3: WebSocket Matchmaking
       └── Dev 4: UI Swipe Interactivo
       
       Sprint 4: Media Uploads & Squads
       ├── Dev 1: CDN & Storage Buckets
       ├── Dev 2: API Creación Squads
       ├── Dev 3: UI Upload & Squads
       └── Dev 4: Integración final & QA
```

### Sprint 1: Social Graph y Seguidores (Geolocalización & Relaciones)
* **Objetivo:** Migrar coordenadas a PostGIS y habilitar la funcionalidad de seguir/dejar de seguir usuarios con indexación óptima.
* **Distribución de Tareas:**
  * **Dev 1 (Backend/Database):** Escribir los scripts de migración DDL para habilitar la extensión PostGIS y convertir los datos de latitud/longitud a la columna de tipo `geography` en canchas y usuarios. Configurar los índices `GIST`.
  * **Dev 2 (Backend/API):** Diseñar las APIs REST de followers en Supabase (tabla `followers`, triggers de seguridad RLS) para habilitar seguir/dejar de seguir.
  * **Dev 3 (DevOps/Cache):** Levantar la instancia de Redis local y configurar los adaptadores de conexión de red para la posterior caché del feed.
  * **Dev 4 (Frontend/UI):** Integrar los botones de "Seguir" en las vistas de perfil y adaptar el mapa de Leaflet para consultar las canchas mediante filtros de distancia geoespacial reales de PostGIS en lugar de aproximaciones locales en JS.

---

### Sprint 2: The Social Feed (Creación e Interacción de Publicaciones)
* **Objetivo:** Permitir a los usuarios publicar estados vinculados a partidos jugados, dar "likes" y comentar, sirviendo el contenido de forma ultra-rápida.
* **Distribución de Tareas:**
  * **Dev 1 (Database/Cache):** Programar las funciones de persistencia y el worker de sincronización (*fan-out*) que inyecta los IDs de posts creados en los ZSETs de Redis de los seguidores.
  * **Dev 2 (Backend/API):** Construir los endpoints REST para `posts`, `comments` y `likes`. Asegurar que un post pueda opcionalmente vincularse a un `match_id` para validar la veracidad del encuentro deportivo.
  * **Dev 3 (Frontend/UI):** Desarrollar la pantalla del Feed Principal (`/app/feed`) cargando los componentes de posts y el feed de manera infinita (infinite scroll con TanStack Query).
  * **Dev 4 (Frontend/Animations):** Diseñar y pulir micro-animaciones dinámicas con Framer Motion (efecto rebote en el botón de like, despliegue físico suave para la caja de comentarios).

---

### Sprint 3: Matchmaking con IA Real (Algoritmo Competitivo & WebSockets)
* **Objetivo:** Activar el cálculo dinámico de Elo Rating y migrar la cola de matchmaking a WebSockets reales con emparejamiento predictivo.
* **Distribución de Tareas:**
  * **Dev 1 (Database/Algoritmo):** Diseñar la función en base de datos PostgreSQL que se dispara tras finalizar un partido para actualizar el Elo de los participantes basándose en la diferencia de goles/puntos del marcador.
  * **Dev 2 (ML/Vertex AI):** Crear el pipeline en Python de Vertex AI que genera vectorizaciones semanales de comportamiento y guardarlas en tablas Postgres mediante la extensión `pgvector` para búsquedas de afinidad.
  * **Dev 3 (Backend/Realtime):** Implementar la cola de matchmaking activa en memoria (Redis) que gestiona los sockets abiertos y los empareja en caliente cruzando la cercanía geográfica (PostGIS) y cercanía de habilidad (Elo).
  * **Dev 4 (Frontend/UI):** Rediseñar la vista de Matchmaking para mostrar la compatibilidad algorítmica en porcentaje (Similitud de Coseno vectorial) y añadir alertas de "Match" instantáneo por WebSockets.

---

### Sprint 4: Media Uploads y Squads (Multimedia y Estructuras de Equipo)
* **Objetivo:** Permitir la subida de imágenes optimizadas a buckets multimedia de almacenamiento y habilitar la creación de squads para incentivar la retención grupal.
* **Distribución de Tareas:**
  * **Dev 1 (Infra/CDN):** Configurar las políticas de CORS y acceso en Supabase Storage. Integrar la pasarela de Cloudflare CDN para servir las imágenes comprimidas en caché perimetral.
  * **Dev 2 (Backend/API):** Crear la lógica de negocio y las tablas de base de datos para la creación de `squads` (equipos locales), la asignación de capitanía y las invitaciones a miembros.
  * **Dev 3 (Frontend/UI):** Implementar el widget de subida de fotos (con previsualizador y compresión del lado del cliente) e integrarlo en el creador de publicaciones.
  * **Dev 4 (QA/Integridad):** Programar tests unitarios y de integración para validar el flujo social completo, supervisar que no queden dependencias pesadas en el bundle y certificar el rendimiento de carga perimetral.
