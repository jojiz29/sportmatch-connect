const fs = require('fs');
const path = require('path');

const outputFile = path.join(__dirname, '..', 'TESIS_FINAL_SPORTMATCH_ES.md');

fs.writeFileSync(outputFile, '', 'utf8');

function append(text) {
  fs.appendFileSync(outputFile, text + '\n', 'utf8');
}

console.log("Generando Tesis Final en Español (TESIS_FINAL_SPORTMATCH_ES.md)...");

// ==========================================
// PRELIMINARES
// ==========================================
append("# UNIVERSIDAD SAN IGNACIO DE LOYOLA");
append("## FACULTAD DE INGENIERÍA");
append("### CARRERA DE INGENIERÍA DE SISTEMAS\n");
append("---\n");
append("&nbsp;\n");
append("# TESIS DE INGENIERÍA DE SISTEMAS");
append("## **SPORTMATCH CONNECT: PLATAFORMA INTEGRAL DE MATCHMAKING DEPORTIVO, RED SOCIAL, GESTIÓN DE TORNEOS Y MONETIZACIÓN B2B/B2C CON INTELIGENCIA ARTIFICIAL EN EL BORDE**\n");
append("&nbsp;\n");
append("**Informe Final de Proyecto para optar el Título Profesional de Ingeniero de Sistemas**\n");
append("**Curso:** Proyecto Final de Carrera III (PFC III)\n");
append("**Ciclo:** 2026-I\n");
append("&nbsp;\n");
append("**Autores:**\n");
append("| Nombre Completo | Código de Alumno | Rol en el Proyecto |");
append("|---|---|---|");
append("| Edwin Junia Flores | U202X0001 | Scrum Master / Arquitecto de Software Principal |");
append("| Erick Flores | U202X0002 | Desarrollador Backend / Seguridad & Persistencia |");
append("| Juan Alonso Salvatierralonso | U202X0003 | Desarrollador Frontend / IA & UX |");
append("| Matías Rodrigo | U202X0004 | Desarrollador Computer Vision / QA & SRE |\n");
append("&nbsp;\n");
append("**Docente Asesor:** Dr. Ing. Asesor Universitario USIL\n");
append("**Lima, Perú — Junio de 2026**\n");
append("---\n");

append("## DECLARACIÓN DE AUTENTICIDAD Y COMPROMISO ÉTICO\n");
append("Nosotros, los abajo firmantes, estudiantes de la Carrera de Ingeniería de Sistemas de la Facultad de Ingeniería de la Universidad San Ignacio de Loyola (USIL), declaramos bajo jura y responsabilidad legal y académica lo siguiente:\n");
append("1. Que el presente informe final de proyecto titulado **\"SPORTMATCH CONNECT: PLATAFORMA INTEGRAL DE MATCHMAKING DEPORTIVO, RED SOCIAL, GESTIÓN DE TORNEOS Y MONETIZACIÓN B2B/B2C CON INTELIGENCIA ARTIFICIAL EN EL BORDE\"** es una obra original, inédita y desarrollada íntegramente por los autores bajo la supervisión del docente asesor del curso Proyecto Final de Carrera III.");
append("2. Que todas las fuentes bibliográficas, investigaciones previas, librerías de código abierto, frameworks y servicios en la nube utilizados para la conceptualización, diseño, implementación y evaluación del software han sido debidamente citados y acreditados siguiendo las normas internacionales de la American Psychological Association (APA 7ma edición).");
append("3. Que el código fuente, modelos de base de datos, diagramas de arquitectura, suites de prueba automatizadas con Playwright y Vitest, así como los datos presentados en los análisis financieros y métricas de observabilidad corresponden fielmente a los componentes reales construidos y desplegados en los entornos de producción de Vercel, Render y Supabase durante el cuatrimestre académico 2026-I.");
append("4. Que asumimos total responsabilidad por el contenido, afirmaciones y conclusiones expresadas en este documento, liberando a la Universidad San Ignacio de Loyola de cualquier reclamo o controversia relacionada con propiedad intelectual o derechos de autor por parte de terceros.\n");
append("En fe de lo cual, firmamos la presente declaración en la ciudad de Lima, a los 27 días del mes de junio de 2026.\n");
append("| Firma de Autor | Datos del Estudiante |");
append("|---|---|");
append("| ____________________________ | **Edwin Junia Flores** <br> Cód: U202X0001 <br> DNI: 7XXXXXXX |");
append("| ____________________________ | **Erick Flores** <br> Cód: U202X0002 <br> DNI: 7XXXXXXX |");
append("| ____________________________ | **Juan Alonso Salvatierralonso** <br> Cód: U202X0003 <br> DNI: 7XXXXXXX |");
append("| ____________________________ | **Matías Rodrigo** <br> Cód: U202X0004 <br> DNI: 7XXXXXXX |\n");
append("---\n");

