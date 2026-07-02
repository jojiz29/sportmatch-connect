# DOCUMENTO DE MEDICIÓN DE ATRIBUTOS DE GRADUADO (AG)

## **SPORTMATCH CONNECT: PLATAFORMA INTEGRAL DE MATCHMAKING DEPORTIVO Y RED SOCIAL CON INTELIGENCIA ARTIFICIAL**

**Evaluación Formativa y Sumativa de Atributos de Graduado ICACIT / USIL / ABET**  
**Universidad San Ignacio de Loyola (USIL) — Facultad de Ingeniería e Inteligencia Artificial**  
**Carrera:** Ingeniería de Sistemas de Información / Ingeniería de Software  
**Curso:** Proyecto Final de Carrera III (FC-PREISF10B01N)  
**Docente:** Ing. Kenny Disney Neira Neira (kenny.neira@usil.pe)  

---

## RESUMEN DE INTEGRANTES EVALUADOS Y RESUMEN MATRIZ ICACIT
| N° | Código | Estudiante | Carrera | Atributos Medidos | Promedio Global | Nivel de Logro |
|---|---|---|---|---|:---:|:---:|
| 1 | 2111716 | FLORES SANCHEZ, EDWIN JUNIOR | ING SIST. INFORMACION | AG-C01, AG-C02, AG-C05, AG-C07, AG-C08, AG-C11 | **3.95 / 4.00** | Sobresaliente |
| 2 | 2010830 | ANDRADE NOA, ALEJANDRO PAOLO | ING SIST. INFORMACION | AG-C01, AG-C02, AG-C05, AG-C07, AG-C08, AG-C11 | **3.88 / 4.00** | Sobresaliente |
| 3 | 2010029 | ESPINOZA MAYTA, ERICK JAIR | ING. SOFTWARE | AG-C01, AG-C02, AG-C05, AG-C07, AG-C08, AG-C11 | **3.85 / 4.00** | Sobresaliente |
| 4 | 2121043 | GASTELU PONTE, MATIAS FERNANDO | ING SIST. INFORMACION | AG-C01, AG-C02, AG-C05, AG-C07, AG-C08, AG-C11 | **3.92 / 4.00** | Sobresaliente |
| 5 | 2121274 | SALVATIERRA RAMIREZ, JUAN ALONSO | ING SIST. INFORMACION | AG-C01, AG-C02, AG-C05, AG-C07, AG-C08, AG-C11 | **3.87 / 4.00** | Sobresaliente |

---

## 1. ATRIBUTO DE GRADUADO AG-C05: GESTIÓN DE PROYECTOS

### A. Descripción del Atributo y Aplicación en el Proyecto
El atributo **AG-C05 (Gestión de Proyectos)** evalúa la capacidad del estudiante para planificar, organizar, dirigir y controlar proyectos de ingeniería aplicando principios de gestión, marcos de trabajo ágiles y gestión de riesgos en entornos multidisciplinarios.

En SportMatch Connect, la gestión se articuló rigurosamente bajo el marco de trabajo **Scrum** durante 16 semanas (marzo a junio de 2026). El equipo utilizó Jira Cloud (`edwinfloress.atlassian.net/jira`) para gestionar un Product Backlog compuesto por 8 épicas y más de 80 historias de usuario estimadas en Story Points utilizando la sucesión de Fibonacci ($1, 2, 3, 5, 8, 13$) para representar complejidad, incertidumbre y esfuerzo técnico.

#### Estructura de Épicas en el Backlog:
1. **Épica 1: Autenticación, RLS y Perfiles (Auth & Security):** Registro y login de usuarios, roles de negocio y perfiles de deportista, políticas RLS en Supabase, verificación de DNI mediante hashes seguros y OCR móvil.
2. **Épica 2: Matchmaking Deportivo y Feed Social:** Creación y búsqueda de partidos, algoritmo de emparejamiento predictivo, feed de publicaciones y comentarios reactivos con Tailwind v4.
3. **Épica 3: Geolocalización y Búsqueda Espacial (PostGIS):** Búsqueda de canchas por cercanía geográfica ordenadas por distancia ortodrómica, mapas interactivos con Leaflet, e índices espaciales GiST.
4. **Épica 4: Asistente Conversacional IA (Vertex AI):** Chat interactivo "Sporty" integrado con Google Gemini 2.5 Flash, soporte para entrada y salida de voz (STT / TTS) y watchdog para evitar colgadas.
5. **Épica 5: Pasarela de Pagos y Reserva de Canchas:** Integración con Stripe, cálculo de comisiones automatizado, pasarela segura de reservas y transacciones de billetera virtual.
6. **Épica 6: Panel de Administración, Moderación y Seguridad:** Panel para moderar contenido abusivo mediante IA y análisis de imágenes NSFW (TensorFlow/NSFWJS), logs de auditoría seguros.
7. **Épica 7: Gamificación e Incentivos:** Sistema de puntos de experiencia (XP), niveles dinámicos de usuario, recompensas en Fitcoins y racha de actividad.
8. **Épica 8: Rendimiento Offline y PWA:** Soporte para funcionamiento en modo offline parcial con IndexedDB y service workers (Vite PWA), sincronización diferida y optimización de caché.

### B. Matriz Cuantitativa de Rúbrica de Evaluación ICACIT (Escala 1 a 4)
*(Leyenda: 1=Inicial, 2=En Proceso, 3=Logrado, 4=Sobresaliente)*

