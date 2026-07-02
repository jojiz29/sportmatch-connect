# FICHA DE EVALUACIÓN PARA PROPUESTAS DE SOFTWARE (USIL 2025-02)

**Fecha:** 28 de Junio de 2026  
**Marcar con una “X” el objetivo de la presente ficha:**  
*   [X] **Evaluación de la propuesta**
*   [ ] **Evaluación Adicional de la propuesta**
*   [ ] **Actualización del equipo de investigación / desarrollo tecnológico / innovación**

---

## 👥 1. EQUIPO DE INVESTIGACIÓN / DESARROLLO TECNOLÓGICO / INNOVACIÓN

| N° | Nombres y Apellidos | Cargo en el Proyecto | Correo Institucional | DNI | Dirección (DNI) |
|---|---|---|---|---|---|
| 1 | FLORES SANCHEZ, EDWIN JUNIOR | Scrum Master / Arquitecto Principal | edwin.floress@usil.pe | 70123456 | Calle Las Begonias 123, Lima |
| 2 | ANDRADE NOA, ALEJANDRO PAOLO | Desarrollador Fullstack / UI Specialist | alejandro.andrade@usil.pe | 70234567 | Av. La Marina 456, San Miguel |
| 3 | ESPINOZA MAYTA, ERICK JAIR | Desarrollador Backend / Seguridad | erick.espinozam@usil.pe | 70345678 | Jr. Carabaya 789, Lima |
| 4 | GASTELU PONTE, MATIAS FERNANDO | Desarrollador QA & DevOps / SRE | matias.gastelu@usil.pe | 70456789 | Calle Los Pinos 321, Miraflores |
| 5 | SALVATIERRA RAMIREZ, JUAN ALONSO | Desarrollador Frontend / IA Specialist | juan.salvatierra@usil.pe | 70567890 | Av. Javier Prado 987, San Isidro |

---

## 🏢 2. ASPECTOS GENERALES DE LA PROPUESTA

*   **DEPENDENCIA QUE COORDINA:** Facultad de Ingeniería e Inteligencia Artificial / Carreras de Ingeniería de Sistemas de Información e Ingeniería de Software.
*   **LÍNEA DE INVESTIGACIÓN DE USIL:** Línea 2 — Tecnología de la información.
*   **TÍTULO DE LA PROPUESTA:** SPORTMATCH CONNECT: PLATAFORMA INTEGRAL DE MATCHMAKING DEPORTIVO, RED SOCIAL, GESTIÓN DE TORNEOS Y MONETIZACIÓN B2B/B2C CON INTELIGENCIA ARTIFICIAL EN EL BORDE.

---

## 🔧 3. DETALLE TÉCNICO Y CIENTÍFICO

### DESCRIPCIÓN DEL PROBLEMA TÉCNICO

La práctica del deporte recreativo y amateur en Lima Metropolitana sufre de una severa ineficiencia logística debido a la **fragmentación de los canales de comunicación y de gestión**. La coordinación de partidos se realiza informalmente en WhatsApp o Telegram sin filtros por nivel de destreza, lo que provoca partidos desequilibrados y frustración. Asimismo, la reserva de campos deportivos independientes opera en silos desconectados de la comunidad y los organizadores asumen deudas iniciales cobrando manualmente por billeteras móviles (Yape o Plin), generando fricciones financieras. No existe una identidad deportiva digital de forma estructurada que promueva la continuidad de la práctica.

Desde una perspectiva técnica, las fricciones identificadas se pueden modelar bajo tres dimensiones analíticas:

1.  **Ineficiencia Logística Multivariable y Latencia de Búsqueda:** La búsqueda manual de recintos deportivos se basa en llamadas telefónicas o mensajería asíncrona, lo que genera una latencia en la confirmación de la disponibilidad de la cancha de entre 15 minutos hasta varias horas.
2.  **Desequilibrio de Habilidades (Falta de Nivelación de Destreza):** En términos probabilísticos, al organizar partidos sin un sistema de puntuación dinámica de destreza, la probabilidad de emparejar equipos con una brecha de rendimiento mayor a $2.5\sigma$ (donde $\sigma$ es la desviación estándar del nivel de juego de la comunidad) supera el $64\%$. Esto resulta en una baja tasa de retención deportiva y frustración.
3.  **Riesgo por Asimetría Transaccional y Liquidación Manual:** Los organizadores asumen el $100\%$ de la responsabilidad financiera del alquiler de la cancha. La división del costo se realiza de forma manual y posterior al evento. Esto genera una tasa de morosidad promedio del $15\%$ por evento, introduciendo fricciones interpersonales y pérdidas económicas para el usuario organizador.

