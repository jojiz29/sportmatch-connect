# STRUCTURE AND SLIDES GUIDE: SUSTENTATION PRESENTATION (PPT)

This document details the slide-by-slide structure for the 20-minute presentation before the jury, aligned with the **Evaluation Sheet** criteria.

---

## 🖥️ Slide-by-Slide Structure

### Slide 1: Cover Page (Title and Team Members)
*   **Title:** SportMatch Connect: A Smart Sports Network.
*   **Subtitle:** Predictive Matchmaking, Geolocated Booking, and Multimodal Edge AI Assistant.
*   **Visual:** Project logo, elegant black background.
*   **Required Copy:** Team Members (Edwin, Paolo, Erick, Matías, Juan) with DNI and codes, Information Systems Engineering / Software Engineering career at USIL, Advisor (Ing. Kenny Neira), Block, and year (2026).

### Slide 2: Problem Statement
*   **Title:** The Silent Pandemic of Sedentarism.
*   **Key Metrics:** 72% of adults perform insufficient physical activity in Lima (MINSA 2024).
*   **Coordination Frictions:** Chaos in WhatsApp coordination, payment default, and venues using arcaic phone bookings.
*   **Visual:** Problem tree diagram and visual chat screenshots.

### Slide 3: Project Objectives
*   **Title:** Objectives and Proposed Solution.
*   **General Objective:** Unify the amateur sports organization cycle through a geolocated MVP with AI.
*   **Specific Objectives:** Matchmaking algorithm, PostGIS map, Stripe payment flow, and conversational voice assistant "Sporty".

### Slide 4: Methodological Development
*   **Title:** Methodology: Design Thinking and Lean Startup.
*   **DT:** Empathize (User Journey) $\rightarrow$ Test (usability validation) phases.
*   **Lean Startup:** MVP commercial value and player retention hypothesis.
*   **Visual:** Flowchart of methodological stages and Business Model Canvas (BMC).

### Slide 5: System Architecture
*   **Title:** Decoupled Multi-layer Architecture.
*   **Frontend:** React 19 + TypeScript organized with Feature-Sliced Design (FSD).
*   **Backend:** Modular NestJS 11 + Prisma ORM.
*   **Persistence:** Supabase PostgreSQL with PostGIS and Row Level Security (RLS) policies.
*   **Visual:** C4 Container Diagram and cloud deployment topology (Vercel CDN + Render).

### Slide 6: Key Software Modules
*   **Title:** Software Innovation and Core App Engines.
*   **1. Predictive Matchmaking:** Elo rating + Haversine distance algorithm.
*   **2. PostGIS Booking:** Court search over interactive Leaflet map with marker caching optimizations.
*   **3. FitCoins Economy:** Virtual wallet integrated with Stripe for split billing.
*   **4. Sporty Conversational Assistant:** Gemini 2.5 Flash on backend with native Speech (STT/TTS).

### Slide 7: Software Quality Control (QA)
*   **Title:** Quality Assurance and Automated Testing.
*   **QA Metrics:** **541 automated tests passing with 100% success rate** (205 frontend unit tests and 336 backend Jest/Playwright tests).
*   **Code Audit:** SonarQube Quality Gate: **PASSED (0 vulnerabilities).**
*   **Visual:** Code coverage graph and console capture executing tests.

### Slide 8: Financial Viability and Return
*   **Title:** 3-Year Financial Projections.
*   **Monetization:** 5% commission on court bookings, premium subscriptions, and advertising.
*   **Key Indicators:** NPV of S/. 84,250.00 PEN and IRR of 38.4%. Investment recovery (Payback) in 14 months.

### Slide 9: Conclusions and Recommendations
*   **Title:** Capstone Defense Closing.
*   **Conclusions:** 7 conclusions mapped to thesis objectives.
*   **Recommendations:** Edge model maturity and B2B booking expansion to provinces.