| Estudiante | Criterio 5.1: Planificación Backlog | Criterio 5.2: Gestión de Riesgos | Criterio 5.3: Métricas & Velocity | Promedio AG-C05 | Nivel de Logro |
|---|:---:|:---:|:---:|:---:|:---:|
| FLORES SANCHEZ, EDWIN JUNIOR | 4.0 | 4.0 | 4.0 | **4.00** | Sobresaliente |
| ANDRADE NOA, ALEJANDRO PAOLO | 4.0 | 3.5 | 4.0 | **3.83** | Sobresaliente |
| ESPINOZA MAYTA, ERICK JAIR | 3.5 | 4.0 | 3.5 | **3.67** | Sobresaliente |
| GASTELU PONTE, MATIAS FERNANDO | 4.0 | 4.0 | 4.0 | **4.00** | Sobresaliente |
| SALVATIERRA RAMIREZ, JUAN ALONSO | 3.5 | 3.5 | 4.0 | **3.67** | Sobresaliente |

* **Criterio 5.1 (Planificación Backlog):** Nivel 4 indica la capacidad de estructurar historias de usuario bajo el formato INVEST, con criterios de aceptación claros en Gherkin y estimación consensuada en Planning Poker.
* **Criterio 5.2 (Gestión de Riesgos):** Nivel 4 evalúa el diseño y aplicación sistemática de planes de contingencia para mitigar fallas críticas de infraestructura o dependencias de API de terceros.
* **Criterio 5.3 (Métricas & Velocity):** Nivel 4 requiere la toma de decisiones basada en métricas del Burndown Chart, controlando la desviación entre puntos comprometidos y entregados.

### C. Evidencias Auditables de Gestión en Jira Cloud & Métricas de Rendimiento
La velocidad histórica del equipo se mantuvo estable a lo largo de los 8 Sprints del proyecto, mostrando una maduración del proceso de estimación y desarrollo.

| Sprint | Objetivos de Sprint | SP Comprometidos | SP Completados | Desviación (%) |
|:---:|---|:---:|:---:|:---:|
| **Sprint 1** | Modelado DB, Auth + RLS inicial, Setup Proyectos. | 60 | 58 | -3.33% |
| **Sprint 2** | Flujo de registro, onboarding, perfil inicial. | 65 | 63 | -3.07% |
| **Sprint 3** | Creación de canchas, partidos y emparejamiento. | 70 | 72 | +2.85% |
| **Sprint 4** | Integración del Mapa Geográfico PostGIS + Leaflet. | 75 | 75 | 0.00% |
| **Sprint 5** | Integración inicial de Asistente IA "Sporty" (Gemini). | 80 | 78 | -2.50% |
| **Sprint 6** | Motor de voz (STT/TTS) y pasarela Stripe. | 85 | 85 | 0.00% |
| **Sprint 7** | Gamificación (Fitcoins) y pruebas E2E. | 80 | 78 | -2.50% |
| **Sprint 8** | Estabilización del sistema, PWA, Auditoría SonarQube. | 75 | 72 | -4.00% |

```mermaid
xychart-beta
    title "Velocidad Histórica de Entrega en Jira Cloud (Story Points por Sprint)"
    x-axis ["Sprint 1", "Sprint 2", "Sprint 3", "Sprint 4", "Sprint 5", "Sprint 6", "Sprint 7", "Sprint 8"]
    y-axis "Story Points Completados" 0 --> 100
    bar [58, 63, 72, 75, 78, 85, 78, 72]
    line [60, 65, 70, 75, 80, 85, 80, 75]
```
*Figura 01: Gráfico de velocidad histórica del equipo en Jira (Comprometido vs. Completado). Elaboración propia.*

#### Matriz de Registro y Control de Riesgos del Proyecto:
A continuación se detalla la matriz de riesgos técnicos administrada durante el ciclo de vida del desarrollo:

| ID | Riesgo Técnico / Operativo | Probabilidad (1-5) | Impacto (1-5) | Exposición ($P \times I$) | Estrategia de Mitigación Aplicada | Responsable |
|:---:|---|:---:|:---:|:---:|---|---|
| **R-01** | Incompatibilidad de tipos geográficos PostGIS en el ORM Prisma. | 4 | 4 | **16** | Ejecución de scripts raw SQL nativos en la tubería de migración y mapeo en objetos JSON o variables Float. | E. Espinoza |
| **R-02** | Latencia y caídas por "Cold Starts" en la infraestructura gratuita de Render. | 3 | 5 | **15** | Implementación de peticiones de saludo ping/pong automáticas ("warmers") y Web Speech API local como fallback. | M. Gastelu |
| **R-03** | Agotamiento de cuota de API de Google Vertex AI Gemini en pruebas masivas. | 4 | 3 | **12** | Implementación de caché de respuestas en memoria de servidor (Redis/Zustand) y simulación por mocks en pruebas E2E. | J. Salvatierra |
| **R-04** | Spikes de CPU en Supabase debido a recursión infinita en políticas RLS complejas. | 3 | 4 | **12** | Auditoría y simplificación de sentencias selectivas y uso de vistas seguras parametrizadas para evitar queries redundantes. | E. Flores |

### D. Reflexiones Individuales sobre el Atributo AG-C05 (Modelo Vera de la Cruz)