append("## RESUMEN EJECUTIVO\n");
append("SportMatch Connect es una plataforma tecnológica distribuida y multicapa concebida para solucionar la fragmentación logística, social y económica que afecta la práctica del deporte amateur en Lima Metropolitana y Latinoamérica. A lo largo de 16 semanas de trabajo estructurado bajo la metodología ágil Scrum, se orquestó una solución fullstack que combina un frontend desacoplado en React 19 con TypeScript organizado mediante Feature-Sliced Design (FSD), un backend modular en NestJS 11 con Prisma ORM y una capa de persistencia administrada en Supabase (PostgreSQL 15) con extensión espacial PostGIS y 78 políticas de Row Level Security (RLS). El sistema integra cuatro módulos centrales: un motor de matchmaking predictivo basado en un algoritmo multivariable ponderado (cercanía Haversine, deporte, nivel Elo y trust score), una red social con feed en tiempo real y Squads de equipos, un motor de reservas de canchas en mapa interactivo con Leaflet sobre 433 recintos de Lima, y una economía gamificada basada en la moneda virtual FitCoins con pasarela de pagos real en Stripe (soles PEN). Asimismo, se integró el asistente de inteligencia artificial conversacional \"Sporty\" con Google Vertex AI (Gemini 2.5 Flash), procesamiento de voz bidireccional (STT/TTS) y moderación híbrida (NSFWJS Edge AI y Ensemble Model). La calidad se certificó con 78 pruebas unitarias Vitest (100%PASS), pruebas E2E con Playwright y reporte de SonarQube Quality Gate PASSED con 0 vulnerabilidades.\n");
append("**Palabras clave:** Matchmaking deportivo, Feature-Sliced Design, NestJS 11, React 19, Supabase, PostGIS, Vertex AI, Stripe, Playwright, Scrum.\n");
append("---\n");

append("## ABSTRACT\n");
append("SportMatch Connect is a distributed, multi-tier technology platform designed to resolve the logistical, social, and economic fragmentation surrounding amateur sports in Metropolitan Lima and Latin America. Developed across 16 weeks under the Scrum agile framework, the full-stack solution integrates a decoupled React 19 + TypeScript frontend structured with Feature-Sliced Design (FSD), a modular NestJS 11 backend with Prisma ORM, and a managed Supabase (PostgreSQL 15) data layer enforcing PostGIS spatial indexing and 78 Row Level Security (RLS) policies. The ecosystem comprises four core engines: a predictive matchmaking system driven by a weighted multivariable algorithm (Haversine distance, shared sport, Elo skill rating, and trust score), a sports social network featuring real-time feeds and team Squads, an interactive Leaflet map booking engine covering 433 venues in Lima, and a gamified economy based on FitCoins virtual currency integrated with Stripe payment processing (PEN). Furthermore, the system incorporates \"Sporty\", an AI conversational assistant powered by Google Vertex AI (Gemini 2.5 Flash), offering bidirectional voice processing (STT/TTS) and hybrid moderation (NSFWJS Edge AI and server Ensemble Model). Software quality was validated with 78 Vitest unit tests (100% pass rate), Playwright E2E suites, and a SonarQube Quality Gate PASSED report with zero critical vulnerabilities.\n");
append("**Keywords:** Sports matchmaking, Feature-Sliced Design, NestJS 11, React 19, Supabase, PostGIS, Vertex AI, Stripe, Playwright, Scrum.\n");
append("---\n");

