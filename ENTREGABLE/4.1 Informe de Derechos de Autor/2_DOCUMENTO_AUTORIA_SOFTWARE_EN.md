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

### 1.4. Detailed Breakdown of F-DDA-02 Form Fields

Below is the detailed breakdown of each field of the INDECOPI F-DDA-02 form, according to the current TUPA and Directive N° 001-2016-DDA-INDECOPI:

| F-DDA-02 Field | Registered Value | Detail / Documentary Support |
|---|---|---|
| **1. Last Names and First Names (Applicant)** | Universidad San Ignacio de Loyola S.A. | Legal entity holding the economic rights. RUC 20143545678 registered with SUNAT. |
| **2. Legal Address** | Av. La Fontana 550, La Molina, Lima | Fiscal address registered with SUNAT, verifiable in RUC record. |
| **3. Type of Application** | Logical Support Registration | Computer Program Work category, Application Software subcategory. |
| **4. Title of the Work** | SportMatch Connect | Unique commercial name registered in the GitHub repository and Vercel deployment. |
| **5. Version** | 1.0.0 | Stable production version, tagged as `v1.0.0` in the Git repository. |
| **6. Year of Creation** | 2026 | Calendar year in which the production release coding was completed. |
| **7. Language** | Spanish and English | Bilingual user interface with automatic browser locale detection. |
| **8. Nature of the Work** | Computer Program | Unpublished work, not commercially disclosed massively before the application. |
| **9. Co-authors** | Flores Sanchez Edwin Junior, Andrade Noa Alejandro Paolo, Espinoza Mayta Erick Jair, Gastelu Ponte Matias Fernando, Salvatierra Ramirez Juan Alonso | The five co-authors retain inalienable moral rights under D.L. N° 822, Art. 22. |
| **10. Assignment of Rights** | Assignment to USIL through academic research contract PFC III | Assignment document signed by each co-author and the USIL Research Directorate. |
| **11. Logical Support (Source Code)** | Private GitHub repository + compressed file (.zip) on physical media | Digital backup sealed with SHA-256 hash and certified date before a notary. |
| **12. Sworn Declaration** | Originality and non-infringement of third-party rights | Declaration signed by each co-author under the scope of Art. 44 D.L. N° 822. |

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
| 1 | `server/prisma/schema.prisma` | Prisma DSL | Definition of entities, data types, foreign keys, PostGIS spatial indexes, and complete relational mapping (21 models). |
| 2 | `server/src/main.ts` | TypeScript | NestJS backend entrypoint with absolute environment variable loading via dotenv. |
| 3 | `server/src/app.module.ts` | TypeScript | NestJS root module that aggregates all domain submodules (matches, venues, wallets, ai, chat, bookings). |
| 4 | `server/src/matches/matches.service.ts` | TypeScript | Implementation of the predictive matchmaking algorithm: compatibility weight calculation (5 factors), Elo update with K=32 dynamic, and Haversine radial filter. |
| 5 | `server/src/matches/matches.controller.ts` | TypeScript | Exposes REST endpoints for matchmaking, match requests, and result confirmation. |
| 6 | `server/src/wallets/wallets.service.ts` | TypeScript | FitCoins digital wallet logic: balance control, atomic debits, transaction history, and Stripe webhook verification. |
| 7 | `server/src/wallets/wallets.controller.ts` | TypeScript | REST endpoints for top-up, balance inquiry, and user-to-user transfer. |
| 8 | `server/src/ai/ai-core.module.ts` | TypeScript | Global NestJS module (@Global()) that centralizes AiConfigService and VertexAiService for the entire application. |
| 9 | `server/src/ai/ai.service.ts` | TypeScript | Orchestrates the conversational pipeline: STT → Prompt Engineering → Gemini 2.5 Flash → TTS. |
| 10 | `server/src/ai/vertex-ai.service.ts` | TypeScript | HTTP client for the Google Vertex AI API with rate limiting handling, exponential retry, and configurable timeout. |
| 11 | `server/src/ai/ai-config.service.ts` | TypeScript | Typed configuration service that reads Vertex AI environment variables (project_id, location, model_name). |
| 12 | `server/src/venues/venues.service.ts` | TypeScript | Sports complex management: CRUD venues, PostGIS spatial queries with ST_DWithin, and dynamic price calculation. |
| 13 | `server/src/venues/venues.controller.ts` | TypeScript | REST endpoints to list, create, update, and delete sports complexes (B2B). |
| 14 | `server/src/bookings/bookings.service.ts` | TypeScript | Booking logic: split billing creation, availability verification, cancellations, and automatic refunds. |
| 15 | `server/src/chat/chat.gateway.ts` | TypeScript | WebSocket gateway for real-time messaging between matched users. |
| 16 | `server/src/common/guards/jwt-auth.guard.ts` | TypeScript | JWT authentication guard protecting all private endpoints. |
| 17 | `src/app/app-entry.tsx` | TSX | React 19 frontend entrypoint with global providers (ThemeProvider, AuthProvider, QueryClient). |
| 18 | `src/routes/index.tsx` | TSX | Main route declarations (onboarding, feed, map, bookings, profile, settings) using React Router. |
| 19 | `src/features/matchmaking/model/swipe-store.ts` | TypeScript | Local storage of profile swiping state using Zustand with sessionStorage persistence. |
| 20 | `src/features/matchmaking/ui/MatchCard.tsx` | TSX | Interactive visual component for player swiping with CSS animations and touch gesture detection. |
| 21 | `src/shared/ui/MapLeaflet.tsx` | TSX | Interactive map integrated with Leaflet, sports marker cache, and tile customization. |
| 22 | `src/shared/api/supabase-client.ts` | TypeScript | Singleton Supabase client with JWT session handling, auto-refresh, and us-west-2 region configuration. |
| 23 | `src/features/sporty-ai/ui/VoiceRecorder.tsx` | TSX | Audio recording component with real-time waveform visualization and WAV encoding. |
| 24 | `src/features/sporty-ai/model/nsfw-filter.ts` | TypeScript | Local offensive image classifier using TensorFlow.js NSFWJS, executed on the client before upload. |
| 25 | `src/entities/fitcoins/model/wallet-store.ts` | TypeScript | Zustand store for FitCoins balance management with optimistic update and automatic rollback. |

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