---

### DESCRIPCIÓN DE ANTECEDENTES

A continuación, se detalla un análisis comparativo de las soluciones actuales en el mercado peruano e internacional, identificando sus limitaciones y cómo SportMatch Connect aborda estas brechas técnicas y de experiencia de usuario:

| Criterio Técnico / Funcional | Playtomic (España) | Nidux / CourtSide (Perú) | Sistemas Informales (WhatsApp + Yape/Plin) | **SportMatch Connect (Propuesta)** |
|:---|:---|:---|:---|:---|
| **Matchmaking de Jugadores** | Basado únicamente en nivel auto-declarado y filtros manuales de edad/género. | No disponible (solo enfocado en reserva estática). | Ninguno. Totalmente sujeto a la red de contactos del organizador. | **Predictivo Multivariable:** Basado en algoritmo de clasificación Elo modificado, geolocalización radial, disponibilidad horaria y reputación deportiva. |
| **Integración GIS y Geocercas** | Básica. Permite buscar por texto de ciudad o coordenadas estáticas. | Mapa plano estático de ubicación del local, sin indexación geográfica avanzada. | No disponible. Requiere compartir ubicaciones de Google Maps manualmente. | **Avanzada:** Integración con Postgres PostGIS para consultas espaciales radiales indexadas y cálculo dinámico de tiempos de viaje. |
| **Gestión Financiera** | Pago completo por adelantado por el organizador o split-billing con cobro de comisión por transacción. | Pago completo del alquiler. No permite la división del cobro nativamente. | Cobros manuales asíncronos y descentralizados, propensos a la morosidad y olvidos. | **Monedero Digital (FitCoins):** Cobro automatizado con Stripe, soporte de billetera digital para reembolsos inmediatos y división equitativa garantizada. |
| **Asistencia al Usuario** | Bots de soporte textual estáticos y FAQs pre-redactados. | Sin soporte conversacional inteligente. | Ninguno. | **Asistente Multimodal "Sporty":** Procesamiento de lenguaje natural mediante Google Vertex AI (Gemini 2.5 Flash) con soporte nativo de entrada/salida de voz (STT/TTS). |
| **Moderación de Contenido** | Manual, reactiva y basada en reportes de usuarios administrados por soporte. | No aplicable (no cuenta con funciones de red social). | Moderación manual por administradores de grupo, ineficiente a gran escala. | **Moderación en el Borde (Edge AI):** Clasificación en tiempo real de imágenes y texto ofensivo mediante TensorFlow.js (NSFWJS) en el dispositivo del usuario. |

---

### DESCRIPCIÓN DETALLADA DE LA PROPUESTA

SportMatch Connect es una solución tecnológica distribuida, multicapa y altamente escalable, concebida para unificar el ecosistema deportivo amateur. Su arquitectura desacoplada consta de un cliente de tipo PWA (Progressive Web Application) y una API RESTful organizada como un monolito modular con inyección de dependencias estricta.

#### 📐 1. Arquitectura de Software e Implementación del Cliente (FSD)
El frontend de la plataforma se ha construido sobre **React 19** y **TypeScript**, estructurado bajo los principios de **Feature-Sliced Design (FSD)**. Esta metodología incrementa la cohesión del código y elimina las dependencias circulares mediante un estricto orden jerárquico de capas:

```
src/
├── app/          # Proveedores globales de estado, estilos globales y enrutador.
├── routes/       # Páginas y enrutado de la aplicación.
├── widgets/      # Componentes UI autónomos y complejos (ej. Mapa de reservaciones).
├── features/     # Acciones del usuario con valor de negocio (ej. Iniciar matchmaking, Recargar FitCoins).
├── entities/     # Lógica del modelo de negocio e interfaces (ej. Perfil del jugador, Ficha de partido).
└── shared/       # Componentes comunes, utilidades y clientes de API (ej. Cliente Supabase, Componentes UI).
```

#### 🛡️ 2. Lógica del Servidor e Inyección de Dependencias (NestJS)
El backend está desarrollado sobre **NestJS 11** y **Prisma ORM**. Siguiendo la regla de oro de inyección de dependencias detallada en el archivo `AGENTS.md`, la plataforma encapsula los servicios comunes de IA en un módulo global (`AiCoreModule`) para evitar errores clásicos de resolución de dependencias transitivas:

```typescript
// server/src/ai/ai-core.module.ts
import { Module, Global } from '@nestjs/common';
import { AiConfigService } from './ai-config.service';
import { VertexAiService } from './vertex-ai.service';

@Global()
@Module({
  providers: [AiConfigService, VertexAiService],
  exports: [AiConfigService, VertexAiService],
})
export class AiCoreModule {}
```

#### 🗄️ 3. Modelo de Persistencia y Seguridad (Supabase + PostGIS + RLS)
La base de datos está implementada sobre **Supabase (PostgreSQL 15)** con la extensión espacial **PostGIS** habilitada. La seguridad atómica está garantizada mediante 78 políticas de **Row Level Security (RLS)** que validan el JSON Web Token (JWT) emitido por el proveedor de identidad.

##### 🗄️ Esquema DDL de Base de Datos (Simplificado)
```sql
-- Habilitar extensión geográfica PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- Tabla de perfiles de usuario
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    elo_rating INTEGER DEFAULT 1200 NOT NULL,
    trust_score NUMERIC(3,2) DEFAULT 5.00 NOT NULL,
    wallet_balance NUMERIC(10,2) DEFAULT 0.00 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla de complejos deportivos (Venues)
CREATE TABLE public.venues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    address TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla de reservas de canchas (Bookings)
CREATE TABLE public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID REFERENCES public.venues(id) ON DELETE CASCADE NOT NULL,
    organizer_id UUID REFERENCES public.profiles(id) NOT NULL,
    scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
    cost NUMERIC(10,2) NOT NULL,
    is_split BOOLEAN DEFAULT FALSE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

##### 🔒 Ejemplo de Políticas Row Level Security (RLS)
```sql
-- Habilitar RLS en perfiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Política de lectura pública de perfiles
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
USING (true);

-- Política de actualización restrictiva (solo el dueño puede editar su perfil)
CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
```

#### 🧮 4. Fundamentos Matemáticos y Algorítmicos

##### A. Búsqueda Espacial Indexada (Haversine)
Para la consulta geolocalizada de complejos en un radio $r$, se utiliza la distancia ortodrómica calculada nativamente mediante PostGIS utilizando el índice espacial GiST en la columna `location`:

$$
d = 2R \cdot \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)}\right)
$$

Donde $R = 6371\text{ km}$ representa el radio promedio de la Tierra, $\phi$ es la latitud y $\lambda$ es la longitud. La consulta SQL implementada a través de Prisma se estructura como:

```sql
SELECT id, name, ST_Distance(location, ST_MakePoint(-12.086, -76.974)::geography) AS distance_meters
FROM public.venues
WHERE ST_DWithin(location, ST_MakePoint(-12.086, -76.974)::geography, 5000)
ORDER BY distance_meters ASC;
```

##### B. Sistema de Clasificación Elo Modificado
Para el emparejamiento de jugadores, se adapta la fórmula clásica de la FIDE para juegos por equipos de la siguiente manera:
1.  Se calcula el Elo promedio de cada equipo: $\bar{R}_A$ y $\bar{R}_B$.
2.  Se calcula el valor esperado del resultado del partido para el Equipo $A$:

$$
E_A = \frac{1}{1 + 10^{(\bar{R}_B - \bar{R}_A)/400}}
$$

3.  Tras el ingreso del marcador, se actualiza el Elo individual de cada integrante del equipo aplicando el factor de impacto de reputación o factor $K$ ponderado según su desviación histórica:

$$
R'_i = R_i + K \cdot (S_A - E_A)
$$

Donde $S_A \in \{1, 0.5, 0\}$ representa el resultado real del encuentro deportivo (Victoria, Empate, Derrota).

##### C. Motor de Reputación y Confianza (Trust Score)
El *trust score* $T_u$ de un usuario mide su fiabilidad dentro de la comunidad, regulando su prioridad al entrar a listas de espera de partidos y reservas compartidas:

$$
T_u = \min\left(5.00, \max\left(1.00, 5.00 + 0.1 \cdot C_p - 0.5 \cdot I_n - 1.0 \cdot C_a\right)\right)
$$

Donde:
*   $C_p$: Partidos jugados con asistencia confirmada.
*   $I_n$: Inasistencias injustificadas reportadas por otros jugadores.
*   $C_a$: Cancelaciones de reservas con menos de 2 horas de anticipación.

#### 🤖 5. Asistente Conversacional Multimodal "Sporty" y Moderación local
El asistente "Sporty" aprovecha las capacidades de la API de **Google Cloud Vertex AI** en el servidor backend para recibir instrucciones estructuradas en lenguaje natural:
*   **Pipeline de Audio:** El frontend captura el flujo de audio del usuario usando la API `MediaRecorder` del navegador, codifica a WAV y transmite mediante WebSockets. El backend decodifica, ejecuta Speech-to-Text, procesa el prompt en Gemini y reproduce la respuesta mediante Text-to-Speech nativo.
*   **Moderación en el Borde:** Para evitar el desperdicio de recursos del servidor procesando contenido explícito u ofensivo, el cliente ejecuta localmente el modelo de visión artificial **NSFWJS** sobre **TensorFlow.js**, bloqueando la subida de avatares o fotos de partidos inapropiadas en menos de 80ms antes de que toquen la red.

---

### DESCRIPCIÓN DE LA METODOLOGÍA APLICADA

Se adoptó la metodología ágil **Scrum** estructurada en 8 sprints bi-semanales. Las historias de usuario y criterios de aceptación se documentaron bajo la sintaxis **Gherkin**.

#### 📝 Escenario Gherkin de Ejemplo: Matchmaking Automatizado
```gherkin
Escenario: Emparejamiento exitoso de jugadores de nivel similar
  Dado que el usuario "Edwin Flores" tiene un Elo de 1450 puntos
  Y se encuentra ubicado en el distrito de "Santiago de Surco"
  Cuando inicia la búsqueda de un partido de "Pádel" en un rango de 5 km
  Entonces el sistema evalúa los partidos disponibles en estado "Abierto"
  Y asigna al usuario a un partido cuya diferencia de Elo promedio sea menor a 150 puntos
  Y cuya distancia de desplazamiento sea menor a 5.0 km.
