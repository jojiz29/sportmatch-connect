# SOFTWARE INTELLECTUAL PROPERTY REPORT & TECHNICAL SPECIFICATIONS

## **SPORTMATCH CONNECT: INTEGRAL PLATFORM FOR SPORTS MATCHMAKING, SOCIAL NETWORKING, TOURNAMENT MANAGEMENT, AND B2B/B2C MONETIZATION WITH EDGE ARTIFICIAL INTELLIGENCE**

**Executive Summary and Technical Documentation for International Intellectual Property Protection**  
**Universidad San Ignacio de Loyola (USIL) — Faculty of Engineering and Artificial Intelligence**  
**Programs:** Information Systems Engineering / Software Engineering  
**Course:** Final Degree Project III (Section: FC-PREISF10B01N)  
**Faculty Advisor:** Prof. Kenny Disney Neira Neira (kenny.neira@usil.pe)  

---

## SOFTWARE EVALUATION FORM
*(According to USIL Official Template Ficha de Evaluación Soft. 2025-02.docx)*

### 1. GENERAL EVALUATION DATA
- **Evaluation Date:** June 28, 2026.
- **Objective:**  
  [X] Proposal evaluation for software invention, software copyright, and international IP registration.
- **Coordinating Department:** Faculty of Engineering and Artificial Intelligence / Information Systems Engineering / Software Engineering.
- **USIL Research Line (R. N° 074-2023/G):** Line 2 — Information Technology.

### 2. RESEARCH TEAM MEMBERS AND AUTHORS

| N° | Full Name | Role in Project | Institutional Email | Contact Phone | National ID (DNI) | Address |
|---|---|---|---|---|---|---|
| 1 | FLORES SANCHEZ, EDWIN JUNIOR | Scrum Master / Lead Architect | edwin.floress@usil.pe | +51 987654321 | 74125896 | Av. La Molina 123, La Molina, Lima |
| 2 | ANDRADE NOA, ALEJANDRO PAOLO | Fullstack Dev / UI Specialist | alejandro.andrade@usil.pe | +51 987654322 | 75123698 | Ca. Los Olivos 456, Surco, Lima |
| 3 | ESPINOZA MAYTA, ERICK JAIR | Backend & Security Dev | erick.espinozam@usil.pe | +51 987654323 | 76124587 | Av. Javier Prado Este 789, San Borja, Lima |
| 4 | GASTELU PONTE, MATIAS FERNANDO | QA & DevOps Engineer / SRE | matias.gastelu@usil.pe | +51 987654324 | 77125698 | Jr. Las Flores 321, Miraflores, Lima |
| 5 | SALVATIERRA RAMIREZ, JUAN ALONSO | Frontend & AI Specialist | juan.salvatierra@usil.pe | +51 987654325 | 78123987 | Av. Universitaria 654, San Miguel, Lima |

---

### 3. DETAILED TECHNICAL DESCRIPTION OF THE PROPOSAL (Minimum 250 Words)

SportMatch Connect is a multi-tier distributed technology solution designed to resolve the logistical, social, and economic fragmentation surrounding amateur sports practice in Metropolitan Lima and Latin America. The technical proposal integrates a reactive web client developed in React 19 with TypeScript structured under Feature-Sliced Design (FSD), establishing strict downward dependency boundaries across six functional layers (`app`, `routes`, `widgets`, `features`, `entities`, and `shared`), eliminating circular couplings while optimizing rendering via Concurrent Features and Transitions API.

The backend service was structured as a modular monolith in NestJS 11 with Prisma ORM connected to a managed Supabase PostgreSQL 15 database. The persistence layer enforces PostGIS spatial indexing for orthodromic distance computation and 78 Row Level Security (RLS) policies ensuring multi-tenant isolation and data protection. The invention incorporates four core engines:
1. **Predictive Matchmaking Engine:** Implements a weighted multivariable algorithm ($S_{\text{compatibility}} \in [0, 100]$) processing Haversine geographical distance, binary sport matching, Elo skill rating similarity, availability overlap, and audited Trust Scores.
2. **Geolocalized Sports Social Network:** Provides real-time multimedia feeds, nested comments, custom reactions, team Squad management, and WebSocket messaging via Supabase Realtime.
3. **Booking Engine & Gamified Economy:** Features an interactive Leaflet map mapping 433 sports complexes in Metropolitan Lima, automated payment splitting via Stripe (PEN), and FitCoins virtual currency.
4. **Edge Conversational Assistant:** Named "Sporty", powered by Google Vertex AI (Gemini 2.5 Flash), providing bidirectional voice processing (STT/TTS) and hybrid moderation (NSFWJS Client Edge AI + Server Ensemble Model).

---

### 4. SOURCE CODE ORIGIN AND PREVIOUS DISCLOSURES
- **Source Code Origin:** Developed entirely by the engineering research team during semester 2026-I using open-source libraries under MIT license (React, NestJS, Prisma, Leaflet, TailwindCSS).
- **Public Disclosures:** The source code is versioned and hosted in a public GitHub repository: `https://github.com/jojiz29/sportmatch-connect`.

---

## DESCRIPTIVE MEMORY AND PROTECTED SOFTWARE MODULES

### Module 1: Multivariable Predictive Matchmaking Algorithmic Procedure
The algorithmic procedure computing real-time compatibility scores between user coordinates $A(\phi_1, \lambda_1)$ and candidate $B(\phi_2, \lambda_2)$ is claimed as protected software logic:

$$
S_{\text{compatibility}} = 0.35 \cdot S_{\text{geography}} + 0.30 \cdot S_{\text{sport}} + 0.20 \cdot S_{\text{skill}} + 0.10 \cdot S_{\text{availability}} + 0.05 \cdot S_{\text{trust}}
$$

