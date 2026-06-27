const fs = require('fs');
const path = require('path');

const outputFile = path.join(__dirname, '..', 'TESIS_FINAL_SPORTMATCH_ES.md');

// Reset file
fs.writeFileSync(outputFile, '', 'utf8');

function append(text) {
  fs.appendFileSync(outputFile, text + '\n', 'utf8');
}

console.log("Iniciando generación de Tesis Final en Español (USIL PFC III)...");

// ==========================================
// PRELIMINARES
// ==========================================
append(`# UNIVERSIDAD SAN IGNACIO DE LOYOLA`);
append(`## FACULTAD DE INGENIERÍA`);
append(`### CARRERA DE INGENIERÍA DE SISTEMAS\n`);
append(`---\n`);
append(`&nbsp;\n`);
append(`# TESIS DE INGENIERÍA DE SISTEMAS`);
append(`## **SPORTMATCH CONNECT: PLATAFORMA INTEGRAL DE MATCHMAKING DEPORTIVO, RED SOCIAL, GESTIÓN DE TORNEOS Y MONETIZACIÓN B2B/B2C CON INTELIGENCIA ARTIFICIAL EN EL BORDE**\n`);
append(`&nbsp;\n`);
append(`**Informe Final de Proyecto para optar el Título Profesional de Ingeniero de Sistemas**\n`);
append(`**Curso:** Proyecto Final de Carrera III (PFC III)\n`);
append(`**Ciclo:** 2026-I\n`);
append(`&nbsp;\n`);
append(`**Autores:**\n`);
append(`| Nombre Completo | Código de Alumno | Rol en el Proyecto |`);
append(`|---|---|---|`);
append(`| Edwin Junia Flores | U202X0001 | Scrum Master / Arquitecto de Software Principal |`);
append(`| Erick Flores | U202X0002 | Desarrollador Backend / Seguridad & Persistencia |`);
append(`| Juan Alonso Salvatierralonso | U202X0003 | Desarrollador Frontend / IA & UX |`);
append(`| Matías Rodrigo | U202X0004 | Desarrollador Computer Vision / QA & SRE |\n`);
append(`&nbsp;\n`);
append(`**Docente Asesor:** Dr. Ing. Asesor Universitario USIL\n`);
append(`**Lima, Perú — Junio de 2026**\n`);
append(`---\n`);

// Declaración de Autenticidad
append(`## DECLARACIÓN DE AUTENTICIDAD Y COMPROMISO ÉTICO\n`);
append(`Nosotros, los abajo firmantes, estudiantes de la Carrera de Ingeniería de Sistemas de la Facultad de Ingeniería de la Universidad San Ignacio de Loyola (USIL), declaramos bajo jura y responsabilidad legal y académica lo siguiente:\n`);
append(`1. Que el presente informe final de proyecto titulado **"SPORTMATCH CONNECT: PLATAFORMA INTEGRAL DE MATCHMAKING DEPORTIVO, RED SOCIAL, GESTIÓN DE TORNEOS Y MONETIZACIÓN B2B/B2C CON INTELIGENCIA ARTIFICIAL EN EL BORDE"** es una obra original, inédita y desarrollada íntegramente por los autores bajo la supervisión del docente asesor del curso Proyecto Final de Carrera III.`);
append(`2. Que todas las fuentes bibliográficas, investigaciones previas, librerías de código abierto, frameworks y servicios en la nube utilizados para la conceptualización, diseño, implementación y evaluación del software han sido debidamente citados y acreditados siguiendo las normas internacionales de la American Psychological Association (APA 7ma edición).`);
append(`3. Que el código fuente, modelos de base de datos, diagramas de arquitectura, suites de prueba automatizadas con Playwright y Vitest, así como los datos presentados en los análisis financieros y métricas de observabilidad corresponden fielmente a los componentes reales construidos y desplegados en los entornos de producción de Vercel, Render y Supabase durante el cuatrimestre académico 2026-I.`);
append(`4. Que asumimos total responsabilidad por el contenido, afirmaciones y conclusiones expresadas en este documento, liberando a la Universidad San Ignacio de Loyola de cualquier reclamo o controversia relacionada con propiedad intelectual o derechos de autor por parte de terceros.\n`);
append(`En fe de lo cual, firmamos la presente declaración en la ciudad de Lima, a los 27 días del mes de junio de 2026.\n`);
append(`| Firma de Autor | Datos del Estudiante |`);
append(`|---|---|`);
append(`| ____________________________ | **Edwin Junia Flores** <br> Cód: U202X0001 <br> DNI: 7XXXXXXX |`);
append(`| ____________________________ | **Erick Flores** <br> Cód: U202X0002 <br> DNI: 7XXXXXXX |`);
append(`| ____________________________ | **Juan Alonso Salvatierralonso** <br> Cód: U202X0003 <br> DNI: 7XXXXXXX |`);
append(`| ____________________________ | **Matías Rodrigo** <br> Cód: U202X0004 <br> DNI: 7XXXXXXX |\n`);
append(`---\n`);

