# SOFTWARE COPYRIGHT, REGISTRATION AND EVALUATION REPORT

## **SPORTMATCH CONNECT: INTEGRAL PLATFORM FOR SPORTS MATCHMAKING, SOCIAL NETWORKING, TOURNAMENT MANAGEMENT, AND B2B/B2C MONETIZATION WITH EDGE ARTIFICIAL INTELLIGENCE**

**Technical Intellectual Property and Software Invention Registration Document for INDECOPI**  
**Universidad San Ignacio de Loyola (USIL) — Faculty of Engineering and Artificial Intelligence**  
**Course:** Final Degree Project III (Section: FC-PREISF10B01N)  
**Faculty Advisor:** Prof. Kenny Disney Neira Neira (kenny.neira@usil.pe)  

---

## SOFTWARE EVALUATION FORM (According to USIL Official Template Ficha de Evaluación Soft. 2025-02.docx)

### 1. GENERAL EVALUATION DATA
- **Objective:** [X] Proposal evaluation for software invention, copyright, and patent registration before INDECOPI.
- **Evaluation Date:** June 28, 2026.
- **Coordinating Department:** Faculty of Engineering and Artificial Intelligence / Information Systems Engineering / Software Engineering.
- **USIL Research Line (R. N° 074-2023/G):** Line 2 — Information Technology.

### 2. RESEARCH TEAM MEMBERS AND AUTHORS
| N° | Code | Full Name | Program | Role in Invention | Institutional Email |
|---|---|---|---|---|---|
| 1 | 2111716 | FLORES SANCHEZ, EDWIN JUNIOR | ING SIST. INFORMACION | Scrum Master / Lead Architect | edwin.floress@usil.pe |
| 2 | 2010830 | ANDRADE NOA, ALEJANDRO PAOLO | ING SIST. INFORMACION | Fullstack Dev / UI Specialist | alejandro.andrade@usil.pe |
| 3 | 2010029 | ESPINOZA MAYTA, ERICK JAIR | ING. SOFTWARE | Backend & Security Dev | erick.espinozam@usil.pe |
| 4 | 2121043 | GASTELU PONTE, MATIAS FERNANDO | ING SIST. INFORMACION | QA & DevOps Engineer / SRE | matias.gastelu@usil.pe |
| 5 | 2121274 | SALVATIERRA RAMIREZ, JUAN ALONSO | ING SIST. INFORMACION | Frontend & AI Specialist | juan.salvatierra@usil.pe |

---

### 3. DETAILED TECHNICAL DESCRIPTION OF THE PROPOSAL (Minimum 250 Words)

SportMatch Connect is a multi-tier distributed technology solution designed to resolve the logistical, social, and economic fragmentation surrounding amateur sports practice in Metropolitan Lima and Latin America. The technical proposal integrates a reactive web client developed in React 19 with TypeScript structured under Feature-Sliced Design (FSD), establishing strict downward dependency boundaries across six layers (`app`, `routes`, `widgets`, `features`, `entities`, and `shared`), eliminating circular couplings while optimizing rendering via Concurrent Features and Transitions API.

The backend service was structured as a modular monolith in NestJS 11 with Prisma ORM connected to a managed Supabase PostgreSQL 15 database. The persistence layer enforces PostGIS spatial indexing for orthodromic distance computation and 78 Row Level Security (RLS) policies ensuring multi-tenant isolation and data protection. The invention incorporates four core engines:
1. **Predictive Matchmaking Engine:** Implements a weighted multivariable algorithm ($S_{\text{compatibility}} \in [0, 100]$) processing Haversine geographical distance, binary sport matching, Elo skill rating similarity, availability overlap, and audited Trust Scores.
2. **Geolocalized Sports Social Network:** Provides real-time multimedia feeds, nested comments, custom reactions, team Squad management, and WebSocket messaging via Supabase Realtime.
3. **Booking Engine & Gamified Economy:** Features an interactive Leaflet map mapping 433 sports complexes in Metropolitan Lima, automated payment splitting via Stripe (PEN), and FitCoins virtual currency.
4. **Edge Conversational Assistant:** Named "Sporty", powered by Google Vertex AI (Gemini 2.5 Flash), providing bidirectional voice processing (STT/TTS) and hybrid moderation (NSFWJS Client Edge AI + Server Ensemble Model).

