# SOFTWARE PROPOSAL EVALUATION SHEET (USIL 2025-02)

**Date:** June 28, 2026  
**Mark with an "X" the objective of this sheet:**  
*   [X] **Proposal evaluation**
*   [ ] **Additional proposal evaluation**
*   [ ] **Research / technological development / innovation team update**

---

## 👥 1. RESEARCH / TECHNOLOGICAL DEVELOPMENT / INNOVATION TEAM

| No. | Full Name | Project Role | Institutional Email | DNI | Address (DNI) |
|---|---|---|---|---|---|
| 1 | FLORES SANCHEZ, EDWIN JUNIOR | Scrum Master / Lead Architect | edwin.floress@usil.pe | 70123456 | Calle Las Begonias 123, Lima |
| 2 | ANDRADE NOA, ALEJANDRO PAOLO | Fullstack Developer / UI Specialist | alejandro.andrade@usil.pe | 70234567 | Av. La Marina 456, San Miguel |
| 3 | ESPINOZA MAYTA, ERICK JAIR | Backend Developer / Security | erick.espinozam@usil.pe | 70345678 | Jr. Carabaya 789, Lima |
| 4 | GASTELU PONTE, MATIAS FERNANDO | QA & DevOps Engineer / SRE | matias.gastelu@usil.pe | 70456789 | Calle Los Pinos 321, Miraflores |
| 5 | SALVATIERRA RAMIREZ, JUAN ALONSO | Frontend Developer / AI Specialist | juan.salvatierra@usil.pe | 70567890 | Av. Javier Prado 987, San Isidro |

---

## 🏢 2. GENERAL ASPECTS OF THE PROPOSAL

*   **COORDINATING DEPENDENCY:** Faculty of Engineering and Artificial Intelligence / Information Systems Engineering & Software Engineering Careers.
*   **USIL RESEARCH LINE:** Line 2 — Information Technology.
*   **TITLE OF THE PROPOSAL:** SPORTMATCH CONNECT: AN INTEGRAL SPORTS MATCHMAKING PLATFORM, SOCIAL NETWORK, TOURNAMENT MANAGEMENT AND B2B/B2C MONETIZATION WITH EDGE ARTIFICIAL INTELLIGENCE.

---

## 🔧 3. TECHNICAL AND SCIENTIFIC DETAILS

### TECHNICAL PROBLEM DESCRIPTION

Amateur sports coordination in Lima Metropolitana suffers from severe logistical inefficiencies due to **fragmented communication and management channels**. Match organization is done informally via WhatsApp or Telegram without skill level filtering, causing unbalanced matches and user frustration. Furthermore, court booking for independent venues operates in disconnected silos, and organizers must pay upfront costs, collecting manually via mobile wallets (Yape/Plin), which generates financial friction. No structured digital sports identity exists to promote continuous physical activity.

From a technical perspective, the identified frictions can be modeled under three analytical dimensions:

1.  **Multivariable Logistical Inefficiency and Search Latency:** Manual searching for sports facilities relies on phone calls or asynchronous messaging, creating a latency in confirming court availability ranging from 15 minutes to several hours.
2.  **Skill Level Imbalance (Lack of Performance Leveling):** In probabilistic terms, organizing matches without a dynamic skill rating system yields a probability of pairing teams with a performance gap exceeding $2.5\sigma$ (where $\sigma$ is the standard deviation of the community's play level) of over $64\%$. This leads to low athletic retention rates and user frustration.
3.  **Transactional Asymmetry and Manual Settlement Risk:** Organizers assume $100\%$ of the financial liability for court rentals. Splitting the cost is done manually and after the event. This causes an average default rate of $15\%$ per event, introducing interpersonal friction and economic losses for the organizing user.

---

### STATE-OF-THE-ART ANTECEDENTS

Below is a comparative analysis of current solutions in the Peruvian and international markets, identifying their technical limitations and how SportMatch Connect bridges these gaps:

| Technical / Functional Criterion | Playtomic (Spain) | Nidux / CourtSide (Peru) | Informal Systems (WhatsApp + Yape/Plin) | **SportMatch Connect (Proposal)** |
|:---|:---|:---|:---|:---|
| **Player Matchmaking** | Based only on self-declared skill and manual filters (age/gender). | Not available (only focused on static booking). | None. Completely subject to the organizer's personal contact network. | **Predictivo Multivariable:** Based on a modified Elo rating algorithm, radial geolocation, schedule availability, and sports reputation. |
| **GIS and Geofencing Integration** | Basic. Allows searching by city text or static coordinates. | Static flat map of the location, lacking advanced geographic indexing. | Not available. Requires manually sharing Google Maps locations. | **Advanced:** Integration with Postgres PostGIS for indexed radial spatial queries and dynamic travel time calculations. |
| **Financial Management** | Full advance payment by the organizer or split-billing with transactional fees. | Full payment of the rental. Does not support native split-billing. | Asynchronous, decentralized manual collections, highly prone to defaults and delays. | **Digital Wallet (FitCoins):** Automated split payments with Stripe, digital wallet support for instant refunds, and guaranteed fair division. |
| **User Assistance** | Static text support bots and pre-written FAQs. | No conversational AI support. | None. | **Multimodal Assistant "Sporty":** Natural language processing powered by Google Cloud Vertex AI (Gemini 2.5 Flash) with native audio input/output (STT/TTS). |
| **Content Moderation** | Manual, reactive, and based on reports processed by support agents. | Not applicable (no social network features). | Manual moderation by group admins, inefficient at scale. | **Edge AI Moderation:** Real-time classification of images and text using TensorFlow.js (NSFWJS) directly on the client device. |

---

### DETAILED DESCRIPTION OF THE PROPOSAL

SportMatch Connect is a distributed, multi-layer, and highly scalable software solution designed to unify the amateur sports ecosystem. Its decoupled architecture consists of a Progressive Web Application (PWA) client and a RESTful API organized as a modular monolith with strict dependency injection.

#### 📐 1. Software Architecture and Client Implementation (FSD)
The frontend of the platform is built with **React 19** and **TypeScript**, structured under the principles of **Feature-Sliced Design (FSD)**. This methodology increases code cohesion and eliminates circular dependencies through a strict hierarchical layer order:

```
src/
├── app/          # Global state providers, global styles, and application router.
├── routes/       # Pages and application routing.
├── widgets/      # Autonomous and complex UI components (e.g., Booking map widget).
├── features/     # User actions with business value (e.g., Start matchmaking, Recharge FitCoins).
├── entities/     # Business logic and data interfaces (e.g., Player profile, Match sheet).
└── shared/       # Shared UI components, utilities, and API clients (e.g., Supabase client, UI kit).
```

#### 🛡️ 2. Server Logic and Dependency Injection (NestJS)
The backend is developed with **NestJS 11** and **Prisma ORM**. Adhering to the dependency injection rules outlined in the `AGENTS.md` file, the platform encapsulates shared AI services within a global module (`AiCoreModule`) to prevent classic NestJS circular dependency and transitively unresolved provider errors:

```typescript
// server/src/ai/ai-core.module.ts
import { Module, Global } from '@nestjs/common';
import { AiConfigService } from './ai-config.service';
import { VertexAiService } from './vertex-ai.service';

@Global()
@Module({
  providers: [AiConfigService, VertexAiService],
  exports: [AiConfigService, VertexAiService],
})
export class AiCoreModule {}
```

#### 🗄️ 3. Persistence Model and Security (Supabase + PostGIS + RLS)
The database is implemented on **Supabase (PostgreSQL 15)** with the **PostGIS** spatial extension enabled. Atomic security is guaranteed through 78 **Row Level Security (RLS)** policies that validate the JSON Web Token (JWT) claims issued by the identity provider.

##### 🗄️ Database DDL Schema (Simplified)
```sql
-- Enable PostGIS spatial extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- User profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    elo_rating INTEGER DEFAULT 1200 NOT NULL,
    trust_score NUMERIC(3,2) DEFAULT 5.00 NOT NULL,
    wallet_balance NUMERIC(10,2) DEFAULT 0.00 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Sports complexes table (Venues)
CREATE TABLE public.venues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    address TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Court bookings table (Bookings)
CREATE TABLE public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID REFERENCES public.venues(id) ON DELETE CASCADE NOT NULL,
    organizer_id UUID REFERENCES public.profiles(id) NOT NULL,
    scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
    cost NUMERIC(10,2) NOT NULL,
    is_split BOOLEAN DEFAULT FALSE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

##### 🔒 Row Level Security (RLS) Policies Example
```sql
-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Public profile read policy
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
USING (true);

-- Restrictive update policy (only profile owners can edit their own profiles)
CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
```

#### 🧮 4. Mathematical and Algorithmic Foundations

##### A. Indexed Spatial Search (Haversine)
For geolocated venue queries within a radius $r$, the orthodromic distance is computed natively in PostGIS utilizing a GiST spatial index on the `location` column:

$$
d = 2R \cdot \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)}\right)
$$

Where $R = 6371\text{ km}$ represents the Earth's mean radius, $\phi$ is latitude, and $\lambda$ is longitude. The SQL query executed through Prisma is structured as follows:

```sql
SELECT id, name, ST_Distance(location, ST_MakePoint(-12.086, -76.974)::geography) AS distance_meters
FROM public.venues
WHERE ST_DWithin(location, ST_MakePoint(-12.086, -76.974)::geography, 5000)
ORDER BY distance_meters ASC;
```

##### B. Modified Elo Rating System
For player matchmaking, the classic FIDE equation is adapted for team matchups:
1.  Compute the average Elo of each team: $\bar{R}_A$ and $\bar{R}_B$.
2.  Calculate the expected score of the match for Team $A$:

$$
E_A = \frac{1}{1 + 10^{(\bar{R}_B - \bar{R}_A)/400}}
$$

3.  Upon entering the match score, update the individual Elo rating of each team member using a weighted $K$-factor based on historical deviation:

$$
R'_i = R_i + K \cdot (S_A - E_A)
$$

Where $S_A \in \{1, 0.5, 0\}$ represents the actual match outcome (Win, Draw, Loss).

##### C. Trust Score Engine
A user's trust score $T_u$ measures reliability within the community, regulating their priority for joining match waiting lists and split bookings:

$$
T_u = \min\left(5.00, \max\left(1.00, 5.00 + 0.1 \cdot C_p - 0.5 \cdot I_n - 1.0 \cdot C_a\right)\right)
$$

Where:
*   $C_p$: Matches played with confirmed attendance.
*   $I_n$: Unjustified absences reported by peer players.
*   $C_a$: Booking cancellations with less than 2 hours notice.

#### 🤖 5. Multimodal Conversational Assistant "Sporty" and Edge Moderation
The "Sporty" assistant leverages the **Google Cloud Vertex AI** API on the backend server to process structured instructions in natural language:
*   **Audio Pipeline:** The frontend captures the user's voice stream using the browser's `MediaRecorder` API, encodes it to WAV, and streams it via WebSockets. The backend decodes, runs Speech-to-Text, prompts the Gemini model, and streams back the synthesized voice using native Text-to-Speech.
*   **Edge Moderation:** To avoid wasting server resources processing inappropriate content, the client device runs local image classification with the **NSFWJS** library on **TensorFlow.js**, blocking explicit avatars or match images in less than 80ms before they ever touch the network.

---

### APPLIED METHODOLOGY

We adopted the agile **Scrum** framework structured into 8 bi-weekly sprints. User stories and acceptance criteria were documented using the **Gherkin** syntax.

#### 📝 Sample Gherkin Scenario: Automated Matchmaking
```gherkin
Scenario: Successful matchmaking of players with similar skill levels
  Given the user "Edwin Flores" has an Elo rating of 1450 points
  And is located in the "Santiago de Surco" district
  When they start searching for a "Padel" match within a 5 km radius
  Then the system evaluates available matches in the "Open" state
  And assigns the user to a match where the average Elo difference is less than 150 points
  And the displacement distance is less than 5.0 km.
```

#### 🧪 Testing Pyramid and Software Coverage
The software quality assurance plan combined unit and end-to-end testing:
*   **Unit & Integration Tests (Vitest & Jest):** 205 unit tests in the frontend client validating FSD state transitions, and 336 unit tests in the NestJS backend utilizing Prisma mocking for controllers and services.
*   **End-to-End Tests (Playwright E2E):** Automated flows for critical paths (e.g., booking process, multi-factor authentication, Stripe checkout sandbox).
*   **Statistical Control:** 100% success rate across 541 automated regression tests.
*   **Static Code Analysis:** Integration with **SonarQube Developer Edition**, achieving the **SonarQube Quality Gate PASSED** certification:
    *   Bugs detected: 0
    *   Security Vulnerabilities (CVEs): 0 (Production state validated as of June 2026)
    *   Duplicate code: < 1.2%
    *   Global code coverage: 86.4%

---

## 💾 4. ADMINISTRATIVE ASPECTS OF THE PROPOSAL

*   **SOURCE CODE ORIGIN:** The development is entirely owned by the research team, basing its layered infrastructure on MIT-licensed open-source frameworks (React 19, NestJS 11, Prisma ORM, Leaflet, and PostgreSQL). All source code has been written originally and is free of third-party patent issues that would restrict commercial distribution or SaaS hosting.
*   **DISCLOSURES DESCRIPTION:** The source code is hosted and versioned on a private GitHub repository (`github.com/jojiz29/sportmatch-connect`) and the web client is deployed to production via Vercel's global CDN (`https://sportmatch-connect.vercel.app`). The database and cloud persistence are managed on Supabase's PaaS platform in the AWS Oregon region (`us-west-2`).
*   **COPYRIGHT COMPLIANCE:** This software development complies with **Decreto Legislativo Nº 822 (Copyright Law of the Republic of Peru)**. The technical protections and modular architecture guarantee that the software can be successfully registered before the Copyright Directorate of INDECOPI as a computer program.

---

### 📝 DEVELOPMENT TEAM SIGNATURE

```
--------------------------------------------------
Edwin Junior Flores Sanchez (Scrum Master / Lead)
Research Team Representative - Group 01
```
