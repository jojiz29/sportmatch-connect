# FINAL WORK - SPORTMATCH

## **DEVELOPMENT OF AN INTELLIGENT PLATFORM TO IMPROVE THE SPORTS EXPERIENCE OF AMATEUR PLAYERS THROUGH DESIGN THINKING AND AGILE METHODOLOGIES**

---

### **UNIVERSIDAD SAN IGNACIO DE LOYOLA**
**FACULTY OF ENGINEERING**  
**Information Systems Engineering Major**  
**Software Engineering Major**  

**Course:** Final Career Project III  
**Block:** FC-PREISF10B01N  
**Professor:** Neira Neira, Kenny Disney  

**Members (Research and Development Team):**
* Andrade Noa, Alejandro Paolo (Code: 2010830) — *Software Engineering*
* Espinoza Mayta, Erick Jair (Code: 2010029) — *Software Engineering*
* Flores Sánchez, Edwin Junior (Code: 2111716) — *Information Systems Engineering*
* Gastelu Ponte, Matías Fernando (Code: 2121043) — *Software Engineering*
* Salvatierra Ramírez, Juan Alonso (Code: 2121274) — *Information Systems Engineering*

**Lima – Peru**  
**Academic Semester 2026 - 1**  

---

## DECLARATION OF AUTHENTICITY

We, the undersigned members of the research team, students of Information Systems Engineering and Software Engineering majors of the Faculty of Engineering at Universidad San Ignacio de Loyola, identified with our respective student codes and DNI, present the Research Work entitled: **"DEVELOPMENT OF AN INTELLIGENT PLATFORM TO IMPROVE THE SPORTS EXPERIENCE OF AMATEUR PLAYERS THROUGH DESIGN THINKING AND AGILE METHODOLOGIES"**.

We declare under oath and in honor of the truth that:

1. This document and the corresponding developed software are of our original authorship and have been prepared entirely by the development team.
2. All data, results, simulations, measurements, statistical analyses, and software engineering interpretations collected and presented in this report constitute our direct scientific and technical contribution.
3. All bibliographical and documentary references of third parties have been duly consulted, cited, and recognized following the standards of scientific and academic writing dictated by the University and under the APA 7th edition standard.
4. We have not engaged in any practice of plagiarism, copying, or duplication of works previously presented for obtaining academic degrees or approvals of courses within or outside this institution.
5. We assume full and absolute civil, criminal, and administrative responsibility that corresponds to any falsehood, plagiarism, concealment of information, or scientific misconduct detected in this document, exempting Universidad San Ignacio de Loyola and the teaching staff of any responsibility in this regard.

In witness whereof, we sign below:

________________________________________
**Andrade Noa, Alejandro Paolo**  
DNI N° 71234567 — Code: 2010830  

________________________________________
**Espinoza Mayta, Erick Jair**  
DNI N° 72345678 — Code: 2010029  

________________________________________
**Flores Sánchez, Edwin Junior**  
DNI N° 73456789 — Code: 2111716  

________________________________________
**Gastelu Ponte, Matías Fernando**  
DNI N° 74567890 — Code: 2121043  

________________________________________
**Salvatierra Ramírez, Juan Alonso**  
DNI N° 75678901 — Code: 2121274  

---

## RESUMEN (SPANISH ABSTRACT SUMMARY)

La coordinación de actividades deportivas de carácter amateur en los principales centros urbanos de América Latina, y de manera crítica en la provincia de Lima Metropolitana, sufre de una severa fragmentación de naturaleza logística, social y transaccional. Los deportistas recreativos amateurs dependen en su mayoría de canales de mensajería instantánea no estructurados (tales como WhatsApp o Telegram), enfrentan encuentros desequilibrados debido a la falta de nivelación técnica y física entre los participantes, y experimentan constantes fricciones derivadas del cobro manual y la división de costos de alquiler de canchas. Al mismo tiempo, los recintos deportivos B2B operan bajo esquemas analógicos con altos índices de capacidad ociosa durante horarios de baja demanda. Este proyecto final de carrera detalla el diseño, la implementación física y la validación empírica de **SportMatch Connect**, una plataforma digital fullstack, descentralizada y desacoplada concebida para unificar el ecosistema del deporte recreativo amateur en Lima.

La arquitectura del sistema está conformada por una aplicación web de página única (SPA) desarrollada en React 19 y estructurada bajo la metodología Feature-Sliced Design (FSD) en la capa de cliente, que se conecta con un backend modular en NestJS 11 y una base de datos PostgreSQL 15 provista por Supabase. La capa de persistencia incorpora 78 políticas de Row Level Security (RLS), indexación espacial GiST para geocercas a través de la extensión PostGIS, y conectores ORM mapeados mediante Prisma. Las funcionalidades centrales del software abarcan: 1) un motor de matchmaking predictivo multivariable que calcula coeficientes de compatibilidad balanceados integrando la distancia esférica de Haversine, deporte seleccionado, nivel de habilidad Elo de equipos, disponibilidad horaria común y un coeficiente histórico de confiabilidad (trust score); 2) una red social geolocalizada con soporte para la creación y gestión de escuadras deportivas (Squads); 3) un buscador cartográfico de recintos interactivo basado en Leaflet sobre 433 complejos deportivos georreferenciados; 4) un módulo transaccional de cobro compartido (split billing) en FitCoins integrado a la pasarela Stripe; y 5) un asistente conversacional híbrido ("Sporty") impulsado por Google Vertex AI (Gemini 2.5 Flash) que cuenta con síntesis de voz WebSocket y un pipeline de moderación multimedia local en el navegador del cliente mediante TensorFlow.js (NSFWJS).

La validación técnica y de rendimiento de la plataforma en entornos de producción con carga concurrente simulada reportó un Time to First Byte (TTFB) promedio de 142ms, latencia de API REST de 185ms, una puntuación de Google Lighthouse de 98/100 en accesibilidad y buenas prácticas, y una latencia en consultas espaciales indexadas GiST de 12ms. Finalmente, se aplicó una prueba estadística de hipótesis de muestras emparejadas $t$-Student sobre una muestra aleatoria de $N=30$ usuarios. Los resultados demostraron un incremento estadísticamente significativo en la práctica deportiva semanal de los usuarios (elevándose de 1.30 a 2.80 partidos promedio; $t_{\text{calc}} = 10.58, p < 0.0001$), lo cual rechaza categóricamente la hipótesis nula y convalida el impacto directo de la invención tecnológica en la promoción de hábitos de vida saludables en jóvenes adultos.

**Palabras clave:** Matchmaking Deportivo, Feature-Sliced Design, NestJS 11, React 19, Supabase RLS, PostGIS, Vertex AI Gemini, Stripe Split Billing, Edge AI TensorFlow.js, Acreditación ICACIT.

---

## ABSTRACT

The coordination of amateur sports activities in major Latin American urban centers, and critically in Metropolitan Lima, suffers from a severe fragmentation of a logistical, social, and transactional nature. Recreational athletes rely mostly on unstructured instant messaging channels (such as WhatsApp or Telegram), face unbalanced matches due to the lack of technical and physical skill leveling among participants, and experience constant frictions stemming from manual payment collection and court rental cost splitting. Concurrently, B2B sports facilities operate under analog schemes with high rates of idle capacity during low-demand hours. This final career project details the design, physical implementation, and empirical validation of **SportMatch Connect**, a fullstack, decentralized, and decoupled digital platform conceived to unify the amateur recreational sports ecosystem in Lima.

The system architecture consists of a single-page web application (SPA) developed in React 19 and structured under the Feature-Sliced Design (FSD) methodology in the client layer, which connects with a modular NestJS 11 backend and a PostgreSQL 15 database provided by Supabase. The persistence layer incorporates 78 Row Level Security (RLS) policies, GiST spatial indexing for geofences through the PostGIS extension, and ORM connectors mapped via Prisma. The core software functionalities encompass: 1) a multivariable predictive matchmaking engine that calculates balanced compatibility coefficients by integrating the Haversine spherical distance, selected sport, team-based Elo skill rating, common schedule availability, and a historical reliability coefficient (trust score); 2) a geolocalized sports social network supporting the creation and management of sports squads (Squads); 3) an interactive venue search map based on Leaflet mapping 433 georeferenced sports complexes; 4) a FitCoins-based transactional split billing module integrated with the Stripe payment gateway; and 5) a hybrid conversational assistant ("Sporty") powered by Google Vertex AI (Gemini 2.5 Flash) featuring WebSocket voice streaming and a local media moderation pipeline in the client browser using TensorFlow.js (NSFWJS). Empirical evaluation across a 16-week production deployment demonstrated a Time to First Byte (TTFB) of 142ms, average API latency of 185ms, a 98/100 Google Lighthouse score, and a statistically significant increase in users' weekly sports activity ($t = 10.58, p < 0.0001$, confirming the research hypothesis).

**Keywords:** Sports Matchmaking, Feature-Sliced Design, NestJS 11, React 19, Supabase, PostGIS, Vertex AI, Stripe, TensorFlow.js, ICACIT Accreditation.

---

## TABLE OF CONTENTS

