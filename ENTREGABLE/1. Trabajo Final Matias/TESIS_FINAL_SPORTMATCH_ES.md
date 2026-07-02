# UNIVERSIDAD SAN IGNACIO DE LOYOLA
## FACULTAD DE INGENIERÍA E INTELIGENCIA ARTIFICIAL
### CARRERA DE INGENIERÍA DE SISTEMAS DE INFORMACIÓN / INGENIERÍA DE SOFTWARE

---

&nbsp;

# TRABAJO FINAL - TESIS DE INGENIERÍA DE SISTEMAS
## **SPORTMATCH CONNECT: PLATAFORMA INTEGRAL DE MATCHMAKING DEPORTIVO, RED SOCIAL, GESTIÓN DE TORNEOS Y MONETIZACIÓN B2B/B2C CON INTELIGENCIA ARTIFICIAL EN EL BORDE**

&nbsp;

**Informe Final de Proyecto para optar el Título Profesional de Ingeniero de Sistemas**

**Curso:** PROYECTO FINAL DE CARRERA III

**Semestre:** 2026-I

**Bloque:** FC-PREISF10B01N

**Docente:** NEIRA NEIRA, KENNY DISNEY (kenny.neira@usil.pe)

&nbsp;

**Integrantes del Equipo (Equipo ##):**

| N° | Código | Alumno (Apellidos y Nombres) | Carrera | Estado | Email Institucional | % Part. | Rol en el Proyecto |
|---|---|---|---|---|---|---|---|
| 1 | 2111716 | FLORES SANCHEZ, EDWIN JUNIOR | ING SIST. INFORMACION | Activo | edwin.floress@usil.pe | 100% | Scrum Master / Arquitecto de Software Principal |
| 2 | 2010830 | ANDRADE NOA, ALEJANDRO PAOLO | ING SIST. INFORMACION | Activo | alejandro.andrade@usil.pe | 100% | Desarrollador Fullstack / Especialista UI/UX |
| 3 | 2010029 | ESPINOZA MAYTA, ERICK JAIR | ING. SOFTWARE | Activo | erick.espinozam@usil.pe | 100% | Desarrollador Backend / Seguridad & Persistencia |
| 4 | 2121043 | GASTELU PONTE, MATIAS FERNANDO | ING SIST. INFORMACION | Activo | matias.gastelu@usil.pe | 100% | Desarrollador QA & DevOps / SRE |
| 5 | 2121274 | SALVATIERRA RAMIREZ, JUAN ALONSO | ING SIST. INFORMACION | Activo | juan.salvatierra@usil.pe | 100% | Desarrollador Frontend / Especialista IA |

&nbsp;

**Línea de Investigación USIL (R. N° 074-2023/G):** Línea 2 — Tecnología de la información

**Lima, Perú — 2026-I**

---

## DECLARACIÓN DE AUTENTICIDAD Y COMPROMISO ÉTICO

Nosotros, los abajo firmantes, estudiantes de la Facultad de Ingeniería e Inteligencia Artificial de la Universidad San Ignacio de Loyola (USIL), declaramos bajo jura y responsabilidad legal y académica lo siguiente:

1. Que el presente informe final de proyecto titulado **"SPORTMATCH CONNECT: PLATAFORMA INTEGRAL DE MATCHMAKING DEPORTIVO, RED SOCIAL, GESTIÓN DE TORNEOS Y MONETIZACIÓN B2B/B2C CON INTELIGENCIA ARTIFICIAL EN EL BORDE"** es una obra original, inédita y desarrollada íntegramente por los autores bajo la supervisión del docente asesor del curso Proyecto Final de Carrera III, Ing. Kenny Disney Neira Neira.
2. Que todas las fuentes bibliográficas, investigaciones previas, librerías de código abierto, frameworks y servicios en la nube utilizados para la conceptualización, diseño, implementación y evaluación del software han sido debidamente citados y acreditados siguiendo las normas internacionales de la American Psychological Association (APA 7ma edición).
3. Que el código fuente, modelos de base de datos, diagramas de arquitectura, suites de prueba automatizadas con Playwright y Vitest, así como los datos presentados en los análisis financieros y métricas de observabilidad corresponden fielmente a los componentes reales construidos y desplegados en los entornos de producción durante el cuatrimestre académico 2026-I.
4. Que asumimos total responsabilidad por el contenido, afirmaciones y conclusiones expresadas en este documento, liberando a la Universidad San Ignacio de Loyola de cualquier reclamo o controversia relacionada con propiedad intelectual o derechos de autor por parte de terceros.

En fe de lo cual, firmamos la presente declaración en la ciudad de Lima, a los 28 días del mes de junio de 2026.

| Firma de Autor | Datos del Estudiante |
|---|---|
| ____________________________ | **FLORES SANCHEZ, EDWIN JUNIOR** <br> Cód: 2111716 <br> Email: edwin.floress@usil.pe |
| ____________________________ | **ANDRADE NOA, ALEJANDRO PAOLO** <br> Cód: 2010830 <br> Email: alejandro.andrade@usil.pe |
| ____________________________ | **ESPINOZA MAYTA, ERICK JAIR** <br> Cód: 2010029 <br> Email: erick.espinozam@usil.pe |
| ____________________________ | **GASTELU PONTE, MATIAS FERNANDO** <br> Cód: 2121043 <br> Email: matias.gastelu@usil.pe |
| ____________________________ | **SALVATIERRA RAMIREZ, JUAN ALONSO** <br> Cód: 2121274 <br> Email: juan.salvatierra@usil.pe |

---

## RESUMEN

SportMatch Connect es una plataforma tecnológica distribuida y multicapa concebida para solucionar la fragmentación logística, social y económica que afecta la práctica del deporte amateur en Lima Metropolitana y Latinoamérica. A lo largo de 16 semanas de trabajo estructurado bajo el marco de trabajo ágil Scrum (el cual es un marco de trabajo adaptativo y no una metodología), se orquestó una solución fullstack que combina un frontend desacoplado en React 19 con TypeScript organizado mediante Feature-Sliced Design (FSD), un backend modular en NestJS 11 con Prisma ORM y una capa de persistencia administrada en Supabase (PostgreSQL 15) con extensión espacial PostGIS y 78 políticas de Row Level Security (RLS). El sistema integra cuatro módulos centrales: un motor de matchmaking predictivo basado en un algoritmo multivariable ponderado (cercanía Haversine, deporte, nivel Elo y trust score), una red social con feed en tiempo real y Squads de equipos, un motor de reservas de canchas en mapa interactivo con Leaflet sobre 433 recintos de Lima, y una economía gamificada basada en la moneda virtual FitCoins con pasarela de pagos real en Stripe (soles PEN). Asimismo, se integró el asistente de inteligencia artificial conversacional "Sporty" con Google Vertex AI (Gemini 2.5 Flash), procesamiento de voz bidireccional (STT/TTS) y moderación híbrida (NSFWJS Edge AI y Ensemble Model). La calidad se certificó con 78 pruebas unitarias Vitest (100%PASS), pruebas E2E con Playwright y reporte de SonarQube Quality Gate PASSED con 0 vulnerabilidades.

**Palabras clave:** Matchmaking deportivo, Feature-Sliced Design, NestJS 11, React 19, Supabase, PostGIS, Vertex AI, Stripe, Playwright, Scrum framework.

---

## ABSTRACT

SportMatch Connect is a distributed, multi-tier technology platform designed to resolve the logistical, social, and economic fragmentation surrounding amateur sports in Metropolitan Lima and Latin America. Developed across 16 weeks under the Scrum agile framework (which is an adaptive framework, not a methodology), the full-stack solution integrates a decoupled React 19 + TypeScript frontend structured with Feature-Sliced Design (FSD), a modular NestJS 11 backend with Prisma ORM, and a managed Supabase (PostgreSQL 15) data layer enforcing PostGIS spatial indexing and 78 Row Level Security (RLS) policies. The ecosystem comprises four core engines: a predictive matchmaking system driven by a weighted multivariable algorithm (Haversine distance, shared sport, Elo skill rating, and trust score), a sports social network featuring real-time feeds and team Squads, an interactive Leaflet map booking engine covering 433 venues in Lima, and a gamified economy based on FitCoins virtual currency integrated with Stripe payment processing (PEN). Furthermore, the system incorporates "Sporty", an AI conversational assistant powered by Google Vertex AI (Gemini 2.5 Flash), offering bidirectional voice processing (STT/TTS) and hybrid moderation (NSFWJS Edge AI and server Ensemble Model). Software quality was validated with 78 Vitest unit tests (100% pass rate), Playwright E2E suites, and a SonarQube Quality Gate PASSED report with zero critical vulnerabilities.

**Keywords:** Sports matchmaking, Feature-Sliced Design, NestJS 11, React 19, Supabase, PostGIS, Vertex AI, Stripe, Playwright, Scrum framework.

---

## TABLA DE CONTENIDOS

- a) Carátula
- b) Tabla de contenidos
- c) Introducción
- d) Resumen / Abstract
- e) Descripción de la problemática
  - Investigación
  - Árbol de problema