### 2.4. System Flow Diagram

The following diagram describes the complete logical flow that a matchmaking request follows from when the user presses "Find Match" to match confirmation:

```
[Start] → Authenticated user → Selects sport and search range
    ↓
[System] Calculates user coordinates (browser geolocation)
    ↓
[System] PostGIS query: ST_DWithin(user, venues, radius)
    ↓
[Database] Returns venues within radius with GiST index (< 15ms)
    ↓
[System] Filters active players in those venues with Elo ± 200 points
    ↓
[System] Calculates compatibility score (5 weighted factors):
    ├── 35%: Elo difference (smaller difference = higher score)
    ├── 25%: Haversine distance (shorter distance = higher score)
    ├── 20%: Time coincidence (weekly availability)
    ├── 12%: Common sports (intersection of favorite sports)
    └──  8%: Trust Score (player reputation)
    ↓
[System] Generates candidate queue sorted by descending score
    ↓
[Client] Renders MatchCard with candidate data
    ↓
[User] Interacts: Swipe Right (Match) or Swipe Left (Discard)
    ↓
[Backend] If both swipe right → Creates "matched" record in DB
    ↓
[Backend] Opens WebSocket channel → Real-time chat enabled
    ↓
[User] Coordinate date/time and proceed to court booking
    ↓
[Backend] Stripe integration: Automatic split billing or full payment
    ↓
[Confirmation] Booking confirmed → Push notification to players
    ↓
[End] Match scheduled in the application calendar
```

**Exception flow:** If the user does not have geolocation enabled, the system displays a manual district selector for Metropolitan Lima. If no compatible candidates are found, the user's preference is stored and an asynchronous notification is scheduled via job queue (BullMQ over Redis).

---

### 2.5. C4 Solution Architecture

The three levels of architectural abstraction under the C4 model (Context, Containers, and Components) are described below, according to Simon Brown's software documentation standards.

#### Level 1: Context Diagram (System Overview)

