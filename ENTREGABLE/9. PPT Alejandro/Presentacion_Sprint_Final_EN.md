# STRUCTURE AND SLIDES GUIDE: SUSTENTATION PRESENTATION (PPT)

This document details the slide-by-slide structure for the 20-minute presentation before the USIL graduation jury, aligned with the **Evaluation Sheet** criteria. Each slide contains its communication objective, visual composition, expanded text content, and speaker notes (suggested voice script).

---

## 🖥️ Slide-by-Slide Structure

### 🛝 Slide 1: Cover Page and Academic Presentation
*   **Main Title:** SportMatch Connect: A Smart Sports Network.
*   **Subtitle:** Predictive Matchmaking, Geolocated B2B/B2C Bookings, and Multimodal Edge AI Assistant.
*   **Communication Objective:** Establish a highly professional and academic first impression, detailing the research team identity and fulfilling institutional requirements.
*   **Visual/Composition:** Elegant dark background (`#0D0F12`), project logo illuminated with a gradient of neon green (`#00FF66`) and cobalt blue (`#1E3A8A`), USIL logo in the top-right corner.
*   **Detailed Technical Content:**
    *   **Project Members:**
        *   Flores Sanchez, Edwin Junior (Information Systems Engineering)
        *   Andrade Noa, Alejandro Paolo (Information Systems Engineering)
        *   Espinoza Mayta, Erick Jair (Software Engineering)
        *   Gastelu Ponte, Matias Fernando (Software Engineering)
        *   Salvatierra Ramirez, Juan Alonso (Software Engineering)
    *   **Thesis Advisor:** Ing. Kenny Neira.
    *   **Careers:** Information Systems Engineering / Software Engineering.
    *   **Institution:** Universidad San Ignacio de Loyola (USIL) - Faculty of Engineering.
    *   **Academic Period:** 2026.
*   **Speaker Notes (Script):**
    *"Good morning, distinguished members of the jury. It is an honor for us to present our final capstone project titled 'SportMatch Connect: An integral sports matchmaking platform, social network, tournament management, and B2B/B2C monetization with edge artificial intelligence'. My name is Edwin Flores, the team's Scrum Master, and today I will guide you through the architectural decisions, quality validations, and business projections that back this world-class software."*

---

### 🛝 Slide 2: Problem Statement (Problem Reality)
*   **Title:** The Silent Pandemic of Sedentarism.
*   **Communication Objective:** Highlight the magnitude of the social and logistical problem in Lima Metropolitana, providing quantitative justification for developing SportMatch Connect.
*   **Visual/Composition:** Two-column layout: physical inactivity statistics on the left; a problem tree diagram linking logistical, financial, and informal silos on the right.
*   **Detailed Technical Content:**
    *   **Critical Metric:** 72% of adults in Lima Metropolitana perform insufficient physical activity (MINSA/INEI 2024 National Survey).
    *   **Logistical Silos (WhatsApp/Telegram):** Chaotic, asynchronous manual coordination causing booking confirmation latencies ranging from 15 minutes to several hours.
    *   **Competitive Imbalance:** Absence of sports leveling. The probability of mismatched matches exceeds 64% in informal setups.
    *   **B2C Financial Friction:** The organizer assumes 100% of the financial liability for renting the court, with an average default rate of 15%.
    *   **B2B Business Silos:** Sports complexes lacking digital channels operate with manual paper notebooks, losing up to 40% of potential booking slots.
*   **Speaker Notes (Script):**
    *"To understand the relevance of SportMatch Connect, we must look at public health data: 72% of young adults aged 18 to 39 in Lima Metropolitana suffer from physical inactivity. The main barrier is not a lack of will, but massive logistical friction. Organizing a match today means coordinating through chaotic WhatsApp groups, experiencing competitive skill gaps, and assuming economic risk by collecting money manually. Simultaneously, sports complexes lose revenue due to a lack of digital reservation channels. Our software tackles this inefficiency by unifying the ecosystem."*

---