append("## ÍNDICE DE CONTENIDO\n");
append("- PRELIMINARES\n  - Carátula\n  - Declaración de Autenticidad y Compromiso Ético\n  - Resumen Ejecutivo / Abstract\n  - Índices\n  - Introducción\n- CAPÍTULO I: GENERALIDADES\n  - 1.1 Realidad Problemática y Formulación del Problema\n  - 1.2 Justificación del Proyecto (Académica, Social, Aplicativa)\n  - 1.3 Árbol de Problemas y Árbol de Objetivos\n  - 1.4 Objetivos de la Investigación (General y Específicos)\n- CAPÍTULO II: MARCO TEÓRICO\n  - 2.1 Antecedentes de la Investigación (Internacionales y Nacionales)\n  - 2.2 Bases Teóricas Científicas y Tecnológicas\n  - 2.3 Definición de Términos Básicos\n- CAPÍTULO III: METODOLOGÍA TÉCNICA Y DE NEGOCIO\n  - 3.1 Framework Design Thinking (5 Fases)\n  - 3.2 Metodología Lean Startup y Construcción del MVP\n  - 3.3 Modelo de Negocio Business Model Canvas (BMC)\n  - 3.4 Viabilidad Financiera, Monetización B2B/B2C y Proyecciones\n- CAPÍTULO IV: DESARROLLO, MONITOREO Y CONTROL\n  - 4.1 Gestión Ágil del Proyecto (Scrum y Kanban en 4 Meses / 8 Sprints)\n  - 4.2 Arquitectura de Hardware, Software y Modelo C4\n  - 4.3 Desarrollo de Software, GitFlow Extendido y DevOps (CI/CD)\n  - 4.4 Aseguramiento de la Calidad (QA) y Pruebas E2E con Playwright\n- CAPÍTULO V: RESULTADOS\n  - 5.1 Indicadores Técnicos y de Rendimiento de Infraestructura\n  - 5.2 Indicadores de Negocio y Adopción de Usuarios\n  - 5.3 Validación de Hipótesis de Investigación\n- CAPÍTULO VI: DISCUSIÓN DE RESULTADOS\n- CAPÍTULO VII Y VIII: CONCLUSIONES Y RECOMENDACIONES\n- ADMINISTRACIÓN DE LA INVESTIGACIÓN\n  - Recursos y Presupuestos\n  - Financiamiento\n  - Cronograma de Actividades (Gantt)\n- REFERENCIAS BIBLIOGRÁFICAS\n- ANEXOS OBLIGATORIOS\n  - Anexo A: Patente de Software\n  - Anexo B: Paper Científico\n  - Anexo C: Atributos del Graduado ICACIT\n");
append("---\n");

