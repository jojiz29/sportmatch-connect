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
|---|---|---|---|
| 1 | `server/prisma/schema.prisma` | Prisma | Definición de las entidades, tipos de datos, llaves foráneas y mapeo relacional. |
| 2 | `server/src/matches/matches.service.ts` | TypeScript | Implementación del algoritmo de matchmaking predictivo y actualización Elo. |
| 3 | `server/src/matches/matches.controller.ts` | TypeScript | Expone los endpoints REST para emparejamientos y peticiones del cliente. |
| 4 | `server/src/wallets/wallets.service.ts` | TypeScript | Lógica del monedero digital FitCoins, control de transacciones y webhook Stripe. |
| 5 | `server/src/ai/ai.service.ts` | TypeScript | Integración con Google Vertex AI para el procesamiento conversacional de Sporty. |
| 6 | `src/features/matchmaking/model/swipe-store.ts`| TypeScript | Almacenamiento local del estado de deslizamiento de perfiles (Zustand). |
| 7 | `src/features/matchmaking/ui/MatchCard.tsx` | TSX | Componente visual interactivo para swipeteo de jugadores con animaciones. |
| 8 | `src/shared/ui/MapLeaflet.tsx` | TSX | Mapa interactivo integrado con Leaflet y caché de marcadores deportivos. |

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