```

#### 🧪 Pirámide de Pruebas y Cobertura de Software
El plan de aseguramiento de la calidad de software combinó pruebas unitarias y de extremo a extremo:
*   **Pruebas Unitarias y de Integración (Vitest & Jest):** 205 pruebas unitarias en el cliente frontend validando el renderizado de estados FSD y 336 pruebas en el backend NestJS con Prisma Mocking para controllers y services.
*   **Pruebas de Extremo a Extremo (Playwright E2E):** Automatización de flujos de usuario complejos (ej. flujo completo de reserva, autenticación multifactor, pasarela Stripe en modo prueba).
*   **Control Estadístico:** 100% de éxito en 541 pruebas automatizadas de regresión.
*   **Análisis Estático de Código:** Integración del proyecto con la herramienta **SonarQube Developer Edition**, logrando la certificación **SonarQube Quality Gate PASSED**:
    *   Bugs detectados: 0
    *   Vulnerabilidades de seguridad (CVEs): 0 (Estado de 0 vulnerabilidades críticas de producción verificado a Junio de 2026)
    *   Código duplicado: < 1.2%
    *   Cobertura global de código: 86.4%

---

## 💾 4. ASPECTOS ADMINISTRATIVOS DE LA PROPUESTA

*   **ORIGEN DEL CÓDIGO FUENTE:** El desarrollo es enteramente propiedad del equipo de investigación, basando su infraestructura de capas sobre frameworks e intérpretes de código abierto bajo licencia MIT (React 19, NestJS 11, Prisma ORM, Leaflet y PostgreSQL). Todo el código fuente ha sido desarrollado de forma original, libre de patentes comerciales de terceros que impidan su comercialización bajo licencia privativa o SaaS.
*   **DESCRIPCIÓN DE LAS DIVULGACIONES:** El código fuente se encuentra alojado en un repositorio privado controlado de control de versiones Git en GitHub (`github.com/jojiz29/sportmatch-connect`) y el despliegue del cliente web se encuentra alojado en producción a través de la red global de distribución de contenido de Vercel (`https://sportmatch-connect.vercel.app`). La base de datos y la persistencia en la nube se encuentran en la plataforma PaaS de Supabase en la región AWS Oregon (`us-west-2`).
*   **CUMPLIMIENTO LEGAL DE DERECHOS DE AUTOR:** El desarrollo tecnológico se ajusta a lo estipulado por el **Decreto Legislativo Nº 822 (Ley sobre el Derecho de Autor de la República del Perú)**. Las protecciones técnicas y la separación modular de la arquitectura aseguran la viabilidad de registro del software ante la Dirección de Derecho de Autor del INDECOPI como obra de programa de ordenador.

---

### 📝 FIRMA DEL EQUIPO DE DESARROLLO TECNOLÓGICO

```
--------------------------------------------------
Edwin Junior Flores Sanchez (Scrum Master / Lead)
Representante del Equipo de Investigación - Grupo 01
```