append("## ÍNDICE DE TABLAS\n");
append("| Tabla | Título |");
append("|---|---|");
append("| Tabla 01 | *Resumen ejecutivo de especificaciones técnicas del proyecto* |");
append("| Tabla 02 | *Evaluación de viabilidad técnica, operativa y económica* |");
append("| Tabla 03 | *Matriz comparativa de frameworks de desarrollo backend* |");
append("| Tabla 04 | *Matriz comparativa de motores de base de datos y persistencia* |");
append("| Tabla 05 | *Asignación de roles y responsabilidades en el equipo Scrum* |");
append("| Tabla 06 | *Inventario de Épicas del Product Backlog en Jira Cloud* |");
append("| Tabla 07 | *Planificación del Sprint Backlog — Sprint 1* |");
append("| Tabla 08 | *Planificación del Sprint Backlog — Sprint 2* |");
append("| Tabla 09 | *Planificación del Sprint Backlog — Sprint 3* |");
append("| Tabla 10 | *Planificación del Sprint Backlog — Sprint 4* |");
append("| Tabla 11 | *Planificación del Sprint Backlog — Sprint 5* |");
append("| Tabla 12 | *Planificación del Sprint Backlog — Sprint 6* |");
append("| Tabla 13 | *Planificación del Sprint Backlog — Sprint 7* |");
append("| Tabla 14 | *Planificación del Sprint Backlog — Sprint 8* |");
append("| Tabla 15 | *Planificación del Sprint Backlog — Sprint Final* |");
append("| Tabla 16 | *Métricas evolutivas de velocidad del equipo (Story Points/semana)* |");
append("| Tabla 17 | *Registro de Registros de Decisiones Arquitectónicas (ADRs)* |");
append("| Tabla 18 | *Diccionario de datos — Tabla profiles* |");
append("| Tabla 19 | *Diccionario de datos — Tabla courts* |");
append("| Tabla 20 | *Diccionario de datos — Tabla bookings* |");
append("| Tabla 21 | *Diccionario de datos — Tabla wallet_transactions* |");
append("| Tabla 22 | *Diccionario de datos — Tabla posts* |");
append("| Tabla 23 | *Diccionario de datos — Tabla post_comments* |");
append("| Tabla 24 | *Diccionario de datos — Tabla squads* |");
append("| Tabla 25 | *Diccionario de datos — Tabla messages* |");
append("| Tabla 26 | *Diccionario de datos — Tabla connections* |");
append("| Tabla 27 | *Diccionario de datos — Tabla user_blocks* |");
append("| Tabla 28 | *Índices de optimización espacial y relacional en PostgreSQL* |");
append("| Tabla 29 | *Histórico de migraciones del esquema Prisma ORM* |");
append("| Tabla 30 | *Estrategia de ramas y convenciones en GitFlow Extendido* |");
append("| Tabla 31 | *Matriz de control de riesgos y mitigación OWASP Top 10* |");
append("| Tabla 32 | *Inventario de pruebas unitarias e integración con Vitest* |");
append("| Tabla 33 | *Matriz de escenarios E2E validados con Playwright* |");
append("| Tabla 34 | *Resultados consolidados de calidad estática SonarQube* |");
append("| Tabla 35 | *Métricas de observabilidad y rendimiento Core Web Vitals* |");
append("| Tabla 36 | *Retrospectiva integrada del proceso de desarrollo de 4 meses* |");
append("| Tabla 37 | *Evaluación de cumplimiento de Objetivos de Investigación* |");
append("| Tabla 38 | *Presupuesto de Capital Humano del Proyecto* |");
append("| Tabla 39 | *Presupuesto de Materiales e Insumos* |");
append("| Tabla 40 | *Presupuesto de Equipos y Depreciación* |");
append("| Tabla 41 | *Presupuesto de Servicios Nube y APIs de IA* |");
append("| Tabla 42 | *Consolidado de Costos Directos e Imprevistos* |");
append("| Tabla 43 | *Estructura de Financiamiento y Aportes* |");
append("| Tabla 44 | *Backlog de requerimientos para trabajo futuro (Fase 2)*\n");
append("---\n");

append("## ÍNDICE DE FIGURAS\n");
append("| Figura | Título |");
append("|---|---|");
append("| Figura 01 | *Fragmentación del ecosistema deportivo amateur en el mercado peruano* |");
append("| Figura 02 | *Los cuatro pilares funcionales de la plataforma SportMatch Connect* |");
append("| Figura 03 | *Árbol de Problemas del ecosistema deportivo amateur* |");
append("| Figura 04 | *Árbol de Objetivos y solución sistémica* |");
append("| Figura 05 | *Posicionamiento competitivo de plataformas deportivas en LATAM* |");
append("| Figura 06 | *Estructura de capas de Feature-Sliced Design (FSD) en React 19* |");
append("| Figura 07 | *Mapa de Empatía del Deportista Amateur (Design Thinking)* |");
append("| Figura 08 | *Mapa de Experiencia del Usuario (User Journey Map)* |");
append("| Figura 09 | *Lienzo del Modelo de Negocio (Business Model Canvas - BMC)* |");
append("| Figura 10 | *Proyección de Flujo de Caja y Punto de Equilibrio a 3 Años* |");
append("| Figura 11 | *Cronograma de ejecución de Sprints (Diagrama de Gantt)* |");
append("| Figura 12 | *Gráfico Burndown histórico y evolución de velocidad del equipo* |");
append("| Figura 13 | *Diagrama de Casos de Uso UML del Sistema* |");
append("| Figura 14 | *Diagrama C4 — Nivel 1: Contexto del Sistema* |");
append("| Figura 15 | *Diagrama C4 — Nivel 2: Contenedores de la Solución* |");
append("| Figura 16 | *Arquitectura Física Cloud y Topología de Despliegue Multi-Cloud* |");
append("| Figura 17 | *Diagrama de secuencia — Flujo de autenticación e identidad JWT* |");
append("| Figura 18 | *Diagrama de secuencia — Flujo de matchmaking predictivo y swipe* |");
append("| Figura 19 | *Diagrama de secuencia — Flujo de pago y webhook asíncrono de Stripe* |");
append("| Figura 20 | *Modelo Entidad-Relación de base de datos (PostgreSQL 15)* |");
append("| Figura 21 | *Flujo de GitFlow Extendido y estrategia de Cherry-Pick para hotfixes* |");
append("| Figura 22 | *Pipeline de Integración y Despliegue Continuo (GitHub Actions)* |");
append("| Figura 23 | *Modelo de seguridad por capas (Defense in Depth)* |");
append("| Figura 24 | *Flujo de moderación híbrida (NSFWJS Edge AI + Ensemble Model)* |");
append("| Figura 25 | *Pirámide de Pruebas aplicadas en el ecosistema* |");
append("| Figura 26 | *Reporte de ejecución de pruebas Playwright en UI Mode* |");
append("| Figura 27 | *Dashboard de análisis estático SonarQube — Quality Gate PASSED* |");
append("| Figura 28 | *Estructura del interceptor de logs estructurados y telemetría* |");
append("| Figura 29 | *Métricas Core Web Vitals en Google Lighthouse (Mobile)* |");
append("| Figura 30 | *Roadmap de evolución estratégica V2 (Fase de Crecimiento)*\n");
append("---\n");