Where geographical distance $d$ is evaluated via orthodromic Haversine equations normalized across a 50 km radius.

### Module 2: Hybrid Edge AI Moderation System for Sports Media Feeds
A multi-stage image content moderation architecture is protected, comprising client-side local evaluation using TensorFlow.js and NSFWJS to block explicit uploads prior to network transmission, coupled with a server-side NestJS Ensemble Model validation pipeline.

### Module 3: Relational Persistence Model and Row Level Security (RLS) SQL Enforcement
The database architectural design enforced via Prisma ORM and secured through PostgreSQL Row Level Security is protected:

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

## RESEARCH ADMINISTRATION AND BUDGET
*(According to Template 251011 Informe de Derechos Autor.docx)*

### 1. Human Resources Allocation
| N° | Full Name | Role | Functional Description |
|---|---|---|---|
| 1 | FLORES SANCHEZ, EDWIN JUNIOR | Scrum Master / Architect | Project leadership and software architecture |
| 2 | ANDRADE NOA, ALEJANDRO PAOLO | Fullstack Dev / UI Specialist | User interface and experience development |
| 3 | ESPINOZA MAYTA, ERICK JAIR | Backend & Security Dev | NestJS, Prisma, and RLS development |
| 4 | GASTELU PONTE, MATIAS FERNANDO | QA & DevOps / SRE | Playwright, Vitest, and CI/CD testing |
| 5 | SALVATIERRA RAMIREZ, JUAN ALONSO | Frontend & AI Dev | React 19 and Vertex AI development |

### 2. Consolidated Project Budget

#### Table 01: Human Capital Budget
| N° | Full Name | Monthly Rate (PEN S/.) | Months | Total Cost (PEN S/.) |
|---|---|---|---|---|
| 1 | FLORES SANCHEZ, EDWIN JUNIOR | 3,200.00 | 4 | 12,800.00 |
| 2 | ANDRADE NOA, ALEJANDRO PAOLO | 3,200.00 | 4 | 12,800.00 |
| 3 | ESPINOZA MAYTA, ERICK JAIR | 3,200.00 | 4 | 12,800.00 |
| 4 | GASTELU PONTE, MATIAS FERNANDO | 3,200.00 | 4 | 12,800.00 |
| 5 | SALVATIERRA RAMIREZ, JUAN ALONSO | 3,200.00 | 4 | 12,800.00 |
| **Total Human Capital** | | | | **64,000.00** |

#### Table 02: Materials Budget
| N° | Description | Unit | Qty | Unit Cost (PEN S/.) | Total Cost (PEN S/.) |
|---|---|---|---|---|---|
| 1 | Office Supplies Kit | Unit | 1 | 100.00 | 100.00 |
| **Total Materials** | | | | | **100.00** |

#### Table 03: Computer Equipment Depreciation Budget
*(Formula: Depreciated Cost = (Equipment Cost / 36 Months Lifespan) * 4 Months Development)*

| N° | Equipment Description | Equipment Cost (PEN S/.) | Lifespan (Months) | 4-Month Depreciated Cost (PEN S/.) |
|---|---|---|---|---|
| 1 | Laptop Asus ROG Strix i7 16GB RAM | 4,000.00 | 36 | 444.44 |
| 2 | Laptop Lenovo Legion 5 Ryzen 7 | 4,200.00 | 36 | 466.67 |
| 3 | Laptop HP Victus i5 16GB RAM | 3,800.00 | 36 | 422.22 |
| 4 | Laptop Dell G15 i7 16GB RAM | 4,000.00 | 36 | 444.44 |
| 5 | Laptop Acer Nitro 5 i5 16GB RAM | 4,000.00 | 36 | 444.44 |
| **Total Equipment Depreciation** | | | | **2,222.20** |

#### Table 04: Services & Licenses Budget
| N° | Service Description | Time (Months) | Monthly Cost (PEN S/.) | Total Cost (PEN S/.) |
|---|---|---|---|---|
| 1 | High-Speed Internet Connectivity | 4 | 150.00 | 600.00 |
| 2 | Scopus Academic Database Subscription | 4 | 50.00 | 200.00 |
| 3 | MS Office 365 & IDE Licenses | 4 | 30.00 | 120.00 |
| 4 | Electricity (Compute Power Consumption) | 4 | 70.00 | 280.00 |
| 5 | Render Cloud, Vercel & Vertex AI Computing | 4 | 26.00 | 104.00 |
| **Total Services** | | | | **1,304.00** |

#### Table 05: Consolidated Costs Summary
| N° | Expenditure Category | Total Cost (PEN S/.) |
|---|---|---|
| 1 | Human Capital | 64,000.00 |
| 2 | Materials | 100.00 |
| 3 | Equipment (4-Month Depreciation) | 2,222.20 |
| 4 | Services | 1,304.00 |
| **Subtotal - Direct Costs** | | **67,626.20** |
| **Contingencies (10%)** | | **6,762.62** |
| **TOTAL INVENTION PROJECT COST** | | **74,388.82** |

### 3. Sources of Financing
| N° | Financing Source | Contribution (%) | Amount (PEN S/.) |
|---|---|---|---|
| 1 | Researchers (Authors/Students) | 100% | 74,388.82 |
| 2 | Universidad San Ignacio de Loyola (USIL) | 0% | 0.00 |
| **Total** | | **100%** | **74,388.82** |

---

## APPENDIX A: SOURCE CODE DEPOSIT (INTERNATIONAL STANDARDS)

### A. Directory Tree Structure
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

### B. Primary Source Code Snippet
```typescript
// Server Entry Point (server/src/main.ts)
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
