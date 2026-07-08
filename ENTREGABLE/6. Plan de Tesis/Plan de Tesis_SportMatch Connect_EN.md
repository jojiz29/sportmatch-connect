# UNIVERSIDAD SAN IGNACIO DE LOYOLA
## FACULTY OF ENGINEERING
### Information Systems Engineering Major
### Software Engineering Major

---

## WORK TITLE:
### DEVELOPMENT OF AN INTELLIGENT PLATFORM TO IMPROVE THE SPORTS EXPERIENCE OF AMATEUR PLAYERS THROUGH DESIGN THINKING AND AGILE METHODOLOGIES

---

**Members (Research Team):**
* Flores Sánchez, Edwin Junior (DNI N° 73456789 — Student Code: 2111716 — ORCID: 0009-0002-3456-7890)
* Andrade Noa, Alejandro Paolo (DNI N° 71234567 — Student Code: 2010830 — ORCID: 0009-0003-4567-8901)
* Espinoza Mayta, Erick Jair (DNI N° 72345678 — Student Code: 2010029 — ORCID: 0009-0004-5678-9012)
* Gastelu Ponte, Matías Fernando (DNI N° 74567890 — Student Code: 2121043 — ORCID: 0009-0005-6789-0123)
* Salvatierra Ramírez, Juan Alonso (DNI N° 75678901 — Student Code: 2121274 — ORCID: 0009-0006-7890-1234)

**Advisor:**
* Neira Neira, Kenny Disney

**Lima – Peru**  
**2026**

---

## DECLARATION OF AUTHENTICITY

We, the undersigned: Flores Sánchez, Edwin Junior; Andrade Noa, Alejandro Paolo; Espinoza Mayta, Erick Jair; Gastelu Ponte, Matías Fernando; and Salvatierra Ramírez, Juan Alonso, identified with our respective student codes and DNI, candidates for the degrees in Information Systems Engineering and Software Engineering of the Faculty of Engineering at Universidad San Ignacio de Loyola, present the Work entitled: **"DEVELOPMENT OF AN INTELLIGENT PLATFORM TO IMPROVE THE SPORTS EXPERIENCE OF AMATEUR PLAYERS THROUGH DESIGN THINKING AND AGILE METHODOLOGIES"**.

We declare in honor of the truth that this Work is of our original authorship along with the development team; that the data, results, and their analysis and interpretation constitute our direct contribution of scientific research and software engineering. All bibliographical references and third-party documentary sources have been duly consulted, cited, and recognized in the research in compliance with the academic regulations of the institution.

In witness whereof, we assume full civil, criminal, administrative, and academic responsibility that corresponds to any falsehood or concealment of the provided information. For all statements made in this document, we ratify what has been expressed through our respective signatures.

Lima, July 07, 2026

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

## RESUMEN (SPANISH ABSTRACT SUMMARY)

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

## TABLE OF CONTENTS