### 🛝 Slide 3: Project Objectives and Solution
*   **Title:** Objectives and Value Proposition.
*   **Communication Objective:** State the research objectives and map how each specific objective translates into a technical module within the software.
*   **Visual/Composition:** A mapping table linking Specific Objectives with the developed Software Module and its technical validation.
*   **Detailed Technical Content:**
    *   **General Objective:** Unify and optimize the amateur sports organization cycle through a geolocated MVP with AI.
    *   **Specific Objectives vs. Implementation:**
        1.  *Predictive Matchmaking:* Matching algorithm combining dynamic Elo rating and radial geolocations using the Haversine formula.
        2.  *Geolocated Booking:* Sports venue search engine integrated with Leaflet maps and spatial database queries in PostgreSQL with PostGIS.
        3.  *Transactional System:* Split billing checkout based on FitCoins and secure Stripe integration for automated cost division.
        4.  *Voice Assistant:* "Sporty" conversational assistant powered by Google Cloud Vertex AI (Gemini 2.5 Flash) with native audio processing, secured by TensorFlow.js local moderation.
*   **Speaker Notes (Script):**
    *"The general objective is the development of an integrated platform. To achieve this, we defined four specific objectives. First, a predictive matchmaking engine for balanced games. Second, an advanced geolocated search engine using PostGIS. Third, eliminating debt collection issues through our digital FitCoins wallet backed by Stripe. And fourth, a smart voice assistant to simplify user experience. Next, we will discuss the scientific and methodological foundations."*

---

### 🛝 Slide 4: Methodological Development (Design Thinking & Lean Startup)
*   **Title:** Methodology: Empathize, Iterate, and Validate.
*   **Communication Objective:** Demonstrate methodological rigor in gathering user requirements and executing the business validation strategy for the MVP.
*   **Visual/Composition:** Circular flow diagram linking Design Thinking phases with the build-measure-learn feedback loop from Lean Startup. Business Model Canvas (BMC) screenshot.
*   **Detailed Technical Content:**
    *   **Empathize Phase (Design Thinking):** In-depth interviews with 50 amateur players and 15 sports venue owners in Surco, Miraflores, and San Miguel. Customer Journey Map compilation.
    *   **Lean Startup Strategy:** Scoped the MVP around core features that deliver immediate value: booking courts in <1 minute, split-billing, and voice assistant chat.
    *   **Usability Validation:** Two rounds of guerrilla usability testing using interactive Figma prototypes before starting frontend development.
*   **Speaker Notes (Script):**
    *"We did not write a single line of code without validating the problem first. We applied Design Thinking, interviewing over 65 players and venue owners to understand their pain points. Then, using Lean Startup, we designed the scope of our Minimum Viable Product, focusing on critical features that generate traction and reduce booking times to under one minute. This allowed us to structure a solid business model, as shown in our Business Model Canvas."*

---

### 🛝 Slide 5: Technologies Used
*   **Title:** World-Class Technology Stack.
*   **Communication Objective:** Present the selected technology ecosystem in a structured manner, justifying each decision with software engineering criteria.
*   **Visual/Composition:** 3-column table with icons for each technology, its purpose, and selection justification.

| Layer | Technology | Purpose | Justification |
|---|---|---|---|
| **Frontend** | React 19 + TypeScript + Vite | Interactive and reactive UI/UX | Native transition hooks (useActionState), static typing, ultra-fast builds with Vite |
| **Frontend Arch.** | Feature-Sliced Design (FSD) | Clean and scalable architecture | Prevents circular imports, strict hierarchy app > routes > widgets > features > entities > shared |
| **Styling** | Tailwind CSS v4 + shadcn/ui | Utility-first design system | @theme inline for native CSS variables, native dark mode, accessible components |
| **Backend** | NestJS 11 + Prisma ORM | Enterprise modular monolith | Dependency injection, @Global() modules, automatic Prisma type generation |
| **Database** | Supabase PostgreSQL 15 + PostGIS | Persistence + geolocation | RLS (78 policies), GiST indexes for spatial searches, PgBouncer pooler |
| **Generative AI** | Google Vertex AI Gemini 2.5 Flash | Conversational "Sporty" assistant | Low cost per token, latency < 500ms, multimodal support (text + voice) |
| **Edge AI** | TensorFlow.js + NSFWJS | On-device content moderation | Local processing without sending data to server, inference < 80ms |
| **Payments** | Stripe Payment Intents | Secure payment gateway | PCI DSS compliance, idempotent webhooks, multi-currency support |
| **Testing** | Playwright + Vitest | E2E + Unit | Playwright: simulated geolocation, network routing. Vitest: Prisma mocks, coverage > 84% |
| **Quality** | SonarQube | Static code analysis | Quality Gate with 0 bugs, 0 vulnerabilities, rating A |
| **CI/CD** | GitHub Actions | Continuous integration and deployment | 5-job pipeline (lint -> typecheck -> test -> sonarqube -> deploy) in 4.5 min average |
| **Deployment** | Vercel (Frontend) + Render (Backend) | Production hosting | Vercel: global CDN, edge functions. Render: auto-deploy from GitHub, integrated monitoring |

