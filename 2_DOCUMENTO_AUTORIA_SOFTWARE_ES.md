# INFORME DE DERECHOS DE AUTOR, REGISTRO Y EVALUACIÓN DE SOFTWARE

## **SPORTMATCH CONNECT: PLATAFORMA INTEGRAL DE MATCHMAKING DEPORTIVO, RED SOCIAL, GESTIÓN DE TORNEOS Y MONETIZACIÓN B2B/B2C CON INTELIGENCIA ARTIFICIAL EN EL BORDE**

**Memoria Descriptiva Técnica y Registro de Soporte Lógico (Programa de Ordenador) ante la Dirección de Derecho de Autor de INDECOPI**  
**Universidad San Ignacio de Loyola (USIL) — Facultad de Ingeniería e Inteligencia Artificial**  
**Carrera:** Ingeniería de Sistemas de Información / Ingeniería de Software  
**Curso:** Proyecto Final de Carrera III (Bloque: FC-PREISF10B01N)  
**Docente Asesor:** Ing. Kenny Disney Neira Neira (kenny.neira@usil.pe)  

---

## FICHA DE EVALUACIÓN PARA PROPUESTAS DE SOFTWARE
*(Según Plantilla Oficial USIL Ficha de Evaluación Soft. 2025-02.docx)*

### 1. DATOS GENERALES DE LA EVALUACIÓN
- **Fecha de Evaluación:** 28 de junio de 2026.
- **Marcar con una "X" el objetivo de la presente ficha:**  
  [X] Evaluación de la propuesta de invención y desarrollo de software para registro de derechos de autor y depósito de soporte lógico ante Indecopi.
- **Dependencia que Coordina:** Facultad de Ingeniería e Inteligencia Artificial / Carrera de Ingeniería de Sistemas de Información / Carrera de Ingeniería de Software.
- **Línea de Investigación USIL (R. N° 074-2023/G):** Línea 2 — Tecnología de la información.

### 2. EQUIPO DE INVESTIGACIÓN / DESARROLLO TECNOLÓGICO / INNOVACIÓN

| N° | Nombres y Apellidos | Cargo / Rol en el Proyecto | Correo Institucional | Teléfono Contacto | DNI | Dirección DNI |
|---|---|---|---|---|---|---|
| 1 | FLORES SANCHEZ, EDWIN JUNIOR | Scrum Master / Arquitecto Principal | edwin.floress@usil.pe | 987654321 | 74125896 | Av. La Molina 123, La Molina, Lima |
| 2 | ANDRADE NOA, ALEJANDRO PAOLO | Desarrollador Fullstack / UI Specialist | alejandro.andrade@usil.pe | 987654322 | 75123698 | Ca. Los Olivos 456, Surco, Lima |
| 3 | ESPINOZA MAYTA, ERICK JAIR | Desarrollador Backend & Seguridad | erick.espinozam@usil.pe | 987654323 | 76124587 | Av. Javier Prado Este 789, San Borja, Lima |
| 4 | GASTELU PONTE, MATIAS FERNANDO | QA & DevOps Engineer / SRE | matias.gastelu@usil.pe | 987654324 | 77125698 | Jr. Las Flores 321, Miraflores, Lima |
| 5 | SALVATIERRA RAMIREZ, JUAN ALONSO | Desarrollador Frontend & IA Specialist | juan.salvatierra@usil.pe | 987654325 | 78123987 | Av. Universitaria 654, San Miguel, Lima |

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

## MEMORIA DESCRIPTIVA Y PROTECCIÓN DE MÓDULOS DE SOFTWARE

### Módulo 1: Procedimiento Algorítmico de Matchmaking Predictivo Multivariable
Se establece como objeto de protección de soporte lógico el procedimiento algorítmico distribuido para el emparejamiento predictivo de deportistas amateurs, caracterizado por calcular en tiempo real un indicador de compatibilidad ponderado dadas las coordenadas geográficas de los usuarios $A(\phi_1, \lambda_1)$ y $B(\phi_2, \lambda_2)$:

$$
S_{\text{compatibilidad}} = 0.35 \cdot S_{\text{cercanía}} + 0.30 \cdot S_{\text{deporte}} + 0.20 \cdot S_{\text{nivel}} + 0.10 \cdot S_{\text{disponibilidad}} + 0.05 \cdot S_{\text{trust}}
$$

Donde $S_{\text{cercanía}}$ se obtiene mediante la evaluación ortodrómica de Haversine normalizada exponencialmente frente a un radio máximo de 50 kilómetros.

### Módulo 2: Arquitectura de Moderación Híbrida en el Borde para Redes Sociales
Se protege la arquitectura de moderación de imágenes multimedia compuesta por un filtro de primera línea ejecutado en el navegador del cliente mediante TensorFlow.js y NSFWJS, el cual intercepta y descarta cargas de imágenes con probabilidad explícita $> 0.80$ antes del consumo de ancho de banda de red, acoplado en segundo nivel con un modelo Ensemble en el servidor NestJS.

### Módulo 3: Definición del Esquema Relacional DDL y Seguridad RLS en PostgreSQL
Se protege la estructura relacional y las políticas de seguridad implementadas en PostgreSQL:

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

## ADMINISTRACIÓN DE LA INVESTIGACIÓN Y PRESUPUESTO
*(Según Plantilla 251011 Informe de Derechos Autor.docx)*

