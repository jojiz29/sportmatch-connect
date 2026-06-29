# INFORME DE DERECHOS DE AUTOR, REGISTRO Y EVALUACIÓN DE SOFTWARE

## **SPORTMATCH CONNECT: PLATAFORMA INTEGRAL DE MATCHMAKING DEPORTIVO, RED SOCIAL, GESTIÓN DE TORNEOS Y MONETIZACIÓN B2B/B2C CON INTELIGENCIA ARTIFICIAL EN EL BORDE**

**Documento Técnico de Registro de Propiedad Intelectual e Invención de Software ante INDECOPI**  
**Universidad San Ignacio de Loyola (USIL) — Facultad de Ingeniería e Inteligencia Artificial**  
**Curso:** Proyecto Final de Carrera III (Bloque: FC-PREISF10B01N)  
**Docente Asesor:** Ing. Kenny Disney Neira Neira (kenny.neira@usil.pe)  

---

## FICHA DE EVALUACIÓN PARA PROPUESTAS DE SOFTWARE (Según Plantilla Oficial USIL Ficha de Evaluación Soft. 2025-02.docx)

### 1. DATOS GENERALES DE LA EVALUACIÓN
- **Objetivo de la Ficha:** [X] Evaluación de la propuesta de invención y desarrollo de software para registro de derechos de autor y patente de software ante Indecopi.
- **Fecha de Evaluación:** 28 de junio de 2026.
- **Dependencia que Coordina:** Facultad de Ingeniería e Inteligencia Artificial / Carrera de Ingeniería de Sistemas de Información / Carrera de Ingeniería de Software.
- **Línea de Investigación USIL (R. N° 074-2023/G):** Línea 2 — Tecnología de la información.

### 2. INTEGRANTES DEL EQUIPO INVESTIGADOR Y AUTORES
| N° | Código | Apellidos y Nombres | Carrera | Rol en la Invención | Email Institucional |
|---|---|---|---|---|---|
| 1 | 2111716 | FLORES SANCHEZ, EDWIN JUNIOR | ING SIST. INFORMACION | Scrum Master / Arquitecto Principal | edwin.floress@usil.pe |
| 2 | 2010830 | ANDRADE NOA, ALEJANDRO PAOLO | ING SIST. INFORMACION | Desarrollador Fullstack / UI Specialist | alejandro.andrade@usil.pe |
| 3 | 2010029 | ESPINOZA MAYTA, ERICK JAIR | ING. SOFTWARE | Desarrollador Backend & Seguridad | erick.espinozam@usil.pe |
| 4 | 2121043 | GASTELU PONTE, MATIAS FERNANDO | ING SIST. INFORMACION | QA & DevOps Engineer / SRE | matias.gastelu@usil.pe |
| 5 | 2121274 | SALVATIERRA RAMIREZ, JUAN ALONSO | ING SIST. INFORMACION | Desarrollador Frontend & IA Specialist | juan.salvatierra@usil.pe |

---

### 3. DESCRIPCIÓN TÉCNICA Y DETALLADA DE LA PROPUESTA (Mínimo 250 Palabras)

SportMatch Connect es una solución tecnológica distribuida de arquitectura multicapa diseñada para resolver la fragmentación logística, social y económica que afecta a la práctica del deporte amateur en Lima Metropolitana y Latinoamérica. La propuesta técnica integra un cliente web reactivo desarrollado en React 19 con TypeScript organizado estrictamente bajo la metodología Feature-Sliced Design (FSD), la cual establece fronteras de dependencia unidireccionales entre seis capas funcionales (`app`, `routes`, `widgets`, `features`, `entities` y `shared`), eliminando acoplamientos circulares y optimizando el renderizado mediante Concurrent Features y Transitions API.

El backend del sistema se estructuró como un monolito modular en NestJS 11 con Prisma ORM, enlazado a una base de datos PostgreSQL 15 administrada en Supabase Cloud. La capa de persistencia incorpora extensiones espaciales PostGIS para el cálculo de distancia ortodrómica y 78 políticas de Row Level Security (RLS) que garantizan el aislamiento tenant y la protección de datos a nivel de fila. La invención incorpora cuatro motores centrales:
1. **Motor de Matchmaking Predictivo:** Aplica un algoritmo multivariable ponderado ($S_{\text{compatibilidad}} \in [0, 100]$) que procesa la distancia geográfica Haversine, coincidencia binaria de deporte, similitud de destreza Elo, solapamiento de franjas horarias y Trust Score auditado.
2. **Red Social Deportiva Geolocalizada:** Provee feeds multimedia en tiempo real, comentarios anidados, reacciones personalizadas, gestión de equipos (Squads) y mensajería WebSocket instantánea mediante Supabase Realtime.
3. **Motor de Reservas y Economía Gamificada:** Integra un mapa interactivo basado en Leaflet sobre 433 complejos deportivos mapeados en Lima Metropolitana, división automática de pagos con la pasarela Stripe (soles PEN) y la moneda virtual FitCoins.
4. **Asistente Conversacional en el Borde:** Denominado "Sporty", está impulsado por Google Vertex AI (Gemini 2.5 Flash), con procesamiento de voz bidireccional (STT/TTS) y un pipeline de moderación de contenido híbrido (NSFWJS en el cliente frontend y Ensemble Model en el servidor).

---