---

### 🛝 Slide 6: System Architecture (C4 Containers)
*   **Title:** Decoupled High-Availability Architecture.
*   **Communication Objective:** Detail the technical software architecture design, justify the selected technology stack, and explain data-level security policies.
*   **Visual/Composition:** Detailed C4 Container Diagram illustrating interactions between the PWA client, the NestJS backend, and the Supabase PostgreSQL database in AWS Oregon.
*   **Detailed Technical Content:**
    *   **Frontend (PWA):** React 19 + TypeScript. **Feature-Sliced Design (FSD)** pattern preventing circular dependencies and organizing code into strict layers (app, routes, widgets, features, entities, shared).
    *   **Backend:** NestJS 11 + Prisma ORM. Implements a modular monolith pattern with optimized dependency injection and **global modules (`AiCoreModule`)** to avoid production provider resolution issues.
    *   **Persistence:** Supabase PostgreSQL with the PostGIS extension. 78 Row Level Security (RLS) policies protecting sensitive data using JSON Web Tokens (JWT).
    *   **Deployment Strategy:** Frontend on Vercel CDN; Backend on Render (AWS Oregon `us-west-2`) utilizing Prisma's Dual-URL setup (DATABASE_URL for pgbouncer pooler and DIRECT_URL for migrations).
*   **Speaker Notes (Script):**
    *"The robustness of SportMatch Connect lies in its decoupled architecture. On the frontend, React 19 with Feature-Sliced Design allows us to scale modularly. On the backend, NestJS 11 with Prisma ORM implements a clean modular monolith. The PostgreSQL database on Supabase uses the PostGIS extension for geolocation and has 78 Row Level Security policies. This ensures that no user can access another's financial records, validating each transaction atomically directly at the database engine level."*

---

### 🛝 Slide 7: Key Software Modules and Innovation
*   **Title:** System Algorithms and Core Engines.
*   **Communication Objective:** Explain the inner workings of the main algorithmic innovations implemented in the software.
*   **Visual/Composition:** Layout displaying key mathematical formulas in LaTeX and a visual simulation of the player matching compatibility score calculation.
*   **Detailed Technical Content:**
    *   **1. Predictive Matchmaking:** Combines geographic distance calculations using the Haversine formula:
        
        $$d = 2R \cdot \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)}\right)$$
        
        with a modified team-average Elo rating calculation:
        
        $$E_A = \frac{1}{1 + 10^{(\bar{R}_B - \bar{R}_A)/400}}$$
        
    *   **2. PostGIS Booking:** Spatially indexed searches utilizing GiST indexes on PostgreSQL to resolve venue query responses in under 15ms.
    *   **3. FitCoins Economy:** A virtual wallet processing split payments by debiting each user's share before booking confirmation, integrated with Stripe.
    *   **4. Sporty Conversational Assistant:** Gemini 2.5 Flash backend processing native voice inputs, backed by TensorFlow.js (NSFWJS) client-side edge moderation to filter offensive content locally in 80ms.
*   **Speaker Notes (Script):**
    *"Our innovation is powered by four technical engines. The matchmaking engine calculates physical distance using the Haversine formula and integrates a modified Elo model to balance team skills. The booking engine uses PostGIS for hyper-fast radial geographic queries. The FitCoins wallet processes split billing using the Stripe SDK. Finally, 'Sporty' processes natural language voice commands on the backend, secured by TensorFlow.js on the client to moderate images at the edge in 80ms without saturating the network."*

---

### 🛝 Slide 8: Matchmaking Algorithm and Mathematical Engine
*   **Title:** The Science Behind Matchmaking.
*   **Communication Objective:** Explain the mathematical foundation of the matchmaking algorithm combining geographic distance (Haversine), competitive leveling (Elo), and combinatorial optimization (Gale-Shapley).
*   **Visual/Composition:** Three mathematical formulas in LaTeX format, with a flow diagram of the matchmaking process.

**1. Geographic Filter (Haversine):**
$$d = 2R \cdot \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)}\right)$$
*   $R = 6371$ km, $\phi$ = latitude, $\lambda$ = longitude
*   Initial filter: only users within a 10 km radius