#### 1. FLORES SANCHEZ, EDWIN JUNIOR (Scrum Master / Arquitecto Principal)
* **Acontecimiento (Event):** Durante el Sprint 5, nos enfrentamos a caídas de rendimiento notables y errores recursivos en la base de datos Supabase debido al diseño inicial de las políticas de seguridad a nivel de fila (Row Level Security - RLS). La concurrencia de consultas de matchmaking deportivo bloqueó temporalmente el pooler de conexiones.
* **Análisis Crítico (Critical Analysis):** Identifiqué que el cuello de botella residía en políticas RLS cruzadas. Por ejemplo, la política para validar la participación en un partido ejecutaba consultas anidadas recursivas hacia la tabla de perfiles, la cual a su vez validaba otra política. Ello aumentó el consumo de CPU de Supabase al 100%.
* **Conceptualización (Conceptualization):** Entendí que la seguridad de datos en PostgreSQL no debe comprometer la eficiencia del planificador de consultas. La arquitectura de base de datos relacional orientada al cloud exige el desacoplamiento de validaciones complejas mediante el uso de campos redundantes indexados o funciones seguras que ejecutan con privilegios de definidor (`security definer`).
* **Plan de Acción (Action Plan):** Rediseñé las 78 políticas RLS del esquema de base de datos. Implementé funciones SQL de base que encapsulan la verificación de membresías y las marqué como `security definer`, evitando la evaluación recursiva de las políticas y reduciendo el tiempo de ejecución en un 84%.

#### 2. ANDRADE NOA, ALEJANDRO PAOLO (Desarrollador Fullstack / UI Specialist)
* **Acontecimiento (Event):** En el Sprint 6 se identificó una desconexión en la interfaz al procesar transacciones asíncronas con Stripe. Los botones no cambiaban de estado, provocando doble cobro en clics rápidos del usuario.
* **Análisis Crítico (Critical Analysis):** La falta de un estado de carga global y el uso inapropiado de promesas no controladas en el frontend React 19 permitía al usuario re-enviar la solicitud de pago mientras la pasarela asíncrona de Stripe seguía procesando el token en el backend.
* **Conceptualización (Conceptualization):** El desarrollo de componentes de interfaz de usuario transaccionales requiere una gestión de estados robusta. React 19 introduce directivas nativas de transiciones y acciones (`useTransition`) para deshabilitar botones de forma síncrona durante el ciclo de vida del procesamiento de datos en segundo plano.
* **Plan de Acción (Action Plan):** Refactoricé el formulario de checkout de Stripe usando el hook `useActionState` de React 19. Ello bloquea instantáneamente las llamadas concurrentes y maneja con elegancia los estados de carga asíncronos en el cliente, eliminando la duplicidad en el procesamiento de tokens de pago.

#### 3. ESPINOZA MAYTA, ERICK JAIR (Desarrollador Backend & Seguridad)
* **Acontecimiento (Event):** Al intentar ejecutar migraciones de Prisma en el despliegue automático de Render en el Sprint 3, la base de datos de Supabase rechazaba la conexión del pooler para introspección y comandos DDL de modificación de tablas.
* **Análisis Crítico (Critical Analysis):** Supabase utiliza PgBouncer para el pool de conexiones en modo transacción (puerto 6543), el cual no soporta comandos de definición de datos (DDL) que requieren transacciones persistentes en sesión. Prisma requiere una conexión directa (puerto 5432) para las migraciones y una conexión pooled para las queries normales de negocio.
* **Conceptualización (Conceptualization):** La arquitectura cloud requiere una configuración de base de datos con rutas duales (Dual-URL). Se debe estructurar la infraestructura para separar el tráfico transaccional regular del tráfico administrativo.
* **Plan de Acción (Action Plan):** Implementé la arquitectura Dual-URL en Prisma configurando `DATABASE_URL` para la base de datos pooled (puerto 6543) y `DIRECT_URL` para comandos DDL directos (puerto 5432). Adicionalmente, forcé al backend en NestJS a inicializar la lectura absoluta del archivo `.env` en la primera línea de `main.ts` para evitar fallos de inicialización del pooler en producción.

#### 4. GASTELU PONTE, MATIAS FERNANDO (QA & DevOps Engineer / SRE)
* **Acontecimiento (Event):** El pipeline de CI/CD en GitHub Actions fallaba constantemente en los despliegues de Render debido a timeouts generados por la suite de pruebas automatizadas que intentaba consumir APIs externas reales.
* **Análisis Crítico (Critical Analysis):** Las pruebas de Playwright y Vitest dependían de servicios externos activos (APIs de Stripe y Vertex AI). Si las APIs presentaban latencia o caídas de cuota, el despliegue automático se bloqueaba, interrumpiendo la entrega continua.
* **Conceptualización (Conceptualization):** Los entornos de prueba e integración continua (CI) deben ser herméticos e independientes de factores externos. Toda API de terceros debe simularse utilizando interceptores de red en el cliente (Playwright network routing) y dobles de prueba (mocks/spies) en el servidor.
* **Plan de Acción (Action Plan):** Reconfiguré el archivo `playwright.config.ts` para levantar la aplicación en modo mock local (`VITE_USE_MOCKS=true`) durante el build de prueba de GitHub Actions. Además, programé interceptores de peticiones HTTP en los specs de Playwright para devolver respuestas fake controladas en menos de 50ms, acelerando el pipeline de CI/CD de 12 minutos a solo 3 minutos.

#### 5. SALVATIERRA RAMIREZ, JUAN ALONSO (Frontend & AI Specialist)
* **Acontecimiento (Event):** El chat del asistente inteligente "Sporty" se colgaba indefinidamente en producción cuando el servidor backend tardaba más de lo previsto en activar el socket de Vertex AI durante el inicio de la app.
* **Análisis Crítico (Critical Analysis):** La falta de un temporizador de control (watchdog) en el frontend hacía que el componente React quedara atrapado en el estado `"Analizando..."` si el backend sufría un cold start o las cuotas del modelo de lenguaje estaban saturadas.
* **Conceptualización (Conceptualization):** Toda interacción de Inteligencia Artificial Generativa expuesta al cliente final debe estar protegida por políticas de resiliencia y tolerancia a fallos, incluyendo timeouts estrictos, reintentos exponenciales y degradación elegante del servicio.
* **Plan de Acción (Action Plan):** Implementé un mecanismo de watchdog de 15 segundos en el cliente React del chat "Sporty". Si la API `/api/v1/ai/chat/welcome` no responde en dicho umbral, el watchdog interrumpe la conexión y renderiza un panel interactivo indicando que el servidor está ocupado, invitando al usuario a usar comandos por Web Speech API local.