The SportMatch Connect system sits as the central node integrating four external actors and three satellite systems:

| Actor / System | Role | Interaction |
|---|---|---|
| **Amateur Athlete (B2C)** | End user seeking recreational physical activity | Interacts with the PWA frontend from their mobile or desktop device. |
| **Complex Administrator (B2B)** | Owner or manager of a sports facility | Manages court availability, pricing, and promotions from the B2B panel. |
| **Google Cloud Platform** | AI service provider | Vertex AI processes natural language for the Sporty assistant. |
| **Stripe** | Global payment gateway | Processes FitCoins top-ups, split billing, and refunds via Webhooks. |
| **Supabase (PostgreSQL + PostGIS)** | Database as a service | Stores main persistence with RLS, GiST spatial indexes, and JWT authentication. |
| **Vercel Edge Network** | CDN and frontend hosting | Serves the static PWA from 140+ global nodes with edge caching. |
| **Render** | Backend PaaS | Runs the NestJS 11 modular monolith with auto-scaling. |

#### Level 2: Container Diagram (Runtime Decomposition)

| Container | Technology | Responsibility |
|---|---|---|
| **Web Client (PWA)** | React 19 + TypeScript + Vite | Responsive user interface, swipe logic, Leaflet map, NSFWJS edge moderation. |
| **API Backend (Web Server)** | NestJS 11 (Express) | REST request processing, WebSockets for real-time chat, layered business logic. |
| **Database** | Supabase PostgreSQL 15 + PostGIS | Transactional storage, spatial indexes, row-level RLS. |
| **AI Service** | Vertex AI Gemini 2.5 Flash | Conversational prompt processing, STT/TTS for Sporty. |
| **Job Queue** | Redis + BullMQ | Asynchronous processing of push notifications and batch Elo recalculation tasks. |

#### Level 3: Component Diagram (NestJS Backend)

The modular monolith backend is decomposed into the following NestJS modules:

```
server/src/
├── matches/           → matches.module.ts, matches.service.ts, matches.controller.ts
│   └── dto/           → create-match.dto.ts, swipe-action.dto.ts
├── venues/            → venues.module.ts, venues.service.ts, venues.controller.ts
│   └── dto/           → create-venue.dto.ts, search-venue.dto.ts
├── bookings/          → bookings.module.ts, bookings.service.ts, bookings.controller.ts
│   └── dto/           → create-booking.dto.ts, split-billing.dto.ts
├── wallets/           → wallets.module.ts, wallets.service.ts, wallets.controller.ts
│   └── dto/           → top-up.dto.ts, transfer.dto.ts
├── ai/                → ai.module.ts, ai-core.module.ts, ai.service.ts, vertex-ai.service.ts
│   └── interfaces/    → ai-response.interface.ts, voice-payload.interface.ts
├── chat/              → chat.module.ts, chat.gateway.ts, chat.service.ts
├── auth/              → auth.module.ts, auth.service.ts, jwt.strategy.ts
├── common/            → guards/, interceptors/, filters/, pipes/
│   └── guards/        → jwt-auth.guard.ts, roles.guard.ts
└── prisma/            → prisma.module.ts, prisma.service.ts
```

---

### 2.6. Complete Technology Stack