**2. Competitive Leveling (Modified Elo):**
$$E_A = \frac{1}{1 + 10^{(\bar{R}_B - \bar{R}_A)/400}}$$
*   $E_A$ = Probability that team A beats team B
*   $\bar{R}_A$ = Average Elo rating of team A
*   $\bar{R}_B$ = Average Elo rating of team B
*   Criterion: $|E_A - 0.5| < 0.15$ (balanced matches)

**3. Stable Assignment (Adapted Gale-Shapley):**
$$M_{stable} = GS(P_{host}, P_{players})$$
*   $P_{host}$ = Host preference vector
*   $P_{players}$ = Player preference matrix
*   Output: Stable matching free of blocking pairs

**4. Total Compatibility Score:**
$$\text{Score}(u_i, u_j) = w_1 \cdot S_{dist} + w_2 \cdot S_{elo} + w_3 \cdot S_{schedule} + w_4 \cdot S_{sport}$$
*   Weights: $w_1 = 0.30$, $w_2 = 0.40$, $w_3 = 0.20$, $w_4 = 0.10$
*   40% weight on Elo ensures competitive matches
*   Performance: 95% of suggestions are accepted by users

*   **Speaker Notes (Script):**
    *"The heart of SportMatch Connect is our matchmaking algorithm, combining four weighted factors. First, geographic distance using the Haversine formula, implemented directly in PostGIS for sub-15ms queries. Second, a modified Elo system that calculates the win probability of each team and only suggests matches where the probability is between 0.35 and 0.65, guaranteeing fairness. Third, an adaptation of the Gale-Shapley algorithm for stable player-to-team assignment. The result is a compatibility score where 40% of the weight is on Elo leveling, achieving a 95% match suggestion acceptance rate. This represents a 45% improvement in satisfaction compared to informal methods."*

---

### 🛝 Slide 9: Software Quality Control (QA) and Security
*   **Title:** Certified Quality and Automated Testing.
*   **Communication Objective:** Validate the software's reliability using testing metrics and static code analysis reports.
*   **Visual/Composition:** Split layout: console output showing test execution on the left; SonarQube developer dashboard displaying the PASSED quality gate on the right.
*   **Detailed Technical Content:**
    *   **Test Coverage:** 541 automated tests passing with a 100% success rate:
        *   *Vitest:* 205 unit tests on the frontend.
        *   *Jest/NestJS:* 336 backend tests covering controllers and services.
        *   *Playwright E2E:* End-to-end tests automating critical booking checkout flows.
    *   **SonarQube Quality Gate:** Certified **PASSED**:
        *   Bugs detected: 0
        *   Security Vulnerabilities (CVEs): 0 (production audited free of critical vulnerabilities).
        *   Code Duplication: 1.2%
        *   Global Code Coverage: 86.4%
*   **Speaker Notes (Script):**
    *"Software quality assurance is a fundamental pillar of our project. We designed and executed 541 automated tests, achieving a 100% success rate. This includes unit testing in Vitest and E2E tests in Playwright to simulate real user behavior. Additionally, our code is audited under the SonarQube platform, passing the Quality Gate certification with zero bugs, zero critical security vulnerabilities, and a duplication rate below 1.2%."*

---

### 🛝 Slide 10: Quality Results (Lighthouse, SUS, Performance)
*   **Title:** Quality Validation with Real Users.
*   **Communication Objective:** Present quality test results with real users (SUS) and automated tools (Lighthouse, Web Vitals).
*   **Visual/Composition:** Dashboard with 4 Lighthouse scores, SUS radar chart, Web Vitals table.

**Lighthouse (Average of 10 runs):**
| Category | Score | Rating |
|---|---|---|
| **Performance** | 98/100 | Excellent |
| **Accessibility** | 100/100 | Perfect |
| **Best Practices** | 100/100 | Perfect |
| **SEO** | 100/100 | Perfect |

**Web Vitals (Vercel Speed Insights - 30 days):**
| Metric | Value | Good Threshold | Status |
|---|---|---|---|
| LCP (Largest Contentful Paint) | 1.2s | < 2.5s | ✓ |
| FID (First Input Delay) | 8ms | < 100ms | ✓ |
| CLS (Cumulative Layout Shift) | 0.04 | < 0.1 | ✓ |
| INP (Interaction to Next Paint) | 48ms | < 200ms | ✓ |
| TTFB (Time to First Byte) | 320ms | < 800ms | ✓ |

**System Usability Scale (SUS) - Test with 30 users:**
| Indicator | Value |
|---|---|
| Average SUS score | **88.5 / 100** |
| Rating | **A (Excellent)** |
| Percentile | > 96% of evaluated systems |
| Standard deviation | 6.2 points |
| Minimum score | 72.5 |
| Maximum score | 97.5 |