append("## INTRODUCCIÓN\n");
append("En la sociedad contemporánea, la actividad física y la práctica deportiva recreativa representan factores determinantes para el bienestar integral, la prevención de enfermedades crónicas no transmisibles y la cohesión comunitaria. No obstante, en las metrópolis de América Latina, y específicamente en Lima Metropolitana, el ecosistema del deporte amateur se encuentra gravemente afectado por una ineficiencia estructural caracterizada por la atomización de canales de comunicación, la falta de transparencia en la reserva de instalaciones y la ausencia de herramientas tecnológicas que permitan nivelar de forma equitativa las competencias de los participantes.\n");
append("Frente a esta problemática, el presente proyecto de investigación e ingeniería documenta el diseño, construcción, validación y despliegue de **SportMatch Connect**, un ecosistema digital de arquitectura distribuida que integra matchmaking predictivo mediante algoritmos multivariables, una red social deportiva geolocalizada, un motor de reservas sobre 433 complejos deportivos mapeados con tecnología GIS, una economía gamificada sustentada en la moneda virtual FitCoins con pasarela de pagos real en Stripe, y un asistente conversacional inteligente impulsado por Google Vertex AI (Gemini 2.5 Flash) con procesamiento de voz bidireccional.\n");
append("El informe se encuentra estructurado en capítulos normados según los estándares académicos de la Universidad San Ignacio de Loyola (USIL) para el curso Proyecto Final de Carrera III (PFC III). En el **Capítulo I**, se expone la realidad problemática, la formulación de preguntas de investigación, las justificaciones y la metodología de modelado de problemas y objetivos. El **Capítulo II** establece el marco teórico riguroso, analizando los antecedentes científicos nacionales e internacionales y fundamentando el stack tecnológico (React 19, NestJS 11, Supabase, PostGIS). El **Capítulo III** aborda la metodología técnica y de negocio, detallando la ejecución del framework Design Thinking, el ciclo Lean Startup, el Business Model Canvas (BMC) y el análisis de viabilidad financiera a tres años. El **Capítulo IV** constituye el núcleo de ingeniería, detallando la gestión ágil Scrum a lo largo de 8 sprints, la arquitectura C4 y UML, el desarrollo DevOps con GitHub Actions y GitFlow, y la suite de pruebas automatizadas E2E con Playwright y Vitest. Los **Capítulos V y VI** presentan y discuten los resultados obtenidos. Finalmente, los **Capítulos VII y VIII** formulan las conclusiones y recomendaciones, complementados con el presupuesto detallado de investigación, referencias bibliográficas APA 7 y anexos obligatorios que incluyen borradores de patente de software, un paper científico formativo y la evaluación de Atributos del Graduado ICACIT.\n");
append("---\n");