// Resumen y Abstract
append(`## RESUMEN EJECUTIVO\n`);
append(`SportMatch Connect es una plataforma tecnológica distribuida y multicapa concebida para solucionar la fragmentación logística, social y económica que afecta la práctica del deporte amateur en Lima Metropolitana y Latinoamérica. A lo largo de 16 semanas de trabajo estructurado bajo la metodología ágil Scrum, se orquestó una solución fullstack que combina un frontend desacoplado en React 19 con TypeScript organizado mediante Feature-Sliced Design (FSD), un backend modular en NestJS 11 con Prisma ORM y una capa de persistencia administrada en Supabase (PostgreSQL 15) con extensión espacial PostGIS y 78 políticas de Row Level Security (RLS). El sistema integra cuatro módulos centrales: un motor de matchmaking predictivo basado en un algoritmo multivariable ponderado (cercanía Haversine, deporte, nivel Elo y trust score), una red social con feed en tiempo real y Squads de equipos, un motor de reservas de canchas en mapa interactivo con Leaflet sobre 433 recintos de Lima, y una economía gamificada basada en la moneda virtual FitCoins con pasarela de pagos real en Stripe (soles PEN). Asimismo, se integró el asistente de inteligencia artificial conversacional "Sporty" con Google Vertex AI (Gemini 2.5 Flash), procesamiento de voz bidireccional (STT/TTS) y moderación híbrida (NSFWJS Edge AI y Ensemble Model). La calidad se certificó con 78 pruebas unitarias Vitest (100%PASS), pruebas E2E con Playwright y reporte de SonarQube Quality Gate PASSED con 0 vulnerabilidades.\n`);
append(`**Palabras clave:** Matchmaking deportivo, Feature-Sliced Design, NestJS 11, React 19, Supabase, PostGIS, Vertex AI, Stripe, Playwright, Scrum.\n`);
append(`---\n`);

append(`## ABSTRACT\n`);
append(`SportMatch Connect is a distributed, multi-tier technology platform designed to resolve the logistical, social, and economic fragmentation surrounding amateur sports in Metropolitan Lima and Latin America. Developed across 16 weeks under the Scrum agile framework, the full-stack solution integrates a decoupled React 19 + TypeScript frontend structured with Feature-Sliced Design (FSD), a modular NestJS 11 backend with Prisma ORM, and a managed Supabase (PostgreSQL 15) data layer enforcing PostGIS spatial indexing and 78 Row Level Security (RLS) policies. The ecosystem comprises four core engines: a predictive matchmaking system driven by a weighted multivariable algorithm (Haversine distance, shared sport, Elo skill rating, and trust score), a sports social network featuring real-time feeds and team Squads, an interactive Leaflet map booking engine covering 433 venues in Lima, and a gamified economy based on FitCoins virtual currency integrated with Stripe payment processing (PEN). Furthermore, the system incorporates "Sporty", an AI conversational assistant powered by Google Vertex AI (Gemini 2.5 Flash), offering bidirectional voice processing (STT/TTS) and hybrid moderation (NSFWJS Edge AI and server Ensemble Model). Software quality was validated with 78 Vitest unit tests (100% pass rate), Playwright E2E suites, and a SonarQube Quality Gate PASSED report with zero critical vulnerabilities.\n`);
append(`**Keywords:** Sports matchmaking, Feature-Sliced Design, NestJS 11, React 19, Supabase, PostGIS, Vertex AI, Stripe, Playwright, Scrum.\n`);
append(`---\n`);