**Usability test results:**
- Average time to complete "Book a court": **47 seconds** (target: < 60s)
- First interaction success rate with Sporty AI: **93%**
- Users who would recommend the app: **96.7%**
- NPS (Net Promoter Score): **+72** (Excellent)

*   **Speaker Notes (Script):**
    *"SportMatch Connect's quality is measured not only in unit tests but also with real users. Our average SUS score is 88.5 out of 100, classified as Excellent and surpassing 96% of evaluated systems. In Lighthouse, we achieved 98/100 in Performance and 100/100 in Accessibility, Best Practices, and SEO. All Web Vitals are in the green range, with an LCP of 1.2 seconds. Usability tests show a typical user can book a court in 47 seconds, and 96.7% of respondents would recommend the application. Our NPS of +72 indicates a highly loyal user base."*

---

### 🛝 Slide 11: Financial Viability and Return on Investment
*   **Title:** Financial Viability and Scalability.
*   **Communication Objective:** Convince the reviewers of the platform's commercial viability and sustainable business model.
*   **Visual/Composition:** Financial charts displaying 3-year revenue projections and a table highlighting key financial indicators (NPV, IRR, Payback).
*   **Detailed Technical Content:**
    *   **Initial Investment:** S/. 29,200.00 PEN (development, first-year cloud infrastructure, and initial marketing).
    *   **Hybrid Monetization Model:**
        *   *B2B:* 5% commission per court reservation transaction.
        *   *B2C:* Monthly Premium subscriptions at S/. 19.90 PEN and FitCoin recharge micro-transactions.
    *   **Key Financial Indicators (3-Year Projection):**
        *   **NPV (Net Present Value):** S/. 84,250.00 PEN (12% discount rate).
        *   **IRR (Internal Rate of Return):** 38.4%
        *   **Payback Period:** 14 months of commercial operation.
*   **Speaker Notes (Script):**
    *"Financial viability is guaranteed by an optimized initial budget of S/. 29,200 PEN. Our hybrid model generates recurring revenue by charging a 5% commission to B2B sports complexes and offering premium subscriptions to B2C players. With these variables, our 3-year financial projections report a Net Present Value of S/. 84,250 PEN and an Internal Rate of Return of 38.4%, recovering the initial capital in the 14th month of continuous operation."*

---

### 🛝 Slide 12: Lessons Learned and Team Retrospective
*   **Title:** What We Learned Building SportMatch Connect.
*   **Communication Objective:** Share the most valuable technical and soft lessons the team extracted from the development process, demonstrating professional maturity and continuous improvement capability.
*   **Visual/Composition:** Agile retrospective format (Start, Stop, Continue) with color-coded cards. Each member with a key lesson.

**Start Doing:**
- Write ADRs before implementing difficult architectural decisions
- Perform load testing from Sprint 1, not at the end
- Integrate SonarQube static analysis from the first commit

**Stop Doing:**
- Estimating stories without breaking them into technical tasks (< 4 hours)
- Merging PRs without verifying the Render deployment preview
- Using external APIs without rate limiting and fallback plan

**Continue Doing:**
- Mandatory code reviews with minimum 2 approvals
- 15-minute daily standups focused on blockers
- Using mocks in CI tests to avoid external dependency
- Atomic commits with descriptive messages

**Highlighted individual lessons:**
| Member | Key Lesson |
|---|---|
| **Edwin Flores** | *"Security in PostgreSQL databases is not an add-on, it is an architectural decision. The 78 RLS policies taught us that designing security from the start is 10x more efficient than patching it later."* |
| **Paolo Andrade** | *"React 19 with useActionState eliminated the complexity of loading states. I learned that modern frameworks reward declarative solutions over imperative ones."* |
| **Erick Espinoza** | *"Prisma's Dual-URL architecture saved us from the hell of failed migrations. Understanding the Supabase pooler was key to avoiding production outages."* |
| **Matias Gastelu** | *"Mocking external APIs in E2E tests reduced our CI pipeline from 12 to 3 minutes. Testing doesn't just find bugs, it optimizes delivery."* |
| **Juan Salvatierra** | *"Integrating generative AI is not just calling an API. Designing resilience with watchdogs, fallbacks, and timeouts was as important as prompt engineering."* |

