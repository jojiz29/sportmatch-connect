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

### STATE-OF-THE-ART ANTECEDENTS
*   **Playtomic (Spain):** A global booking platform for padel and tennis that integrates social features, but lacks a multi-variable predictive matchmaking engine and financial gamification adapted to the Latin American region.
*   **Nidux & CourtSide (Peru):** Local systems focused on static transactional booking for sports centers, but completely isolated from social interaction or community features and lacking conversational AI assistance.
*   **Informal Methods (WhatsApp + Yape/Plin):** The predominant local method, inefficient for skill leveling, consolidated sports profiles, and debt collection.

### DETAILED DESCRIPTION OF THE PROPOSAL (Minimum 250 words)
SportMatch Connect is a distributed, multi-layer software solution designed to unify the amateur sports ecosystem. Its decoupled architecture consists of:
1.  **Frontend PWA:** Built in **React 19** and **TypeScript**, structured under the **Feature-Sliced Design (FSD)** pattern for high scalability.
2.  **Backend Modular:** Developed as a modular monolith in **NestJS 11** with **Prisma ORM**, deployed redundantly on the cloud.
3.  **Secure Persistence:** Hosted on **Supabase (PostgreSQL 15)** integrating **PostGIS** spatial indexing for radial geolocation queries, protected by 78 **Row Level Security (RLS)** policies that restrict data access at the database level using JWT claims.

The system implements four main functional engines:
*   **Predictive Matchmaking:** Uses a weighted linear algorithm combining espherical distance (Haversine formula), sports affinity, Elo skill rating, and a trust score to connect compatible players.
*   **Geolocated Booking:** An interactive map based on Leaflet and PostGIS that links users to the real-time availability of 433 sports centers in Lima Metropolitana.
*   **Gamified Economy:** A transactional incentive system based on the *FitCoins* virtual currency, securely integrated with the **Stripe** payment gateway for split bookings.
*   **Multimodal Assistant "Sporty":** Powered by **Google Cloud Vertex AI (Gemini 2.5 Flash)** in the backend, providing bi-directional speech processing (STT/TTS) and real-time edge content moderation with **TensorFlow.js (NSFWJS)**.

### APPLIED METHODOLOGY
We applied an agile software development methodology based on **Scrum** across 8 bi-weekly sprints. User stories were written under the Gherkin standard (Given/When/Then) and Git branching followed an extended GitFlow convention. Quality assurance combined unit tests in **Vitest** and end-to-end (E2E) tests in **Playwright**, integrated in a continuous integration/delivery (CI/CD) pipeline on GitHub Actions, achieving 100% success rate across 541 regression tests and passing the **SonarQube Quality Gate** with 0 vulnerabilities.

---

## 💾 4. ADMINISTRATIVE ASPECTS OF THE PROPOSAL

*   **SOURCE CODE ORIGIN:** The development is entirely owned by the research team, basing its layered infrastructure on MIT-licensed open-source frameworks (React 19, NestJS 11, Prisma ORM, Leaflet, and PostgreSQL).
*   **DISCLOSURES DESCRIPTION:** The source code is hosted and versioned on a public GitHub repository (`github.com/jojiz29/sportmatch-connect`) and the web client is deployed to production via Vercel's global CDN (`https://sportmatch-connect.vercel.app`).
