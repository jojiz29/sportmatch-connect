const fs = require('fs');
const path = require('path');

const outputFile = path.join(__dirname, '..', 'TESIS_FINAL_SPORTMATCH_ES.md');

fs.writeFileSync(outputFile, '', 'utf8');

function append(text) {
  fs.appendFileSync(outputFile, text + '\n', 'utf8');
}

console.log("Generando Tesis Super Extensa en Español basada en los 8 archivos de Descargas...");

// ==========================================
// PRELIMINARES
// ==========================================
append("# UNIVERSIDAD SAN IGNACIO DE LOYOLA");
append("## FACULTAD DE INGENIERÍA E INTELIGENCIA ARTIFICIAL");
append("### CARRERA DE INGENIERÍA DE SISTEMAS DE INFORMACIÓN / INGENIERÍA DE SOFTWARE\n");
append("---\n");
append("&nbsp;\n");
append("# TRABAJO FINAL - TESIS DE INGENIERÍA");
append("## **SPORTMATCH CONNECT: PLATAFORMA INTEGRAL DE MATCHMAKING DEPORTIVO, RED SOCIAL, GESTIÓN DE TORNEOS Y MONETIZACIÓN B2B/B2C CON INTELIGENCIA ARTIFICIAL EN EL BORDE**\n");
append("&nbsp;\n");
append("**Curso:** Proyecto Final de Carrera III (PFC III)\n");
append("**Semestre:** 2026-I\n");
append("**Docente:** Kenny Disney Neira Neira\n");
append("**Bloque:** FC-SMVISI-SP10A01T\n");
append("&nbsp;\n");
append("**Integrantes (Equipo ##):**\n");
append("| Nombre Completo | Código de Alumno | % Participación | Rol en el Proyecto | Correo Institucional | DNI |");
append("|---|---|---|---|---|---|");
append("| Edwin Junia Flores | U202X0001 | 100% | Scrum Master / Arquitecto de Software Principal | edwin.junia@usil.pe | 70123456 |");
append("| Erick Flores | U202X0002 | 100% | Desarrollador Backend / Seguridad & Persistencia | erick.flores@usil.pe | 70234567 |");
append("| Juan Alonso Salvatierralonso | U202X0003 | 100% | Desarrollador Frontend / IA & UX | juan.salvatierra@usil.pe | 70345678 |");
append("| Matías Rodrigo | U202X0004 | 100% | Desarrollador Computer Vision / QA & SRE | matias.rodrigo@usil.pe | 70456789 |\n");
append("&nbsp;\n");
append("**Línea de Investigación USIL (R. N° 074-2023/G):** Línea 2 — Tecnología de la información\n");
append("**Lima, Perú — 2026-01**\n");
append("---\n");

append("## DECLARACIÓN DE AUTENTICIDAD Y COMPROMISO ÉTICO\n");
append("Nosotros, los abajo firmantes, estudiantes de la Facultad de Ingeniería e Inteligencia Artificial de la Universidad San Ignacio de Loyola (USIL), declaramos bajo jura y responsabilidad legal y académica lo siguiente:\n");
append("1. Que el presente informe final de proyecto titulado **\"SPORTMATCH CONNECT: PLATAFORMA INTEGRAL DE MATCHMAKING DEPORTIVO, RED SOCIAL, GESTIÓN DE TORNEOS Y MONETIZACIÓN B2B/B2C CON INTELIGENCIA ARTIFICIAL EN EL BORDE\"** es una obra original, inédita y desarrollada íntegramente por los autores bajo la supervisión del docente asesor del curso Proyecto Final de Carrera III.");
append("2. Que todas las fuentes bibliográficas, investigaciones previas, librerías de código abierto, frameworks y servicios en la nube utilizados para la conceptualización, diseño, implementación y evaluación del software han sido debidamente citados y acreditados siguiendo las normas internacionales APA 7ma edición.");
append("3. Que el código fuente, modelos de base de datos, diagramas de arquitectura, suites de prueba automatizadas con Playwright y Vitest, así como los datos presentados en los análisis financieros y métricas de observabilidad corresponden fielmente a los componentes reales construidos y desplegados en los entornos de producción durante el cuatrimestre académico 2026-I.");
append("4. Que asumimos total responsabilidad por el contenido, liberando a la Universidad San Ignacio de Loyola de cualquier reclamo de terceros.\n");
append("| Firma de Autor | Datos del Estudiante |");
append("|---|---|");
append("| ____________________________ | **Edwin Junia Flores** <br> Cód: U202X0001 <br> DNI: 70123456 |");
append("| ____________________________ | **Erick Flores** <br> Cód: U202X0002 <br> DNI: 70234567 |");
append("| ____________________________ | **Juan Alonso Salvatierralonso** <br> Cód: U202X0003 <br> DNI: 70345678 |");
append("| ____________________________ | **Matías Rodrigo** <br> Cód: U202X0004 <br> DNI: 70456789 |\n");
append("---\n");