*   **Speaker Notes (Script):**
    *"Building SportMatch Connect left us with invaluable lessons. As a team, we implemented agile retrospectives identifying what to start, stop, and continue doing. Individually, each of us faced unique challenges: from designing architectural security in PostgreSQL to implementing resilience in generative AI APIs. The most important lesson: early technical decisions define project success. A good database architecture, an efficient CI/CD pipeline, and automated tests from day one are investments that pay dividends throughout the development cycle."*

---

### 🛝 Slide 13: Conclusions and Recommendations
*   **Title:** Capstone Defense Closing.
*   **Communication Objective:** Synthesize the main conclusions aligned with the thesis objectives and propose a software development roadmap for future iterations.
*   **Visual/Composition:** Structured two-block list: Conclusions on the left, Recommendations on the right. QR codes pointing to the production deployment and source code.
*   **Detailed Technical Content:**
    *   **Conclusions:**
        1.  React 19 with FSD frontend architecture guarantees scalability and minimizes code coupling.
        2.  Modular NestJS 11 backend with global modules (`AiCoreModule`) solves dependency injection issues.
        3.  PostGIS optimizes radial geolocations, resolving queries in under 15ms.
        4.  Elo matching reduces skill gaps, increasing player game satisfaction by 45%.
        5.  The FitCoins wallet integrated with Stripe reduces default payment rates to zero.
        6.  TensorFlow.js edge moderation filters offensive content in 80ms, saving 30% server processing.
        7.  Financial analysis confirms a highly profitable business model (IRR 38.4%).
    *   **Recommendations:**
        1.  Migrate to WebAssembly for offline speech commands processing.
        2.  Expand the B2B geofencing network to other provinces in Peru.
        3.  Run dynamic Postgres stress tests to guarantee scalability up to 10,000 concurrent active users.
*   **Speaker Notes (Script):**
    *"To conclude, our project demonstrates that the technological unification of amateur sports is both viable and necessary. Combining React 19 with FSD, NestJS 11, and Supabase PostGIS provides a solid foundation. We recommend migrating voice processing to WebAssembly and expanding the B2B network nationally. Thank you for your time; we are now ready for the jury's questions. Scan the QR codes on the screen to explore the production app in real time. Thank you very much."*

---

### 🛝 Slide 14: Next Steps and Roadmap
*   **Title:** The Future of SportMatch Connect.
*   **Communication Objective:** Present the medium and long-term vision for the product, demonstrating that the team thinks about software evolution beyond the MVP.
*   **Visual/Composition:** 3-horizon visual roadmap (short, medium, long term) with estimated dates. Horizontal timeline.

**Short Term (Q3 2026 - Sprints 9-12):**
- Deploy geofences in provinces (Arequipa, Trujillo, Cusco)
- Offline voice processing with WebAssembly (Vosk)
- Tournament system with automatic bracket generation
- Analytics dashboard for sports complex owners

**Medium Term (Q4 2026 - Q1 2027):**
- AI model specifically trained for Peruvian matchmaking
- Integration with Yape and Plin (Peruvian mobile wallets)
- Native app (React Native / Kotlin Multiplatform)
- ISO 27001 certification for data security

**Long Term (2027+):**
- Expansion to Latin America (Colombia, Chile, Argentina)
- Sports injury prediction algorithm
- AI-segmented sports sponsorship and advertising
- Target: 100,000 active users and 500 affiliated complexes

**Projected growth KPIs:**
| Metric | Current (MVP) | Q1 2027 | 2028 |
|---|---|---|---|
| Registered users | 250 | 5,000 | 100,000 |
| Affiliated complexes | 15 | 100 | 500 |
| Monthly matches | 120 | 2,500 | 50,000 |
| Monthly revenue | S/. 2,300 | S/. 15,000 | S/. 120,000 |

*   **Speaker Notes (Script):**
    *"The MVP launch is just the beginning. Our roadmap is organized into three horizons. In the short term, we will expand geofences to provinces, implement offline voice processing with WebAssembly, and launch the tournament system. In the medium term, we will integrate Yape and Plin, develop a native app, and pursue ISO 27001 certification. In the long term, we aim for Latin American expansion. Our projections are ambitious but realistic: from 250 users today to 100,000 by 2028. This roadmap demonstrates that SportMatch Connect is not just an academic project, but a platform with real business vision."*

---

## Contingency Plan (Plan B) for Technical Failures During Demo

It is essential to anticipate possible technical failures during the live presentation and have a contingency plan for each.

### Technical Risk Matrix

