# SOFTWARE PATENT, AUTHORSHIP AND EVALUATION REPORT

## **SPORTMATCH CONNECT: AN INTEGRAL SPORTS MATCHMAKING PLATFORM, SOCIAL NETWORK, TOURNAMENT MANAGEMENT AND B2B/B2C MONETIZATION WITH EDGE ARTIFICIAL INTELLIGENCE**

**Technical Document for Intellectual Property and Software Invention Registration before INDECOPI**  
**Universidad San Ignacio de Loyola (USIL) — Faculty of Engineering and Artificial Intelligence**  
**Course:** Final Project of Career III (Block: FC-PREISF10B01N)  
**Advisor:** Ing. Kenny Disney Neira Neira (kenny.neira@usil.pe)  

---

## SOFTWARE PROPOSAL EVALUATION SHEET (According to USIL Template 2025-02)

### 1. GENERAL EVALUATION DATA
- **Objective of the Sheet:** [X] Evaluation of the software invention and development proposal for copyright registration and software patent deposit before Indecopi.
- **Date of Evaluation:** June 28, 2026.
- **Coordinating Dependency:** Faculty of Engineering and Artificial Intelligence / Information Systems Engineering / Software Engineering.
- **USIL Research Line (R. No. 074-2023/G):** Line 2 — Information Technology.

### 2. MEMBERS OF THE RESEARCH TEAM AND AUTHORS
| No. | Code | Full Name | Career | Role in the Invention | Institutional Email |
|---|---|---|---|---|---|
| 1 | 2111716 | FLORES SANCHEZ, EDWIN JUNIOR | INFO SYSTEMS ENG | Scrum Master / Lead Architect | edwin.floress@usil.pe |
| 2 | 2010830 | ANDRADE NOA, ALEJANDRO PAOLO | INFO SYSTEMS ENG | Fullstack Dev / UI Specialist | alejandro.andrade@usil.pe |
| 3 | 2010029 | ESPINOZA MAYTA, ERICK JAIR | SOFTWARE ENG | Backend Developer & Security | erick.espinozam@usil.pe |
| 4 | 2121043 | GASTELU PONTE, MATIAS FERNANDO | INFO SYSTEMS ENG | QA & DevOps Engineer / SRE | matias.gastelu@usil.pe |
| 5 | 2121274 | SALVATIERRA RAMIREZ, JUAN ALONSO | INFO SYSTEMS ENG | Frontend & AI Developer | juan.salvatierra@usil.pe |

---

### 3. TECHNICAL AND DETAILED DESCRIPTION OF THE PROPOSAL (Minimum 250 Words)

SportMatch Connect is a distributed technological solution of multi-layer architecture designed to resolve the logistical, social, and economic fragmentation affecting amateur sports practice in Lima Metropolitana and Latin America. The technical proposal integrates a reactive web client developed in React 19 with TypeScript, strictly organized under the Feature-Sliced Design (FSD) methodology, which establishes unidirectional dependency boundaries between six functional layers (`app`, `routes`, `widgets`, `features`, `entities`, and `shared`), eliminating circular coupling and optimizing rendering via Concurrent Features and Transitions API.

The system's backend was structured as a modular monolith in NestJS 11 with Prisma ORM, linked to a PostgreSQL 15 database managed in Supabase Cloud. The persistence layer incorporates PostGIS spatial extensions for orthodromic distance calculation and 78 Row Level Security (RLS) policies that guarantee tenant isolation and row-level data protection. The invention incorporates four central engines:
1. **Predictive Matchmaking Engine:** Applies a weighted multivariable algorithm ($S_{\text{compatibility}} \in [0, 100]$) that processes Haversine geographic distance, binary sports match, Elo skill similarity, time slot overlap, and audited Trust Score.
2. **Geolocated Sports Social Network:** Provides real-time multimedia feeds, nested comments, custom reactions, team management (Squads), and instant WebSocket messaging via Supabase Realtime.
3. **Booking and Gamified Economy Engine:** Integrates an interactive map based on Leaflet over 433 mapped sports complexes in Lima Metropolitana, automatic payment splitting with the Stripe gateway (PEN currency), and the FitCoins virtual currency.
4. **Edge Conversational Assistant:** Named "Sporty", it is powered by Google Vertex AI (Gemini 2.5 Flash), with bi-directional speech processing (STT/TTS) and a hybrid content moderation pipeline (NSFWJS on the frontend client and Ensemble Model on the NestJS server).

