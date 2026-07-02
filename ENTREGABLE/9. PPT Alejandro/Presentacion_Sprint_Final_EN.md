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

### 🛝 Slide 5: System Architecture (C4 Containers)
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

### 🛝 Slide 6: Key Software Modules and Innovation
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

### 🛝 Slide 7: Software Quality Control (QA) and Security
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

### 🛝 Slide 8: Financial Viability and Return on Investment
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

### 🛝 Slide 9: Conclusions and Recommendations
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