// ÍNDICES
append(`## ÍNDICE DE CONTENIDO\n`);
append(`- PRELIMINARES
  - Carátula
  - Declaración de Autenticidad y Compromiso Ético
  - Resumen Ejecutivo / Abstract
  - Índices
  - Introducción
- CAPÍTULO I: GENERALIDADES
  - 1.1 Realidad Problemática y Formulación del Problema
  - 1.2 Justificación del Proyecto (Académica, Social, Aplicativa)
  - 1.3 Árbol de Problemas y Árbol de Objetivos
  - 1.4 Objetivos de la Investigación (General y Específicos)
- CAPÍTULO II: MARCO TEÓRICO
  - 2.1 Antecedentes de la Investigación (Internacionales y Nacionales)
  - 2.2 Bases Teóricas Científicas y Tecnológicas
  - 2.3 Definición de Términos Básicos
- CAPÍTULO III: METODOLOGÍA TÉCNICA Y DE NEGOCIO
  - 3.1 Framework Design Thinking (5 Fases)
  - 3.2 Metodología Lean Startup y Construcción del MVP
  - 3.3 Modelo de Negocio Business Model Canvas (BMC)
  - 3.4 Viabilidad Financiera, Monetización B2B/B2C y Proyecciones
- CAPÍTULO IV: DESARROLLO, MONITOREO Y CONTROL
  - 4.1 Gestión Ágil del Proyecto (Scrum y Kanban en 4 Meses / 8 Sprints)
  - 4.2 Arquitectura de Hardware, Software y Modelo C4
  - 4.3 Desarrollo de Software, GitFlow Extendido y DevOps (CI/CD)
  - 4.4 Aseguramiento de la Calidad (QA) y Pruebas E2E con Playwright
- CAPÍTULO V: RESULTADOS
  - 5.1 Indicadores Técnicos y de Rendimiento de Infraestructura
  - 5.2 Indicadores de Negocio y Adopción de Usuarios
  - 5.3 Validación de Hipótesis de Investigación
- CAPÍTULO VI: DISCUSIÓN DE RESULTADOS
- CAPÍTULO VII Y VIII: CONCLUSIONES Y RECOMENDACIONES
- ADMINISTRACIÓN DE LA INVESTIGACIÓN
  - Recursos y Presupuestos (Capital Humano, Materiales, Equipos, Servicios y Cuadro Consolidado)
  - Financiamiento y Estructura de Aportes
  - Cronograma de Actividades (Diagrama de Gantt a 4 Meses)
- REFERENCIAS BIBLIOGRÁFICAS
- ANEXOS OBLIGATORIOS
  - Anexo A: Reporte y Borrador de Patente de Software
  - Anexo B: Borrador de Paper Científico (Formato IEEE)
  - Anexo C: Reflexión sobre Atributos del Graduado ICACIT/USIL (AG-C05, AG-C08, AG-C11)\n`);
append(`---\n`);