---

### 4. SOURCE CODE ORIGIN AND PREVIOUS DISCLOSURES
- **Source Code Origin:** Developed entirely by the research team during the 2026-I term. The code incorporates open-source libraries under MIT license (React, NestJS, Prisma, Leaflet, TailwindCSS).
- **Disclosures Description:** The source code is hosted and versioned in the public GitHub repository: `https://github.com/jojiz29/sportmatch-connect`.

---

## DESCRIPTIVE MEMORY AND CLAIMS OF SOFTWARE INVENTION

### Claim 1: Multivariable Predictive Matchmaking Algorithm
The distributed algorithmic procedure for predictive matchmaking of amateur athletes is claimed as a software invention, characterized by calculating in real time a weighted compatibility indicator given the geographic coordinates of users $A(\phi_1, \lambda_1)$ and $B(\phi_2, \lambda_2)$:

$$
S_{\text{compatibility}} = 0.35 \cdot S_{\text{closeness}} + 0.30 \cdot S_{\text{sports}} + 0.20 \cdot S_{\text{level}} + 0.10 \cdot S_{\text{availability}} + 0.05 \cdot S_{\text{trust}}
$$

Where $S_{\text{closeness}}$ is obtained through the Haversine orthodromic evaluation exponentially normalized against a maximum radius of 50 kilometers.

### Claim 2: Edge Hybrid Moderation System for Sports Social Networks
The multimedia image moderation architecture is claimed, composed of a first-line filter executed in the client's browser using TensorFlow.js and NSFWJS, which intercepts and discards image uploads with explicit probability $> 0.80$ before consuming network bandwidth, coupled in the second level with an Ensemble model on the NestJS server.

### Claim 3: Relational Schema Definition and RLS Security in PostgreSQL
The persistence model structured in Prisma ORM and secured through Row Level Security (RLS) policies in PostgreSQL is claimed. The following is a representative extract of the SQL policies implemented:

```sql
-- RLS Policy 01: Public read access for active profiles
CREATE POLICY "Allow public read access for active profiles"
ON public.profiles
FOR SELECT
USING (auth.role() = 'authenticated');

-- RLS Policy 02: Exclusive modification by the profile owner
CREATE POLICY "Allow individual update for profile owners"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

-- RLS Policy 03: Tenant isolation of FitCoins wallet transactions
CREATE POLICY "Strict isolation for user wallet transactions"
ON public.wallet_transactions
FOR ALL
USING (auth.uid() = user_id);
```

---

## RESEARCH ADMINISTRATION AND BUDGET (According to Template 251011)

### 1. Human Capital Resources
| No. | Code | Full Name | Career | Role | Description of Functions |
|---|---|---|---|---|---|
| 1 | 2111716 | FLORES SANCHEZ, EDWIN JUNIOR | INFO SYSTEMS ENG | Scrum Master / Architect | Project leadership and software architecture |
| 2 | 2010830 | ANDRADE NOA, ALEJANDRO PAOLO | INFO SYSTEMS ENG | Fullstack Dev / UI Specialist | UI and user experience development |
| 3 | 2010029 | ESPINOZA MAYTA, ERICK JAIR | SOFTWARE ENG | Backend & Security Dev | NestJS, Prisma, and RLS development |
| 4 | 2121043 | GASTELU PONTE, MATIAS FERNANDO | INFO SYSTEMS ENG | QA & DevOps / SRE | Playwright, Vitest, and CI/CD testing |
| 5 | 2121274 | SALVATIERRA RAMIREZ, JUAN ALONSO | INFO SYSTEMS ENG | Frontend & AI Dev | React 19 and Vertex AI development |

### 2. Consolidated Project Budget
| No. | Expense Category | Total Cost (PEN S/.) |
|---|---|---|
| 1 | Development Hardware | S/. 18,500.00 |
| 2 | Infrastructure Cloud (Supabase/Stripe) | S/. 4,200.00 |
| 3 | Academic Research Materials | S/. 1,800.00 |
| 4 | Software Licenses & Dominios | S/. 1,200.00 |
| 5 | Operational Expenses | S/. 3,500.00 |
| **Total** | | **S/. 29,200.00** |