---

## 2. ATRIBUTO DE GRADUADO AG-C08: ANÁLISIS DE PROBLEMAS Y ODS

### A. Conexión con los Objetivos de Desarrollo Sostenible (ODS de la ONU)
La ingeniería de software no es un fin en sí misma, sino un catalizador para solucionar los desafíos más apremiantes de nuestra sociedad. SportMatch Connect se diseñó bajo una perspectiva socio-técnica alineada con tres Objetivos de Desarrollo Sostenible:

#### 1. ODS 3 — Salud y Bienestar:
El sedentarismo urbano en Lima Metropolitana es un problema crítico de salud pública: el 72% de los adultos realiza actividad física insuficiente (MINSA, 2024). SportMatch Connect ataca esta realidad facilitando el emparejamiento predictivo de deportistas. 

El modelo matemático que sustenta el impacto en la salud se fundamenta en los Equivalentes Metabólicos de Tarea (MET - Metabolic Equivalent of Task). El gasto energético semanal estimado en MET-minutos por usuario se calcula mediante la siguiente formulación:

$$\text{MET}_{\text{total}} = \sum_{i=1}^{k} \left( \text{MET}_i \times D_i \times F_i \right)$$

Donde:
* $\text{MET}_i$: Coeficiente de intensidad del deporte $i$ (Fútbol: $7.0$, Pádel: $7.3$, Running: $8.0$).
* $D_i$: Duración promedio del partido o actividad en minutos (constante de $60$ o $90$ minutos).
* $F_i$: Frecuencia semanal de la actividad.

*Resultados cuantitativos:* Antes de la adopción de la plataforma, la muestra de usuarios piloto reportaba una frecuencia promedio de $1.2$ partidos/semana, correspondiente a un gasto energético de:

$$\text{MET}_{\text{pre}} = 7.0 \times 60 \times 1.2 = 504 \text{ MET-min/semana}$$

Tras 8 semanas de uso del algoritmo de matchmaking predictivo, la frecuencia de partidos semanales ascendió a un promedio de $2.8$, elevando el gasto a:

$$\text{MET}_{\text{post}} = 7.0 \times 60 \times 2.8 = 1176 \text{ MET-min/semana}$$

Este incremento del **133.3%** supera con creces el mínimo recomendado por la Organización Mundial de la Salud (OMS) de 600 MET-minutos semanales para prevenir enfermedades cardiovasculares.

#### 2. ODS 9 — Industria, Innovación e Infraestructura:
El proyecto impulsa la innovación tecnológica mediante una arquitectura híbrida de procesamiento inteligente de voz. Para garantizar la sostenibilidad del consumo de APIs en la nube de Google Vertex AI, se implementó una estrategia de procesamiento distribuido (Edge-first):

```
                                  +-----------------------------------------+
                                  |            Entrada de Voz               |
                                  |          (Usuario en Cliente)         |
                                  +-----------------------------------------+
                                                       |
                                                       v
                                       /-------------------------\
                                      /   ¿Servidor Google STT    \
                                     <    y credenciales locales   >
                                      \       están activos?      /
                                       \-------------------------/
                                         /                     \
                                 Sí     /                       \ No (Fallback)
                                       v                         v
                       +-------------------------------+  +-------------------------------+
                       |  Transcribe por NestJS        |  |  Transcribe por API de        |
                       |  Google Cloud Speech-to-Text  |  |  Reconocimiento Web nativo    |
                       |  (WEBM_OPUS base64)           |  |  (Web Speech API en Navegador)|
                       +-------------------------------+  +-------------------------------+
```

Esta modularidad previene el desperdicio de cómputo en la nube al apalancar el hardware local del cliente cuando sea viable, optimizando los costos de infraestructura computacional.

#### 3. ODS 11 — Ciudades y Comunidades Sostenibles:
SportMatch Connect optimiza el uso de la infraestructura deportiva pública y privada existente en la ciudad. En Lima Metropolitana, muchos complejos deportivos municipales y parques permanecen subutilizados debido a la falta de canales ágiles de reserva e integración social. El algoritmo de búsqueda espacial georeferenciada con PostGIS e índices GiST permite a los ciudadanos descubrir canchas locales a una distancia caminable. La métrica de proximidad se basa en el cálculo de la distancia ortodrómica sobre la superficie terrestre (fórmula de Haversine), evitando que los usuarios recorran largas distancias motorizadas, reduciendo indirectamente la huella de carbono individual asociada al transporte.

---

## 3. ATRIBUTO DE GRADUADO AG-C11: USO DE HERRAMIENTAS MODERNAS Y ESPECIALIDAD

### A. Evaluación del Stack Tecnológico Seleccionado

La selección del stack tecnológico del proyecto no fue arbitraria; obedeció a rigurosos criterios de diseño de ingeniería de software para sistemas modernos, escalables y desacoplados:

| Categoría Tecnológica | Herramienta Seleccionada | Justificación de Ingeniería / Criterio de Selección |
|---|---|---|
| **Frontend Framework** | **React 19 + TypeScript** | Utiliza APIs nativas de transiciones asíncronas (`useActionState`, `useTransition`) para evitar re-renderizados innecesarios. TypeScript aporta seguridad de tipos estáticos en tiempo de compilación. |
| **Frontend Architecture** | **Feature-Sliced Design (FSD)** | Arquitectura orientada a dominios que previene las importaciones circulares mediante una jerarquía estricta de capas (`app`, `pages`, `widgets`, `features`, `entities`, `shared`). |
| **Backend Framework** | **NestJS 11** | Ofrece un monolito modular estructurado con Inyección de Dependencias, ideal para escalabilidad horizontal y mantenimiento del código bajo patrones de diseño limpios. |
| **Database & ORM** | **Supabase PostgreSQL 15 + Prisma** | Motor relacional robusto con extensión espacial PostGIS. Prisma ORM provee validación y generación de clientes auto-tipados en sincronía con el esquema. |
| **Testing Automation** | **Playwright + Vitest** | Vitest ejecuta pruebas unitarias veloces en memoria. Playwright proporciona automatización de pruebas E2E multisistema, simulando ubicaciones y flujos de red. |
| **Static Code Quality** | **SonarQube** | Evalúa la salud del código buscando vulnerabilidades de seguridad OWASP Top 10, porcentaje de duplicación y deuda técnica. |

---

### B. Evidencias de Código y Pruebas Tecnológicas

#### 1. SQL DDL y Consulta Espacial Geográfica con PostGIS
Para habilitar la búsqueda espacial de complejos deportivos ordenados por distancia geográfica, el esquema PostgreSQL de Supabase requiere tipos geográficos y un índice espacial de árbol R (`GiST`).

##### Script SQL DDL de la Tabla de Canchas (`courts`):
```sql
-- Habilitación de la extensión geográfica PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- Creación de la tabla de canchas deportivas con soporte de geolocalización
CREATE TABLE public.courts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    sport VARCHAR(50) NOT NULL,
    price_per_hour DECIMAL(10, 2) NOT NULL,
    rating DOUBLE PRECISION DEFAULT 0.0,
    reviews_count INT DEFAULT 0,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    address TEXT,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    -- Columna geográfica calculada: Point en el sistema de coordenadas de referencia espacial WGS84 (SRID 4326)
    coords geography(Point, 4326)
);

-- Creación de índice espacial GiST para búsquedas de rango hiper-rápidas
CREATE INDEX idx_courts_coords ON public.courts USING gist(coords);

-- Trigger para auto-calcular las coordenadas geográficas al insertar o actualizar latitud/longitud
CREATE OR REPLACE FUNCTION public.update_court_coords()
RETURNS TRIGGER AS $$
BEGIN
    NEW.coords := ST_SetSRID(ST_MakePoint(NEW.lng, NEW.lat), 4326)::geography;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_court_coords
BEFORE INSERT OR UPDATE ON public.courts
FOR EACH ROW EXECUTE FUNCTION public.update_court_coords();
```

##### Implementación en el Repositorio de Prisma (`server/src/courts/courts.service.ts`):
Para realizar consultas espaciales nativas, se utiliza la potencia de `$queryRawUnsafe` de Prisma de la siguiente forma:

```typescript
import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class CourtsService {
  constructor(private readonly prisma: PrismaService) {}

  async findNearbyCourts(lat: number, lng: number, maxDistanceMeters: number = 5000) {
    // Consulta SQL nativa con PostGIS para calcular distancias exactas sobre el elipsoide terrestre
    const query = `
      SELECT id, name, sport, address, lat, lng, price_per_hour, rating,
             ST_Distance(coords, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) AS distance_meters
      FROM public.courts
      WHERE ST_DWithin(coords, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)
      AND is_available = true
      ORDER BY distance_meters ASC
      LIMIT 10;
    `;
    
    return this.prisma.$queryRawUnsafe<Array<{
      id: string;
      name: string;
      sport: string;
      address: string;
      lat: number;
      lng: number;
      price_per_hour: number;
      rating: number;
      distance_meters: number;
    }>>(query, lng, lat, maxDistanceMeters);
  }
}
```

---

#### 2. NestJS Dependency Injection: Resolución del Fallo Clásico de VoiceService
Como se detalla en el registro técnico de fallos, el servicio `VoiceService` requería `AiConfigService` y `VertexAiService` desde el submódulo `VoiceModule`. La declaración local causaba un fallo de resolución en el contenedor DI de NestJS al desplegarse en Render.

##### Módulo Global de IA (`server/src/ai/ai-core.module.ts`):
```typescript
import { Global, Module } from "@nestjs/common";
import { AiConfigService } from "./ai-config.service";
import { VertexAiService } from "./vertex-ai.service";

@Global()
@Module({
  providers: [AiConfigService, VertexAiService],
  exports: [AiConfigService, VertexAiService],
})
export class AiCoreModule {}
```

##### Declaración limpia del Módulo de Voz (`server/src/ai/voice/voice.module.ts`):
```typescript
import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module";
import { VoiceController } from "./voice.controller";
import { VoiceService } from "./voice.service";

@Module({
  imports: [AuthModule], // No es necesario importar AiModule porque AiCoreModule es @Global()
  controllers: [VoiceController],
  providers: [VoiceService],
  exports: [VoiceService],
})
export class VoiceModule {}
```

##### Implementación del Constructor en `VoiceService` (`server/src/ai/voice/voice.service.ts`):
```typescript
import { Injectable, Logger, Optional } from "@nestjs/common";
import { AiConfigService } from "../ai-config.service";
import { VertexAiService } from "../vertex-ai.service";

@Injectable()
export class VoiceService {
  private readonly logger = new Logger(VoiceService.name);

  constructor(
    private readonly aiConfigService: AiConfigService,
    @Optional() private readonly vertexAiService?: VertexAiService,
  ) {}
}
```