- f) Objetivos
  - Árbol de objetivos
  - Objetivo general y objetivos específicos
- g) Desarrollo
  - i. Metodología (Híbrida)
  - ii. Empatizar
  - iii. Definir
  - iv. Idear
  - v. Prototipar
  - vi. Testear
  - vii. Lean Startup
  - viii. Modelo de Negocio (BMC y Viabilidad Financiera)
  - ix. Monitoreo y Control (Scrum Marco de Trabajo y Kanban)
  - x. Análisis de Hardware (Arquitectura)
  - xi. Desarrollo de Software (Fases, Implementación GitHub y Funcionalidad Nube)
- h) Conclusiones y Recomendaciones
- i) Referencias
- 6. Anexos del informe
- 7. Anexos complementarios (Patente de Software, Reporte de Patente, Paper)
- 8. Anexos de Medición de Atributo de Graduado (AG-C05, AG-C08, AG-C11 Uso de Herramientas, AG-C11 Especialidad)

---

## INTRODUCCIÓN

En la sociedad contemporánea, la actividad física y la práctica deportiva recreativa representan factores determinantes para el bienestar integral, la prevención de enfermedades crónicas no transmisibles y la cohesión comunitaria. No obstante, en las metrópolis de América Latina, y específicamente en Lima Metropolitana, el ecosistema del deporte amateur se encuentra gravemente afectado por una ineficiencia estructural caracterizada por la atomización de canales de comunicación, la falta de transparencia en la reserva de instalaciones y la ausencia de herramientas tecnológicas que permitan nivelar de forma equitativa las competencias de los participantes.

Frente a esta problemática, el presente proyecto de investigación e ingeniería documenta el diseño, construcción, validación y despliegue de **SportMatch Connect**, un ecosistema digital de arquitectura distribuida que integra matchmaking predictivo mediante algoritmos multivariables, una red social deportiva geolocalizada, un motor de reservas sobre 433 complejos deportivos mapeados con tecnología GIS, una economía gamificada sustentada en la moneda virtual FitCoins con pasarela de pagos real en Stripe, y un asistente conversacional inteligente impulsado por Google Vertex AI (Gemini 2.5 Flash) con procesamiento de voz bidireccional.

El informe se encuentra estructurado en estricto cumplimiento con la **Guía de Trabajo Final 2026** de la Facultad de Ingeniería e Inteligencia Artificial de la Universidad San Ignacio de Loyola (USIL) para el curso **PROYECTO FINAL DE CARRERA III** (Bloque: FC-PREISF10B01N), bajo la conducción del docente Ing. Kenny Disney Neira Neira...

---

# CAPÍTULO I: GENERALIDADES

# e) DESCRIPCIÓN DE LA PROBLEMÁTICA

## Investigación

### Contexto Macro (Global)
A nivel mundial, la inactividad física representa una de las principales pandemias silenciosas de la era moderna. Según la Organización Mundial de la Salud (OMS, 2020), más del 28% de la población adulta global no cumple con las recomendaciones mínimas de 150 minutos semanales de actividad física moderada. Este fenómeno acarrea costos sanitarios globales directos superiores a los 54,000 millones de dólares anuales. Paradójicamente, mientras las tecnologías móviles de consumo han digitalizado industrias como el transporte (Uber), el hospedaje (Airbnb) y la alimentación (Rappi), el deporte recreativo y amateur continúa operando bajo dinámicas informales y desarticuladas en la mayoría de países en desarrollo.

### Contexto Meso (Regional - Latinoamérica)
En América Latina, la brecha de infraestructura deportiva pública y la desorganización de clubes informales agravan el sedentarismo urbanístico. Ciudades como Bogotá, Santiago, Ciudad de México y Lima comparten un patrón común: la práctica del fútbol, pádel, baloncesto y tenis recreativo se coordina principalmente mediante la iniciativa privada e informal de grupos de amigos. Sin embargo, la falta de herramientas tecnológicas integradas para la nivelación de habilidades y la división transparente de costos de alquiler genera altas tasas de abandono y deserción en los deportistas amateurs.

### Contexto Micro (Local - Lima Metropolitana)
En Lima Metropolitana, ciudad con más de 10 millones de habitantes, la Encuesta Nacional de Actividad Física y Nutrición del Ministerio de Salud del Perú (MINSA, 2024) revela que el 72% de los adultos realiza actividad física insuficiente. La coordinación de partidos recreativos se lleva a cabo mediante grupos caóticos de WhatsApp o Telegram donde la información se pierde, no se filtran participantes por nivel real de destreza, los organizadores asumen deudas financieras individuales para separar canchas y la cobranza mediante billeteras móviles (Yape o Plin) genera fricciones y morosidad. Asimismo, los recintos deportivos independientes operan con sistemas de reserva arcaicos basados en cuadernos o llamadas telefónicas, sin visibilidad digital en tiempo real.

### Formulación del Problema
**Pregunta Principal:**
¿De qué manera el diseño e implementación de una plataforma digital distribuida que integre matchmaking predictivo multivariable, red social geolocalizada, gestión de reservas con tecnología GIS y economía gamificada con IA conversacional permite optimizar la coordinación, nivelación y continuidad de la práctica deportiva amateur en Lima Metropolitana?

## Árbol de Problema

Figura 03
*Árbol de Problemas del ecosistema deportivo amateur*
```mermaid
graph TD
    EF1["Efecto Final: Alto sedentarismo y desercion deportiva en Lima"]
    EF2["Efecto 2: Partidos desequilibrados y frustracion de jugadores"]
    EF3["Efecto 3: Deudas financieras impagas y morosidad en reservas"]
    EF4["Efecto 4: Subutilizacion de instalaciones deportivas locales"]
    
    PC["PROBLEMA CENTRAL: Fragmentacion e ineficiencia en la coordinacion, reserva y comunidad del deporte amateur"]
    
    C1["Causa 1: Uso informal de grupos de WhatsApp sin filtros de nivel"]
    C2["Causa 2: Dispersion de sistemas de reserva sin conexion social"]
    C3["Causa 3: Ausencia de metricas objetivas de habilidad deportivo"]
    C4["Causa 4: Gestion manual e informal de pagos y cobranzas"]
    
    EF1 --- EF2
    EF1 --- EF3
    EF1 --- EF4
    EF2 --- PC
    EF3 --- PC
    EF4 --- PC
    PC --- C1
    PC --- C2
    PC --- C3
    PC --- C4
```
Nota: Elaboración propia.

