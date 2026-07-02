# LOGICAL SUPPORT REGISTRATION DOSSIER (COPYRIGHT - INDECOPI PERU)

## **SPORTMATCH CONNECT: AN INTEGRAL SPORTS MATCHMAKING PLATFORM AND SOCIAL NETWORK WITH EDGE AI**

**Technical Descriptive Memory and Operating Manual for Computer Program Registration before the Copyright Directorate**  
**Universidad San Ignacio de Loyola (USIL) — Faculty of Engineering and Artificial Intelligence**  

---

## ⚖️ CHAPTER I: ADMINISTRATIVE REGISTRATION FORM (F-DDA-02)

To initiate the administrative procedure for software (logical support) registration before **INDECOPI**, form **F-DDA-02** data is structured under the jurisprudence of Legislative Decree No. 822:

### 1.1. Applicant Identification (Economic Rights Holder)
*   **Institution Name:** Universidad San Ignacio de Loyola S.A.
*   **RUC:** 20143545678.
*   **Legal Address:** Av. La Fontana 550, La Molina, Lima, Peru.
*   **Legal Representative:** Director of Research and Technological Innovation at USIL.
*   **Type of Application:** Logical Support (Computer Program) registration via assignment of economic rights derived from an academic research contract (PFC III).

### 1.2. Co-authors Identification (Inalienable Moral Rights)
1.  **Flores Sanchez, Edwin Junior** — DNI: 74125896 (Information Systems Engineering)
2.  **Andrade Noa, Alejandro Paolo** — DNI: 75123698 (Information Systems Engineering)
3.  **Espinoza Mayta, Erick Jair** — DNI: 76124587 (Software Engineering)
4.  **Gastelu Ponte, Matias Fernando** — DNI: 77125698 (Information Systems Engineering)
5.  **Salvatierra Ramirez, Juan Alonso** — DNI: 78123987 (Information Systems Engineering)

### 1.3. Specific Software Work Data
*   **Title:** SportMatch Connect.
*   **Version:** 1.0.0 (Production Release).
*   **Language:** Spanish and English (Bilingual).
*   **Year of Creation:** 2026.
*   **Country of Origin:** Peru.
*   **Nature of the Work:** Logical Support (Computer Program). Unpublished work not previously marketed publicly.

---

## 🛠️ CHAPTER II: TECHNICAL DESCRIPTIVE MEMORY OF THE LOGICAL SUPPORT

### 2.1. System Architecture and Layer Integration
The software adopts a decoupled architecture structured in independent layers to guarantee maintainability and vertical/horizontal scalability:

```
               +--------------------------------------------+
               |            React 19 Frontend               |
               |       (Feature-Sliced Design - FSD)        |
               +---------------------++---------------------+
                                     ||
                              HTTPS  ||  WebSockets
                                     ||
               +---------------------++---------------------+
               |             NestJS 11 Backend              |
               |             (Modular Monolith)             |
               +---------------------++---------------------+
                                     ||
                                     ||  Prisma ORM
                                     ||
               +---------------------++---------------------+
               |          Supabase PostgreSQL DB            |
               |         (PostGIS + RLS Policies)           |
               +--------------------------------------------+
```

1.  **Frontend (React 19 + TypeScript + FSD):** Organized under six strict layers:
    *   `app`: Routing initializers, global context providers, and CSS imports.
    *   `routes`: System page declarations (onboarding, feed, map, bookings).
    *   `widgets`: Complex composite components (dynamic matchmaking cards).
    *   `features`: Interactive functionality with state logic (booking form, swipe).
    *   `entities`: Conceptual business modeling (player, venue, match, FitCoins).
    *   `shared`: Common utilities, atomic UI components (buttons, inputs), and API integration.
2.  **Backend (NestJS 11 + Prisma ORM):** Modular monolith with strict dependency injection, composed of isolated domain submodules (`matches`, `venues`, `wallets`, `ai`).
3.  **Persistence (Supabase PostgreSQL 15 + PostGIS):** Indexed geographic relationships persistence and Row Level Security (RLS) policies for atomic data isolation.

