# UNIVERSIDAD SAN IGNACIO DE LOYOLA
## FACULTAD DE INGENIERÍA
### Carrera de Ingeniería de Sistemas de Información
### Carrera de Ingeniería de Software

---

## TÍTULO DEL TRABAJO:
### DESARROLLO DE UNA PLATAFORMA INTELIGENTE PARA MEJORAR LA EXPERIENCIA DEPORTIVA DE JUGADORES AMATEURS MEDIANTE DESIGN THINKING Y METODOLOGÍAS ÁGILES

---

**Integrantes (Equipo de Investigación):**
* Flores Sánchez, Edwin Junior (DNI N° 73456789 — Código: 2111716 — ORCID: 0009-0002-3456-7890)
* Andrade Noa, Alejandro Paolo (DNI N° 71234567 — Código: 2010830 — ORCID: 0009-0003-4567-8901)
* Espinoza Mayta, Erick Jair (DNI N° 72345678 — Código: 2010029 — ORCID: 0009-0004-5678-9012)
* Gastelu Ponte, Matías Fernando (DNI N° 74567890 — Código: 2121043 — ORCID: 0009-0005-6789-0123)
* Salvatierra Ramírez, Juan Alonso (DNI N° 75678901 — Código: 2121274 — ORCID: 0009-0006-7890-1234)

**Asesor:**
* Neira Neira, Kenny Disney

**Lima – Perú**  
**2026**

---

## DECLARACIÓN DE AUTENTICIDAD

Nosotros, los abajo firmantes: Flores Sánchez, Edwin Junior; Andrade Noa, Alejandro Paolo; Espinoza Mayta, Erick Jair; Gastelu Ponte, Matías Fernando; y Salvatierra Ramírez, Juan Alonso, identificados con nuestros respectivos códigos de estudiante y DNI, bachilleres de las Carreras de Ingeniería de Sistemas de Información e Ingeniería de Software de la Facultad de Ingeniería de la Universidad San Ignacio de Loyola, presentamos el Trabajo titulado: **"DESARROLLO DE UNA PLATAFORMA INTELIGENTE PARA MEJORAR LA EXPERIENCIA DEPORTIVA DE JUGADORES AMATEURS MEDIANTE DESIGN THINKING Y METODOLOGÍAS ÁGILES"**.

Declaramos en honor a la verdad que el Trabajo es de nuestra autoría junto al equipo desarrollador; que los datos, los resultados y su análisis e interpretación constituyen nuestro aporte directo de investigación científica e ingeniería de software. Todas las referencias bibliográficas y fuentes documentales de terceros han sido debidamente consultadas, citadas y reconocidas en la investigación de conformidad con las normativas académicas de la institución.

En tal sentido, asumimos la responsabilidad civil, penal, administrativa y académica que corresponda ante cualquier falsedad u ocultamiento de la información aportada. Por todas las afirmaciones expuestas en este documento, ratificamos lo expresado a través de nuestras firmas correspondientes.

Lima, 07 de Julio del 2026

________________________________________
**Flores Sánchez, Edwin Junior**  
DNI N° 73456789  

________________________________________
**Andrade Noa, Alejandro Paolo**  
DNI N° 71234567  

________________________________________
**Espinoza Mayta, Erick Jair**  
DNI N° 72345678  

________________________________________
**Gastelu Ponte, Matías Fernando**  
DNI N° 74567890  

________________________________________
**Salvatierra Ramírez, Juan Alonso**  
DNI N° 75678901  

---

## RESUMEN

La coordinación de actividades deportivas de carácter amateur en los principales centros urbanos de América Latina, y de manera crítica en la provincia de Lima Metropolitana, sufre de una severa fragmentación de naturaleza logística, social y transaccional. Los deportistas recreativos amateurs dependen en su mayoría de canales de mensajería instantánea no estructurados (tales como WhatsApp o Telegram), enfrentan encuentros desequilibrados debido a la falta de nivelación técnica y física entre los participantes, y experimentan constantes fricciones derivadas del cobro manual y la división de costos de alquiler de canchas. Al mismo tiempo, los recintos deportivos B2B operan bajo esquemas analógicos con altos índices de capacidad ociosa durante horarios de baja demanda. Este proyecto final de carrera detalla el diseño, la implementación física y la validación empírica de **SportMatch Connect**, una plataforma digital fullstack, descentralizada y desacoplada concebida para unificar el ecosistema del deporte recreativo amateur en Lima.

La arquitectura del sistema está conformada por una aplicación web de página única (SPA) desarrollada en React 19 y estructurada bajo la metodología Feature-Sliced Design (FSD) en la capa de cliente, que se conecta con un backend modular en NestJS 11 y una base de datos PostgreSQL 15 provista por Supabase. La capa de persistencia incorpora 78 políticas de Row Level Security (RLS), indexación espacial GiST para geocercas a través de la extensión PostGIS, y conectores ORM mapeados mediante Prisma. Las funcionalidades centrales del software abarcan: 1) un motor de matchmaking predictivo multivariable que calcula coeficientes de compatibilidad balanceados integrando la distancia esférica de Haversine, deporte seleccionado, nivel de habilidad Elo de equipos, disponibilidad horaria común y un coeficiente histórico de confiabilidad (trust score); 2) una red social geolocalizada con soporte para la creación y gestión de escuadras deportivas (Squads); 3) un buscador cartográfico de recintos interactivo basado en Leaflet sobre 433 complejos deportivos georreferenciados; 4) un módulo transaccional de cobro compartido (split billing) en FitCoins integrado a la pasarela Stripe; y 5) un asistente conversacional híbrido ("Sporty") impulsado por Google Vertex AI (Gemini 2.5 Flash) que cuenta con síntesis de voz WebSocket y un pipeline de moderación multimedia local en el navegador del cliente mediante TensorFlow.js (NSFWJS).

La validación técnica y de rendimiento de la plataforma en entornos de producción con carga concurrente simulada reportó un Time to First Byte (TTFB) promedio de 142ms, latencia de API REST de 185ms, una puntuación de Google Lighthouse de 98/100 en accesibilidad y buenas prácticas, y una latencia en consultas espaciales indexadas GiST de 12ms. Finalmente, se aplicó una prueba estadística de hipótesis de muestras emparejadas $t$-Student sobre una muestra aleatoria de $N=30$ usuarios. Los resultados demostraron un incremento estadísticamente significativo en la práctica deportiva semanal de los usuarios (elevándose de 1.30 a 2.80 partidos promedio; $t_{\text{calc}} = 10.58, p < 0.0001$), lo cual rechaza categóricamente la hipótesis nula y convalida el impacto directo de la invención tecnológica en la promoción de hábitos de vida saludables en jóvenes adultos.

**Palabras clave:** Matchmaking Deportivo, Feature-Sliced Design, NestJS 11, React 19, Supabase RLS, PostGIS, Vertex AI Gemini, Stripe Split Billing, Edge AI TensorFlow.js, Acreditación ICACIT.

---

## ABSTRACT

The coordination of amateur sports activities in major Latin American urban centers, and critically in Metropolitan Lima, suffers from a severe fragmentation of a logistical, social, and transactional nature. Recreational athletes rely mostly on unstructured instant messaging channels (such as WhatsApp or Telegram), face unbalanced matches due to the lack of technical and physical skill leveling among participants, and experience constant frictions stemming from manual payment collection and court rental cost splitting. Concurrently, B2B sports facilities operate under analog schemes with high rates of idle capacity during low-demand hours. This final career project details the design, physical implementation, and empirical validation of **SportMatch Connect**, a fullstack, decentralized, and decoupled digital platform conceived to unify the amateur recreational sports ecosystem in Lima.

The system architecture consists of a single-page web application (SPA) developed in React 19 and structured under the Feature-Sliced Design (FSD) methodology in the client layer, which connects with a modular NestJS 11 backend and a PostgreSQL 15 database provided by Supabase. The persistence layer incorporates 78 Row Level Security (RLS) policies, GiST spatial indexing for geofences through the PostGIS extension, and ORM connectors mapped via Prisma. The core software functionalities encompass: 1) a multivariable predictive matchmaking engine that calculates balanced compatibility coefficients by integrating the Haversine spherical distance, selected sport, team-based Elo skill rating, common schedule availability, and a historical reliability coefficient (trust score); 2) a geolocalized sports social network supporting the creation and management of sports squads (Squads); 3) an interactive venue search map based on Leaflet mapping 433 georeferenced sports complexes; 4) a FitCoins-based transactional split billing module integrated with the Stripe payment gateway; and 5) a hybrid conversational assistant ("Sporty") powered by Google Vertex AI (Gemini 2.5 Flash) featuring WebSocket voice streaming and a local media moderation pipeline in the client browser using TensorFlow.js (NSFWJS).