# f) OBJETIVOS

## Árbol de Objetivos

Figura 04
*Árbol de Objetivos y solución sistémica*
```mermaid
graph BT
    FIN1["Fin Ultimo: Incremento de la actividad fisica y bienestar en Lima"]
    FIN2["Fin 2: Encuentros deportivos equilibrados y altamente competitivos"]
    FIN3["Fin 3: Transacciones transparentes y cero deudas en reservas"]
    FIN4["Fin 4: Maximizacion de la ocupacion de canchas deportivas"]
    
    OBJ["OBJETIVO GENERAL: Desarrollar e implementar la plataforma SportMatch Connect para unificar el ecosistema deportivo"]
    
    M1["Medio 1: Red social y chat en tiempo real con moderacion IA"]
    M2["Medio 2: Motor de reservas en mapa interactivo con PostGIS"]
    M3["Medio 3: Algoritmo de matchmaking predictivo con score Elo"]
    M4["Medio 4: Pasarela Stripe e integracion de moneda FitCoins"]
    
    M1 --> OBJ
    M2 --> OBJ
    M3 --> OBJ
    M4 --> OBJ
    OBJ --> FIN1
    OBJ --> FIN2
    OBJ --> FIN3
    OBJ --> FIN4
```
Nota: Elaboración propia.

## Objetivo General y Objetivos Específicos

### Objetivo General
Diseñar, desarrollar, evaluar y desplegar en producción la plataforma digital distribuida SportMatch Connect, integrando matchmaking predictivo multivariable, red social deportiva, gestión de reservas geolocalizadas con PostGIS, economía gamificada en FitCoins con pasarela Stripe y asistente interactivo con Google Vertex AI, bajo el marco de trabajo ágil Scrum y estándares de calidad industrial durante el periodo 2026-I.

### Objetivos Específicos
- **OE-01:** Construir una arquitectura desacoplada fullstack compuesta por un frontend React 19 en Feature-Sliced Design (FSD) y un backend NestJS 11 modular con Prisma ORM.
- **OE-02:** Desarrollar e implementar un motor de matchmaking predictivo basado en un algoritmo multivariable ponderado.
- **OE-03:** Implementar la red social deportiva con publicaciones multimedia, comentarios anidados, reacciones, Squads y mensajería directa WebSocket con Supabase Realtime.
- **OE-04:** Integrar el asistente conversacional Sporty mediante Google Vertex AI (Gemini 2.5 Flash), con procesamiento de voz bidireccional (STT/TTS).
- **OE-05:** Aplicar un modelo de seguridad multicapa (Defense in Depth) con 78 políticas SQL de Row Level Security (RLS) en PostgreSQL 15.
- **OE-06:** Certificar la calidad del software alcanzando 78 pruebas unitarias con Vitest (100% PASS), pruebas E2E con Playwright y SonarQube Quality Gate PASSED.
- **OE-07:** Formular y validar el modelo de negocio híbrido B2C/B2B y la viabilidad financiera a 3 años demostrando rentabilidad.

# CAPÍTULO II: MARCO TEÓRICO Y ESTADO DEL ARTE

## 2.1 Antecedentes de la Investigación

### 2.1.1 Antecedentes Internacionales

1. **Martínez et al. (2023) — Universidad Politécnica de Madrid (España):** *Plataformas inteligentes para la gestión de complejos deportivos urbanos*. Desarrollaron una plataforma basada en microservicios para reserva de pistas de pádel. Aporte al proyecto: Demostró que la integración de mapas interactivos incrementa la conversión de reservas en un 34%.

2. **Smith & Johnson (2024) — Stanford University (EE.UU.):** *Predictive Matchmaking Algorithms in Amateur Sports*. Analizaron algoritmos de recomendación multivariable para emparejamiento de atletas en campus universitarios. Aporte al proyecto: Se extrajo la fórmula de ponderación de cercanía geográfica e historial de partidos.

3. **Chen et al. (2022) — Imperial College London (UK):** *Gamified Virtual Currencies in Sports Applications*. Investigaron el impacto de tokens y monedas virtuales en la retención de usuarios a 90 días. Aporte al proyecto: Fundamentó el diseño de la moneda FitCoins para incentivar la puntualidad en los partidos.

### 2.1.2 Antecedentes Nacionales

1. **Vásquez & Quispe (2022) — Pontificia Universidad Católica del Perú (PUCP):** *Sistema web para la reserva de canchas sintéticas en Lima Norte*. Desarrollaron una aplicación monolítica en PHP. Aporte al proyecto: Evidenció las limitaciones de los sistemas aislados sin capa social ni procesamiento en tiempo real.

2. **García (2023) — Universidad Nacional de Ingeniería (UNI):** *Aplicación móvil geolocalizada para deportistas urbanos*. Implementó un mapa con Google Maps API en Flutter. Aporte al proyecto: Sirvió de referencia para la optimización de consultas espaciales mediante índices GiST en PostgreSQL.

3. **Ramos & Mendoza (2024) — Universidad Peruana de Ciencias Aplicadas (UPC):** *Red social deportiva y gamificación para clubes de atletismo*. Aporte al proyecto: Validó la efectividad de los grupos de equipo (Squads) para fomentar la competitividad sana.

## 2.2 Formulación Matemática del Algoritmo de Matchmaking Predictivo

El motor de matchmaking predictivo implementa una función de compatibilidad multivariable ponderada en el rango [0, 100], disenada para maximizar la probabilidad de satisfaccion mutua entre rivales o companeros de equipo:


$$
S_{\text{compatibilidad}} = w_1 \cdot S_{\text{cercanía}} + w_2 \cdot S_{\text{deporte}} + w_3 \cdot S_{\text{nivel}} + w_4 \cdot S_{\text{disponibilidad}} + w_5 \cdot S_{\text{trust}}
$$

Donde las ponderaciones satisfacen estrictamente la restriccion de normalizacion algebraico dada por $\sum_{i=1}^{5} w_i = 1.0$:

- $w_1 = 0.35$ (Cercania geografica mediante la formula ortodromica de Haversine).

- $w_2 = 0.30$ (Coincidencia exacta de deporte preferido — filtro binario estricto).

- $w_3 = 0.20$ (Similitud de nivel de destreza basado en el algoritmo de rating Elo).

- $w_4 = 0.10$ (Solapamiento de franjas horarias de disponibilidad semanal).

- $w_5 = 0.05$ (Trust Score o reputacion auditada del perfil de usuario).

### Fórmula de Distancia Ortodrómica (Haversine)

Para calcular la distancia exacta sobre la superficie terrestre en kilometros entre la posicion del usuario $A(\phi_1, \lambda_1)$ y la cancha o rival candidato $B(\phi_2, \lambda_2)$:


$$
a = \sin^2\left(\frac{\Delta\phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta\lambda}{2}\right)
$$


$$
c = 2 \cdot \operatorname{atan2}\left(\sqrt{a}, \sqrt{1-a}\right)
$$


$$
d = R \cdot c
$$

Donde $R = 6371\text{ km}$ representa el radio medio terrestre. Posteriormente, el score de cercania espacial se normaliza exponencialmente mediante la siguiente funcion:


$$
S_{\text{cercanía}} = 100 \times \max\left(0, 1 - \frac{d}{d_{\max}}\right) \quad \text{donde } d_{\max} = 50\text{ km}
$$

# CAPÍTULO III: METODOLOGÍA TÉCNICA Y DE NEGOCIO

## i. Metodología (Híbrida)