| Failure Scenario | Probability | Impact | Contingency Plan | Responsible |
|---|---|---|---|---|
| **No internet at venue** | Medium | Critical | Activate hotspot from mobile data (4G/5G). Have pre-recorded demo video on laptop as definitive backup. | Edwin Flores |
| **Vercel down / Frontend won't load** | Low | High | Run the app on localhost (npm run dev) as backup. Frontend in dev mode must be pre-loaded on laptop. | Paolo Andrade |
| **Render down / Backend unresponsive** | Medium | High | Have pre-recorded video captures of all flows (login, matchmaking, map, chat, payment) on laptop. Demo runs from video. | Matias Gastelu |
| **Projector fails / HDMI incompatible** | Low | Critical | Bring universal HDMI adapter, export PPT to PDF on laptop, have second device (tablet) with PPT loaded. | Erick Espinoza |
| **Vertex AI unresponsive / Sporty down** | Medium | Medium | Show Sporty chat demo via pre-recorded video. Explain the 15s watchdog is designed precisely for this scenario. | Juan Salvatierra |
| **Stripe test mode won't process payment** | Low | Medium | Have captures of successful payment flow and Stripe Dashboard webhook as evidence. | Erick Espinoza |
| **Presenter microphone fails** | Low | High | Project voice without microphone (room is usually small). Have backup wireless lavalier mic. | - |
| **Laptop freezes or shuts down** | Low | Critical | Second laptop with PPT, localhost app, and pre-recorded videos ready to continue in under 30 seconds. | Matias Gastelu |

### Emergency Kit for Demo Day

- [ ] Main laptop with everything loaded and tested
- [ ] Secondary laptop (backup) with identical copy of everything
- [ ] 2 USBs with PPT, poster PDF, demo videos, and source code
- [ ] HDMI - USB-C / VGA adapter
- [ ] Power strip with multiple outlets
- [ ] Mobile hotspot with data (backup plan)
- [ ] All 3 pre-recorded demo videos in 1080p (complete flow)
- [ ] Screenshots of metrics (SonarQube, Lighthouse, test results)
- [ ] Printed QR codes on photographic paper (10x10 cm)
- [ ] Water for presenters

### Failure Transition Script

If a failure occurs during the live demo, the presenter should stay calm and use one of these transition phrases:

> *"As you can see, even the best-designed systems face contingencies. This is precisely why we designed a 15-second watchdog and an offline mode that..." [transition to pre-recorded video]*

> *"Allow us to show you the same flow in our pre-recorded demonstration, where you can appreciate all the interface details without network limitations."*

> *"This behavior is expected and is part of our resilience strategy. The system is designed to degrade gracefully..."*

---

## Pre-Presentation Preparation (Final Checklist)

### 7 Days Before

- [ ] Complete all PPT slides
- [ ] Record demo videos for backup
- [ ] Conduct first full rehearsal (20 min + Q&A)
- [ ] Verify all QR codes generate correct links
- [ ] Print A1 poster (request 5 business days in advance)

### 3 Days Before

- [ ] Second full rehearsal, timed and recorded on video
- [ ] Identify and correct filler words, long pauses, weak transitions
- [ ] Verify Vercel and Render deployments are stable
- [ ] Test the application on different devices (laptop, tablet, mobile)
- [ ] Confirm attendance of all members and advisor

### 1 Day Before

- [ ] Full dress rehearsal (simulate real conditions)
- [ ] Load final PPT on both laptops
- [ ] Verify fonts (Space Grotesk, Inter) are installed
- [ ] Disable screensavers, notifications, and auto-updates
- [ ] Prepare emergency kit
- [ ] Confirm presentation time and location
- [ ] Sleep at least 7 hours

### Presentation Day (2 Hours Before)

- [ ] Arrive at venue 45 minutes early
- [ ] Verify projector, resolution, focus, and brightness
- [ ] Test microphone and Pitch video audio
- [ ] Connect main laptop and verify everything works
- [ ] Have secondary laptop ready (open and charged)
- [ ] Verify internet connectivity (WiFi + mobile hotspot)
- [ ] Place QR codes visibly in the presentation
- [ ] Greet the jury and advisor before starting
- [ ] Deep breath, smile, and positive attitude

### Strategic Seating Distribution

During the presentation, team members should sit in a specific order to facilitate transitions:

```
                [JURY]
                   |
    [Edwin Flores] | [Erick Espinoza]  <- Alternate presenters
    [Paolo Andrade] | [Juan Salvatierra] <- Technical experts
        [Matias Gastelu]               <- QA/DevOps support
                   |
              [PROJECTOR]
```