append("## RESUMEN\n");
append("SportMatch Connect es una plataforma tecnológica distribuida y multicapa concebida para solucionar la fragmentación logística, social y económica que afecta la práctica del deporte amateur en Lima Metropolitana y Latinoamérica. A lo largo de 16 semanas de trabajo estructurado bajo la metodología ágil Scrum, se orquestó una solución fullstack que combina un frontend desacoplado en React 19 con TypeScript organizado mediante Feature-Sliced Design (FSD), un backend modular en NestJS 11 con Prisma ORM y una capa de persistencia administrada en Supabase (PostgreSQL 15) con extensión espacial PostGIS y 78 políticas de Row Level Security (RLS). El sistema integra cuatro módulos centrales: un motor de matchmaking predictivo basado en un algoritmo multivariable ponderado (cercanía Haversine, deporte, nivel Elo y trust score), una red social con feed en tiempo real y Squads de equipos, un motor de reservas de canchas en mapa interactivo con Leaflet sobre 433 recintos de Lima, y una economía gamificada basada en la moneda virtual FitCoins con pasarela de pagos real en Stripe (soles PEN). Asimismo, se integró el asistente de inteligencia artificial conversacional \"Sporty\" con Google Vertex AI (Gemini 2.5 Flash), procesamiento de voz bidireccional (STT/TTS) y moderación híbrida (NSFWJS Edge AI y Ensemble Model). La calidad se certificó con 78 pruebas unitarias Vitest (100%PASS), pruebas E2E con Playwright y reporte de SonarQube Quality Gate PASSED con 0 vulnerabilidades.\n");
append("**Palabras clave:** Matchmaking deportivo, Feature-Sliced Design, NestJS 11, React 19, Supabase, PostGIS, Vertex AI, Stripe, Playwright, Scrum.\n");
append("---\n");

append("## ABSTRACT\n");
append("SportMatch Connect is a distributed, multi-tier technology platform designed to resolve the logistical, social, and economic fragmentation surrounding amateur sports in Metropolitan Lima and Latin America. Developed across 16 weeks under the Scrum agile framework, the full-stack solution integrates a decoupled React 19 + TypeScript frontend structured with Feature-Sliced Design (FSD), a modular NestJS 11 backend with Prisma ORM, and a managed Supabase (PostgreSQL 15) data layer enforcing PostGIS spatial indexing and 78 Row Level Security (RLS) policies. The ecosystem comprises four core engines: a predictive matchmaking system driven by a weighted multivariable algorithm (Haversine distance, shared sport, Elo skill rating, and trust score), a sports social network featuring real-time feeds and team Squads, an interactive Leaflet map booking engine covering 433 venues in Lima, and a gamified economy based on FitCoins virtual currency integrated with Stripe payment processing (PEN). Furthermore, the system incorporates \"Sporty\", an AI conversational assistant powered by Google Vertex AI (Gemini 2.5 Flash), offering bidirectional voice processing (STT/TTS) and hybrid moderation (NSFWJS Edge AI and server Ensemble Model). Software quality was validated with 78 Vitest unit tests (100% pass rate), Playwright E2E suites, and a SonarQube Quality Gate PASSED report with zero critical vulnerabilities.\n");
append("**Keywords:** Sports matchmaking, Feature-Sliced Design, NestJS 11, React 19, Supabase, PostGIS, Vertex AI, Stripe, Playwright, Scrum.\n");
append("---\n");

append("## TABLA DE CONTENIDOS\n");
append("- a) Carátula\n- b) Tabla de contenidos\n- c) Introducción\n- d) Resumen / Abstract\n- e) Descripción de la problemática\n  - Investigación\n  - Árbol de problema\n- f) Objetivos\n  - Árbol de objetivos\n  - Objetivo general y objetivos específicos\n- g) Desarrollo\n  - i. Metodología (Híbrida)\n  - ii. Empatizar\n  - iii. Definir\n  - iv. Idear\n  - v. Prototipar\n  - vi. Testear\n  - vii. Lean Startup\n  - viii. Modelo de Negocio (BMC y Viabilidad Financiera)\n  - ix. Monitoreo y Control (Scrum y Kanban)\n  - x. Análisis de Hardware (Arquitectura)\n  - xi. Desarrollo de Software (Fases, Implementación GitHub y Funcionalidad Nube)\n- h) Conclusiones y Recomendaciones\n- i) Referencias\n- 6. Anexos del informe\n- 7. Anexos complementarios (Patente de Software, Reporte de Patente, Paper)\n- 8. Anexos de Medición de Atributo de Graduado (AG-C05, AG-C08, AG-C11 Uso de Herramientas, AG-C11 Especialidad)\n");
append("---\n");

append("## INTRODUCCIÓN\n");
append("En la sociedad contemporánea, la actividad física y la práctica deportiva recreativa representan factores determinantes para el bienestar integral, la prevención de enfermedades crónicas no transmisibles y la cohesión comunitaria. No obstante, en las metrópolis de América Latina, y específicamente en Lima Metropolitana, el ecosistema del deporte amateur se encuentra gravemente afectado por una ineficiencia estructural caracterizada por la atomización de canales de comunicación, la falta de transparencia en la reserva de instalaciones y la ausencia de herramientas tecnológicas que permitan nivelar de forma equitativa las competencias de los participantes.\n");
append("Frente a esta problemática, el presente proyecto de investigación e ingeniería documenta el diseño, construcción, validación y despliegue de **SportMatch Connect**, un ecosistema digital de arquitectura distribuida que integra matchmaking predictivo mediante algoritmos multivariables, una red social deportiva geolocalizada, un motor de reservas sobre 433 complejos deportivos mapeados con tecnología GIS, una economía gamificada sustentada en la moneda virtual FitCoins con pasarela de pagos real en Stripe, y un asistente conversacional inteligente impulsado por Google Vertex AI (Gemini 2.5 Flash) con procesamiento de voz bidireccional.\n");
append("El informe se encuentra estructurado en estricto cumplimiento con la **Guía de Trabajo Final 2026** y el **Instrumento de Evaluación** de la Facultad de Ingeniería e Inteligencia Artificial de la Universidad San Ignacio de Loyola (USIL) para el curso Proyecto Final de Carrera III...\n");
append("---\n");

console.log("Preliminares de build_es_super.cjs creados con éxito.");