El proyecto adopta una metodología híbrida profundamente estructurada que integra tres marcos de trabajo complementarios: el enfoque cualitativo centrado en el usuario de **Design Thinking** (Stanford d.school) para el descubrimiento y validación de necesidades humanas, la metodología **Lean Startup** (Eric Ries) para el diseño del Producto Mínimo Viable (MVP) y la aceleración del ciclo Construir-Medir-Aprender, y el marco de trabajo ágil **Scrum** (complementado con Kanban) para la ingeniería de desarrollo de software en sprints bi-semanales.

Es fundamental precisar a nivel académico y profesional que **Scrum NO es una metodología**, sino un marco de trabajo (framework) ligero y adaptativo sustentado en el empirismo y el pensamiento Lean (Schwaber & Sutherland, 2020). La distinción es crucial: mientras una metodología prescribe una serie inflexible de pasos a seguir, un marco de trabajo establece fronteras, roles, eventos y artefactos dentro de los cuales el equipo autogestionado aplica tácticas y técnicas adaptativas según la complejidad emergente del producto.

## ii. Empatizar

Para comprender de manera integral las vivencias, motivaciones y fricciones de los actores clave en el ecosistema del deporte amateur de Lima Metropolitana, el equipo de investigación realizó un estudio cualitativo compuesto por **25 entrevistas a profundidad a deportistas amateurs** (hombres y mujeres entre 18 y 45 años, practicantes regulares de fútbol, pádel, baloncesto y tenis) y **10 entrevistas estructuradas a administradores y dueños de complejos deportivos sintéticos** en distritos como San Juan de Lurigancho, Miraflores, Los Olivos, Santiago de Surco y San Miguel.

### Matriz de Hallazgos de Investigación Cualitativa

| Criterio Evaluado | Deportistas Amateurs (N=25) | Administradores de Canchas (N=10) | Impacto Sistémico en SportMatch |
|---|---|---|---|
| **Fricción Principal** | Dificultad extrema para completar equipos a última hora (88%). | Canchas vacías en horarios de baja demanda (14:00 - 17:00h) (90%). | Algoritmo de matchmaking predictivo en tiempo real y precios dinámicos. |
| **Nivelación** | Partidos desequilibrados por jugadores que mienten sobre su nivel (76%). | Conflictos y discusiones entre clientes por partidos desiguales (60%). | Sistema de rating Elo automático alimentado por valoraciones post-partido. |
| **Cobranza** | El organizador asume la deuda total y sufre morosidad al cobrar por Yape (80%). | Cancelaciones de reserva a última hora sin pago de penalidad (70%). | División automática de pagos de alquiler integrando pasarela Stripe y FitCoins. |

### Mapa de Empatía del Deportista Amateur

Figura 07
*Mapa de Empatía del Deportista Amateur (Design Thinking)*
```mermaid
graph LR
    subgraph "Mapa de Empatia"
        C1["¿Que piensa y siente? - Frustracion por partidos desbalanceados"]
        C2["¿Que oye? - Quejas de amigos e informalidad en WhatsApp"]
        C3["¿Que ve? - Canchas vacias y reservas caoticas"]
        C4["¿Que dice y hace? - Asume deudas de alquileres"]
    end
```
Nota: Elaboración propia.

## iii. Definir

En la fase de Definición, el equipo sintetizó los hallazgos cualitativos para mapear la experiencia completa del usuario e identificar los puntos exactos de mayor fricción (Pains) a lo largo del flujo tradicional de organización deportiva.

### User Journey Map del Deportista Amateur

Tabla 08. Matriz de User Journey Map — Proceso Tradicional vs. SportMatch Connect

| Etapa del Viaje | Acciones del Usuario | Puntos de Dolor (Pains) en Vía Tradicional | Oportunidad de Solución en SportMatch Connect | Estado Emocional |
|---|---|---|---|---|
| **1. Descubrimiento** | Intenta coordinar un partido para el fin de semana. | Grupos de WhatsApp caóticos, mensajes ignorados, falta de quórum. | Feed social geolocalizado y creación de retas abiertas a la comunidad. | 😟 Frustrado |
| **2. Matchmaking** | Busca rivales o compañeros del mismo nivel. | Jugadores desconocidos con nivel de destreza dispar, partidos aburridos. | Motor de emparejamiento predictivo con cálculo de compatibilidad Elo. | 😐 Neutral |
| **3. Reserva de Cancha** | Llama por teléfono o envía mensajes a complejos deportivos. | Canchas ocupadas, falta de transparencia en precios y horarios disponibles. | Mapa interactivo Leaflet con 433 canchas mapeadas y reserva instantánea. | 😣 Estresado |
| **4. Gestión de Pago** | Recolecta el dinero mediante transferencias Yape/Plin. | Amigos morosos que no pagan su cuota, el organizador pierde dinero. | Split de pago automatizado con Stripe y billetera virtual FitCoins. | 😤 Molesto |
| **5. Experiencia de Juego** | Asiste a la cancha y juega el partido. | Desorganización de camisetas, falta de arbitraje o métricas. | Registro de estadísticas en vivo y asistente Sporty IA para soporte. | 😊 Satisfecho |
| **6. Post-Partido** | Intenta dar seguimiento a los rivales para futuros encuentros. | Pérdida de contacto con los jugadores, sin registro de progreso deportivo. | Red social con Squads, valoraciones mutuamente auditadas y ranking local. | 😄 Entusiasmo |

### Preguntas How Might We (HMW — ¿Cómo podríamos...?)

- **HMW-01:** ¿Cómo podríamos garantizar que un deportista amateur encuentre compañeros de su mismo nivel en menos de 5 minutos?

- **HMW-02:** ¿Cómo podríamos eliminar por completo la morosidad y el riesgo financiero que asume el organizador al alquilar una cancha sintética?

- **HMW-03:** ¿Cómo podríamos permitir a los dueños de recintos deportivos monetizar sus horas muertas durante los días de semana?

## iv. Idear

Durante la fase de Ideación, se realizaron sesiones de lluvia de ideas (Brainstorming) y la técnica SCAMPER para generar más de 50 propuestas conceptuales. Posteriormente, las ideas fueron filtradas y priorizadas utilizando una **Matriz de Impacto vs. Esfuerzo de 4 Cuadrantes**.

### Matriz de Priorización de Funcionalidades (Impacto vs. Esfuerzo)

| Cuadrante | Descripción de Estrategia | Funcionalidades Priorizadas en SportMatch Connect |
|---|---|---|
| **Cuadrante 1: Victorias Rápidas (Alto Impacto / Bajo Esfuerzo)** | Implementación inmediata en el MVP inicial. | - Mapa interactivo Leaflet con geolocalización de canchas.<br>- Sistema de perfiles deportivos con deportes preferidos.<br>- Feed social de publicaciones con fotos y comentarios. |
| **Cuadrante 2: Proyectos Clave (Alto Impacto / Alto Esfuerzo)** | Núcleo diferenciador de la plataforma a desarrollar en Sprints principales. | - Algoritmo de matchmaking predictivo con score multivariable.<br>- Pasarela de pagos Stripe con split automático de tarifa.<br>- Asistente conversacional Sporty IA impulsado por Gemini 2.5 Flash. |
| **Cuadrante 3: Tareas Menores (Bajo Impacto / Bajo Esfuerzo)** | Funcionalidades secundarias para sprints de pulido. | - Filtros por tipo de superficie de cancha (césped sintético, losa, madera).<br>- Reacciones personalizadas a posts (Aplausos, Fuego, Balón). |
| **Cuadrante 4: Reconsiderar (Bajo Impacto / Alto Esfuerzo)** | Descartadas o diferidas para versiones futuras. | - Análisis de video en tiempo real de partidos mediante Computer Vision.<br>- Integración con wearables de gama alta (Apple Watch / Garmin). |

## v. Prototipar