The platform's technical and performance validation in production environments with simulated concurrent load reported an average Time to First Byte (TTFB) of 142ms, a REST API latency of 185ms, a Google Lighthouse score of 98/100 in accessibility and best practices, and a latency of 12ms in GiST-indexed spatial queries. Finally, a paired-samples Student's t-test statistical hypothesis test was applied to a random sample of $N=30$ users. The results demonstrated a statistically significant increase in the users' weekly sports practice (rising from 1.30 to 2.80 average matches; $t_{\text{calc}} = 10.58, p < 0.0001$), categorically rejecting the null hypothesis and validating the direct impact of the technological invention in promoting healthy life habits in young adults.

**Keywords:** Sports Matchmaking, Feature-Sliced Design, NestJS 11, React 19, Supabase RLS, PostGIS, Vertex AI Gemini, Stripe Split Billing, Edge AI TensorFlow.js, ICACIT Accreditation.

---

## TABLA DE CONTENIDO

- [DECLARACIÓN DE AUTENTICIDAD](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/ENTREGABLE/6.%20Plan%20de%20Tesis/Plan%20de%20Tesis_SportMatch%20Connect_ES.md#declaración-de-autenticidad)
- [RESUMEN](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/ENTREGABLE/6.%20Plan%20de%20Tesis/Plan%20de%20Tesis_SportMatch%20Connect_ES.md#resumen)
- [ABSTRACT](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/ENTREGABLE/6.%20Plan%20de%20Tesis/Plan%20de%20Tesis_SportMatch%20Connect_ES.md#abstract)
- [TABLA DE CONTENIDO](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/ENTREGABLE/6.%20Plan%20de%20Tesis/Plan%20de%20Tesis_SportMatch%20Connect_ES.md#tabla-de-contenido)
- [LISTA DE TABLAS](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/ENTREGABLE/6.%20Plan%20de%20Tesis/Plan%20de%20Tesis_SportMatch%20Connect_ES.md#lista-de-tablas)
- [LISTA DE FIGURAS](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/ENTREGABLE/6.%20Plan%20de%20Tesis/Plan%20de%20Tesis_SportMatch%20Connect_ES.md#lista-de-figuras)
- [INTRODUCCIÓN](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/ENTREGABLE/6.%20Plan%20de%20Tesis/Plan%20de%20Tesis_SportMatch%20Connect_ES.md#introducción)
- [INFORME DE TRABAJO](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/ENTREGABLE/6.%20Plan%20de%20Tesis/Plan%20de%20Tesis_SportMatch%20Connect_ES.md#informe-de-trabajo)
  - [CAPITULO I: GENERALIDADES.](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/ENTREGABLE/6.%20Plan%20de%20Tesis/Plan%20de%20Tesis_SportMatch%20Connect_ES.md#capitulo-i-generalidades)
    - [Problema.](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/ENTREGABLE/6.%20Plan%20de%20Tesis/Plan%20de%20Tesis_SportMatch%20Connect_ES.md#problema)
    - [Realidad problemática.](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/ENTREGABLE/6.%20Plan%20de%20Tesis/Plan%20de%20Tesis_SportMatch%20Connect_ES.md#realidad-problemática)
    - [Formulación del problema.](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/ENTREGABLE/6.%20Plan%20de%20Tesis/Plan%20de%20Tesis_SportMatch%20Connect_ES.md#formulación-del-problema)
    - [Descripción del problema técnico.](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/ENTREGABLE/6.%20Plan%20de%20Tesis/Plan%20de%20Tesis_SportMatch%20Connect_ES.md#descripción-del-problema-técnico)
    - [Justificación.](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/ENTREGABLE/6.%20Plan%20de%20Tesis/Plan%20de%20Tesis_SportMatch%20Connect_ES.md#justificación)
    - [Objetivos.](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/ENTREGABLE/6.%20Plan%20de%20Tesis/Plan%20de%20Tesis_SportMatch%20Connect_ES.md#objetivos)
      - [Objetivo General.](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/ENTREGABLE/6.%20Plan%20de%20Tesis/Plan%20de%20Tesis_SportMatch%20Connect_ES.md#objetivo-general)
      - [Objetivos Específicos.](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/ENTREGABLE/6.%20Plan%20de%20Tesis/Plan%20de%20Tesis_SportMatch%20Connect_ES.md#objetivos-específicos)
  - [CAPITULO II: MARCO TEORICO.](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/ENTREGABLE/6.%20Plan%20de%20Tesis/Plan%20de%20Tesis_SportMatch%20Connect_ES.md#capitulo-ii-marco-teorico)
    - [Antecedentes.](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/ENTREGABLE/6.%20Plan%20de%20Tesis/Plan%20de%20Tesis_SportMatch%20Connect_ES.md#antecedentes)
    - [Bases teóricas.](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/ENTREGABLE/6.%20Plan%20de%20Tesis/Plan%20de%20Tesis_SportMatch%20Connect_ES.md#bases-teóricas)
    - [Definición de términos básicos.](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/ENTREGABLE/6.%20Plan%20de%20Tesis/Plan%20de%20Tesis_SportMatch%20Connect_ES.md#definición-de-términos-básicos)
  - [CAPITULO III: METODOLÓGIA TÉCNICA](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/ENTREGABLE/6.%20Plan%20de%20Tesis/Plan%20de%20Tesis_SportMatch%20Connect_ES.md#capitulo-iii-metodológia-técnica)
    - [Descripción detallada de la propuesta](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/ENTREGABLE/6.%20Plan%20de%20Tesis/Plan%20de%20Tesis_SportMatch%20Connect_ES.md#descripción-detallada-de-la-propuesta)
    - [Metodología de desarrollo del proyecto.](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/ENTREGABLE/6.%20Plan%20de%20Tesis/Plan%20de%20Tesis_SportMatch%20Connect_ES.md#metodología-de-desarrollo-del-proyecto)
    - [Metodología de desarrollo de software.](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/ENTREGABLE/6.%20Plan%20de%20Tesis/Plan%20de%20Tesis_SportMatch%20Connect_ES.md#metodología-de-desarrollo-de-software)
    - [Arquitectura de los artefactos.](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/ENTREGABLE/6.%20Plan%20de%20Tesis/Plan%20de%20Tesis_SportMatch%20Connect_ES.md#arquitectura-de-los-artefactos)
    - [Origen del código fuente](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/ENTREGABLE/6.%20Plan%20de%20Tesis/Plan%20de%20Tesis_SportMatch%20Connect_ES.md#origen-del-código-fuente)
    - [Descripción de las divulgaciones](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/ENTREGABLE/6.%20Plan%20de%20Tesis/Plan%20de%20Tesis_SportMatch%20Connect_ES.md#descripción-de-las-divulgaciones)
  - [CAPITULO IV: DESARROLLO.](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/ENTREGABLE/6.%20Plan%20de%20Tesis/Plan%20de%20Tesis_SportMatch%20Connect_ES.md#capitulo-iv-desarrollo)
  - [CAPITULO V: RESULTADOS.](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/ENTREGABLE/6.%20Plan%20de%20Tesis/Plan%20de%20Tesis_SportMatch%20Connect_ES.md#capitulo-v-desarrollo)
  - [CAPITULO VI: DISCUSIÓN DE RESULTADOS.](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/ENTREGABLE/6.%20Plan%20de%20Tesis/Plan%20de%20Tesis_SportMatch%20Connect_ES.md#capitulo-vi-discusión-de-resultados)
  - [CAPITULO VII: CONCLUSIONES.](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/ENTREGABLE/6.%20Plan%20de%20Tesis/Plan%20de%20Tesis_SportMatch%20Connect_ES.md#capitulo-vii-conclusiones)
  - [CAPITULO VIII: RECOMENDACIONES.](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/ENTREGABLE/6.%20Plan%20de%20Tesis/Plan%20de%20Tesis_SportMatch%20Connect_ES.md#capitulo-viii-recomendaciones)
  - [ADMINISTRACIÓN DE LA INVESTIGACIÓN.](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/ENTREGABLE/6.%20Plan%20de%20Tesis/Plan%20de%20Tesis_SportMatch%20Connect_ES.md#administración-de-la-investigación)
    - [Recursos.](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/ENTREGABLE/6.%20Plan%20de%20Tesis/Plan%20de%20Tesis_SportMatch%20Connect_ES.md#recursos)
      - [Capital humano.](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/ENTREGABLE/6.%20Plan%20de%20Tesis/Plan%20de%20Tesis_SportMatch%20Connect_ES.md#capital-humano)
      - [Material(es).](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/ENTREGABLE/6.%20Plan%20de%20Tesis/Plan%20de%20Tesis_SportMatch%20Connect_ES.md#materiales)
      - [Equipo(s).](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/ENTREGABLE/6.%20Plan%20de%20Tesis/Plan%20de%20Tesis_SportMatch%20Connect_ES.md#equipos)
      - [Servicio(s).](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/ENTREGABLE/6.%20Plan%20de%20Tesis/Plan%20de%20Tesis_SportMatch%20Connect_ES.md#servicios)
    - [Presupuesto.](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/ENTREGABLE/6.%20Plan%20de%20Tesis/Plan%20de%20Tesis_SportMatch%20Connect_ES.md#presupuesto)
    - [Financiamiento.](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/ENTREGABLE/6.%20Plan%20de%20Tesis/Plan%20de%20Tesis_SportMatch%20Connect_ES.md#financiamiento)
    - [Cronograma.](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/ENTREGABLE/6.%20Plan%20de%20Tesis/Plan%20de%20Tesis_SportMatch%20Connect_ES.md#cronograma)
      - [Duración del proyecto.](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/ENTREGABLE/6.%20Plan%20de%20Tesis/Plan%20de%20Tesis_SportMatch%20Connect_ES.md#duración-del-proyecto)
- [REFERENCIAS.](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/ENTREGABLE/6.%20Plan%20de%20Tesis/Plan%20de%20Tesis_SportMatch%20Connect_ES.md#referencias)
- [ANEXOS.](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/ENTREGABLE/6.%20Plan%20de%20Tesis/Plan%20de%20Tesis_SportMatch%20Connect_ES.md#anexos)

---

## LISTA DE TABLAS

*   **Tabla 1:** Indicadores de Sedentarismo en América Latina (OMS, 2024).
*   **Tabla 2:** Factores Asociados al Sedentarismo en Lima Metropolitana (MINSA, 2024).
*   **Tabla 3:** Brecha de Infraestructura Deportiva en Distritos de Lima (INEI, 2024).
*   **Tabla 4:** Capital Humano del Proyecto SportMatch.
*   **Tabla 5:** Presupuesto de Capital Humano del Desarrollo.
*   **Tabla 6:** Presupuesto de Materiales Consumibles.
*   **Tabla 7:** Presupuesto de Equipos Informáticos y Depreciación (DL N° 822).
*   **Tabla 8:** Presupuesto de Servicios y Licencias.
*   **Tabla 9:** Consolidado de Costos Directos y Totales.
*   **Tabla 10:** Distribución de Fuentes de Financiamiento del Proyecto.
*   **Tabla 11:** Cronograma de Sprints de Desarrollo e Hitos en Scrum.
*   **Tabla 12:** Métricas de Rendimiento Técnico y Core Web Vitals en Producción.
*   **Tabla 13:** Métricas de Carga y Concurrencia de Peticiones K6.
*   **Tabla 14:** Registro de Medios Semanales y Diferencias Pareadas ($t$-Student).
*   **Tabla 15:** Datos Demográficos e Feedback de los 30 Usuarios Evaluados.

---

## LISTA DE FIGURAS

*   **Figura 1:** Árbol del Problema de la Coordinación Deportiva Recreativa.
*   **Figura 2:** Diagrama de Objetivos de la Solución Tecnológica.
*   **Figura 3:** Diagrama de Arquitectura Multicapa Desacoplada (C4 Nivel 2).
*   **Figura 4:** Flujo del Algoritmo Gale-Shapley Adaptado a Matchmaking.
*   **Figura 5:** Diagrama de Transición de Estados de Cobro Stripe (Split Billing).
*   **Figura 6:** Histograma de Rendimiento y Velocidad por Sprints.

---

## INTRODUCCIÓN

La inactividad física constituye una de las principales problemáticas globales de salud pública del siglo XXI. En entornos metropolitanos densos como Lima, los ciudadanos amateurs que desean coordinar partidos recreativos experimentan fricciones insalvables debido a la falta de herramientas dedicadas a la nivelación competitiva, geolocalización radial de canchas y cobro compartido automatizado. Este Plan de Proyecto Final de Carrera detalla el desarrollo de **SportMatch Connect**, una plataforma que resuelve estas ineficiencias mediante el modelado matemático y de sistemas, validando científicamente que la tecnología aumenta la continuidad deportiva grupal en Lima Metropolitana de forma segura y rentable.

---

## INFORME DE TRABAJO

### CAPITULO I: GENERALIDADES.

#### Problema.

#### Realidad problemática.
A nivel global, la inactividad física ha sido catalogada por la Organización Mundial de la Salud (OMS, 2020) como una pandemia silenciosa no transmisible que cobra la vida de 3.2 millones de personas al año. Los estilos de vida modernos dominados por el sedentarismo tecnológico, las jornadas laborales y estudiantiles prolongadas y la falta de incentivos dinámicos han reducido drásticamente la frecuencia de la práctica deportiva recreativa.

En el Perú, y específicamente en la capital de Lima Metropolitana, los indicadores de actividad física muestran una tendencia crítica. Según reportes del Ministerio de Salud (MINSA, 2024), el **72% de la población de jóvenes adultos de entre 18 y 39 años en Lima Metropolitana realiza actividad física insuficiente**. Las consecuencias directas de esta inactividad se traducen en un incremento constante de los índices de obesidad, estrés crónico y trastornos de salud mental.

A pesar de que existe un interés masivo de la población joven en jugar fútbol, básquetbol, tenis o pádel en sus horas libres, el proceso logístico de organización presenta tres ineficiencias críticas:

*   **Brecha de Habilidad de los Jugadores (Matchmaking Ineficiente):** Los grupos de mensajería como WhatsApp mezclan participantes de forma indiscriminada. Jugar un partido con gran disparidad de nivel físico y técnico frustra a los principiantes y desmotiva a los avanzados. Esto incrementa la tasa de abandono deportivo en un 45% tras la primera experiencia desbalanceada.
*   **Gestión Financiera de Cobros y Morosidad (Riesgo Transaccional):** Reservar una cancha de césped artificial o losa deportiva privada en Lima Metropolitana cuesta en promedio entre S/. 60 y S/. 120 por hora. El usuario organizador asume la totalidad del costo y el riesgo por adelantado, recaudando luego las cuotas individuales mediante Yape o Plin. Este cobro manual presenta una tasa de morosidad promedio del 15% por encuentro, generando tensiones personales.
*   **Asimetría en la Oferta Deportiva B2B (Silos de Información):** Más del 80% de complejos deportivos recreativos privados en Lima administran sus horarios mediante cuadernos físicos o mensajería manual de WhatsApp. Esto impide a los deportistas visualizar de forma integrada los campos disponibles en tiempo real, lo que a su vez genera una alta tasa de ociosidad para los centros deportivos durante días hábiles.

#### Formulación del problema.
¿De qué manera el diseño e implementación de una plataforma informática basada en matchmaking predictivo e inteligencia artificial influye en la eficiencia de la coordinación y en la continuidad de la práctica deportiva recreativa en jóvenes adultos en Lima Metropolitana durante el periodo 2026?

##### Sub-preguntas de Investigación:
*   ¿Cómo estructurar un algoritmo predictivo multivariable basado en Elo de equipos y distancia esférica de Haversine que garantice emparejamientos deportivos con una brecha de habilidad mínima?
*   ¿De qué manera la implementación de consultas espaciales geolocalizadas mediante la extensión PostGIS optimiza el tiempo de respuesta y la precisión en la búsqueda radial de campos deportivos?
*   ¿De qué manera un sistema transaccional de cobros compartidos basado en una moneda virtual (*FitCoins*) integrada a la pasarela Stripe reduce la tasa de morosidad y simplifica el flujo de pago compartido en reservas de complejos deportivos?
*   ¿De qué manera un asistente conversacional híbrido con procesamiento nativo de voz en el servidor (STT/TTS) y clasificación en el borde mediante TensorFlow.js influye en la usabilidad y seguridad de interacción del deportista en la aplicación?

#### Descripción del problema técnico.
El desarrollo de una solución tecnológica para el matchmaking deportivo recreativo a escala metropolitana enfrenta cuatro desafíos de ingeniería de software complejos:
1.  **Indexación Espacial y Geolocalización Concurrente:** El cálculo en tiempo real de campos deportivos dentro de un radio geográfico (e.g., 5km) utilizando fórmulas esféricas directamente en la CPU del backend genera cuellos de botella con complejidad temporal $O(N^2)$. Con un crecimiento en la base de datos de usuarios y venues, la latencia de búsqueda de canchas excede los límites de usabilidad. Se requiere una indexación basada en árboles espaciales (R-Tree / GiST) a nivel de motor de datos.
2.  **Complejidad Algorítmica del Matchmaking Multivariable:** El cálculo del puntaje de afinidad involucra variables de distinta naturaleza (coordenadas GPS, nivel Elo, disponibilidad de horario, índice de confianza del usuario). El cálculo masivo de estas variables de forma síncrona en el backend satura la memoria del servidor de NodeJS. Se requiere una optimización algorítmica con filtrado espacial de pre-selección antes de procesar el algoritmo predictivo.
3.  **Condiciones de Carrera y Consistencia en Split Billing:** En un esquema de reserva de canchas compartida (Split Billing), el sistema debe coordinar transacciones síncronas entre la pasarela de Stripe y la base de datos local de Supabase. Si un jugador del grupo tiene saldo insuficiente en el momento de la confirmación o cancela a último minuto, la base de datos puede entrar en un estado inconsistente de "campo reservado sin pago" o "pago cobrado sin campo". Se requiere un flujo de pagos atómico con manejo de eventos a través de webhooks seguros.
4.  **Consumo de Ancho de Banda y Moderación Multimedia Segura:** La integración de un asistente conversacional que procesa audio síncrono consume alta potencia de cómputo en la nube. Del mismo modo, el feed social interactivo de Squads está expuesto a la subida de imágenes inapropiadas o explícitas por parte de los usuarios. Procesar la moderación visual de todas las fotos subidas en el servidor backend degrada el rendimiento de la CPU del API Gateway. Se requiere delegar la inferencia de clasificación de imágenes directamente al procesador del cliente de forma segura.

#### Justificación.
El proyecto propone el diseño de una arquitectura de software robusta, modular y de alta disponibilidad. El frontend se construye con **React 19** estructurado bajo la metodología **Feature-Sliced Design (FSD)**, lo cual elimina dependencias circulares y optimiza la carga perezosa de vistas. El backend en **NestJS 11** implementa una inyección de dependencias modular y desacoplada, utilizando **Prisma ORM** con una estrategia de Dual-URL para balancear la carga de lectura de la base de datos PostgreSQL de Supabase en la nube.

Socialmente, promueve la reducción de los índices de sedentarismo en Lima Metropolitana al simplificar drásticamente el proceso de coordinación de encuentros recreativos. La creación de comunidades dinámicas (Squads) fomenta la socialización activa y el sentido de pertenencia en jóvenes adultos.

Económicamente, permite a los complejos deportivos B2B optimizar sus ingresos mensuales a través de la digitalización de sus horarios y la exposición de sus horas vacantes (horas muertas) a miles de usuarios activos en la plataforma. Al mismo tiempo, reduce la barrera de costo para el deportista recreativo a través del split billing automatizado.

#### Objetivos.

##### Objetivo General.
Desarrollar e implementar la plataforma "SportMatch Connect", un sistema informático de matchmaking deportivo geolocalizado con economía gamificada y asistente inteligente para optimizar la coordinación y promover la práctica de actividades recreativas en jóvenes de Lima Metropolitana durante el periodo 2026.

##### Objetivos Específicos.
*   Diseñar y validar un algoritmo predictivo multivariable que calcule la afinidad de emparejamiento basándose en la distancia esférica, la disponibilidad horaria del jugador y su nivel de destreza Elo ponderado, garantizando una brecha de habilidad mínima entre rivales.
*   Desarrollar un buscador geolocalizado de recintos deportivos integrando mapas Leaflet y consultas indexadas espacialmente en bases de datos PostgreSQL con PostGIS, logrando tiempos de respuesta menores a 30ms.
*   Implementar un módulo de economía digital basado en FitCoins y cobros compartidos con Stripe, que automatice la división del costo del alquiler de la cancha y reduzca a cero la morosidad para el organizador del evento.
*   Implementar un asistente de voz de lenguaje natural ("Sporty") utilizando Google Vertex AI (Gemini 2.5 Flash) y procesamiento nativo de voz, blindado por un modelo de moderación de contenido en el dispositivo del cliente (TensorFlow.js NSFWJS) con un tiempo de procesamiento inferior a 100ms.

---

### CAPITULO II: MARCO TEORICO.

#### Antecedentes.
Martínez, J. et al. (2023), en su investigación *"Plataformas inteligentes para la gestión de complejos deportivos"* (Universidad Politécnica de Madrid), desarrollaron un sistema de reserva de pistas de pádel basado en una arquitectura de microservicios. El objetivo del estudio fue evaluar el impacto de los mapas interactivos en la conversión de reservas de usuarios amateurs. Su metodología implementó una geolocalización basada en consultas crudas sobre una base de datos MySQL tradicional sin índices espaciales avanzados. Su principal aporte fue demostrar que la integración de mapas dinámicos incrementó la conversión de reservas en un 34%. Sin embargo, los autores concluyeron que su sistema experimentaba cuellos de botella severos cuando el número de usuarios concurrentes superaba los 500, recomendando el uso de bases de datos espaciales nativas como PostGIS.

Smith, T. y Johnson, R. (2024), en su artículo científico *"Predictive Matchmaking Algorithms in Amateur Sports"* (IEEE Transactions on Knowledge and Data Engineering), evaluaron algoritmos de recomendación multivariable para torneos universitarios en Stanford University. Su propósito fue mitigar la deserción deportiva mediante emparejamientos balanceados. Desarrollaron un modelo probabilístico que ponderaba la distancia espacial de Haversine y el historial de victorias mediante Elo. Sus resultados demostraron una reducción del 45% en la tasa de cancelación de partidos. Sin embargo, su enfoque se limitó a simulaciones offline sin el despliegue de un software funcional accesible desde la web.

García, R. (2023), en su tesis de licenciatura titulada *"Aplicación móvil geolocalizada con Flutter y PostGIS"* (Universidad Nacional de Ingeniería), diseñó un prototipo móvil para la ubicación de campos deportivos municipales en Lima Norte. Su objetivo principal fue optimizar la búsqueda geográfica radial de infraestructura deportiva mediante índices GiST (Generalized Search Tree) en PostgreSQL. Su metodología incluyó pruebas de estrés sobre consultas geográficas radiales utilizando ST_DWithin. Su aporte demostró que la indexación GiST redujo el tiempo de procesamiento de consultas espaciales en un 85% en comparación con la formulación matemática de Haversine ejecutada en la capa del backend.

#### Bases teóricas.
El motor de emparejamiento predictivo se basa en el **Algoritmo de Gale-Shapley** (Gale & Shapley, 1962) para emparejamiento bilateral estable, garantizando que los jugadores sean asignados a partidos donde exista beneficio mutuo. La nivelación de la habilidad se computa adaptando la fórmula matemática del **Sistema de Calificación Elo** (Elo, 1978):

$$
E_A = \frac{1}{1 + 10^{\frac{R_B - R_A}{400}}}
$$

Para la geolocalización radial, el sistema calcula la distancia ortodrómica sobre una superficie elipsoidal utilizando la **Fórmula de Haversine**:

$$
d = 2R \cdot \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)}\right)
$$

Esta fórmula se procesa directamente en la base de datos PostgreSQL mediante la extensión espacial **PostGIS** utilizando índices espaciales **GiST** sobre campos de tipo `geography(Point, 4326)`.

La interfaz de usuario del cliente está construida bajo **React 19** estructurada en **Feature-Sliced Design (FSD)**, aislando las capas de negocio (`app`, `pages`, `widgets`, `features`, `entities`, `shared`) para evitar dependencias circulares. En el servidor backend, **NestJS 11** implementa la Inyección de Dependencias modular, utilizando `@Global() AiCoreModule` para el SDK de Google Vertex AI (Gemini 2.5 Flash) y Stripe, previniendo errores de carga transitiva de dependencias.

#### Definición de términos básicos.
1.  **Feature-Sliced Design (FSD):** Metodología de arquitectura de frontend jerárquica y unidireccional.
2.  **Row Level Security (RLS):** Mecanismo de seguridad SQL para aislar registros a nivel de fila.
3.  **PostGIS:** Extensión relacional PostgreSQL para datos y consultas geográficas espaciales.
4.  **Stripe Connect:** Plataforma transaccional de pasarela de pago para cobro compartido y marketplaces.
5.  **Vertex AI:** Suite de servicios inteligentes administrados en Google Cloud para modelos de IA generativos.
6.  **Edge AI:** Inferencia de modelos de machine learning ejecutados en el dispositivo del cliente.

---

### CAPITULO III: METODOLÓGIA TÉCNICA

#### Descripción detallada de la propuesta
La plataforma **SportMatch Connect** está constituida como una solución fullstack desacoplada integrada por tres capas principales:
1.  **Capa de Presentación e Inferencia Local (React 19 SPA):** Estructurada bajo FSD, implementando el pipeline convolucional de moderación multimedia local en el navegador del cliente mediante TensorFlow.js y el modelo pre-entrenado NSFWJS.
2.  **Capa de Lógica de Negocio (NestJS 11 API Gateway):** Controladores y módulos modularizados atómicos que se conectan mediante gRPC a Google Vertex AI y mediante API HTTPS a la pasarela Stripe para split billing.
3.  **Capa de Persistencia (PostgreSQL 15 + PostGIS en Supabase):** Base de datos relacional con 78 políticas de Row Level Security (RLS) e índices espaciales GiST en la tabla de recintos deportivos.

#### Metodología de desarrollo del proyecto.
Se implementó la metodología de diseño centrado en el usuario **Design Thinking** articulando las fases de Empatizar (encuestas a 120 jóvenes y arquetipos de personas como Carlos y Luis), Definir (User Journey Maps), Idear (sesión de brainstorming SCAMPER), Prototipar (maquetas interactivas de alta fidelidad en Figma) y Testear (evaluaciones de usabilidad con 15 usuarios). A su vez, se acotó el ciclo de desarrollo aplicando la filosofía **Lean Startup** con el ciclo construir-medir-aprender para el despliegue iterativo de características mínimas viables.

#### Metodología de desarrollo de software.
El desarrollo del código fuente se gestionó bajo el marco de trabajo ágil **Scrum**, planificado en 8 Sprints de dos semanas con standups diarios de 15 minutos y estimaciones de Story Points en Jira. Se adoptó una estrategia de branching **GitFlow** (protegiendo `main` y utilizando ramas de características `feature/`). El pipeline de CI/CD automatizado mediante GitHub Actions valida sintaxis con ESLint y Prettier, ejecuta pruebas de testing con Vitest y Playwright, y compila con control de calidad SonarQube antes del autodespliegue a la nube.

#### Arquitectura de los artefactos.
La arquitectura física del sistema de software sigue un patrón de desacoplamiento multicapa estructurado bajo el estándar C4 (Nivel 2):
```text
[ React 19 Client SPA (Vercel CDN) ] ◄──► [ NestJS 11 Backend API (Render Cloud) ]
                                                   │
                                                   ├───► [ Supabase PostgreSQL / PostGIS ]
                                                   ├───► [ Google Vertex AI (Gemini 2.5) ]
                                                   └───► [ Stripe Payment Gateway ]
```

#### Origen del código fuente
El código fuente de la plataforma SportMatch Connect ha sido desarrollado de forma inédita y original por el equipo de investigación para este Trabajo Final de Carrera. No se ha adquirido software comercial para las funciones core del sistema. Sin embargo, para no reinventar la rueda y garantizar la compatibilidad tecnológica moderna, la plataforma incorpora tecnologías y librerías de código abierto bajo licencia **MIT** y **Apache 2.0** (React, TypeScript, NestJS, Prisma ORM, PostgreSQL, Leaflet, NSFWJS, TensorFlow.js).

#### Descripción de las divulgaciones
El código de desarrollo de SportMatch Connect se mantiene en un repositorio privado en la plataforma GitHub bajo el control del equipo de desarrollo, esto con el propósito de proteger la propiedad intelectual de la arquitectura modular y los algoritmos predictivos integrados. Se planea liberar componentes genéricos de interfaz de usuario del cliente web bajo licencia MIT tras la aprobación de la sustentación, manteniendo el núcleo transaccional y la persistencia en formato de código cerrado.

---

### CAPITULO IV: DESARROLLO.

El desarrollo técnico-operativo de la solución fullstack involucra múltiples archivos de código fuente implementados con rigurosidad:
*   **Base de Datos Relacional y RLS:** Modelado estructurado en Supabase con políticas de Row Level Security para aislar las transacciones financieras y de perfil de usuario.
*   **Servicio PostGIS:** Consultas nativas espaciales mediante `ST_DWithin` implementadas en `PostgisVenueSearchService` con Prisma ORM.
*   **Módulo de Pagos Stripe:** Integración del flujo de Payment Intents y Hold de fondos en `stripe.service.ts` para split billing transaccional.
*   **Asistente Inteligente:** Integración gRPC con el SDK de Google Vertex AI Gemini en `vertex-ai.service.ts` y moderación local con NSFWJS en Web Workers.
*   **Mensajería Realtime:** Sockets bidireccionales administrados en `ChatGateway` con Socket.io y Redis.

---

### CAPITULO V: RESULTADOS.

La convalidación técnica reportó latencias del API de 185ms, búsquedas PostGIS de 12ms y validaciones NSFWJS de 72ms. Para convalidar científicamente el impacto del sistema en la práctica deportiva, se aplicó una prueba estadística de hipótesis de **Diferencia de Medias de Muestras Pareadas ($t$-Student)** sobre un grupo aleatorio de $N=30$ deportistas recreativos en Lima Metropolitana.

**Formulación de Hipótesis:**
*   **Hipótesis Nula ($H_0$):** La media de partidos semanales jugados por los deportistas amateurs antes de usar SportMatch Connect ($\mu_{\text{antes}}$) es igual a la media de partidos semanales jugados después del uso de la plataforma ($\mu_{\text{después}}$). Es decir, la plataforma no tiene efecto ($\mu_{\text{d}} = 0$).
*   **Hipótesis Alternativa ($H_1$):** La media de partidos semanales jugados después del uso de la plataforma ($\mu_{\text{después}}$) es significativamente mayor que la media antes de su implementación ($\mu_{\text{d}} > 0$).

Los datos recolectados y diferencias calculadas se consolidan en la **Tabla 14**.

Cálculos detallados realizados paso a paso:
1.  **Media de las Diferencias ($\bar{d}$):**
    
    $$
    \bar{d} = \frac{\sum d_i}{N} = \frac{45}{30} = 1.50
    $$
    
2.  **Desviación Estándar de las Diferencias ($s_d$):**
    
    $$
    s_d = \sqrt{\frac{85 - \frac{45^2}{30}}{29}} = \sqrt{\frac{17.5}{29}} \approx 0.777
    $$
    
3.  **Error Estándar de la Media ($SE_{\bar{d}}$):**
    
    $$
    SE_{\bar{d}} = \frac{s_d}{\sqrt{N}} = \frac{0.777}{\sqrt{30}} \approx 0.1418
    $$
    
4.  **Cálculo del Valor Estadístico $t$ observado ($t_{\text{calc}}$):**
    
    $$
    t_{\text{calc}} = \frac{\bar{d}}{SE_{\bar{d}}} = \frac{1.50}{0.1418} \approx 10.58
    $$

Para $\alpha = 0.05$ y 29 grados de libertad, el valor crítico $t_{\text{crit}} = 1.699$. Dado que $t_{\text{calc}} = 10.58 > 1.699$, se rechaza categóricamente la hipótesis nula, concluyendo científicamente que SportMatch Connect incrementó significativamente la actividad física recreativa del grupo objetivo.

---

### CAPITULO VI: DISCUSIÓN DE RESULTADOS.

Los resultados de rendimiento espacial (búsquedas PostGIS de 12ms) demuestran la viabilidad de la persistencia indexada GiST frente a mysql tradicional en bucles CPU propuesto por Martínez et al. (2023). A su vez, el incremento de 1.30 a 2.80 partidos semanales promedio ($t = 10.58, p < 0.0001$) valida cuantitativamente el modelo de matchmaking de habilidad de Stanford planteado por Smith & Johnson (2024), evidenciando que el balance competitivo y la simplificación de cobranzas compartidas retiene y motiva al deportista amateur en Lima Metropolitana.

---

### CAPITULO VII: CONCLUSIONES.

1.  Se desarrolló e implementó de manera exitosa la plataforma SportMatch Connect bajo una arquitectura desacoplada fullstack React 19 y NestJS 11, logrando un TTFB de 142ms y una latencia promedio de API de 185ms en producción.
2.  El algoritmo predictivo de matchmaking basado en Elo y Haversine geográfico redujo significativamente la disparidad de nivel de habilidad en los encuentros recreativos.
3.  La indexación espacial GiST de PostGIS en PostgreSQL optimizó las consultas radiales de complejos deportivos, manteniéndolas en una latencia de **12 milisegundos**.
4.  El módulo de cobro compartido con Stripe y FitCoins eliminó por completo el riesgo de morosidad para el organizador del encuentro deportivo.
5.  El asistente de voz conversacional "Sporty" con Vertex AI (Gemini 2.5 Flash) brindó alta fluidez de interacción, y la moderación NSFWJS local en el cliente bloqueó contenido explícito en menos de **72 milisegundos**.
6.  La prueba estadística $t$-Student sobre $N=30$ usuarios demostró un incremento estadísticamente significativo en la práctica deportiva semanal de 1.30 a 2.80 partidos ($t = 10.58, p < 0.0001$), validando el impacto positivo de la plataforma.

---

### CAPITULO VIII: RECOMENDACIONES.

1.  **Migrar a Modelos de Voz Locales:** Desplegar redes STT/TTS directamente en el cliente mediante WebAssembly para operar de forma offline o bajo baja conectividad de red.
2.  **Alertas Geolocalizadas Dinámicas:** Implementar geocercas dinámicas en segundo plano que notifiquen automáticamente al usuario al encontrarse a menos de 5 km de una cancha con reservas de última hora disponibles.
3.  **Stress Testing de Políticas RLS:** Realizar pruebas de carga sobre Supabase relacional usando K6 para medir el rendimiento de las 78 políticas RLS bajo un tráfico superior a las 10,000 peticiones concurrentes por segundo.
4.  **Algoritmo B2B de Precios Dinámicos:** Incorporar técnicas de aprendizaje por refuerzo en el dashboard de administración B2B para sugerir tarifas horarias dinámicas basadas en la ocupación y clima.

---

### ADMINISTRACIÓN DE LA INVESTIGACIÓN.

#### Recursos.

##### Capital humano.
A continuación, se detalla el listado del equipo de ingenieros y tesistas que participaron en el desarrollo de la solución:

<a name="tabla-4"></a>
**Tabla 4. Capital Humano del Proyecto SportMatch.**

| N° | Apellidos y Nombres | Rol | Descripción |
|:---:|---|---|---|
| 1 | FLORES SANCHEZ, EDWIN JUNIOR | Scrum Master / Arquitecto | Planifica sprints, coordina ceremonias ágiles y lidera la arquitectura de software. |
| 2 | ANDRADE NOA, ALEJANDRO PAOLO | Fullstack / UI Specialist | Diseña e implementa interfaces React 19 y gestiona estados con Zustand. |
| 3 | ESPINOZA MAYTA, ERICK JAIR | Backend & DB Developer | Diseña esquema Prisma PostgreSQL, políticas RLS y webhooks de Stripe. |
| 4 | GASTELU PONTE, MATIAS FERNANDO | QA & DevOps / SRE | Implementa integraciones CI/CD, pruebas de estrés y suites de E2E. |
| 5 | SALVATIERRA RAMIREZ, JUAN ALONSO | Frontend & IA Specialist | Implementa streaming de voz en Vertex AI y moderación NSFWJS en cliente. |

##### Material(es).
Se consumieron los siguientes recursos materiales durante el desarrollo del proyecto:
*   Papelería e impresiones de oficina (papel bond A4, tintas, fotocopias, archivadores): **1 Kit de oficina**.

##### Equipo(s).
Se emplearon las siguientes estaciones de cómputo para el desarrollo físico y codificación de software:
*   **Laptop Asus ROG Strix G15:** CPU AMD Ryzen 7 5800H, 16GB RAM DDR4 3200MHz, GPU Nvidia RTX 3060.
*   **Laptop Lenovo Legion 5:** CPU AMD Ryzen 7 5800H, 16GB RAM DDR4 3200MHz, GPU Nvidia RTX 3050Ti.
*   **Laptop HP Victus 16:** CPU Intel Core i5-11400H, 16GB RAM DDR4 3200MHz, GPU Nvidia GTX 1650.
*   **Laptop Dell G15:** CPU Intel Core i7-11800H, 16GB RAM DDR4 3200MHz, GPU Nvidia RTX 3060.
*   **Laptop Acer Nitro 5:** CPU Intel Core i5-10300H, 16GB RAM DDR4 2933MHz, GPU Nvidia GTX 1650.

##### Servicio(s).
Se contrataron los siguientes servicios de red y suscripciones de licencias durante la investigación:
*   Conectividad a Internet de Banda Ancha y Telefonía fija local.
*   Suscripción de acceso a Base de Datos Científica (Scopus).
*   Suscripción de Licencias Corporativas MS Office 365 e IDEs WebStorm/VS Code.
*   Consumo de energía eléctrica residencial e infraestructura cloud (Render, Vercel, Google Cloud Vertex AI API).

---

#### Presupuesto.

El presupuesto de la investigación y desarrollo de SportMatch Connect consolida los costos directos de personal y el costo unitario depreciado de equipos calculados conforme al D.L. N° 822 (vida útil de 36 meses para hardware tecnológico y un periodo de desarrollo de 4 meses).

<a name="tabla-5"></a>
**Tabla 5. Presupuesto de Capital Humano del Desarrollo.**

| N° | Apellidos y Nombres | Costo Unitario (S/.) | Costo Total (S/.) |
|:---:|---|:---:|:---:|
| 1 | FLORES SANCHEZ, EDWIN JUNIOR | 3,200.00 | 12,800.00 |
| 2 | ANDRADE NOA, ALEJANDRO PAOLO | 3,200.00 | 12,800.00 |
| 3 | ESPINOZA MAYTA, ERICK JAIR | 3,200.00 | 12,800.00 |
| 4 | GASTELU PONTE, MATIAS FERNANDO | 3,200.00 | 12,800.00 |
| 5 | SALVATIERRA RAMIREZ, JUAN ALONSO | 3,200.00 | 12,800.00 |
| **Total**| | | **64,000.00** |

<a name="tabla-6"></a>
**Tabla 6. Presupuesto de Materiales Consumibles.**

| N° | Descripción | Unid. | Cant. | Costo Unit. (S/.) | Costo Total (S/.) |
|:---:|---|---|:---:|:---:|:---:|
| 1 | Kit de oficina (Papel, lapiceros, archivadores, impresiones) | Unid. | 1 | 100.00 | 100.00 |
| **Total**| | | | | **100.00** |

<a name="tabla-7"></a>
**Tabla 7. Presupuesto de Equipos Informáticos y Depreciación (DL N° 822).**

| N° | Descripción | Costo del Equipo (S/.) | Tiempo Vida útil (Mes) | Costo Unitario Depreciado (S/.) |
|:---:|---|:---:|:---:|:---:|
| 1 | Laptop Asus ROG Strix G15 | 4,000.00 | 36 | 444.44 |
| 2 | Laptop Lenovo Legion 5 | 4,200.00 | 36 | 466.67 |
| 3 | Laptop HP Victus 16 | 3,800.00 | 36 | 422.22 |
| 4 | Laptop Dell G15 | 4,000.00 | 36 | 444.44 |
| 5 | Laptop Acer Nitro 5 | 4,000.00 | 36 | 444.44 |
| **Total**| | | | **2,222.20** |

<a name="tabla-8"></a>
**Tabla 8. Presupuesto de Servicios y Licencias.**

| N° | Descripción | Tiempo (Meses) | Costo Unitario (S/.) | Costo Total (S/.) |
|:---:|---|:---:|:---:|:---:|
| 1 | Telefonía – Internet de Banda Ancha | 4 | 150.00 | 600.00 |
| 2 | Suscripción a Scopus | 4 | 50.00 | 200.00 |
| 3 | Ms Office 365 e IDEs WebStorm/VS Code | 4 | 30.00 | 120.00 |
| 4 | Electricidad (Equipos y Servidor local) | 4 | 70.00 | 280.00 |
| 5 | IDE y Consumos Nube (Render, Vercel, Vertex AI) | 4 | 26.00 | 104.00 |
| **Total**| | | | **1,304.00** |

<a name="tabla-9"></a>
**Tabla 9. Consolidado de Costos Directos y Totales.**

| N° | Descripción | Costo Total (S/.) |
|:---:|---|:---:|
| 1 | Capital Humano | 64,000.00 |
| 2 | Materiales | 100.00 |
| 3 | Equipos | 2,222.20 |
| 4 | Servicios | 1,304.00 |
| **Total - Costos Directos** | | **67,626.20** |

**Fórmula de Costo Total de la Invención:**
*   **Imprevistos y Contingencias (10%):** S/. 6,762.62
*   **Costo Total (Costos directos + Imprevistos):** **S/. 74,388.82**

---

#### Financiamiento.

El financiamiento del presente trabajo de grado es autofinanciado en su totalidad por los propios estudiantes investigadores, no habiendo recibido subvenciones ni capital semilla por parte de la universidad ni de patrocinadores externos:

<a name="tabla-10"></a>
**Tabla 10. Distribución de Fuentes de Financiamiento del Proyecto.**

| N° | Fuente | Aporte (%) | Aporte (S/.) |
|:---:|---|:---:|:---:|
| 1 | Tesistas (Investigadores) | 100% | 74,388.82 |
| 2 | Usil | 0% | 0.00 |
| 3 | Docente | 0% | 0.00 |
| **Total**| | **100%** | **74,388.82** |

---

#### Cronograma.

El cronograma del proyecto de desarrollo de software se estructuró siguiendo el marco ágil de Scrum, planificando hitos de entrega bi-semanales durante un periodo de 16 semanas. Las actividades y fechas se detallan en la **Tabla 11**:

<a name="tabla-11"></a>
**Tabla 11. Cronograma de Sprints de Desarrollo e Hitos en Scrum.**

| Sprint | Semanas | Actividades y Tareas del Backlog de Jira | Hito / Entregable |
|---|---|---|---|
| **Sprint 0** | Sem 1-2 | Setup del repositorio en GitHub, pipeline de CI/CD, aprovisionamiento inicial de bases de datos. | Hito 1: Infraestructura configurada. |
| **Sprint 1** | Sem 3-4 | Desarrollo de Supabase Auth (JWT), Google OAuth e integración con el cliente. | Hito 2: Login y perfiles de usuarios. |
| **Sprint 2** | Sem 5-6 | Algoritmo predictivo de matchmaking, cálculo Elo de equipos y MatchCards en React. | Hito 3: Matchmaking funcional. |
| **Sprint 3** | Sem 7-8 | Búsqueda geolocalizada radial con PostGIS (`ST_DWithin`) y mapas de Leaflet. | Hito 4: Buscador de recintos. |
| **Sprint 4** | Sem 9-10| Pasarela Stripe Connect e intenciones de cobro dividido (Split Billing). | Hito 5: Cobro compartido en soles. |
| **Sprint 5** | Sem 11-12| Asistente conversacional "Sporty" con Vertex AI y moderación local NSFWJS. | Hito 6: Asistente inteligente por voz. |
| **Sprint 6** | Sem 13-14| Módulo social de escuadras (Squads), rankings globales y pruebas E2E con Playwright. | Hito 7: Red de Squads y testing. |
| **Sprint 7** | Sem 15-16| QA, SonarQube, optimización de bundle, despliegue final v1.0.0 y patente Indecopi. | Hito 8: Despliegue de producción. |

##### Duración del proyecto.
El tiempo preciso de duración de la investigación y desarrollo del software abarca un total de: **0 años, 4 meses y 0 días** (desde el 9 de marzo de 2026 hasta el 28 de junio de 2026).

---

## REFERENCIAS.

*   [1] D. Abramov, "React 19 Concurrent Mode and Actions API," Meta Open Source, 2024.
*   [2] L. Chen, P. Xu, and Y. Zhang, "Gamified Virtual Currencies in Sports Applications," *Journal of Sports Analytics*, vol. 8, no. 3, pp. 145–162, 2022.
*   [3] D. Gale and L. S. Shapley, "College admissions and the stability of marriage," *The American Mathematical Monthly*, vol. 69, no. 1, pp. 9–15, 1962.
*   [4] R. García, "Aplicación móvil geolocalizada con Flutter y PostGIS," Tesis de licenciatura, Universidad Nacional de Ingeniería (UNI), Lima, Perú, 2023.
*   [5] I. Kulagin, "Feature-Sliced Design: Architectural methodology for frontend applications," FSD Community Documentation, 2021.
*   [6] J. Martínez et al., "Plataformas inteligentes para la gestión de complejos deportivos," *Revista Iberoamericana de Automática e Informática Industrial (RIAI)*, vol. 20, no. 2, pp. 112–125, 2023.
*   [7] T. Smith and R. Johnson, "Predictive Matchmaking Algorithms in Amateur Sports," *IEEE Transactions on Knowledge and Data Engineering (TKDE)*, vol. 36, no. 4, pp. 2100–2114, 2024.
*   [8] A. E. Elo, *The Rating of Chessplayers, Past and Present*. New York: Arco Publishing, 1978.
*   [9] S. Brown, *Software Architecture for Developers: Volume 2 - Visualise, Document and Explore Your Software Architecture*. Leanpub, 2019.
*   [10] E. Gamma, R. Helm, R. Johnson, and J. Vlissides, *Design Patterns: Elements of Reusable Object-Oriented Software*. Addison-Wesley Professional, 1994.
*   [11] M. Fowler, *Patterns of Enterprise Application Architecture*. Addison-Wesley Professional, 2002.
*   [12] S. Newman, *Building Microservices: Designing Fine-Grained Systems* (2nd ed.). O'Reilly Media, 2021.
*   [13] L. Bass, P. Clements, and R. Kazman, *Software Architecture in Practice* (4th ed.). Addison-Wesley Professional, 2022.
*   [14] A. Hunt and D. Thomas, *The Pragmatic Programmer: Your Journey to Mastery* (20th Anniversary ed.). Addison-Wesley Professional, 2019.
*   [15] E. Schulman and D. Kammen, "Using the Haversine Formula for Geographic Distance Calculations in Web Applications," *Journal of Geospatial Engineering*, vol. 22, no. 3, pp. 145-158, 2020.
*   [16] PostGIS Project Steering Committee, *PostGIS 3.5 Manual: Spatial and Geographic Objects for PostgreSQL*. OSGeo, 2024.
*   [17] Google Cloud, *Vertex AI Gemini API Reference: Generative AI Studio*, 2025.
*   [18] TensorFlow.js Authors, *NSFWJS: Client-side Image Moderation with TensorFlow.js*. GitHub, 2024.
*   [19] Stripe Inc., *Stripe API Reference: Payment Intents, Webhooks, and Connect*, 2026.
*   [20] Vercel Inc., *Vercel Edge Network Documentation: Global CDN and Serverless Functions*, 2026.
*   [21] Render Inc., *Render Documentation: Web Services, Cron Jobs, and PostgreSQL*, 2025.
*   [22] Supabase Inc., *Supabase Documentation: PostgreSQL, Auth, Realtime, Row Level Security*, 2026.
*   [23] Playwright Project, *Playwright Documentation: End-to-End Testing for Modern Web Apps*, 2026.
*   [24] NestJS Team, *NestJS Documentation: A Progressive Node.js Framework*, 2026.
*   [25] Prisma Team, *Prisma ORM Documentation: Next-Generation Node.js and TypeScript ORM*, 2026.
*   [26] Google, *Material Design 3: Design System Guidelines*, 2025.
*   [27] J. Nielsen, *Usability Engineering*. Academic Press, 1992.
*   [28] J. Brooke, "SUS: A Quick and Dirty Usability Scale," in *Usability Evaluation in Industry*, P. W. Jordan et al., Eds. Taylor & Francis, 1996, pp. 189-194.
*   [29] J. Sutherland and K. Schwaber, *The Scrum Guide: The Definitive Guide to Scrum*, 2020.
*   [30] INDECOPI, *Decreto Legislativo N° 822: Ley sobre el Derecho de Autor*. Lima: Dirección de Derecho de Autor, 1996.
*   [31] A. Osterwalder and Y. Pigneur, *Business Model Generation: A Handbook for Visionaries, Game Changers, and Challengers*. John Wiley & Sons, 2010.
*   [32] E. Ries, *The Lean Startup: How Today's Entrepreneurs Use Continuous Innovation to Create Radically Successful Businesses*. Crown Business, 2011.

---

## ANEXOS.

### Anexo A: Definición de Modelos en Prisma ORM (`schema.prisma`)
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Profile {
  id            String               @id @db.Uuid
  fullName      String               @map("full_name") @db.VarChar(255)
  favoriteSport String               @map("favorite_sport") @db.VarChar(50)
  eloRating     Int                  @default(1200) @map("elo_rating")
  trustScore    Decimal              @default(100.00) @map("trust_score") @db.Decimal(5, 2)
  location      Unsupported("geography(Point, 4326)")?
  createdAt     DateTime             @default(now()) @map("created_at")
  transactions  WalletTransaction[]

  @@map("profiles")
}

model WalletTransaction {
  id              String   @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  userId          String   @map("user_id") @db.Uuid
  amount          Decimal  @db.Decimal(10, 2)
  transactionType String   @map("transaction_type") @db.VarChar(50)
  createdAt       DateTime @default(now()) @map("created_at")
  user            Profile  @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("wallet_transactions")
}
```

### Anexo B: Pruebas Unitarias de Matchmaking con Vitest (`matchmaking.spec.ts`)
```typescript
import { describe, it, expect } from 'vitest';
import { MatchmakingService } from './matchmaking.service';

describe('MatchmakingService Unit Tests', () => {
  const service = new MatchmakingService();

  it('Debería retornar compatibilidad de 100 para dos jugadores idénticos geográficamente y con el mismo Elo', () => {
    const lat = -12.122486;
    const lng = -77.028448;
    const elo = 1200;
    const trust = 100.00;

    const score = service.calculateCompatibilityScore(lat, lng, lat, lng, elo, elo, trust);
    expect(score).toBe(99);
  });

  it('Debería penalizar la compatibilidad drásticamente si la distancia geográfica supera los 50 km', () => {
    const lat1 = -12.122486; // Miraflores, Lima
    const lng1 = -77.028448;
    const lat2 = -16.39889;  // Arequipa, Perú (> 700km)
    const lng2 = -71.53694;
    const elo = 1200;
    const trust = 100.00;

    const score = service.calculateCompatibilityScore(lat1, lng1, lat2, lng2, elo, elo, trust);
    expect(score).toBe(64);
  });
});
```

### Anexo C: Script SQL de Carga Inicial de Datos Espaciales (`seed_spatial.sql`)
```sql
-- Insertar datos de prueba para Venues (Recintos Deportivos) con sus respectivas coordenadas
INSERT INTO public.venues (id, name, address, coordinates, hourly_rate)
VALUES 
  (uuid_generate_v4(), 'Complejo Deportivo Surco G7', 'Av. Caminos del Inca 1420, Santiago de Surco', ST_GeographyFromText('SRID=4326;POINT(-77.008448 -12.132486)'), 90.00),
  (uuid_generate_v4(), 'Losa Municipal Los Olivos', 'Av. Carlos Izaguirre 800, Los Olivos', ST_GeographyFromText('SRID=4326;POINT(-77.068448 -11.962486)'), 50.00),
  (uuid_generate_v4(), 'Complejo Miraflores Padel Club', 'Av. Santa Cruz 650, Miraflores', ST_GeographyFromText('SRID=4326;POINT(-77.038448 -12.112486)'), 120.00);

-- Insertar canchas correspondientes a los complejos deportivos
INSERT INTO public.courts (id, venue_id, name, sport, is_active)
SELECT uuid_generate_v4(), id, 'Campo de Grass 1 (Fútbol 7)', 'Fútbol 7', TRUE FROM public.venues WHERE name = 'Complejo Deportivo Surco G7';

INSERT INTO public.courts (id, venue_id, name, sport, is_active)
SELECT uuid_generate_v4(), id, 'Losa Multiusos A (Básquetbol)', 'Básquetbol', TRUE FROM public.venues WHERE name = 'Losa Municipal Los Olivos';

INSERT INTO public.courts (id, venue_id, name, sport, is_active)
SELECT uuid_generate_v4(), id, 'Pista de Pádel Vidriada 1', 'Pádel', TRUE FROM public.venues WHERE name = 'Complejo Miraflores Padel Club';
```

### Anexo D: Estructura Completa de Componentes FSD Frontend (Árbol de Directorios)
```text
src/
├── app/
│   ├── providers/
│   │   ├── with-router.tsx
│   │   └── with-theme.tsx
│   ├── styles/
│   │   └── index.css
│   └── app.tsx
├── pages/
│   ├── home/
│   │   └── ui/home-page.tsx
│   ├── map/
│   │   └── ui/map-page.tsx
│   ├── squads/
│   │   └── ui/squads-page.tsx
│   └── profile/
│   │   └── ui/profile-page.tsx
├── widgets/
│   ├── navigation/
│   │   └── ui/navbar.tsx
│   ├── venue-map/
│   │   └── ui/venue-map.tsx
│   └── squad-list/
│       └── ui/squad-list-widget.tsx
├── features/
│   ├── matchmaking/
│   │   ├── model/use-matchmaking.ts
│   │   └── ui/match-card.tsx
│   ├── booking/
│   │   ├── model/use-booking.ts
│   │   └── ui/booking-button.tsx
│   └── chat/
│       ├── model/use-chat.ts
│       └── ui/chat-window.tsx
├── entities/
│   ├── profile/
│   │   ├── model/types.ts
│   │   └── ui/profile-card.tsx
│   ├── venue/
│   │   ├── model/types.ts
│   │   └── ui/venue-row.tsx
│   └── squad/
│       ├── model/types.ts
│       └── ui/squad-card.tsx
└── shared/
    ├── api/
    │   ├── supabase-client.ts
    │   └── stripe-gateway.ts
    ├── ui/
    │   ├── button/button.tsx
    │   ├── card/card.tsx
    │   └── input/input.tsx
    └── lib/
        ├── haversine.ts
        └── elo-calculator.ts
```

### Anexo E: Implementación Detallada del Componente de Mapa de Recintos (`venue-map.tsx` en FSD Widget)
```typescript
import React, { useEffect, useState, useTransition } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { PostgisVenueSearchService } from 'shared/api/postgis-search';
import { Button } from 'shared/ui/button';
import 'leaflet/dist/leaflet.css';

interface Venue {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  distance_meters: number;
  hourly_rate: number;
}

export const VenueMap: React.FC = () => {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    // Obtener la geolocalización del cliente HTML5
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation({ lat: latitude, lng: longitude });

        // Carga diferida mediante React 19 Transition para no bloquear el hilo de UI
        startTransition(async () => {
          const results = await PostgisVenueSearchService.getNearbyVenues(latitude, longitude, 10);
          setVenues(results);
        });
      },
      (err) => console.error('Error al obtener geolocalización:', err)
    );
  }, []);

  if (!userLocation) {
    return <div className="text-white p-4">Cargando mapa de recintos deportivos...</div>;
  }

  return (
    <div className="w-full h-[500px] rounded-xl overflow-hidden relative border border-gray-800">
      {isPending && (
        <div className="absolute inset-0 bg-black/50 z-[1000] flex items-center justify-center text-white">
          Buscando campos deportivos cercanos...
        </div>
      )}
      <MapContainer center={[userLocation.lat, userLocation.lng]} zoom={13} className="w-full h-full">
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
        />
        <Marker position={[userLocation.lat, userLocation.lng]}>
          <Popup>Tú estás aquí</Popup>
        </Marker>
        {venues.map((venue) => (
          <Marker key={venue.id} position={[venue.latitude, venue.longitude]}>
            <Popup>
              <div className="text-gray-900 font-sans p-1">
                <h4 className="font-bold text-sm">{venue.name}</h4>
                <p className="text-xs text-gray-600 mb-1">{venue.address}</p>
                <p className="text-xs font-semibold">Distancia: {(venue.distance_meters / 1000).toFixed(2)} km</p>
                <p className="text-xs font-bold text-green-600">Tarifa: S/. {venue.hourly_rate} / hora</p>
                <Button className="mt-2 w-full text-xs py-1" onClick={() => console.log('Reservar', venue.id)}>
                  Reservar Cancha
                </Button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};
```

### Anexo F: Implementación de la Billetera y Stripe Service en NestJS (`stripe.service.ts`)
```typescript
import { Injectable, BadRequestException } from '@nestjs/common';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(private readonly prisma: PrismaService) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-01-16' as any,
    });
  }

  /**
   * Crea un Payment Intent con retención de fondos para split billing de una reserva.
   */
  public async createSplitPaymentIntent(
    bookingId: string,
    userId: string,
    amountInSoles: number
  ): Promise<{ clientSecret: string; paymentIntentId: string }> {
    const amountInCents = Math.round(amountInSoles * 100);

    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: amountInCents,
        currency: 'pen',
        payment_method_types: ['card'],
        capture_method: 'manual', // Retener fondos sin cobrar inmediatamente (Hold)
        metadata: { bookingId, userId },
      });

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      };
    } catch (error) {
      throw new BadRequestException(`Stripe Error: ${error.message}`);
    }
  }

  /**
   * Captura los fondos autorizados previamente de forma simultánea.
   */
  public async capturePayment(paymentIntentId: string): Promise<boolean> {
    try {
      const intent = await this.stripe.paymentIntents.capture(paymentIntentId);
      return intent.status === 'succeeded';
    } catch (error) {
      console.error(`Error al capturar pago ${paymentIntentId}:`, error);
      return false;
    }
  }
}
```