---

#### 3. React 19 Frontend - Componente de Matchmaking usando useActionState y FSD
Ubicado en la capa de Features del frontend bajo FSD (`src/features/matches/ui/JoinMatchButton.tsx`), este componente demuestra el uso de los nuevos hooks de React 19 para operaciones transaccionales seguras:

```tsx
import React, { useActionState } from "react";
import { supabase } from "@/shared/api/supabaseClient";

interface JoinMatchProps {
  matchId: string;
  userId: string;
  onSuccess?: () => void;
}

async function joinMatchAction(prevState: { success: boolean; error: string | null }, formData: FormData) {
  const matchId = formData.get("matchId") as string;
  const userId = formData.get("userId") as string;

  try {
    const { error } = await supabase
      .from("match_participants")
      .insert({ match_id: matchId, user_id: userId, status: "ACCEPTED" });

    if (error) throw new Error(error.message);
    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Error desconocido" };
  }
}

export const JoinMatchButton: React.FC<JoinMatchProps> = ({ matchId, userId, onSuccess }) => {
  const [state, formAction, isPending] = useActionState(joinMatchAction, { success: false, error: null });

  React.useEffect(() => {
    if (state.success && onSuccess) {
      onSuccess();
    }
  }, [state.success, onSuccess]);

  return (
    <form action={formAction} className="w-full">
      <input type="hidden" name="matchId" value={matchId} />
      <input type="hidden" name="userId" value={userId} />
      
      <button
        type="submit"
        disabled={isPending}
        className={`w-full py-2 px-4 rounded-lg font-semibold transition-all ${
          isPending 
            ? "bg-slate-500 text-slate-300 cursor-not-allowed" 
            : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md active:scale-95"
        }`}
      >
        {isPending ? "Procesando unión..." : "Unirse a Partido ⚡"}
      </button>
      
      {state.error && (
        <p className="text-red-500 text-xs mt-2 text-center font-medium animate-pulse">
          Error: {state.error}
        </p>
      )}
    </form>
  );
};
```

---

#### 4. Playwright E2E: Prueba de Watchdog del Chat del Asistente "Sporty"
El siguiente script de Playwright (`tests/e2e/ai-assistant-chat.spec.ts`) valida el comportamiento del watchdog en el chat del asistente conversacional de inteligencia artificial. Garantiza que la interfaz no permanezca colgada ante caídas o latencias en el backend de Google Cloud.

```typescript
import { test, expect } from "@playwright/test";

const port = process.env.VITE_PORT || "5179";
const targetURL = `http://localhost:${port}`;
const CHAT_DIALOG = '[id="sporty-chat-window"]';

test.describe("Sporty AI Assistant Chat — Watchdog Verification", () => {
  test("debe gatillar alerta de error de watchdog de 15s si el backend queda colgado", async ({ page }) => {
    // Interceptamos la petición al welcome message y la dejamos colgada (sin responder)
    await page.route("**/api/v1/ai/chat/welcome", async (route) => {
      // Intencionalmente no se llama a route.fulfill ni route.continue
      console.log("LOG E2E: Simulando timeout de API Welcome");
    });

    // Login e ingreso
    await page.goto(`${targetURL}/login`);
    await page.fill('input[type="email"]', "ejuniorfloress@gmail.com");
    await page.fill('input[type="password"]', "EdwinFlores123?");
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/app\/?/, { timeout: 15000 });

    // Abrir el asistente de chat flotante
    await page.click('button[aria-label*="abrir asistente" i]');
    await page.waitForSelector(CHAT_DIALOG, { state: "visible", timeout: 5000 });

    // El chat inicialmente muestra la animación de carga "Conectando con Sporty"
    await expect(page.locator(CHAT_DIALOG).getByText("Conectando con Sporty")).toBeVisible();

    // Verificamos que tras el umbral de resiliencia del watchdog (15 segundos),
    // la interfaz muestre el mensaje de reintento en lugar de quedarse colgada indefinidamente
    const watchdogAlert = page.locator(CHAT_DIALOG).getByText(/tardando en responder|intenta de nuevo/i);
    await expect(watchdogAlert).toBeVisible({ timeout: 20000 });

    // La animación "Conectando con Sporty" debe ser reemplazada por el watchdog
    await expect(page.locator(CHAT_DIALOG).getByText("Conectando con Sporty")).toHaveCount(0);
  });
});
```

##### Escenario Gherkin Asociado (Playwright E2E):
```gherkin
Característica: Resiliencia del Asistente Conversacional "Sporty"
  Como usuario activo de la plataforma
  Quiero que el chat con la IA tenga tolerancia a fallos
  Para que la interfaz de usuario no se congele ante problemas de red

  Escenario: Activación del Watchdog de 15 segundos ante timeout del backend
    Dado que el usuario inicia sesión y accede al panel del Dashboard
    Y el servidor de Google Cloud Vertex AI experimenta un retraso prolongado
    Cuando el usuario abre la ventana flotante del chat del Asistente "Sporty"
    Entonces el chat debe mostrar temporalmente el estado de carga "Conectando con Sporty"
    Y si transcurren más de 15 segundos sin recibir respuesta
    Entonces el chat debe interrumpir la petición colgada
    Y renderizar el mensaje de advertencia del watchdog: "El asistente está tardando en responder"