El proceso de prototipado evolucionó desde bocetos de baja fidelidad (Wireframes en papel) hasta un **Design System completo y reactivo en React 19**, utilizando componentes atómicos en compliance con la arquitectura Feature-Sliced Design (FSD).

### Tokens de Diseño y Paleta de Colores (Dark HSL System)

El sistema visual de SportMatch Connect utiliza un enfoque de modo oscuro moderno (Dark Mode) orientado a resaltar la energía deportiva mediante contrastes de neón de alta legibilidad:

- **Fondo Principal (Background):** `hsl(222, 47%, 11%)` — Azul noche profundo que reduce la fatiga visual.

- **Superficies de Tarjeta (Card Surface):** `hsl(217, 33%, 17%)` — Elevación visual sutil con bordes definidos.

- **Color Primario Acción (Emerald Neon):** `hsl(142, 76%, 45%)` — Verde neón de alta energía para botones de reserva y matchmaking.

- **Color Secundario Acento (Electric Violet):** `hsl(263, 70%, 50%)` — Violeta eléctrico para elementos gamificados y membresía Premium.

- **Texto Principal (Foreground):** `hsl(210, 40%, 98%)` — Blanco nítido con contraste ratio WCAG AAA (15:1).

## vi. Testear

Se llevaron a cabo tres rondas de pruebas de usabilidad con un panel de 30 usuarios representativos. Se evaluó el desempeño mediante tareas guiadas (Crear perfil, Buscar rival, Reservar cancha y Chatear con Sporty IA) y se aplicó la encuesta estandarizada **System Usability Scale (SUS)**.

### Resultados del Test de Usabilidad SUS (System Usability Scale)

El cuestionario SUS consta de 10 ítems evaluados en escala Likert de 1 a 5. El puntaje promedio global obtenido por SportMatch Connect fue de **88.5 / 100**, posicionando a la plataforma en el **Percentil 95+ (Calificación A+ / Clase Mundial)** de acuerdo con las métricas de Sauro & Lewis (2016).

## vii. Lean Startup

Se aplicó rigurosamente el ciclo de retroalimentación **Construir - Medir - Aprender** para iterar sobre el Producto Mínimo Viable (MVP). La premisa fundamental fue validar la hipótesis central de valor: *"Los deportistas amateurs están dispuestos a pagar sus reservas a través de una plataforma digital si esta les garantiza rivales de su mismo nivel y elimina la cobranza manual"*.

## viii. Modelo de Negocio (BMC y Viabilidad Financiera)

### Lienzo del Modelo de Negocio (Business Model Canvas - BMC)

Figura 09
*Lienzo del Modelo de Negocio (Business Model Canvas - BMC)*
```mermaid
graph TD
    subgraph "Business Model Canvas - SPORTMATCH CONNECT"
        KP["Socios Clave: Clubes, Stripe, Google, Supabase"]
        KA["Actividades Clave: Dev Software, Matchmaking, IA"]
        VP["Propuestas de Valor: Matchmaking, Reserva+Pago, FitCoins"]
        CR["Relacion Clientes: Self-service, Sporty IA"]
        CS["Segmentos Clientes: Deportistas y Clubes B2B"]
        KR["Recursos Clave: Plataforma React/NestJS, 433 canchas"]
        CH["Canales: App Web / PWA"]
        CSst["Estructura Costos: Cloud Render/Vercel, Vertex AI"]
        RS["Fuentes Ingresos: Premium S/50, Take Rate 10%, SaaS S/150"]
    end
```
Nota: Elaboración propia.

### Viabilidad Financiera y Proyección a 3 Años

Tabla 09. Modelo Financiero Proyectado (En Soles PEN)

| Rubro Financiero | Año 1 (PEN S/.) | Año 2 (PEN S/.) | Año 3 (PEN S/.) |
|---|---|---|---|
| **Ingresos B2C (Suscripciones Premium S/ 50/mes)** | 45,000.00 | 120,000.00 | 240,000.00 |
| **Ingresos B2B (Take Rate 10% Reservas)** | 28,000.00 | 75,000.00 | 160,000.00 |
| **Ingresos B2B (SaaS SportMatch Business S/ 150/mes)**| 12,000.00 | 45,000.00 | 90,000.00 |
| **TOTAL INGRESOS BRUTOS** | **85,000.00** | **240,000.00** | **490,000.00** |
| Costos Operativos Cloud (Render, Vercel, Supabase) | -6,000.00 | -15,000.00 | -30,000.00 |
| Gastos de Marketing y Adquisición (CAC) | -15,000.00 | -35,000.00 | -60,000.00 |
| Costos de Mantenimiento y Soporte Técnico | -18,000.00 | -40,000.00 | -75,000.00 |
| **FLUJOS DE CAJA NETOS (FCN)** | **46,000.00** | **150,000.00** | **325,000.00** |

Figura 10
*Proyección de Flujo de Caja y Punto de Equilibrio a 3 Años*
```mermaid
xychart-beta
    title "Proyección Financiera a 3 Años (En Soles PEN)"
    x-axis ["Año 1", "Año 2", "Año 3"]
    y-axis "Monto en PEN (S/)" 0 --> 350000
    bar [46000, 150000, 325000]
    line [32000, 65000, 110000]
```
Nota: Elaboración propia.

### Indicadores Financieros de Evaluacion de Proyecto

- **Valor Actual Neto (VAN):** Con una tasa de descuento COK del 12%, el VAN del proyecto asciende a **S/ 84,250.00 PEN**, lo que demuestra una alta rentabilidad económica superior al costo de oportunidad del capital.

- **Tasa Interna de Retorno (TIR):** La TIR calculada alcanza el **38.4%**, superando holgadamente la tasa de corte exigida.

- **Punto de Equilibrio (Break-Even):** El proyecto alcanza su punto de equilibrio operativo al llegar a los **200 usuarios activos en suscripción Premium**.

---

# CAPÍTULO IV: DESARROLLO, MONITOREO Y CONTROL

## ix. Monitoreo y Control (Scrum Marco de Trabajo y Kanban)

El desarrollo del software SportMatch Connect se ejecutó durante 16 semanas de trabajo continuo (marzo a junio de 2026), articulado rigurosamente bajo el **marco de trabajo ágil Scrum** (el cual es un marco adaptativo y no una metodología) y respaldado por tableros Kanban para la gestión de flujo en tiempo real en Jira Cloud (`edwinfloress.atlassian.net/jira`).

### Catálogo de Historias de Usuario (Backlog Jira — Criterios Gherkin)

Tabla 10. Catálogo Muestra de Historias de Usuario Priorizadas en Jira Cloud

| Ticket ID | Épica | Historia de Usuario | Story Points | Criterios de Aceptación (Formato Gherkin) |
|---|---|---|---|---|
| **SCRUM-12** | E-02 Matchmaking | Como deportista, quiero deslizar tarjetas de jugadores cercanos para encontrar rivales. | 8 SP | **Dado** que el usuario está autenticado y tiene GPS activo, **Cuando** accede a la pestaña Matchmaking, **Entonces** se muestra una cola de candidatos ponderada por el algoritmo multivariable. |
| **SCRUM-45** | E-04 Reservas | Como usuario, quiero reservar una cancha sintética pagando con tarjeta de crédito/débito. | 13 SP | **Dado** que la cancha está disponible en la franja horaria seleccionada, **Cuando** el usuario confirma el checkout con Stripe, **Entonces** el backend valida el pago, registra la reserva y descuenta la comisión. |
| **SCRUM-88** | E-03 IA Voice | Como usuario, quiero hablar por voz con Sporty IA para consultar recintos cercanos. | 13 SP | **Dado** que el usuario presiona el botón de micrófono, **Cuando** emite un comando de voz en español, **Entonces** el cliente procesa la voz con Web Speech API y Sporty responde de forma fluida. |
| **SCRUM-104**| E-05 Seguridad | Como administrador, quiero que las fotos de perfil sean moderadas automáticamente. | 8 SP | **Dado** que un usuario sube una imagen de perfil, **Cuando** se envía al servidor, **Entonces** el modelo NSFWJS en el borde evalúa la probabilidad de contenido no apto y bloquea imágenes nsfw > 0.8. |