### 4. ORIGEN DEL CÓDIGO FUENTE Y DIVULGACIONES PREVIAS
- **Origen del Código Fuente:** Desarrollado íntegramente por el equipo de investigación durante el cuatrimestre 2026-I. El código incorpora librerías de código abierto bajo licencia MIT (React, NestJS, Prisma, Leaflet, TailwindCSS).
- **Descripción de Divulgaciones:** El código fuente se encuentra alojado y versionado en el repositorio público de GitHub: `https://github.com/jojiz29/sportmatch-connect`.

---

## MEMORIA DESCRIPTIVA Y REIVINDICACIONES DE INVENCIÓN DE SOFTWARE

### Reivindicación 1: Algoritmo de Matchmaking Predictivo Multivariable
Se reivindica como invención de software el procedimiento algorítmico distribuido para el emparejamiento predictivo de deportistas amateurs, caracterizado por calcular en tiempo real un indicador de compatibilidad ponderado dadas las coordenadas geográficas de los usuarios $A(\phi_1, \lambda_1)$ y $B(\phi_2, \lambda_2)$:

$$
S_{\text{compatibilidad}} = 0.35 \cdot S_{\text{cercanía}} + 0.30 \cdot S_{\text{deporte}} + 0.20 \cdot S_{\text{nivel}} + 0.10 \cdot S_{\text{disponibilidad}} + 0.05 \cdot S_{\text{trust}}
$$

Donde $S_{\text{cercanía}}$ se obtiene mediante la evaluación ortodrómica de Haversine normalizada exponencialmente frente a un radio máximo de 50 kilómetros.

### Reivindicación 2: Sistema de Moderación Híbrida en el Borde para Redes Sociales Deportivas
Se reivindica la arquitectura de moderación de imágenes multimedia compuesta por un filtro de primera línea ejecutado en el navegador del cliente mediante TensorFlow.js y NSFWJS, el cual intercepta y descarta cargas de imágenes con probabilidad explícita $> 0.80$ antes del consumo de ancho de banda de red, acoplado en segundo nivel con un modelo Ensemble en el servidor NestJS.

### Reivindicación 3: Definición del Esquema Relacional DDL y Seguridad RLS en PostgreSQL
Se reivindica la arquitectura de persistencia y seguridad relacional mediante los siguientes scripts DDL y políticas SQL implementadas en PostgreSQL:

```sql
-- DDL Tabla 01: Perfiles Deportivos de Usuario
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    favorite_sport VARCHAR(50) NOT NULL,
    elo_rating INT DEFAULT 1200 NOT NULL,
    trust_score DECIMAL(5,2) DEFAULT 100.00 NOT NULL,
    location GEOGRAPHY(POINT, 4326),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Politica RLS 01: Lectura publica de perfiles deportivos activos
CREATE POLICY "Allow public read access for active profiles"
ON public.profiles
FOR SELECT
USING (auth.role() = 'authenticated');

-- Politica RLS 02: Modificacion exclusiva por el propietario del perfil
CREATE POLICY "Allow individual update for profile owners"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

-- Politica RLS 03: Aislamiento tenant de transacciones en billetera FitCoins
CREATE POLICY "Strict isolation for user wallet transactions"
ON public.wallet_transactions
FOR ALL
USING (auth.uid() = user_id);
```

---

## ADMINISTRACIÓN DE LA INVESTIGACIÓN Y PRESUPUESTO (Según Plantilla 251011 Informe de Derechos Autor.docx)

### 1. Recursos de Capital Humano
| N° | Código | Apellidos y Nombres | Carrera | Rol | Descripción de Funciones |
|---|---|---|---|---|---|
| 1 | 2111716 | FLORES SANCHEZ, EDWIN JUNIOR | ING SIST. INFORMACION | Scrum Master / Arquitecto | Liderazgo de proyecto y arquitectura software |
| 2 | 2010830 | ANDRADE NOA, ALEJANDRO PAOLO | ING SIST. INFORMACION | Fullstack Dev / UI Specialist | Desarrollo de interfaz y experiencia de usuario |
| 3 | 2010029 | ESPINOZA MAYTA, ERICK JAIR | ING. SOFTWARE | Backend & Security Dev | Desarrollo NestJS, Prisma y RLS |
| 4 | 2121043 | GASTELU PONTE, MATIAS FERNANDO | ING SIST. INFORMACION | QA & DevOps / SRE | Pruebas Playwright, Vitest y CI/CD |
| 5 | 2121274 | SALVATIERRA RAMIREZ, JUAN ALONSO | ING SIST. INFORMACION | Frontend & AI Dev | Desarrollo React 19 y Vertex AI |

### 2. Presupuesto Consolidado del Proyecto
| N° | Categoría de Gasto | Costo Total (PEN S/.) |
|---|---|---|
| 1 | Capital Humano (Honorarios de 5 Investigadores - 4 Meses) | 64,000.00 |
| 2 | Materiales y Útiles de Escritorio | 100.00 |
| 3 | Equipos Informáticos (Depreciación de 5 Laptops) | 2,222.20 |
| 4 | Servicios (Conectividad, Nube Render, Vercel, Vertex AI, Office 365) | 1,304.00 |
| **Subtotal - Costos Directos** | | **67,626.20** |
| **Imprevistos y Contingencias (10%)** | | **6,762.62** |
| **COSTO TOTAL DEL PROYECTO DE INVENCIÓN** | | **74,388.82** |

### 3. Fuentes de Financiamiento
| N° | Fuente de Financiamiento | Aporte (%) | Monto (PEN S/.) |
|---|---|---|---|
| 1 | Investigadores (Autores/Estudiantes) | 100% | 74,388.82 |
| 2 | Universidad San Ignacio de Loyola (USIL) | 0% | 0.00 |
| **Total** | | **100%** | **74,388.82** |