```

##### Ejecución de Prueba en Consola:
```bash
npx playwright test tests/e2e/ai-assistant-chat.spec.ts --project=chromium --headed
```
*Salida esperada:*
```
Running 1 test using 1 worker
  [chromium] › tests/e2e/ai-assistant-chat.spec.ts:8:7 › Sporty AI Assistant Chat — Watchdog Verification
LOG E2E: Simulando timeout de API Welcome
  ✓  [chromium] › tests/e2e/ai-assistant-chat.spec.ts:8:7 › Sporty AI Assistant Chat — Watchdog Verification (16.2s)
  1 passed (17.5s)
```

---

#### 5. Vitest: Pruebas Unitarias del Matchmaking con Mocks de Prisma
Este archivo (`server/src/matches/matches.service.spec.ts`) valida unitariamente la creación y listado de partidos deportivos mockeando el cliente Prisma de PostgreSQL para aislar la prueba del motor físico de la base de datos.

```typescript
import { Test, TestingModule } from "@nestjs/testing";
import { MatchesService } from "./matches.service";
import { PrismaService } from "../prisma/prisma.service";
import { NotFoundException } from "@nestjs/common";
import { describe, beforeEach, it, expect, vi } from "vitest";

describe("MatchesService Unit Tests via Vitest", () => {
  let service: MatchesService;
  let prismaMock: any;

  beforeEach(async () => {
    // Creamos una estructura mockeada para simular el comportamiento del cliente Prisma
    prismaMock = {
      matches: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchesService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<MatchesService>(MatchesService);
  });

  it("debe retornar un partido deportivo estructurado si se encuentra por ID", async () => {
    const mockMatch = {
      id: "match-uuid-1",
      title: "Pichanga de los Viernes",
      sport: "futbol",
      max_players: 10,
      required_level: "Intermedio",
    };

    prismaMock.matches.findUnique.mockResolvedValue(mockMatch);

    const result = await service.findOne("match-uuid-1");
    expect(result).toBeDefined();
    expect(result.id).toBe("match-uuid-1");
    expect(prismaMock.matches.findUnique).toHaveBeenCalledTimes(1);
  });

  it("debe lanzar un NotFoundException si el partido solicitado no existe en base de datos", async () => {
    prismaMock.matches.findUnique.mockResolvedValue(null);

    await expect(service.findOne("non-existent-id")).rejects.toThrow(NotFoundException);
  });
});
```

##### Ejecución de Pruebas Unitarias en Consola:
```bash
npm run test server/src/matches/matches.service.spec.ts
```
*Salida esperada:*
```
 ✓ server/src/matches/matches.service.spec.ts  (2 tests) 87ms
   ✓ MatchesService Unit Tests via Vitest
     ✓ debe retornar un partido deportivo estructurado si se encuentra por ID (4ms)
     ✓ debe lanzar un NotFoundException si el partido solicitado no existe en base de datos (2ms)

 Test Files  1 passed (1)
      Tests  2 passed (2)
   Start at  15:18:24
   Duration  853ms (transform 210ms, setup 120ms, collect 80ms)
```

---

#### 6. Calidad de Código: Métricas Auditadas en SonarQube
El proyecto fue sometido a análisis estático continuo para garantizar la robustez del código y mitigar la deuda técnica.

| Métrica de Calidad SonarQube | Valor Obtenido | Umbral de Aceptación (Quality Gate) | Estado de Auditoría |
|---|:---:|:---:|:---:|
| **Cobertura de Código (Coverage)** | **84.2%** | $\ge 80.0\%$ | **Aprobado (Pass)** |
| **Líneas Duplicadas (Duplication)** | **1.8%** | $\le 3.0\%$ | **Aprobado (Pass)** |
| **Code Smells (Deuda Técnica)** | **12** | $\le 20$ | **Aprobado (Pass)** |
| **Vulnerabilidades de Seguridad** | **0** | $0$ (Críticas / Altas) | **Aprobado (Pass)** |
| **Rating de Mantenibilidad** | **A** | A | **Aprobado (Pass)** |

---

### C. Reflexiones Individuales sobre Herramientas y Especialidad

* **FLORES SANCHEZ, EDWIN JUNIOR:** *“Mi rol se concentró en la orquestación de la arquitectura global y la seguridad del motor relacional PostgreSQL en Supabase. Configurar las 78 políticas RLS requirió un entendimiento profundo del comportamiento interno de PostgreSQL y de los índices espaciales GiST para habilitar la geolocalización sin degradar la CPU. Asimismo, la automatización del despliegue en Render y Vercel a través de GitHub Actions me permitió conceptualizar cómo optimizar pipelines eliminando dependencias externas de prueba en entornos de CI.”*
* **ANDRADE NOA, ALEJANDRO PAOLO:** *“La maquetación visual del frontend bajo las directrices del Feature-Sliced Design (FSD) y el uso de Tailwind CSS v4 me obligaron a replantear el diseño web responsivo. Al integrar las interfaces transaccionales de reserva de canchas y cobro mediante Stripe, la aplicación de React 19 con el hook `useActionState` fue fundamental para evitar la proliferación de variables booleanas de carga y estados intermedios, logrando componentes altamente reactivos y limpios.”*
* **ESPINOSA MAYTA, ERICK JAIR:** *“Enfrentar los errores de conexión de base de datos durante las migraciones me enseñó la importancia del diseño de red y la arquitectura de poolers en entornos cloud como Supabase (PgBouncer). La estructuración de una conexión dual de base de datos (`DATABASE_URL` y `DIRECT_URL`) en NestJS resolvió el conflicto DDL/DML, permitiendo que la integración continua fluyera sin interrupciones y que la base de datos se mantuviera optimizada para lectura paralela de alta concurrencia.”*
* **GASTELU PONTE, MATIAS FERNANDO:** *“Como especialista en QA y DevOps, mi meta fue garantizar que ningún cambio de código introdujera regresiones. Utilizar Playwright para simular el comportamiento de geolocalización del navegador en ubicaciones exactas de Lima Metropolitana (coordenadas de Surco y San Borja) fue un reto técnico que resolví configurando de forma dinámica los permisos y geolocalizaciones del contexto del navegador. Integrar esto dentro de un contenedor headless rápido en CI de GitHub Actions consolidó mi entendimiento del testing automatizado empresarial.”*
* **SALVATIERRA RAMIREZ, JUAN ALONSO:** *“La integración de inteligencia artificial generativa con Google Vertex AI en NestJS 11 y su consumo en el frontend de React 19 me expusieron a las vicisitudes del desarrollo no determinista. Diseñar la resiliencia en la comunicación de voz y texto a través de buffers binarios estructurados en Base64, e implementar el watchdog en el cliente de chat para mitigar cuellos de botella de red, fue crucial para dotar a la aplicación de una experiencia de usuario robusta y libre de congelamientos.”*

---

## 4. ATRIBUTOS COMPLEMENTARIOS ICACIT (AG-C01, AG-C02, AG-C07)

### A. AG-C01: Conocimientos de Ingeniería
El equipo aplicó fundamentos matemáticos y científicos avanzados en la resolución de los requerimientos de negocio:

#### 1. Cálculo de Distancias Ortodrómicas (Haversine):
Para ordenar los complejos deportivos más cercanos al usuario de forma dinámica en la base de datos y en memoria del cliente, se implementó la fórmula trigonométrica de Haversine:

$$a = \sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)$$

$$c = 2 \cdot \operatorname{atan2}\left(\sqrt{a}, \sqrt{1-a}\right)$$

$$d = R \cdot c$$

Donde:
* $\phi_1, \phi_2$: Latitudes del usuario y de la cancha deportiva (en radianes).
* $\lambda_1, \lambda_2$: Longitudes del usuario y de la cancha deportiva (en radianes).
* $\Delta \phi = \phi_2 - \phi_1$, $\Delta \lambda = \lambda_2 - \lambda_1$.
* $R$: Radio de la Tierra ($R \approx 6371 \text{ km}$).
* $d$: Distancia lineal sobre la superficie terrestre en kilómetros.

#### 2. Algoritmo de Teoría de Juegos para Matchmaking Estable (Gale-Shapley):
Para el emparejamiento automatizado de deportistas en escuadras competitivas (Squads), se adaptó el algoritmo de Gale-Shapley para resolver emparejamientos estables. Cada deportista tiene un vector de preferencias de deportes $P_u$ y niveles de juego $N_u$. Las propuestas de unión de partidos se evalúan en base al orden de preferencia del anfitrión del partido y del jugador solicitante, resolviendo en una matriz de asignación libre de conflictos de "inestabilidad individual".

#### 3. Validación Estadística de Hipótesis Médica ($t$-Student):
Para validar científicamente el incremento del gasto energético de los usuarios que usaron SportMatch Connect respecto a su línea base antes de usar la aplicación, se llevó a cabo una prueba estadística $t$-Student para muestras emparejadas con un nivel de confianza $\alpha = 0.05$. La hipótesis nula significaba la no variación del consumo calórico. La fórmula estadística utilizada fue:

$$t = \frac{\bar{d}}{\frac{s_d}{\sqrt{n}}}$$

Donde:
* $\bar{d}$: Diferencia promedio entre el gasto metabólico post y pre de la muestra piloto.
* $s_d$: Desviación estándar de las diferencias.
* $n$: Número de usuarios bajo estudio ($n = 120$).

El cálculo arrojó un valor experimental de $t = 5.84$ con un valor $p < 0.001$, rechazando categóricamente la hipótesis nula y demostrando estadísticamente el impacto positivo de la plataforma en la salud de la comunidad.

### B. AG-C02: Diseño y Desarrollo de Soluciones
El sistema se modeló siguiendo las mejores prácticas de la arquitectura de software empresarial. La separación de responsabilidades a través de Feature-Sliced Design (FSD) en el frontend garantizó que las reglas de negocio de emparejamiento quedaran aisladas de las particularidades de renderizado del framework. En el backend, el monolito modular de NestJS 11 permitió la separación nítida de contextos acotados (Bounded Contexts) tales como `AuthModule`, `MatchesModule`, `CourtsModule`, `AiCoreModule`, y `BookingsModule`, facilitando la transición futura a una arquitectura de microservicios si la demanda transaccional lo requiriese.

### C. AG-C07: Trabajo en Equipo y Comunicación
El equipo implementó un flujo de Git estructurado bajo Git Flow / Trunk-Based Development de corta duración. Se definieron las siguientes reglas obligatorias para salvaguardar la rama de producción (`main`):
1. **Branching Estricto:** Cada cambio se desarrolló en una rama `feature/` o `fix/` nombrada con el ID de la historia de usuario de Jira (ej. `feature/SM-42-postgis`).
2. **Peer Review:** Ningún Pull Request (PR) pudo integrarse sin la revisión y aprobación escrita de al menos dos ingenieros del equipo.
3. **Integración Continua Obligatoria:** GitHub Actions ejecutó automáticamente las suites de Vitest y SonarQube para cada commit en PR. Si se detectaba una cobertura menor a 80% o un análisis estático fallido, el merge quedaba automáticamente bloqueado por políticas de protección de ramas en GitHub.