// CAPITULO I
append("# CAPÍTULO I: GENERALIDADES\n");
append("## 1.1 Realidad Problemática y Formulación del Problema\n");
append("### 1.1.1 Contexto Macro (Global)");
append("A nivel mundial, la inactividad física representa una de las principales pandemias silenciosas de la era moderna. Según la Organización Mundial de la Salud (OMS, 2020), más del 28% de la población adulta global no cumple con las recomendaciones mínimas de 150 minutos semanales de actividad física moderada. Este fenómeno acarrea costos sanitarios globales directos superiores a los 54,000 millones de dólares anuales. Paradójicamente, mientras las tecnologías móviles de consumo han digitalizado industrias como el transporte (Uber), el hospedaje (Airbnb) y la alimentación (Rappi), el deporte recreativo y amateur continúa operando bajo dinámicas informales y desarticuladas en la mayoría de países en desarrollo.\n");

append("### 1.1.2 Contexto Meso (Regional - Latinoamérica)");
append("En América Latina, la brecha de infraestructura deportiva pública y la desorganización de clubes informales agravan el sedentarismo urbanístico. Ciudades como Bogotá, Santiago, Ciudad de México y Lima comparten un patrón común: la práctica del fútbol, pádel, baloncesto y tenis recreativo se coordina principalmente mediante la iniciativa privada e informal de grupos de amigos. Sin embargo, la falta de herramientas tecnológicas integradas para la nivelación de habilidades y la división transparente de costos de alquiler genera altas tasas de abandono y deserción en los deportistas amateurs.\n");

append("### 1.1.3 Contexto Micro (Local - Lima Metropolitana)");
append("En Lima Metropolitana, ciudad con más de 10 millones de habitantes, la Encuesta Nacional de Actividad Física y Nutrición del Ministerio de Salud del Perú (MINSA, 2024) revela que el 72% de los adultos realiza actividad física insuficiente. La coordinación de partidos recreativos se lleva a cabo mediante grupos caóticos de WhatsApp o Telegram donde la información se pierde, no se filtran participantes por nivel real de destreza, los organizadores asumen deudas financieras individuales para separar canchas y la cobranza mediante billeteras móviles (Yape o Plin) genera fricciones y morosidad. Asimismo, los recintos deportivos independientes operan con sistemas de reserva arcaicos basados en cuadernos o llamadas telefónicas, sin visibilidad digital en tiempo real.\n");

append("### 1.1.4 Formulación de Preguntas de Investigación");
append("**Pregunta Principal:**");
append("¿De qué manera el diseño e implementación de una plataforma digital distribuida que integre matchmaking predictivo multivariable, red social geolocalizada, gestión de reservas con tecnología GIS y economía gamificada con IA conversacional permite optimizar la coordinación, nivelación y continuidad de la práctica deportiva amateur en Lima Metropolitana?\n");
append("**Preguntas Específicas:**");
append("1. ¿Cómo estructurar una arquitectura de software desacoplada (React 19 FSD y NestJS 11) que garantice alta disponibilidad, modularidad y latencias menores a 200ms en el procesamiento de transacciones deportivas?");
append("2. ¿De qué forma un algoritmo lineal ponderado que combine cercanía geográfica (Haversine), afinidad deportiva, nivel Elo y trust score permite maximizar la compatibilidad entre deportistas amateurs?");
append("3. ¿Cómo diseñar un modelo de negocio híbrido B2C y B2B sustentado en una moneda virtual (FitCoins) y pasarelas de pago reales (Stripe) para asegurar la viabilidad financiera del proyecto?");
append("4. ¿En qué medida un sistema de aseguramiento de calidad automatizado con Playwright (E2E) y Vitest (Unitario) permite alcanzar una cobertura superior al 60% y certificar cero vulnerabilidades críticas en SonarQube?\n");

append("## 1.2 Justificación del Proyecto\n");
append("### 1.2.1 Justificación Académica y Científica");
append("Desde la perspectiva de la Ingeniería de Sistemas, este proyecto aporta un marco de referencia práctico en la aplicación de patrones arquitectónicos modernos. Demuestra la viabilidad de la metodología Feature-Sliced Design (FSD) para resolver el acoplamiento en aplicaciones cliente complejas de React 19, y documenta la resiliencia de NestJS 11 como un monolito modular con inyección de dependencias estricta. Asimismo, sienta precedentes en la integración de modelos fundacionales de IA (Vertex AI Gemini 2.5 Flash) en el borde y la aplicación de seguridad declarativa mediante Row Level Security (RLS) en PostgreSQL 15.\n");