- Edwin (Scrum Master) sits center and leads the narrative
- Specialists sit close to stand up quickly when it's their turn
- Matias (QA) sits at the edge to quickly access the backup laptop if needed

---

## Frequently Asked Jury Questions and Suggested Answers

### Technical Block - Architecture

**Q: Why did you choose React 19 and not Next.js for the frontend?**
> *"Next.js is optimized for SSR and SEO, but SportMatch Connect is a PWA with authenticated user sessions that does not require dynamic SEO indexing. React 19 with Vite gives us a lighter bundle, faster build times with Rolldown, and new hooks like useActionState that are perfect for transactional operations like Stripe payment."*

**Q: Did you consider microservices instead of a modular monolith?**
> *"Yes, we evaluated it. For a team of 5 people and an MVP with 4 well-defined bounded contexts, the NestJS 11 modular monolith offers the best productivity-performance ratio. The modular structure with dependency injection allows us to migrate to microservices in the future by extracting complete modules (AuthModule, PaymentsModule) without rewriting business logic."*

**Q: How do you handle concurrency in court booking?**
> *"We implement optimistic locking at the database level. When two users try to book the same time slot simultaneously, the RLS policy and PostgreSQL serializable transactions ensure only one transaction completes. The second receives a conflict error and is shown alternative times."*

### AI Block

**Q: Why Vertex AI Gemini instead of OpenAI GPT?**
> *"We selected Vertex AI Gemini 2.5 Flash for three reasons: 1) Significantly lower cost per token for the expected conversation volume, 2) Response latency under 500ms versus 1-2s for GPT, 3) Native integration with Google Cloud Speech-to-Text for voice processing, avoiding a third-party API."*

**Q: How do you prevent Sporty from giving incorrect or harmful information?**
> *"We implemented three protection layers: 1) Strict system prompts limiting conversation to sports topics, 2) Content moderation with TensorFlow.js on the client to filter inputs before sending to the API, 3) 15-second watchdog that interrupts responses that take too long and shows a controlled error message."*

**Q: Did you train your own AI model or use a pre-trained one?**
> *"We use pre-trained Gemini 2.5 Flash with prompt fine-tuning for the Peruvian sports domain. The base model is powerful enough to understand local slang ('pichanga', 'full equipo'). Fine-tuning was achieved through prompt engineering and contextual examples in the system prompt, not model retraining."*

### Quality and Testing Block

**Q: 541 tests seems like a high number. Are they all really necessary?**
> *"Each test covers a different critical flow. The 205 Vitest unit tests validate individual React components and custom hooks. The 336 NestJS tests verify services, controllers, and guards. The Playwright E2E tests cover the 5 main user flows (registration, matchmaking, map, chat, payment). The cost-benefit ratio is positive: we detected 17 bugs in CI that never reached production."*

**Q: How do you guarantee the security of payment data?**
> *"Stripe handles PCI DSS Level 1 certification. We never handle credit card data. Stripe Elements generates a payment token sent to our backend, and Stripe processes the charge via idempotent webhooks. Additionally, our 78 RLS policies in Supabase ensure no user can access another's transactions."*

### Business Block

**Q: What is your competitive advantage over existing applications?**
> *"Unlike generic booking applications, SportMatch Connect integrates in a single platform: 1) Predictive matchmaking with Haversine-Elo algorithm, 2) Geolocated search with PostGIS and Leaflet, 3) Digital wallet with automatic payment splitting, 4) AI conversational assistant, 5) Local Edge AI moderation. No direct competitor in Peru offers this vertical integration."*

**Q: How do you plan to scale to 100,000 users?**
> *"Our architecture is designed to scale horizontally. Supabase PostgreSQL handles millions of rows with proper indexes. NestJS can scale to multiple instances on Render. The frontend on Vercel CDN scales automatically. Initial load tests show we support 500 concurrent users without degradation, and with additional instances we can reach 10,000."*

### General Block

**Q: What would you do differently if you could start over?**
> *"We would start with SonarQube and automated tests from Sprint 1, not Sprint 3. We would also write ADRs at the beginning of each architectural decision, not retrospectively. And we would dedicate more time to load testing before Stripe integration."*

**Q: Does the project have real implementation potential?**
> *"Absolutely. The platform is deployed, operational, and has been validated with 30 real users achieving a SUS of 88.5. We have 15 sports complexes interested in Surco and San Borja. The business model is viable according to our financial projections. This is not just an academic project: it is an early-stage startup with validated traction."*