---

### 2.2. Detailed Module and Source Code Inventory

The exhaustive physical structure of the logical support is presented below:

| No. | File Path in the Repository | Language | Module Purpose and Functionality |
|---|---|---|---|
| 1 | `server/prisma/schema.prisma` | Prisma | Definition of entities, data types, foreign keys, and relational mapping. |
| 2 | `server/src/matches/matches.service.ts` | TypeScript | Implementation of the predictive matchmaking algorithm and Elo updates. |
| 3 | `server/src/matches/matches.controller.ts` | TypeScript | Exposes REST endpoints for matchmaking and client requests. |
| 4 | `server/src/wallets/wallets.service.ts` | TypeScript | FitCoins digital wallet logic, transaction control, and Stripe webhook. |
| 5 | `server/src/ai/ai.service.ts` | TypeScript | Google Vertex AI integration for Sporty's conversational processing. |
| 6 | `src/features/matchmaking/model/swipe-store.ts`| TypeScript | Local storage of profile swiping state (Zustand). |
| 7 | `src/features/matchmaking/ui/MatchCard.tsx` | TSX | Interactive visual component for player swiping with animations. |
| 8 | `src/shared/ui/MapLeaflet.tsx` | TSX | Interactive map integrated with Leaflet and sports marker cache. |

---

### 2.3. Persistence DDL Structure and RLS Access Security

For registration before INDECOPI, the database physical persistence design is attached, ensuring row-level safety:

```sql
-- DDL of Sports Courts and Venues
CREATE TABLE public.venues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    price_per_hour DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create spatial index for fast radial searches
CREATE INDEX venues_location_gist ON public.venues USING GIST(location);

-- DDL of FitCoins Wallets per User
CREATE TABLE public.fitcoin_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    balance DECIMAL(10, 2) DEFAULT 0.00 NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS as a mandatory security rule
ALTER TABLE public.fitcoin_wallets ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated user can only interact with their own wallet
CREATE POLICY "Wallet transaction isolation policy"
ON public.fitcoin_wallets
FOR ALL
USING (auth.uid() = user_id);
```

---

## 📖 CHAPTER III: TECHNICAL AND OPERATIONAL USER MANUAL

This manual details the step-by-step operational flow of SportMatch Connect to guide INDECOPI evaluators in validating the platform.

### 3.1. Flow 1: Account Registration and Sports Onboarding
1.  The user accesses the welcome screen in Sleek Dark Mode.
2.  Presses the **Sign In with Google** button or enters email and password.
3.  The system detects if it is a new user and requests completion of the **Sports Sheet**:
    *   Favorite sports (Football, Padel, Tennis, Basketball).
    *   Self-assessed skill level (Beginner, Intermediate, Advanced).
    *   Weekly schedule availability slots.
4.  Upon clicking save, the PWA client requests geolocations from the OS and sends coordinates to the NestJS backend via HTTPS.

### 3.2. Flow 2: Swipe and Predictive Matchmaking
1.  The user enters the **Find Matches** section.
2.  The backend computes compatible profiles and returns a candidate queue.
3.  The user sees an interactive card (**MatchCard**) with player info, distance, shared sport, estimated Elo, and compatibility percentage.
4.  If the user swipes **right (Swipe Right)**, a persistent "Match" request is issued. If both players match, WebSockets start a real-time chat.

### 3.3. Flow 3: Geolocated Booking and Stripe Payment
1.  The user opens the **Courts Map** tab.
2.  Leaflet renders a map centered on the device location, displaying complex pins within a 5 km radius thanks to PostGIS indexing.
3.  Clicking a pin shows a card with hourly pricing, photos, and available slots.
4.  The user selects a time and clicks **Book**. A popup prompts selection of individual or split billing (Split Bill).
5.  Upon confirmation, Stripe processes the credit/debit card. The backend receives confirmation via Webhook and updates booking status to `"confirmed"`.