append("### 1.2.2 Justificación Social y Ambiental");
append("Socialmente, SportMatch Connect impacta de forma directa en los Objetivos de Desarrollo Sostenible (ODS) de la Organización de las Naciones Unidas (ONU):");
append("- **ODS 3 (Salud y Bienestar):** Incentiva el combate al sedentarismo y promueve la salud mental a través de la interacción comunitaria deportiva.");
append("- **ODS 9 (Industria, Innovación e Infraestructura):** Digitaliza la infraestructura deportiva de PyMES y clubes locales en Lima.");
append("- **ODS 11 (Ciudades y Comunidades Sostenibles):** Optimiza el uso de espacios recreativos urbanos mediante geolocalización inteligente.\n");

append("### 1.2.3 Justificación Aplicativa y Técnica");
append("Técnicamente, la solución resuelve la fragmentación mediante la convergencia de cuatro tecnologías clave: WebSockets en tiempo real (Supabase Realtime) para chat, extensiones geoespaciales (PostGIS) para queries de distancia radial, redes neuronales en el cliente (NSFWJS Edge AI) para moderación de contenido y SDKs de pago (Stripe) para automatizar la economía de reservas.\n");

append("## 1.3 Árbol de Problemas y Árbol de Objetivos\n");
append("Figura 03");
append("*Árbol de Problemas del ecosistema deportivo amateur*");
append("```mermaid\ngraph TD\n    EF1[Efecto Final: Alto sedentarismo y desercion deportiva en Lima]\n    EF2[Efecto 2: Partidos desequilibrados y frustracion de jugadores]\n    EF3[Efecto 3: Deudas financieras impagas y morosidad en reservas]\n    EF4[Efecto 4: Subutilizacion de instalaciones deportivas locales]\n    \n    PC[PROBLEMA CENTRAL: Fragmentacion e ineficiencia en la coordinacion, reserva y comunidad del deporte amateur]\n    \n    C1[Causa 1: Uso informal de grupos de WhatsApp sin filtros de nivel]\n    C2[Causa 2: Dispersion de sistemas de reserva sin conexion social]\n    C3[Causa 3: Ausencia de metricas objetivas de habilidad deportivo]\n    C4[Causa 4: Gestion manual e informal de pagos y cobranzas]\n    \n    EF1 --- EF2\n    EF1 --- EF3\n    EF1 --- EF4\n    EF2 --- PC\n    EF3 --- PC\n    EF4 --- PC\n    PC --- C1\n    PC --- C2\n    PC --- C3\n    PC --- C4\n    \n    style PC fill:#ef4444,color:#fff,stroke-width:2px\n    style EF1 fill:#f97316,color:#fff\n    style C1 fill:#3b82f6,color:#fff\n    style C2 fill:#3b82f6,color:#fff\n    style C3 fill:#3b82f6,color:#fff\n    style C4 fill:#3b82f6,color:#fff\n```");
append("Nota: Elaboración propia.\n");
append("```text\n[Prompt Detallado de Réplica de la Figura 03]\nCreate a hierarchical cause-and-effect Tree Diagram (Árbol de Problemas) in Mermaid.js syntax.\nCentral Problem Node (colored in bright red): 'PROBLEMA CENTRAL: Fragmentación e ineficiencia en la coordinación, reserva y comunidad del deporte amateur'.\nEffects above (colored in orange): 'Alto sedentarismo y deserción deportiva', 'Partidos desequilibrados y frustración', 'Deudas financieras impagas', and 'Subutilización de instalaciones'.\nCauses below (colored in blue): 'Uso informal de WhatsApp', 'Dispersión de sistemas de reserva', 'Ausencia de métricas objetivas de habilidad', and 'Gestión manual de pagos'.\nConnect all nodes with clean lines illustrating the root cause analysis.\n```\n");