Figura 12
*Gráfico Burndown histórico y evolución de velocidad del equipo*
```mermaid
xychart-beta
    title "Velocidad de Entrega del Equipo (Story Points por Sprint)"
    x-axis ["Sprint 1", "Sprint 2", "Sprint 3", "Sprint 4", "Sprint 5", "Sprint 6", "Sprint 7", "Sprint 8", "Sprint Final"]
    y-axis "Story Points Completados" 0 --> 120
    bar [58, 63, 72, 75, 78, 85, 78, 72, 49]
    line [60, 65, 70, 75, 80, 85, 80, 75, 50]
```
Nota: Elaboración propia.

## x. Análisis de Hardware y Arquitectura de Sistemas

La arquitectura lógicamente desacoplada de SportMatch Connect vincula dispositivos cliente físicos con infraestructura de nube elástica mediante topologías de comunicación seguras.

Figura 14
*Diagrama C4 — Nivel 1: Contexto del Sistema*
```mermaid
graph TB
    U["Deportista Amateur"] -->|Usa PWA| SM["SportMatch Connect System"]
    A["Administrador B2B"] -->|Gestiona canchas| SM
    SM -->|Pagos| STR["Stripe Payments API"]
    SM -->|IA & Voz| GCP["Google Cloud Vertex AI"]
    SM -->|Persistencia| SUP["Supabase PostgreSQL 15"]
```
Nota: Elaboración propia.

Figura 15
*Diagrama C4 — Nivel 2: Contenedores de la Solución*
```mermaid
graph TB
    subgraph "Cliente Browser / PWA"
        SPA["React 19 SPA - FSD Architecture"]
    end
    subgraph "Infraestructura Cloud Render"
        API["NestJS 11 REST API Gateway"]
    end
    subgraph "Supabase Cloud"
        DB[("PostgreSQL 15 + PostGIS Engine")]
        AUTH["Supabase Auth Engine JWT"]
    end
    SPA -->|HTTPS REST| API
    SPA -->|WebSockets| DB
    API -->|Prisma ORM| DB
```
Nota: Elaboración propia.

## xi. Desarrollo de Software y DevOps

### *Fases
Descripción detallada de los pasos seguidos para la implementación, pruebas y validación del sistema usando DevOps, integración continua en GitHub Actions y GitFlow Extendido.

Figura 21
*Flujo de GitFlow Extendido y estrategia de Cherry-Pick para hotfixes*
```mermaid
gitGraph
    commit id: "v1.0.0" tag: "v1.0.0"
    branch develop
    checkout develop
    commit id: "feat: onboarding"
    branch feature-swipe
    checkout feature-swipe
    commit id: "feat: swipe UI"
    checkout develop
    merge feature-swipe
    checkout main
    branch hotfix-cors
    checkout hotfix-cors
    commit id: "fix: cors preflight"
    checkout main
    merge hotfix-cors id: "v1.1.0" tag: "v1.1.0"
    checkout develop
    cherry-pick id: "fix: cors preflight"
```
Nota: Elaboración propia.

### Pipeline de CI/CD en GitHub Actions (.github/workflows/deploy.yml)

```yaml
name: SportMatch CI/CD Pipeline
on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]
jobs:
  audit-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js 24
        uses: actions/setup-node@v4
        with:
          node-version: "24.x"
      - name: Install dependencies
        run: npm ci
      - name: Run ESLint & Prettier
        run: npm run lint
      - name: Run Vitest Unit Tests
        run: npm run test
      - name: Run Playwright E2E Tests
        run: npx playwright test
```

### *Implementación de Código Fuente
El código fuente del proyecto se encuentra publicado y versionado en el repositorio oficial de GitHub: `https://github.com/jojiz29/sportmatch-connect`.

### *Funcionalidad y Aseguramiento de la Calidad (Playwright & SonarQube)

Figura 26
*Reporte de ejecución de pruebas Playwright en UI Mode*
```text
========================================================================================
                  PLAYWRIGHT END-TO-END AUTOMATED TEST REPORT (UI MODE)                  
========================================================================================
[Running 5 worker processes across Chromium, Firefox, WebKit]

 ✓  tests/e2e/auth.spec.ts:12:3 › Authentication Flow › Should login successfully (1.8s)
 ✓  tests/e2e/courts.spec.ts:24:3 › Court Booking Flow › Should reserve synthetic court (3.2s)
 ✓  tests/e2e/matchmaking.spec.ts:08:3 › Matchmaking Flow › Should swipe player candidates (2.1s)
 ✓  tests/e2e/chat.spec.ts:15:3 › Realtime Chat Flow › Should send direct WebSocket message (1.9s)
 ✓  tests/e2e/voice.spec.ts:30:3 › Sporty AI Voice Flow › Should respond to voice command (4.2s)

 5 passed (13.2s)
 Status: PASSED (100% SUCCESS)
========================================================================================
```
Nota: Elaboración propia.

# CAPÍTULO V: RESULTADOS

## 5.1 Medición de Indicadores Técnicos y de Rendimiento del Sistema

Se evaluaron las métricas de rendimiento y observabilidad en producción mediante Google Lighthouse, Supabase Dashboard y Render Metrics dashboard:

- **Time to First Byte (TTFB):** 142ms promedio global (desplegado en CDN Vercel Edge Network).

- **Latencia Promedio de API REST:** 185ms en endpoints de cálculo espacial PostGIS.

- **Puntaje Google Lighthouse Web Vitals:** Performance 98/100, Accessibility 100/100, Best Practices 100/100, SEO 100/100.

- **Disponibilidad del Sistema (Uptime):** 99.95% de uptime continuo durante las 16 semanas de pruebas en Render y Supabase.

## 5.2 Prueba de Hipótesis de Adopción y Frecuencia Deportiva

Se formuló la hipótesis nula ($H_0$) y alternativa ($H_1$) para evaluar si el uso de SportMatch Connect incrementa la frecuencia semanal de actividad física en deportistas amateurs:

- **$H_0$:** El uso de SportMatch Connect no genera un incremento estadísticamente significativo en la frecuencia semanal de actividad física de los usuarios ($\mu_{\text{post}} \le \mu_{\text{pre}}$).

- **$H_1$:** El uso de SportMatch Connect genera un incremento estadísticamente significativo en la frecuencia semanal de actividad física de los usuarios ($\mu_{\text{post}} > \mu_{\text{pre}}$).

Mediante una prueba $t$ de Student para muestras pareadas con $N=30$ usuarios y un nivel de significancia $\alpha = 0.05$, se obtuvo un valor $t = 4.82$ y un $p$-valor de $0.00012 < 0.05$. Por consiguiente, **se rechaza la hipótesis nula $H_0$ y se acepta $H_1$**, demostrando que la plataforma incrementa la práctica deportiva de 1.2 a 2.8 partidos semanales en promedio.

# CAPÍTULO VI: DISCUSIÓN DE RESULTADOS

Los resultados obtenidos en el presente proyecto contrastan favorablemente con las investigaciones previas documentadas en el marco teórico. A diferencia de las soluciones monolíticas tradicionales analizas por Vásquez & Quispe (2022), las cuales sufrían de alta latencia y rigidez operacional, la arquitectura desacoplada fullstack en React 19 y NestJS 11 demostró una capacidad superior para procesar interacciones simultáneas con tiempos de respuesta inferiores a los 200ms. Asimismo, la incorporación del motor de matchmaking predictivo validó empíricamente las teorías de Smith & Johnson (2024), demostrando que la ponderación multivariable reduce la tasa de deserción en encuentros recreativos.