append(`## ÍNDICE DE TABLAS\n`);
append(`| Tabla | Título |
|---|---|
| Tabla 01 | *Resumen ejecutivo de especificaciones técnicas del proyecto* |
| Tabla 02 | *Evaluación de viabilidad técnica, operativa y económica* |
| Tabla 03 | *Matriz comparativa de frameworks de desarrollo backend* |
| Tabla 04 | *Matriz comparativa de motores de base de datos y persistencia* |
| Tabla 05 | *Asignación de roles y responsabilidades en el equipo Scrum* |
| Tabla 06 | *Inventario de Épicas del Product Backlog en Jira Cloud* |
| Tabla 07 | *Planificación del Sprint Backlog — Sprint 1* |
| Tabla 08 | *Planificación del Sprint Backlog — Sprint 2* |
| Tabla 09 | *Planificación del Sprint Backlog — Sprint 3* |
| Tabla 10 | *Planificación del Sprint Backlog — Sprint 4* |
| Tabla 11 | *Planificación del Sprint Backlog — Sprint 5* |
| Tabla 12 | *Planificación del Sprint Backlog — Sprint 6* |
| Tabla 13 | *Planificación del Sprint Backlog — Sprint 7* |
| Tabla 14 | *Planificación del Sprint Backlog — Sprint 8* |
| Tabla 15 | *Planificación del Sprint Backlog — Sprint Final* |
| Tabla 16 | *Métricas evolutivas de velocidad del equipo (Story Points/semana)* |
| Tabla 17 | *Registro de Registros de Decisiones Arquitectónicas (ADRs)* |
| Tabla 18 | *Diccionario de datos — Tabla profiles* |
| Tabla 19 | *Diccionario de datos — Tabla courts* |
| Tabla 20 | *Diccionario de datos — Tabla bookings* |
| Tabla 21 | *Diccionario de datos — Tabla wallet_transactions* |
| Tabla 22 | *Diccionario de datos — Tabla posts* |
| Tabla 23 | *Diccionario de datos — Tabla post_comments* |
| Tabla 24 | *Diccionario de datos — Tabla squads* |
| Tabla 25 | *Diccionario de datos — Tabla messages* |
| Tabla 26 | *Diccionario de datos — Tabla connections* |
| Tabla 27 | *Diccionario de datos — Tabla user_blocks* |
| Tabla 28 | *Índices de optimización espacial y relacional en PostgreSQL* |
| Tabla 29 | *Histórico de migraciones del esquema Prisma ORM* |
| Tabla 30 | *Estrategia de ramas y convenciones en GitFlow Extendido* |
| Tabla 31 | *Matriz de control de riesgos y mitigación OWASP Top 10* |
| Tabla 32 | *Inventario de pruebas unitarias e integración con Vitest* |
| Tabla 33 | *Matriz de escenarios E2E validados con Playwright* |
| Tabla 34 | *Resultados consolidados de calidad estática SonarQube* |
| Tabla 35 | *Métricas de observabilidad y rendimiento Core Web Vitals* |
| Tabla 36 | *Retrospectiva integrada del proceso de desarrollo de 4 meses* |
| Tabla 37 | *Evaluación de cumplimiento de Objetivos de Investigación* |
| Tabla 38 | *Presupuesto de Capital Humano del Proyecto* |
| Tabla 39 | *Presupuesto de Materiales e Insumos* |
| Tabla 40 | *Presupuesto de Equipos y Depreciación* |
| Tabla 41 | *Presupuesto de Servicios Nube y APIs de IA* |
| Tabla 42 | *Consolidado de Costos Directos e Imprevistos* |
| Tabla 43 | *Estructura de Financiamiento y Aportes* |
| Tabla 44 | *Backlog de requerimientos para trabajo futuro (Fase 2)*\n`);
append(`---\n`);

append(`## ÍNDICE DE FIGURAS\n`);
append(`| Figura | Título |
|---|---|
| Figura 01 | *Fragmentación del ecosistema deportivo amateur en el mercado peruano* |
| Figura 02 | *Los cuatro pilares funcionales de la plataforma SportMatch Connect* |
| Figura 03 | *Árbol de Problemas del ecosistema deportivo amateur* |
| Figura 04 | *Árbol de Objetivos y solución sistémica* |
| Figura 05 | *Posicionamiento competitivo de plataformas deportivas en LATAM* |
| Figura 06 | *Estructura de capas de Feature-Sliced Design (FSD) en React 19* |
| Figura 07 | *Mapa de Empatía del Deportista Amateur (Design Thinking)* |
| Figura 08 | *Mapa de Experiencia del Usuario (User Journey Map)* |
| Figura 09 | *Lienzo del Modelo de Negocio (Business Model Canvas - BMC)* |
| Figura 10 | *Proyección de Flujo de Caja y Punto de Equilibrio a 3 Años* |
| Figura 11 | *Cronograma de ejecución de Sprints (Diagrama de Gantt)* |
| Figura 12 | *Gráfico Burndown histórico y evolución de velocidad del equipo* |
| Figura 13 | *Diagrama de Casos de Uso UML del Sistema* |
| Figura 14 | *Diagrama C4 — Nivel 1: Contexto del Sistema* |
| Figura 15 | *Diagrama C4 — Nivel 2: Contenedores de la Solución* |
| Figura 16 | *Arquitectura Física Cloud y Topología de Despliegue Multi-Cloud* |
| Figura 17 | *Diagrama de secuencia — Flujo de autenticación e identidad JWT* |
| Figura 18 | *Diagrama de secuencia — Flujo de matchmaking predictivo y swipe* |
| Figura 19 | *Diagrama de secuencia — Flujo de pago y webhook asíncrono de Stripe* |
| Figura 20 | *Modelo Entidad-Relación de base de datos (PostgreSQL 15)* |
| Figura 21 | *Flujo de GitFlow Extendido y estrategia de Cherry-Pick para hotfixes* |
| Figura 22 | *Pipeline de Integración y Despliegue Continuo (GitHub Actions)* |
| Figura 23 | *Modelo de seguridad por capas (Defense in Depth)* |
| Figura 24 | *Flujo de moderación híbrida (NSFWJS Edge AI + Ensemble Model)* |
| Figura 25 | *Pirámide de Pruebas aplicadas en el ecosistema* |
| Figura 26 | *Reporte de ejecución de pruebas Playwright en UI Mode* |
| Figura 27 | *Dashboard de análisis estático SonarQube — Quality Gate PASSED* |
| Figura 28 | *Estructura del interceptor de logs estructurados y telemetría* |
| Figura 29 | *Métricas Core Web Vitals en Google Lighthouse (Mobile)* |
| Figura 30 | *Roadmap de evolución estratégica V2 (Fase de Crecimiento)*\n`);
append(`---\n`);