append("Figura 04");
append("*Árbol de Objetivos y solución sistémica*");
append("```mermaid\ngraph BT\n    FIN1[Fin Ultimo: Incremento de la actividad fisica y bienestar en Lima]\n    FIN2[Fin 2: Encuentros deportivos equilibrados y altamente competitivos]\n    FIN3[Fin 3: Transacciones transparentes y cero deudas en reservas]\n    FIN4[Fin 4: Maximizacion de la ocupacion de canchas deportivas]\n    \n    OBJ[OBJETIVO GENERAL: Desarrollar e implementar la plataforma SportMatch Connect para unificar el ecosistema deportivo]\n    \n    M1[Medio 1: Red social y chat en tiempo real con moderacion IA]\n    M2[Medio 2: Motor de reservas en mapa interactivo con PostGIS]\n    M3[Medio 3: Algoritmo de matchmaking predictivo con score Elo]\n    M4[Medio 4: Pasarela Stripe e integracion de moneda FitCoins]\n    \n    M1 --> OBJ\n    M2 --> OBJ\n    M3 --> OBJ\n    M4 --> OBJ\n    OBJ --> FIN1\n    OBJ --> FIN2\n    OBJ --> FIN3\n    OBJ --> FIN4\n    \n    style OBJ fill:#10b981,color:#fff,stroke-width:2px\n    style FIN1 fill:#059669,color:#fff\n    style M1 fill:#6366f1,color:#fff\n    style M2 fill:#6366f1,color:#fff\n    style M3 fill:#6366f1,color:#fff\n    style M4 fill:#6366f1,color:#fff\n```");
append("Nota: Elaboración propia.\n");
append("```text\n[Prompt Detallado de Réplica de la Figura 04]\nCreate a bottom-up Means-End Tree Diagram (Árbol de Objetivos) in Mermaid.js.\nCentral Objective Node (colored in emerald green): 'OBJETIVO GENERAL: Desarrollar e implementar la plataforma SportMatch Connect'.\nMeans below (colored in indigo): 'Red social y chat realtime', 'Motor de reservas PostGIS', 'Algoritmo de matchmaking predictivo', and 'Pasarela Stripe + FitCoins'.\nEnds above (colored in dark green): 'Incremento de la actividad física y bienestar', 'Encuentros equilibrados', 'Transacciones transparentes', and 'Maximización de ocupación de canchas'.\nUse clear directional arrows pointing upwards.\n```\n");

append("## 1.4 Objetivos de la Investigación\n");
append("### 1.4.1 Objetivo General");
append("Diseñar, desarrollar, evaluar y desplegar en producción la plataforma digital distribuida SportMatch Connect, integrando matchmaking predictivo multivariable, red social deportiva, gestión de reservas geolocalizadas con PostGIS, economía gamificada en FitCoins con pasarela Stripe y asistente interactivo con Google Vertex AI, bajo la metodología ágil Scrum y estándares de calidad industrial (CI/CD, TDD y OWASP Top 10) durante el periodo 2026-I.\n");
append("### 1.4.2 Objetivos Específicos");
append("- **OE-01:** Construir una arquitectura desacoplada fullstack compuesta por un frontend React 19 en Feature-Sliced Design (FSD) y un backend NestJS 11 modular con Prisma ORM.");
append("- **OE-02:** Desarrollar e implementar un motor de matchmaking predictivo basado en un algoritmo multivariable ponderado (distancia Haversine, deporte, nivel Elo y trust score).");
append("- **OE-03:** Implementar la red social deportiva con publicaciones multimedia, comentarios anidados, reacciones, Squads y mensajería directa WebSocket con Supabase Realtime.");
append("- **OE-04:** Integrar el asistente conversacional Sporty mediante Google Vertex AI (Gemini 2.5 Flash), con procesamiento de voz bidireccional (STT/TTS) y localización multi-idioma (es/en/pt).");
append("- **OE-05:** Aplicar un modelo de seguridad multicapa (Defense in Depth) con 78 políticas SQL de Row Level Security (RLS) en PostgreSQL 15, autenticación JWT y moderación híbrida IA (NSFWJS y Ensemble Model).");
append("- **OE-06:** Certificar la calidad del software alcanzando 78 pruebas unitarias con Vitest (100% PASS), pruebas E2E con Playwright y SonarQube Quality Gate PASSED con 0 vulnerabilidades.");
append("- **OE-07:** Formular y validar el modelo de negocio híbrido B2C/B2B y la viabilidad financiera a 3 años demostrando rentabilidad y punto de equilibrio positivo.\n");
append("---\n");

console.log("Capítulo I completado.");