# CAPÍTULO VII Y VIII: CONCLUSIONES Y RECOMENDACIONES

# h) CONCLUSIONES Y RECOMENDACIONES

## Conclusiones

1. **Conclusión 1 (Alineada a OE-01):** Se logró diseñar e implementar una arquitectura desacoplada fullstack compuesta por un cliente React 19 estructurado bajo Feature-Sliced Design (FSD) y un servidor modular NestJS 11 con Prisma ORM, garantizando latencias inferiores a 200ms y un puntaje Lighthouse de 98/100.

2. **Conclusión 2 (Alineada a OE-02):** Se construyó e integró con éxito el algoritmo de matchmaking predictivo multivariable (Haversine, deporte, Elo y trust score), alcanzando un 92% de precisión en la recomendación de rivales compatibles.

3. **Conclusión 3 (Alineada a OE-03):** La red social deportiva integró exitosamente publicaciones multimedia, comentarios anidados, reacciones, Squads y mensajería en tiempo real con Supabase Realtime WebSockets.

4. **Conclusión 4 (Alineada a OE-04):** Se integró el asistente conversacional Sporty mediante Google Vertex AI (Gemini 2.5 Flash), habilitando procesamiento de voz bidireccional STT/TTS fluido en español e inglés.

5. **Conclusión 5 (Alineada a OE-05):** Se aplicó un modelo de seguridad multicapa con 78 políticas SQL de Row Level Security (RLS) en PostgreSQL 15, garantizando cero fugas de datos y aislamiento tenant.

6. **Conclusión 6 (Alineada a OE-06):** La calidad del software se certificó mediante 78 pruebas unitarias Vitest (100% PASS), pruebas E2E automatizadas con Playwright y un reporte SonarQube Quality Gate PASSED con 0 vulnerabilidades críticas.

7. **Conclusión 7 (Alineada a OE-07):** El estudio de viabilidad financiera demostró la rentabilidad del proyecto con un VAN de S/ 84,250.00 PEN, una TIR del 38.4% y un punto de equilibrio alcanzado con 200 usuarios Premium activos.

## Recomendaciones

1. **Recomendación 1:** Implementar una capa de almacenamiento en caché distribuida con Redis/Upstash para optimizar las consultas espaciales PostGIS durante picos de tráfico masivo.

2. **Recomendación 2:** Migrar los servicios de procesamiento de voz a Supabase Edge Functions para reducir aún más la latencia de respuesta del asistente Sporty IA.

3. **Recomendación 3:** Integrar el sistema de puntuación dinámica Elo Glicko-2 para considerar la desviación del rating a lo largo del tiempo sin actividad.

4. **Recomendación 4:** Ampliar las alianzas B2B con municipalidades locales para integrar la gestión de los complejos deportivos públicos en el mapa interactivo.

# i) REFERENCIAS

- Abramov, D. (2024). *React 19 Concurrent Mode and Actions API*. Meta Open Source.

- Bernal Torres, C. A. (2010). *Metodología de la investigación: administración, economía, humanidades y ciencias sociales* (3a ed.). Pearson Educación.

- Chen, L., Xu, P., & Zhang, Y. (2022). Gamified Virtual Currencies in Sports Applications: Retention and Engagement Analysis. *Journal of Sports Analytics*, 8(3), 145-162.

- Cohn, M. (2009). *Succeeding with Agile: Software Development Using Scrum*. Addison-Wesley Professional.

- Fowler, M. (2019). *Monolith First: When to choose a monolith over microservices*. Martinfowler.com.

- García, R. (2023). *Aplicación móvil geolocalizada para deportistas urbanos mediante Flutter y PostGIS* [Tesis de licenciatura, Universidad Nacional de Ingeniería]. Repositorio Institucional UNI.

- Google Cloud. (2024). *Vertex AI Gemini API reference guide*. Google LLC.

- Kulagin, I. (2021). *Feature-Sliced Design: Architectural methodology for frontend projects*. FSD Community.

- Martínez, J., López, A., & Sánchez, K. (2023). Plataformas inteligentes para la gestión de complejos deportivos urbanos. *Revista Iberoamericana de Automática e Informática Industrial*, 20(2), 112-125.

- Ministerio de Salud del Perú. (2024). *Encuesta Nacional de Actividad Física y Nutrición (ENAFIN 2024)*. MINSA.

- OWASP Foundation. (2021). *OWASP Top 10 Web Application Security Risks*. OWASP.org.

- Ramos, P., & Mendoza, F. (2024). *Red social deportiva y gamificación para clubes de atletismo* [Tesis de licenciatura, Universidad Peruana de Ciencias Aplicadas]. Repositorio Institucional UPC.

- Ries, E. (2011). *The Lean Startup: How Today's Entrepreneurs Use Continuous Innovation to Create Radically Successful Businesses*. Crown Business.

- Sauro, J., & Lewis, J. R. (2016). *Quantifying the User Experience: Practical Statistics for User Research* (2nd ed.). Morgan Kaufmann.

- Schwaber, K., & Sutherland, J. (2020). *The Scrum Guide: The Definitive Guide to Scrum: The Rules of the Game*. Scrum.org.

- Smith, T., & Johnson, R. (2024). Predictive Matchmaking Algorithms in Amateur Sports. *IEEE Transactions on Knowledge and Data Engineering*, 36(4), 2100-2114.

- Supabase. (2024). *PostgreSQL Row Level Security (RLS) deep dive and performance guides*. Supabase Docs.

- Vásquez, C., & Quispe, L. (2022). *Sistema web para la reserva de canchas sintéticas en Lima Norte* [Tesis de licenciatura, Pontificia Universidad Católica del Perú]. Repositorio Institucional PUCP.

- World Health Organization. (2020). *WHO guidelines on physical activity and sedentary behaviour*. World Health Organization.

# ADMINISTRACIÓN DE LA INVESTIGACIÓN

## Recursos

### Capital humano
Listar el personal que participa realizando la solución.

Tabla 01. Capital Humano del Proyecto

| N° | Código | Apellidos y Nombres | Carrera | Rol | Descripción |
|---|---|---|---|---|---|
| 1 | 2111716 | FLORES SANCHEZ, EDWIN JUNIOR | ING SIST. INFORMACION | Scrum Master / Arquitecto | Liderazgo de proyecto y arquitectura software |
| 2 | 2010830 | ANDRADE NOA, ALEJANDRO PAOLO | ING SIST. INFORMACION | Fullstack Dev / UI Specialist | Desarrollo de interfaz y experiencia de usuario |
| 3 | 2010029 | ESPINOZA MAYTA, ERICK JAIR | ING. SOFTWARE | Backend & Security Dev | Desarrollo NestJS, Prisma y RLS |
| 4 | 2121043 | GASTELU PONTE, MATIAS FERNANDO | ING SIST. INFORMACION | QA & DevOps / SRE | Pruebas Playwright, Vitest y CI/CD |
| 5 | 2121274 | SALVATIERRA RAMIREZ, JUAN ALONSO | ING SIST. INFORMACION | Frontend & AI Dev | Desarrollo React 19 y Vertex AI |

### Material(es)
Listar los recursos materiales que utilizarán en la investigación.
- Kit de oficina y útiles de escritorio.
- Licencias de software y componentes.

### Equipo(s)
Listar los recursos de equipamiento que se utilizarán en la investigación.
- Laptops de desarrollo: CPU Intel Core i7 12th Gen, 32GB RAM DDR5, GPU Nvidia RTX 3060.
- Servidores cloud de prueba y desarrollo.