| Layer | Technology | Version | Specific Purpose in SportMatch Connect |
|---|---|---|---|
| **Client Runtime** | Node.js | 22.x | Runtime for frontend build tools. |
| **Server Runtime** | Node.js | 22.x | Runtime for NestJS backend on Render. |
| **Language** | TypeScript | 5.7 | Static typing in frontend and backend ensuring data integrity. |
| **Frontend Framework** | React | 19.0 | UI component library with Concurrent Features and Server Components. |
| **Build Tool** | Vite | 6.x | Ultra-fast bundler with HMR, asset optimization, and code splitting. |
| **Frontend Architecture** | FSD (Feature-Sliced Design) | — | 6-layer hierarchical organization with strict unidirectional imports. |
| **Maps** | Leaflet + React-Leaflet | 1.9 + 5.0 | Interactive map visualization with OpenStreetMap tiles. |
| **Global State** | Zustand | 5.x | Lightweight stores for swipe, wallet, and user preferences. |
| **Backend Framework** | NestJS | 11.1 | Modular monolith with DI, guards, interceptors, and WebSocket Gateway. |
| **ORM** | Prisma | 6.x | Object-relational mapping with dual-routing (DATABASE_URL + DIRECT_URL). |
| **Database** | PostgreSQL | 15.x | Relational database engine with extension support. |
| **Spatial Extension** | PostGIS | 3.5 | GiST indexes, ST_DWithin queries, geographic distance calculations. |
| **Database as a Service** | Supabase | — | PostgreSQL hosting, JWT authentication, RLS, and auto-generated REST API. |
| **Authentication** | Supabase Auth | — | Google login, magic links, session control. |
| **Conversational AI** | Google Vertex AI (Gemini 2.5 Flash) | — | Natural language processing, STT and TTS for the Sporty assistant. |
| **Client AI** | TensorFlow.js + NSFWJS | — | Local offensive image classification (< 80ms) in the browser. |
| **Payment Gateway** | Stripe | 2026-01 | Card processing, Webhooks, split billing, and refunds. |
| **Real Time** | WebSockets (Socket.io) | 4.x | Live chat between matched users and push notifications. |
| **Job Queue** | BullMQ + Redis | 5.x | Asynchronous batch task processing (Elo recalculation, notifications). |
| **CDN** | Vercel Edge Network | — | PWA frontend serving from 140+ global nodes. |
| **Backend PaaS** | Render | — | Auto-scaling deployment of NestJS monolith. |
| **Unit Testing** | Vitest + Jest | 3.x | React component and NestJS service testing with mocking. |
| **E2E Testing** | Playwright | 1.52 | Full user flow and Stripe gateway automation. |
| **Code Quality** | SonarQube Cloud | — | Static analysis, vulnerability detection, and code quality. |
| **CI/CD** | GitHub Actions | — | Automated pipeline: lint → test → build → deploy. |

---

### 2.7. Client Navigation Structure (Route Map)

The PWA application exposes the following routes organized by functionality:

| Route | Component | Visibility | Description |
|---|---|---|---|
| `/welcome` | WelcomePage | Public | Welcome screen with login options. |
| `/onboarding/sports-profile` | SportsProfileForm | New user | Sports profile registration (sports, level, availability). |
| `/feed` | MatchFeedPage | Authenticated | Main feed with matchmaking cards (MatchCard). |
| `/map` | MapPage | Authenticated | Leaflet map with sports complex pins within 5 km radius. |
| `/venues/:id` | VenueDetailPage | Authenticated | Complex detail with pricing, schedules, and photo gallery. |
| `/bookings` | BookingsPage | Authenticated | List of active, upcoming, and past bookings. |
| `/booking/:id` | BookingDetailPage | Authenticated | Booking detail with split billing options. |
| `/chat/:matchId` | ChatPage | Authenticated | Real-time WebSocket chat with the confirmed match. |
| `/wallet` | WalletPage | Authenticated | FitCoins wallet: balance, Stripe top-up, transaction history. |
| `/sporty` | SportyAIPage | Authenticated | Sporty conversational assistant with voice/text input. |
| `/squads` | SquadsPage | Authenticated | Squad creation and management with player invitation. |
| `/b2b/dashboard` | B2BDashboard | B2B (Admin) | Sports complex administration panel, occupancy statistics. |
| `/b2b/venues/manage` | VenueManagerPage | B2B (Admin) | CRUD court management, pricing, and schedules. |
| `/profile/:id` | ProfilePage | Authenticated | Public player profile with Elo, history, and sports. |
| `/settings` | SettingsPage | Authenticated | Account settings, notifications, dark/light theme, and language. |

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

### 3.4. Flow 4: Interaction with Sporty (AI Assistant by Voice and Text)

Sporty is the multimodal conversational assistant of SportMatch Connect based on Google Vertex AI Gemini 2.5 Flash. It supports text and voice input with native processing:

1.  The user accesses the **Sporty** section from the bottom menu or from the floating card on the home screen.
2.  If the user presses the **microphone icon**, the `VoiceRecorder.tsx` component activates the browser's `MediaRecorder` API to capture audio in WAV format.
3.  The frontend transmits the audio stream to the backend via WebSocket (Socket.io) in 512-byte fragments.
4.  The backend receives the fragments, reconstructs the complete WAV file, and sends it to the Vertex AI pipeline for Speech-to-Text.
5.  The transcribed text is injected into a structured system prompt with sports context restrictions (do not answer non-sports-related questions, FitCoins, or platform topics).
6.  Gemini 2.5 Flash processes the prompt and generates a text response. The backend converts this response to speech via Google Cloud's native Text-to-Speech and returns the Base64-encoded audio to the frontend.
7.  The frontend plays the audio via the `AudioContext` API and simultaneously displays the response text in a chat bubble.
8.  **Edge moderation:** Before sending audio, the client performs a local volume and minimum duration check (> 0.5s) to avoid empty requests. Additionally, any image uploaded during the conversation passes through the TensorFlow.js NSFWJS classifier on the device before reaching the server.

**Voice commands supported by Sporty:**
- *"Find padel matches near me"* → Executes geolocated search with sport filter.
- *"How many FitCoins do I have?"* → Queries current digital wallet balance.
- *"Create a squad for soccer this Saturday"* → Initiates the team creation flow.
- *"Recommend courts in Miraflores"* → Lists sports complexes in the requested district.
- *"Translate to English"* → Temporarily changes the interface language.

### 3.5. Flow 5: FitCoins Management and Wallet Top-Up

FitCoins is the platform's virtual currency, with parity 1 FitCoin = S/ 1.00 PEN, used for bookings, split billing, and participation rewards:

1.  The user navigates to **My Wallet** (`/wallet`).
2.  The interface shows the current balance, a monthly expense chart, and transaction history with filters by date and type (top-up, debit, refund, bonus).
3.  To top up, the user presses **Top Up FitCoins** and enters an amount (minimum S/ 10.00, maximum S/ 500.00 per transaction).
4.  The system redirects to the Stripe Elements payment screen, which accepts credit/debit cards (Visa, Mastercard, American Express) and Yape (via payment link).
5.  Stripe processes the payment asynchronously. The backend receives confirmation via Webhook signed with HMAC-SHA256 and verifies payload integrity.
6.  Upon payment confirmation, the system increments the wallet balance and records the transaction in the `fitcoin_transactions` table with `"completed"` status.
7.  **Automatic Split Billing:** When a user organizes a shared booking, the system automatically debits the proportional amount from each participant's wallet before confirming the court. If any member has insufficient balance, they are notified and given 24 hours to top up before the booking is automatically canceled.
8.  **Activity bonuses:** The system credits FitCoins as rewards for milestones: 5 FitCoins for completing the sports profile, 10 FitCoins for the first match played, 3 FitCoins for each court review.

### 3.6. Flow 6: Squad Creation and Management

Squads are persistent teams that allow groups of players to organize recurring matches without individual matchmaking each time:

1.  The user accesses **My Squads** (`/squads`) and presses **Create Squad**.
2.  Completes the team data: name, main sport, target level (Beginner/Intermediate/Advanced), emblem (image upload with local NSFWJS moderation), recurring availability (fixed days and times), and member limit (minimum 4, maximum 30).
3.  The system generates a unique **8-character alphanumeric invitation code** that the creator shares with other players.
4.  Invited members enter the code on the **Join Squad** screen and remain in "pending" status until the squad leader confirms their entry.
5.  Once the squad is formed, the leader can schedule **automatic matches**: the system sends push notifications to all members, calculates expected attendance, and if the minimum quorum is reached (70% confirmation), proceeds to book the court using the squad's collective FitCoins balance.
6.  After each match, members can rate their teammates' attendance. Unexcused absences affect the individual Trust Score and may result in automatic expulsion after 3 offenses.
7.  The squad accumulates a **team Elo** that is displayed in a weekly and monthly leaderboard, encouraging competition between squads.

### 3.7. Flow 7: Sports Complex Administration (B2B Panel)

The B2B administration panel allows sports complex owners or managers to manage their offerings and view business metrics:

1.  The administrator logs in with B2B credentials and accesses the panel (`/b2b/dashboard`).
2.  The main dashboard shows an executive summary: monthly revenue, average occupancy, active bookings count, recent reviews, and cancellation rate.
3.  In the **Manage Courts** section (`/b2b/venues/manage`), the administrator can:
    - Add new courts specifying name, sport, price per hour, player capacity, and operating hours.
    - Mark special availability (weekend promotions, maintenance blocking).
    - Upload facility photos with automatic local NSFWJS moderation on the client.
4.  In the **Booking Calendar** section, a weekly view displays confirmed, pending, and canceled bookings. The administrator can manually confirm, reschedule, or cancel bookings.
5.  In the **Reports** section, interactive graphs are generated for: revenue by period, occupancy by court, most demanded sport, peak hours, and top 10 recurring players.
6.  The administrator configures **B2B commissions** (default 5% of each booking value), which are automatically settled at the end of each month via scheduled bank transfer.

### 3.8. Flow 8: Reports and Performance Statistics

The platform offers analytical dashboards for both the B2C user and the B2B administrator:

**Reports for the athlete (B2C):**
1.  The user accesses **My Performance** from the profile menu.
2.  Views a personal dashboard with the following indicators:
    - **Elo Evolution:** Line chart with the historical Elo score per match played (last 20 matches).
    - **Statistics by sport:** Wins, losses, draws, current streak, and best streak for each sport.
    - **Attendance:** Attendance percentage for confirmed matches, with penalty for absences.
    - **FitCoins earned/spent:** Monthly breakdown of wallet income and expenses.
    - **Heat map:** Areas of Metropolitan Lima where the user plays most frequently.

**Reports for the administrator (B2B):**
1.  The administrator accesses the **Advanced Statistics** section of the B2B panel.
2.  Reports include:
    - **Occupancy by time slot:** Weekly heatmap showing peak demand hours.
    - **Projected revenue:** Revenue prediction model based on historical trends and seasonality.
    - **B2B player retention:** Rate of players who repeat bookings at the complex within 30, 60, and 90-day periods.
    - **Local competition:** Anonymized comparison with average occupancy of similar complexes in the same district.
3.  All reports can be exported in PDF or CSV format for external presentation.

### 3.9. Common Troubleshooting

| Problem | Probable Cause | Solution |
|---|---|---|
| **No candidates appear in the feed** | Geolocation disabled or search radius too small | Turn on GPS on the device or expand the search radius in filters (> 5 km). |
| **Error processing card payment** | Insufficient funds, blocked card, or daily limit exceeded | Check available balance with the bank or try another card. Stripe automatically rejects amounts > S/ 500.00. |
| **Sporty's microphone doesn't work** | Microphone permission denied in the browser | Verify the browser has microphone permission (lock icon in the address bar). Sporty requires HTTPS. |
| **Push notifications not received** | Notifications disabled in the OS or browser | Enable notifications from the operating system or browser settings for the PWA. |
| **Leaflet map does not load** | OpenStreetMap blocked by corporate firewall or tracker blocking extension | Disable content blockers (uBlock, Privacy Badger) for the application domain. |
| **Session expired error** | JWT token expired (default max duration 1 hour) | Log out and log back in. The Supabase client auto-renews the token if the session is active. |
| **FitCoins top-up not reflected** | Stripe webhook delayed by network latency (up to 30 seconds) | Wait 30 seconds and refresh the page. If it persists, contact support with the Stripe transaction ID. |

---

## ⚙️ CHAPTER IV: TECHNICAL SYSTEM REQUIREMENTS

### 4.1. Server Hardware Requirements (Render)

| Component | Minimum Specification | Recommended Specification |
|---|---|---|
| **CPU** | 2 vCPU (Intel Xeon or AMD EPYC) | 4 vCPU |
| **RAM** | 4 GB | 8 GB |
| **Storage** | 20 GB SSD | 50 GB SSD |
| **Bandwidth** | 1 Gbps | 2 Gbps |
| **Operating System** | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS |
| **Runtime** | Node.js 22.x | Node.js 22.x |