### 1. Recursos de Capital Humano
| N° | Apellidos y Nombres | Rol | Descripción de Funciones |
|---|---|---|---|
| 1 | FLORES SANCHEZ, EDWIN JUNIOR | Scrum Master / Arquitecto | Liderazgo de proyecto y arquitectura software |
| 2 | ANDRADE NOA, ALEJANDRO PAOLO | Fullstack Dev / UI Specialist | Desarrollo de interfaz y experiencia de usuario |
| 3 | ESPINOZA MAYTA, ERICK JAIR | Backend & Security Dev | Desarrollo NestJS, Prisma y RLS |
| 4 | GASTELU PONTE, MATIAS FERNANDO | QA & DevOps / SRE | Pruebas Playwright, Vitest y CI/CD |
| 5 | SALVATIERRA RAMIREZ, JUAN ALONSO | Frontend & AI Dev | Desarrollo React 19 y Vertex AI |

### 2. Presupuesto Detallado del Proyecto

#### Tabla 01: Presupuesto de Capital Humano
| N° | Apellidos y Nombres | Costo Mensual (S/.) | Meses | Costo Total (S/.) |
|---|---|---|---|---|
| 1 | FLORES SANCHEZ, EDWIN JUNIOR | 3,200.00 | 4 | 12,800.00 |
| 2 | ANDRADE NOA, ALEJANDRO PAOLO | 3,200.00 | 4 | 12,800.00 |
| 3 | ESPINOZA MAYTA, ERICK JAIR | 3,200.00 | 4 | 12,800.00 |
| 4 | GASTELU PONTE, MATIAS FERNANDO | 3,200.00 | 4 | 12,800.00 |
| 5 | SALVATIERRA RAMIREZ, JUAN ALONSO | 3,200.00 | 4 | 12,800.00 |
| **Total Capital Humano** | | | | **64,000.00** |

#### Tabla 02: Presupuesto de Materiales
| N° | Descripción | Unid. | Cant. | Costo Unit. (S/.) | Costo Total (S/.) |
|---|---|---|---|---|---|
| 1 | Kit de oficina (Papelería, tinta, imp.) | Unid. | 1 | 100.00 | 100.00 |
| **Total Materiales** | | | | | **100.00** |

#### Tabla 03: Presupuesto de Equipos y Depreciación
*(Fórmula: Costo Depreciado = (Costo Equipo / 36 meses de vida útil) * 4 meses de desarrollo)*

| N° | Descripción del Equipo | Costo Equipo (S/.) | Vida Útil (Meses) | Costo Depreciado 4 Meses (S/.) |
|---|---|---|---|---|
| 1 | Laptop Asus ROG Strix i7 16GB RAM | 4,000.00 | 36 | 444.44 |
| 2 | Laptop Lenovo Legion 5 Ryzen 7 | 4,200.00 | 36 | 466.67 |
| 3 | Laptop HP Victus i5 16GB RAM | 3,800.00 | 36 | 422.22 |
| 4 | Laptop Dell G15 i7 16GB RAM | 4,000.00 | 36 | 444.44 |
| 5 | Laptop Acer Nitro 5 i5 16GB RAM | 4,000.00 | 36 | 444.44 |
| **Total Equipos Depreciados** | | | | **2,222.20** |

#### Tabla 04: Presupuesto de Servicios y Licencias
| N° | Descripción del Servicio | Tiempo (Meses) | Costo Mensual (S/.) | Costo Total (S/.) |
|---|---|---|---|---|
| 1 | Telefonía e Internet Banda Ancha | 4 | 150.00 | 600.00 |
| 2 | Suscripción Scopus / Base Académica | 4 | 50.00 | 200.00 |
| 3 | MS Office 365 e IDEs Licencias | 4 | 30.00 | 120.00 |
| 4 | Energía Eléctrica (Consumo Equipos) | 4 | 70.00 | 280.00 |
| 5 | Nube Render Cloud, Vercel & Vertex AI | 4 | 26.00 | 104.00 |
| **Total Servicios** | | | | **1,304.00** |

#### Tabla 05: Consolidado de Costos Directos e Totales
| N° | Categoría de Gasto | Costo Total (S/.) |
|---|---|---|
| 1 | Capital Humano | 64,000.00 |
| 2 | Materiales | 100.00 |
| 3 | Equipos (Depreciación 4 Meses) | 2,222.20 |
| 4 | Servicios | 1,304.00 |
| **Subtotal - Costos Directos** | | **67,626.20** |
| **Imprevistos y Contingencias (10%)** | | **6,762.62** |
| **COSTO TOTAL DEL PROYECTO DE INVENCIÓN** | | **74,388.82** |

### 3. Fuentes de Financiamiento
| N° | Fuente de Financiamiento | Aporte (%) | Monto (PEN S/.) |
|---|---|---|---|
| 1 | Investigadores (Tesistas / Estudiantes) | 100% | 74,388.82 |
| 2 | Universidad San Ignacio de Loyola (USIL) | 0% | 0.00 |
| **Total** | | **100%** | **74,388.82** |

---

## ANEXO A: DEPÓSITO DE CÓDIGO FUENTE (SEGUN NORMAS INDECOPI)

### A. Estructura de Directorios del Soporte Lógico
```text
sportmatch-connect/
├── package.json
├── vite.config.ts
├── src/
│   ├── app/
│   │   └── App.tsx
│   ├── features/
│   │   └── matchmaking/
│   │       └── MatchCard.tsx
│   └── shared/
│       └── api/
└── server/
    ├── prisma/
    │   └── schema.prisma
    └── src/
        ├── main.ts
        └── matchmaking/
            └── matchmaking.service.ts
```

### B. Muestras del Código Fuente Principal (Primeros Folios)
```typescript
// Fragmento Folio 01: Punto de Entrada Server NestJS (server/src/main.ts)
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  await app.listen(process.env.PORT || 3000);
}
bootstrap();
```