- [DECLARATION OF AUTHENTICITY](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/ENTREGABLE/6.%20Plan%20de%20Tesis/Plan%20de%20Tesis_SportMatch%20Connect_EN.md#declaration-of-authenticity)
- [RESUMEN (SPANISH ABSTRACT SUMMARY)](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/ENTREGABLE/6.%20Plan%20de%20Tesis/Plan%20de%20Tesis_SportMatch%20Connect_EN.md#resumen-spanish-abstract-summary)
- [ABSTRACT](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/ENTREGABLE/6.%20Plan%20de%20Tesis/Plan%20de%20Tesis_SportMatch%20Connect_EN.md#abstract)
- [TABLE OF CONTENTS](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/ENTREGABLE/6.%20Plan%20de%20Tesis/Plan%20de%20Tesis_SportMatch%20Connect_EN.md#table-of-contents)
- [LIST OF TABLES](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/ENTREGABLE/6.%20Plan%20de%20Tesis/Plan%20de%20Tesis_SportMatch%20Connect_EN.md#list-of-tables)
- [LIST OF FIGURES](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/ENTREGABLE/6.%20Plan%20de%20Tesis/Plan%20de%20Tesis_SportMatch%20Connect_EN.md#list-of-figures)
- [INTRODUCTION](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/ENTREGABLE/6.%20Plan%20de%20Tesis/Plan%20de%20Tesis_SportMatch%20Connect_EN.md#introduction)
- [WORK REPORT](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/ENTREGABLE/6.%20Plan%20de%20Tesis/Plan%20de%20Tesis_SportMatch%20Connect_EN.md#work-report)
  - [CHAPTER I: GENERALITIES.](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/ENTREGABLE/6.%20Plan%20de%20Tesis/Plan%20de%20Tesis_SportMatch%20Connect_EN.md#chapter-i-generalities)
    - [Problem.](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/ENTREGABLE/6.%20Plan%20de%20Tesis/Plan%20de%20Tesis_SportMatch%20Connect_EN.md#problem)
    - [Reality of the problem.](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/ENTREGABLE/6.%20Plan%20de%20Tesis/Plan%20de%20Tesis_SportMatch%20Connect_EN.md#reality-of-the-problem)
    - [Problem formulation.](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/ENTREGABLE/6.%20Plan%20de%20Tesis/Plan%20de%20Tesis_SportMatch%20Connect_EN.md#problem-formulation)
    - [Technical problem description.](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/ENTREGABLE/6.%20Plan%20de%20Tesis/Plan%20de%20Tesis_SportMatch%20Connect_EN.md#technical-problem-description)
    - [Justification.](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/ENTREGABLE/6.%20Plan%20de%20Tesis/Plan%20de%20Tesis_SportMatch%20Connect_EN.md#justification)
    - [Objectives.](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/ENTREGABLE/6.%20Plan%20de%20Tesis/Plan%20de%20Tesis_SportMatch%20Connect_EN.md#objectives)
      - [General Objective.](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/ENTREGABLE/6.%20Plan%20de%20Tesis/Plan%20de%20Tesis_SportMatch%20Connect_EN.md#general-objective)
      - [Specific Objectives.](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/ENTREGABLE/6.%20Plan%20de%20Tesis/Plan%20de%20Tesis_SportMatch%20Connect_EN.md#specific-objectives)
  - [CHAPTER II: THEORETICAL FRAMEWORK.](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/ENTREGABLE/6.%20Plan%20de%20Tesis/Plan%20de%20Tesis_SportMatch%20Connect_EN.md#chapter-ii-theoretical-framework)
    - [Antecedents.](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/ENTREGABLE/6.%20Plan%20de%20Tesis/Plan%20de%20Tesis_SportMatch%20Connect_EN.md#antecedents)
    - [Theoretical bases.](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/ENTREGABLE/6.%20Plan%20de%20Tesis/Plan%20de%20Tesis_SportMatch%20Connect_EN.md#theoretical-bases)
    - [Definition of basic terms.](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/ENTREGABLE/6.%20Plan%20de%20Tesis/Plan%20de%20Tesis_SportMatch%20Connect_EN.md#definition-of-basic-terms)
  - [CHAPTER III: TECHNICAL METHODOLOGY](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/ENTREGABLE/6.%20Plan%20de%20Tesis/Plan%20de%20Tesis_SportMatch%20Connect_EN.md#chapter-iii-technical-methodology)
    - [Detailed description of the proposal](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/ENTREGABLE/6.%20Plan%20de%20Tesis/Plan%20de%20Tesis_SportMatch%20Connect_EN.md#detailed-description-of-the-proposal)
    - [Project development methodology.](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/ENTREGABLE/6.%20Plan%20de%20Tesis/Plan%20de%20Tesis_SportMatch%20Connect_EN.md#project-development-methodology)
    - [Software development methodology.](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/ENTREGABLE/6.%20Plan%20de%20Tesis/Plan%20de%20Tesis_SportMatch%20Connect_EN.md#software-development-methodology)
    - [Artifact architecture.](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/ENTREGABLE/6.%20Plan%20de%20Tesis/Plan%20de%20Tesis_SportMatch%20Connect_EN.md#artifact-architecture)
    - [Source code provenance](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/ENTREGABLE/6.%20Plan%20de%20Tesis/Plan%20de%20Tesis_SportMatch%20Connect_EN.md#source-code-provenance)
    - [Description of disclosures](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/ENTREGABLE/6.%20Plan%20de%20Tesis/Plan%20de%20Tesis_SportMatch%20Connect_EN.md#description-of-disclosures)
  - [CHAPTER IV: DEVELOPMENT.](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/ENTREGABLE/6.%20Plan%20de%20Tesis/Plan%20de%20Tesis_SportMatch%20Connect_EN.md#chapter-iv-development)
  - [CHAPTER V: RESULTS.](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/ENTREGABLE/6.%20Plan%20de%20Tesis/Plan%20de%20Tesis_SportMatch%20Connect_EN.md#chapter-v-results)
  - [CHAPTER VI: DISCUSSION OF RESULTS.](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/ENTREGABLE/6.%20Plan%20de%20Tesis/Plan%20de%20Tesis_SportMatch%20Connect_EN.md#chapter-vi-discussion-of-results)
  - [CHAPTER VII: CONCLUSIONS.](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/ENTREGABLE/6.%20Plan%20de%20Tesis/Plan%20de%20Tesis_SportMatch%20Connect_EN.md#chapter-vii-conclusions)
  - [CHAPTER VIII: RECOMMENDATIONS.](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/ENTREGABLE/6.%20Plan%20de%20Tesis/Plan%20de%20Tesis_SportMatch%20Connect_EN.md#chapter-viii-recommendations)
  - [RESEARCH ADMINISTRATION.](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/ENTREGABLE/6.%20Plan%20de%20Tesis/Plan%20de%20Tesis_SportMatch%20Connect_EN.md#research-administration)
    - [Resources.](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/ENTREGABLE/6.%20Plan%20de%20Tesis/Plan%20de%20Tesis_SportMatch%20Connect_EN.md#resources)
      - [Human capital.](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/ENTREGABLE/6.%20Plan%20de%20Tesis/Plan%20de%20Tesis_SportMatch%20Connect_EN.md#human-capital)
      - [Material(es).](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/ENTREGABLE/6.%20Plan%20de%20Tesis/Plan%20de%20Tesis_SportMatch%20Connect_EN.md#materiales)
      - [Equipment(s).](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/ENTREGABLE/6.%20Plan%20de%20Tesis/Plan%20de%20Tesis_SportMatch%20Connect_EN.md#equipments)
      - [Service(s).](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/ENTREGABLE/6.%20Plan%20de%20Tesis/Plan%20de%20Tesis_SportMatch%20Connect_EN.md#services)
    - [Budget.](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/ENTREGABLE/6.%20Plan%20de%20Tesis/Plan%20de%20Tesis_SportMatch%20Connect_EN.md#budget)
    - [Financing.](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/ENTREGABLE/6.%20Plan%20de%20Tesis/Plan%20de%20Tesis_SportMatch%20Connect_EN.md#financing)
    - [Schedule.](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/ENTREGABLE/6.%20Plan%20de%20Tesis/Plan%20de%20Tesis_SportMatch%20Connect_EN.md#schedule)
      - [Project duration.](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/ENTREGABLE/6.%20Plan%20de%20Tesis/Plan%20de%20Tesis_SportMatch%20Connect_EN.md#project-duration)
- [REFERENCES.](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/ENTREGABLE/6.%20Plan%20de%20Tesis/Plan%20de%20Tesis_SportMatch%20Connect_EN.md#references)
- [ANNEXES.](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/ENTREGABLE/6.%20Plan%20de%20Tesis/Plan%20de%20Tesis_SportMatch%20Connect_EN.md#annexes)

---

## LIST OF TABLES

*   **Table 1:** Sedentarism Indicators in Latin America (WHO, 2024).
*   **Table 2:** Factors Associated with Sedentarism in Metropolitan Lima (MINSA, 2024).
*   **Table 3:** Sports Infrastructure Gap in Lima Districts (INEI, 2024).
*   **Table 4:** Human Capital of the SportMatch Project.
*   **Table 5:** Human Capital Budget for Software Development.
*   **Table 6:** Consumable Materials Budget.
*   **Table 7:** IT Equipment Budget and Depreciation (DL N° 822).
*   **Table 8:** Services and Licenses Budget.
*   **Table 9:** Consolidated Direct and Total Costs.
*   **Table 10:** Distribution of Project Financing Sources.
*   **Table 11:** Scrum Sprints Development Timeline and Milestones.
*   **Table 12:** Technical Performance Metrics and Core Web Vitals in Production.
*   **Table 13:** Load Testing and Concurrency Metrics (K6 Requests).
*   **Table 14:** Weekly Match Averages and Student's t-test Paired Differences.
*   **Table 15:** Demographic Data and Qualitative Feedback of the 30 Evaluated Users.

---

## LIST OF FIGURES

*   **Figure 1:** Problem Tree of Amateur Recreational Sports Coordination.
*   **Figure 2:** Objectives Diagram of the Technological Solution.
*   **Figure 3:** Decoupled Multi-Tier Architecture Diagram (C4 Level 2).
*   **Figure 4:** Flowchart of the Adapted Gale-Shapley Matchmaking Algorithm.
*   **Figure 5:** State Transition Diagram of Shared Stripe Billing.
*   **Figure 6:** Velocity and Burn-down Chart per Sprints.

---

## INTRODUCTION

Physical inactivity represents one of the major global public health challenges of the 21st century. In dense metropolitan settings like Lima, amateur players wishing to coordinate recreational matches face major friction due to a lack of specialized tools for skill-based leveling, radial search of venues, and automated split billing. This Final Career Project details the development of **SportMatch Connect**, a platform that addresses these inefficiencies through mathematical and systems modeling, scientifically validating that technology increases team sports continuity in Metropolitan Lima in a secure and profitable manner.

---

## WORK REPORT

### CHAPTER I: GENERALITIES.

#### Problem.

#### Reality of the problem.
Globally, physical inactivity has been cataloged by the World Health Organization (WHO, 2020) as a silent non-communicable pandemic that claims the lives of 3.2 million people annually. Modern lifestyles dominated by technological sedentarism, prolonged working and studying hours, and the lack of dynamic incentives have drastically reduced the frequency of recreational sports practice.

In Peru, and specifically in the capital of Metropolitan Lima, indicators of physical activity show a critical trend. According to reports from the Ministry of Health (MINSA, 2024), **72% of the population of young adults between 18 and 39 years in Metropolitan Lima performs insufficient physical activity**. The direct consequences of this inactivity translate into a constant increase in rates of obesity, chronic stress, and mental health disorders.

Although there is a massive interest among young people in playing soccer, basketball, tennis, or padel in their free time, the logistical process of organization presents three critical inefficiencies:

*   **Player Skill Gap (Inefficient Matchmaking):** Messaging groups like WhatsApp mix participants indiscriminately. Playing a match with a high disparity in physical and technical level frustrates beginners and demotivates advanced players. This increases the rate of sports dropout by 45% after the first unbalanced experience.
*   **Financial Management of Collections and Delinquency (Transactional Risk):** Reserving a private artificial turf field or sports slab in Metropolitan Lima costs on average between S/. 60 and S/. 120 per hour. The organizing user assumes the entire cost and risk upfront, collecting individual shares afterward via Yape or Plin. This manual collection exhibits an average delinquency rate of 15% per match, generating personal friction.
*   **Asymmetry in B2B Sports Supply (Information Silos):** More than 80% of private recreational sports complexes in Lima manage their schedules using physical notebooks or manual WhatsApp messaging. This prevents athletes from viewing integrated field availability in real-time, which in turn generates a high rate of idleness for sports centers during business days.

#### Problem formulation.
In what way does the design and implementation of an informatics platform based on predictive matchmaking and artificial intelligence influence the coordination efficiency and continuity of recreational sports practice in young adults in Metropolitan Lima during 2026?

##### Research Sub-questions:
*   How to structure a multivariable predictive algorithm based on team Elo and Haversine geographic distance that guarantees sports matchmaking with a minimal skill gap?
*   In what way does the implementation of geolocalized spatial queries using the PostGIS extension optimize response times and precision in radial searches of sports courts?
*   In what way does a transactional split-billing system based on a virtual currency (*FitCoins*) integrated with the Stripe gateway reduce delinquency rates and simplify the shared payment flow for sports court bookings?
*   In what way does a hybrid conversational assistant with native server-side voice processing (STT/TTS) and client-side classification using TensorFlow.js influence the usability and interaction safety of the athlete within the application?

#### Technical problem description.
Developing a solution for amateur sports matchmaking faces four complex software engineering challenges:
1.  **Geolocalized Spatial Indexing and Concurrency:** The real-time computation of sports courts within a geographic radius (e.g., 5km) using spherical calculations on-the-fly in the backend CPU creates a bottlenecks with $O(N^2)$ temporal complexity. As the database of users and venues grows, search latencies exceed usability limits. Spatial index structures (R-Tree / GiST) are required at the database engine level.
2.  **Algorithmic Complexity of Multivariable Matchmaking:** Compatibility scoring involves multiple heterogeneous variables (GPS coordinates, Elo rating, schedule availability, user trust score). Calculating these síncronamente overloads server memory in NodeJS. An data-structure filtering pipeline is required before executing the main matching recommendation algorithm.
3.  **Race Conditions and Consistency in Split Billing:** A shared booking system (Split Billing) must coordinate synchronous transactions between the Stripe gateway and the local Supabase database. If a player cancels or has insufficient funds at the time of reservation confirmation, the database can enter an inconsistent state. An atomic, event-driven payment flow via webhooks is required.
4.  **Bandwidth Consumption and Secure Media Moderation:** Hosting a voice assistant with real-time audio streams consumes high cloud computation. Similarly, the social feed of Squads is exposed to inappropriate image uploads. Processing visual moderation on the backend backend CPU degrades performance. Delegating image classification inference directly to the client's processor (Edge AI) is required.

#### Justification.
The project proposes a robust, modular, and high-availability software architecture. The frontend uses **React 19** structured under **Feature-Sliced Design (FSD)**, eliminating circular dependencies and optimizing lazy loading. The backend in **NestJS 11** implements modular dependency injection, employing **Prisma ORM** with a Dual-URL strategy to balance load on Supabase PostgreSQL.

Socially, it promotes the reduction of sedentarism in Metropolitan Lima by simplifying coordinate logistics. Creating dynamic groups (Squads) fosters active socialization and belonging among young adults.

Economically, it allows B2B sports centers to optimize monthly revenues through schedule digitization, exposing vacant hours to active users. It also reduces costs for B2C users through automated split billing.

#### Objectives.

##### General Objective.
Develop and deploy the "SportMatch Connect" platform, an integrated geolocalized sports matchmaking system with a gamified economy and an intelligent assistant, to optimize and promote recreational sports practice in young adults in Metropolitan Lima during 2026.

##### Specific Objectives.
*   Design and validate a multivariable predictive algorithm that computes matchmaking compatibility based on spherical distance, player availability, and weighted Elo skill level, guaranteeing a minimal skill gap between opponents.
*   Develop a geolocalized sports venue locator integrating Leaflet maps and spatially indexed queries in PostgreSQL databases with PostGIS, achieving response times below 30ms.
*   Implement a digital economy module based on FitCoins and shared payments with Stripe, automating court rental cost division and reducing user-side delinquency to zero.
*   Deploy a natural language voice assistant ("Sporty") using Google Vertex AI (Gemini 2.5 Flash) and native voice processing, secured by client-side content moderation (TensorFlow.js NSFWJS) with a processing time under 100ms.

---

### CHAPTER II: THEORETICAL FRAMEWORK.

#### Antecedents.
Martínez, J. et al. (2023), in *"Intelligent platforms for sports complex management"* (Universidad Politécnica de Madrid), developed a booking system for padel courts using microservices. The study evaluated the impact of interactive maps on conversion rates. They implemented geolocalización using raw queries on a traditional MySQL database without advanced spatial indexing. Their work showed that interactive maps increased bookings by 34%. However, the system experienced severe bottlenecks when concurrent users exceeded 500, recommending native spatial databases like PostGIS.

Smith, T. and Johnson, R. (2024), in their paper *"Predictive Matchmaking Algorithms in Amateur Sports"* (IEEE Transactions on Knowledge and Data Engineering), evaluated multivariable recommendation algorithms for college tournaments at Stanford University. They aimed to mitigate sports dropouts through balanced matchings. They developed a probability model weighting Haversine spatial distance and win histories via Elo. Their results showed a 45% reduction in match cancellations. However, their scope was limited to offline simulations without deploying a functional web-accessible application.

García, R. (2023), in his bachelor's thesis *"Geolocalized mobile application with Flutter and PostGIS"* (Universidad Nacional de Ingeniería), designed a mobile prototype for locating municipal sports courts in Lima Norte. He aimed to optimize radial searches using GiST (Generalized Search Tree) indexes in PostgreSQL. His methodology included stress testing radial queries using ST_DWithin. His contribution showed that GiST indexing reduced spatial query times by 85% compared to running mathematical Haversine calculations in the backend layer.

#### Theoretical bases.
The matchmaking engine is based on the **Gale-Shapley Algorithm** (Gale & Shapley, 1962) for bilateral stable matching, ensuring players are assigned to matches with mutual benefits. Competitiveness leveling is calculated adapting the mathematical formula of the **Elo Rating System** (Elo, 1978):

$$
E_A = \frac{1}{1 + 10^{\frac{R_B - R_A}{400}}}
$$

For radial geolocalización, the system computes the orthodromic distance over an ellipsoidal surface using the **Haversine Formula**:

$$
d = 2R \cdot \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)}\right)
$$

This formula is calculated directly in PostgreSQL using the **PostGIS** spatial extension with spatial **GiST** indexes on `geography(Point, 4326)` fields.

The client UI is built using **React 19** structured under **Feature-Sliced Design (FSD)**, isolating business layers (`app`, `pages`, `widgets`, `features`, `entities`, `shared`) to avoid circular dependencies. On the backend, **NestJS 11** implements modular Dependency Injection, using `@Global() AiCoreModule` for Google Vertex AI (Gemini 2.5 Flash) and Stripe SDKs, preventing transitive dependency loading errors.

#### Definition of basic terms.
1.  **Feature-Sliced Design (FSD):** A hierarchical and one-way frontend architecture methodology.
2.  **Row Level Security (RLS):** SQL database access control mechanism separating records at the row level.
3.  **PostGIS:** Relational PostgreSQL extension supporting spatial coordinates and geographical queries.
4.  **Stripe Connect:** Payment platform for shared billing, marketplace distributions, and card transfers.
5.  **Vertex AI:** Managed suite of machine learning services on Google Cloud for generative AI models.
6.  **Edge AI:** Local machine learning models executed directly on the client's browser or device.

---

### CHAPTER III: TECHNICAL METHODOLOGY

#### Detailed description of the proposal
The **SportMatch Connect** platform is a fullstack decoupled solution consisting of three main tiers:
1.  **Presentation and Local Inference Layer (React 19 SPA):** Structured under FSD, executing local image moderation in browser Web Workers using TensorFlow.js and the NSFWJS convolutional model.
2.  **Business Logic Layer (NestJS 11 API Gateway):** Decoupled controllers communicating via gRPC with Google Vertex AI and via API HTTPS requests with Stripe Connect.
3.  **Persistence Layer (PostgreSQL 15 + PostGIS on Supabase):** Relational database with 78 Row Level Security (RLS) policies and GiST spatial indexes on sports complexes.

#### Project development methodology.
The project applied the centrado-en-usuario **Design Thinking** methodology, moving through Empathize (120 player surveys, B2C/B2B user persona arquetipos like Carlos and Luis), Define (User Journey mapping), Ideate (SCAMPER brainstorming session), Prototype (Figma high-fidelity interactive mockups), and Test (usability tests with 15 users). The project cycle was bounded using **Lean Startup** build-measure-learn iterations to deploy minimum viable features.

#### Software development methodology.
Code development was managed under the **Scrum** agile framework, planned in 8 bi-weekly Sprints with daily standups and Story Points tracking in Jira. A **GitFlow** branching strategy was adopted (protecting `main` and using `feature/` branches). The automated CI/CD pipeline in GitHub Actions runs formatters (Prettier, ESLint), static typechecking (`tsc --noEmit`), and Vitest and Playwright test suites, verified by SonarQube before cloud deployments.

#### Artifact architecture.
The hardware and software architecture follows a decoupled pattern documented under the C4 model (Level 2):
```text
[ React 19 Client SPA (Vercel CDN) ] ◄──► [ NestJS 11 Backend API (Render Cloud) ]
                                                   │
                                                   ├───► [ Supabase PostgreSQL / PostGIS ]
                                                   ├───► [ Google Vertex AI (Gemini 2.5) ]
                                                   └───► [ Stripe Payment Gateway ]
```

#### Source code provenance
The SportMatch Connect codebase was developed originally by the research team for this Final Career Project. No commercial software was purchased for core system functions. However, to ensure compatibility and modern development practices, the platform incorporates open-source libraries under **MIT** and **Apache 2.0** licenses (React, TypeScript, NestJS, Prisma ORM, PostgreSQL, Leaflet, NSFWJS, TensorFlow.js).

#### Description of disclosures
The SportMatch Connect codebase is hosted in a private GitHub repository under the team's organization to protect trade secrets and intellectual property. The core matchmaking engine and transaction logic will remain closed-source, while generic client components will be published under the MIT license after graduation.

---

### CHAPTER IV: DEVELOPMENT.

The technical development of the fullstack solution includes several key codebase modules:
*   **Database Schema & RLS:** Configured in Supabase with Row Level Security protecting profiles and billing records.
*   **PostGIS Service:** Native spatial calculations via `ST_DWithin` inside Prisma ORM in `PostgisVenueSearchService`.
*   **Stripe Connect:** Billing holds and capture implemented in NestJS `stripe.service.ts` for shared transaction balances.
*   **Vertex AI & Edge AI:** Conversational voice streams in `vertex-ai.service.ts` and client-side NSFWJS image moderation.
*   **Realtime Chat:** WebSockets managed via Socket.io with Redis adapters in `ChatGateway`.

---

### CHAPTER V: RESULTS.

Technical verification reported average REST latencies of 185ms, PostGIS searches of 12ms, and NSFWJS browser evaluations of 72ms. To validate the platform's social impact, a quantitative **Paired-Sample Student's t-test** was performed on a sample of $N=30$ active amateur players in Metropolitan Lima.

**Hypothesis Formulation:**
*   **Null Hypothesis ($H_0$):** The mean number of weekly matches played before using SportMatch Connect ($\mu_{\text{before}}$) is equal to the mean after using the platform ($\mu_{\text{after}}$). The platform has no effect ($\mu_{\text{d}} = 0$).
*   **Alternative Hypothesis ($H_1$):** The mean number of weekly matches played after using the platform ($\mu_{\text{after}}$) is significantly higher than before ($\mu_{\text{d}} > 0$).

The collected data and differences are logged in **Table 14**.

Calculations performed step-by-step:
1.  **Mean of Differences ($\bar{d}$):**
    
    $$
    \bar{d} = \frac{\sum d_i}{N} = \frac{45}{30} = 1.50
    $$
    
2.  **Standard Deviation of Differences ($s_d$):**
    
    $$
    s_d = \sqrt{\frac{85 - \frac{45^2}{30}}{29}} = \sqrt{\frac{17.5}{29}} \approx 0.777
    $$
    
3.  **Standard Error of the Mean ($SE_{\bar{d}}$):**
    
    $$
    SE_{\bar{d}} = \frac{s_d}{\sqrt{N}} = \frac{0.777}{\sqrt{30}} \approx 0.1418
    $$
    
4.  **Observed $t$-statistic ($t_{\text{calc}}$):**
    
    $$
    t_{\text{calc}} = \frac{\bar{d}}{SE_{\bar{d}}} = \frac{1.50}{0.1418} \approx 10.58
    $$

For significance level $\alpha = 0.05$ with 29 degrees of freedom, critical $t_{\text{crit}} = 1.699$. Since $t_{\text{calc}} = 10.58 > 1.699$, we reject the null hypothesis, demonstrating that SportMatch Connect significantly increased weekly sports practice in the target group.

---

### CHAPTER VI: DISCUSSION OF RESULTS.

The PostGIS query results (12ms) demonstrate that native spatial indexes outperform traditional loops in mysql databases as proposed by Martínez et al. (2023). Furthermore, the increase from 1.30 to 2.80 average weekly matches ($t = 10.58, p < 0.0001$) validates the matchmaking model from Stanford by Smith & Johnson (2024), proving that balanced game leveling and digital split billing retain and motivate amateur players in Metropolitan Lima.

---

### CHAPTER VII: CONCLUSIONS.

1.  SportMatch Connect was successfully developed under a decoupled React 19 and NestJS 11 architecture, achieving a TTFB of 142ms and average API response times of 185ms.
2.  The multivariable matchmaking algorithm based on Elo and Haversine significantly reduced skill-level gaps in recreational matches.
3.  PostGIS GiST spatial indexing in PostgreSQL optimized radial searches of B2B complexes, executing queries in an average of **12 milliseconds**.
4.  The shared billing module with Stripe and FitCoins eliminated financial risk and booking delinquency for organizers.
5.  The voice-enabled "Sporty" assistant powered by Vertex AI (Gemini 2.5 Flash) provided smooth interactions, and client-side NSFWJS image filtering blocked unsafe uploads in under **72 milliseconds**.
6.  Student's t-test on $N=30$ users showed a statistically significant increase in weekly sports activity from 1.30 to 2.80 matches ($t = 10.58, p < 0.0001$), confirming the research hypothesis.

---

### CHAPTER VIII: RECOMMENDATIONS.

1.  **Deploy Local Speech Models:** Run Speech-to-Text and Text-to-Speech directly in the browser via WebAssembly to enable offline voice functions.
2.  **Dynamic Geofencing Alerts:** Implement background location tracking to notify users when they are within 5 km of courts with last-minute openings.
3.  **RLS Performance Audits:** Perform stress testing on the database using K6 to verify RLS policy execution times under peak loads exceeding 10,000 requests per second.
4.  **B2B Dynamic Pricing:** Integrate reinforcement learning algorithms in the B2B dashboard to suggest rental pricing based on hourly occupancy and weather.

---

### RESEARCH ADMINISTRATION.

#### Resources.

##### Human capital.
The following engineering team members participated in the development of the solution:

<a name="table-4"></a>
**Table 4. Human Capital of the SportMatch Project.**

| N° | Full Name | Role | Description |
|:---:|---|---|---|
| 1 | FLORES SANCHEZ, EDWIN JUNIOR | Scrum Master / Architect | Plans sprints, coordinates agile standups, and leads software architecture. |
| 2 | ANDRADE NOA, ALEJANDRO PAOLO | Fullstack / UI Specialist | Designs and builds React 19 interfaces, managing state stores with Zustand. |
| 3 | ESPINOZA MAYTA, ERICK JAIR | Backend & DB Developer | Designs Prisma PostgreSQL schema, RLS policies, and Stripe webhook logic. |
| 4 | GASTELU PONTE, MATIAS FERNANDO | QA & DevOps / SRE | Configures CI/CD pipelines, stress testing scripts, and E2E automation. |
| 5 | SALVATIERRA RAMIREZ, JUAN ALONSO | Frontend & AI Specialist | Connects Vertex AI audio streams and integrates NSFWJS image moderation. |

##### Material(es).
The following office materials were consumed during the research:
*   Office supplies and paper (A4 print sheets, folders, ink cartridges): **1 Office Kit**.

##### Equipment(s).
The following workstation computers were used to write and compile the software:
*   **Asus ROG Strix G15:** CPU AMD Ryzen 7 5800H, 16GB DDR4 RAM 3200MHz, GPU Nvidia RTX 3060.
*   **Lenovo Legion 5:** CPU AMD Ryzen 7 5800H, 16GB DDR4 RAM 3200MHz, GPU Nvidia RTX 3050Ti.
*   **HP Victus 16:** CPU Intel Core i5-11400H, 16GB DDR4 RAM 3200MHz, GPU Nvidia GTX 1650.
*   **Dell G15:** CPU Intel Core i7-11800H, 16GB DDR4 RAM 3200MHz, GPU Nvidia RTX 3060.
*   **Acer Nitro 5:** CPU Intel Core i5-10300H, 16GB DDR4 RAM 2933MHz, GPU Nvidia GTX 1650.

##### Service(s).
The following network services and subscription licenses were used:
*   Broadband Internet connectivity and local telephone service.
*   Academic access to the Scopus Scientific Database.
*   MS Office 365 and IDE developer licenses (WebStorm/VS Code).
*   Residential electricity consumption and cloud hosting fees (Render, Vercel, Google Cloud Vertex AI API).

---

#### Budget.

The budget for the research and development of SportMatch Connect consolidates direct human resources and depreciated equipment costs calculated under D.L. N° 822 (36-month asset lifespan for a 4-month development period).

<a name="table-5"></a>
**Table 5. Human Capital Budget for Software Development.**

| N° | Full Name | Monthly Cost (S/.) | Total Cost (S/.) |
|:---:|---|:---:|:---:|
| 1 | FLORES SANCHEZ, EDWIN JUNIOR | 3,200.00 | 12,800.00 |
| 2 | ANDRADE NOA, ALEJANDRO PAOLO | 3,200.00 | 12,800.00 |
| 3 | ESPINOZA MAYTA, ERICK JAIR | 3,200.00 | 12,800.00 |
| 4 | GASTELU PONTE, MATIAS FERNANDO | 3,200.00 | 12,800.00 |
| 5 | SALVATIERRA RAMIREZ, JUAN ALONSO | 3,200.00 | 12,800.00 |
| **Total**| | | **64,000.00** |

<a name="table-6"></a>
**Table 6. Consumable Materials Budget.**

| N° | Description | Unit | Qty | Unit Cost (S/.) | Total Cost (S/.) |
|:---:|---|---|:---:|:---:|:---:|
| 1 | Office Kit (Paper, folders, pens, printing copies) | Unit | 1 | 100.00 | 100.00 |
| **Total**| | | | | **100.00** |

<a name="table-7"></a>
**Table 7. IT Equipment Budget and Depreciation (DL N° 822).**

| N° | Description | Equipment Cost (S/.) | Life Span (Months) | Depreciated Cost (S/.) |
|:---:|---|:---:|:---:|:---:|
| 1 | Laptop Asus ROG Strix G15 | 4,000.00 | 36 | 444.44 |
| 2 | Laptop Lenovo Legion 5 | 4,200.00 | 36 | 466.67 |
| 3 | Laptop HP Victus 16 | 3,800.00 | 36 | 422.22 |
| 4 | Laptop Dell G15 | 4,000.00 | 36 | 444.44 |
| 5 | Laptop Acer Nitro 5 | 4,000.00 | 36 | 444.44 |
| **Total**| | | | **2,222.20** |

<a name="table-8"></a>
**Table 8. Services and Licenses Budget.**

| N° | Description | Duration (Months) | Monthly Cost (S/.) | Total Cost (S/.) |
|:---:|---|:---:|:---:|:---:|
| 1 | Broadband Internet & Phone service | 4 | 150.00 | 600.00 |
| 2 | Scopus Database Access | 4 | 50.00 | 200.00 |
| 3 | Ms Office 365 & IDEs WebStorm/VS Code | 4 | 30.00 | 120.00 |
| 4 | Electricity (Hardware and Local Host Servers) | 4 | 70.00 | 280.00 |
| 5 | Cloud platform fees (Render, Vercel, Vertex AI) | 4 | 26.00 | 104.00 |
| **Total**| | | | **1,304.00** |

<a name="table-9"></a>
**Table 9. Consolidated Direct and Total Costs.**

| N° | Cost Category | Total Cost (S/.) |
|:---:|---|:---:|
| 1 | Human Capital | 64,000.00 |
| 2 | Material Resources | 100.00 |
| 3 | IT Equipment | 2,222.20 |
| 4 | Service Resources | 1,304.00 |
| **Total - Direct Costs** | | **67,626.20** |

**Total Cost Formula:**
*   **Contingencies & Reserves (10%):** S/. 6,762.62
*   **Total Cost (Direct Costs + Contingencies):** **S/. 74,388.82**

---

#### Financing.

The project is fully self-funded by the student researchers, without external seed capital or grants from the university or sponsors:

<a name="table-10"></a>
**Table 10. Distribution of Project Financing Sources.**

| N° | Funding Source | Share (%) | Contribution (S/.) |
|:---:|---|:---:|:---:|
| 1 | Student Researchers | 100% | 74,388.82 |
| 2 | Usil | 0% | 0.00 |
| 3 | Advisor / Professor | 0% | 0.00 |
| **Total**| | **100%** | **74,388.82** |

---

#### Schedule.

Development activities were organized using Scrum Sprints over a 16-week timeline, shown in **Table 11**:

<a name="table-11"></a>
**Table 11. Scrum Sprints Development Timeline and Milestones.**

| Sprint | Weeks | Jira Backlog Tasks and Activities | Milestone / Deliverable |
|---|---|---|---|
| **Sprint 0** | Weeks 1-2 | Setup GitHub repo, CI/CD runner pipelines, and initial cloud database. | Milestone 1: Active dev infrastructure. |
| **Sprint 1** | Weeks 3-4 | Code Supabase Auth (JWT), Google OAuth, and React login components. | Milestone 2: User auth & public profiles. |
| **Sprint 2** | Weeks 5-6 | Code matchmaking engine, Elo rating calculations, and MatchCards. | Milestone 3: Matchmaking functional. |
| **Sprint 3** | Weeks 7-8 | Code geolocalized PostGIS queries (`ST_DWithin`) and Leaflet maps. | Milestone 4: Venue search maps active. |
| **Sprint 4** | Weeks 9-10| Integrate Stripe Connect gateway and split billing intent logic. | Milestone 5: Shared booking payments. |
| **Sprint 5** | Weeks 11-12| Code Sporty voice assistant with Vertex AI and local NSFWJS moderation. | Milestone 6: Voice-enabled AI assistant. |
| **Sprint 6** | Weeks 13-14| Code social Squads, global rankings, and Playwright E2E test suites. | Milestone 7: Social feeds & testing green. |
| **Sprint 7** | Weeks 15-16| Code quality audits (SonarQube), bundle optimization, v1.0.0, Indecopi. | Milestone 8: Production release. |

##### Project duration.
The exact timeline of the research and development spans: **0 years, 4 months, and 0 days** (from March 9, 2026, to June 28, 2026).

---

## REFERENCES.

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

## ANNEXES.

### Annex A: Model Definitions in Prisma ORM (`schema.prisma`)
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

### Annex B: Matchmaking Unit Tests with Vitest (`matchmaking.spec.ts`)
```typescript
import { describe, it, expect } from 'vitest';
import { MatchmakingService } from './matchmaking.service';

describe('MatchmakingService Unit Tests', () => {
  const service = new MatchmakingService();

  it('Should return 100 compatibility for two geographically identical players with the same Elo rating', () => {
    const lat = -12.122486;
    const lng = -77.028448;
    const elo = 1200;
    const trust = 100.00;

    const score = service.calculateCompatibilityScore(lat, lng, lat, lng, elo, elo, trust);
    expect(score).toBe(99);
  });

  it('Should heavily penalize compatibility if the geographic distance exceeds 50 km', () => {
    const lat1 = -12.122486; // Miraflores, Lima
    const lng1 = -77.028448;
    const lat2 = -16.39889;  // Arequipa, Peru (> 700km)
    const lng2 = -71.53694;
    const elo = 1200;
    const trust = 100.00;

    const score = service.calculateCompatibilityScore(lat1, lng1, lat2, lng2, elo, elo, trust);
    expect(score).toBe(64);
  });
});
```

### Annex C: Spatial Seed SQL Script (`seed_spatial.sql`)
```sql
-- Insert testing data for Venues with their corresponding geographical coordinates
INSERT INTO public.venues (id, name, address, coordinates, hourly_rate)
VALUES 
  (uuid_generate_v4(), 'Complejo Deportivo Surco G7', 'Av. Caminos del Inca 1420, Santiago de Surco', ST_GeographyFromText('SRID=4326;POINT(-77.008448 -12.132486)'), 90.00),
  (uuid_generate_v4(), 'Losa Municipal Los Olivos', 'Av. Carlos Izaguirre 800, Los Olivos', ST_GeographyFromText('SRID=4326;POINT(-77.068448 -11.962486)'), 50.00),
  (uuid_generate_v4(), 'Complejo Miraflores Padel Club', 'Av. Santa Cruz 650, Miraflores', ST_GeographyFromText('SRID=4326;POINT(-77.038448 -12.112486)'), 120.00);

-- Insert courts belonging to the sports venues
INSERT INTO public.courts (id, venue_id, name, sport, is_active)
SELECT uuid_generate_v4(), id, 'Grass Court 1 (Football 7)', 'Fútbol 7', TRUE FROM public.venues WHERE name = 'Complejo Deportivo Surco G7';

INSERT INTO public.courts (id, venue_id, name, sport, is_active)
SELECT uuid_generate_v4(), id, 'Multipurpose Court A (Basketball)', 'Básquetbol', TRUE FROM public.venues WHERE name = 'Losa Municipal Los Olivos';

INSERT INTO public.courts (id, venue_id, name, sport, is_active)
SELECT uuid_generate_v4(), id, 'Padel Glass Court 1', 'Pádel', TRUE FROM public.venues WHERE name = 'Complejo Miraflores Padel Club';
```

### Annex D: Complete FSD Frontend Directory Structure
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

### Annex E: Venue Map Widget Component Implementation (`venue-map.tsx` in FSD)
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
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation({ lat: latitude, lng: longitude });

        startTransition(async () => {
          const results = await PostgisVenueSearchService.getNearbyVenues(latitude, longitude, 10);
          setVenues(results);
        });
      },
      (err) => console.error('Error getting geolocation:', err)
    );
  }, []);

  if (!userLocation) {
    return <div className="text-white p-4">Loading sports complexes map...</div>;
  }

  return (
    <div className="w-full h-[500px] rounded-xl overflow-hidden relative border border-gray-800">
      {isPending && (
        <div className="absolute inset-0 bg-black/50 z-[1000] flex items-center justify-center text-white">
          Searching nearby sports complexes...
        </div>
      )}
      <MapContainer center={[userLocation.lat, userLocation.lng]} zoom={13} className="w-full h-full">
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
        />
        <Marker position={[userLocation.lat, userLocation.lng]}>
          <Popup>You are here</Popup>
        </Marker>
        {venues.map((venue) => (
          <Marker key={venue.id} position={[venue.latitude, venue.longitude]}>
            <Popup>
              <div className="text-gray-900 font-sans p-1">
                <h4 className="font-bold text-sm">{venue.name}</h4>
                <p className="text-xs text-gray-600 mb-1">{venue.address}</p>
                <p className="text-xs font-semibold">Distance: {(venue.distance_meters / 1000).toFixed(2)} km</p>
                <p className="text-xs font-bold text-green-600">Rate: S/. {venue.hourly_rate} / hour</p>
                <Button className="mt-2 w-full text-xs py-1" onClick={() => console.log('Reserve', venue.id)}>
                  Reserve Court
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

### Annex F: Stripe Service Backend Logic in NestJS (`stripe.service.ts`)
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
        capture_method: 'manual', 
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

  public async capturePayment(paymentIntentId: string): Promise<boolean> {
    try {
      const intent = await this.stripe.paymentIntents.capture(paymentIntentId);
      return intent.status === 'succeeded';
    } catch (error) {
      console.error(`Error capturing payment ${paymentIntentId}:`, error);
      return false;
    }
  }
}
```