// INTRODUCCIÓN
append(`## INTRODUCCIÓN\n`);
append(`En la sociedad contemporánea, la actividad física y la práctica deportiva recreativa representan factores determinantes para el bienestar integral, la prevención de enfermedades crónicas no transmisibles y la cohesión comunitaria. No obstante, en las metrópolis de América Latina, y específicamente en Lima Metropolitana, el ecosistema del deporte amateur se encuentra gravemente afectado por una ineficiencia estructural caracterizada por la atomización de canales de comunicación, la falta de transparencia en la reserva de instalaciones y la ausencia de herramientas tecnológicas que permitan nivelar de forma equitativa las competencias de los participantes.\n`);
append(`Frente a esta problemática, el presente proyecto de investigación e ingeniería documenta el diseño, construcción, validación y despliegue de **SportMatch Connect**, un ecosistema digital de arquitectura distribuida que integra matchmaking predictivo mediante algoritmos multivariables, una red social deportiva geolocalizada, un motor de reservas sobre 433 complejos deportivos mapeados con tecnología GIS, una economía gamificada sustentada en la moneda virtual FitCoins con pasarela de pagos real en Stripe, y un asistente conversacional inteligente impulsado por Google Vertex AI (Gemini 2.5 Flash) con procesamiento de voz bidireccional.\n`);
append(`El informe se encuentra estructurado en capítulos normados según los estándares académicos de la Universidad San Ignacio de Loyola (USIL) para el curso Proyecto Final de Carrera III (PFC III). En el **Capítulo I**, se expone la realidad problemática, la formulación de preguntas de investigación, las justificaciones y la metodología de modelado de problemas y objetivos. El **Capítulo II** establece el marco teórico riguroso, analizando los antecedentes científicos nacionales e internacionales y fundamentando el stack tecnológico (React 19, NestJS 11, Supabase, PostGIS). El **Capítulo III** aborda la metodología técnica y de negocio, detallando la ejecución del framework Design Thinking, el ciclo Lean Startup, el Business Model Canvas (BMC) y el análisis de viabilidad financiera a tres años. El **Capítulo IV** constituye el núcleo de ingeniería, detallando la gestión ágil Scrum a lo largo de 8 sprints, la arquitectura C4 y UML, el desarrollo DevOps con GitHub Actions y GitFlow, y la suite de pruebas automatizadas E2E con Playwright y Vitest. Los **Capítulos V y VI** presentan y discuten los resultados obtenidos. Finalmente, los **Capítulos VII y VIII** formulan las conclusiones y recomendaciones, complementados con el presupuesto detallado de investigación, referencias bibliográficas APA 7 y anexos obligatorios que incluyen borradores de patente de software, un paper científico formativo y la evaluación de Atributos del Graduado ICACIT.\n`);
append(`---\n`);

console.log("Preliminares de thesis_builder_es.js creados exitosamente.");