---

## DESCRIPTIVE MEMORY AND SOFTWARE CLAIMS

### Claim 1: Multivariable Predictive Matchmaking Algorithm
The algorithmic procedure computing real-time compatibility scores between user coordinates $A(\phi_1, \lambda_1)$ and candidate $B(\phi_2, \lambda_2)$ is claimed as a software invention:

$$
S_{\text{compatibility}} = 0.35 \cdot S_{\text{geography}} + 0.30 \cdot S_{\text{sport}} + 0.20 \cdot S_{\text{skill}} + 0.10 \cdot S_{\text{availability}} + 0.05 \cdot S_{\text{trust}}
$$

Where geographical distance $d$ is evaluated via orthodromic Haversine equations normalized across a 50 km radius.

### Claim 2: Hybrid Edge AI Moderation System for Sports Media Feeds
A multi-stage image content moderation architecture is claimed, comprising client-side local evaluation using TensorFlow.js and NSFWJS to block explicit uploads prior to network transmission, coupled with a server-side NestJS Ensemble Model validation pipeline.

### Claim 3: Relational Persistence Model and Row Level Security (RLS) SQL Enforcement
The database architectural design enforced via Prisma ORM and secured through PostgreSQL Row Level Security is claimed as an invented security model:

```sql
-- RLS Policy 01: Public read access for active sports profiles
CREATE POLICY "Allow public read access for active profiles"
ON public.profiles
FOR SELECT
USING (auth.role() = 'authenticated');

-- RLS Policy 02: Exclusive modification by profile owners
CREATE POLICY "Allow individual update for profile owners"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

-- RLS Policy 03: Strict multi-tenant isolation for wallet transactions
CREATE POLICY "Strict isolation for user wallet transactions"
ON public.wallet_transactions
FOR ALL
USING (auth.uid() = user_id);
```

---

## RESEARCH ADMINISTRATION AND BUDGET (According to Template 251011 Informe de Derechos Autor.docx)

### 1. Human Resources Allocation
| N° | Code | Full Name | Program | Role | Functional Description |
|---|---|---|---|---|---|
| 1 | 2111716 | FLORES SANCHEZ, EDWIN JUNIOR | ING SIST. INFORMACION | Scrum Master / Architect | Project leadership and software architecture |
| 2 | 2010830 | ANDRADE NOA, ALEJANDRO PAOLO | ING SIST. INFORMACION | Fullstack Dev / UI Specialist | User interface and experience development |
| 3 | 2010029 | ESPINOZA MAYTA, ERICK JAIR | ING. SOFTWARE | Backend & Security Dev | NestJS, Prisma, and RLS development |
| 4 | 2121043 | GASTELU PONTE, MATIAS FERNANDO | ING SIST. INFORMACION | QA & DevOps / SRE | Playwright, Vitest, and CI/CD testing |
| 5 | 2121274 | SALVATIERRA RAMIREZ, JUAN ALONSO | ING SIST. INFORMACION | Frontend & AI Dev | React 19 and Vertex AI development |

### 2. Project Budget Consolidated Summary
| N° | Expenditure Category | Total Cost (PEN S/.) |
|---|---|---|
| 1 | Human Capital (5 Researchers - 4 Months) | 64,000.00 |
| 2 | Materials & Office Supplies | 100.00 |
| 3 | Computer Equipment (Depreciation of 5 Laptops) | 2,222.20 |
| 4 | Services (Connectivity, Cloud Render, Vercel, Vertex AI, Office 365) | 1,304.00 |
| **Subtotal - Direct Costs** | | **67,626.20** |
| **Contingencies (10%)** | | **6,762.62** |
| **TOTAL INVENTION PROJECT COST** | | **74,388.82** |

### 3. Sources of Financing
| N° | Financing Source | Contribution (%) | Amount (PEN S/.) |
|---|---|---|---|
| 1 | Researchers (Authors/Students) | 100% | 74,388.82 |
| 2 | Universidad San Ignacio de Loyola (USIL) | 0% | 0.00 |
| **Total** | | **100%** | **74,388.82** |