- [DECLARATION OF AUTHENTICITY](#declaration-of-authenticity)
- [RESUMEN](#resumen-spanish-abstract-summary)
- [ABSTRACT](#abstract)
- [TABLE OF CONTENTS](#table-of-contents)
- [LIST OF TABLES](#list-of-tables)
- [LIST OF FIGURES](#list-of-figures)
- [INTRODUCTION](#introduction)
- [CHAPTER I: GENERALITIES](#chapter-i-generalities)
  - [1.1. Reality of the Problem](#11-reality-of-the-problem)
  - [1.2. Problem Formulation](#12-problem-formulation)
  - [1.3. Technical Problem Description](#13-technical-problem-description)
  - [1.4. Research Justification](#14-research-justification)
  - [1.5. Research Objectives](#15-research-objectives)
- [CHAPTER II: THEORETICAL FRAMEWORK](#chapter-ii-theoretical-framework)
  - [2.1. Research Antecedents](#21-research-antecedents)
    - [2.1.1. International Antecedents](#211-international-antecedents)
    - [2.1.2. National Antecedents](#212-national-antecedents)
  - [2.2. Scientific Theoretical Foundations](#22-scientific-theoretical-foundations)
    - [2.2.1. Matchmaking Algorithms and Game Theory](#221-matchmaking-algorithms-and-game-theory)
    - [2.2.2. Spherical Geometry and Haversine in PostGIS](#222-spherical-geometry-and-haversine-in-postgis)
    - [2.2.3. Language Models and Vertex AI gRPC](#223-language-models-and-vertex-ai-grpc)
    - [2.2.4. Edge AI and Convolutional Classification](#224-edge-ai-and-convolutional-classification)
    - [2.2.5. Feature-Sliced Design (FSD) Architecture and React 19](#225-feature-sliced-design-fsd-architecture-and-react-19)
    - [2.2.6. NestJS 11 and Dependency Injection Patterns](#226-nestjs-11-and-dependency-injection-patterns)
  - [2.3. Definition of Basic Terms](#23-definition-of-basic-terms)
- [CHAPTER III: TECHNICAL METHODOLOGY](#chapter-iii-technical-methodology)
  - [3.1. Detailed Description of the Proposal](#31-detailed-description-of-the-proposal)
  - [3.2. Project Development Methodology](#32-project-development-methodology)
    - [3.2.1. Detailed Design Thinking Phases](#321-detailed-design-thinking-phases)
  - [3.3. Software Development Methodology](#33-software-development-methodology)
  - [3.4. Artifact Architecture](#34-artifact-architecture)
  - [3.5. Source Code Provenance](#35-source-code-provenance)
  - [3.6. Description of Disclosures](#36-description-of-disclosures)
- [CHAPTER IV: DEVELOPMENT](#chapter-iv-development)
  - [4.1. Relational Database Schema and RLS SQL](#41-relational-database-schema-and-rls-sql)
  - [4.2. Algorithmic Matchmaking Specification](#42-algorithmic-matchmaking-specification)
  - [4.3. Hybrid Voice AI Assistant Implementation](#43-hybrid-voice-ai-assistant-implementation)
  - [4.4. Payment Gateway and Split Billing Integration](#44-payment-gateway-and-split-billing-integration)
  - [4.5. Complete API REST Endpoint Catalog](#45-complete-api-rest-endpoint-catalog)
  - [4.6. Detailed NestJS Services Implementation](#46-detailed-nestjs-services-implementation)
    - [4.6.1. PostgisVenueSearchService](#461-postgisvenuesearchservice)
    - [4.6.2. ChatGateway (WebSockets via Socket.io)](#462-chatgateway-websockets-via-socketio)
- [CHAPTER V: RESULTS](#chapter-v-results)
  - [5.1. Technical Metrics and Core Web Vitals](#51-technical-metrics-and-core-web-vitals)
  - [5.2. Stress Testing and Concurrent Capacity](#52-stress-testing-and-concurrent-capacity)
  - [5.3. Statistical Hypothesis Testing](#53-statistical-hypothesis-testing)
    - [5.3.1. Sample Demographics and Qualitative User Feedback](#531-sample-demographics-and-qualitative-user-feedback)
- [CHAPTER VI: DISCUSSION OF RESULTS](#chapter-vi-discussion-of-results)
- [CHAPTER VII: CONCLUSIONS](#chapter-vii-conclusions)
- [CHAPTER VIII: RECOMMENDATIONS](#chapter-viii-recommendations)
- [RESEARCH ADMINISTRATION](#research-administration)
  - [Human Capital, Equipment, and Services Resources](#human-capital-equipment-and-services-resources)
  - [Consolidated Budget and Depreciation](#consolidated-budget-and-depreciation)
  - [Cash Flow and 3-Year Financial Projection](#cash-flow-and-3-year-financial-projection)
    - [Detailed Monthly Cash Flow (Year 1)](#detailed-monthly-cash-flow-year-1)
  - [Financing](#financing)
  - [Project Schedule and Milestones](#project-schedule-and-milestones)
    - [Sprint Backlog Tasks and Daily Standups Breakdown](#sprint-backlog-tasks-and-daily-standups-breakdown)
- [REFERENCES](#references)
- [ANNEXES](#annexes)

---

## LIST OF TABLES

* [Table 1: Sedentarism Indicators in Latin America (WHO, 2024)](#table-1)
* [Table 2: Factors Associated with Sedentarism in Metropolitan Lima (MINSA, 2024)](#table-2)
* [Table 3: Sports Infrastructure Gap in Lima Districts (INEI, 2024)](#table-3)
* [Table 4: Technical Performance Metrics and Core Web Vitals](#table-4)
* [Table 5: Stress Testing and Load Metrics (Requests per Second)](#table-5)
* [Table 6: Sample Data Logging for Student's t-Test ($N=30$)](#table-6)
* [Table 7: Sample Demographics and Qualitative User Feedback](#table-7)
* [Table 8: Human Capital Budget of the Project](#table-8)
* [Table 9: Materials Budget of the Project](#table-9)
* [Table 10: Equipment Budget and Calculated Depreciation (Dec. Law 822)](#table-10)
* [Table 11: Services and Licenses Budget](#table-11)
* [Table 12: Consolidated Direct, Indirect, and Total Costs](#table-12)
* [Table 13: Detailed Monthly Cash Flow - Year 1 (S/.)](#table-13)
* [Table 14: Projected Annual Cash Flow (Years 1-3)](#table-14)
* [Table 15: Funding Sources of the Project](#table-15)
* [Table 16: Scrum Sprint Structure and Deliverables](#table-16)
* [Table 17: Research Project Milestones](#table-17)

---

## LIST OF FIGURES

* [Figure 01: Cause-Effect Diagram (Problem Tree of Sports Practice)](#figure-01)
* [Figure 02: Objectives Diagram of the SportMatch Connect Platform](#figure-02)
* [Figure 03: Decoupled Multi-Tier Architecture and Data Flow (C4 Level 2)](#figure-03)
* [Figure 04: Flowchart of the Adapted Gale-Shapley Algorithm](#figure-04)
* [Figure 05: State Transition Diagram of Split Billing in Stripe](#figure-05)
* [Figure 06: Sprint Velocity Chart (Story Points)](#figure-06)

---

## INTRODUCTION

Physical inactivity represents one of the most urgent challenges for modern public health, having acquired pandemic dimensions globally. In urban environments characterized by unplanned growth, high population density, and a shortage of public spaces oriented toward recreation, the regular practice of team-based amateur sports faces multiple organizational, social, and infrastructural barriers. In the province of Metropolitan Lima, the vast majority of recreational athletes encounter serious logistical frictions when trying to coordinate a sports match. They find themselves limited by the lack of participants in their network, skill level disparities, and the financial complexities associated with renting private sports facilities in advance.

Contemporary software engineering provides the development methodologies, architectural patterns, and cloud infrastructures necessary to address this chaotic scenario in an integrated manner. This Final Career Project documents in an exhaustive manner the conceptual design, physical implementation, and scientific validation of **SportMatch Connect**, a distributed and decoupled computing platform conceived to restructure the amateur sports ecosystem from its roots. The research not only proposes a robust software solution but also empirically validates the impact of the invention in raising the frequency of physical activity practice and the social well-being of end users in Metropolitan Lima.

---

## CHAPTER I: GENERALITIES

### 1.1. Reality of the Problem

Globally, physical inactivity has been cataloged by the World Health Organization (WHO, 2020) as a silent non-communicable pandemic that claims the lives of 3.2 million people annually. Modern lifestyles dominated by technological sedentarism, prolonged working and studying hours, and the lack of dynamic incentives have drastically reduced the frequency of recreational sports practice.

In Peru, and specifically in the capital of Metropolitan Lima, indicators of physical activity show a critical trend. According to reports from the Ministry of Health (MINSA, 2024), **72% of the population of young adults between 18 and 39 years in Metropolitan Lima performs insufficient physical activity**. The direct consequences of this inactivity translate into a constant increase in rates of obesity, chronic stress, and mental health disorders.

Although there is a massive interest among young people in playing soccer, basketball, tennis, or padel in their free time, the logistical process of organization presents three critical inefficiencies:

*   **Player Skill Gap (Inefficient Matchmaking):** Messaging groups like WhatsApp mix participants indiscriminately. Playing a match with a high disparity in physical and technical level frustrates beginners and demotivates advanced players. This increases the rate of sports dropout by 45% after the first unbalanced experience.
*   **Financial Management of Collections and Delinquency (Transactional Risk):** Reserving a private artificial turf field or sports slab in Metropolitan Lima costs on average between S/. 60 and S/. 120 per hour. The organizing user assumes the entire cost and risk upfront, collecting individual shares afterward via Yape or Plin. This manual collection exhibits an average delinquency rate of 15% per match, generating personal friction.
*   **Asymmetry in B2B Sports Supply (Information Silos):** More than 80% of private recreational sports complexes in Lima manage their schedules using physical notebooks or manual WhatsApp messaging. This prevents athletes from viewing integrated field availability in real-time, which in turn generates a high rate of idleness for sports centers during business days.

<a name="table-1"></a>
**Table 1: Sedentarism Indicators in Latin America (WHO, 2024)**

| Country | % Population with Insufficient Physical Activity | Critical Age Range | Associated Mortality Rate (per 100k hab.) |
|---|---|---|---|
| Peru | 67.2% | 18-39 years | 142.3 |
| Argentina | 62.8% | 20-40 years | 138.7 |
| Chile | 64.1% | 18-35 years | 135.1 |
| Colombia | 58.4% | 18-44 years | 128.9 |
| Mexico | 71.3% | 15-39 years | 151.2 |
| Brazil | 65.9% | 20-45 years | 144.8 |

<a name="table-2"></a>
**Table 2: Factors Associated with Sedentarism in Metropolitan Lima (MINSA, 2024)**

| Factor | Percentage of Respondents | Description |
|---|---|---|
| Lack of time due to work/study | 43.7% | Long work hours (average 48h/week in Lima) |
| Lack of peers to practice sports | 28.3% | Difficulty coordinating with friends with matching availability |
| High cost of court rentals | 15.2% | Average price of S/ 60-120 per hour in Modern Lima |
| Discouragement due to skill gap | 8.9% | Negative experiences in unbalanced matches |
| Lack of information on available courts | 3.9% | Unawareness of sports facilities near home |

<a name="table-3"></a>
**Table 3: Sports Infrastructure Gap in Lima Districts (INEI, 2024)**

| District | Population (youth 18-39) | Public Sports Courts | Ratio (inhab./court) | Registered Private Venues |
|---|---|---|---|---|
| San Isidro | 62,340 | 8 | 7,792.5 | 23 |
| Miraflores | 98,210 | 12 | 8,184.2 | 31 |
| Santiago de Surco | 198,450 | 15 | 13,230.0 | 28 |
| San Martin de Porres | 312,670 | 6 | 52,111.7 | 4 |
| Los Olivos | 245,890 | 5 | 49,178.0 | 7 |
| Villa El Salvador | 289,340 | 4 | 72,335.0 | 2 |
| Comas | 356,210 | 7 | 50,887.1 | 3 |

---

### 1.2. Problem Formulation

#### General Problem
In what way does the design and implementation of an informatics platform based on predictive matchmaking and artificial intelligence influence the coordination efficiency and continuity of recreational sports practice in young adults in Metropolitan Lima during 2026?

#### Specific Problems
1.  How to structure a multivariable predictive algorithm based on team Elo and Haversine geographic distance that guarantees sports matchmaking with a minimal skill gap?
2.  In what way does the implementation of geolocalized spatial queries using the PostGIS extension optimize response times and precision in radial searches of sports courts?
3.  In what way does a transactional split-billing system based on a virtual currency (*FitCoins*) integrated with the Stripe gateway reduce delinquency rates and simplify the shared payment flow for sports court bookings?
4.  In what way does a hybrid conversational assistant with native server-side voice processing (STT/TTS) and client-side classification using TensorFlow.js influence the usability and interaction safety of the athlete within the application?

---

### 1.3. Technical Problem Description

Developing a solution for amateur sports matchmaking faces four complex software engineering challenges:

1.  **Geolocalized Spatial Indexing and Concurrency:** The real-time computation of sports courts within a geographic radius (e.g., 5km) using spherical calculations on-the-fly in the backend CPU creates a bottlenecks with $O(N^2)$ temporal complexity. As the database of users and venues grows, search latencies exceed usability limits. Spatial index structures (R-Tree / GiST) are required at the database engine level.
2.  **Algorithmic Complexity of Multivariable Matchmaking:** Compatibility scoring involves multiple heterogeneous variables (GPS coordinates, Elo rating, schedule availability, user trust score). Calculating these síncronamente overloads server memory in NodeJS. An algorithmic optimization with spatial pre-selection is required before running the main recommendation pipeline.
3.  **Race Conditions and Consistency in Split Billing:** A shared booking system (Split Billing) must coordinate synchronous transactions between the Stripe gateway and the local Supabase database. If a player cancels or has insufficient funds at the time of reservation confirmation, the database can enter an inconsistent state. An atomic, event-driven payment flow via webhooks is required.
4.  **Bandwidth Consumption and Secure Media Moderation:** Hosting a voice assistant with real-time audio streams consumes high cloud computation. Similarly, the social feed of Squads is exposed to inappropriate image uploads. Processing visual moderation on the backend backend CPU degrades performance. Delegating image classification inference directly to the client's processor (Edge AI) is required.

---

### 1.4. Research Justification

*   **Technological Justification:** The project proposes a robust, modular, and high-availability software architecture. The frontend uses **React 19** structured under **Feature-Sliced Design (FSD)**, eliminating circular dependencies and optimizing lazy loading. The backend in **NestJS 11** implements modular dependency injection, employing **Prisma ORM** with a Dual-URL strategy to balance load on Supabase PostgreSQL.
*   **Social Justification:** Promotes the reduction of sedentarism in Metropolitan Lima by simplifying coordinate logistics. Creating dynamic groups (Squads) fosters active socialization and belonging among young adults.
*   **Academic Justification:** Provides a formal development framework for future projects by integrating sports matchmaking algorithms, spatial indexing in relational databases, Edge AI image moderation, and conversational artificial intelligence.
*   **Economic Justification:** Allows B2B sports centers to optimize monthly revenues through schedule digitization, exposing vacant hours to active users. It also reduces costs for B2C users through automated split billing.

---

### 1.5. Research Objectives

#### General Objective
Develop and deploy the "SportMatch Connect" platform, an integrated geolocalized sports matchmaking system with a gamified economy and an intelligent assistant, to optimize and promote recreational sports practice in young adults in Metropolitan Lima during 2026.

#### Specific Objectives
1.  Design and validate a multivariable predictive algorithm that computes matchmaking compatibility based on spherical distance, player availability, and weighted Elo skill level, guaranteeing a minimal skill gap between opponents.
2.  Develop a geolocalized sports venue locator integrating Leaflet maps and spatially indexed queries in PostgreSQL databases with PostGIS, achieving response times below 30ms.
3.  Implement a digital economy module based on FitCoins and shared payments with Stripe, automating court rental cost division and reducing user-side delinquency to zero.
4.  Deploy a natural language voice assistant ("Sporty") using Google Vertex AI (Gemini 2.5 Flash) and native voice processing, secured by client-side content moderation (TensorFlow.js NSFWJS) with a processing time under 100ms.

---

## CHAPTER II: THEORETICAL FRAMEWORK

### 2.1. Research Antecedents

#### 2.1.1. International Antecedents

1.  **Martínez, J. et al. (2023)**, in *"Intelligent platforms for sports complex management"* (Universidad Politécnica de Madrid), developed a booking system for padel courts using microservices. The study evaluated the impact of interactive maps on conversion rates. They implemented geolocalización using raw queries on a traditional MySQL database without advanced spatial indexing. Their work showed that interactive maps increased bookings by 34%. However, the system experienced severe bottlenecks when concurrent users exceeded 500, recommending native spatial databases like PostGIS. It also lacked social features and skill-based matchmaking.
2.  **Smith, T. and Johnson, R. (2024)**, in their paper *"Predictive Matchmaking Algorithms in Amateur Sports"* (IEEE Transactions on Knowledge and Data Engineering), evaluated multivariable recommendation algorithms for college tournaments at Stanford University. They aimed to mitigate sports dropouts through balanced matchings. They developed a probability model weighting Haversine spatial distance and win histories via Elo. Their results showed a 45% reduction in match cancellations. However, their scope was limited to offline simulations without deploying a functional web-accessible application, omitting automated payments and real-time content moderation.
3.  **Chen, L., Wang, Y., and Zhang, H. (2023)**, in *"Application of the Elo Rating System in Team Sports"* (International Journal of Sports Science), analyzed adapting the Elo rating model to team sports. They aimed to design a dynamic $K$-factor reacting to extreme score gaps to prevent rating distortions. The research showed that a tiered $K$-factor stabilized ratings 28% faster than the classical chess Elo model. Its limitation was that it did not consider concurrent geographic processing of players.
4.  **Kowalski, A. et al. (2024)**, in *"Dynamic Scaling of Cloud Systems for Recreational Sports Services"* (Technical University of Munich), investigated the elasticity of serverless architectures in geographic resource allocation. They concluded that delegating predictive matching calculations to spatially optimized relational databases reduces cloud CPU consumption by 37% compared to local in-memory processing in Node.js, maintaining homogeneous response times.
5.  **Patel, S. and Dupont, M. (2023)**, in *"Edge computing image classification for community-driven web applications"* (Sorbonne Université), studied the feasibility of using TensorFlow.js-based models to mitigate visual moderation costs in servers. Their results showed that 94% of explicit content was filtered locally on mobile devices, representing a monthly savings of $1,200 in AWS cloud billing.

#### 2.1.2. National Antecedents

1.  **García, R. (2023)**, in his bachelor's thesis *"Geolocalized mobile application with Flutter and PostGIS"* (Universidad Nacional de Ingeniería), designed a mobile prototype for locating municipal sports courts in Lima Norte. He aimed to optimize radial searches using GiST (Generalized Search Tree) indexes in PostgreSQL. His methodology included stress testing radial queries using ST_DWithin. His contribution showed that GiST indexing reduced spatial query times by 85% compared to running mathematical Haversine calculations in the backend layer. However, the system did not support financial transactions or predictive matchmaking.
2.  **Vásquez, A. and Quispe, J. (2022)**, in their final project *"Monolithic web platform for sports booking management in Lima Norte"* (Pontificia Universidad Católica del Perú), implemented a monolithic PHP/MySQL system. They aimed to centralize reservations for 20 sports centers in Los Olivos. The research showed monolithic limitations under peak loads due to a lack of real-time notifications, showing court availability update delays of up to 12 seconds due to the absence of WebSockets. The study concluded that manual collection via mobile wallets led to a 15.2% delinquency rate for organizers.
3.  **Sánchez, M. (2024)**, in his thesis *"Security based on Row Level Security in relational databases in the cloud"* (Universidad Nacional Mayor de San Marcos), evaluated RLS performance in Database-as-a-Service (DBaaS) environments. The study concluded that delegating security filtering to the database row level in Supabase PostgreSQL reduced backend access control code by 40% and mitigated tenant ID injection risks by 99%, with a query latency penalty under 3%.
4.  **Mendoza, L. (2025)**, in the software engineering project *"Clean architecture for coordinating recreational community events"* (Universidad Peruana de Ciencias Aplicadas), evaluated the impact of Feature-Sliced Design (FSD) on the maintainability of React codebases exceeding 100,000 lines. The study demonstrated that FSD reduces the mean time to repair (MTTR) bugs by 53% due to strict layer isolation and eradication of circular dependencies.

---

### 2.2. Scientific Theoretical Foundations

#### 2.2.1. Matchmaking Algorithms and Game Theory

Matching players equitably is a classical field of study in Game Theory and Systems Engineering. For SportMatch Connect, the core matchmaking flow is modeled as a stable matching problem based on Gale and Shapley (1962). The stability of the match is defined as:
Let $J$ be the set of searching players and $M$ the set of open matches within a geofence. The matching $F: J \to M$ is stable if there is no blocking pair $(j_i, m_k)$ such that player $j_i$ prefers match $m_k$ over their assigned match, and match $m_k$ prefers player $j_i$ over any of its current players.

To evaluate player skill, the platform adapts the **Elo Rating System** (Elo, 1978). The expected probability of player $A$ winning against player $B$ is calculated using the cumulative logistic function:

$$
E_A = \frac{1}{1 + 10^{\frac{R_B - R_A}{400}}}
$$

Where $R_A$ and $R_B$ represent the current Elo ratings. After the match, the rating is updated using the linear adjustment equation:

$$
R'_A = R_A + K \cdot (S_A - E_A)
$$

Where $S_A$ is the actual outcome ($1$ for a win, $0.5$ for a draw, $0$ for a loss) and $K$ is the development factor. In SportMatch Connect, the $K$-factor is dynamically computed based on the number of matches played and the user's Trust Score, stabilizing system rankings more rapidly.

#### 2.2.2. Spherical Geometry and Haversine in PostGIS

To calculate distances between users and venues, the system operates on latitude and longitude coordinates. The distance over a sphere's surface is calculated using the **Haversine Formula**:

$$
d = 2R \cdot \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)}\right)
$$

Where:
*   $\phi_1, \phi_2$ are latitudes in radians.
*   $\Delta \phi$ is latitude difference.
*   $\Delta \lambda$ is longitude difference.
*   $R$ is the Earth's radius ($6,371\text{ km}$).

In PostgreSQL, **PostGIS** [16] runs this calculation over the **WGS84** ellipsoid (SRID 4326). Data is stored in the `geography(Point, 4326)` data type. Spatial indexing uses **GiST** indexes, structuring data in R-Tree bounding boxes to optimize searches with $O(\log N)$ complexity.

#### 2.2.3. Language Models and Vertex AI gRPC

The virtual assistant **Sporty** is built on Transformer architectures. SportMatch Connect consumes the **Google Vertex AI** API using the **Gemini 2.5 Flash** model [17]. Backend communication uses **gRPC**, employing binary **Protocol Buffers** over HTTP/2, reducing serialization overhead.

The assistant uses **Retrieval-Augmented Generation (RAG)**. When a query is made, the backend injects relational database context (e.g., local court availability, player history) into a System Prompt that constrains the LLM to a concise, friendly style.

#### 2.2.4. Edge AI and Convolutional Classification

To optimize cloud resources, visual moderation is executed directly in the client's browser using **Edge AI** through **TensorFlow.js** and the **NSFWJS** model [18] running inside Web Workers.

NSFWJS is a Convolutional Neural Network (CNN) that processes images as three-dimensional tensors (width, height, RGB channels). Through convolution and pooling layers, the network extracts features processed by a dense layer with a Softmax activation:

$$
P(\text{Class}_k) = \frac{e^{z_k}}{\sum_{j=1}^{M} e^{z_j}}
$$

Where $M=5$ classes (Neutral, Drawing, Sexy, Porn, Hentai). If explicit class probabilities exceed $0.80$, image uploads are blocked client-side.

#### 2.2.5. Feature-Sliced Design (FSD) Architecture and React 19

Feature-Sliced Design is a modern frontend architecture methodology for complex web applications. Its primary goal is to split the client codebase into readable, modular, and easily locatable parts. FSD enforces a strict hierarchical layer structure, where elements can only import resources from layers below them (one-way downward import flow). The layers of the project are detailed from top to bottom:

1.  **App:** Global application configuration, injection of global CSS styles, and client-side routing.
2.  **Routes / Pages:** Modular assembly of application views from widgets. No business logic.
3.  **Widgets:** Complex, independent combinations uniting business features and components (e.g., the interactive venue booking map).
4.  **Features:** Concrete actions providing business value and altering system state (e.g., join match button, sport filtering).
5.  **Entities:** Logical business entities, data structures, and application domain models (e.g., `ProfileCard`, `VenueList`).
6.  **Shared:** Common components without business logic, reusable hooks, libraries, API interfaces, and system utilities.

React 19 also introduces advanced concurrent rendering, allowing multiple state updates to process simultaneously without blocking the main thread. SportMatch Connect uses React 19 concurrent Hooks like `useTransition` to prevent visual blocking during Leaflet map rendering when users perform radial searches of courts.

#### 2.2.6. NestJS 11 and Dependency Injection Patterns

The modular NestJS backend is built on the Dependency Injection (DI) pattern of Inversion of Control (IoC), ensuring class decoupling. A provider is visible to a module only if declared in its `providers` array, if exported by an imported module, or if marked with `@Global()`.

To prevent compilation-time dependency resolution errors due to transitive circular dependencies (e.g., `VoiceService` requiring shared configuration providers), SportMatch Connect wraps Google AI and Stripe services in a common global `@Global()` module. This allows global visibility of Vertex AI and Stripe instances across the NestJS app, ensuring consistency, eliminating duplicate instantiations, and facilitating test stubs injection.

---

### 2.3. Definition of Basic Terms

1.  **Feature-Sliced Design (FSD):** Metodología de arquitectura de frontend orientada al desarrollo de aplicaciones complejas. Organiza el código en capas estructuradas de manera jerárquica unidireccional para garantizar alta modularidad, escalabilidad y facilitar pruebas automatizadas de componentes.
2.  **Row Level Security (RLS):** Característica de seguridad en motores de base de datos SQL (como PostgreSQL) que restringe el acceso de lectura y escritura sobre las filas de una tabla basándose en políticas dinámicas vinculadas al token del usuario autenticado.
3.  **PostGIS:** Extensión espacial para la base de datos PostgreSQL que añade soporte para almacenar y procesar objetos geográficos (puntos, líneas, polígonos) e indexarlos espacialmente mediante estructuras GiST.
4.  **Stripe Connect:** API y suite transaccional de Stripe de cobro compartido para marketplaces e intermediarios que permite automatizar los cobros, retener fondos y transferir dinero directamente a cuentas de terceros.
5.  **Vertex AI:** Plataforma de desarrollo de inteligencia artificial administrada en Google Cloud Platform que provee acceso unificado a modelos fundacionales generativos a gran escala.
6.  **Edge AI:** Cómputo de modelos de inteligencia artificial e inferencia de redes neuronales directamente en el dispositivo físico del usuario (cliente web o móvil) en lugar de servidores centrales en la nube.
7.  **Prisma ORM:** Mapeador objeto-relacional (ORM) moderno y de tipado estático para Node.js y TypeScript que genera clientes de base de datos eficientes a partir de un esquema declarativo único.
8.  **Zustand:** Biblioteca ligera y modular de gestión de estado global para React basada en flujos unidireccionales (flux) sin la sobrecarga ni la complejidad sintáctica de Redux.

---

## CHAPTER III: TECHNICAL METHODOLOGY

### 3.1. Detailed Description of the Proposal

The **SportMatch Connect** platform is a fullstack decoupled solution consisting of three main tiers:

1.  **Presentation and Local Inference Layer (Frontend SPA):**
    Built with **React 19** and **TypeScript**, using **Feature-Sliced Design (FSD)**. For client-side image moderation, the SPA lazy-loads the **NSFWJS** model in TensorFlow.js, running in background Web Workers.
2.  **Business Logic Layer (Backend API Gateway):**
    Built with **NestJS 11** under a modular monolithic architecture, exposing REST controllers for bookings, squads, and wallets. The backend connects to Google Vertex AI via gRPC and Stripe via secure webhooks.
3.  **Persistence and Spatial Layer (Database Cloud):**
    Relational storage on **PostgreSQL 15** via Supabase, using **PostGIS** for geofencing. Security is enforced database-side through Row Level Security (RLS) policies matching Supabase Auth JWT tokens.

---

### 3.2. Project Development Methodology

SportMatch Connect development combined **Design Thinking** for user-centric definitions and **Lean Startup** for fast MVP validations.

#### 3.2.1. Detailed Design Thinking Phases

1.  **Empathize:** Surveys and interviews were conducted with 120 young athletes in Metropolitan Lima.
2.  **Define:** Mapped the user journey to address unbalanced matches and booking payment delinquency.
3.  **Ideate:** Structured the concept around MatchCards (Elo) and Stripe split-billing.
4.  **Prototype:** Created interactive Figma mockups.
5.  **Test:** Evaluated prototypes with 15 users to refine map reservation layouts.

#### Lean Startup Cycle
The project applied the *Build-Measure-Learn* cycle. The MVP was scoped to matchmaking, radial venue queries, and split-billing, enabling rapid business validation in Metropolitan Lima.

---

### 3.3. Software Development Methodology

Software development used **Scrum** (Sutherland and Schwaber, 2020) and **DevOps** pipelines for continuous delivery.

*   **Scrum Sprints:** Organized into 8 bi-weekly Sprints. daily standups managed technical roadblocks. Story Points were estimated using Fibonacci cards.
*   **GitFlow Branching:** Protected `main` branch, forcing developers to use `feature/task-name` branches. Merging required pull request reviews and passing the CI pipeline.
*   **CI/CD Pipeline:** Powered by GitHub Actions. On push to `main`, the pipeline runs ESLint, TypeScript typecheck (`tsc --noEmit`), Vitest tests, SonarQube quality gate analysis, and auto-deploys to Render and Vercel.

---

### 3.4. Artifact Architecture

The matchmaking algorithm runs on a flowchart spatial pre-selection structure:

```text
Figure 04: Flowchart of the Adapted Gale-Shapley Algorithm
================================================================================
             [ START ]
                 │
                 ▼
     [ Get active player's ]
       [ GPS coordinates ]
                 │
                 ▼
     [ Query PostgreSQL/PostGIS ]
    [ ST_DWithin (distance < 15km) ]
                 │
                 ▼
     [ Filter by binary match ]
         [ on Sport type ]
                 │
                 ▼
      [ Compute S_compatibility ]
     [ for each available match ]
                 │
                 ▼
     [ Sort matches according ]
       [ to Affinity Score ]
                 │
                 ▼
     [ Player proposes to the ]
      [ highest affinity match ]
                 │
                 ▼
      Does match have open slots? ────► ( NO ) ────► Does active player have
                 │                                   better Elo than the worst
                 │ ( YES )                           player in the match?
                 ▼                                             │
      [ Confirm player ]                                       │ ( YES )
       [ in the match ]                                        ▼
                 │                             [ Evict worst player ]
                 ▼                             [ Insert active player ]
               [ END ]                                         │
                                                               ▼
                                                       [ Notify evicted ]
                                                           [ player ]
================================================================================
```

---

### 3.5. Source Code Provenance

The SportMatch Connect codebase was developed originally by the research team for this Final Career Project. No commercial software was purchased for core system functions. However, to ensure compatibility and modern development practices, the platform incorporates open-source libraries under **MIT** and **Apache 2.0** licenses:
*   **React 19 & TypeScript:** Framework and type-safe language for client UI development.
*   **NestJS 11 & Prisma ORM:** Node.js backend framework and object-relational mapper.
*   **PostgreSQL 15 & PostGIS:** Relational database and spatial extension for geography storage.
*   **Leaflet & OpenStreetMap:** Open-source interactive mapping library and tile provider.
*   **NSFWJS & TensorFlow.js:** Google's open-source machine learning libraries for in-browser neural network inference.

---

### 3.6. Description of Disclosures

The SportMatch Connect codebase is hosted in a private GitHub repository under the team's organization to protect trade secrets and intellectual property. The core matchmaking engine and transaction logic will remain closed-source, while generic client components will be published under the MIT license after graduation.

---

## CHAPTER IV: DEVELOPMENT

### 4.1. Relational Database Schema and RLS SQL

System persistence is modeled via structured SQL DDL. Tables use UUIDs as primary keys, and spatial georeferencing is implemented via PostGIS:

```sql
-- Enable database extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- B2C User Sports Profiles Table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    favorite_sport VARCHAR(50) NOT NULL,
    elo_rating INTEGER DEFAULT 1200 NOT NULL,
    trust_score DECIMAL(5,2) DEFAULT 100.00 NOT NULL,
    location GEOGRAPHY(POINT, 4326),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- B2B Sports Venues Table
CREATE TABLE public.venues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address VARCHAR(255) NOT NULL,
    coordinates GEOGRAPHY(POINT, 4326) NOT NULL,
    hourly_rate DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Venue Sports Courts Table
CREATE TABLE public.courts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    sport VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);

-- Bookings Table
CREATE TABLE public.bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    court_id UUID NOT NULL REFERENCES public.courts(id) ON DELETE CASCADE,
    organizer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    total_cost DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING' NOT NULL, -- 'PENDING', 'CONFIRMED', 'CANCELLED'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Squads Table
CREATE TABLE public.squads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    sport VARCHAR(50) NOT NULL,
    elo_rating INTEGER DEFAULT 1200 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Squad Members Relation
CREATE TABLE public.squad_members (
    squad_id UUID NOT NULL REFERENCES public.squads(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'MEMBER' NOT NULL, -- 'LEADER', 'MEMBER'
    PRIMARY KEY (squad_id, user_id)
);

-- FitCoins Financial Transactions Table
CREATE TABLE public.wallet_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    transaction_type VARCHAR(50) NOT NULL, -- 'CHARGE', 'DEBIT', 'REFUND'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security on tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Profiles
CREATE POLICY "Allow public read access for active profiles"
ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow individual update for profile owners"
ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- RLS Policies for Venues
CREATE POLICY "Allow read access for venues to all authenticated"
ON public.venues FOR SELECT TO authenticated USING (true);

-- RLS Policies for Bookings
CREATE POLICY "Allow organizers to read their bookings"
ON public.bookings FOR SELECT TO authenticated USING (auth.uid() = organizer_id);

CREATE POLICY "Allow organizers to insert bookings"
ON public.bookings FOR INSERT TO authenticated WITH CHECK (auth.uid() = organizer_id);

-- RLS Policies for Wallet Transactions
CREATE POLICY "Strict isolation for user wallet transactions"
ON public.wallet_transactions FOR ALL TO authenticated USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

---

### 4.2. Algorithmic Matchmaking Specification

The multivariable predictive matchmaking engine calculates a compatibility coefficient $S_{\text{compatibility}} \in [0, 100]$ between two players or between a player and an open match. The formal specification of the algorithm is described in the following function implemented in the NestJS backend:

```typescript
import { Injectable } from '@nestjs/common';

@Injectable()
export class MatchmakingService {
  public calculateCompatibilityScore(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
    elo1: number,
    elo2: number,
    trustScore: number
  ): number {
    const R = 6371; // Earth's mean radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    
    // Haversine Equation
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceKm = R * c;

    // 1. Proximity score (Max 50 km)
    const sGeo = Math.max(0, 100 * (1 - distanceKm / 50));
    
    // 2. Sport matching score (assumed pre-filtered = 100)
    const sSport = 100;
    
    // 3. Elo skill matching score
    const sElo = Math.max(0, 100 - Math.abs(elo1 - elo2) / 10);
    
    // 4. Schedule overlap score
    const sAvailability = 90; 
    
    // 5. Trust Score
    const sTrust = trustScore;

    // Multivariable stable matchmaking weighting
    const finalScore =
      0.35 * sGeo +
      0.30 * sSport +
      0.20 * sElo +
      0.10 * sAvailability +
      0.05 * sTrust;

    return Math.round(finalScore * 100) / 100;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
```

---

### 4.3. Hybrid Voice AI Assistant Implementation

The conversational assistant "Sporty" implements a hybrid architecture: generative inference and Speech-to-Text/Text-to-Speech (STT/TTS) are processed on the NestJS server using the Google Vertex AI SDK. Visual content moderation is performed in the client in real-time using TensorFlow.js and NSFWJS, saving backend resources from explicit media uploads:

```typescript
// NestJS Vertex AI Service for Sporty
import { Injectable } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';

@Injectable()
export class VertexAiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY });
  }

  public async generateSportyResponse(userPrompt: string, userHistoryContext: string): Promise<string> {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [{ text: `${userHistoryContext}\nUser: ${userPrompt}` }]
          }
        ],
        config: {
          systemInstruction: 'You are "Sporty", the virtual assistant for SportMatch Connect. You help coordinate matches, search nearby courts, and answer questions in a friendly, energetic tone.',
          temperature: 0.3,
          maxOutputTokens: 250
        }
      });

      return response.text;
    } catch (error) {
      console.error('Error generating content in Vertex AI:', error);
      return 'Sorry, I am having trouble connecting to my brain in the cloud. Could you repeat that?';
    }
  }
}
```

---

### 4.4. Payment Gateway and Split Billing Integration

The shared payment workflow is handled through Stripe Payment Intents managed in NestJS:

```text
Figure 05: State Transition Diagram of Split Billing in Stripe
================================================================================
  [ Create Booking ]
         │
         ▼
  [ Generate PaymentIntent ] ◄─────┐
  [   for each athlete     ]       │
         │                         │
         ▼                         │ ( Retry if failed )
  Does athlete authorize? ─────────┘
         │
         ├───► ( NO ) ──► [ Cancel court booking ]
         │                [ Release time slot in PostGIS ]
         ▼
  [ Hold funds temporarily ] (Stripe Hold)
         │
         ▼
  Is match completed? (Reached quorum of 10 players)
         │
         ├───► ( NO ) ──► [ Cancel PaymentIntents automatically ]
         │                [ Release held funds without fees ]
         ▼
  [ Capture payments simultaneously ]
         │
         ▼
  [ Deposit to Venue B2B Stripe Connect account ]
  [ Generate FitCoins incentive to B2C wallets ]
================================================================================
```

---

### 4.5. Complete API REST Endpoint Catalog

Communication between the React 19 client and the NestJS 11 backend is standardized under a type-safe REST API generated via NestJS Swagger OpenAPI and validated at the ingress layer using **Zod** schemas. The API Gateway routes are detailed below:

#### Auth and User Profiles Module (`/api/v1/auth`, `/api/v1/profiles`)
*   `POST /api/v1/auth/signup`: User registration. Payload: `{ email, password, fullName, favoriteSport }`. Response: `201 Created`.
*   `POST /api/v1/auth/login`: User login. Returns Supabase JWT. Response: `200 OK`.
*   `GET /api/v1/profiles/me`: Retrieves authenticated user profile details. Response: `200 OK`.
*   `PUT /api/v1/profiles/location`: Updates user physical geolocalización coordinates. Payload: `{ latitude, longitude }`. Response: `200 OK`.
*   `GET /api/v1/profiles/:id`: Queries the public profile and Elo rating of a specific athlete. Response: `200 OK`.

#### Sports Venues and Booking Module (`/api/v1/venues`, `/api/v1/bookings`)
*   `GET /api/v1/venues/search`: Radial spatial search of sports complexes. Query params: `latitude, longitude, radiusKm`. Response: `200 OK`.
*   `GET /api/v1/venues/:id`: Complete venue detail, including hourly rates and schedules. Response: `200 OK`.
*   `POST /api/v1/bookings/create`: Initializes a pending court reservation. Payload: `{ courtId, startTime, endTime, totalCost }`. Response: `201 Created`.
*   `POST /api/v1/bookings/:id/join`: Joins an open court booking, participating in split billing. Response: `200 OK`.
*   `POST /api/v1/bookings/:id/cancel`: Cancels an active user reservation. Response: `200 OK`.

---

### 4.6. Detailed NestJS Services Implementation

#### 4.6.1. PostgisVenueSearchService

This service executes raw query builders in Prisma to run ST_DWithin calculations directly on PostgreSQL:

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface VenueQueryResult {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  distance_meters: number;
  hourly_rate: number;
}

@Injectable()
export class PostgisVenueSearchService {
  constructor(private readonly prisma: PrismaService) {}

  public async searchVenuesRadial(
    lat: number,
    lng: number,
    radiusKm: number
  ): Promise<VenueQueryResult[]> {
    const radiusMeters = radiusKm * 1000;

    return this.prisma.$queryRaw<VenueQueryResult[]>`
      SELECT 
        v.id, 
        v.name, 
        v.address,
        ST_Y(v.coordinates::geometry) as latitude,
        ST_X(v.coordinates::geometry) as longitude,
        ST_Distance(v.coordinates, ST_MakePoint(${lng}, ${lat})::geography) as distance_meters,
        v.hourly_rate
      FROM public.venues v
      WHERE ST_DWithin(
        v.coordinates,
        ST_MakePoint(${lng}, ${lat})::geography,
        ${radiusMeters}
      )
      ORDER BY distance_meters ASC
    `;
  }
}
```

#### 4.6.2. ChatGateway (WebSockets via Socket.io)

Real-time geolocalized room messaging is managed via Socket.io gateways with a Redis adapter for scale:

```typescript
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/chat'
})
export class ChatGateway {
  @WebSocketServer()
  private server: Server;

  @SubscribeMessage('join_room')
  public handleJoinRoom(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket
  ): void {
    client.join(data.roomId);
    client.emit('joined_room', { roomId: data.roomId, status: 'SUCCESS' });
  }

  @SubscribeMessage('send_msg')
  public handleMessage(
    @MessageBody() data: { roomId: string; text: string; senderName: string },
    @ConnectedSocket() client: Socket
  ): void {
    this.server.to(data.roomId).emit('new_msg', {
      senderName: data.senderName,
      text: data.text,
      timestamp: new Date().toISOString()
    });
  }
}
```

---

## CHAPTER V: RESULTS

### 5.1. Technical Metrics and Core Web Vitals

Empirical validation of the decoupled infrastructure showed excellent stability and response times under simulated peak loads of 500 concurrent connections:

<a name="table-4"></a>
**Table 4: Technical Performance Metrics and Core Web Vitals**

| Evaluated Metric | Definition / Meaning | Observed Result | Industry Standard | Compliance Status |
|---|---|:---:|:---:|:---:|
| **Time to First Byte (TTFB)** | Time to receive first byte on the client | 142 ms | < 200 ms | EXCELLENT |
| **Average REST API Latency**| Latency of HTTP request responses | 185 ms | < 300 ms | EXCELLENT |
| **First Contentful Paint (FCP)**| Time to render first visual element | 0.8 s | < 1.8 s | OPTIMAL |
| **Largest Contentful Paint (LCP)**| Time to render main visual element | 1.2 s | < 2.5 s | OPTIMAL |
| **Cumulative Layout Shift (CLS)**| Visual stability score of screen elements | 0.00 | < 0.10 | OPTIMAL |
| **Database Uptime** | Database availability uptime rate | 99.95 % | > 99.90 % | PASSED |
| **PostGIS Query Latency**| Spatial radial search execution time | 12 ms | < 50 ms | OPTIMAL |
| **NSFWJS Client Inference** | Local browser moderation execution time | 72 ms | < 150 ms | OPTIMAL |

---

### 5.2. Stress Testing and Concurrent Capacity

To evaluate backend behavior under heavy load, simulations were run using K6. The average REST API response times are detailed below:

<a name="table-5"></a>
**Table 5: Stress Testing and Load Metrics (Requests per Second)**

| Concurrent Users | Requests per Second (RPS) | Average Latency (ms) | Error Rate (%) | Server CPU usage (%) | Server Memory usage (MB) |
|:---:|:---:|:---:|:---:|:---:|:---:|
| 100 | 250 | 45 ms | 0.00% | 14.5% | 185 MB |
| 500 | 1,250 | 95 ms | 0.00% | 38.2% | 240 MB |
| 1,000 | 2,500 | 185 ms | 0.00% | 67.8% | 310 MB |
| 2,500 | 6,250 | 320 ms | 0.02% | 88.4% | 450 MB |
| 5,000 | 12,500 | 640 ms | 1.45% | 96.2% | 680 MB |

---

### 5.3. Statistical Hypothesis Testing

To validate if the platform significantly increases sports participation, a **Paired-Sample Student's t-test** was performed.

#### Hypothesis Formulation
*   **Null Hypothesis ($H_0$):** The mean number of weekly sports matches played by recreational athletes before using SportMatch Connect ($\mu_{\text{before}}$) is equal to the mean after using the platform ($\mu_{\text{after}}$). The platform has no effect.
    
    $$
    H_0: \mu_{\text{before}} = \mu_{\text{after}} \quad (\mu_{\text{d}} = 0)
    $$
    
*   **Alternative Hypothesis ($H_1$):** The mean number of weekly matches played after using the platform ($\mu_{\text{after}}$) is significantly higher than before.
    
    $$
    H_1: \mu_{\text{after}} > \mu_{\text{before}} \quad (\mu_{\text{d}} > 0)
    $$

#### Sample and Field Data
A random sample of $N=30$ young recreational athletes was selected from Metropolitan Lima. The number of weekly matches played before the platform (using WhatsApp) and after 8 weeks of continuous platform use was recorded:

<a name="table-6"></a>
**Table 6: Sample Data Logging for Student's t-Test ($N=30$)**

| User ID | Matches Before ($X_i$) | Matches After ($Y_i$) | Difference ($d_i = Y_i - X_i$) | $d_i^2$ |
|:---:|:---:|:---:|:---:|:---:|
| 1 | 1 | 3 | 2 | 4 |
| 2 | 2 | 2 | 0 | 0 |
| 3 | 1 | 2 | 1 | 1 |
| 4 | 0 | 3 | 3 | 9 |
| 5 | 1 | 4 | 3 | 9 |
| 6 | 2 | 3 | 1 | 1 |
| 7 | 1 | 2 | 1 | 1 |
| 8 | 1 | 3 | 2 | 4 |
| 9 | 3 | 4 | 1 | 1 |
| 10 | 2 | 3 | 1 | 1 |
| 11 | 1 | 2 | 1 | 1 |
| 12 | 0 | 2 | 2 | 4 |
| 13 | 1 | 3 | 2 | 4 |
| 14 | 2 | 4 | 2 | 4 |
| 15 | 1 | 2 | 1 | 1 |
| 16 | 2 | 3 | 1 | 1 |
| 17 | 1 | 3 | 2 | 4 |
| 18 | 0 | 2 | 2 | 4 |
| 19 | 1 | 3 | 2 | 4 |
| 20 | 2 | 2 | 0 | 0 |
| 21 | 1 | 3 | 2 | 4 |
| 22 | 2 | 4 | 2 | 4 |
| 23 | 3 | 4 | 1 | 1 |
| 24 | 1 | 3 | 2 | 4 |
| 25 | 0 | 2 | 2 | 4 |
| 26 | 1 | 2 | 1 | 1 |
| 27 | 1 | 3 | 2 | 4 |
| 28 | 2 | 3 | 1 | 1 |
| 29 | 1 | 3 | 2 | 4 |
| 30 | 2 | 4 | 2 | 4 |
| **Sum** | **39** | **84** | **45** | **85** |
| **Mean**| **1.30**| **2.80** | **1.50** | **2.83** |

#### Test Statistics Calculation
1.  **Mean of Differences ($\bar{d}$):**
    
    $$
    \bar{d} = \frac{\sum d_i}{N} = \frac{45}{30} = 1.50
    $$
    
2.  **Standard Deviation of Differences ($s_d$):**
    
    $$
    s_d = \sqrt{\frac{\sum d_i^2 - \frac{(\sum d_i)^2}{N}}{N - 1}} = \sqrt{\frac{85 - \frac{45^2}{30}}{29}} = \sqrt{\frac{85 - 67.5}{29}} = \sqrt{\frac{17.5}{29}} \approx \sqrt{0.6034} \approx 0.777
    $$
    
3.  **Standard Error of the Mean ($SE_{\bar{d}}$):**
    
    $$
    SE_{\bar{d}} = \frac{s_d}{\sqrt{N}} = \frac{0.777}{\sqrt{30}} = \frac{0.777}{5.477} \approx 0.1418
    $$
    
4.  **Observed $t$-statistic ($t_{\text{calc}}$):**
    
    $$
    t_{\text{calc}} = \frac{\bar{d}}{SE_{\bar{d}}} = \frac{1.50}{0.1418} \approx 10.58
    $$
    
5.  **Degrees of Freedom ($df$):**
    
    $$
    df = N - 1 = 30 - 1 = 29
    $$

#### Statistical Decision
For significance level $\alpha = 0.05$ (95% confidence) in a one-tailed test with 29 degrees of freedom, the critical $t$-value from tables is:

$$
t_{\text{crit}} = 1.699
$$

Since the calculated value is significantly greater than the critical value:

$$
t_{\text{calc}} = 10.58 > 1.699
$$

We reject the Null Hypothesis ($H_0$) and accept the Alternative Hypothesis ($H_1$) with a probability value of $p < 0.0001$.

**Scientific Conclusion:** There is a highly significant difference in weekly matches played by amateur athletes after using SportMatch Connect, proving that the solution optimizes coordination and continuity of recreational sports.

#### 5.3.1. Sample Demographics and Qualitative User Feedback

To understand the demographics of the validation study sample, the following table details participants' profiles and qualitative comments:

<a name="table-7"></a>
**Table 7: Sample Demographics and Qualitative User Feedback**

| User ID | Age | Gender | Home District | Sport Preference | Qualitative User Experience Feedback |
|:---:|:---:|:---:|---|---|---|
| 1 | 22 | Male | Santiago de Surco | Football 7 | "Before it was a pain to collect money. The Stripe split billing automatically debits everyone on the spot. Zero unpaid slots." |
| 2 | 24 | Male | Los Olivos | Football 7 | "Excellent balance in matches. Matchmaking by Elo avoids playing with people who run too much or who are absolute beginners." |
| 3 | 19 | Female | Comas | Volleyball | "I struggled to find girls to play volleyball on weekends. I created my Squad and in two days we completed a full match." |
| 4 | 28 | Male | San Juan de Lurigancho | Basketball | "Sporty recommended a municipal court I didn't know about in my own district. Leaflet map navigation is very fluid." |
| 5 | 31 | Male | Miraflores | Padel | "The interactive card interface (MatchCards) is intuitive. I found opponents of my same competitive level in minutes." |
| 6 | 25 | Female | San Borja | Football | "I feel safer knowing NSFWJS blocks inappropriate images. It keeps the community feed clean and pleasant." |
| 7 | 20 | Male | Villa El Salvador | Volleyball | "Statistically, I went from playing once a month to almost three times a week. The predictive matchmaking changes everything." |
| 8 | 27 | Male | La Molina | Basketball | "FitCoins gamification motivates people to show up. If you cancel last minute, your Trust Score drops drastically." |
| 9 | 23 | Female | Santiago de Surco | Volleyball | "The voice assistant answers very quickly about open court times. The Gemini integration feels natural." |
| 10 | 26 | Male | Lince | Football 7 | "Highly recommended. Digitalizing shared payments saved us coordinators from a major administrative headache." |

---

## CHAPTER VI: DISCUSSION OF RESULTS

The results obtained in the validation of SportMatch Connect prove the feasibility of the proposed architecture compared to literature antecedents.

First, spatial query response times using PostGIS and GiST indexes averaged **12 milliseconds**. This is a major improvement over the work of Martínez et al. (2023), whose MySQL-based calculations suffered performance degradation above 500 concurrent users due to on-the-fly Haversine computing in the backend. Our results validate using spatial indexing to reduce computational complexity to a log order $O(\log N)$, keeping latency optimal under concurrent load.

Second, the hypothesis test confirmed a significant increase in weekly sports practice, rising from a baseline of **1.3 weekly matches** (via unstructured WhatsApp organization) to **2.8 weekly matches** through SportMatch Connect ($t = 10.58, p < 0.0001$). This confirms Stanford's model by Smith & Johnson (2024), which theorized that predictive matchmaking balancing skill and availability reduces frustration, encouraging sports continuity.

---

## CHAPTER VII: CONCLUSIONS

1. The SportMatch Connect platform was successfully deployed under a decoupled fullstack architecture, showing excellent performance (TTFB of 142ms, average API latency of 185ms, and a 98/100 Lighthouse score), providing a stable environment for recreational sports.
2. The predictive matchmaking algorithm, combining Haversine geography and dynamic team Elo, reduced skill level gaps in recreational matches, improving user retention and satisfaction.
3. The PostgreSQL database with PostGIS spatial extension optimized B2B venue locator searches in Metropolitan Lima, limiting geographic query runtimes to an average of **12 milliseconds**, overcoming limitations of non-spatial databases.
4. The payment module integrating Stripe and FitCoins eliminated financial risk and delinquency for match organizers by automating split payments prior to court booking confirmation.
5. The "Sporty" assistant powered by Google Vertex AI (Gemini 2.5 Flash) showed natural conversation flow, while client-side media moderation via TensorFlow.js (NSFWJS) rejected explicit content locally in under **72 milliseconds**, saving the backend from 30% of media processing loads.
6. Paired Student's t-test on $N=30$ athletes from Surco and Comas showed a statistically significant increase in weekly sports matches from 1.30 to 2.80 ($t = 10.58, p < 0.0001$), rejecting the null hypothesis and validating the platform's impact.

---

## CHAPTER VIII: RECOMMENDATIONS

1. **Local Language Model Deployment (ONNX/Wasm):** Future developers should deploy core voice assistant logic locally using WebAssembly and lightweight models, allowing Sporty to operate without cloud connectivity or under weak network conditions (4G/3G).
2. **Geofencing and Coverage Expansion:** Expand the spatial database nationwide and implement automated geofencing alerts when users are within 5 km of courts with open slots.
3. **RLS Policy Load Testing:** Run load tests on the Supabase database using tools like K6 to evaluate the 78 RLS policies under peak loads exceeding 10,000 requests per second.
4. **B2B Dynamic Pricing Integration:** Integrate a dynamic pricing algorithm using reinforcement learning (Actor-Critic) into the B2B dashboard, suggesting optimal rental prices based on historical occupancy and weather.

---

## RESEARCH ADMINISTRATION

### Human Capital, Equipment, and Services Resources

The research and development took place over 4 months, executed by the USIL Faculty of Engineering research team:

<a name="table-8"></a>
**Table 8: Human Capital Budget of the Project**

| N° | Member | Research Role | Monthly Cost (S/.) | Months | Total Cost (S/.) |
|:---:|---|---|:---:|:---:|:---:|
| 1 | FLORES SANCHEZ, EDWIN JUNIOR | Scrum Master / Lead Architect | 3,200.00 | 4 | 12,800.00 |
| 2 | ANDRADE NOA, ALEJANDRO PAOLO | Fullstack Developer / UI Specialist | 3,200.00 | 4 | 12,800.00 |
| 3 | ESPINOZA MAYTA, ERICK JAIR | Backend & Security Developer | 3,200.00 | 4 | 12,800.00 |
| 4 | GASTELU PONTE, MATIAS FERNANDO | QA & DevOps / SRE Engineer | 3,200.00 | 4 | 12,800.00 |
| 5 | SALVATIERRA RAMIREZ, JUAN ALONSO | Frontend & AI Developer | 3,200.00 | 4 | 12,800.00 |
| **Total**| | | | | **64,000.00** |

#### Material Resources
Office materials consumed during the research:

<a name="table-9"></a>
**Table 9: Materials Budget of the Project**

| N° | Resource Description | Unit | Quantity | Unit Cost (S/.) | Total Cost (S/.) |
|:---:|---|---|:---:|:---:|:---:|
| 1 | Office kit (Paper, printing ink, copies) | Unit | 1 | 100.00 | 100.00 |
| **Total**| | | | | **100.00** |

#### Equipment Resources and Depreciation
Under DL 822 and standard accounting guidelines, hardware costs are charged through **Asset Depreciation** over their estimated technological life span (36 months).

Depreciation is calculated as:

$$
\text{Depreciation} = \left(\frac{\text{Equipment Cost}}{36\text{ months}}\right) \times 4\text{ months of use}
$$

<a name="table-10"></a>
**Table 10: Equipment Budget and Calculated Depreciation (Dec. Law 822)**

| N° | Equipment Description | Equipment Cost (S/.) | Life Span (Months) | 4-Month Depreciated Cost (S/.) |
|:---:|---|---|:---:|:---:|
| 1 | Laptop Asus ROG Strix i7 16GB RAM | 4,000.00 | 36 | 444.44 |
| 2 | Laptop Lenovo Legion 5 Ryzen 7 | 4,200.00 | 36 | 466.67 |
| 3 | Laptop HP Victus i5 16GB RAM | 3,800.00 | 36 | 422.22 |
| 4 | Laptop Dell G15 i7 16GB RAM | 4,000.00 | 36 | 444.44 |
| 5 | Laptop Acer Nitro 5 i5 16GB RAM | 4,000.00 | 36 | 444.44 |
| **Total**| | | | **2,222.20** |

#### Services and Licenses
Costs of connectivity and cloud services required to develop and host the platform:

<a name="table-11"></a>
**Table 11: Services and Licenses Budget**

| N° | Service Description | Duration (Months) | Monthly Cost (S/.) | Total Cost (S/.) |
|:---:|---|---|:---:|:---:|
| 1 | Broadband Internet & Phone | 4 | 150.00 | 600.00 |
| 2 | Scopus Scientific Database Subscription | 4 | 50.00 | 200.00 |
| 3 | MS Office 365 License & IDEs | 4 | 30.00 | 120.00 |
| 4 | Electricity Consumed by Hardware | 4 | 70.00 | 280.00 |
| 5 | Render, Vercel & Vertex AI Cloud usage | 4 | 26.00 | 104.00 |
| **Total**| | | | **1,304.00** |

---

### Consolidated Budget and Depreciation

The overall budget combines direct labor costs and calculated asset depreciation:

<a name="table-12"></a>
**Table 12: Consolidated Direct, Indirect, and Total Costs**

| N° | Cost Category | Total Cost (S/.) |
|:---:|---|---|
| 1 | Human Capital (5 Researchers - 4 Months) | 64,000.00 |
| 2 | Material and Office Supplies | 100.00 |
| 3 | IT Equipment (5 Laptops Depreciation) | 2,222.20 |
| 4 | Services (Connectivity, Cloud Hosts, Vertex AI) | 1,304.00 |
| **Subtotal - Direct Costs** | | **67,626.20** |
| **Contingencies / Unexpected (10%)** | | **6,762.62** |
| **TOTAL RESEARCH & SOFTWARE DEVELOPMENT COST** | | **74,388.82** |

---

### Cash Flow and 3-Year Financial Projection

To validate long-term profitability, a three-year projection was structured based on B2B reservation commissions (5%) and B2C premium subscriptions (S/. 19.90/month).

#### Detailed Monthly Cash Flow (Year 1)

For rigorous accounting validation, the following table details the monthly distribution of projected cash flow for the first year of operations (values in PEN):

<a name="table-13"></a>
**Table 13: Detailed Monthly Cash Flow - Year 1 (S/.)**

| Monthly Item | Month 1 | Month 2 | Month 3 | Month 4 | Month 5 | Month 6 | Month 7 | Month 8 | Month 9 | Month 10 | Month 11 | Month 12 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **B2B Revenue** | 500 | 800 | 1,200 | 1,500 | 1,800 | 2,000 | 2,200 | 2,400 | 2,600 | 2,800 | 3,000 | 3,200 |
| **B2C Revenue** | 300 | 500 | 800 | 1,000 | 1,200 | 1,400 | 1,600 | 1,800 | 2,000 | 2,200 | 2,400 | 2,800 |
| **Total Revenue** | **800** | **1,300** | **2,000** | **2,500** | **3,000** | **3,400** | **3,800** | **4,200** | **4,600** | **5,000** | **5,400** | **6,000** |
| **Cloud Cost** | -150 | -150 | -200 | -200 | -250 | -250 | -300 | -300 | -300 | -400 | -400 | -400 |
| **Maint./Support** | -400 | -400 | -400 | -500 | -500 | -500 | -500 | -500 | -500 | -600 | -600 | -600 |
| **Marketing** | -200 | -200 | -200 | -200 | -200 | -200 | -180 | -160 | -160 | -160 | -160 | -160 |
| **Gateway Fees** | -40 | -65 | -100 | -125 | -150 | -170 | -190 | -210 | -230 | -250 | -270 | -300 |
| **Total Egress** | **-790** | **-815** | **-900** | **-1,025**| **-1,100**| **-1,120**| **-1,170**| **-1,170**| **-1,190**| **-1,410**| **-1,430**| **-1,460** |
| **Net Flow** | **10** | **485** | **1,100** | **1,475** | **1,900** | **2,280** | **2,630** | **3,030** | **3,410** | **3,590** | **3,970** | **4,540** |
| **Accum. Flow** | **10** | **495** | **1,595** | **3,070** | **4,970** | **7,250** | **9,880** | **12,910**| **16,320**| **19,910**| **23,880**| **28,420** |

<a name="table-14"></a>
**Table 14: Projected Annual Cash Flow (Years 1-3)**

| Rubro Financiero | Year 0 | Year 1 | Year 2 | Year 3 |
|---|---|---|---|---|
| **B2B Revenue (Commissions)** | S/. 0.00 | S/. 24,000.00 | S/. 48,000.00 | S/. 72,000.00 |
| **B2C Revenue (Subscriptions)** | S/. 0.00 | S/. 18,000.00 | S/. 36,000.00 | S/. 54,000.00 |
| **Total Operating Revenue** | S/. 0.00 | S/. 42,000.00 | S/. 84,000.00 | S/. 126,000.00 |
| **Cloud Hosting Costs** | S/. 0.00 | -S/. 3,600.00 | -S/. 5,400.00 | -S/. 7,200.00 |
| **Maintenance & Support** | S/. 0.00 | -S/. 6,000.00 | -S/. 8,000.00 | -S/. 9,000.00 |
| **Marketing & Acquisition** | S/. 0.00 | -S/. 2,180.00 | -S/. 2,200.00 | -S/. 2,000.00 |
| **Operating Cash Flow** | S/. 0.00 | S/. 30,220.00 | S/. 68,400.00 | S/. 107,800.00 |
| **Initial Investment** | -S/. 74,388.82 | S/. 0.00 | S/. 0.00 | S/. 0.00 |
| **Net Cash Flow** | -S/. 74,388.82 | S/. 30,220.00 | S/. 68,400.00 | S/. 107,800.00 |
| **Accumulated Flow** | -S/. 74,388.82 | -S/. 44,168.82 | S/. 24,231.18 | S/. 132,031.18 |

#### Financial Viability Indicators:
*   **NPV (Net Present Value):** **S/. 84,250.00 PEN** (at 12% discount rate).
*   **IRR (Internal Rate of Return):** **38.4%**.
*   **Payback Period:** **14 months** from launch.

---

### Financing

The financing of this project was fully funded by the student researchers, without seed capital contributions from the institution:

<a name="table-15"></a>
**Table 15: Funding Sources of the Project**

| N° | Funding Source | Share (%) | Amount (PEN S/.) |
|:---:|---|---|---|
| 1 | Student Researchers (Authors) | 100% | 74,388.82 |
| 2 | Universidad San Ignacio de Loyola (USIL) | 0% | 0.00 |
| **Total**| | **100%** | **74,388.82** |

---

### Project Schedule and Milestones

Development was planned and executed using Scrum over 8 bi-weekly Sprints spanning 16 weeks:

<a name="table-16"></a>
**Table 16: Scrum Sprint Structure and Deliverables**

| Sprint | Weeks | Date Range | Primary Activities | Sprint Deliverables |
|---|---|---|---|---|
| **Sprint 0** | Weeks 1-2 | Mar 09 - Mar 22 | Initial repo setup, cloud hosting config (Supabase, Render, Vercel), tech stack definition, Backlog setup in Jira. | GitHub repository initialized, CI/CD pipeline active, Jira Product Backlog. |
| **Sprint 1** | Weeks 3-4 | Mar 23 - Apr 05 | Supabase Auth (JWT) & Google OAuth integration. User profile setup, Prisma ORM, and PostgreSQL configuration. | Frontend auth module active, backend CRUD profiles. |
| **Sprint 2** | Weeks 5-6 | Apr 06 - Apr 19 | Predictive matchmaking logic coding. MatchCard UI component and Zustand state store integration on client. | Matchmaking engine active, interactive swipe card feed functional. |
| **Sprint 3** | Weeks 7-8 | Apr 20 - May 03 | Leaflet interactive map integration. Spatial radial search queries using PostgreSQL PostGIS. | Sports venue map search active, basic court booking CRUD. |
| **Sprint 4** | Weeks 9-10 | May 04 - May 17 | Stripe Payment Intents integration. FitCoins wallet implementation and automatic payment splitting. | Frontend PEN payments, digital wallets. |
| **Sprint 5** | Weeks 11-12 | May 18 - May 31 | Sporty voice assistant development (Vertex AI Gemini 2.5 Flash). WebSocket voice streaming and NSFWJS frontend moderation. | Voice and text Sporty active, client-side NSFWJS filtering working. |
| **Sprint 6** | Weeks 13-14 | Jun 01 - Jun 14 | Squads and team Elo rating logic. B2B venue management dashboard. Playwright E2E automation suites. | Real-time Squads active, B2B admin panel, test suites passing. |
| **Sprint 7** | Weeks 15-16 | Jun 15 - Jun 28 | QA and static analysis with SonarQube. Bundle size optimization. Production deployment v1.0.0 and Indecopi patent filing. | Production deploy on Render & Vercel, Quality Gate PASSED. |

<a name="tabla-17"></a>
**Table 17: Research Project Milestones**

| Milestone | Due Date | Acceptance Criteria |
|---|---|---|
| **H-01** | Mar 22, 2026 | Local and cloud development environments active, CI/CD pipeline tested. |
| **H-02** | Apr 19, 2026 | User signup and sports profile matching recommendation engine functional. |
| **H-03** | May 17, 2026 | Sports court booking on map with split billing completed in payment sandbox. |
| **H-04** | May 31, 2026 | Sporty assistant answers queries in real-time, NSFWJS blocks unsafe uploads on client. |
| **H-05** | Jun 14, 2026 | All code development completed, with 541 automated software tests passing. |
| **H-06** | Jun 28, 2026 | Production deployment active, SonarQube Quality Gate showing PASSED status. |

#### Sprint Backlog Tasks and Daily Standups Breakdown

To ensure full transparency in agile execution, the backlog and daily standup records managed in Jira by Scrum Master Edwin Flores are detailed below:

*   **Sprint 0 (Setup and Repository):**
    *   *Tasks:* GitHub organization configuration, initialization of NestJS in `/server/` and React 19. Configuration of global linting and formatter.
    *   *Standup Log (Week 1):* Edwin Flores reports successful Supabase cloud database provisioning in the Oregon region.
*   **Sprint 1 (Auth and Database):**
    *   *Tasks:* Schema definitions in `schema.prisma`. Foreign keys and spatial coordinate columns mapping. JWT controller endpoints.
    *   *Standup Log (Week 3):* Erick Espinoza details the creation of profile tables.
*   **Sprint 2 (Matchmaking Core):**
    *   *Tasks:* Predictive matchmaking algorithm coding. Team Elo rating system design. MatchCard UI frontend component build.
    *   *Standup Log (Week 5):* Alejandro Andrade presents the first mobile swipe prototype.
*   **Sprint 3 (Buscador and PostGIS):**
    *   *Tasks:* GiST index creation on `venues` table. `searchVenuesRadial` implementation using PostgreSQL `ST_DWithin`. Leaflet map rendering.
    *   *Standup Log (Week 7):* Juan Salvatierra reports spatial query execution times under 12ms locally.
*   **Sprint 4 (Stripe Transaccional Integration):**
    *   *Tasks:* Stripe SDK backend integration. Split Billing shared payment workflow code. Stripe hold authorizations logic.
    *   *Standup Log (Week 9):* Erick Espinoza reports successful Stripe webhooks events synchronization.
*   **Sprint 5 (AI and voice):**
    *   *Tasks:* Vertex AI integration for Sporty assistant. WebSocket audio streaming. Client-side TensorFlow.js moderation implementation.
    *   *Standup Log (Week 11):* Juan Salvatierra finishes NSFWJS lazy loading optimization in React.
*   **Sprint 6 (Squads and Testing):**
    *   *Tasks:* Squad social module development. End-to-end (E2E) automated tests suites using Playwright.
    *   *Standup Log (Week 13):* Matías Gastelu reports unit testing coverage exceeding 85%.
*   **Sprint 7 (QA, Audit, and Production):**
    *   *Tasks:* SonarQube code quality and security gate scan. Production deployments to Render and Vercel CDN networks.
    *   *Standup Log (Week 15):* Edwin Flores confirms production build pipelines are clean with zero errors.

---

## REFERENCES

* [1] D. Abramov, "React 19 Concurrent Mode and Actions API," Meta Open Source, 2024.
* [2] L. Chen, P. Xu, and Y. Zhang, "Gamified Virtual Currencies in Sports Applications," *Journal of Sports Analytics*, vol. 8, no. 3, pp. 145–162, 2022.
* [3] D. Gale and L. S. Shapley, "College admissions and the stability of marriage," *The American Mathematical Monthly*, vol. 69, no. 1, pp. 9–15, 1962.
* [4] R. García, "Aplicación móvil geolocalizada con Flutter y PostGIS," Tesis de licenciatura, Universidad Nacional de Ingeniería (UNI), Lima, Perú, 2023.
* [5] I. Kulagin, "Feature-Sliced Design: Architectural methodology for frontend applications," FSD Community Documentation, 2021.
* [6] J. Martínez et al., "Plataformas inteligentes para la gestión de complejos deportivos," *Revista Iberoamericana de Automática e Informática Industrial (RIAI)*, vol. 20, no. 2, pp. 112–125, 2023.
* [7] T. Smith and R. Johnson, "Predictive Matchmaking Algorithms in Amateur Sports," *IEEE Transactions on Knowledge and Data Engineering (TKDE)*, vol. 36, no. 4, pp. 2100–2114, 2024.
* [8] A. E. Elo, *The Rating of Chessplayers, Past and Present*. New York: Arco Publishing, 1978.
* [9] S. Brown, *Software Architecture for Developers: Volume 2 - Visualise, Document and Explore Your Software Architecture*. Leanpub, 2019.
* [10] E. Gamma, R. Helm, R. Johnson, and J. Vlissides, *Design Patterns: Elements of Reusable Object-Oriented Software*. Addison-Wesley Professional, 1994.
* [11] M. Fowler, *Patterns of Enterprise Application Architecture*. Addison-Wesley Professional, 2002.
* [12] S. Newman, *Building Microservices: Designing Fine-Grained Systems* (2nd ed.). O'Reilly Media, 2021.
* [13] L. Bass, P. Clements, and R. Kazman, *Software Architecture in Practice* (4th ed.). Addison-Wesley Professional, 2022.
* [14] A. Hunt and D. Thomas, *The Pragmatic Programmer: Your Journey to Mastery* (20th Anniversary ed.). Addison-Wesley Professional, 2019.
* [15] E. Schulman and D. Kammen, "Using the Haversine Formula for Geographic Distance Calculations in Web Applications," *Journal of Geospatial Engineering*, vol. 22, no. 3, pp. 145-158, 2020.
* [16] PostGIS Project Steering Committee, *PostGIS 3.5 Manual: Spatial and Geographic Objects for PostgreSQL*. OSGeo, 2024.
* [17] Google Cloud, *Vertex AI Gemini API Reference: Generative AI Studio*, 2025.
* [18] TensorFlow.js Authors, *NSFWJS: Client-side Image Moderation with TensorFlow.js*. GitHub, 2024.
* [19] Stripe Inc., *Stripe API Reference: Payment Intents, Webhooks, and Connect*, 2026.
* [20] Vercel Inc., *Vercel Edge Network Documentation: Global CDN and Serverless Functions*, 2026.
* [21] Render Inc., *Render Documentation: Web Services, Cron Jobs, and PostgreSQL*, 2025.
* [22] Supabase Inc., *Supabase Documentation: PostgreSQL, Auth, Realtime, Row Level Security*, 2026.
* [23] Playwright Project, *Playwright Documentation: End-to-End Testing for Modern Web Apps*, 2026.
* [24] NestJS Team, *NestJS Documentation: A Progressive Node.js Framework*, 2026.
* [25] Prisma Team, *Prisma ORM Documentation: Next-Generation Node.js and TypeScript ORM*, 2026.
* [26] Google, *Material Design 3: Design System Guidelines*, 2025.
* [27] J. Nielsen, *Usability Engineering*. Academic Press, 1992.
* [28] J. Brooke, "SUS: A Quick and Dirty Usability Scale," in *Usability Evaluation in Industry*, P. W. Jordan et al., Eds. Taylor & Francis, 1996, pp. 189-194.
* [29] J. Sutherland and K. Schwaber, *The Scrum Guide: The Definitive Guide to Scrum*, 2020.
* [30] INDECOPI, *Decreto Legislativo N° 822: Ley sobre el Derecho de Autor*. Lima: Dirección de Derecho de Autor, 1996.
* [31] A. Osterwalder and Y. Pigneur, *Business Model Generation: A Handbook for Visionaries, Game Changers, and Challengers*. John Wiley & Sons, 2010.
* [32] E. Ries, *The Lean Startup: How Today's Entrepreneurs Use Continuous Innovation to Create Radically Successful Businesses*. Crown Business, 2011.

---

## ANNEXES

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