### 4.2. Server Software Requirements

| Software | Version | Purpose |
|---|---|---|
| Node.js | 22.x LTS | Runtime for NestJS backend. |
| npm | 11.x | Package manager. |
| PostgreSQL | 15.x (Supabase managed) | Main database with PostGIS. |
| Redis | 7.x (Render managed) | BullMQ job queue and session cache. |
| PM2 | 5.x (or Render native cluster) | Production process manager. |

### 4.3. Client Requirements (Browser)

| Browser | Minimum Version | Required Features |
|---|---|---|
| Google Chrome | 120+ | Service Worker, MediaRecorder API, WebSocket, IndexedDB |
| Mozilla Firefox | 120+ | Service Worker, MediaRecorder API, WebSocket |
| Microsoft Edge | 120+ | Service Worker, MediaRecorder API, WebSocket |
| Safari (iOS) | 17+ | Service Worker (PWA iOS), limited MediaRecorder API |
| Samsung Internet | 23+ | Service Worker, MediaRecorder API |

**Connectivity requirements:** Stable internet connection (> 1 Mbps). The PWA requires HTTPS for all functionalities (Service Worker, geolocation, microphone, push notifications). Partial offline mode is supported for viewing cached feed in IndexedDB.

---

## 🔄 CHAPTER V: MAINTENANCE AND UPDATES

### 5.1. Deployment Strategy (CI/CD)

The project uses GitHub Actions as the continuous deployment orchestrator with the following pipeline:

```
[Code Push] → [GitHub Actions] → [Lint + TypeCheck] → [Unit Tests] → [Build]
    ↓
[Render Deploy] ← [Auto-approval if main branch] ← [Playwright E2E Tests]
    ↓
[Vercel Deploy] ← [Successful frontend build] ← [SonarQube Quality Gate]
```

**Branch policies:**
- `main`: Automatic production deployment after passing SonarQube Quality Gate.
- `develop`: Automatic staging deployment (Vercel preview + Render preview).
- `feature/*`: No automatic deployment; only local build and tests.

### 5.2. Maintenance Windows

| Maintenance Type | Frequency | Estimated Duration | Window | Notification |
|---|---|---|---|---|
| **Security patches (dependencies)** | Weekly | 15-30 min | Sunday 02:00-04:00 AM (GMT-5) | 48 hours in advance by email |
| **DB schema update (migrations)** | Monthly | 30-60 min | Sunday 02:00-06:00 AM (GMT-5) | 7 days in advance by email and in-app notification |
| **New feature releases** | Bi-weekly (each sprint) | No downtime (rolling update) | No time restriction | Changelog published at `/releases` |
| **Critical patches (hotfix)** | When needed | Variable | Immediate | Real-time notification via Slack channel |

### 5.3. Rollback Procedure

1. **Frontend (Vercel):** Vercel keeps the last 10 deployment versions. Rollback is executed from the Vercel dashboard by selecting a previous version. Estimated time: 2 minutes.
2. **Backend (Render):** Render keeps the last 5 successful builds. Rollback is executed via `scripts/infra/render-deploy.ps1` specifying the previous commit SHA. Estimated time: 5 minutes.
3. **Database:** Every schema migration includes a rollback script (`prisma migrate down`). For critical data, an automatic daily Supabase snapshot is taken with 7-day retention.

### 5.4. Monitoring and Alerts

| Service | Tool | Monitored Metrics | Alert Threshold |
|---|---|---|---|
| Backend Performance | Render Metrics + Sentry | TTFB > 500ms, CPU > 80%, RAM > 85% | Slack and email alert |
| Application Errors | Sentry (Performance + Errors) | Error rate > 1%, Apdex < 0.7 | Notification to #alerts on Slack |
| Availability | Uptime Robot (every 5 min) | HTTP response < 200ms | SMS + email if 2 consecutive checks fail |
| Database | Supabase Advisors + pg_stat_statements | Active connections > 80%, slow queries > 200ms | Alert on Supabase dashboard |
| Frontend | Vercel Analytics + Web Vitals | LCP > 2.5s, CLS > 0.1, INP > 200ms | Weekly email report