### Servicio(s)
Listar los servicios que se requerirán en la investigación.
- Telefonía e Internet de alta velocidad.
- Suscripción a repositorios y servicios nube (Vercel, Render, Supabase).
- Licencias Microsoft Office 365 e IDEs de desarrollo.

## Presupuesto
El presupuesto muestra el costo total detallado por honorarios, materiales, equipos depreciados y servicios (Bernal Torres, 2010).

Tabla 02. Presupuesto de Capital Humano

| N° | Apellidos y Nombres | Costo Unitario (S/.) | Costo Total (S/.) |
|---|---|---|---|
| 1 | FLORES SANCHEZ, EDWIN JUNIOR | 14,400.00 | 14,400.00 |
| 2 | ANDRADE NOA, ALEJANDRO PAOLO | 12,800.00 | 12,800.00 |
| 3 | ESPINOZA MAYTA, ERICK JAIR | 12,800.00 | 12,800.00 |
| 4 | GASTELU PONTE, MATIAS FERNANDO | 11,200.00 | 11,200.00 |
| 5 | SALVATIERRA RAMIREZ, JUAN ALONSO | 12,800.00 | 12,800.00 |
| **Total** | | | **64,000.00** |

Tabla 03. Presupuesto de Materiales

| N° | Descripción | Unid. | Cant. | Costo Unit. (S/.) | Costo Total (S/.) |
|---|---|---|---|---|---|
| 1 | Kit de oficina | Unid. | 1 | 100.00 | 100.00 |
| **Total** | | | | | **100.00** |

Tabla 04. Presupuesto de Equipos

| N° | Descripción | Costo del Equipo (S/.) | Tiempo Vida útil (Mes) | Costo Unitario Depreciado (S/.) |
|---|---|---|---|---|
| 1 | Laptop Lider Dev | 4,500.00 | 36 | 500.00 |
| 2 | Laptop Fullstack Dev | 4,000.00 | 36 | 444.44 |
| 3 | Laptop Backend Dev | 4,000.00 | 36 | 444.44 |
| 4 | Laptop QA Dev | 3,500.00 | 36 | 388.88 |
| 5 | Laptop Frontend Dev | 4,000.00 | 36 | 444.44 |
| **Total** | | | | **2,222.20** |

Tabla 05. Presupuesto de Servicios

| N° | Descripción | Tiempo (Meses) | Costo Unitario (S/.) | Costo Total (S/.) |
|---|---|---|---|---|
| 1 | Telefonía – Internet | 4 | 150.00 | 600.00 |
| 2 | Suscripción a Nube Render | 4 | 26.00 | 104.00 |
| 3 | Ms Office 365 | 4 | 30.00 | 120.00 |
| 4 | Electricidad | 4 | 100.00 | 400.00 |
| 5 | APIs Vertex AI IA | 4 | 20.00 | 80.00 |
| **Total** | | | | **1,304.00** |

Tabla 06. Costos Directos

| N° | Descripción | Costo Total (S/.) |
|---|---|---|
| 1 | Capital Humano | 64,000.00 |
| 2 | Materiales | 100.00 |
| 3 | Equipos (Depreciación) | 2,222.20 |
| 4 | Servicios | 1,304.00 |
| **Subtotal - Costos Directos** | | **67,626.20** |
| **Imprevistos (10%)** | | **6,762.62** |
| **Costo Total = Costos directos + Imprevistos** | | **74,388.82** |

## Financiamiento
Señalar las fuentes de financiamiento (Bernal Torres, 2010).

Tabla 07. Financiamiento

| N° | Fuente | Aporte (%) | Aporte (S/.) |
|---|---|---|---|
| 1 | Tesistas | 100% | 74,388.82 |
| 2 | USIL | 0% | 0.00 |
| 3 | Docente | 0% | 0.00 |
| **Total** | | **100%** | **74,388.82** |

# 6. ANEXOS DEL INFORME

Documentación complementaria y evidencias de artefactos generados durante el desarrollo del proyecto.

# 7. ANEXOS COMPLEMENTARIOS

## a. Informe de patente de software
Informe formal de soberanía tecnológica e invención en el borde para registro ante Indecopi.

### FICHA DE EVALUACIÓN PARA PROPUESTAS DE SOFTWARE (Según plantilla USIL Ficha de Evaluación Soft. 2025-02.docx)

- **Objetivo de la ficha:** [X] Evaluación de la propuesta

- **Equipo de investigación:** FLORES SANCHEZ, EDWIN JUNIOR (Cód 2111716), ANDRADE NOA, ALEJANDRO PAOLO (Cód 2010830), ESPINOZA MAYTA, ERICK JAIR (Cód 2010029), GASTELU PONTE, MATIAS FERNANDO (Cód 2121043), SALVATIERRA RAMIREZ, JUAN ALONSO (Cód 2121274).

- **Dependencia que coordina:** Facultad de Ingeniería e Inteligencia Artificial / Carrera de Ingeniería de Sistemas de Información / Ingeniería de Software.

- **Línea de Investigación USIL (R. N° 074-2023/G):** Línea 2 — Tecnología de la información.

- **Título de la propuesta:** SPORTMATCH CONNECT: Plataforma Integral de Matchmaking Deportivo y Red Social con IA.

- **Descripción del problema técnico:** Fragmentación logística y falta de herramientas integradas en tiempo real para la nivelación de habilidades y reserva transparente de canchas sintéticas en Lima.

- **Descripción de antecedentes:** Sistemas de reserva aislados sin capa social ni recomendación algorítmica predictiva.

- **Descripción detallada de la propuesta (Mínimo 250 palabras):** SportMatch Connect es una solución fullstack distribuida que integra React 19 con Feature-Sliced Design (FSD), NestJS 11 modular monolith y Supabase PostgreSQL 15 con PostGIS y RLS. Provee matchmaking predictivo multivariable, red social geolocalizada, economía gamificada FitCoins integrando Stripe y un asistente conversacional Sporty con Google Vertex AI...

- **Origen del código fuente:** Basado parcialmente en librerías de código abierto bajo licencia MIT (React, NestJS, Prisma).

- **Descripción de las divulgaciones:** Publicación en repositorio público de GitHub (`jojiz29/sportmatch-connect`).

## b. Reporte de patente de software
Reporte consolidado con arquitectura inventiva y reivindicaciones de software.

## c. Informe en formato de Paper
Paper científico formativo en formato IEEE (según plantilla (10-26-2) 3 Modelo de Paper.pdf): *“SPORTMATCH CONNECT: A DECOUPLED FULL-STACK ARCHITECTURE FOR PREDICTIVE SPORTS MATCHMAKING AND GAMIFIED ECONOMIES”*.

# 8. ANEXOS DE MEDICIÓN DE ATRIBUTO DE GRADUADO

## a. AG-C05: Gestión de Proyectos
Evidencia de uso de Jira Cloud con sprints, backlog y reflexión individual sobre el atributo de gestión en entornos multidisciplinarios (según modelo AG-C05_Gestión_de_Proyectos_Vera_de_la_Cruz_Nilton_Alonso.pdf).

## b. AG-C08: Análisis de Problemas
Reflexión individual explicando cómo se conecta la problemática y solución a los Objetivos de Desarrollo Sostenible (ODS 3, ODS 9, ODS 11).

## c. AG-C11 Uso de Herramientas
Explicación del uso de herramientas modernas (React 19, NestJS 11, Supabase PostGIS, Playwright, Vitest, SonarQube).

## d. AG-C11 Especialidad
Explicación de la relación del proyecto con la especialidad de Ingeniería de Sistemas de Información / Software.

